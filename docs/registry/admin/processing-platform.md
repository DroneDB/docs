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

## Feature Gating

Administrators can restrict which heavy tools are available, to whom, and on which organizations, without touching code or redeploying tool assemblies. Gating is purely configuration-driven and layers on top of the existing per-tool `RequiredAccess` (Read/Write) check - it never widens access, only narrows it.

### Configuration

Gating rules are bound from `AppSettings:ProcessingPlatform:Tools`, a dictionary keyed by tool id (e.g. `build`, `photogrammetry`, `bulk-download`). Tools not listed use the defaults below (fully enabled, unrestricted):

| Setting | Type | Default | Description |
|---------|------|---------|--------------|
| `Availability` | `Enabled` \| `Disabled` \| `Hidden` | `Enabled` | Global switch for the tool. |
| `DisabledMessage` | string | `null` | Tooltip shown in the UI and returned in the `403` body when the tool is blocked. Ignored when `Hidden`. |
| `AllowedRoles` | string[] | `[]` (empty = all) | Allowlist of roles permitted to use the tool. The special value `"admin"` maps to the system administrator role; any other value is checked via the normal role membership. |
| `AllowedOrgs` | string[] | `[]` (empty = all) | Allowlist of organization slugs permitted to use the tool. |
| `HideWhenNotAllowed` | bool | `true` | When a caller fails the role or org allowlist: `true` hides the tool entirely, `false` shows it disabled with `DisabledMessage`. |
| `MaxConcurrentPerUser` | int | `0` (inherit) | Per-tool override of the global `MaxConcurrentTasksPerUser`. `0` means "use the global limit". |
| `MaxQueuedPerUser` | int | `0` (inherit) | Per-tool override of the global `MaxQueuedTasksPerUser`. `0` means "use the global limit". |

### Availability states

- **Enabled** - fully available (still subject to the role/org allowlists below).
- **Disabled** - shown in the UI greyed out with `DisabledMessage` as a tooltip; submitting is rejected with `403`.
- **Hidden** - not shown in the UI at all; submitting is rejected with `403`.

### Evaluation order

For each request, the effective state of a tool is computed in this order (first match wins):

1. `Availability: Hidden` -> tool is hidden.
2. `Availability: Disabled` -> tool is disabled with `DisabledMessage`.
3. `AllowedRoles` is non-empty and the caller has none of the listed roles -> denied by allowlist.
4. `AllowedOrgs` is non-empty, an organization context is available, and it isn't in the list -> denied by allowlist.
5. Otherwise -> tool is fully enabled.

A denial by allowlist (steps 3-4) becomes **Hidden** or **Disabled** depending on `HideWhenNotAllowed`. The organization allowlist (step 4) is only evaluated in an org-scoped context (see below); the global features endpoint has no organization to check against and skips it.

### Example configuration

```json
{
  "AppSettings": {
    "ProcessingPlatform": {
      "Tools": {
        "photogrammetry": {
          "Availability": "Disabled",
          "DisabledMessage": "Photogrammetry processing is temporarily disabled for maintenance."
        },
        "import-dataset": {
          "Availability": "Enabled",
          "AllowedRoles": ["admin"],
          "HideWhenNotAllowed": true
        },
        "bulk-download": {
          "AllowedOrgs": ["default", "trusted-partner"],
          "HideWhenNotAllowed": false,
          "DisabledMessage": "Bulk download is limited to approved organizations."
        }
      }
    }
  }
}
```

### Where gating is surfaced

| Endpoint | Organization context | Effect |
|----------|----------------------|--------|
| `GET /sys/features` | None (global) | `taskTools[]` includes `hidden`, `disabled`, `disabledMessage` per tool, computed without the org allowlist. |
| `GET /orgs/{orgSlug}/ds/{dsSlug}/tasks/tools` | Yes | Same three fields, now also evaluating the org allowlist for `orgSlug`. |
| `POST /orgs/{orgSlug}/ds/{dsSlug}/tasks` | Yes | Server-side enforcement: a `Hidden` or `Disabled` tool is rejected with `403` and `DisabledMessage` (or a default message), regardless of what the client sends. |

The UI reads `hidden`/`disabled`/`disabledMessage` to hide the tool or grey it out with a tooltip, but the `403` enforcement at submit time is authoritative - gating cannot be bypassed by calling the API directly.

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

---

### `import-file`

Downloads a single file from an `http`/`https` URL into the dataset. The file is streamed through an SSRF-hardened, budget-guarded downloader, then indexed with `AddRaw` and enqueued for derivative builds when applicable.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "url": "https://example.com/data/orthophoto.tif",
  "fileName": "orthophoto.tif",
  "folder": "imports",
  "overwrite": false,
  "username": null,
  "password": null,
  "sizeBytes": null
}
```

`url` and `fileName` are required. `password` must be an encrypted credential if provided.

---

### `import-dataset`

Populates a freshly created (empty) dataset from a remote source. Supported source types depend on server configuration; commonly `registry` (another Registry instance) and `archive-url`.

| Field | Value |
|-------|-------|
| Required access | Write |
| Produces artifact | No |

**Parameters:**
```json
{
  "sourceType": "registry",
  "budgetBytes": null,
  "params": {
    "sourceUrl": "https://source-registry.example.com",
    "orgSlug": "source-org",
    "dsSlug": "source-dataset",
    "token": "auth-token"
  }
}
```

`sourceType` and `params` are required. The contents of `params` are source-specific.

## Admin Dashboard

Administrators can view tasks across all users and datasets:

```
GET /sys/tasks?toolId=&state=&userId=&skip=0&take=50
```

Per-task actions (get status, download log, cancel) use the standard per-dataset endpoints above, which already authorize admins.
