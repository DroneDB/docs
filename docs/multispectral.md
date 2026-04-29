---
sidebar_position: 5
sidebar_label: Multispectral & Thermal
---

# Multispectral & Thermal Imagery

DroneDB supports multispectral, hyperspectral, and thermal datasets. Files are indexed with full band metadata, processed into Cloud-Optimized GeoTIFFs, and visualized in Hub with vegetation index rendering and thermal colormaps.

## Supported data types

| Type | Description |
|------|-------------|
| **Multispectral** | Multi-band images with named spectral bands (e.g. Red, Green, NIR, RedEdge) |
| **Hyperspectral** | High band-count imagery with narrow spectral channels |
| **Thermal (R-JPEG)** | FLIR-style JPEG files with embedded raw radiometric data |
| **Thermal GeoTIFF** | Georeferenced rasters containing direct temperature values |

## Sensor profiles

DroneDB ships with a built-in `sensor-profiles.json` that describes band layout, wavelengths, and default render presets for common sensors:

- MicaSense RedEdge-M / RedEdge-MX / Altum
- DJI P4 Multispectral
- Parrot Sequoia
- FLIR thermal cameras (detection via EXIF make/model)

When a multispectral or thermal file is indexed, DroneDB matches it against the sensor profile database using band count, data type, and XMP/EXIF metadata patterns. The matched profile determines the default band-to-RGB mapping and the available render presets.

Custom or unsupported sensors are handled as generic multi-band rasters. Band names and wavelengths may be inferred from XMP metadata if present (DJI, MicaSense).

## Indexing

Add multispectral or thermal files the same way as any other file:

```bash
ddb add *.tif
```

DroneDB extracts the following metadata at index time:

- Band count, data type, band names, and central wavelengths
- Sensor profile match (if any)
- For thermal R-JPEGs: Planck calibration constants, emissivity, and temperature range
- Spatial extent, CRS, and ground sample distance

## Vegetation indices

When a multispectral raster is displayed in Hub, the viewer computes vegetation indices on the fly from the available bands. The set of available indices depends on which band types the sensor provides.

| Index | Required bands | Description |
|-------|----------------|-------------|
| NDVI  | R, NIR | Normalized Difference Vegetation Index |
| NDRE  | RedEdge, NIR | Normalized Difference RedEdge Index |
| GNDVI | G, NIR | Green Normalized Difference Vegetation Index |
| EVI   | R, G, NIR | Enhanced Vegetation Index |
| SAVI  | R, NIR | Soil-Adjusted Vegetation Index |
| OSAVI | R, NIR | Optimized SAVI |

Results are displayed with a configurable colormap (viridis, RdYlGn, etc.).

## Thermal images

Thermal R-JPEG files (produced by DJI Zenmuse XT/XT2, FLIR Vue, and others) are detected automatically. The viewer shows:

- Colormap rendering with selectable palettes (iron, rainbow, grayscale, terrain, greys, etc.)
- Per-pixel temperature on hover
- Temperature range (min/max) and calibration metadata in the detail panel

Temperature values are derived from the raw 16-bit sensor data using the Planck calibration constants embedded in the file's EXIF metadata. Emissivity, reflected apparent temperature, atmospheric parameters, and IR window transmission are all taken into account.

For georeferenced thermal GeoTIFFs (e.g. ODM orthophoto output), the raster is treated as containing direct temperature values in degrees Celsius and rendered accordingly.

:::note Raster value APIs
The underlying APIs for sampling raster values, querying temperature ranges, and computing area statistics are generic and work on any single-band raster — DEMs, DSMs, and thermal sources alike. See [Terrain Analytics](./terrain-analytics) for elevation-specific tools.
:::

## CLI commands

### Merging single-band files into a multi-band COG

After photogrammetry software produces one GeoTIFF per band, use `merge-multispectral` to combine them into a single Cloud-Optimized GeoTIFF:

```bash
ddb merge-multispectral -o merged.tif blue.tif green.tif red.tif nir.tif rededge.tif
```

The command reprojects and resamples all inputs to a common CRS, resolution, and extent before merging. Band order in the output matches the order of the input files.

**Validate without merging:**

```bash
ddb merge-multispectral --validate blue.tif green.tif red.tif nir.tif rededge.tif
```

The `--validate` flag checks CRS compatibility, data type consistency, and alignment. It outputs a JSON report including any detected band shifts:

```json
{
  "ok": true,
  "errors": [],
  "warnings": [],
  "summary": {
    "totalBands": 5,
    "dataType": "Float32",
    "width": 4000,
    "height": 3000
  },
  "alignment": {
    "detected": true,
    "maxShiftPixels": 2.3,
    "correctionApplied": true,
    "shiftSource": "xmp",
    "bands": [
      { "index": 0, "name": "Blue", "wavelength": 475, "shiftX": 0, "shiftY": 0 },
      { "index": 1, "name": "Green", "wavelength": 560, "shiftX": 1.1, "shiftY": -0.8 }
    ]
  }
}
```

### Masking orthophoto borders

`mask` removes black or white border pixels from an orthophoto by making them transparent:

```bash
ddb mask orthophoto.tif
# outputs orthophoto_masked.tif

ddb mask orthophoto.tif -o output.tif -n 20
ddb mask orthophoto.tif -w          # search for white borders instead of black
ddb mask orthophoto.tif -c 128,0,0  # custom border color
```

| Option | Description |
|--------|-------------|
| `-o, --output` | Output path (default: `<input>_masked.tif`) |
| `-n, --near` | Tolerance in grey levels (default: 15) |
| `-w, --white` | Treat white as the border color |
| `-c, --color` | Custom border color as `r,g,b` |

## Workflow example

A typical flow for multispectral survey data processed with OpenDroneMap:

```bash
# 1. Index the original raw captures
ddb add images/

# 2. Merge per-band orthophotos from ODM output
ddb merge-multispectral \
  -o odm_orthophoto/multispectral.tif \
  odm_orthophoto/odm_orthophoto_blue.tif \
  odm_orthophoto/odm_orthophoto_green.tif \
  odm_orthophoto/odm_orthophoto_red.tif \
  odm_orthophoto/odm_orthophoto_nir.tif \
  odm_orthophoto/odm_orthophoto_rededge.tif

# 3. Mask border pixels
ddb mask odm_orthophoto/multispectral.tif

# 4. Add the merged result to the index
ddb add odm_orthophoto/multispectral_masked.tif

# 5. Share or push to Hub
ddb push
```

Hub will detect the sensor profile, display all five bands, and offer NDVI/NDRE rendering out of the box.

:::tip
For thermal surveys, skip step 2 and 3. Add the thermal R-JPEGs directly: DroneDB extracts calibration data and temperature values at index time.
:::
