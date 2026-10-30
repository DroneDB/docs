---
sidebar_position: 4
sidebar_label: Datasets
---

# Datasets

## On-Demand Processing

Registry automatically generates optimized formats for visualization:

| Source | Generated Format | Description |
|--------|------------------|-------------|
| **GeoTIFF** | COG (Cloud Optimized GeoTIFF) | Efficient streaming for large orthophotos |
| **Point Clouds** | COPC (`copc/cloud.copc.laz`) | Single-file streaming format via Potree viewer |
| **3D Models** | bm3d + OGC 3D Tiles | Progressive streaming for 3D meshes; 3D Tiles are generated as a best-effort additive artifact for the unified viewer |
| **Gaussian Splats** | RAD LOD (`model.rad`) | Level-of-detail streaming via the in-browser splat viewer |
| **Vector Data** | MVT tiles + GeoPackage | Mapbox Vector Tiles for web maps |
| **Images** | Thumbnails, WebP tiles | Fast previews and map tiles |

Processing happens in background via Hangfire jobs. Monitor progress at `/hangfire`.

Models built before bm3d have only a Nexus file. They still open in the previous viewer until the [background rebuild](/docs/registry/admin/configuration#artifactcompletenesscheckercron) reaches them; the next major release removes that viewer.

Which entry types are built, which have a thumbnail and what each build produces is decided by the DroneDB library, not by Registry: `GET /sys/features` lists the entry types (`entryTypes`, with `buildable`, `thumbnail` and the artifact roles), and each entry of a listing lists the artifacts that exist (`artifacts`, with their role, URL and media type). The Hub reads both, so a viewer opens only when the artifacts it needs are listed. A thumbnail asked for an entry whose type has none (a video, a text file) answers `404`.

### Processing Tools

Registry's Processing Platform exposes the following tools as background tasks:

| Tool | Description |
|------|-------------|
| **build** | Generate derivative products (COG, COPC, bm3d, MVT, 3D Tiles, thumbnails) |
| **raster-export** | Export a raster as GeoTIFF with visualization params (preset, bands, formula, colormap) |
| **align-raster** | Align a source GeoTIFF to a reference raster (similarity or translation mode) |
| **archive-extract** | Extract a ZIP archive and index each file individually |
| **merge-multispectral** | Merge single-band rasters into a multi-band COG |
| **photogrammetry** | Send images to a remote NodeODX/ODX processing node |
| **bulk-download** | Package dataset entries into a downloadable ZIP archive |
| **splat-spz-export** | Make the `.spz` of a built Gaussian splat for other tools, kept in its build |
| **splat-training-export** | Export an ODM project as the training data of a Gaussian splat (COLMAP model, images, georeference) in a ZIP |
| **rescan-index** | Re-process all indexed files to update metadata and rebuild derivatives |
| **import-file** | Download a single file from an http/https URL into the dataset |
| **import-dataset** | Populate a new dataset from another Registry instance or a downloadable archive |

Tasks can be monitored via the `/hangfire` dashboard or the tasks API (`GET /tasks`, `GET /tasks/{id}`, `GET /tasks/{id}/log`, `GET /tasks/{id}/result`). Cancellation is supported via `DELETE /tasks/{id}` and retry via `POST /tasks/{id}/retry`.

### Panorama Viewer

Registry includes a built-in 360° panorama viewer for immersive visualization:

- **Automatic detection**: Images with aspect ratio ≥ 2:1 are classified as panoramas
- **GPS support**: GeoPanoramas include location data displayed on maps
- **Interactive controls**: Pan, zoom, and fullscreen viewing

To upload panoramas, simply add them to a dataset like any other image. Registry will automatically detect and render them with the panorama viewer.

### Video Viewer

MP4, MOV, WEBM, M4V, AVI, and MKV files can be played directly in the browser via the in-browser video lightbox. Click a video file in the file browser to open the lightbox player. GeoVideos (videos with embedded GPS data) additionally show their flight path on the map.

### Clipboard Copy, Cut, and Paste

Hub includes a full clipboard system for copying and moving files within a dataset or across datasets:

- **Keyboard shortcuts**: `Ctrl+C` to copy, `Ctrl+X` to cut, `Ctrl+V` to paste - consistent with OS clipboard conventions.
- **Right-click context menu**: Copy, Cut, and Paste actions are available in the context menu on any file or folder, including multi-selections.
- **Intra-dataset copy**: duplicate files or folders within the same dataset.
- **Cross-dataset transfer**: paste entries into a different dataset using copy semantics (the source is preserved).
- **Conflict resolution**: when pasting over existing files, a dialog offers Skip All or Overwrite All, followed by a summary of the operation.
- **Session persistence**: clipboard state survives page reloads via `sessionStorage`.

### Drag & Drop File Management

Files and folders can be moved within a dataset by dragging and dropping them in the file browser:

- **Within a view**: Drag any item onto a folder in the same view to move it.
- **Across views**: Drag from the folder tree to the file grid (Explorer / FileBrowser) and vice versa - items move to the targeted folder regardless of which view originated the drag.
- **Visual feedback**: The destination folder is highlighted while a drop is pending. Drops on non-folder targets are ignored.
- **Multi-selection**: When multiple items are selected, all of them are moved in a single operation.

### Map Interactions

When browsing a dataset in the map view, geolocated images (GeoImages) provide interactive features:

- **Image popup**: Click on an image marker to see a thumbnail preview with the image name, GPS coordinates, and action buttons:
  - **Open in new tab**: View the full-resolution image in a new browser tab
  - **Download**: Download the original image file
  - **Copy coordinates**: One-click copy of the WGS84 coordinates (latitude, longitude) to clipboard
- **Tooltip on hover**: Hover over an image marker to see the image filename. For clustered markers, the tooltip shows the number of images in the cluster.
- **Raster footprint**: Single-clicking an image marker also displays the projected raster footprint on the map.

:::tip
Panorama markers behave differently: clicking a panorama marker opens the interactive 360° panorama viewer directly.
:::

### Chunked Uploads

For large files, Registry supports chunked uploads:

- Files are split into manageable chunks for reliable upload
- Automatic resume on connection failures
- No file size limits (configurable via `MaxRequestBodySize`)

The DroneDB CLI (`ddb push`) handles chunked uploads automatically.

## Organizations Page

The **Organizations** page lists the organizations you can see. Type in the search box to filter the list, and switch between **List** and **Map** with the toggle next to it.

### Sorting

The sort control next to the search box sorts the organizations by:

| Sort by | Order |
|---------|-------|
| **Name** (default) | Alphabetical, ignoring case and accents. Numbers in names are compared as numbers, so "Client 2" comes before "Client 10" |
| **Creation date** | When the organization was created |
| **Last modified** | When a dataset of the organization last changed (see [Last modified](#last-modified)) |
| **Number of datasets** | How many datasets the organization has |

The arrow button next to it switches between ascending and descending. Organizations with an unknown value sort last.

The sort and the List/Map view are remembered, and saved to your account. Set the default sort in [Preferences](./preferences.md) > **Lists**: **Sort organizations by** and **Organizations order**.

Each card shows the number of datasets and **Modified** with the time since the last change (hover for the exact date). They show only for organizations you own or are a member of, or for any organization if you are an administrator. The shared public organization and anonymous visitors do not see them.

### Map

The **Map** shows one pin per dataset of every organization in the list. It follows the search box and **Show all**. Pins are coloured by organization, with a legend, and appear as each organization loads. See [Dataset Map](#dataset-map) for how the pins work.

## Datasets Page

The datasets page of an organization sorts by name, creation date, files, size, visibility and **Modified**. The **Modified** column is sortable and shows on wide screens (from 1200 px). The **List** and **Map** toggle is remembered, and saved to your account.

### Last modified

The **last modified** time of a dataset is the last time its index changed: adding, removing, moving or renaming files, and changing metadata or visibility. Builds (tiles, COG, point cloud processing) do not count.

It is read from the index files, so it can trail a change by a short time: pending changes are written to the index file a little later, for example when the dataset has been idle for about a minute or the server restarts.

The value of an organization is the newest of its datasets. An organization without datasets uses its creation date.

### Dataset Map

The **Map** view shows one pin per dataset, at the centre of its area.

- **Clusters**: nearby pins group into a numbered cluster. Click it to zoom in.
- **Area**: hover over a pin, or select it, to draw the area of the dataset on the map.
- **Popup**: click a pin for a popup with the dataset name, its organization and an **Open** button.
- **Without a location**: the list **N datasets without a location** (collapsible) shows the datasets that have no pin. Each one links to the dataset.

The location of a dataset is the area of its georeferenced files: orthophotos, DEMs, point clouds, vectors and geotagged images. Images that have only a GPS position, with no footprint, still give a location. A dataset has no location when none of its files carries coordinates, for example when it has only plain photos or documents. You cannot place a dataset by hand.

## Dataset Thumbnail & Tagline

Datasets can have a **custom thumbnail** and a **tagline** (short description) to make them easier to identify in the datasets list.

### Tagline

A tagline is a short text description (max 256 characters) that appears under the dataset name in the list view. It helps users quickly understand what each dataset contains.

- **Set during creation**: The "Create Dataset" dialog includes a tagline field
- **Edit anytime**: Change the tagline in the dataset settings dialog
- **Searchable**: The datasets list search also filters by tagline text

### Custom Thumbnail

Each dataset can display a custom thumbnail image in the datasets list. Registry looks for specific files in the dataset root directory:

| Priority | File Name |
|----------|-----------|
| 1 | `thumbnail.webp` |
| 2 | `thumbnail.jpg` |
| 3 | `thumbnail.png` |
| 4 | `cover.webp` |
| 5 | `cover.jpg` |
| 6 | `cover.png` |

The first matching file found is used as the thumbnail. If no candidate file exists, a placeholder icon is shown.

**Managing thumbnails:**
- **Upload via UI**: Use the dataset settings dialog to upload a thumbnail image
- **Upload via API/CLI**: Simply add a file named `thumbnail.webp` (or any candidate name) to the dataset root
- **Remove via UI**: The settings dialog provides a "Remove" button to delete the current thumbnail

:::tip
For best results, use a square or landscape image in WebP format. Thumbnails are automatically resized to fit the display. The default size is 512px but can be configured via `DefaultThumbnailSize` in application settings.
:::

:::info Configuration
The list of candidate file names is configurable via the `DatasetThumbnailCandidates` setting in `appsettings.json`. The default thumbnail size can be changed via `DefaultThumbnailSize`.
:::

## User Management

Registry includes a comprehensive user management system with role-based access control.

:::info Full Documentation
For complete details on user management including API endpoints, roles, organizations, storage quotas, and authentication, see the dedicated [User Management Guide](./admin/user-management).
:::

**Key Features:**
- User account creation and administration
- Role-based access control with custom roles
- Organization membership management
- Per-user storage quotas
- JWT authentication with external provider support

## Dataset Visibility

Datasets support three visibility levels:

| Level | Description |
|-------|-------------|
| **Private** | Only the owner and admins can access |
| **Unlisted** | Accessible with direct link, not listed publicly |
| **Public** | Visible to everyone, included in STAC catalog |

Change visibility using:
- **Web UI**: Dataset settings
- **CLI**: `ddb meta set visibility 1` (public) or `ddb meta set visibility 0` (private)

:::info
`ddb chattr` is deprecated. Use `ddb meta set visibility` instead.
:::

## Dataset Deletion

When you delete a dataset, Registry uses a **deferred deletion** approach for reliability:

1. **Immediate**: The dataset is removed from the database instantly, so it disappears from the UI
2. **Background cleanup**: A Hangfire job handles:
   - Cancelling any active build jobs (tiles, thumbnails, 3D conversions)
   - Removing job tracking entries
   - Deleting the filesystem folder

This approach ensures that:
- Users get immediate feedback when deleting datasets
- Active build processes don't block deletion
- Locked files (e.g., during 3D model conversion) don't cause errors

If the background cleanup fails (e.g., files still locked), a daily recurring job (`cleanup-orphaned-datasets`) will automatically clean up any orphaned folders.

:::info
You can monitor cleanup jobs in the Hangfire dashboard at `/hangfire` on your Registry instance.
:::
