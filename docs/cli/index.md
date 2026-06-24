---
sidebar_position: 1
sidebar_label: CLI Overview
---

# CLI Overview

`ddb` is a command-line interface (CLI) to access DroneDB's functions. It's ideal for power users and for creating automated workflows.

## Quick Reference

### Core operations

| Command | Description |
|---------|-------------|
| `ddb init` | Initialize a new DroneDB index |
| `ddb add` | Add files to the index |
| `ddb rm` | Remove files from the index |
| `ddb list` | List indexed files |
| `ddb search` | Search indexed files |
| `ddb info` | Show file metadata |
| `ddb status` | Show index vs filesystem status (? new, ! deleted, M modified) |
| `ddb sync` | Sync index with filesystem changes |
| `ddb rescan` | Re-process all indexed files to update metadata |

### Registry & sync

| Command | Description |
|---------|-------------|
| `ddb login` | Authenticate with a Registry server |
| `ddb logout` | Logout from Registry server(s) |
| `ddb share` | Share files to Hub/Registry |
| `ddb push` | Sync local index to Registry |
| `ddb pull` | Pull changes from a remote Registry |
| `ddb clone` | Clone a remote dataset |
| `ddb tag` | Get or set the dataset tag |
| `ddb stamp` | Generate a stamp of the current index |
| `ddb delta` | Generate delta between two databases |

### Build & processing

| Command | Description |
|---------|-------------|
| `ddb build` | Generate derivative products (tiles, thumbnails, etc.) |
| `ddb thumbs` | Generate thumbnails |
| `ddb tile` | Generate map tiles for GeoTIFFs, GeoImages, COPC |
| `ddb cog` | Build a Cloud Optimized GeoTIFF |
| `ddb copc` | Build a Cloud Optimized Point Cloud |
| `ddb nxs` | Generate Nexus files from OBJ 3D models |
| `ddb gsplat` | Convert Gaussian Splat to compressed SPZ + RAD LOD |
| `ddb stac` | Generate STAC catalogs |
| `ddb contour` | Generate contour lines from DEMs |
| `ddb mask` | Mask orthophoto borders |
| `ddb align` | Align GeoTIFF to a reference raster |
| `ddb merge-multispectral` | Merge single-band files into multi-band COG |
| `ddb geoproj` | Project images to georeferenced rasters |

### Metadata & attributes

| Command | Description |
|---------|-------------|
| `ddb meta` | Manage metadata (add/set/rm/get/unset/ls/dump/restore) |
| `ddb setexif` | Modify EXIF values (GPS lat/lon/alt) in files |
| `ddb password` | Manage database passwords |

### Maintenance

| Command | Description |
|---------|-------------|
| `ddb cleanup` | Remove stale entries and orphaned artifacts |
| `ddb system` | Manage ddb (subcommand: `clean` for user cache cleanup) |

## Installation

See the [CLI Installation](/docs/getting-started/installation#cli-installation) page for setup instructions.

## Examples

See [CLI Examples](/docs/cli/examples) for practical usage examples.

## Full Reference

See the [CLI Command Reference](/docs/cli/cli-reference) for the complete list of commands and options.
