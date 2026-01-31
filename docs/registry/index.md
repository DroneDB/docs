---
sidebar_position: 1
sidebar_label: Registry
---

# Registry

![GitHub Release](https://img.shields.io/github/v/release/DroneDB/Registry) ![commits](https://img.shields.io/github/commit-activity/m/DroneDB/registry) ![languages](https://img.shields.io/github/languages/top/DroneDB/registry) ![.NET Core](https://github.com/DroneDB/Registry/workflows/.NET%20Core/badge.svg?branch=master)

DroneDB Registry is a comprehensive geospatial data management and storage platform. It provides JWT authentication, a full REST API, and STAC compliance for interoperability.

:::tip Try it Online
You can try the online hosted version of Registry (DroneDB Hub) at [dronedb.app/plans](https://dronedb.app/plans) with a **30-day free trial** on every plan – no commitment, cancel anytime!
:::

## Features

- **Dataset Management**: Create, organize, and share datasets with fine-grained permissions
- **Interactive Visualization**: View orthophotos, point clouds, 3D models (OBJ, GLTF, GLB), and panoramas directly in the browser
- **User Management**: Built-in user administration with role-based access control
- **STAC Compliance**: Standard SpatioTemporal Asset Catalog API for interoperability
- **Public & Private Datasets**: Flexible visibility controls for your data
- **Measurements**: Interactive measurement tools on maps
- **Import/Export**: Transfer datasets between Registry instances
- **On-Demand Processing**: Automatic thumbnail, tile, and streaming format generation

### Orthophoto Measurements

Interactive measurement tools on orthophotos:

![Orthophoto Measurements](../assets/ortho-measurements.webp)

### Point Cloud Measurements

Measure distances and areas directly on point clouds:

![Point Cloud Measurements](../assets/point-cloud-measurements.webp)

![Point Cloud Measurements Saved](../assets/point-cloud-measurements-saved.webp)

### Live Examples

- [Brighton Beach](https://hub.dronedb.app/r/hedo88/brighton-beach)
- [ODM Seneca](https://hub.dronedb.app/r/hedo88/odm-seneca)
- [ODM Sance](https://hub.dronedb.app/r/hedo88/odm-sance)
- [Panorama Example](https://hub.dronedb.app/r/pierotofy/panoexample/)

## Supported Formats

| Category | Formats |
|----------|---------|
| **Images** | JPG, JPEG, DNG, TIF, TIFF, PNG, GIF, WEBP |
| **Point Clouds** | LAS, LAZ, PLY* |
| **3D Models** | OBJ, GLTF, GLB, PLY* |
| **Rasters** | GeoTIFF (orthophotos, DEMs) |
| **Vector Data** | GeoJSON, SHP, SHZ, KML, KMZ, DXF, DWG, FGB, TopoJSON, GPKG |
| **Panoramas** | 360° images (aspect ratio ≥ 2:1) with optional GPS |
| **Videos** | MP4, MOV |
| **Other** | Markdown, PDF |

:::note
*PLY files are automatically classified as point clouds or 3D models based on their content.
:::

## Getting Help

Commercial support is available. [Get in touch](https://dronedb.app/contact).
