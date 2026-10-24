---
sidebar_position: 2
sidebar_label: Getting Started
---

# Getting Started

## Getting Started with Docker

The fastest way to get started is with Docker. Download [Docker](https://www.docker.com/community-edition) and run:

```bash
docker run -it --rm -p 5000:5000 -v ${PWD}/registry-data:/data dronedb/registry
```

Data will be stored in the local folder `registry-data`.
Open [http://localhost:5000](http://localhost:5000) in your browser to start using the application.

:::warning macOS users
On macOS, do not bind-mount a local folder to `/data`. Use a named volume instead. See
[macOS: use a named volume](#macos-use-a-named-volume).
:::

:::warning Apple Silicon (M1 to M4) and other ARM computers
The `dronedb/registry` image is built for Intel/AMD (`linux/amd64`) processors only. On an ARM
computer, `docker run` fails with `no matching manifest for linux/arm64/v8`. Add
`--platform linux/amd64` to the command. See
[Apple Silicon and other ARM computers](#apple-silicon-and-other-arm-computers).
:::

**Default credentials**: `admin` / `password123`

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

### macOS: use a named volume

On macOS, Docker Desktop shares host folders with the container through a virtual
file system (virtiofs). DroneDB cannot create dataset indexes on this file system. If
you bind-mount a local folder to `/data`, Registry starts, but it cannot initialize
datasets. The logs show errors such as:

```text
filesystem error: cannot copy: Permission denied [/root/.ddb/templates/empty-dbase-<rev>.sqlite] [./datasets/.../.ddb/dbase.sqlite]
Table 'entries' not found (not a valid database: /data/./datasets/.../.ddb/dbase.sqlite)
```

Store `/data` in a Docker named volume instead. A named volume is kept inside the Docker
Desktop Linux VM, so it does not use virtiofs:

```bash
docker volume create registry-data
docker run -d --name registry --restart unless-stopped \
  --platform linux/amd64 \
  -p 5000:5000 \
  -v registry-data:/data \
  dronedb/registry
```

The `--platform linux/amd64` line is required on Apple Silicon Macs and has no effect on Intel
Macs. See [Apple Silicon and other ARM computers](#apple-silicon-and-other-arm-computers).

To change the port on the host, change only the first number. For example, use
`-p 5010:5000` to open Registry at `http://localhost:5010`.

With a named volume, the files are not in a folder on your Mac. To read them, use these
commands:

```bash
# Follow the application log
docker logs -f registry

# Copy the whole data folder to the Mac (for backup or inspection)
docker cp registry:/data ./registry-data-backup
```

To recover an instance that you started with a local folder, see
[Dataset initialization fails on macOS](./admin/troubleshooting.md#dataset-initialization-fails-on-macos).

### Apple Silicon and other ARM computers

The Registry Docker image is published for `linux/amd64` only. On an Apple Silicon Mac
(M1, M2, M3, M4) or another ARM computer, Docker cannot find an image for your processor and
`docker run` stops with this error:

```text
docker: no matching manifest for linux/arm64/v8 in the manifest list entries
```

To run the image, ask Docker for the `linux/amd64` platform. Docker Desktop then runs the image
through emulation:

```bash
docker run -d --name registry --restart unless-stopped \
  --platform linux/amd64 \
  -p 5000:5000 \
  -v registry-data:/data \
  dronedb/registry
```

:::note
- On macOS, keep the named volume from the previous section.
- Emulation is slower than a native image. Processing of large datasets takes more time.
- In Docker Desktop, open **Settings → General** and turn on **Use Rosetta for x86_64/amd64
  emulation on Apple Silicon**. Without it, Docker uses a slower emulator.
:::

A native `linux/arm64` image is not available yet. To avoid emulation, use
[Getting Started Natively](#getting-started-natively) with the release for your platform.

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
This configuration uses SQLite as the database. For production environments with high load, use MySQL/MariaDB as described in the [MySQL/MariaDB Configuration](./admin/configuration#use-mysql--mariadb-instead-of-sqlite) section.
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

## Production deployment notes

Registry's build pipeline (Cloud Optimized GeoTIFF, point cloud and 3D/Nexus
generation) writes large temporary files while processing datasets. On a busy server
these can grow to several GB per build. Configure the deployment so this scratch never
lands on the host root filesystem; otherwise a heavy workload (or a build that crashes
mid-way) can fill the root partition and take the whole stack down.

### Keep temporary files on the data volume

Point the temporary directory at a sub-folder of the data volume (which should live on
a large partition) instead of the container working directory or the `/tmp` tmpfs. Set
these environment variables on every `registry` service (web server, processing nodes
and thumbnailer):

```yaml
    environment:
      - CPL_TMPDIR=/data/temp
      - TMPDIR=/data/temp
      - TEMP=/data/temp
```

The official `dronedb/registry` image already ships these defaults, so you only need to
override them if your temp folder lives elsewhere. Make sure `/data/temp` is backed by
the large volume (it is, when you bind-mount the whole `/data` or its `temp` sub-path).

:::note
Recent DroneDB releases also scope each build's scratch to a per-build temporary folder
under the dataset's `.ddb/build` directory and reclaim it automatically; a daily
cleanup job removes anything left behind by a crashed build. The environment variables
above are an additional safety net for any other GDAL temporary files.
:::

### Bind-mount the whole `/data`, not just sub-paths

Bind-mount the entire `/data` directory (or back it with a named volume on the large
partition):

```yaml
    volumes:
      - ./data:/data
      - ./appsettings.json:/data/appsettings.json
```

:::warning
Avoid mounting only individual sub-paths of `/data` (for example only `/data/datasets`,
`/data/cache` and so on). Anything the container writes to an unmounted part of `/data`
then goes to the container writable layer or, with older images that declared
`VOLUME /data`, to an anonymous Docker volume on the host root filesystem. Those
anonymous volumes are never reclaimed by `docker compose down && up` and accumulate
stale scratch over time. Current images no longer declare `VOLUME /data` for this
reason.
:::

:::warning macOS
On macOS, back `/data` with a named volume, not a host folder. See
[macOS: use a named volume](#macos-use-a-named-volume).
:::

### Move Docker's data-root to the large partition

As a structural safety net, store all Docker data (images, containers and volumes) on
the large partition instead of the root disk. Edit `/etc/docker/daemon.json`:

```json
{
  "data-root": "/data/docker"
}
```

Then restart Docker. This guarantees no container can exhaust the root filesystem.

### Bound container log growth

Cap container log size so logs cannot grow without limit. In `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "5" }
}
```
