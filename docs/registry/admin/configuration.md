---
sidebar_position: 8
sidebar_label: Configuration Reference
---

# Configuration Reference

The configuration file is `appsettings.json`, if not present it will be
created with default values (`appsettings-default.json`).

Settings are validated when Registry starts: an invalid value stops it with every failure
listed (exit code `1`). To check a file without starting Registry, run
`Registry.Web <storage folder> --check` (exit code `0` when the settings are valid; it reads
the environment too and writes nothing). Registry does not rewrite the file when it starts;
only a missing `Secret` or `ThumbnailGeneratorToken` is generated and written.

## Authentication

### AuthCookieName

The name of the authorization cookie.

:::info
The default value is `jwtToken`.
:::

### AuthProvider

The authentication provider, supported values:

 - `Sqlite`: SQLite database
 - `Mysql`: MySQL or MariaDB,
            ([compatibility](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql#supported-database-servers-and-versions))

:::info
The default value is `Sqlite`
:::

The `IdentityConnection` connection string should be changed accordingly.

### Secret

The secret used as key to generate the JWT tokens. Do not use the same secret for multiple applications.

### TokenExpirationInDays

The number of days after which the JWT tokens will expire.

:::info
The default value is `7` days.
:::

### RevokedTokens

The list of revoked JWT tokens.

### ExternalAuthUrl

The URL of the external authentication provider.

:::info
The default value is `null`.
:::

### LdapSettings

LDAP/Active Directory authentication settings. Mutually exclusive with `ExternalAuthUrl`. When `Enabled` is `true`, the following sub-fields are required: `Server`, `BaseDn`, and `SearchFilter`.

:::info
See the [LDAP Authentication](./ldap-authentication) page for a complete guide with examples.
:::

**Sub-fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `Enabled` | `bool` | `false` | Enables LDAP/Active Directory authentication |
| `Server` | `string` | — | LDAP server hostname or IP |
| `Port` | `int` | `636` | LDAP port (389 = plain, 636 = LDAPS) |
| `UseSsl` | `bool` | `true` | Use SSL/TLS (LDAPS) |
| `ValidateSslCertificate` | `bool` | `true` | Validate server SSL certificate chain |
| `BaseDn` | `string` | — | Base DN for directory searches |
| `BindDn` | `string` | `null` | Service account DN for search bind |
| `BindPassword` | `string` | — | Service account password |
| `SearchFilter` | `string` | `(sAMAccountName={0})` | LDAP search filter (`{0}` = escaped username) |
| `UserDnFormat` | `string` | `null` | Optional direct DN format (bypasses search) |
| `AdminGroupDns` | `string[]` | `[]` | LDAP group DNs that map to Registry admin role |
| `EmailAttribute` | `string` | `mail` | LDAP attribute for user email |
| `DisplayNameAttribute` | `string` | `displayName` | LDAP attribute for display name |
| `GroupMembershipAttribute` | `string` | `memberOf` | LDAP attribute for group memberships |
| `Timeout` | `int` | `30` | Timeout in seconds for LDAP operations |

## Database

### Use MySQL / MariaDB instead of SQLite

For production environments with high load, it's recommended to use MySQL or MariaDB. See the [Getting Started guide](/docs/registry/getting-started#use-mysql--mariadb-instead-of-sqlite) for setup instructions.

### RegistryProvider

The Registry database provider, supported values:

 - `Sqlite`: SQLite database
 - `Mysql`: MySQL or MariaDB, ([compatibility](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql#supported-database-servers-and-versions))

:::info
The default value is `Sqlite`
:::

The `RegistryConnection` connection string should be changed accordingly.

### HangfireProvider

The Hangfire provider, supported values:

- `InMemory`: In-memory provider
- `Mysql`: MySQL or MariaDB

:::info
The default value is `InMemory`
:::

The `HangfireConnection` connection string should be changed accordingly.

### MySqlServerVersion

Optional. The MySQL or MariaDB server version Entity Framework targets, for example
`10.6.0-mariadb`. When empty, Registry detects the version once per process. A wrong value
makes Entity Framework write SQL for another server.

:::info
The default value is `null` (detected).
:::

## Storage

### StoragePath

The path to the storage folder.

:::info
The default value is `./data`
:::

### DatasetsPath

The path to the datasets folder.

:::info
The default value is `./datasets`
:::

### TempPath

The path to the temporary files folder.

:::info
The default value is `./temp`
:::

### CachePath

The path to the cache folder. This is used to store the generated tiles and thumbnails.

:::info
The default value is `./cache`.
:::

## Cache

### CacheProvider

The additional cache provider, supported values:

 - `InMemory`: In-memory cache provider. Example value:
```json
{ "type": "InMemory" }
```
- `Redis`: Redis cache provider. Example value:
```json
{
   "type": "Redis",
   "settings": {
      "InstanceAddress": "localhost:5002",
      "InstanceName": "registry"
   }
}
```
:::info
The default value is `null` (`InMemory` is used).
:::

### ClearCacheInterval

The interval to clear the file cache (TimeSpan).

:::info
The default value is `01:00:00` (1 hour).
:::

### ThumbnailsCacheExpiration

The expiration time of the thumbnails cache (TimeSpan).

:::info
The default value is `00:30:00` (30 minutes).
:::

### TilesCacheExpiration

The expiration time of the tiles cache (TimeSpan).

:::info
The default value is `00:30:00` (30 minutes).
:::

### DatasetVisibilityCacheExpiration

The expiration time for the dataset visibility cache (TimeSpan). Each Registry process also
keeps a visibility it has read in memory for [`DatasetLookupCacheExpiration`](#datasetlookupcacheexpiration),
so the access check of a request (each point cloud range request) needs no cache round trip.
A visibility change made through this Registry instance takes effect immediately; other
instances see it when their copy expires.

:::info
The default value is `1.00:00:00` (1 day).
:::

### AuthorizationCacheExpiration

How long Registry reuses what it knows about a user for access checks: whether the
user exists, has the admin role, or is deactivated (TimeSpan). Without it, every
request (each map tile, thumbnail and point cloud range request) reads these facts
from the identity database again.

Role changes, deactivations and user deletions made through Registry take effect
immediately. The expiration only bounds changes made elsewhere, for example by another
Registry instance that shares the database or by direct database edits. Set it to
`00:00:00` to disable the cache.

:::info
The default value is `00:00:30` (30 seconds).
:::

### DatasetLookupCacheExpiration

How long Registry reuses a dataset's database record (with its organization and the
organization's members) when it resolves `/orgs/{org}/ds/{ds}` routes (TimeSpan). An upload
of 40 files otherwise reads the same record 40 times, and every request of an organization
member read the members again.

Changes saved by this Registry instance (rename, move, delete, visibility, members) take
effect immediately. The expiration only bounds changes made elsewhere, for example by a
processing node or by direct database edits. Set it to `00:00:00` to disable the cache.

:::info
The default value is `00:00:30` (30 seconds).
:::

## Upload & Sharing

### MaxRequestBodySize

The maximum size, in bytes, accepted for a single upload request. Uploads larger
than this are rejected with `413 Payload Too Large`. The limit is applied at the
Kestrel connection level, so it is enforced for both the streamed dataset upload
endpoint (`/orgs/{org}/ds/{ds}/obj`) and the share upload endpoint
(`/share/upload/{token}`).

:::info
The default value is `null`, which means **no limit** (uploads are unbounded).
Set it to a byte count, e.g. `21474836480` for 20 GiB, to cap uploads.
:::

:::tip
When Registry runs behind a reverse proxy, also raise (or disable) the proxy's own
body-size limit and turn off request buffering, so the limit is enforced once - by
Registry. See [Reverse proxy tuning](./troubleshooting.md#tuning-the-reverse-proxy-for-large-uploads).
:::

### BatchTokenLength

The length of the token generated in the share endpoint.

:::info
The default value is `32`.
:::

### RandomDatasetNameLength

The length of the random dataset name, generated when calling the share endpoint.

:::info
The default value is `16`.
:::

### UploadBatchTimeout

The timeout for the share upload endpoint. It is the maximum time allowed between the uploads.

:::info
The default value is `01:00:00` (1 hour).
:::

### MaxZipMemoryThreshold

Removed. Folder and multi-file downloads are streamed to the client as the ZIP archive is written: no download is kept in memory or in a temporary file, whatever its size. The setting is ignored if it is still present in `appsettings.json`.

### MaxExportSizeBytes

Maximum allowed size (in bytes) for a dataset export operation. Export requests that would exceed this limit are rejected.

:::info
The default value is `1073741824` (1 GB)
:::

### Uploads

Tuning of the upload pipeline (`POST .../obj`, bundles and chunked uploads). Every field
is optional.

```json
"Uploads": {
    "ThumbnailPrecomputeWorkers": 2,
    "ThumbnailPrecomputeCapacity": 256,
    "InvalidationWindowMs": 2000,
    "QuotaWindowSeconds": 10,
    "ReceiptHours": 24,
    "MaxPartsPerRequest": 64,
    "MaxChunkBytes": 134217728
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `ThumbnailPrecomputeWorkers` | `2` | Background workers that pre-generate the thumbnails of uploaded images. A thumbnail that is not pre-generated is generated when it is first viewed. |
| `ThumbnailPrecomputeCapacity` | `256` | Thumbnails waiting for a worker. When the queue is full, further uploads skip pre-generation. |
| `InvalidationWindowMs` | `2000` | How long the OGC and dataset-thumbnail cache invalidations of an upload burst are collected before they run once for the whole burst. |
| `QuotaWindowSeconds` | `10` | How long one storage-use evaluation serves a user's uploads. The sizes of the uploads in between are added to it, so the quota still holds. |
| `ReceiptHours` | `24` | How long the outcome of an upload can be asked for by its `X-Upload-Id` (see the [API reference](/docs/integrations/api-reference#upload--modification)). |
| `MaxPartsPerRequest` | `64` | Most file parts accepted in one bundled upload request. |
| `MaxChunkBytes` | `134217728` (128 MB) | Largest chunk accepted by a chunked (resumable) upload. |

## User Management

### DefaultAdmin

The default admin user.

:::info
The default value is:
```json
{
    "Email": "admin@example.com",
    "UserName": "admin",
    "Password": "password123"
}
```
:::

### EnableStorageLimiter

Enable the storage limiter. Registry will limit the storage usage of the user based on its metadata (`maxStorageMB` key).

:::info
The default value is `false`.
:::

### EnableDefaultUserOrganization

Enables the automatic creation of a default personal organization when a new user is created. By default, every new user gets a personal organization with a slug matching their username.

Set to `false` for enterprise deployments where organizations are assigned by administrators after user creation.

:::info
The default value is `true`.
:::

**Example** - disable default organization creation:
```json
{
  "AppSettings": {
    "EnableDefaultUserOrganization": false
  }
}
```

Or via environment variable:
```bash
AppSettings__EnableDefaultUserOrganization=false
```

### EnableOrganizationMemberManagement

Enables organization member management in the admin UI, allowing administrators to add and remove users from organizations directly.

:::info
The default value is `false`.
:::

### MaxConcurrentDownloadsPerUser

Maximum number of concurrent download requests allowed per authenticated user. Set to `null` to disable throttling.

:::info
The default value is `null` (no limit).
:::

### DisableAnonymousBulkDownloads

When set to `true`, anonymous (unauthenticated) users cannot download bulk archives - that is, a whole dataset, a folder, or a multi-file selection. Single-file downloads remain allowed for anonymous users. Authenticated users are unaffected. This flag is also surfaced in the anonymous `/sys/features` response so the Hub web app can adapt its UI.

:::info
The default value is `false` (anonymous bulk downloads allowed).
:::

### MonitorToken

Static bearer token required to access the monitoring endpoints (e.g., `/quickhealth`). When set, the endpoint requires the `Authorization: Bearer <token>` header instead of a regular JWT. Set to `null` to disable token-based monitoring access.

:::info
The default value is `null`.
:::

### PasswordPolicy

Password complexity policy applied when creating or changing user passwords. Set to `null` to disable all policy enforcement.

:::info
The default policy requires at least **8 characters** and **one digit**.
:::

**Sub-fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `MinLength` | `int` | `8` | Minimum password length |
| `RequireDigit` | `bool` | `true` | At least one digit (0–9) |
| `RequireUppercase` | `bool` | `false` | At least one uppercase letter |
| `RequireLowercase` | `bool` | `false` | At least one lowercase letter |
| `RequireNonAlphanumeric` | `bool` | `false` | At least one non-alphanumeric character |

**Example** - enforce a stronger password policy:
```json
{
  "AppSettings": {
    "PasswordPolicy": {
      "MinLength": 12,
      "RequireDigit": true,
      "RequireUppercase": true,
      "RequireLowercase": true,
      "RequireNonAlphanumeric": true
    }
  }
}
```

**Example** - disable password policy entirely:
```json
{
  "AppSettings": {
    "PasswordPolicy": null
  }
}
```

Or via environment variables:
```bash
AppSettings__PasswordPolicy__MinLength=12
AppSettings__PasswordPolicy__RequireDigit=true
```

## Networking

### AllowedOrigins

List of allowed CORS origins. When `null` or empty, all origins are permitted (open CORS). For production or on-premise deployments, restrict this to the actual origins that need access.

:::info
The default value is `null` (all origins allowed).
:::

**Example** - restrict to specific origins:
```json
{
  "AppSettings": {
    "AllowedOrigins": [
      "https://hub.example.com",
      "https://admin.example.com"
    ]
  }
}
```

### ExternalUrlOverride

The external URL of Registry. This is used when the application is behind a reverse proxy.

:::info
The default value is `null`.
:::

### KnownProxies

IP addresses of the reverse proxies whose `X-Forwarded-For` and `X-Forwarded-Proto` headers
Registry trusts. From them it takes the client address (rate limits, download limits, logs)
and the scheme (HSTS, `Secure` cookies). From any other peer the headers are ignored, so a
client cannot fake its address.

:::info
The default value is `["127.0.0.1", "::1"]` (a proxy on the same host).
:::

### KnownNetworks

CIDR networks whose forwarded headers Registry trusts, in addition to `KnownProxies`: for
proxies without a fixed address. With nginx on the host in front of a port published by
Docker, the peer Registry sees is the Docker bridge gateway (`172.x.0.1`), so the production
template sets Docker's default bridge pool:

```json
"KnownNetworks": [ "172.16.0.0/12" ]
```

An invalid address or network stops the start. See
[Behind a reverse proxy](./production.md#behind-a-reverse-proxy).

:::info
The default value is `[]`.
:::

### Security Headers

Registry automatically adds the following security headers to all HTTP responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking via cross-origin iframes while allowing same-origin embedding (e.g. PDF viewer) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information sent with requests |

These headers are always enabled and require no configuration.

:::note
For embed routes (URLs with `?embed=1`), the `X-Frame-Options` header is omitted to allow cross-origin iframe embedding.
:::

## E-mail

### Smtp

The outgoing e-mail server. E-mail is off by default: while `Enabled` is `false`, every e-mail Registry would send is
logged and dropped. When `Enabled` is `true`, `Host` and `FromAddress` are required, and `UserName` and `Password` must
be set together (or both left empty for a server without login).

:::info
See the [E-mail](./email) page for the setup, provider examples, the test e-mail and the health check.
:::

**Sub-fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `Enabled` | `bool` | `false` | Sends e-mail through the server below |
| `Host` | `string` | — | SMTP server host name |
| `Port` | `int` | `587` | SMTP port: 587 (STARTTLS), 465 (SSL on connect), 25 (local relay) |
| `Security` | `string` | `StartTls` | `StartTls`, `SslOnConnect` or `None` |
| `ValidateServerCertificate` | `bool` | `true` | Validate the server certificate chain (the host name is always checked) |
| `UserName` | `string` | `null` | SMTP account user name |
| `Password` | `string` | `null` | SMTP account password. Prefer the `AppSettings__Smtp__Password` environment variable |
| `FromAddress` | `string` | — | Address the e-mails are sent from |
| `FromName` | `string` | `null` | Sender name. When `null`, the Hub application name (`HubOptions.AppName`, else `DroneDB`) |
| `ReplyTo` | `string` | `null` | Address replies go to |
| `TimeoutSeconds` | `int` | `30` | Timeout of each SMTP operation |

```json
"Smtp": {
  "Enabled": true,
  "Host": "smtp.example.com",
  "Port": 587,
  "Security": "StartTls",
  "UserName": "registry@example.com",
  "FromAddress": "registry@example.com"
}
```

## Update Check

Registry asks dronedb.app once a day for new versions and release notes, and sends the data that the
[Update check](./update-check) page lists. All three keys are in `AppSettings`.

### UpdateCheckCron

When the update check runs. It follows the [rules of the scheduled jobs](#scheduled-jobs): empty runs it once a day, at a
time that depends on the instance, `"disabled"`, `"off"` or `"none"` switches it off (nothing is sent), and any other
value is a cron expression.

:::info
The default value is empty (once a day).
:::

### UpdateCheckEndpoint

Address of the update check service. It must be an absolute `https` URL, or Registry does not start. Change it only to
use a test or staging service.

:::info
The default value is `https://dronedb.app/wp-json/dronedb/v1/update-check`
:::

### UpdateCheckEmail

Which new versions are e-mailed to the administrators: `security` (only versions with security fixes), `all` or `off`.
It needs [`Smtp`](#smtp): while e-mail is off, no update e-mail is sent.

:::info
The default value is `security`
:::

## Processing

### WorkerThreads

The number of worker threads used by the application. Use `-1` for automatic detection.

:::info
The default value is `-1`
:::

### NativeConcurrency

How many native renders run at once in this Registry process. Requests beyond the limit wait
for a free slot (and stop waiting when the client goes away), so a burst of map tiles or
thumbnails cannot take every CPU core from the rest of the server.

```json
"NativeConcurrency": {
    "Tiles": 0,
    "Heavy": 0
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `Tiles` | `max(2, cores / 2)` | Map tiles and map renders (WMTS, WMS, OGC API tiles). |
| `Heavy` | `max(1, cores / 4)` | Thumbnails and coverage renders (WCS). |

`0` or a negative value means the default. The number of renders running per lane is reported
by the `registry.native.in_flight` gauge (meter `Registry.NativeWork`, tag `lane`).

### RemoteThumbnailGeneratorUrl

URL of a remote thumbnail generator service for offloading thumbnail generation.

:::info
The default value is `null`
:::

### ThumbnailGeneratorToken

Shared secret of the web server and a thumbnail generator host (sent in the
`X-Thumbnail-Token` header). Registry generates it on the first start when it is empty. A
thumbnail generator host refuses to start without it; both read the same `appsettings.json`.

### HostBudget

The Registry processes that share the machine. When they are declared, each process takes its
share of the cores and memory (its weight over the sum of the weights) for its background
workers, its render lanes and the DroneDB library's CPU pool, instead of each process planning
the whole machine.

```json
"HostBudget": {
    "WebServers": 1,
    "ProcessingNodes": 2
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `WebServers`, `ProcessingNodes`, `ThumbnailGenerators` | `0` | Processes of each kind on the machine (`0` = not declared). |
| `Cores` | `0` | Logical processors of the machine (`0` = those this process sees). |
| `MemoryMb` | `0` | Memory of the machine in MiB (`0` = what this process sees). |
| `WebServerWeight`, `ProcessingNodeWeight`, `ThumbnailGeneratorWeight` | `1`, `2`, `1` | Relative share of each kind of process. |
| `IoThreads` | `0` | Disk-bound threads for the whole machine, split like the cores (`0` = the library's default, 4 per process). |

With nothing declared, each process plans the whole machine. The production compose file sets
`AppSettings__HostBudget__WebServers=1` and `AppSettings__HostBudget__ProcessingNodes=2`. The
effective budget is shown in the admin configuration page.

### ProcessingBudget

Concurrency and native resources of background jobs. Native builds run on their own queue.

| Field | Default | Description |
|-------|---------|-------------|
| `HeavyWorkers` | derived | Concurrent jobs that run native builds (COG, COPC, Nexus, LOD, raster tools). |
| `LightWorkers` | derived | Concurrent other jobs (imports, exports, cleanup, thumbnails, scheduling). |
| `BuildThreads` | derived | Threads one native build may use (`DDB_BUILD_THREADS`). |
| `BuildCacheMb` | derived | GDAL block cache during a raster build, in MB (`DDB_COG_CACHE_MB`). |
| `BuildWarpMemoryMb` | derived | GDAL warp memory during a raster build, in MB (`DDB_WARP_MEMORY_MB`). |

`0` means derived from the host (or from the host budget when it is declared).

### Ddb (DroneDB library settings)

A top-level section (next to `AppSettings`, not inside it) with the process settings Registry
passes to the DroneDB library with `DDBConfigure` before it initializes it. A value left out is
not sent, and the library uses its environment variable or its default; `CacheDir` is the
exception: Registry always sends it (`<TempPath>/ddb-cache` by default). See
[DroneDB Library](/docs/integrations/library#process-configuration).

```json
"Ddb": {
    "CpuPoolSize": 6,
    "GdalCacheMb": 512
}
```

| Field | Range | When left out | Description |
|-------|-------|---------------|-------------|
| `CpuPoolSize` | 0 to 4096 | from the host budget when declared, else `DDB_CPU_POOL_SIZE` or cores − 1 | Worker threads the library may run at once beside the calling threads. |
| `IoThreads` | 1 to 256 | from the host budget when declared, else `DDB_IO_THREADS` or 4 | Threads of one disk-bound section (hashing, deleting build folders). |
| `MinFreeDiskMb` | 0 or more | `DDB_MIN_FREE_DISK_MB` or 512 | Free MiB a build needs on the volume it writes to; `0` turns the check off. |
| `GdalCacheMb` | 16 to 1048576 | `DDB_GDAL_CACHE_MB` or 1024, as an upper bound | Size in MiB of GDAL's block cache, shared by the whole process (tiles, renders, thumbnails, statistics, builds). When set, it is the size of the cache (raising or lowering GDAL's default, winning over `GDAL_CACHEMAX`). Processes on one host each have their own cache: size it per role. |
| `CacheDir` | absolute path | `<TempPath>/ddb-cache` | Where the library caches thumbnails, tiles, index templates and DSM tiles. |

An explicit value here wins over the host budget and the environment variables. The effective
values are logged at start.

### DefaultThumbnailSize

Default thumbnail size in pixels when no size is specified in the request (e.g. via `GET .../thumb?path=`).

:::info
The default value is `512`
:::

### DatasetThumbnailCandidates

Ordered list of file names (in the dataset root) checked when computing the dataset thumbnail shown in the Hub UI. The first match found is used.

:::info
The default value is:
```json
["thumbnail.webp", "thumbnail.jpg", "thumbnail.png", "cover.webp", "cover.jpg", "cover.png"]
```
:::

### ProcessingPlatform

Configuration block for the asynchronous task substrate (Processing Platform). Bound from `AppSettings:ProcessingPlatform`. When omitted, all sub-fields use their built-in defaults.

See the [Processing Platform](./processing-platform) page for a full description of the task system and REST API.

**Quota and concurrency:**

| Field | Default | Description |
|-------|---------|-------------|
| `MaxConcurrentTasksPerUser` | `3` | Maximum concurrent tasks per user |
| `MaxQueuedTasksPerUser` | `20` | Maximum queued (non-terminal) tasks per user |
| `MaxConcurrentTasksPerOrg` | `10` | Maximum concurrent tasks per organization |
| `MaxConcurrentTasksGlobal` | `32` | Maximum concurrent tasks across all users |
| `MaxEstimatedOutputBytesPerSubmit` | `21474836480` (20 GiB) | Hard cap on estimated output size per task submission |
| `MaxArchiveExtractSizeBytes` | `5368709120` (5 GiB) | Maximum compressed archive size accepted by the `archive-extract` tool |
| `DiskSafetyMarginBytes` | `268435456` (256 MiB) | Free disk head-room kept on the dataset volume while extracting an archive or importing a dataset. The streaming guard aborts and rolls back before the projected size would eat into this margin, so a decompression bomb cannot fill the volume. Set to `0` to disable the secondary disk-space guard (the uncompressed-size cap still applies). |
| `OrgDailyOutputBytes` | `{"default": 107374182400}` | Per-org daily output budget in bytes, keyed by org slug. Use `"default"` as a fallback. |

**Downloads:**

| Field | Default | Description |
|-------|---------|-------------|
| `BulkDownloadAsyncThresholdBytes` | `524288000` (500 MB) | Selections above this size are routed to the async `bulk-download` task instead of direct streaming. Whole-dataset downloads always use the async path. |
| `MaxConcurrentBulkDownloadsPerUser` | `1` | Maximum simultaneous `bulk-download` tasks per user. |

**Raster export:**

| Field | Default | Description |
|-------|---------|-------------|
| `DefaultRasterTileSize` | `512` | Tile size in pixels for block-windowed raster export. |

**Deduplication:**

| Field | Default | Description |
|-------|---------|-------------|
| `DedupEnabled` | `true` | When `true`, a task with the same parameters submitted within the lookback window returns a `200` dedup hit instead of creating a new task. |
| `DedupLookbackHours` | `24` | Time window (hours) used when searching for duplicate tasks. |

**Logging and progress:**

| Field | Default | Description |
|-------|---------|-------------|
| `LogTailMaxLines` | `200` | Maximum lines kept in the task log ring buffer. |
| `LogTailMaxBytes` | `32768` | Maximum bytes kept in the task log ring buffer. |
| `ProgressUpdateThrottleSeconds` | `2` | Minimum seconds between persisted progress updates. |
| `ArtifactTtlHours` | `24` | Hours before a task's work directory (and its artifact) is swept. |

**Remote node polling:**

| Field | Default | Description |
|-------|---------|-------------|
| `RemoteNodePollIntervalSeconds` | `2` | Interval in seconds between polling remote processing nodes for task status updates. |
| `RemoteNodePollMaxBackoffSeconds` | `30` | Maximum backoff interval (seconds) when polling remote nodes encounters repeated failures. |
| `RemoteNodeRequestTimeoutSeconds` | `30` | Timeout in seconds for HTTP requests to remote processing nodes. |

**Remote nodes configuration:**

| Field | Default | Description |
|-------|---------|-------------|
| `NodeOdx` | `[]` | List of remote ODM processing nodes. Each entry has `Id` (string, default `"default"`), `Url` (string), `Token` (string, optional), and `Title` (string, optional). |

**Example:**
```json
{
  "AppSettings": {
    "ProcessingPlatform": {
      "MaxConcurrentTasksPerUser": 5,
      "MaxConcurrentTasksGlobal": 64,
      "BulkDownloadAsyncThresholdBytes": 104857600,
      "ArtifactTtlHours": 48
    }
  }
}
```

Or via environment variables:
```bash
AppSettings__ProcessingPlatform__MaxConcurrentTasksPerUser=5
AppSettings__ProcessingPlatform__ArtifactTtlHours=48
```

## Hub UI Customization

The Hub web app (the Vue SPA shipped with Registry) reads its branding and feature flags from `AppSettings:HubOptions`. The block is exposed to the browser through the anonymous `/sys/features` endpoint and applied at runtime - `index.html` is no longer the place to customize the app.

When you remove the section from `appsettings.json`, the Hub falls back to the default DroneDB banner (`/images/logo-banner.svg`) without any extra wordmark.

### HubOptions

Top-level container for branding and feature flags. Set to `null` (or omit it entirely) to use defaults.

**Sub-fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `AppLogo` | `string` | `/images/logo-banner.svg` | URL of the banner image shown in the header. Set to an empty string to fall back to `AppIcon` + `AppName`. |
| `AppName` | `string` | `null` | Wordmark next to `AppIcon`. When `null` no text is rendered (banner alone). |
| `AppIcon` | `string` | `null` | Icon class shown when no logo is configured (`"dronedb"` for the default DroneDB mark, or any [Semantic UI icon](https://semantic-ui.com/elements/icon.html) name). |
| `ShowRegistrationLink` | `bool` | `true` | Whether the Login page shows the "Sign up" link. |
| `DisableDatasetCreation` | `bool` | `false` | Hides the "New dataset" button. |
| `DisableStorageInfo` | `bool` | `false` | Hides the per-user storage indicator in the header. |
| `DisableAccountManagement` | `bool` | `false` | Hides the account-management menu (useful when authentication is delegated to an external provider). |
| `SingleOrganization` | `string` | `null` | When set, the Hub treats the app as single-tenant and routes the user directly to the named organization. |
| `ReadOnlyOrgs` | `bool` | `null` | When `true`, organization create/delete/edit actions are hidden. |
| `Favicon` | `object` | `null` | Optional favicon set (see below). |

**Example** - minimal white-label deployment:
```json
{
  "AppSettings": {
    "HubOptions": {
      "AppLogo": "/branding/acme-banner.svg",
      "AppName": "Acme Maps",
      "ShowRegistrationLink": false,
      "DisableAccountManagement": true,
      "SingleOrganization": "acme"
    }
  }
}
```

:::tip
All paths starting with `/branding/` are served from `{StoragePath}/branding/`, a folder that **survives Hub upgrades**. Drop your logos, favicons and `manifest.webmanifest` there and reference them from `HubOptions`. See [Updating](./production.md#updating).
:::

### HubOptions.Favicon

When set, the Hub injects the matching `<link>` and `<meta>` tags into `<head>` at runtime. Any unset field is omitted. Drop the actual image/manifest files under `{StoragePath}/branding/` so they survive upgrades.

| Field | Type | Description |
|-------|------|-------------|
| `FaviconIco` | `string` | URL of the `.ico` fallback (e.g. `/branding/favicon.ico`). |
| `Favicon16` | `string` | URL of the 16×16 PNG. |
| `Favicon32` | `string` | URL of the 32×32 PNG. |
| `AppleTouchIcon` | `string` | URL of the 180×180 PNG used by iOS. |
| `Manifest` | `string` | URL of `site.webmanifest`. The 192/512 PWA icons live inside the manifest itself. |
| `ThemeColor` | `string` | CSS color string used for the `theme-color` meta tag. |

**Example**:
```json
{
  "AppSettings": {
    "HubOptions": {
      "AppLogo": "/branding/acme-banner.svg",
      "Favicon": {
        "FaviconIco": "/branding/favicon.ico",
        "Favicon16": "/branding/favicon-16x16.png",
        "Favicon32": "/branding/favicon-32x32.png",
        "AppleTouchIcon": "/branding/apple-touch-icon.png",
        "Manifest": "/branding/site.webmanifest",
        "ThemeColor": "#0070e0"
      }
    }
  }
}
```

## Scheduled Jobs

All cron properties share the same resolution rules:

- **Omitted or empty** → the built-in default cron is used.
- **`"disabled"`, `"off"`, or `"none"`** (case-insensitive) → the recurring job is removed from Hangfire entirely.
- **Any other value** → treated as a valid cron expression and applied as-is.

### CleanupExpiredJobsCron

Cron expression for the job that cleans up expired jobs.

:::info
The default value is Hangfire's `Cron.Daily()` (once a day)
:::

### SyncJobIndexStatesCron

Cron expression for the job that synchronizes job index states.

:::info
The default value is `*/5 * * * *` (every 5 minutes)
:::

### RecoverIndexedJobPublicationsCron

Cron expression for the job that completes indexed job publications interrupted before the job became runnable (for example by a restart right after the job was created). Such jobs wait in the `Indexing` state and are published on their original job id; jobs with an unusable publication record are cancelled.

:::info
The default value is `* * * * *` (every minute)
:::

### ProcessPendingBuildsCron

Cron expression for the job that processes pending builds.

:::info
The default value is `* * * * *` (every minute)
:::

### OrphanedDatasetCleanupCron

Cron expression for the job that cleans up orphaned dataset folders. This job runs daily to remove filesystem folders that no longer have a corresponding database entry (e.g., from failed deletions).

:::info
The default value is `0 3 * * *` (daily at 3:00 AM)
:::

### DatasetCleanupCron

Cron expression for the recurring full-cleanup job that runs DroneDB `cleanup` (purge of stale entries and unused build artifacts) on every dataset of every organization. The same operation is also exposed via the admin API endpoint `POST /sys/cleanup`.

The recurring job also deletes what interrupted uploads leave in each dataset, when nothing was written to it for 24 hours: push folders of pushes that were never committed (`.ddb/tmp/push-*`) and temporary upload files (`.uploads/*.tmp`).

:::info
The default value is `0 0 * * *` (daily at midnight)
:::

### ArtifactCompletenessCheckerCron

Cron expression for the recurring job that scans every buildable entry in every dataset and enqueues a rebuild for any entry whose output artifacts are missing or empty. This is particularly useful after a build-output format migration (e.g. FGB→MVT, EPT→COPC) to bring the entire corpus up to the new layout without a manual sweep. The same operation is also exposed via the admin API endpoint `POST /sys/check-artifact-completeness`.

:::info
The default value is `0 2 * * *` (daily at 2:00 AM)
:::

### JobIndexCleanupCron

Cron expression for the job that purges old terminal records (Succeeded, Failed, Deleted) from the `JobIndices` table. This prevents the table from growing indefinitely.

:::info
The default value is `0 4 * * *` (daily at 4:00 AM)
:::

### JobIndexRetentionDays

Number of days to retain terminal (Succeeded/Failed/Deleted) job index records. Records whose last state change is older than this value are automatically purged by the cleanup job.

:::info
The default value is `60`
:::

**Example** - keep records for 30 days and run the cleanup at 2:00 AM:
```json
{
  "AppSettings": {
    "JobIndexRetentionDays": 30,
    "JobIndexCleanupCron": "0 2 * * *"
  }
}
```

:::tip
If the `JobIndices` table has already grown very large, you can trigger an immediate cleanup via the admin API endpoint `POST /sys/cleanup-jobindices`. An optional `retentionDays` query parameter lets you override the configured retention for that single run.
:::

### HangfireJobRetentionDays

Number of days to retain Hangfire job records. Jobs older than this value are automatically purged.

:::info
The default value is `2`
:::

### HangfireInvisibilityTimeoutHours

MySQL storage only: the number of hours a running job is considered "active" before the storage backend treats it as abandoned and makes it eligible for re-dequeuing by another worker. The default is `4` hours.

Raise this value if your builds can take longer than the configured timeout (e.g. large point clouds, large meshes, big orthophoto generation). If a job exceeds the timeout it may be picked up a second time by another worker, leading to collisions with DroneDB's native build lock.

:::info
This setting has no effect when `HangfireProvider` is `InMemory`.
:::

## Import

Configuration for the dataset import feature (pulling data from remote sources). Bound from `AppSettings:Import`. When omitted, all sub-fields use their built-in defaults.

**Size and sources:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `MaxImportSizeBytes` | `long` | `0` (unlimited) | Maximum size in bytes for a single import operation. Set to `0` for no limit. |
| `AllowedSourceTypes` | `string[]?` | — | Allowed source types for imports (e.g., `"registry"`, `"http"`). When `null`, all types are allowed. |

**File type filtering:**

These two lists apply to **every path that writes files into a dataset**: single-file URL import (`import-file`), archive extraction (`archive-extract`), archive URL import (`archive-url`), direct web upload (multipart/streamed), CLI push sync, and cross-dataset transfer. Matching is case-insensitive and works with or without the leading dot.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `BlockedFileExtensions` | `string[]` | executables/scripts deny-list | Extensions rejected on every upload/import path (block-list mode). Files whose extension is in this list are skipped during archive extraction and rejected outright on all other paths. Ignored when `AllowedFileExtensions` is non-empty. |
| `AllowedFileExtensions` | `string[]` | `[]` (disabled) | When non-empty, switches to allow-list mode: **only** files whose extension is listed are accepted on every upload/import path; every other file is rejected, and `BlockedFileExtensions` is ignored. |

:::info
The allow-list takes precedence over the block-list. Leave `AllowedFileExtensions` empty to reject a known set of dangerous types (block-list), or populate it to permit only an explicit set of safe types (allow-list). The built-in `BlockedFileExtensions` default covers common executables, scripts and installers (`.exe`, `.dll`, `.bat`, `.ps1`, `.sh`, `.js`, `.jar`, `.msi`, ...). Disallowed files inside an archive are skipped (the rest of the archive is still extracted); on direct upload, CLI push, and transfer the operation is rejected outright with a clear error message that names the file(s) and the reason. The frontend will not auto-retry blocked uploads.
:::

**Security (SSRF protection):**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `SsrfAllowPrivateNetworks` | `bool` | `false` | Allow imports from private network addresses (10.x, 172.16-31.x, 192.168.x). Enable only in trusted environments. |
| `SsrfAllowedHosts` | `string[]` | `[]` | Whitelist of allowed hostnames/IPs for imports. When empty, all hosts are allowed (unless `SsrfAllowPrivateNetworks` is `false`). |

**HTTP behavior:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `MaxRedirects` | `int` | `5` | Maximum number of HTTP redirects to follow during import. |
| `ConnectTimeoutSeconds` | `int` | `30` | Timeout in seconds for establishing a connection to the remote host. |
| `TransferTimeoutSeconds` | `int` | `3600` | Timeout in seconds for the entire data transfer (1 hour). |
| `RegistryDownloadConcurrency` | `int` | `4` | Number of concurrent connections when downloading from a Registry source. |
| `RegistryDownloadMaxRetries` | `int` | `6` | Maximum number of retry attempts for failed Registry downloads. |

**Example:**
```json
{
  "AppSettings": {
    "Import": {
      "MaxImportSizeBytes": 10737418240,
      "SsrfAllowPrivateNetworks": false,
      "SsrfAllowedHosts": ["https://registry.example.com"],
      "TransferTimeoutSeconds": 7200
    }
  }
}
```

## Security

### DataProtectionKeysPath

Path to the folder where ASP.NET Core Data Protection keys are persisted. When set, encryption keys (used for cookies, tokens, etc.) survive application restarts and deployments. For production environments with multiple instances, set this to a shared, persistent volume so all instances use the same keys.

:::info
The default value is `null` (keys are stored in the temporary folder and lost on restart).
:::

**Example** - persist keys to a dedicated folder:
```json
{
  "AppSettings": {
    "DataProtectionKeysPath": "./data/protection-keys"
  }
}
```
