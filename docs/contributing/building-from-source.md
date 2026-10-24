---
sidebar_position: 6
description: 'How to build DroneDB from source on Windows and Linux'
---

# Building from Source

DroneDB uses **vcpkg** for dependency management and **CMake** for building.

## Prerequisites

| Requirement | Version |
|-------------|---------|
| C++20 compiler (GCC / Clang / MSVC) | CI builds with GCC 13 (Ubuntu 24.04) and the MSVC of the current Windows runner |
| CMake | 3.21+ |
| Python | 3.x |
| Git | any recent version |
| Rust toolchain (`cargo`) | any recent stable version (required for Gaussian Splat LOD) |
| Visual Studio (Windows only) | 2022 or later with "Desktop development with C++" workload |

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
| `build/ddbcmd.exe` | Command-line tool (contains the library; it does not load `ddb.dll`) |
| `build/ddb.dll` | DroneDB library for host programs: exports the C API of `ddb.h` only |
| `build/ddb_unit_tests.exe` | Unit tests (offline) |
| `build/ddbtest.exe` | Integration tests |
| `build/untwine.exe` | COPC accelerator *(optional, see below)* |
| `build/build-lod.exe` | Gaussian Splat LOD producer *(optional, see below)* |
| `build/Obj2Tiles.exe` | OGC 3D Tiles generator *(optional, see below)* |
| `build/dwg2dxf.exe` | DWG to DXF converter *(optional, see below)* |

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
| `build/ddbcmd` | Command-line tool (contains the library; it does not load `libddb.so`) |
| `build/libddb.so` | DroneDB library for host programs: exports the C API of `ddb.h` only |
| `build/ddb_unit_tests` | Unit tests (offline) |
| `build/ddbtest` | Integration tests |
| `build/untwine` | COPC accelerator *(optional, see below)* |
| `build/build-lod` | Gaussian Splat LOD producer *(optional, see below)* |
| `build/Obj2Tiles` | OGC 3D Tiles generator *(optional, see below)* |
| `build/dwg2dxf` | DWG to DXF converter *(optional, see below)* |

---

## Version and C API files

DroneDB has one version for the library, its C ABI and the release: the `version` field of `package.json`. CMake generates `build/generated/include/ddb_version.h` from it at configure time (`DDB_VERSION_*`, and `DDB_ABI_MAJOR`/`DDB_ABI_MINOR`, the major and minor of the version). `cmake --install` installs the C API only: `ddb.h`, `ddb_export.h`, `ddb_version.h` and `ddb.symbols`.

`src/include/ddb.symbols` lists every exported function. CI fails when the library exports anything else, when the list changes without the matching version bump (a removed export needs a new major version, a new export at least a new minor), or when a `v*` tag differs from `package.json`. Check locally with:

```bash
python3 scripts/check-abi.py exports --library build/libddb.so   # the exported symbols equal the manifest (or build/ddb.dll)
python3 scripts/check-abi.py bump                                # vs the previous release tag: the matching version bump
python3 scripts/check-abi.py tag --tag v2.0.0                    # a release tag equals package.json
```

See [DroneDB Library (C API)](/docs/integrations/library) for the contract itself.

---

## Untwine COPC Accelerator (optional)

[Untwine](https://github.com/hobuinc/untwine) is an optional component that dramatically accelerates the generation of **Cloud Optimized Point Clouds (COPC)** from LAS/LAZ files. It is included as a git submodule under `vendor/untwine`.

If the submodule is not present, DroneDB automatically falls back to the built-in PDAL `writers.copc` pipeline - no configuration required.

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

Both executables share vcpkg-managed shared libraries (pdalcpp, gdal, proj, …). Mixing configurations - e.g. DroneDB in `Debug` and Untwine in `Release` - links them against different C runtimes, causing a crash at startup.
:::

The build scripts enforce this automatically: `full-build-win.ps1` passes `-BuildType` to both CMake invocations, and `full-build-linux.sh` passes the same first argument to both.

A Untwine build failure is **non-blocking**: the scripts print a warning and DroneDB continues to work using the PDAL fallback.

---

## Gaussian Splat LOD producer (`build-lod`, optional)

If the `vendor/spark` git submodule is initialised, the build script automatically compiles Spark's `build-lod` Rust CLI and places the binary next to `ddbcmd`. This binary is required for Gaussian Splat LOD streaming.

> **Prerequisite:** A Rust toolchain (`cargo`) must be installed. Download it from [rustup.rs](https://rustup.rs).

```bash
# Initialise the submodule
git submodule update --init vendor/spark

# Then run the build script as usual
.\full-build-win.ps1               # Windows
./full-build-linux.sh              # Linux
```

If `build-lod` is missing, DroneDB can still serve Gaussian Splats but without LOD streaming (plain `model.spz`).

---

## Obj2Tiles OGC 3D Tiles generator (optional)

[Obj2Tiles](https://github.com/OpenDroneMap/Obj2Tiles) generates OGC 3D Tiles (`tileset.json` + `b3dm`) from OBJ/glTF/GLB models. DroneDB invokes it via the `ddb 3dtiles` command and co-produces 3D Tiles automatically when building `Model` entries.

The DroneDB build scripts attempt to download a precompiled Obj2Tiles binary automatically. You can also download it manually and place it next to `ddbcmd`:

```powershell
# Windows
.\scripts\download-obj2tiles.ps1 -TargetDir build
```

```bash
# Linux
./scripts/download-obj2tiles.sh build
```

If Obj2Tiles is unavailable, 3D Tiles generation is skipped as a best-effort artifact; Nexus output and other builds still complete normally.

---

## LibreDWG `dwg2dxf` DWG converter (optional)

[GNU LibreDWG](https://www.gnu.org/software/libredwg/) `dwg2dxf` converts DWG drawings to DXF before DroneDB builds them. It is GPL-3.0-or-later and runs only as a separate process. `scripts/build-libredwg.sh` downloads the release pinned in `scripts/libredwg-version`, verifies its GNU signature, and builds a static binary next to `ddbcmd`. You need `curl`, `gpg`, `pkg-config` and a C toolchain.

```bash
# Linux
./scripts/build-libredwg.sh build

# Windows binary, cross-compiled on Linux (needs mingw-w64)
./scripts/build-libredwg.sh build "" x86_64-w64-mingw32
```

```powershell
# Windows, natively in MSYS2 (MINGW64)
.\scripts\build-libredwg.ps1 -TargetDir build
```

`full-build-linux.sh` runs the script automatically and continues if it fails. Without the converter, DWG builds fail with a message that names it; all other formats are unaffected. The real-converter tests in `ddbtest` skip when it is missing. Set `DDB_DWG2DXF_PATH` to use a binary in another location.

---

## Running Tests

The tests are split into offline unit tests (`ddb_unit_tests`) and integration tests (`ddbtest`, which downloads test data). Run them through ctest from the build folder, by label:

```bash
cd build
ctest -L unit -j 8            # offline unit tests, in parallel
ctest -L integration          # integration tests
ctest -LE slow                # everything but the slow tests
ctest -L cli                  # the ddb command line
ctest -L headers              # every installed header compiles on its own
ctest -L shared               # libddb loaded by a host through the C API
```

Each test process works in its own folder under `<temp>/ddb_test_areas/`, removed when it ends (kept after a failure), so concurrent runs do not interfere. Test data downloads go to a shared cache: `DDB_TEST_CACHE_DIR`, else `<temp>/ddb_test_cache`.

You can still run a binary directly:

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
