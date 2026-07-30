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

### Adaptive Tile Hierarchy

DroneDB uses a **face-count-driven heuristic** to select the right tile hierarchy depth for each model, rather than a single one-size-fits-all tile configuration. Small models (&lt;10K faces) produce a single tile at the finest level of detail, avoiding unnecessary build time. Large models get progressively deeper splits. The hierarchy depth is hard-capped at **6** (≤ 4096 finest-LOD tiles) so that no model, regardless of size, can produce an unbounded number of `.b3dm` files.

| Model Size | Faces | Tile Hierarchy Depth | Max Tiles (finest LOD) |
|------------|-------|---------------------|------------------------|
| Tiny | < 10K | 0 | 1 |
| Small | 10K–50K | 1 | 4 |
| Medium | 50K–200K | 2 | 16 |
| Large | 200K–750K | 4 | 256 |
| XL | 750K–3M | 5 | 1024 |
| XXL | 3M–12M | 5 | 1024 |
| Massive | > 12M | 6 (capped) | 4096 |

In debug/testing scenarios, you can skip the heuristic and force the default parameters:

```bash
# Skip adaptive sizing; use defaults (divisions=3, lods=3, octree=true)
ddb 3dtiles model.obj ./3dtiles --force-defaults
```

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
