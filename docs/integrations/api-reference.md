---
sidebar_position: 4
---

# API Reference

DroneDB Registry exposes a REST API for programmatic access to all features. All endpoints return JSON unless otherwise specified.

:::tip Interactive Documentation
Access the interactive API documentation at `/scalar/v1` on your Registry instance (e.g., [hub.dronedb.app/scalar/v1](https://hub.dronedb.app/scalar/v1)).
:::

## Authentication

Most endpoints require JWT authentication. Obtain a token via the authenticate endpoint:

```bash
POST /users/authenticate
Content-Type: application/json

{
  "userName": "admin",
  "password": "password123"
}
```

Use the token in subsequent requests:

```bash
Authorization: Bearer <token>
```

Tokens can be refreshed before expiration:

```bash
POST /users/authenticate/refresh
Authorization: Bearer <token>
```

## Organizations

**Base Route:** `/orgs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orgs` | List all organizations |
| GET | `/orgs/public` | List public organizations (no auth required) |
| GET | `/orgs/{orgSlug}` | Get organization details |
| POST | `/orgs` | Create organization |
| PUT | `/orgs/{orgSlug}` | Update organization |
| DELETE | `/orgs/{orgSlug}` | Delete organization |

## Datasets

**Base Route:** `/orgs/{orgSlug}/ds`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orgs/{orgSlug}/ds` | List datasets in organization (all of them, or a page: see below) |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}` | Get dataset entries |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/ex` | Get extended dataset info |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/stamp` | Get dataset checksum and metadata |
| POST | `/orgs/{orgSlug}/ds` | Create dataset |
| PUT | `/orgs/{orgSlug}/ds/{dsSlug}` | Update dataset |
| DELETE | `/orgs/{orgSlug}/ds/{dsSlug}` | Delete dataset |
| POST | `/orgs/{orgSlug}/ds/{dsSlug}/rename` | Rename dataset |
| POST | `/orgs/{orgSlug}/ds/{dsSlug}/meta/visibility/set` | Set dataset visibility (`0`=private, `1`=public) |

**Paging the dataset list.** Without query parameters `GET /orgs/{orgSlug}/ds` returns every
dataset, as before. With any of the parameters below it returns one page and the number of
matching datasets in the `X-Total-Count` response header.

| Parameter | Description |
|-----------|-------------|
| `skip`, `take` | Page offset and size (`take` at most 500). |
| `q` | Case-insensitive search in the dataset name, slug and tagline. |
| `sort` | `name` (default), `creationDate`, `entries`, `size` or `visibility`; `desc=true` reverses it. |
| `slugs` | Comma-separated slugs: only these datasets. |
| `includeThumbnailCheck` | Also report whether each dataset of the page has a thumbnail (works without paging too). |

## Objects

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}`

### Listing & Searching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../list?path=` | List objects at path |
| POST | `.../list` | List objects (POST version) |
| POST | `.../search` | Search objects in dataset |
| GET | `.../obj?path=` | Get object info |

### Upload & Modification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../obj` | Upload one or more files, or create a folder (multipart form) |
| GET | `.../obj/uploads/{uploadId}` | Outcome of an upload sent with `X-Upload-Id` |
| POST | `.../obj/chunk` | Store one chunk of a resumable upload |
| GET | `.../obj/chunk/{fileId}` | Chunks of a resumable upload that are stored and missing |
| POST | `.../obj/chunk/{fileId}/commit` | Add a resumable upload whose chunks are all stored |
| PUT | `.../obj` | Move/rename object |
| DELETE | `.../obj?path=` | Delete object |
| DELETE | `.../obj/batch` | Delete multiple objects |

**`POST .../obj`.** Each file part is stored at the `path` field sent before it; a single file
may also send `path` after the file. Without a file part, a folder is created at `path`.
Access, the storage quota (from `Content-Length`) and a `path` sent before its file are
checked before the first byte is stored, so a refused upload fails at once (`401`, `403`,
`404`, `507`) instead of after the transfer.

* One file part: `201` with the entry.
* Several file parts (a bundle, at most 64): `200` with one result per file,
  `[{ "path", "entry", "error", "status" }]`. A file that fails does not fail the others.

**`X-Upload-Id`.** A client may send a unique id with an upload (8 to 64 letters, digits, `-` or `_`). If the response is lost, for example a proxy timeout after the last
byte, ask `GET .../obj/uploads/{uploadId}` before sending the file again:

| Status | Meaning |
|--------|---------|
| `200` | The upload is done (`state: "Done"`, with the results) or failed (`state: "Failed"`, with the error). |
| `202` | The server is still receiving or adding the files. Ask again later. |
| `404` | Unknown id: send the file again. |

Repeating a `POST .../obj` with the id of an upload that is done returns its results
without storing the files again. Receipts are kept for 24 hours.

**Resumable (chunked) uploads.** For files too large for one request, send chunks with
`POST .../obj/chunk`. The form fields `fileId`, `chunkIndex`, `totalChunks`, `totalFileSize`,
`chunkSize` and `path` must come before the `chunk` file part. Chunks may arrive in any order
and may be sent again; each response lists the chunks still missing. After an interruption,
`GET .../obj/chunk/{fileId}` tells which chunks to resend. `POST .../obj/chunk/{fileId}/commit`
adds the file (`201` with the entry; `409` with the missing chunks). Committing again returns
the same entry. Chunks are at most 128 MB, and an upload that is not committed is removed
after 24 hours.

### Download

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../download?path=` | Download object(s) |
| POST | `.../download` | Download objects (POST version) |
| GET | `.../ddb` | Download DroneDB index file |

### Visualization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../thumb?path=` | Generate thumbnail (WebP). `404` when the entry's type has no thumbnail (`entryTypes[].thumbnail` is `none` in `GET /sys/features`) |
| GET | `.../tiles/{tz}/{tx}/{ty}.{png\|webp\|jpg}` | Map tile in the format of the extension (`image/png`, `image/webp`, `image/jpeg`); `{ty}@2x` for retina tiles |
| GET, HEAD | `.../build/{hash}/*`, `.../build/{hash}@{version}/*` | Build files (COG, COPC, bm3d, MVT, 3D Tiles, RAD). `HEAD` sends the headers of `GET` without the body. Range requests are supported. Downloads carry the DroneDB library's media types: COG `image/tiff; application=geotiff; profile=cloud-optimized`, COPC `application/vnd.laszip+copc`, GeoPackage `application/geopackage+sqlite3`. Caching: when the URL names the current `version` of the file's artifact, the response is `Cache-Control: private, max-age=86400, immutable`; otherwise (no version, or one that a rebuild replaced) it is `private, no-cache` with an `ETag`, and a conditional request gets `304` while the file is the same |
| GET | `.../build-artifact?path=&role=` | Download the build artifact of an entry named after it: without `role` the one of its type (COG, COPC, GeoPackage); with `role` the artifact of that role that has a download name (`gsplat.lod` as `<stem>.rad`, `gsplat.spz` and `gsplat.export` as `<stem>.spz`). Range requests are supported. `400` for an entry without a downloadable artifact, `404` for an entry that is not built or, with `role`, has no such artifact: the `gsplat.export` file exists only after the `splat-spz-export` [task](/docs/registry/admin/processing-platform#splat-spz-export) has made it |

Entries in listings and pending builds carry `artifacts: [{role, url, mediaType}]`, the build outputs that exist (the roles are listed in [DroneDB Library](/docs/integrations/library#build-manifest)). A client reads the URL of an artifact from this list and never composes `/build/` paths itself. The URL names the version of the artifact in its path (`.../build/{hash}@{version}/{path}`), so a browser keeps the file, and every range it reads of it, without asking again until a rebuild gives the artifact a new version and the listing a new URL. The files that the index of a directory artifact names by relative URL (the tiles of a 3D Tiles `tileset.json`) resolve to URLs with the same version and are kept the same way. A model lists `model.bm3d` (`bm3d/model.bm3d`, `application/vnd.dronedb.bm3d`); until the background rebuild reaches a model built before DroneDB 2.0, it lists the legacy `model.nexus` (`nxs/model.nxz`) instead, which the library reports with `legacy: true` and `fallbackFor: "model.bm3d"` and lists only while `model.bm3d` is missing. `model.3dtiles` is listed beside either.

### Build Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../build` | Start build job for object |
| GET | `.../builds` | List build jobs (paginated) |
| POST | `.../builds/clear` | Clear completed build jobs |

### Pending builds and retries

Missing companion files (an `.obj` without its `.mtl` or a texture, a `.shp` without its `.shx` or `.dbf`) defer a native build and create or refresh a `.pending` marker that lists them. Such a build **waits for files**: no timer retries it, and a dataset whose pending builds all wait for files gets no pending coordinator. When a file with the name of a missing file (in any folder, ignoring case) arrives in the dataset, the DroneDB library releases the build, which is then due at once, and Registry starts the pending coordinator of the dataset right away. Every path that adds or moves entries does this: uploads, the files of a task, push, move, copy and transfer. A copied or transferred pending build is released when the destination already has such a file. The build therefore runs as soon as the missing file is uploaded, without a wait. The low-frequency sweep ([`ProcessPendingBuildsCron`](/docs/registry/admin/configuration#processpendingbuildscron)) starts the coordinator for a file that arrives another way.

`GET .../builds/pending` lists the pending builds of a dataset. `awaitingFiles` is `true` for a build that waits for the files in its `missingDependencies`, and `false` for a build that Registry retries.

In a file listing, an entry whose build is pending has `buildStatus: "pending"`, `buildMissingDependencies` and `buildAwaitingFiles`, the same flag as `awaitingFiles`, which the DroneDB library reports. A client reads the flag and does not derive it from the missing files.

Registry's pending coordinator enqueues an indexed entry job for each pending build that does not wait for files, when the `retryAfter` time the DroneDB library reports for the entry has passed (its last attempt + **60 seconds**; a released build is due at once; Registry keeps no copy of the backoff), provided that path has no active build job. The coordinator reports enqueue/skip counts and the builds that wait for files; the pending tool's `Pending build check complete` message also covers fallback and no-op checks.

The native build lock remains authoritative for output ownership. Coordinators for the same organization and dataset use shared coordination in the configured Hangfire storage, acquiring it before reading pending entries and active jobs and holding it through synchronous enqueue and JobIndex publication. Retry scheduling and sweep state updates use the same coordination. Other datasets proceed independently. A failed enqueue or index publication remains an explicit storage failure and can weaken duplicate suppression.

For an entry already pending, the build retains its marker through preflight and the attempt. It refreshes the timestamp by atomic replacement while preserving dependency hints; if a full disk prevents replacement, the original marker remains. Lock contention leaves the original marker untouched.

| Build outcome | Pending marker and retry behavior |
|---------------|-----------------------------------|
| Missing companion | Deferred success; marker records the missing files and the latest attempt. No automatic retry: the arrival of one of the missing files releases the build and starts it at once. |
| Low-free-space preflight, an identified no-space-on-device write error, or a supervised idle timeout aborting the primary build | Existing marker retained; the entry job remains failed and visible, and Registry may schedule a bounded retry. |
| Invalid input, a dependency path outside the dataset, missing required tools, or an ordinary unexplained nonzero tool exit | Permanent failure; marker consumed and the failed entry job remains visible without an automatic pending retry. |
| Successful build or already-complete output | Marker consumed. |

An arbitrary fresh build failure does not create a pending marker. A failed per-entry job triggers the pending retry scheduler only if **that job's path and hash** still match a native pending entry; a different pending entry in the dataset is insufficient. Failures confined to optional Model tiles after the bm3d build succeeds remain best-effort tiles failures.

A build that failed for a temporary reason (the rows with a retained marker above) is still retried automatically. Delayed coordinators keep the existing delays of **1, 2, 5, 10, 20, 40, then 60 minutes**, with a maximum of **12 scheduled retries per recovery epoch**; a build that waits for files does not use this budget, and is not reported as given up when the budget ends. A live coordinator is preserved. After the chain is missing, terminal, or exhausted, the low-frequency sweep may restart one bounded epoch even when the dataset checksum is unchanged. Observed pending status and checksum updates preserve the live retry budget and coordinator ID; controls clear when native pending work disappears. Missing or malformed state and unavailable stamp data permit a bounded recovery check.

Retry controls are stored in the configured Hangfire storage, so separate hosts share one coordinator ID and attempt budget even when each uses a local observation cache. Legacy cached controls are imported once; dataset cache invalidation does not erase the shared retry chain.

For Gaussian Splat builds, the build-lod idle deadline grows with the number of splats: **8 minutes per million splats**, at least **3600 seconds** and at most **86400 seconds** (see [Gaussian Splats](/docs/features/gaussian-splat#build-lod-is-required)). `DDB_BUILDLOD_IDLE_TIMEOUT_SECONDS` replaces it with an integer from **1 to 86400 seconds**. Invalid values fail before the runner changes its output files.

### Native build API compatibility

`DDBBuild`, `DDBIsBuildComplete`, and the C/PInvoke build signatures remain unchanged (DroneDB 2.0 adds `DDBBuildEx`, which takes `{"threads": N}`; see [DroneDB Library](/docs/integrations/library#builds)), as do serialized Hangfire wrapper signatures and pending-info JSON keys (`hash`, `path`, `missingDependencies`, `lastAttempt`; DroneDB 2.0 adds `retryAfter` and `awaitingFiles`). Completeness checks remain read-only, with the narrow [interrupted Model tiles-swap exception](/docs/features/3d-tiles#output-and-interrupted-build-recovery).

The DroneDB library 2.0 exports only its C API (`ddb.h`): its C++ classes and functions are internal and not available to consumers. See [DroneDB Library](/docs/integrations/library).

### CAD drawings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../cad/crs` | Set the coordinate system of a `.dxf` or `.dwg` drawing (form fields `path`, `crs`): writes the drawing's `.prj` and returns its entry. `crs` is an EPSG code (`EPSG:32632`), WKT or PROJ string, or `local` to keep the drawing in its own coordinates. `400` for another file type or an invalid coordinate system. |

## Tasks (Processing Platform)

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}/tasks`

See the [Processing Platform](/docs/registry/admin/processing-platform) page for full documentation, tool reference, and examples.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../tasks/tools` | List available tools with JSON Schema |
| POST | `.../tasks` | Submit a new task (202) or get dedup hit (200) |
| GET | `.../tasks` | List tasks (`?toolId=&state=&skip=0&take=50`). Sends an `ETag`; `If-None-Match` with it returns `304` while the list is unchanged |
| GET | `.../tasks/events` | Server-sent events (`text/event-stream`): a `tasks` event whenever the dataset's task list changes, and a comment every 25 s to keep the connection open |
| POST | `.../tasks/clear` | Delete all terminal tasks (`?toolId=` optional filter) |
| GET | `.../tasks/{id}` | Get full task status, progress, log tail, artifact |
| GET | `.../tasks/{id}/log` | Incremental log (`?since={cursor}`) |
| GET | `.../tasks/{id}/result` | Download task artifact (range requests supported) |
| DELETE | `.../tasks/{id}` | Cancel or mark task as Deleted |

A submit body is `{"toolId", "path", "params", "force"}`; the response is `202` with `{taskId, statusUrl, resultUrl}`. The Gaussian splat tools take their entry in `path`:

| Tool | `path` | `params` | Result |
|------|--------|----------|--------|
| `splat-spz-export` | The built splat (required) | none | No file of its own; when the task has succeeded, `GET .../build-artifact?path=<splat>&role=gsplat.export` |
| `splat-training-export` | The folder of an ODM project (empty for the root) | `maxImageSize` (0 to 1048576), `maxPoints` (0 to 10000000), `fileName`, all optional | `GET .../tasks/{id}/result`, a ZIP; the warnings are `Warning: ...` lines of the log |

Both need read access and are listed in `taskTools` of `GET /sys/features`; see [Processing Platform](/docs/registry/admin/processing-platform#splat-spz-export).

## Share

**Base Route:** `/share`

The Share API enables file uploads via the DroneDB CLI (`ddb share`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/share/init` | Initialize share session |
| GET | `/share/{token}` | Get share batch info |
| POST | `/share/{token}/upload` | Upload file to share |
| POST | `/share/{token}/upload/chunked` | Upload large file in chunks |
| POST | `/share/{token}/commit` | Finalize share |
| POST | `/share/{token}/rollback` | Cancel share |

**`POST /share/init` body fields:**

| Field | Type | Description |
|-------|------|-------------|
| `tag` | `string` | Full `org/dataset` tag for the destination dataset (optional). |
| `orgSlug` | `string` | Destination organization slug. When `tag` is omitted, the dataset slug is auto-generated. |
| `datasetName` | `string` | Human-readable dataset name (optional). |

## Push

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}/push`

The Push API enables syncing local datasets to Registry via the DroneDB CLI (`ddb push`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../push/init` | Initialize push operation |
| POST | `.../push/upload` | Upload file during push |
| POST | `.../push/meta` | Upload metadata |
| POST | `.../push/commit` | Finalize push |

* `init` takes the form fields `checksum` (checksum of the client's last synced stamp) and `stamp` (the client's stamp, any size). It computes the delta once, returns the files to upload and a `token`. When the dataset changed since the client's last sync, it answers `pullRequired: true`.
* `upload` takes a streamed `multipart/form-data` body with the fields `path` and `token` and one file part, in any order. The file is written once, to the dataset volume. When the request has a `Content-Length`, the storage quota is checked before the file is written.
* `meta` takes the fields `token` and `meta` (a metadata dump).
* `commit` applies the delta computed by `init`, if the dataset did not change in the meantime (otherwise it fails: push again). Each uploaded file must match the hash declared in the stamp; a mismatch fails the commit before the dataset changes. The files are moved into the dataset, not copied.

A host that verifies the uploaded bytes itself can skip the hash check with the environment variable `DDB_VERIFY_PUSH_HASHES=0` (it applies to `DDBApplyDelta`).

## Metadata

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}/meta`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../meta/list` | List all metadata keys |
| GET | `.../meta/{key}` | Get metadata values by key |
| POST | `.../meta/{key}` | Add metadata entry |
| POST | `.../meta/{key}/set` | Set/replace metadata |
| DELETE | `.../meta/{key}` | Remove all metadata with key |
| DELETE | `.../meta/{id}` | Remove specific metadata entry |
| POST | `.../meta/dump` | Export all metadata |

A key ending in `s` names a list, written with `POST .../meta/{key}` (add); any other key holds one value, written with `.../set`. Using the wrong one answers `400` with the rule. `GET .../meta/{key}` for a key nobody wrote answers `404`.

## Users

**Base Route:** `/users`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/authenticate` | Login (returns JWT) |
| POST | `/users/authenticate/refresh` | Refresh JWT token |

### User Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/detailed` | List users with extended info |
| POST | `/users` | Create user |
| PUT | `/users/{userName}` | Update user |
| DELETE | `/users` | Delete user (form body: `UserName`, optional `Successor`, `ConflictResolution`) |

### Password Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/changepwd` | Change current user password |
| PUT | `/users/{userName}/changepwd` | Change user password (admin) |

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/roles` | List all roles |
| POST | `/users/roles/{roleName}` | Create role (admin) |
| DELETE | `/users/roles/{roleName}` | Delete role (admin) |

### Storage & Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/storage` | Get current user storage info |
| GET | `/users/{userName}/storage` | Get user storage info (admin) |
| GET | `/users/{userName}/meta` | Get user metadata |
| POST | `/users/{userName}/meta` | Set user metadata (admin) |

### Preferences

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/preferences` | Get the Hub preferences of the current user, one property per section |
| PATCH | `/users/preferences` | Set the sections in the body and keep the others; a section set to `null` is deleted. The `notifications` section is checked: its only field is `builds`, with `none`, `all` or `failed` (see [Build notifications](../registry/admin/email#build-notifications)) |
| GET | `/users/notifications/status` | Whether the current user can get notification e-mails: `{canReceiveEmail, reason}`, `reason` is `emailDisabled`, `noAddress` or `null` |

### Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/{userName}/orgs` | Get user's organizations |
| PUT | `/users/{userName}/orgs` | Set user's organizations (admin) |

## STAC

The STAC (SpatioTemporal Asset Catalog) API provides standardized access to public datasets.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stac` | Root STAC Catalog |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/stac` | Dataset STAC Collection |

Browse STAC catalogs with tools like [STAC Browser](https://radiantearth.github.io/stac-browser/).

## System

**Base Route:** `/sys`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sys/version` | Get Registry version |
| GET | `/sys/features` | Get active feature flags and platform catalog (no auth required) |
| POST | `/sys/upload-probe` | Upload self-test: reads and discards the body (at most 16 MB) and returns `{ bytes, serverMs }`. Any signed-in user, 28 requests per minute |
| GET | `/sys/build-pending-status` | Get background build job status |
| GET | `/sys/tasks` | List tasks across all users and datasets *(admin only)* (`?toolId=&state=&userId=&skip=0&take=50`) |
| POST | `/sys/import-dataset` | Queue the import of a dataset from another Registry: `202 {jobId, statusUrl}` (see [Import & Export](/docs/registry/import-export)) *(admin only)* |
| POST | `/sys/import-organization` | Queue the import of an organization from another Registry: `202 {jobId, statusUrl}` *(admin only)* |
| GET | `/sys/imports/{jobId}` | State and result of an import job: `{jobId, state, result, error}` *(admin only)* |
| DELETE | `/sys/imports/{jobId}` | Cancel an import job (`204`) *(admin only)* |
| POST | `/sys/rescan` | Rescan the entries of given types and extensions in all datasets, one organization or one dataset (one `rescan-index` task per dataset) *(admin only)* |
| POST | `/sys/fix-invalid-slugs` | Rename organizations and datasets whose slug breaks the slug rules; `?dryRun=true` (the default) returns the plan only *(admin only)* |
| POST | `/sys/move-datasets` | Move datasets between organizations *(admin, enforced server-side)* |
| POST | `/sys/merge-organizations` | Merge one organization into another *(admin, enforced server-side)* |
| POST | `/sys/cleanupbatches` | Purge expired or orphaned upload batches |
| POST | `/sys/cleanupdatasets` | Remove empty dataset records |
| POST | `/sys/migratevisibility` | Migrate dataset visibility from legacy format |
| POST | `/sys/cleanup-jobindices` | Purge old job index records (optional `?retentionDays=N`) |
| POST | `/sys/cleanup` | Run DroneDB `cleanup` on every dataset *(admin only, async)* |
| POST | `/sys/check-artifact-completeness` | Scan all datasets and enqueue rebuilds for incomplete build artifacts; models of an older build layout go to the one-worker background `rebuilds` queue *(admin only, async)* |
| POST | `/sys/email/test` | Send a test e-mail with the current SMTP settings, body `{"to": "address"}` *(admin only; see [E-mail](../registry/admin/email#test-the-settings))* |
| GET | `/sys/email/templates` | List the e-mails whose text an administrator can edit (`name`, `title`, `isDefault`) *(admin only; see [Build notifications](../registry/admin/email#api))* |
| GET | `/sys/email/templates/{name}` | The current and the built-in subject and body of a template, and its placeholders *(admin only)* |
| PUT | `/sys/email/templates/{name}` | Check and save the text of a template, body `{"subject", "body"}`; `400` names the problem *(admin only)* |
| DELETE | `/sys/email/templates/{name}` | Go back to the built-in text *(admin only)* |
| POST | `/sys/email/templates/{name}/preview` | Render a text that is not saved with sample builds: `{subject, text, html}` *(admin only)* |
| POST | `/sys/email/templates/{name}/test` | Send a text that is not saved, with sample builds, to the calling administrator *(admin only)* |
| GET | `/sys/update-info` | The last update-check result: installed and latest version, merged release notes, whether they contain security fixes, the licence-request link and the declared use *(admin only; see [Update check](../registry/admin/update-check))* |
| PUT | `/sys/update-check/settings` | Store the declared use and the opt-in contact, body `{"useDeclaration", "contactEmail", "contactConsent"}`; an address needs `contactConsent: true`, an empty one clears it; returns the update info *(admin only)* |

### `GET /sys/features` response fields

This endpoint is available without authentication and is used by the Hub frontend to discover platform capabilities.

| Field | Type | Description |
|-------|------|-------------|
| `organizationMemberManagement` | `bool` | Whether org-level member management is enabled |
| `userManagement` | `bool` | Whether local user management is enabled (false when external auth is configured) |
| `storageLimiter` | `bool` | Whether per-user storage limiting is enabled |
| `maxConcurrentDownloadsPerUser` | `int?` | Concurrent download limit per user (`null` = unlimited) |
| `disableAnonymousBulkDownloads` | `bool` | Whether anonymous bulk archive downloads are blocked |
| `emailEnabled` | `bool` | Whether the server sends e-mail (`AppSettings:Smtp:Enabled`). When `false`, hide or disable what needs e-mail: the server would drop it |
| `updateCheckEnabled` | `bool` | Whether the daily update check runs (`AppSettings:UpdateCheckCron` is not `disabled`). When `false`, the Hub does not ask for update info |
| `instanceHash` | `string` | SHA-256 (lowercase hex) of `ddb-instance-v1:` followed by the lowercase instance ID: lets dronedb.app confirm that a public URL belongs to the deployment that reported it, without publishing the ID |
| `passwordPolicy` | `object?` | Active password complexity policy, or `null` |
| `datasetThumbnailCandidates` | `string[]` | Ordered list of dataset thumbnail file name candidates |
| `maxExportSizeBytes` | `long?` | Maximum raster export size in bytes (`null` = unlimited) |
| `bulkDownloadAsyncThresholdBytes` | `long` | Selection size threshold above which bulk downloads are routed to the async task |
| `taskTools` | `array` | Catalog of available task tools (id, version, title, required access, artifact flag, extension) |
| `taskStates` | `array` | Task state machine with `{state, isTerminal}` per entry |
| `entryTypes` | `array` | The DroneDB library's entry types: `{id, name, buildable, thumbnail, sidecarExtensions, roles}`; `thumbnail` is `none`, `file` (rendered from the file) or `build` (from a build artifact) |
| `archiveExtensions` | `string[]` | Archive suffixes the server extracts: lowercase, without the dot, compound ones first (`tar.gz` before `gz`) |
| `hubOptions` | `object?` | Hub UI branding and feature flags |
| `hubVersion` | `string?` | Semver of the Hub (Vue SPA) currently deployed |
| `registryVersion` | `string?` | Registry backend assembly version |
| `ddbVersion` | `string?` | Native DroneDB library version |

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `/health/live` | Liveness probe for container health checks (no auth) |
| `/version` | Application version (no auth) |
| `/quickhealth` | Basic health check (admin, or the `MonitorToken` as a bearer token or `?token=`) |
| `/health` | Full health check, including the database and the DroneDB library (admin or `MonitorToken`) |

## Error Responses

API errors are RFC 9457 `ProblemDetails`, with the media type `application/problem+json`:

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.4",
  "title": "Forbidden",
  "status": 403,
  "detail": "The current user is not allowed to read this dataset",
  "traceId": "00-...",
  "noRetry": true
}
```

Read the message from `detail`. `noRetry: true` means that repeating the same request will not help. Validation errors of a request body are `ValidationProblemDetails`, with an `errors` object per field and the joined messages in `detail`. Since Registry 3.0 the old `{"error": "..."}` body is gone; a client that also talks to older servers falls back to `error`.

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not signed in, or the credentials are no longer valid)
- `403` - Forbidden (signed in without permission; it was `401` before Registry 3.0). Admin-only endpoints answer "Only administrators can perform this operation"
- `404` - Not Found
- `409` - Conflict
- `413` - Payload Too Large (`noRetry: true`)
- `429` - Too Many Requests (download limit; `Retry-After`)
- `503` - Service Unavailable (temporary: a busy index, a build holding it, the server stopping; `Retry-After`)
- `500` - Internal Server Error

A request whose client disconnects stops its work and gets no answer (logged as `499`).
