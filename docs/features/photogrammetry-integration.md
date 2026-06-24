---
sidebar_position: 12
sidebar_label: Photogrammetry Integration
---

# Photogrammetry Integration

DroneDB Registry integrates with photogrammetry processing platforms (NodeODM, OpenDroneMap, ODX) to send drone images for processing and retrieve the results directly into a dataset.

## How it works

The Processing Platform in Registry can submit a batch of images to a remote photogrammetry node. The node processes the images and produces outputs (orthophoto, DEM, point cloud, 3D model, etc.). The results are downloaded as a task artifact and added to the dataset.

## Processing nodes

A processing node is a remote instance of NodeODM, OpenDroneMap, or ODX that accepts processing jobs via API. Nodes are registered in Registry with:

| Setting | Description |
|---------|-------------|
| **Node ID** | Unique identifier for the node |
| **URL** | Base URL of the processing API |
| **API key** | Authentication token for the node |
| **Name** | Human-readable label |

## In Hub

### Submit a photogrammetry job

1. Open a dataset containing drone images
2. Select the images to process (or use all images in the dataset)
3. Click the **Photogrammetry** toolbar button or processing task
4. Select a processing node and configure options
5. Submit the job

The job runs as a background Hangfire task. Progress and logs are streamed to the task panel.

### Processing options

Common NodeODM/ODX options available through the processing platform:

| Option | Description |
|--------|-------------|
| `--dsm` | Generate Digital Surface Model |
| `--dtm` | Generate Digital Terrain Model |
| `--orthophoto` | Generate orthophoto (default) |
| `--pc` | Generate point cloud |
| `--3d-tiles` | Generate 3D tiles |
| `--feature-quality` | Processing quality (low, medium, high) |
| `--gsd` | Estimated ground sample distance |

## Task artifacts

When processing completes, the results are downloaded as a ZIP archive (typically `all.zip` from NodeODM) and stored as a task artifact. The archive can be extracted into the dataset using the [Archive Extraction](./archive-extraction) feature.

## Workflow example

```
1. Upload drone images to a Hub dataset
2. Submit photogrammetry job via processing platform
3. Wait for processing to complete (monitor via task panel)
4. Extract the results archive into the dataset
5. View orthophoto, DEM, point cloud, and 3D model in Hub
```

:::tip
For large datasets, consider using a dedicated processing node with sufficient RAM and GPU resources. The processing platform supports multiple nodes for load balancing.
:::

## CLI alternative

For offline photogrammetry processing, use WebODM or ODX directly and then push the results to DroneDB:

```bash
# Process with ODX/WebODM locally
# Then add results to DroneDB
ddb add odm_orthophoto/ odm_dem.tif odm_3d_model/

# Push to Hub
ddb push
```
