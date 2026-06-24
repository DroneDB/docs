---
sidebar_position: 9
sidebar_label: Georaster Processing
---

# Georaster Processing

DroneDB provides tools for processing and analyzing georeferenced rasters -- orthophotos, DEMs, multispectral imagery, and thermal data.

## Border Masking

Remove black or white border pixels from an orthophoto by making them transparent. This is useful for orthomosaics that have empty areas around the survey footprint.

### CLI

```bash
ddb mask orthophoto.tif
# outputs orthophoto_masked.tif
```

| Option | Description |
|--------|-------------|
| `-o, --output` | Output path (default: `<input>_masked.tif`) |
| `-n, --near` | Tolerance in grey levels (default: 15) |
| `-w, --white` | Treat white as the border color instead of black |
| `-c, --color` | Custom border color as `r,g,b` |

### Examples

```bash
# Remove black borders (default)
ddb mask orthophoto.tif

# Custom tolerance and output path
ddb mask orthophoto.tif -o output.tif -n 20

# Search for white borders
ddb mask orthophoto.tif -w

# Custom border color (dark blue)
ddb mask orthophoto.tif -c 0,0,128
```

### In Hub

Use the **Mask Borders** toolbar button on a GeoRaster entry. The masked result is added to the dataset as a new COG.

## Raster Export

Export a raster as a GeoTIFF with custom visualization parameters (band selection, formula, colormap, rescale). Useful for generating false-color composites or vegetation index maps.

### In Hub

Open a multispectral or thermal raster, adjust the visualization settings (preset, bands, formula, colormap), and click **Export** to download the result as a GeoTIFF.

### Parameters

| Parameter | Description |
|-----------|-------------|
| **Preset** | Visualization preset (true color, false color, NDVI, etc.) |
| **Bands** | Custom band mapping (R, G, B channel assignment) |
| **Formula** | Vegetation index formula (NDVI, NDRE, etc.) |
| **Colormap** | Color map for single-band output (viridis, RdYlGn, iron, etc.) |
| **Rescale** | Min/max value range for stretching |

## Raster Profile

Sample a single-band raster along a line to produce an elevation or value chart.

### CLI

The raster profile functionality is available through the Hub interface and the API.

### In Hub

1. Open a DEM, DSM, DTM, or thermal GeoTIFF
2. Click the **Raster Profile** toolbar button
3. Draw a line across the raster
4. An equispaced chart of value vs. distance (in meters) appears

The profile samples up to 4096 points along the line, clamped between 2 and 4096 based on the line length.

## Nodata Handling

DroneDB automatically detects and handles nodata values in rasters:

- **Alpha band**: Pixels with alpha = 0 are treated as nodata
- **Per-band nodata**: The `NODATA` value stored in the GeoTIFF metadata is respected
- **Pre-masking**: Nodata pixels are set to a sentinel value before processing (tiling, statistics, etc.)

This ensures that transparent borders, masked areas, and invalid pixels do not affect statistics, thumbnails, or tile generation.

## Raster Area Statistics

Compute statistics over a rectangular region of a raster:

| Statistic | Description |
|-----------|-------------|
| **Min** | Minimum value in the region |
| **Max** | Maximum value in the region |
| **Mean** | Average value |
| **StdDev** | Standard deviation |
| **Median** | Median value |

Available for any single-band raster (DEMs, thermal, multispectral bands). In Hub, draw a rectangle on the map to see the statistics panel.

:::tip
Raster Profile, Area Statistics, and Border Masking work on any GeoRaster -- orthophotos, DEMs, multispectral imagery, and thermal data.
:::
