---
sidebar_position: 7
sidebar_label: Raster Alignment
---

# Raster Alignment (Coregistration)

Align a source GeoTIFF (orthophoto or DEM) to a reference GeoTIFF, correcting georeferencing offsets caused by GPS drift, lens distortion, or processing artifacts.

## How it works

DroneDB uses two alignment modes, both based on template matching between the source and reference raster:

| Mode | Degrees of Freedom | Algorithm | Best for |
|------|-------------------|-----------|----------|
| **Similarity** (default) | 4 (translation X/Y, rotation, uniform scale) | NCC template matching + RANSAC | General misalignment, rotation, scale drift |
| **Translation** | 2 (translation X/Y only) | Phase correlation | Small GPS offsets, faster execution |

The aligned output is written as a Cloud-Optimized GeoTIFF (COG) reprojected to EPSG:3857 (Web Mercator).

## CLI

```bash
ddb align -i source.tif -r reference.tif -o aligned.tif
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --input` | Source GeoTIFF to align (required) |
| `-r, --reference` | Reference GeoTIFF (required) |
| `-o, --output` | Output path for aligned COG (required) |
| `-m, --mode` | Alignment mode: `similarity` (default) or `translation` |
| `--validate` | Validate alignment parameters without writing output |
| `--no-seed` | Disable phase-correlation seed (use only NCC template matching) |

### Validate without applying

Check if alignment is feasible and preview the estimated transform:

```bash
ddb align -i source.tif -r reference.tif --validate
```

The command outputs a JSON report with CRS compatibility, overlap percentage, GSD comparison, and estimated shift values.

### Examples

```bash
# Align orthophoto to a high-accuracy reference (default similarity mode)
ddb align -i orthophoto.tif -r reference.tif -o aligned.tif

# Translation-only alignment (faster, for small GPS offsets)
ddb align -i orthophoto.tif -r reference.tif -o aligned.tif -m translation

# Validate without applying
ddb align -i orthophoto.tif -r reference.tif --validate
```

## In Hub

Open a dataset containing at least two GeoRaster entries. Select one as the source and another as the reference, then use the **Align Raster** toolbar button or processing task. The aligned result is added to the dataset as a new COG entry.

## Pre-flight checks

Before alignment, DroneDB validates:

- **CRS compatibility**: Source and reference must share the same or compatible coordinate reference systems
- **Overlap**: Rasters must have sufficient spatial overlap (minimum 20% by default)
- **GSD comparison**: Ground sample distance should be within a reasonable ratio
- **Raster type**: Both inputs must be single-band or multi-band rasters of the same type

## Use cases

- **Correct GPS drift**: Align an orthophoto generated from drone imagery to a survey-grade reference
- **Match multiple surveys**: Coregister orthophotos from different flights to the same coordinate frame
- **DEM alignment**: Align a processed DEM to a reference elevation model for accurate volume calculations
