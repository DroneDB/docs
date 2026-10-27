---
sidebar_position: 3
sidebar_label: Production Deployment
---

# Production Deployment

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
```

> **_Info:_** Any changes to the configuration file need to restart the registry container

## Behind a reverse proxy

In production Registry usually runs behind a reverse proxy (nginx, Apache, Caddy) that terminates TLS. The proxy must:

- send `X-Forwarded-For` and `X-Forwarded-Proto`, and pass the original `Host` header (`proxy_set_header Host $host;` in nginx). Registry takes the client address from the first (rate limits, download limits, logs) and the scheme from the second (`Secure` cookies, HSTS). It does not read `X-Forwarded-Host`;
- connect from an address Registry trusts. The forwarded headers are applied only when the peer Registry sees is listed in `KnownProxies` (IP addresses, default `127.0.0.1` and `::1`) or inside `KnownNetworks` (CIDR). From any other peer they are ignored, so a client cannot fake its address.

```json
"AppSettings": {
    "KnownProxies": [ "127.0.0.1", "::1" ],
    "KnownNetworks": [ "172.16.0.0/12" ]
}
```

With nginx on the host proxying to a port published by Docker (the `docker/production` setup), the peer is the Docker bridge gateway (`172.x.0.1`), not loopback: the production template therefore sets `KnownNetworks` to Docker's default bridge pool, `172.16.0.0/12`. Adjust it if your Docker networks use another range (`docker network inspect <project>_default`). An invalid address or network stops the start with an error that names the key.

The upload settings of the proxy (body size, request buffering, timeouts) are in [Troubleshooting](./troubleshooting.md#tuning-the-reverse-proxy-for-large-uploads).

## Build Docker image

If you want to build the image from scratch, you can use the following commands:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
docker build . -t dronedb/registry
```

## Running from source

Registry is written in C# on .NET 10. It is officially shipped and tested for **Linux and Windows** (the Docker image builds on Ubuntu): while the .NET layer itself also runs on macOS, the native DroneDB library (`libddb`) it loads via P/Invoke is only published for Windows and Linux, so macOS builds are unsupported.
To install the latest .NET SDK see the [official download page](https://dotnet.microsoft.com/en-us/download/dotnet/10.0). Registry needs the DroneDB library (`libddb`) **2.x**: at start-up it checks that the loaded library is 2.x and exports every function Registry calls, and refuses to start otherwise. The exact DroneDB build Registry is tested with is pinned in `Directory.Build.props` (`DdbVersion` and its SHA-256); install that [release](https://github.com/DroneDB/DroneDB/releases) (the `.deb` on Linux; on Windows the build embeds the release zip) so that `libddb` is on the library path.

On Windows, `libddb` builds inside the Registry process, so a dataset in a deep folder (a path of 260 characters or more) builds only when Windows allows long paths: enable `LongPathsEnabled` as described in [Installation](/docs/getting-started/installation) (Windows, *Long paths*). `Registry.Web.exe` declares itself long path aware; when Registry runs through another host (`dotnet Registry.Web.dll`, IIS), that host's manifest decides.

Clone the repository:

```bash
git clone https://github.com/DroneDB/Registry
cd Registry
git submodule update --init --recursive
```

Build the Hub interface (needs [Node.js 24+](https://nodejs.org/) LTS):

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

### Upgrading to Registry 3.0 (DroneDB 2.0)

Registry 3.0 runs on DroneDB 2.0 and changes the deployment in a few places. Before the upgrade:

1. **Back up** the databases and `appsettings.json`.
2. **Check the settings** with the new version: `Registry.Web <storage folder> --check` (with Docker: run the new image with `--check` and the `appsettings.json` mounted at `/data/appsettings.json`). It validates the file and the environment with the rules the host runs at start, writes nothing, and exits `0` when they are valid. An invalid setting now stops the start (exit code `1`) with every failure listed; the settings file is no longer rewritten on every start.
3. **Hand the data to the container user.** The image runs Registry as the `registry` user (uid/gid `1654`), no longer as root. Its first start gives `/data`, `/data/temp`, `appsettings.json` and the paths in `REGISTRY_EXTRA_OWNED_PATHS` to that user, recursively, which takes long on a large volume. With the containers stopped, do it first: `sudo chown -R 1654:1654 ./data ./appsettings.json`.
4. **Reverse proxy:** set `KnownProxies`/`KnownNetworks` (see [Behind a reverse proxy](#behind-a-reverse-proxy)).
5. **Count duplicate dataset slugs.** A migration adds a unique index on the organization and slug of datasets. Two datasets of one organization that share a slug (left by a race in older versions) are repaired first: the dataset with the lowest id keeps the slug, the others become `<slug>_<id>`. Nothing is deleted and no folder moves, but a renamed dataset has a new URL. Count them before the upgrade:
   ```sql
   SELECT OrganizationSlug, Slug, COUNT(*) AS copies, GROUP_CONCAT(Id ORDER BY Id) AS ids
   FROM Datasets GROUP BY OrganizationSlug, Slug HAVING COUNT(*) > 1;
   ```
   (SQLite: `group_concat(Id)`.)

After the upgrade:

- run the slug repair, first as a dry run: `POST /sys/fix-invalid-slugs?dryRun=true`, then `?dryRun=false` (admin). It renames organizations and datasets whose slug breaks the slug rules (2 to 128 characters, lowercase letters, digits, `_` and `-`, starting with a letter or a digit, no `--`), moves their folders and skips entries with active jobs;
- use `GET /health/live` (anonymous) or the image's `/healthcheck.sh` for container health checks; `/quickhealth` and `/health` need the `MonitorToken` (bearer header or `?token=`) or an administrator;
- the image runs in UTC: set `TZ` in your compose file if you relied on another time zone;
- `DefaultAdmin.Password` only seeds a new administrator. To recover the password, run `Registry.Web <storage folder> --reset-admin-password` with the new password in `REGISTRY_ADMIN_PASSWORD` or on stdin;
- log files are named per instance type (`registry-web*.txt`, `registry-node-<host name>*.txt`, `registry-thumbs*.txt`) and rolled daily (14 kept). Give each processing-node container a fixed `hostname`;
- set `DDB_OPENTOPOGRAPHY_KEY` in the environment of every Registry process if relative altitudes should be estimated from the world DSM: DroneDB 2.0 has no built-in key.

API clients other than the Hub and the `ddb` command line should read the [error format](/docs/integrations/api-reference) (RFC 9457 `ProblemDetails`, `403` for a signed-in user without permission) and the [asynchronous import](../import-export.md).

### Hub auto-update on startup

Registry embeds the Hub web app (Vue SPA) as a versioned ZIP and extracts it to `{StoragePath}/ClientApp/` on first run. Starting from Registry 2.x, the embedded Hub carries a `version.txt` marker; on every startup Registry compares it to the version on disk and, on any mismatch (upgrade **or** downgrade), wipes the folder and re-extracts the embedded build. No manual step is required after a `docker pull` or a binary swap.

Logs:

```
 -> Upgrading Hub: 2.0.0 -> 2.1.0
 ?> Hub folder is ok (v2.1.0)
```

To force a re-extraction (for instance after editing files inside `ClientApp/` for debugging) run with `--reset-hub`:

```bash
dotnet Registry.Web.dll ./registry-data --reset-hub
```

### Hub update notice in the browser

Once the server is upgraded, currently-loaded browser tabs still run the previous Hub bundle. The next call to `/sys/features` returns the new server version; the Hub detects the mismatch and forces a hard reload (the server already serves `index.html` with `Cache-Control: no-cache`). After the reload a one-shot dialog tells the user "DroneDB Hub has been updated", with links to the corresponding release pages on GitHub. The check is skipped in `embed` mode and during local development.

### Persisted branding across upgrades

Registry serves any file dropped under `{StoragePath}/branding/` from the URL prefix `/branding/`. This folder is **never touched by the Hub upgrade** - drop your logos, favicons, and `site.webmanifest` there and reference them from `AppSettings:HubOptions` (see [Hub UI Customization](./configuration.md#hub-ui-customization)).

```text
registry-data/
├── ClientApp/         # replaced on every Hub upgrade
├── branding/          # preserved across upgrades
│   ├── acme-banner.svg
│   ├── favicon.ico
│   └── site.webmanifest
└── appsettings.json
```

## Project architecture

![dronedb-registry-architecture](https://user-images.githubusercontent.com/7868983/151846022-891685f7-ef47-4b93-8199-d4ac4e788c5d.png)

### Key Components

- **Registry.Web**: ASP.NET Core web application
- **Registry.Adapters**: Database and DroneDB library adapters
- **Hub (Vue.js)**: Frontend SPA in `Registry.Web/ClientApp`
- **Hangfire**: Background job processing
