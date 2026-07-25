---
sidebar_position: 12
sidebar_label: Photogrammetry Integration
---

# Photogrammetry Integration

DroneDB Registry integrates with photogrammetry processing platforms (NodeODX, OpenDroneMap, ODX) to send drone images for processing and retrieve the results directly into a dataset.

## How it works

The Processing Platform in Registry can submit a batch of images to a remote NodeODX/ODX processing node. The node processes the images and produces outputs (orthophoto, DEM, point cloud, 3D model, etc.). The results are downloaded as a ZIP archive (typically `all.zip` from NodeODX) and extracted directly into the source dataset, or into a newly created dataset. Extracted files are indexed and per-file build jobs are enqueued automatically.

## Processing nodes

A processing node is a remote instance of NodeODX, OpenDroneMap, or ODX that accepts processing jobs via API. Nodes are registered in Registry with:

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

The Registry `photogrammetry` tool accepts the following parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `folder` | `string` | Dataset folder to scan for images (default: whole dataset) |
| `images` | `string[]` | Explicit list of image entry paths to process |
| `nodeId` | `string` | Target NodeODX node id (default: first configured node) |
| `name` | `string` | Task name shown on the node |
| `options` | `{name, value}[]` | NodeODX/ODX options array passed verbatim to the processing node (e.g. `[{"name":"dsm","value":true}]`) |
| `destPath` | `string` | Destination folder within the dataset for extracted results (required unless `createNewDataset` is `true`) |
| `createNewDataset` | `boolean` | If `true`, create a new dataset for the results instead of extracting into the current dataset |
| `newDatasetName` | `string` | Slug for the new dataset (kebab-case, max 128 chars; auto-generated if omitted) |
| `newDatasetOrgSlug` | `string` | Organization slug for the new dataset (default: same as source) |
| `newDatasetVisibility` | `string` | Visibility for the new dataset: `PRIVATE`, `UNLISTED`, or `PUBLIC` (default: `PRIVATE`) |

Common NodeODX options to place inside the `options` array:

| Option | Example | Description |
|--------|---------|-------------|
| `dsm` | `{"name":"dsm","value":true}` | Generate Digital Surface Model |
| `dtm` | `{"name":"dtm","value":true}` | Generate Digital Terrain Model |
| `orthophoto` | `{"name":"orthophoto","value":true}` | Generate orthophoto |
| `pc` | `{"name":"pc","value":true}` | Generate point cloud |
| `3d-tiles` | `{"name":"3d-tiles","value":true}` | Generate 3D tiles |
| `feature-quality` | `{"name":"feature-quality","value":"high"}` | Processing quality (`low`, `medium`, `high`) |
| `gsd` | `{"name":"gsd","value":0.01}` | Estimated ground sample distance |

### Task output

When processing completes, the result bundle is extracted directly into the dataset (or into the newly created dataset). No separate downloadable artifact is produced. Extracted files are indexed automatically and their derivative builds (COG, COPC, NXS, 3D Tiles, etc.) are enqueued in the background.

## Workflow example

```
1. Upload drone images to a Hub dataset
2. Submit photogrammetry job via processing platform
3. Wait for processing to complete (monitor via task panel)
4. Results are extracted and indexed automatically in the destination dataset
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
