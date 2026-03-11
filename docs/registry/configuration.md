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

For production environments with high load, it's recommended to use MySQL or MariaDB. See the [Getting Started guide](./getting-started.md#use-mysql--mariadb-instead-of-sqlite) for setup instructions.

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

## User Management

### DefaultAdmin

The default admin user.

:::info
The default value is:
```json
{
    "Email": "admin@example.com",
    "UserName": "admin",
    "Password": "password"
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

**Example** — disable default organization creation:
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

**Example** — enforce a stronger password policy:
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

**Example** — disable password policy entirely:
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

**Example** — restrict to specific origins:
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
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer information sent with requests |

These headers are always enabled and require no configuration.

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

## Scheduled Jobs

### CleanupExpiredJobsCron

Cron expression for the job that cleans up expired jobs.

:::info
The default value is `0 * * * *` (every hour)
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

**Example** — keep records for 30 days and run the cleanup at 2:00 AM:
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
