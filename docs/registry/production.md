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
