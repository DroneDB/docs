---
sidebar_position: 9
sidebar_label: OGC 3D Tiles
---

# OGC 3D Tiles

DroneDB supports [OGC 3D Tiles](https://www.ogc.org/standard/3dtiles/) for efficient streaming of large 3D models in the browser. 3D Tiles can be generated from existing OBJ/glTF/GLB models, or ingested directly as `.3tz` archives (ZIP-packaged 3D Tiles with `tileset.json` at the root).

## Supported formats

| Format | Extension | Description |
|--------|-----------|-------------|
| **OBJ** | `.obj` | Wavefront 3D model (requires MTL + textures) |
| **glTF** | `.gltf` / `.glb` | GL Transmission Format |
| **3D Tiles archive** | `.3tz` | ZIP archive containing a `tileset.json` and associated tile files |

## Entry types

- A `.3tz` archive is indexed as a **`Tiles3D`** entry.
- An OBJ/glTF/GLB file is indexed as a **`Model`** entry.

When a `Model` entry is built, DroneDB generates a Nexus (NXS/NXZ) stream as the primary artifact and **co-produces an additive OGC 3D Tiles tileset** in a sibling `3dtiles/` folder as a best-effort artifact for the unified 3D viewer.

## Generating 3D Tiles from the CLI

Use the `ddb 3dtiles` command (requires the optional Obj2Tiles binary):

```bash
# Generate a 3D Tiles tileset next to the input
ddb 3dtiles model.obj

# Specify an output directory
ddb 3dtiles model.obj ./3dtiles

# Force a local (non-georeferenced) tileset
ddb 3dtiles model.obj ./3dtiles --local

# Explicitly set a WGS84 origin
ddb 3dtiles model.obj ./3dtiles --lat 43.7 --lon 10.4 --alt 50
```

### Georeferencing

By default, `ddb 3dtiles` auto-detects georeferencing from sidecar files next to the input model (following the ODM/Obj2Tiles convention). You can override this with `--lat`/`--lon`/`--alt`, or force a local/engineering coordinate system with `--local`.

## Ingesting a `.3tz` archive

Add a `.3tz` file to a DroneDB index like any other file:

```bash
ddb add my-tileset.3tz

# Build extracts the archive and prepares it for streaming
ddb build
```

During build, the `.3tz` archive is extracted into `build/{hash}/3dtiles/` and validated to ensure `tileset.json` is present at the archive root.

## In Hub / Registry

3D Tiles are rendered by the unified 3D viewer (powered by [giro3d](https://giro3d.org/)):

- **Progressive streaming**: Tiles load at multiple levels of detail based on camera distance.
- **Georeferenced placement**: Georeferenced tilesets are placed on the Earth ellipsoid (ECEF).
- **Unified viewer**: The same viewer handles 3D Tiles, Gaussian Splats, point clouds, and rasters.

## Build requirements

3D Tiles generation depends on the **Obj2Tiles** binary from [OpenDroneMap](https://github.com/OpenDroneMap/Obj2Tiles). The DroneDB build scripts attempt to download it automatically; see [Building from Source](/docs/contributing/building-from-source#obj2tiles-ogc-3d-tiles-generator-optional) for manual setup. If Obj2Tiles is unavailable, 3D Tiles generation is skipped and other artifacts (NXS, COPC, COG, etc.) still complete normally.
