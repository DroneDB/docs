---
sidebar_position: 2
sidebar_label: Installation
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

This page covers installing both the DroneDB CLI and Registry.

## CLI Installation

The `ddb` command-line tool provides local data management capabilities.

<Tabs>
  <TabItem value="windows" label="Windows" default>

- Download [the latest release](https://github.com/DroneDB/DroneDB/releases/latest) from GitHub
- Extract the archive and add the folder to your PATH
- Verify it's working:

```bash
C:\> ddb --version
x.x.x (git commit xxxxxxx)
```

:::note
The version number will vary depending on the release you downloaded.
:::

  </TabItem>
  <TabItem value="linux" label="Linux (Debian/Ubuntu)">

Download the `.deb` package from the [latest release](https://github.com/DroneDB/DroneDB/releases/latest) and install it:

```bash
$ sudo dpkg -i dronedb_x.x.x_amd64.deb
$ ddb --version
x.x.x (git commit xxxxxxx)
```

:::note
Only Debian-based distributions (Debian, Ubuntu, Linux Mint, etc.) are officially supported.
:::

  </TabItem>
</Tabs>

## Registry Installation

Registry is the web-based platform for hosting and sharing datasets.

### Docker (Recommended)

The fastest way to get started is with Docker:

```bash
docker run -it --rm -p 5000:5000 -v ${PWD}/registry-data:/data dronedb/registry
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

**Default credentials**: `admin` / `password`

:::warning
Change the default password immediately after first login at [http://localhost:5000/account](http://localhost:5000/account)
:::

### Native Installation

1. Install the latest version of the [DroneDB library](https://github.com/DroneDB/DroneDB/releases/latest) and add it to PATH
2. Download the [latest Registry release](https://github.com/DroneDB/Registry/releases/latest) for your platform
3. Run:

```bash
./Registry.Web ./registry-data
```

See [Registry Getting Started](/docs/registry/getting-started) for more details.

## Building from Source

If you need to build DroneDB from source (e.g., for development or custom configurations):

- See [Building from Source](/docs/contributing/building-from-source)
