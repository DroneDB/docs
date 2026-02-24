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
| **Point Clouds** | EPT/COPC | Streaming format via Potree viewer |
| **3D Models** | NXS (Nexus) | Progressive streaming for 3D meshes |
| **Images** | Thumbnails, WebP tiles | Fast previews and map tiles |

Processing happens in background via Hangfire jobs. Monitor progress at `/hangfire`.

### Panorama Viewer

Registry includes a built-in 360° panorama viewer for immersive visualization:

- **Automatic detection**: Images with aspect ratio ≥ 2:1 are classified as panoramas
- **GPS support**: GeoPanoramas include location data displayed on maps
- **Interactive controls**: Pan, zoom, and fullscreen viewing

To upload panoramas, simply add them to a dataset like any other image. Registry will automatically detect and render them with the panorama viewer.

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
For complete details on user management including API endpoints, roles, organizations, storage quotas, and authentication, see the dedicated [User Management Guide](../user-management.md).
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
- **CLI**: `ddb chattr +public` or `ddb chattr -public`

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
