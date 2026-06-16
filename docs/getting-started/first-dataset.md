---
sidebar_position: 3
sidebar_label: First Dataset
---

# Creating Your First Dataset

This guide walks you through creating and sharing your first dataset using DroneDB.

## Prerequisites

- [CLI installed](./installation#cli-installation) or [Registry running](./installation#registry-installation)
- A folder containing geospatial data (images, orthophotos, point clouds, etc.)

## Option 1: Using the CLI

### 1. Initialize a DroneDB index

Navigate to your data folder and initialize the index:

```bash
cd /path/to/your/data
ddb init
```

### 2. Add files to the index

```bash
ddb add *.tif *.jpg
```

DroneDB will automatically extract metadata (GPS, EXIF, sensor data) and classify each file.

### 3. Share to Hub

```bash
ddb share *.tif *.jpg
```

This will:
- Prompt you for your Hub credentials (or use a config file)
- Upload files to Hub
- Return a shareable link

To share to a self-hosted Registry:

```bash
ddb share *.tif -s http://localhost:5000
```

## Option 2: Using the Web UI

1. Login to [Hub](https://hub.dronedb.app) or your self-hosted Registry
2. Create a new dataset in your organization
3. Drag and drop files into the file browser
4. Registry will automatically process and optimize them

## Verify Your Dataset

After uploading, you can:

- **View images** on the synchronized map
- **Inspect metadata** in the detail panel
- **Measure distances** on orthophotos
- **Visualize point clouds** in 3D

## Next Steps

- Learn about [CLI commands](/docs/cli/cli-reference)
- Explore [advanced features](/docs/features) like multispectral and terrain analytics
- Configure [OGC services](/docs/integrations/ogc-services) for QGIS integration
