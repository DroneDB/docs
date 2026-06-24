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

1. **Source** (PLY, SPLAT, or other) is indexed
2. **SPZ** compressed archive is generated (`model.spz`)
3. **RAD** level-of-detail container is built (`model.rad`) for progressive streaming

The RAD format enables the viewer to load coarse splats first and progressively refine the scene as the user navigates.

## CLI

```bash
# Index a Gaussian Splat file
ddb add model.ply

# Build SPZ + RAD for streaming
ddb gsplat model.ply
```

The `gsplat` command converts the source file to SPZ format and generates the RAD LOD container. A `GsplatGeoref` sidecar file (`georef.json`) is created with SRS and offset information following the ODM convention.

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
