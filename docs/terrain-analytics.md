---
sidebar_position: 6
sidebar_label: Terrain Analytics
---

# Terrain Analytics

DroneDB provides a set of tools for analysing elevation data — DEMs, DSMs, and DTMs — directly in the CLI and in Hub. No GIS software required.

## Contour lines

Generate GeoJSON contour lines from any single-band elevation raster:

```bash
ddb contour dem.tif -o contours.geojson
```

### Options

| Option | Description |
|--------|-------------|
| `-i, --interval` | Contour interval in raster units (default: auto) |
| `-n, --count` | Number of contour levels (alternative to `--interval`) |
| `-b, --base` | Base offset for the first contour level |
| `--min` | Ignore values below this threshold |
| `--max` | Ignore values above this threshold |
| `-t, --tolerance` | Douglas-Peucker simplification tolerance (0 = disabled) |
| `--band` | Band index (1-based, default: 1) |
| `-o, --output` | Output GeoJSON path |

### Examples

```bash
# Contours every 10 m, simplified to 1 m
ddb contour dem.tif -o contours.geojson -i 10 -t 1

# 20 evenly spaced levels
ddb contour dem.tif -o contours.geojson -n 20

# Clip to a specific range before contouring
ddb contour dem.tif -o contours.geojson -i 5 --min 0 --max 200
```

In Hub, open a DEM dataset, click the **Contour Lines** toolbar button, adjust the interval and smoothing, and the contours are overlaid on the map interactively.

## Stockpile detection & volume

### Auto-detecting stockpiles

Click anywhere on a DEM in Hub to detect the nearest stockpile footprint. The result is a GeoJSON polygon with a volume estimate and a confidence score. You can also scan the entire DEM to return all detected stockpiles sorted by estimated volume.

### Volume calculation

For any polygon region on a DEM, DroneDB computes:

| Value | Description |
|-------|-------------|
| **Cut volume** | Material above the base plane (to be removed) |
| **Fill volume** | Material below the base plane (void to be filled) |
| **Net volume** | Cut minus fill |
| **2D area** | Projected horizontal area of the polygon |
| **3D area** | Surface area of the terrain within the polygon |

### Base plane methods

| Method | Description |
|--------|-------------|
| `lowest_perimeter` | Lowest elevation point on the polygon boundary |
| `average_perimeter` | Mean elevation of the polygon boundary |
| `best_fit` | Least-squares plane fitted to the boundary points |
| `flat` | Horizontal plane at the minimum elevation |

In Hub, open a DEM dataset, click the **Stockpile Volume** toolbar button, then:

- **Click** to auto-detect the stockpile under the cursor
- **Draw polygon** to manually define the area
- **Scan all** to detect every stockpile in the DEM at once

The results panel shows cut, fill, net, 2D area, and 3D area.

## Elevation profile

Sample a raster along a line to plot an elevation or value chart.

In Hub, click the **Raster Profile** toolbar button, draw a line across the DEM, and an equispaced chart of elevation vs. distance is shown.

:::tip
Raster Profile, Contour Lines, and Stockpile Volume work on any single-band raster — DEMs, DSMs, DTMs, and single-band thermal GeoTIFFs.
:::
