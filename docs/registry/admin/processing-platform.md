---
sidebar_position: 9
sidebar_label: Processing Platform
---

# Processing Platform

The Processing Platform is an asynchronous task substrate for running CPU- and I/O-intensive operations on datasets. Tasks are queued via Hangfire, executed off the HTTP thread, and tracked in a persistent job index.

## Concepts

- **Tool** - a named, versioned operation (e.g. `raster-export`, `bulk-download`). Each tool declares required permissions, whether it produces a downloadable artifact, and a JSON Schema for its input parameters.
- **Task** - a single execution of a tool on a dataset. Identified by a UUID `taskId`.
- **Artifact** - the optional downloadable result of a task (e.g. a `.tif` or `.zip` file). Artifacts are stored in a work directory and automatically deleted after `ProcessingPlatform:ArtifactTtlHours` hours.
- **Deduplication** - if a task with the same tool, version, and parameters is submitted within the `DedupLookbackHours` window, the server returns the existing task (`HTTP 200`) instead of creating a new one (`HTTP 202`).

## Task States

```
Created → Enqueued → Scheduled → Processing → Succeeded
                                             → Failed
                                             → Deleted
```

**Active states:** `Created`, `Enqueued`, `Scheduled`, `Processing`
**Terminal states:** `Succeeded`, `Failed`, `Deleted`

The authoritative list of states and their terminal flag is available at `GET /sys/features` in the `taskStates` field.

## REST API

All task endpoints live under:

```
/orgs/{orgSlug}/ds/{dsSlug}/tasks
```

### List available tools

```
GET /orgs/{orgSlug}/ds/{dsSlug}/tasks/tools
```

Returns an array of tool descriptors with id, version, title, required access level, artifact flag, and JSON Schema.

### Submit a task

```
POST /orgs/{orgSlug}/ds/{dsSlug}/tasks
Content-Type: application/json

{
  "toolId": "raster-export",
  "version": "1",
  "path": "orthophoto.tif",
  "params": { "formula": "NDVI", "colormap": "rdylgn" },
  "force": false
}
```

**Responses:**
- `202 Accepted` - new task created. `Location` header points to the status endpoint.
- `200 OK` with `deduplicated: true` - an existing matching task was found and returned.
- `400 Bad Request` - unknown tool, invalid parameters, or path traversal.
- `413 / 429` - quota exceeded (output too large or concurrency limit reached).

**Response body:**
```json
{
  "taskId": "abc123",
  "toolId": "raster-export",
  "version": "1",
  "deduplicated": false,
  "statusUrl": "/orgs/myorg/ds/myds/tasks/abc123",
  "resultUrl": "/orgs/myorg/ds/myds/tasks/abc123/result",
  "estimatedOutputBytes": 52428800
}
```

### List tasks for a dataset

```
GET /orgs/{orgSlug}/ds/{dsSlug}/tasks?toolId=&state=&skip=0&take=50
```

Query parameters `toolId` and `state` are optional filters. `take` is clamped to 200.

### Get task status

```
GET /orgs/{orgSlug}/ds/{dsSlug}/tasks/{taskId}
```

Returns full status including progress, log tail, and artifact descriptor.

**Response body:**
```json
{
  "taskId": "abc123",
  "toolId": "raster-export",
  "version": "1",
  "state": "Processing",
  "progress": { "percent": 42, "phase": "Warping bands" },
  "createdAt": "2026-06-13T10:00:00Z",
  "startedAt": "2026-06-13T10:00:05Z",
  "finishedAt": null,
  "logCursor": 18,
  "logTail": ["[10:00:05] Starting export ...", "..."],
  "artifact": null,
  "error": null
}
```

When the task succeeds:
```json
{
  "state": "Succeeded",
  "artifact": {
    "sizeBytes": 52428800,
    "sha256": "e3b0c44...",
    "resultUrl": "/orgs/myorg/ds/myds/tasks/abc123/result",
    "expiresAt": "2026-06-14T10:00:00Z"
  }
}
```

### Get incremental log

```
GET /orgs/{orgSlug}/ds/{dsSlug}/tasks/{taskId}/log?since=0
```

Returns only lines beyond the given `since` cursor. Use for polling:

```json
{
  "cursor": 25,
  "lines": ["[10:00:10] Band 1/4 done", "..."],
  "truncatedFromTail": 0
}
```

Pass the returned `cursor` as `since` in the next poll to receive only new lines.

### Download artifact

```
GET /orgs/{orgSlug}/ds/{dsSlug}/tasks/{taskId}/result
```

Available only when `state == "Succeeded"` and the tool produces an artifact. Returns the file with `Content-Disposition: attachment`. The response includes an `ETag` header with the artifact SHA-256.

Range requests are supported for resumable downloads.

### Cancel a task

```
DELETE /orgs/{orgSlug}/ds/{dsSlug}/tasks/{taskId}
```

Cancels an active task or marks a terminal task as `Deleted`. Only the task owner or an admin can cancel.

### Clear concluded tasks

```
POST /orgs/{orgSlug}/ds/{dsSlug}/tasks/clear?toolId=
```

Permanently removes all terminal (`Succeeded`/`Failed`/`Deleted`) tasks for the dataset from the history and purges their artifacts. The optional `toolId` query parameter limits clearing to a specific tool.

## Available Tools

### `build`

Triggers the derivative build for a dataset entry (COG, COPC, NXS, vector tiles). Equivalent to `POST .../build` but tracked asynchronously.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "path": "orthophoto.tif",
  "force": false
}
```

Both parameters are optional. Omitting `path` builds all pending entries.

---

### `raster-export`

Exports a raster entry as a GeoTIFF with visualization parameters applied (preset, band selection, spectral index formula, colormap, rescale). Uses block-windowed processing so peak memory is bounded.

| Field | Value |
|-------|-------|
| Required access | Read |
| Produces artifact | Yes (`.tif`) |

**Parameters:**
```json
{
  "path": "orthophoto.tif",
  "preset": null,
  "bands": null,
  "formula": "NDVI",
  "bandFilter": null,
  "colormap": "rdylgn",
  "rescale": "-1,1",
  "fileName": null
}
```

`path` is required. All other parameters are optional.

---

### `bulk-download`

Packages a selection of dataset entries (or the entire dataset) into a ZIP archive. For small authenticated selections the direct streaming path is used instead; whole-dataset downloads always use this async tool.

| Field | Value |
|-------|-------|
| Required access | Read |
| Produces artifact | Yes (`.zip`) |

**Parameters:**
```json
{
  "paths": ["images/DJI_0001.JPG", "images/DJI_0002.JPG"],
  "archiveName": "my-selection.zip"
}
```

Omit `paths` (or set to `null`) to archive the entire dataset including the `.ddb` folder. `archiveName` is optional.

---

### `align-raster`

Aligns a source GeoTIFF to a reference GeoTIFF using phase-correlation + NCC, correcting georeferencing offset. The output is indexed back into the dataset as a new COG. A separate `build` task is required if you want to generate tiles for the output.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "sourcePath": "survey-2025.tif",
  "referencePath": "reference-2024.tif",
  "outputPath": "survey-2025-aligned.tif",
  "mode": "similarity"
}
```

`sourcePath`, `referencePath`, and `outputPath` are required. `mode` is `"similarity"` (4-DOF, default) or `"translation"` (2-DOF, faster).

---

### `archive-extract`

Extracts a compressed archive (ZIP, TAR, etc.) stored in the dataset. Each extracted file is added to the dataset index individually, exactly as if it had been uploaded directly.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "sourcePath": "uploads/batch.zip",
  "destPath": "extracted/",
  "deleteArchive": false,
  "overwrite": false
}
```

`sourcePath` is required. `destPath` defaults to the dataset root. Set `deleteArchive: true` to remove the archive after successful extraction.

---

### `merge-multispectral`

Merges multiple single-band GeoTIFFs into a single multi-band COG. The output is indexed back into the dataset.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "paths": ["red.tif", "green.tif", "blue.tif", "nir.tif"],
  "outputPath": "merged.tif"
}
```

`paths` must contain at least two entries in band order. `outputPath` is required.

---

### `rescan-index`

Re-processes all indexed entries to refresh metadata (EXIF, geospatial properties, type detection). Useful after a DroneDB version upgrade that adds support for new metadata fields.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "types": "image,geoimage",
  "stopOnError": false
}
```

Both parameters are optional. Omit `types` to rescan all entry types.

## Admin Dashboard

Administrators can view tasks across all users and datasets:

```
GET /sys/tasks?toolId=&state=&userId=&skip=0&take=50
```

Per-task actions (get status, download log, cancel) use the standard per-dataset endpoints above, which already authorize admins.
