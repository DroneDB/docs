---
sidebar_position: 1
---

# Overview

Discover **DroneDB in less than 2 minutes**.

## What is DroneDB

A comprehensive set of tools to inspect, manage, and share aerial data. DroneDB provides a complete solution for organizing and distributing geospatial data including images, orthophotos, digital elevation models, point clouds, 3D models, and vector files.

<img src="/img/summary.svg" alt="Summary" />

:::info
For image processing and photogrammetry, we recommend [WebODM](https://opendronemap.org/webodm/). DroneDB excels at managing and sharing the resulting data.
:::

## Core Components

DroneDB consists of three main components:

| Component | Description |
|-----------|-------------|
| **DroneDB Core** | C++ library providing geospatial data management, indexing, and processing |
| **DroneDB Desktop** | Desktop application for browsing and sharing aerial data |
| **DroneDB Registry** | Web-based platform for hosting, managing and sharing datasets |

## Key Features

### Data Inspection

You flew your drone. You captured some data. But *is your data good?*

![explorer](./assets/brighton-explorer.webp)

 - Are the images georeferenced correctly (or at all)?
 - Did you miss to capture an image (or an entire section)?

*Difficult to say from a file browser*

DroneDB Desktop provides rich context and visualization:

![ddb](./assets/brighton-ddb.webp)

![ddb](./assets/brighton-ddb-2.webp)

### Data Sharing

DroneDB supports a wide range of aerial data formats:

| Category | Supported Formats |
|----------|-------------------|
| **Images** | JPG, JPEG, DNG, TIF, TIFF, PNG, GIF, WEBP |
| **Videos** | MP4, MOV |
| **Point Clouds** | LAS, LAZ, PLY* |
| **3D Models** | OBJ, GLTF, GLB, PLY* |
| **Vector Data** | GeoJSON, DXF, DWG, SHP, SHZ, FGB, TopoJSON, KML, KMZ, GPKG |
| **Other** | Markdown, PDF, and more |

:::note
*PLY files are automatically classified as point clouds or 3D models based on their content.
:::

Traditional cloud storage like Google Drive or Dropbox doesn't let you interact with geospatial data:

![Google Drive](./assets/google-drive.webp)

[DroneDB Hub](https://hub.dronedb.app) is interactive; you can view images, point clouds, textured models, panoramas all in one place with **measurements tools**, **STAC support**, and more:

![Hub 1](./assets/hub-1.webp)

![Hub 2](./assets/hub-2.webp)

### Key Capabilities

- **Automatic Metadata Extraction**: EXIF, sensor data, GPS coordinates
- **Spatial Indexing**: SQLite with SpatiaLite extensions
- **On-Demand Processing**: Dynamic tiling, thumbnails, EPT generation
- **3D Streaming**: Nexus format for efficient mesh streaming
- **STAC Compliance**: Standard catalog format for interoperability
- **Public & Private Datasets**: Flexible visibility controls

### Entry Types

DroneDB automatically classifies files into the following types based on their content and metadata:

| Type | Description |
|------|-------------|
| **Image** | Standard images (JPG, PNG, etc.) without GPS data |
| **GeoImage** | Georeferenced images with GPS coordinates |
| **Panorama** | Wide-angle images (aspect ratio ≥ 2:1) |
| **GeoPanorama** | Panoramas with GPS coordinates |
| **Video** | Standard video files |
| **GeoVideo** | Videos with embedded GPS data |
| **GeoRaster** | Georeferenced rasters (orthophotos, DEMs) |
| **PointCloud** | Point cloud files (LAS, LAZ, non-mesh PLY) |
| **Model** | 3D models (OBJ, GLTF, GLB, mesh PLY) |
| **Vector** | Vector data (GeoJSON, SHP, KML, etc.) |
| **Markdown** | Documentation files |

## Get Started

 - Install [DroneDB Desktop](./desktop#installation)
 - [Register](https://dronedb.app/register) an account on Hub (it's free)

### Advanced Users

 - Self-host your own instance with [Registry](./registry)
 - Install the [command line tool](./cli)