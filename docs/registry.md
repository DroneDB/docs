---
sidebar_position: 3
---

# Registry

Registry is a simple, user-friendly aerial data management and storage
application that you can self-host on your 

Combined with [Hub](https://github.com/DroneDB/Hub), it provides a
simple, fast and reliable platform for hosting and sharing geospatial
images and data.

![orthophoto](https://user-images.githubusercontent.com/7868983/152324827-d16949b8-dd96-4d3a-b5c5-a732e999f070.png)

![files](https://user-images.githubusercontent.com/7868983/152324902-abfe0910-6115-46c5-b561-59bc5a417dda.png)

![point-cloud](https://user-images.githubusercontent.com/7868983/152324757-4ee73f71-bf8e-4c72-9910-7073a68daee3.png)

## Getting started

To get started, you need to install the following applications (if they
are not installed already):

- [Docker](https://www.docker.com)
- [Docker-compose](https://docs.docker.com/compose/install/)

Single command startup:

**Linux**

```bash
mkdir ddb-registry && cd ddb-registry &&   curl -O docker-compose.yml https://raw.githubusercontent.com/DroneDB/Registry/master/docker/testing/docker-compose.yml && \  
curl -O appsettings-testing.json https://raw.githubusercontent.com/DroneDB/Registry/master/docker/testing/appsettings-testing.json && \
curl -O initialize.sql https://raw.githubusercontent.com/DroneDB/Registry/master/docker/testing/initialize.sql && \ 
docker-compose up
```

**Windows (Poweshell)**

```bash
mkdir ddb-registry; cd ddb-registry;
curl -O docker-compose.yml https://raw.githubusercontent.com/DroneDB/Registry/master/docker/testing/docker-compose.yml;
curl -O appsettings-testing.json https://raw.githubusercontent.com/DroneDB/Registry/master/docker/testing/appsettings-testing.json;
curl -O initialize.sql https://raw.githubusercontent.com/DroneDB/Registry/master/docker/testing/initialize.sql;
docker-compose up -d
```

This command will start a new stack composed by

- MariaDB database
- PHPMyAdmin, exposed on port 8080
- Registry, exposed on port 5000

Default username and password are `admin` and `password`. After logging
in you can check the health of the application by visiting
[http://localhost:5000/status](http://localhost:5000/health).

Registry supports Swagger API documentation on
[http://localhost:5000/swagger](http://localhost:5000/swagger/)
and Hangfire as task runner on
[http://localhost:5000/hangfire](http://localhost:5000/hangfire/).

:::caution

This configuration is for local testing only: **DO NOT USE
IT IN PRODUCTION**. If you want to use the application in production
   check the following section.

:::

## Running in production

You will need [Git](https://git-scm.com/downloads). Clone the repo and
initialize submodules:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
```

And then run the following commands:

**Linux**

```bash
cd docker/production
chmod +x run.sh
./run.sh
```

**Windows**

```bash
cd docker/production
run.bat
```

Check that everything is running smoothly:

```bash
docker-compose ps
docker-compose logs -f
```

When all the containers are running, you can then open
http://localhost:5000 in your browser, use `admin:password` as default
credentials.

You can stop the application by issuing:

```bash
docker-compose down
```

The `run.sh` / `run.bat` script will create the default
`appsettings.json` file, the database initialization script and start
the Docker containers. It is possible to customize the startup settings
by creating a `.env` file in the same folder. Here it is an example:

**Linux (quotes are important)**

```bash
MYSQL_ROOT_PASSWORD="default-root-password"
MYSQL_PASSWORD="default-mysql-password"
REGISTRY_ADMIN_MAIL="test@test.it"
REGISTRY_ADMIN_PASSWORD="password"
REGISTRY_SECRET="longandrandomsecrettobegeneratedusingcryptographicallystrongrandomnumbergenerator"
EXTERNAL_URL=""
CONTROL_SWITCH='$controlSwitch'
```

**Windows (values without quotes)**

```bash
MYSQL_ROOT_PASSWORD=default-root-password
MYSQL_PASSWORD=default-mysql-password"
REGISTRY_ADMIN_MAIL=test@test.it
REGISTRY_ADMIN_PASSWORD=password
REGISTRY_SECRET=longandrandomsecrettobegeneratedusingcryptographicallystrongrandomnumbergenerator
EXTERNAL_URL=
CONTROL_SWITCH=$controlSwitch
```

If you want to reduce the log verbosity, you can change `"Information"`
to `"Warning"` in `appsettings.json`:

```json
"LevelSwitches": {
    "$CONTROL_SWITCH": "Warning"
},
```

Then run

```bash
docker-compose restart registry
```

## Standalone installation with docker (only for testing)

The following steps start a new instance of `registry` with the default
configuration and `SQLite` as backend database. They work both on linux
and windows (powershell):

```bash
wget -O appsettings.json https://raw.githubusercontent.com/DroneDB/Registry/master/Registry.Web/appsettings-default.json

docker run -it --rm -p 5000:5000 -v ${PWD}/registry-data:/Registry/App_Data -v ${PWD}/appsettings.json:/Registry/appsettings.json dronedb/registry:latest
```

## Build Docker image

If you want to build the image from scratch, you can use the following
commands:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
docker build . -t dronedb/registry
```


## Native installation

**Building**

`Registry` is written in C\# on .NET Core 6 platform and runs natively
on both Linux and Windows. To install the latest .NET SDK see the
[official download
page](https://dotnet.microsoft.com/en-us/download/dotnet/6.0). Before
building registry ensure you have `ddblib` in your path, if not download
the [latest release](https://github.com/DroneDB/DroneDB/releases) and
add it to `PATH`.

Clone the repository:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
```

Build the solution from the command line:

```bash
dotnet build
```

Run the tests to make sure the project is working correctly:

```bash
dotnet test
```

Then build the Hub interface (need [NodeJS
14+](https://nodejs.org/download/release/v14.18.3/)):

```bash
cd Registry.Web/ClientApp
npm install -g webpack@4
npm install
webpack
```

**Running**

On the first start `Registry` will create `appsettings.json` file with
default values. Feel free to modify it to your needs.

```bash
dotnet run --project Registry.Web
```

It will start a web server listening on two endpoints:
`https://localhost:5001` and `http://localhost:5000`. You can change the
endpoints using the `urls` parameter:

```bash
dotnet run --project Registry.Web --urls="http://0.0.0.0:6000;https://0.0.0.0:6001"
```

## Project architecture


*![dronedb-registry-architecture](https://user-images.githubusercontent.com/7868983/151846022-891685f7-ef47-4b93-8199-d4ac4e788c5d.png)*

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
 - `Mssql`: Microsoft SQL Server

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
The default value is `./App_Data/cache`.
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
 - `Mssql`: Microsoft SQL Server

:::info
The default value is `Sqlite`
:::

The `RegistryConnection` connection string should be changed accordingly

**RevokedTokens**

The list of revoked JWT tokens.

**Secret**

The secret used as key to generate the JWT tokens.

**StoragePath**

The path to the storage folder. This is used to store all the uploaded datasets.

:::info
The default value is `./App_Data/datasets`
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
The default value is 30 days.
:::

**UploadBatchTimeout**

The timeout for the share upload endpoint. It is the maximum time allowed between the uploads.

:::info
The default value is `01:00:00` (1 hour).
:::

**WorkerThreads**

The number of worker threads used by the application.

:::info
The default value is `0`
:::
