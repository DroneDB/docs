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
| **Videos** | MP4, MOV |
| **Point Clouds** | LAS, LAZ, PLY |
| **3D Models** | OBJ, GLTF, GLB |
| **Vector Data** | GeoJSON, DXF, DWG, SHP, SHZ, FGB, TopoJSON, KML, KMZ, GPKG |
| **Rasters** | GeoTIFF (orthophotos, DEMs) |
| **Other** | Markdown (README.md), PDF |

### What is the difference between DroneDB Desktop and Registry?

**DroneDB Desktop** is a desktop application for browsing and inspecting aerial data locally on your computer. It's ideal for:
- Checking data quality after a drone flight
- Organizing files on your local drives
- Quick sharing to Hub

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

Yes! Registry is open source and can be self-hosted using Docker or natively. See the [Registry documentation](./registry) for detailed instructions.

### What databases does Registry support?

Registry supports:
- **SQLite** (default, for development and small deployments)
- **MySQL/MariaDB** (recommended for production)
- **Microsoft SQL Server** (no automatic migrations)

### Where can I buy a license for DroneDB Desktop?

[https://dronedb.app/buy-ddb-desktop](https://dronedb.app/buy-ddb-desktop)

### How do I get commercial support?

Commercial support is available. [Get in touch](https://dronedb.app/contact).