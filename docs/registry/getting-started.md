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
This configuration uses SQLite as the database. For production environments with high load, use MySQL/MariaDB as described in the [MySQL/MariaDB Configuration](./configuration.md#use-mysql--mariadb-instead-of-sqlite) section.
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
