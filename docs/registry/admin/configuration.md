---
sidebar_position: 8
sidebar_label: Configuration Reference
---

# Configuration Reference

The configuration file is `appsettings.json`, if not present it will be
created with default values (`appsettings-default.json`).

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
 - `Mssql`: Microsoft SQL Server (no migrations)

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

## Database

### Use MySQL / MariaDB instead of SQLite

For production environments with high load, it's recommended to use MySQL or MariaDB. See the [Getting Started guide](/docs/registry/getting-started#use-mysql--mariadb-instead-of-sqlite) for setup instructions.

### RegistryProvider

The Registry database provider, supported values:

 - `Sqlite`: SQLite database
 - `Mysql`: MySQL or MariaDB, ([compatibility](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql#supported-database-servers-and-versions))
 - `Mssql`: Microsoft SQL Server (no migrations)

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

### VisibilityCacheExpiration

The expiration time for the dataset visibility cache (TimeSpan).

:::info
The default value is `1.00:00:00` (1 day).
:::

## Upload & Sharing

### MaxRequestBodySize

The maximum request body size. It sets the `MultipartBodyLengthLimit` of the kestrel `FormOptions`.

:::info
The default value is `null` (default).
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

Memory threshold (in bytes) before using disk-based ZIP creation.

:::info
The default value is `1073741824` (1 GB)
:::

### MaxExportSizeBytes

Maximum allowed size (in bytes) for a dataset export operation. Export requests that would exceed this limit are rejected.

:::info
The default value is `1073741824` (1 GB)
:::

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

## Processing

### WorkerThreads

The number of worker threads used by the application. Use `-1` for automatic detection.

:::info
The default value is `-1`
:::

### RemoteThumbnailGeneratorUrl

URL of a remote thumbnail generator service for offloading thumbnail generation.

:::info
The default value is `null`
:::

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
