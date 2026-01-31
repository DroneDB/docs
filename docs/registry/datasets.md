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

### Chunked Uploads

For large files, Registry supports chunked uploads:

- Files are split into manageable chunks for reliable upload
- Automatic resume on connection failures
- No file size limits (configurable via `MaxRequestBodySize`)

The DroneDB CLI (`ddb push`) handles chunked uploads automatically.

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
