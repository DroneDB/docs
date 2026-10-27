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

:::note Long paths
Windows refuses a path of 260 characters or more unless it allows long paths. A build writes its
temporary files about 130 characters below the root of the dataset (the conversion of a point
cloud, for one), so a dataset in a deep folder fails to build without them. The programs of the
package (`ddb`, `bm3d`, `metadata-util`, `untwine`) declare themselves long path aware, but Windows
has to allow it. As an administrator, in PowerShell:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -PropertyType DWord -Value 1 -Force
```

(or enable the group policy *Enable Win32 long paths*), then start the programs again. Without it,
keep the root of a dataset under about 130 characters. A program that loads `ddb.dll` itself takes
long paths only if its own executable is long path aware too, and code that keeps a path in a fixed
buffer of 260 characters is not helped by the setting.
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

:::warning macOS users
On macOS, do not bind-mount a local folder to `/data`. Use a named volume instead:

```bash
docker run -it --rm -p 5000:5000 -v registry-data:/data dronedb/registry
```

See [macOS: use a named volume](../registry/getting-started.md#macos-use-a-named-volume).
:::

:::warning Apple Silicon (M1 to M4) and other ARM computers
The image is built for `linux/amd64` only. If Docker stops with `no matching manifest for linux/arm64/v8`,
add `--platform linux/amd64` to the command. See
[Apple Silicon and other ARM computers](../registry/getting-started.md#apple-silicon-and-other-arm-computers).
:::

Open [http://localhost:5000](http://localhost:5000) in your browser.

**Default credentials**: `admin` / `password123`

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
