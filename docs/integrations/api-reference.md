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
| GET | `/orgs/{orgSlug}/ds` | List all datasets in organization |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}` | Get dataset entries |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/ex` | Get extended dataset info |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/stamp` | Get dataset checksum and metadata |
| POST | `/orgs/{orgSlug}/ds` | Create dataset |
| PUT | `/orgs/{orgSlug}/ds/{dsSlug}` | Update dataset |
| DELETE | `/orgs/{orgSlug}/ds/{dsSlug}` | Delete dataset |
| POST | `/orgs/{orgSlug}/ds/{dsSlug}/rename` | Rename dataset |
| POST | `/orgs/{orgSlug}/ds/{dsSlug}/meta/visibility/set` | Set dataset visibility (`0`=private, `1`=public) |

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
| POST | `.../obj` | Upload object (multipart form) |
| PUT | `.../obj` | Move/rename object |
| DELETE | `.../obj?path=` | Delete object |
| DELETE | `.../obj/batch` | Delete multiple objects |

### Download

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../download?path=` | Download object(s) |
| POST | `.../download` | Download objects (POST version) |
| GET | `.../ddb` | Download DroneDB index file |

### Visualization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../thumb?path=` | Generate thumbnail |
| GET | `.../tiles/{tz}/{tx}/{ty}.png` | Generate map tile |
| GET | `.../build/{hash}/*` | Get build files (COG, COPC, NXS, MVT, 3D Tiles, RAD) |

### Build Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../build` | Start build job for object |
| GET | `.../builds` | List build jobs (paginated) |
| POST | `.../builds/clear` | Clear completed build jobs |

### Pending builds and retries

Missing companion files defer a native build and create or refresh a `.pending` marker. Registry's pending coordinator enqueues an indexed entry job when at least **60 seconds** have elapsed since its last attempt, provided that path has no active build job. The coordinator reports enqueue/skip counts; the pending tool's `Pending build check complete` message also covers fallback and no-op checks.

The native build lock remains authoritative for output ownership. Coordinators for the same organization and dataset use shared coordination in the configured Hangfire storage, acquiring it before reading pending entries and active jobs and holding it through synchronous enqueue and JobIndex publication. Retry scheduling and sweep state updates use the same coordination. Other datasets proceed independently. A failed enqueue or index publication remains an explicit storage failure and can weaken duplicate suppression.

For an entry already pending, the build retains its marker through preflight and the attempt. It refreshes the timestamp by atomic replacement while preserving dependency hints; if a full disk prevents replacement, the original marker remains. Lock contention leaves the original marker untouched.

| Build outcome | Pending marker and retry behavior |
|---------------|-----------------------------------|
| Missing companion | Deferred success; marker records dependencies and the latest attempt. |
| Low-free-space preflight, an identified no-space-on-device write error, or a supervised idle timeout aborting the primary build | Existing marker retained; the entry job remains failed and visible, and Registry may schedule a bounded retry. |
| Invalid input, a dependency path outside the dataset, missing required tools, or an ordinary unexplained nonzero tool exit | Permanent failure; marker consumed and the failed entry job remains visible without an automatic pending retry. |
| Successful build or already-complete output | Marker consumed. |

An arbitrary fresh build failure does not create a pending marker. A failed per-entry job triggers the pending retry scheduler only if **that job's path and hash** still match a native pending entry; a different pending entry in the dataset is insufficient. Failures confined to optional Model tiles after Nexus succeeds remain best-effort tiles failures.

Delayed coordinators keep the existing delays of **1, 2, 5, 10, 20, 40, then 60 minutes**, with a maximum of **12 scheduled retries per recovery epoch**. A live coordinator is preserved. After the chain is missing, terminal, or exhausted, the low-frequency sweep may restart one bounded epoch even when the dataset checksum is unchanged. Observed pending status and checksum updates preserve the live retry budget and coordinator ID; controls clear when native pending work disappears. Missing or malformed state and unavailable stamp data permit a bounded recovery check.

Retry controls are stored in the configured Hangfire storage, so separate hosts share one coordinator ID and attempt budget even when each uses a local observation cache. Legacy cached controls are imported once; dataset cache invalidation does not erase the shared retry chain.

For Gaussian Splat builds, `DDB_BUILDLOD_IDLE_TIMEOUT_SECONDS` sets the build-lod idle deadline to an integer from **1 to 86400 seconds**. The default remains **3600 seconds**. Invalid values fail before the runner changes its output files.

### Native build API compatibility

`DDBBuild`, `DDBIsBuildComplete`, and the C/PInvoke build signatures remain unchanged, as do serialized Hangfire wrapper signatures and pending-info JSON keys (`hash`, `path`, `missingDependencies`, `lastAttempt`). Completeness checks remain read-only, with the narrow [interrupted Model tiles-swap exception](/docs/features/3d-tiles#output-and-interrupted-build-recovery).

Direct C++ `ddb::obj2tiles::runObj2Tiles` calls now require an absent or empty destination; intentional replacements use the higher-level builder's staging/swap. `ddb::process::Result` adds `descendantsTerminated`, reported by `describe()` and runner logs when drain-grace cleanup terminates remaining descendants. A successful direct-child exit stays successful; `timedOut` remains an idle-timeout signal. This changes the exported C++ result layout, so rebuild native C++ consumers together with libddb.

## Tasks (Processing Platform)

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}/tasks`

See the [Processing Platform](/docs/registry/admin/processing-platform) page for full documentation, tool reference, and examples.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../tasks/tools` | List available tools with JSON Schema |
| POST | `.../tasks` | Submit a new task (202) or get dedup hit (200) |
| GET | `.../tasks` | List tasks (`?toolId=&state=&skip=0&take=50`) |
| POST | `.../tasks/clear` | Delete all terminal tasks (`?toolId=` optional filter) |
| GET | `.../tasks/{id}` | Get full task status, progress, log tail, artifact |
| GET | `.../tasks/{id}/log` | Incremental log (`?since={cursor}`) |
| GET | `.../tasks/{id}/result` | Download task artifact (range requests supported) |
| DELETE | `.../tasks/{id}` | Cancel or mark task as Deleted |

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
| GET | `/sys/build-pending-status` | Get background build job status |
| GET | `/sys/tasks` | List tasks across all users and datasets *(admin only)* (`?toolId=&state=&userId=&skip=0&take=50`) |
| POST | `/sys/import-dataset` | Import dataset from another Registry |
| POST | `/sys/import-organization` | Import organization from another Registry |
| POST | `/sys/move-datasets` | Move datasets between organizations *(admin, enforced server-side)* |
| POST | `/sys/merge-organizations` | Merge one organization into another *(admin, enforced server-side)* |
| POST | `/sys/cleanupbatches` | Purge expired or orphaned upload batches |
| POST | `/sys/cleanupdatasets` | Remove empty dataset records |
| POST | `/sys/migratevisibility` | Migrate dataset visibility from legacy format |
| POST | `/sys/cleanup-jobindices` | Purge old job index records (optional `?retentionDays=N`) |
| POST | `/sys/cleanup` | Run DroneDB `cleanup` on every dataset *(admin only, async)* |
| POST | `/sys/check-artifact-completeness` | Scan all datasets and enqueue rebuilds for incomplete build artifacts *(admin only, async)* |

### `GET /sys/features` response fields

This endpoint is available without authentication and is used by the Hub frontend to discover platform capabilities.

| Field | Type | Description |
|-------|------|-------------|
| `organizationMemberManagement` | `bool` | Whether org-level member management is enabled |
| `userManagement` | `bool` | Whether local user management is enabled (false when external auth is configured) |
| `storageLimiter` | `bool` | Whether per-user storage limiting is enabled |
| `maxConcurrentDownloadsPerUser` | `int?` | Concurrent download limit per user (`null` = unlimited) |
| `disableAnonymousBulkDownloads` | `bool` | Whether anonymous bulk archive downloads are blocked |
| `passwordPolicy` | `object?` | Active password complexity policy, or `null` |
| `datasetThumbnailCandidates` | `string[]` | Ordered list of dataset thumbnail file name candidates |
| `maxExportSizeBytes` | `long?` | Maximum raster export size in bytes (`null` = unlimited) |
| `bulkDownloadAsyncThresholdBytes` | `long` | Selection size threshold above which bulk downloads are routed to the async task |
| `taskTools` | `array` | Catalog of available task tools (id, version, title, required access, artifact flag, extension) |
| `taskStates` | `array` | Task state machine with `{state, isTerminal}` per entry |
| `hubOptions` | `object?` | Hub UI branding and feature flags |
| `hubVersion` | `string?` | Semver of the Hub (Vue SPA) currently deployed |
| `registryVersion` | `string?` | Registry backend assembly version |
| `ddbVersion` | `string?` | Native DroneDB library version |

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `/version` | Application version (no auth) |
| `/quickhealth` | Basic health check (requires auth) |
| `/health` | Full health check (requires auth) |

## Error Responses

API errors return JSON with the following structure:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
