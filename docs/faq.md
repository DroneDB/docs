---
sidebar_position: 5
description: 'Frequently asked questions'
---

# FAQ

### What file formats does DroneDB support?

DroneDB supports a wide range of geospatial file formats:

| Category | Formats |
|----------|---------|
| **Images** | JPG, JPEG, DNG, TIF, TIFF, PNG, GIF, WEBP |
| **Videos** | MP4, MOV, WEBM, M4V, AVI, MKV |
| **Point Clouds** | LAS, LAZ, E57, PTS, XYZ, PLY* |
| **3D Models** | OBJ, GLTF, GLB, PLY* |
| **Gaussian Splats** | PLY*, SPLAT, SPZ |
| **Vector Data** | GeoJSON, DXF, DWG, SHP, SHZ, FGB, TopoJSON, KML, KMZ, GPKG |
| **Rasters** | GeoTIFF (orthophotos, DEMs) |
| **Other** | Markdown (README.md), PDF |

*PLY files are automatically classified as point clouds, 3D models, or Gaussian Splats based on their content.

### What is the difference between DroneDB CLI and Registry?

**DroneDB CLI** (`ddb`) is a command-line tool for local data management. It's ideal for:
- Indexing and organizing files on your local drives
- Checking data quality after a drone flight
- Building tiles, thumbnails, and derivative products
- Power users and automated workflows

**Registry** is a web-based platform for hosting and sharing datasets. It's ideal for:
- Collaboration with team members
- Sharing data with clients
- Self-hosting your own data infrastructure
- Public data distribution with STAC compliance

### What is STAC and why should I care?

[STAC (SpatioTemporal Asset Catalog)](https://stacspec.org/) is an open standard for describing geospatial data. Registry implements STAC to:
- Make your public datasets discoverable
- Enable interoperability with other geospatial tools
- Provide standardized metadata for your assets

### How do I make a dataset public?

You can change dataset visibility in several ways:

**Via Web UI:**
1. Go to your dataset
2. Open settings
3. Change visibility to "Public"

**Via CLI:**
```bash
ddb chattr +public
```

### Can I self-host Registry?

Yes! Registry is open source and can be self-hosted using Docker or natively. See the [Registry documentation](/docs/registry) for detailed instructions.

### What happened to DroneDB Desktop?

DroneDB Desktop (the standalone Windows application) has been deprecated. All functionality has been moved to the web-based [Registry/Hub](https://hub.dronedb.app) platform, which provides a richer feature set and works on any operating system with a browser.

### What databases does Registry support?

Registry supports:
- **SQLite** (default, for development and small deployments)
- **MySQL/MariaDB** (recommended for production)
- **Microsoft SQL Server** (no automatic migrations)

### How do I get commercial support?

Commercial support is available. [Get in touch](https://dronedb.app/contact).