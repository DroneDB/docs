---
sidebar_position: 1
sidebar_label: Overview
---

# Advanced Features

DroneDB provides a range of advanced features beyond basic data management.

## Raster processing

- **[Multispectral & Thermal](/docs/features/multispectral)** - Support for multispectral, hyperspectral, and thermal datasets with vegetation index rendering and thermal colormaps
- **[Terrain Analytics](/docs/features/terrain-analytics)** - Tools for analyzing elevation data (DEMs, DSMs, DTMs) including contour lines, stockpile detection, and volume calculation
- **[Raster Alignment](/docs/features/raster-alignment)** - Align a source GeoTIFF to a reference raster, correcting georeferencing offsets via similarity or translation transforms
- **[Georaster Processing](/docs/features/georaster-processing)** - Border masking, raster export with visualization params, elevation profiles, nodata handling, and area statistics

## 3D visualization

- **[Gaussian Splats](/docs/features/gaussian-splat)** - 3D Gaussian Splatting support (PLY, SPZ, SPLAT, KSPLAT) with progressive LOD streaming
- **[Vector Processing](/docs/features/vector-processing)** - Vector data indexing, MVT tile generation, GeoPackage with spatial index, and multi-layer support

## Data integration

- **[Archive Extraction](/docs/features/archive-extraction)** - Upload and extract ZIP archives directly into a dataset, with automatic file indexing
- **[Photogrammetry Integration](/docs/features/photogrammetry-integration)** - Send drone images to a remote NodeODM/ODX processing node and retrieve results
- **[Bulk Operations](/docs/features/bulk-operations)** - Bulk download (ZIP), index rescan, cleanup stale entries, and database comparison (delta)
