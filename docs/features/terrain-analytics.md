---
sidebar_position: 6
sidebar_label: Terrain Analytics
---

# Terrain Analytics

DroneDB provides a set of tools for analysing elevation data - DEMs, DSMs, and DTMs - directly in the CLI and in Hub. No GIS software required.

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
| `-s, --simplify` | Geometry simplification tolerance in raster CRS units (0 = disabled) |
| `--band` | Band index (1-based, default: 1) |
| `-o, --output` | Output GeoJSON path |

### Examples

```bash
# Contours every 10 m, simplified to 1 m
ddb contour dem.tif -o contours.geojson -i 10 -s 1

# 20 evenly spaced levels
ddb contour dem.tif -o contours.geojson -n 20

# Clip to a specific range before contouring
ddb contour dem.tif -o contours.geojson -i 5 --min 0 --max 200
```

In Hub, open a DEM dataset, click the **Contour Lines** toolbar button, adjust the interval and smoothing, and the contours are overlaid on the map interactively.

## Stockpile detection & volume

### Auto-detecting stockpiles

Click anywhere on a DEM in Hub to detect the nearest stockpile footprint. The result is a GeoJSON polygon with a volume estimate and a confidence score. The library (`DDBDetectAllStockpiles`) and the API (`POST .../stockpile/detect-all`) can also scan the entire DEM and return all detected stockpiles sorted by estimated volume; the Hub detects one pile at a time.

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
| `flat` | Horizontal plane at a given elevation (`flatElevation`, default 0). The Hub uses 0: use it only with a height-above-ground raster |

In Hub, open a DEM dataset, click the **Stockpile Volume** toolbar button, then:

- **Click** to auto-detect the stockpile under the cursor
- **Draw polygon** to manually define the area

The results panel shows cut, fill, net, 2D area, and 3D area. The pile is added to the measurements of the map: save it with the **Save Measurements** button of the map toolbar.

### Weight and cost

Select a **Material** in the panel to see the weight and the estimated cost of the pile:

- **Weight** = the larger of the cut volume and the net volume (a pit has a negative net volume) × the density of the material.
- **Est. cost** = the weight × the price of the material per tonne.

The panel weighs the pile again when you select another material, also after the volume is calculated. A saved pile keeps the material it was weighed with: its name, its density, its price per tonne and the currency, with the weight and the cost.

The materials are yours: **Edit materials…** in the panel opens the **Stockpiles** tab of the [Preferences](/docs/registry/preferences#stockpiles). There you can change the density and the price of each built-in material, hide the materials you do not use, add your own materials, and set the currency. For one pile only, select **+ Custom…** and type a density and a price.

The built-in materials have typical values:

| Material | Category | Density (t/m³) | Price per tonne |
|----------|----------|----------------|-----------------|
| Gravel | Aggregate | 1.68 | 15 |
| Sand | Aggregate | 1.60 | 12 |
| Topsoil | Soil | 1.30 | 20 |
| Clay | Soil | 1.70 | 10 |
| Crushed Rock | Aggregate | 1.60 | 18 |
| Asphalt | Paving | 2.24 | 95 |
| Concrete | Paving | 2.40 | 85 |
| Coal | Mining | 0.85 | 70 |
| Iron Ore | Mining | 2.50 | 110 |
| Limestone | Aggregate | 1.55 | 16 |
| Wood Chips | Organic | 0.30 | 40 |
| Snow | Other | 0.30 | 0 |
| Mixed Waste | Waste | 0.80 | 50 |
| Compost | Organic | 0.55 | 45 |
| Fly Ash | Industrial | 1.00 | 25 |

With imperial units (the **Units** tab of the Preferences), the panel and the Preferences show volumes in yd³, weights in short tons (ST), densities in ST/yd³ and prices per short ton. The values are stored in metric units, so a change of units does not change them.

## Elevation profile

Sample a raster along a line to plot an elevation or value chart.

In Hub, click the **Raster Profile** toolbar button, draw a line across the DEM, and an equispaced chart of elevation vs. distance is shown.

:::tip
Raster Profile, Contour Lines, and Stockpile Volume work on any single-band raster - DEMs, DSMs, DTMs, and single-band thermal GeoTIFFs.
:::
