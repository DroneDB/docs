---
sidebar_position: 3
sidebar_label: Examples
---

# CLI Examples

Practical examples of common DroneDB CLI workflows.

## Glob Patterns

`ddb` accepts shell-style glob patterns wherever a path or list of paths is expected:

| Pattern | Matches |
|---------|---------|
| `*.JPG` | All `.JPG` files in the current directory |
| `images/*.tif` | All `.tif` files directly under `images/` |
| `**/*.las` | All `.las` files recursively |
| `images/**/*` | All files under `images/`, recursively |
| `images/` | The directory itself plus everything under it |

Some shells (POSIX shells, PowerShell) expand globs before passing them to `ddb`. Quote the pattern (e.g., `'**/*.JPG'`) if you want `ddb` to handle the expansion.

## Sharing Datasets

Share images to [Hub](https://hub.dronedb.app) or a self-hosted Registry:

```bash
# Share to Hub (default)
ddb share *.JPG

# Share to a specific server
ddb share *.JPG -s http://localhost:5000

# Share with a specific tag
ddb share *.JPG -t my-org/my-dataset
```

Tags follow the format: `[server]/organization/dataset` (server is optional).

## Clone, Edit, and Push Workflow

Clone an existing dataset, make modifications offline, then sync back:

```bash
# 1. Clone a dataset from Hub
ddb clone pierotofy/brighton-beach

# 2. Add new files
cd brighton-beach/
ddb add README.md new_photos/*.JPG

# 3. Push changes back
ddb push

# 4. (Optional) Change destination tag
ddb tag http://localhost:5000/my-org/brighton-copy
ddb push
```

## Metadata Management

Store custom JSON metadata on files or the entire dataset:

```bash
# Dataset-level metadata
ddb meta set pilot '{"name": "John Smith"}'
ddb meta get pilot --format json

# File-level metadata
ddb add photo.JPG
ddb meta add comments '{"text": "Nice one!", "author": "John S."}' -p photo.JPG
ddb meta get comments -p photo.JPG --format json
```

Plural keys (ending with `s`) are treated as lists; singular keys are single objects. Metadata is synced on push/pull.

## Multispectral Workflow

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

## Terrain Analytics

### Generate contour lines

```bash
# Contours every 10 m, simplified to 1 m
ddb contour dem.tif -o contours.geojson -i 10 -s 1

# 20 evenly spaced levels
ddb contour dem.tif -o contours.geojson -n 20
```

### Mask orthophoto borders

```bash
# Remove black borders
ddb mask orthophoto.tif

# Custom tolerance and output
ddb mask orthophoto.tif -o output.tif

# Search for white borders
ddb mask orthophoto.tif -w
```

### Align rasters to a reference

Correct georeferencing offsets by aligning to a more accurate reference:

```bash
# Similarity transform (default: translation + rotation + scale)
ddb align -i source.tif -r reference.tif -o aligned.tif

# Translation only (faster)
ddb align -i source.tif -r reference.tif -o aligned.tif -m translation

# Validate without applying
ddb align -i source.tif -r reference.tif --validate
```

## Gaussian Splat Workflow

Convert a Gaussian Splat PLY file to streaming-optimized SPZ + RAD format:

```bash
# 1. Index the Gaussian Splat output
ddb add model.ply

# 2. Build SPZ + RAD for streaming
ddb gsplat model.ply

# 3. Push to Hub
ddb push
```

## Archive Upload and Extraction

Upload a ZIP archive and extract it into a dataset:

```bash
# 1. Clone a dataset
ddb clone my-org/survey-data

# 2. Add an archive (extracts automatically)
ddb add flight_2024_06.zip

# 3. Build derivative products for extracted files
ddb build
```

## Vector Data and MVT Generation

Index vector data and generate Mapbox Vector Tiles:

```bash
# 1. Index a GeoJSON or GeoPackage file
ddb add contours.geojson buildings.gpkg

# 2. Build MVT tiles and GeoPackage
ddb build

# 3. Push to Hub for web visualization
ddb push
```

## STAC Catalog Generation

Export a dataset as a STAC (SpatioTemporal Asset Catalog) for interoperability:

```bash
# Generate STAC catalog (outputs JSON to stdout)
ddb stac

# Generate STAC with custom working directory
ddb stac -w ./stac-output
```

## Registry Authentication

Login to a Registry server for push/pull operations:

```bash
# Login to Hub (default)
ddb login

# Login to a self-hosted Registry
ddb login -s http://localhost:5000

# Logout from all servers
ddb logout
```

## See Also

- [CLI Command Reference](/docs/cli/cli-reference)
- [Features: Multispectral & Thermal](/docs/features/multispectral)
- [Features: Terrain Analytics](/docs/features/terrain-analytics)
- [Features: Raster Alignment](/docs/features/raster-alignment)
- [Features: Gaussian Splats](/docs/features/gaussian-splat)
- [Features: Vector Processing](/docs/features/vector-processing)
- [Features: Archive Extraction](/docs/features/archive-extraction)
- [Features: Bulk Operations](/docs/features/bulk-operations)
