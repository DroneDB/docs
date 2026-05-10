---
sidebar_position: 6
description: 'How to build DroneDB from source on Windows and Linux'
---

# Building from Source

DroneDB uses **vcpkg** for dependency management and **CMake** for building.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| C++17 compiler (GCC / Clang / MSVC) | GCC 9+, Clang 9+, MSVC 2019+ |
| CMake | 3.21+ |
| Python | 3.x |
| Git | any recent version |
| Visual Studio (Windows only) | 2019+ with "Desktop development with C++" workload |

## Windows

### Quick Start

```powershell
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg; .\bootstrap-vcpkg.bat; cd ..
git clone --recurse-submodules https://github.com/DroneDB/DroneDB.git
cd DroneDB
.\full-build-win.ps1
```

### Build Script Parameters

`full-build-win.ps1` automatically detects Visual Studio, configures CMake, and builds with Ninja.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `-BuildType` | String | `Debug` | `Debug`, `Release`, `RelWithDebInfo`, or `MinSizeRel` |
| `-Clean` | Switch | `false` | Delete CMake cache and build artifacts before building |
| `-SkipTests` | Switch | `false` | Disable test compilation |
| `-Jobs` | Int | CPU cores | Parallel build jobs |

```powershell
# Debug build (default)
.\full-build-win.ps1

# Release build
.\full-build-win.ps1 -BuildType Release

# Clean Release build with 8 jobs
.\full-build-win.ps1 -BuildType Release -Clean -Jobs 8
```

### Build Output

| File | Description |
|------|-------------|
| `build/ddbcmd.exe` | Command-line tool |
| `build/ddb.dll` | Core library |
| `build/ddbtest.exe` | Test suite |
| `build/untwine.exe` | COPC accelerator *(optional, see below)* |

---

## Linux

### Quick Start

```bash
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg && ./bootstrap-vcpkg.sh && cd ..
git clone --recurse-submodules https://github.com/DroneDB/DroneDB.git
cd DroneDB
./full-build-linux.sh
```

### Build Script Arguments

`full-build-linux.sh` accepts an optional first positional argument to set the build type (default: `Release`).

```bash
# Release build (default)
./full-build-linux.sh

# Debug build
./full-build-linux.sh Debug
```

Accepted values follow CMake conventions: `Release`, `Debug`, `RelWithDebInfo`, `MinSizeRel`.

### Build Output

| File | Description |
|------|-------------|
| `build/ddbcmd` | Command-line tool |
| `build/libddb.so` | Core library |
| `build/ddbtest` | Test suite |
| `build/untwine` | COPC accelerator *(optional, see below)* |

---

## Untwine COPC Accelerator (optional)

[Untwine](https://github.com/hobuinc/untwine) is an optional component that dramatically accelerates the generation of **Cloud Optimized Point Clouds (COPC)** from LAS/LAZ files. It is included as a git submodule under `vendor/untwine`.

If the submodule is not present, DroneDB automatically falls back to the built-in PDAL `writers.copc` pipeline — no configuration required.

### Enabling Untwine

```bash
# Initialise the submodule
git submodule update --init vendor/untwine

# Then run the build script as usual
.\full-build-win.ps1               # Windows
./full-build-linux.sh              # Linux
```

### Configuration Consistency

:::warning
Untwine **must** be built with the **same build type** as DroneDB.

Both executables share vcpkg-managed shared libraries (pdalcpp, gdal, proj, …). Mixing configurations — e.g. DroneDB in `Debug` and Untwine in `Release` — links them against different C runtimes, causing a crash at startup.
:::

The build scripts enforce this automatically: `full-build-win.ps1` passes `-BuildType` to both CMake invocations, and `full-build-linux.sh` passes the same first argument to both.

A Untwine build failure is **non-blocking**: the scripts print a warning and DroneDB continues to work using the PDAL fallback.

---

## Running Tests

```bash
# Linux
cd build && ./ddbtest --gtest_shuffle

# Windows
cd build && .\ddbtest.exe --gtest_shuffle
```

The `--gtest_shuffle` flag is strongly recommended to detect hidden inter-test dependencies.

---

## Troubleshooting

### Visual Studio not found (Windows)
- Install Visual Studio with the **Desktop development with C++** workload.
- Or set the `VSINSTALLDIR` environment variable to point to the installation root.

### CMake not found (Windows)
- Download from [cmake.org/download](https://cmake.org/download/) or install via the Visual Studio Installer under *Individual Components → CMake*.

### Build fails with LNK1105 / file-in-use error (Windows)
Close any process that might hold `ddb.lib` open (running `ddbcmd.exe`, Visual Studio debugger, etc.) and retry.

### ddbcmd crashes immediately after a Debug → Release switch (or vice versa)
Delete the `build/` directory and rebuild from scratch so all DLLs are refreshed to the correct variant.

### Untwine submodule missing
```bash
git submodule update --init vendor/untwine
```
