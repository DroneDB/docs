---
sidebar_position: 3
---

# Registry

![GitHub Release](https://img.shields.io/github/v/release/DroneDB/Registry) ![commits](https://img.shields.io/github/commit-activity/m/DroneDB/registry) ![languages](https://img.shields.io/github/languages/top/DroneDB/registry) ![.NET Core](https://github.com/DroneDB/Registry/workflows/.NET%20Core/badge.svg?branch=master)

DroneDB Registry is a comprehensive geospatial data management and storage platform. It provides JWT authentication, a full REST API, and STAC compliance for interoperability.

:::tip Try it Online
You can try the online hosted version of Registry (DroneDB Hub) at [dronedb.app/plans](https://dronedb.app/plans) with a **30-day free trial** on every plan – no commitment, cancel anytime!
:::

## Features

- **Dataset Management**: Create, organize, and share datasets with fine-grained permissions
- **Interactive Visualization**: View orthophotos, point clouds, 3D models (OBJ, GLTF, GLB), and panoramas directly in the browser
- **User Management**: Built-in user administration with role-based access control
- **STAC Compliance**: Standard SpatioTemporal Asset Catalog API for interoperability
- **Public & Private Datasets**: Flexible visibility controls for your data
- **Measurements**: Interactive measurement tools on maps
- **Import/Export**: Transfer datasets between Registry instances
- **On-Demand Processing**: Automatic thumbnail, tile, and streaming format generation

### Orthophoto Measurements

Interactive measurement tools on orthophotos:

![Orthophoto Measurements](./assets/ortho-measurements.webp)

### Point Cloud Measurements

Measure distances and areas directly on point clouds:

![Point Cloud Measurements](./assets/point-cloud-measurements.webp)

![Point Cloud Measurements Saved](./assets/point-cloud-measurements-saved.webp)

### Live Examples

- [Brighton Beach](https://hub.dronedb.app/r/hedo88/brighton-beach)
- [ODM Seneca](https://hub.dronedb.app/r/hedo88/odm-seneca)
- [ODM Sance](https://hub.dronedb.app/r/hedo88/odm-sance)
- [Panorama Example](https://hub.dronedb.app/r/pierotofy/panoexample/)

## Supported Formats

| Category | Formats |
|----------|---------|
| **Images** | JPG, JPEG, DNG, TIF, TIFF, PNG, GIF, WEBP |
| **Point Clouds** | LAS, LAZ, PLY* |
| **3D Models** | OBJ, GLTF, GLB, PLY* |
| **Rasters** | GeoTIFF (orthophotos, DEMs) |
| **Vector Data** | GeoJSON, SHP, SHZ, KML, KMZ, DXF, DWG, FGB, TopoJSON, GPKG |
| **Panoramas** | 360° images (aspect ratio ≥ 2:1) with optional GPS |
| **Videos** | MP4, MOV |
| **Other** | Markdown, PDF |

:::note
*PLY files are automatically classified as point clouds or 3D models based on their content.
:::

## On-Demand Processing

Registry automatically generates optimized formats for visualization:

| Source | Generated Format | Description |
|--------|------------------|-------------|
| **GeoTIFF** | COG (Cloud Optimized GeoTIFF) | Efficient streaming for large orthophotos |
| **Point Clouds** | EPT/COPC | Streaming format via Potree viewer |
| **3D Models** | NXS (Nexus) | Progressive streaming for 3D meshes |
| **Images** | Thumbnails, WebP tiles | Fast previews and map tiles |

Processing happens in background via Hangfire jobs. Monitor progress at `/hangfire`.

### Panorama Viewer

Registry includes a built-in 360° panorama viewer for immersive visualization:

- **Automatic detection**: Images with aspect ratio ≥ 2:1 are classified as panoramas
- **GPS support**: GeoPanoramas include location data displayed on maps
- **Interactive controls**: Pan, zoom, and fullscreen viewing

To upload panoramas, simply add them to a dataset like any other image. Registry will automatically detect and render them with the panorama viewer.

### Chunked Uploads

For large files, Registry supports chunked uploads:

- Files are split into manageable chunks for reliable upload
- Automatic resume on connection failures
- No file size limits (configurable via `MaxRequestBodySize`)

The DroneDB CLI (`ddb push`) handles chunked uploads automatically.

## Getting Started with Docker

The fastest way to get started is with Docker. Download [Docker](https://www.docker.com/community-edition) and run:

```bash
docker run -it --rm -p 5000:5000 -v ${PWD}/registry-data:/data dronedb/registry
```

Data will be stored in the local folder `registry-data`.
Open [http://localhost:5000](http://localhost:5000) in your browser to start using the application.

**Default credentials**: `admin` / `password`

:::warning
Change the default password immediately after first login at [http://localhost:5000/account](http://localhost:5000/account)
:::

### Useful Endpoints

| Endpoint | Description |
|----------|-------------|
| [/scalar/v1](http://localhost:5000/scalar/v1) | API Documentation (Scalar UI) |
| [/version](http://localhost:5000/version) | Version information |
| [/quickhealth](http://localhost:5000/quickhealth) | Quick health check (requires auth) |
| [/health](http://localhost:5000/health) | Detailed health check (requires auth) |
| [/hangfire](http://localhost:5000/hangfire) | Background jobs dashboard (requires auth) |
| [/stac](http://localhost:5000/stac) | STAC Catalog root |

The log file is located in `registry-data/logs/registry.txt`.

## Getting Started Natively

### Prerequisites

1. Install the latest version of the [DroneDB library](https://github.com/DroneDB/DroneDB/releases/latest) and add it to PATH
2. Download the [latest Registry release](https://github.com/DroneDB/Registry/releases/latest) for your platform

### Running

```bash
./Registry.Web ./registry-data
```

### Command Line Options

```
-a, --address              (Default: localhost:5000) Address to listen on
-c, --check                Check configuration and exit
-r, --reset-hub            Reset the Hub folder by re-creating it
--help                     Display this help screen
--version                  Display version information
Storage folder (pos. 0)    Required. Directory where Registry stores data
```

:::note
This configuration uses SQLite as the database. For production environments with high load, use MySQL/MariaDB as described in the [MySQL/MariaDB Configuration](#use-mysql--mariadb-instead-of-sqlite) section.
:::

### Change admin password

Go to [/account](http://localhost:5000/account) to change password.
Otherwise, you can change the admin password by changing the value of the field `DefaultAdmin.Password` in the `appsettings.json` file. After changing the password you need to restart the application.

### Use MySQL / MariaDB instead of Sqlite

After the first run close the program and edit the file `appsettings.json` in `registry-data` folder:

```json
"AuthProvider": "Mysql",
"RegistryProvider": "Mysql",
"HangfireProvider": "Mysql",
"ConnectionStrings": {
  "IdentityConnection": "Server=db;Database=RegistryAuth;Uid=registry;Pwd=password",
  "RegistryConnection": "Server=db;Database=RegistryData;Uid=registry;Pwd=password",
  "HangfireConnection": "Server=db;Database=RegistryHangfire;Uid=registry;Pwd=password;Allow User Variables=true;Connect Timeout=300"
  },
```

Make sure the user `registry` has the following permissions:

```sql
GRANT ALL PRIVILEGES ON *.* TO 'registry'@'%' IDENTIFIED BY 'password' WITH GRANT OPTION;
```

Then restart the application, the databases will be automatically created.


## Running with docker-compose

```bash
cd docker/testing
docker-compose up -d
```

The stack is composed of:
 - MariaDB database
 - PHPMyAdmin, exposed on port [8080](http://localhost:8080)
 - Registry, exposed on port [5000](http://localhost:5000)

## Running in production

You will need [Git](https://git-scm.com/downloads). Clone the repo and initialize submodules:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
```

And then run the following commands:

### Linux

```bash
cd docker/production
chmod +x run.sh
./run.sh
```

### Windows

```bash
cd docker/production
run.bat
```

Check that everything is running smoothly:

```bash
docker-compose ps
docker-compose logs -f
```

When all the containers are running, you can then open [http://localhost:5000](http://localhost:5000) in your browser, use `admin:password` as default credentials.

You can stop the application by issuing:

```bash
docker-compose down
```

The `run.sh` / `run.bat` script will create the default `appsettings.json` file, the database initialization script and start the Docker containers.

It is possible to customize the startup settings by creating a `.env` file in the same folder. Here's an example:

### Linux (quotes are important)
```bash
MYSQL_ROOT_PASSWORD="default-root-password"
MYSQL_PASSWORD="default-mysql-password"
REGISTRY_ADMIN_MAIL="test@test.it"
REGISTRY_ADMIN_PASSWORD="password"
REGISTRY_SECRET="longandrandomsecrettobegeneratedusingcryptographicallystrongrandomnumbergenerator"
EXTERNAL_URL=""
CONTROL_SWITCH='$controlSwitch'
```

### Windows (values without quotes)
```batch
MYSQL_ROOT_PASSWORD=default-root-password
MYSQL_PASSWORD=default-mysql-password
REGISTRY_ADMIN_MAIL=test@test.it
REGISTRY_ADMIN_PASSWORD=password
REGISTRY_SECRET=longandrandomsecrettobegeneratedusingcryptographicallystrongrandomnumbergenerator
EXTERNAL_URL=
CONTROL_SWITCH=$controlSwitch
```

If you want to reduce the log verbosity, you can change `"Information"` to `"Warning"` in `appsettings.json`:

```json
    "LevelSwitches": {
        "$CONTROL_SWITCH": "Warning"
    }
```

then run

```
docker-compose restart registry
````

> **_Info:_** Any changes to the configuration file need to restart the registry container

## Build Docker image

If you want to build the image from scratch, you can use the following commands:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
docker build . -t dronedb/registry
```

## Running from source

Registry is written in C# on .NET 9 platform and runs natively on Linux, Windows, and macOS.
To install the latest .NET SDK see the [official download page](https://dotnet.microsoft.com/en-us/download/dotnet/9.0). Before building registry ensure you have `ddblib` in your path, if not, download the [latest release](https://github.com/DroneDB/DroneDB/releases) and add it to `PATH`.

Clone the repository:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
```

Build the Hub interface (needs [Node.js 22+](https://nodejs.org/) LTS):

```bash
cd Registry.Web/ClientApp
npm install
npm run build
```

> **Note**: The build script uses `--openssl-legacy-provider` for Node.js 17+ compatibility with webpack 4.

Build the solution from the command line:

```bash
dotnet build
```

Run the tests to make sure the project is working correctly:

```bash
dotnet test
```

Then you can run the application:

```bash
dotnet run --project Registry.Web ./registry-data
```

## Updating

In order to update the application, you need to replace the executable with the latest version. It will perform the required migrations and update the database at the next startup.

With docker or docker-compose, you update the application by pulling the latest image and restarting the container:

```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

## Project architecture

![dronedb-registry-architecture](https://user-images.githubusercontent.com/7868983/151846022-891685f7-ef47-4b93-8199-d4ac4e788c5d.png)

### Key Components

- **Registry.Web**: ASP.NET Core web application
- **Registry.Adapters**: Database and DroneDB library adapters
- **Hub (Vue.js)**: Frontend SPA in `Registry.Web/ClientApp`
- **Hangfire**: Background job processing

## User Management

Registry includes a comprehensive user management system with role-based access control.

:::info Full Documentation
For complete details on user management including API endpoints, roles, organizations, storage quotas, and authentication, see the dedicated [User Management Guide](./user-management.md).
:::

**Key Features:**
- User account creation and administration
- Role-based access control with custom roles
- Organization membership management
- Per-user storage quotas
- JWT authentication with external provider support

## Dataset Visibility

Datasets support three visibility levels:

| Level | Description |
|-------|-------------|
| **Private** | Only the owner and admins can access |
| **Unlisted** | Accessible with direct link, not listed publicly |
| **Public** | Visible to everyone, included in STAC catalog |

Change visibility using:
- **Web UI**: Dataset settings
- **CLI**: `ddb chattr +public` or `ddb chattr -public`

## Dataset Deletion

When you delete a dataset, Registry uses a **deferred deletion** approach for reliability:

1. **Immediate**: The dataset is removed from the database instantly, so it disappears from the UI
2. **Background cleanup**: A Hangfire job handles:
   - Cancelling any active build jobs (tiles, thumbnails, 3D conversions)
   - Removing job tracking entries
   - Deleting the filesystem folder

This approach ensures that:
- Users get immediate feedback when deleting datasets
- Active build processes don't block deletion
- Locked files (e.g., during 3D model conversion) don't cause errors

If the background cleanup fails (e.g., files still locked), a daily recurring job (`cleanup-orphaned-datasets`) will automatically clean up any orphaned folders.

:::info
You can monitor cleanup jobs in the Hangfire dashboard at `/hangfire` on your Registry instance.
:::

## STAC API

Registry implements the [STAC specification](https://stacspec.org/) for standardized geospatial data discovery.

### Endpoints

| Endpoint | Description |
|----------|-------------|
| `/stac` | Root catalog with links to all public datasets |
| `/orgs/{org}/ds/{ds}/stac` | STAC Collection for a specific dataset |

### Browsing

Use the [STAC Browser](https://radiantearth.github.io/stac-browser/) to explore your catalog:

```
https://radiantearth.github.io/stac-browser/#/external/http://localhost:5000/stac
```

## Import & Export

### Importing Datasets

Import datasets from another Registry instance via API:

```bash
POST /system/importdataset
{
  "sourceUrl": "https://source-registry.com",
  "orgSlug": "source-org",
  "dsSlug": "source-dataset",
  "targetOrgSlug": "target-org",
  "targetDsSlug": "target-dataset",
  "token": "auth-token"
}
```

### Importing Organizations

Import entire organizations with all their datasets:

```bash
POST /system/importorg
{
  "sourceUrl": "https://source-registry.com",
  "orgSlug": "source-org",
  "targetOrgSlug": "target-org",
  "token": "auth-token"
}
```

## Reverse Proxy Configuration

When running behind a reverse proxy (nginx, Apache, etc.), configure `ExternalUrlOverride` to ensure correct URL generation:

```json
{
  "ExternalUrlOverride": "https://registry.yourdomain.com"
}
```

### Nginx Example

```nginx
server {
    listen 443 ssl;
    server_name registry.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 0;
    }
}
```

## Troubleshooting

### Common Issues

**Container fails to start**
- Check logs: `docker-compose logs registry`
- Verify database connectivity
- Ensure DroneDB library is properly installed

**Authentication errors**
- Verify `Secret` is set and consistent
- Check token expiration settings
- Clear browser cookies

**File upload failures**
- Check `MaxRequestBodySize` setting
- Verify storage path permissions
- Check available disk space

### Health Checks

Use the health endpoints to diagnose issues:

```bash
# Quick health (basic check)
curl -H "Authorization: Bearer <token>" http://localhost:5000/quickhealth

# Full health (includes database, DroneDB)
curl -H "Authorization: Bearer <token>" http://localhost:5000/health
```


## Configuration Reference

The configuration file is `appsettings.json`, if not present it will be
created with default values (`appsettings-default.json`).

**AuthCookieName**

The name of the authorization cookie.

:::info
The default value is `jwtToken`.
:::

**AuthProvider**

The authentication provider, supported values:

 - `Sqlite`: SQLite database
 - `Mysql`: MySQL or MariaDB,
            ([compatibility](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql#supported-database-servers-and-versions))
 - `Mssql`: Microsoft SQL Server (no migrations)

:::info
The default value is `Sqlite`
:::

The `IdentityConnection` connection string should be changed accordingly

**BatchTokenLength**

The length of the token generated in the share endpoint.

:::info
The default value is `32`.
:::

**CachePath**

The path to the cache folder. This is used to store the generated tiles and thumbnails.

:::info
The default value is `./cache`.
:::

**CacheProvider**

The additional cache provider, supported values:

 - `InMemory`: In-memory cache provider. Example value:
```bash
{ "type": "InMemory" }
```
- `Redis`: Redis cache provider. Example value:
```bash
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

**ClearCacheInterval**

The interval to clear the file cache (TimeSpan).

:::info
The default value is `01:00:00` (1 hour).
:::

**DefaultAdmin**

The default admin user.

:::info
The default value is:
```json
{
    "Email": "admin@example.com",
    "UserName": "admin",
    "Password": "password"
},
```
:::

**EnableStorageLimiter**

Enable the storage limiter. Registry will limit the storage usage of the user based on its metadata (`maxStorageMB` key).

:::info
The default value is `false`.
:::

**ExternalAuthUrl**

The URL of the external authentication provider.

:::info
The default value is `null`.
:::

**ExternalUrlOverride**

The external URL of Registry. This is used when the application is behind a reverse proxy.

:::info
The default value is `null`.
:::

**HangfireProvider**

The Hangfire provider, supported values:

- `InMemory`: In-memory provider. Example value:
- `Mysql`: MySQL or MariaDB

:::info
The default value is `InMemory`
:::

The `HangfireConnection` connection string should be changed accordingly

**MaxRequestBodySize**

The maximum request body size. It sets the `MultipartBodyLengthLimit` of the kestrel `FormOptions`.

:::info
The default value is `null` (default).
:::

**RandomDatasetNameLength**

The length of the random dataset name, generated when calling the share endpoint.

:::info
The default value is `16`.
:::

**RegistryProvider**

The Registry database provider, supported values:

 - `Sqlite`: SQLite database
 - `Mysql`: MySQL or MariaDB, ([compatibility](https://github.com/PomeloFoundation/Pomelo.EntityFrameworkCore.MySql#supported-database-servers-and-versions))
 - `Mssql`: Microsoft SQL Server (no migrations)

:::info
The default value is `Sqlite`
:::

The `RegistryConnection` connection string should be changed accordingly

**RevokedTokens**

The list of revoked JWT tokens.

**Secret**

The secret used as key to generate the JWT tokens. Do not use the same secret for multiple applications.

**StoragePath**

The path to the storage folder.

:::info
The default value is `./data`
:::

**ThumbnailsCacheExpiration**

The expiration time of the thumbnails cache (TimeSpan).

:::info
The default value is `00:30:00` (30 minutes).
:::

**TilesCacheExpiration**

The expiration time of the tiles cache (TimeSpan).

:::info
The default value is `00:30:00` (30 minutes).
:::

**TokenExpirationInDays**

The number of days after which the JWT tokens will expire.

:::info
The default value is `7` days.
:::

**UploadBatchTimeout**

The timeout for the share upload endpoint. It is the maximum time allowed between the uploads.

:::info
The default value is `01:00:00` (1 hour).
:::

**VisibilityCacheExpiration**

The expiration time for the dataset visibility cache (TimeSpan).

:::info
The default value is `1.00:00:00` (1 day).
:::

**WorkerThreads**

The number of worker threads used by the application. Use `-1` for automatic detection.

:::info
The default value is `-1`
:::

**DatasetsPath**

The path to the datasets folder.

:::info
The default value is `./datasets`
:::

**TempPath**

The path to the temporary files folder.

:::info
The default value is `./temp`
:::

**RemoteThumbGeneratorUrl**

URL of a remote thumbnail generator service for offloading thumbnail generation.

:::info
The default value is `null`
:::

**ZipMemoryThreshold**

Memory threshold (in bytes) before using disk-based ZIP creation.

:::info
The default value is `1073741824` (1 GB)
:::

**CleanupExpiredJobsCron**

Cron expression for the job that cleans up expired jobs.

:::info
The default value is `0 * * * *` (every hour)
:::

**SyncJobStatesCron**

Cron expression for the job that synchronizes job states.

:::info
The default value is `*/5 * * * *` (every 5 minutes)
:::

**ProcessPendingBuildsCron**

Cron expression for the job that processes pending builds.

:::info
The default value is `* * * * *` (every minute)
:::

**OrphanedDatasetCleanupCron**

Cron expression for the job that cleans up orphaned dataset folders. This job runs daily to remove filesystem folders that no longer have a corresponding database entry (e.g., from failed deletions).

:::info
The default value is `0 3 * * *` (daily at 3:00 AM)
:::

## Getting Help

Commercial support is available. [Get in touch](https://dronedb.app/contact).