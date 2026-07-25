---
sidebar_position: 10
sidebar_label: Gaussian Splats
---

# Gaussian Splats

DroneDB supports 3D Gaussian Splatting as a visualization format. Gaussian Splats provide photorealistic 3D scene reconstruction from drone imagery, with efficient streaming via the SPZ and RAD formats.

## Supported formats

| Format | Extension | Description |
|--------|-----------|-------------|
| **PLY (splat)** | `.ply` | Gaussian Splat in PLY format (content-detected) |
| **SPZ** | `.spz` | Compressed Gaussian Splat (Niants SPZ format) |
| **SPLAT** | `.splat` | Binary Gaussian Splat format |
| **KSPLAT** | `.ksplat` | KSplat compressed format |

:::note
PLY files are automatically classified as point clouds, 3D models, or Gaussian Splats based on their content.
:::

## Build pipeline

DroneDB converts Gaussian Splat sources into a streaming-optimized format:

1. **Source** (PLY, SPLAT, SPZ, or KSPLAT) is indexed
2. **SPZ** compressed archive is generated as a temporary input (`model.spz`)
3. **`build-lod`** converts the SPZ into a **RAD** level-of-detail container (`model.rad`) for progressive streaming

The RAD format enables the viewer to load coarse splats first and progressively refine the scene as the user navigates. After a successful build, the intermediate `.spz` file is removed; the only delivery artifact is `model.rad` (plus `bounds.json` and `georef.json` when georeferencing is available).

:::info Prerequisites
LOD streaming requires the `build-lod` binary. The DroneDB build scripts compile it automatically from the `vendor/spark` submodule if a Rust toolchain (`cargo`) is installed. Without `build-lod`, DroneDB can still serve plain SPZ files, but no RAD LOD streaming is available.
:::

## CLI

```bash
# Index a Gaussian Splat file
ddb add model.ply

# Build SPZ + RAD for streaming
ddb gsplat model.ply
```

The `gsplat` command converts the source file to SPZ format. When `build-lod` is available, the build pipeline then generates the RAD LOD container. A `GsplatGeoref` sidecar file (`georef.json`) is created with SRS and offset information following the ODM convention.

You can tune spherical-harmonics quantization with the `DDB_GSPLAT_SH_BITS` environment variable:

```bash
# Reduce SH bit depth to save bandwidth (values 1-8)
DDB_GSPLAT_SH_BITS=5 ddb gsplat model.ply

# Control first-band and remaining-bands bit depth independently
DDB_GSPLAT_SH_BITS=5,4 ddb gsplat model.ply
```

## In Hub

Gaussian Splats are rendered in the browser using the built-in splat viewer:

- **Progressive loading**: Coarse splats load first, refining as you navigate
- **Camera auto-framing**: The viewer automatically frames the scene using the RAD bounds
- **Georeferencing**: Splats are positioned in the correct geographic location using the sidecar georef data

## Georeferencing

Each Gaussian Splat entry includes a `georef.json` sidecar file with:

- **SRS**: Coordinate reference system (EPSG code or WKT)
- **Offset**: Translation offset for positioning the splat in geographic space

This follows the ODM (OpenDroneMap) convention for Gaussian Splat georeferencing.

## Workflow example

```bash
# 1. Index the Gaussian Splat output from ODX or another processor
ddb add model.ply

# 2. Build streaming format
ddb gsplat model.ply

# 3. Push to Hub
ddb push
```

The Hub viewer will automatically detect the Gaussian Splat entry and render it with the 3D splat viewer.
