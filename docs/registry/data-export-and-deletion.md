---
sidebar_label: Data Export & Deletion
description: How to export your data and delete your DroneDB Hub account
---

# Data Export and Deletion

This page explains how you can export your data from DroneDB Hub, delete individual datasets or files, and permanently delete your account.

## Downloading Your Data

You can download any file or dataset that you have access to at any time:

1. Navigate to the dataset in the Explorer panel.
2. Select the file(s) you wish to download.
3. Right-click and select **Download**, or click the download icon in the toolbar.
4. For multiple files, you can select several items and download them as a ZIP archive.

### Downloading Built Files

When DroneDB builds a file, it converts it to formats that other tools open directly. Once the build is complete, right-click the file and open **Tools** to download them:

| File | Menu item | You get | Opens in |
|------|-----------|---------|----------|
| GeoTIFF, JPEG 2000 and other rasters | **Download COG** | `<name>.tif`, a Cloud Optimized GeoTIFF | QGIS, ArcGIS, GDAL, any GeoTIFF reader |
| LAS, LAZ, E57 and other point clouds | **Download COPC** | `<name>.copc.laz`, a Cloud Optimized Point Cloud | QGIS, PDAL, CloudCompare, Potree, any LAZ reader |
| GeoJSON, Shapefile, KML, GPX and other vectors | **Download GPKG** | `<name>.gpkg`, a GeoPackage | QGIS, ArcGIS, GDAL |
| OBJ, PLY, STL, glTF and GLB models | **Download 3D Tiles (.zip)** | `<name>.3dtiles.zip`, OGC 3D Tiles with `tileset.json` at its root | CesiumJS, Cesium ion, QGIS, ArcGIS |
| Gaussian splats | See [splat downloads](/docs/features/gaussian-splat#about-this-splat-and-its-downloads) | `.rad`, `.spz` | |

The files are named after the original file. Anyone who can download the original can download the built files. An uploaded `.3tz` archive offers no 3D Tiles download, because the `.3tz` is that archive already.

### Bulk Export

For exporting an entire organization's data:

1. Contact our support team at [support@dronedb.app](mailto:support@dronedb.app).
2. Specify which datasets or all data you wish to export.
3. We will provide a download link valid for 30 days.

Exported data will be in the same format as stored on the Hub (e.g., GeoTIFF, LAS, PNG, OBJ, GLTF, and other supported geospatial formats).

## Deleting Files and Datasets

### Individual Files

1. In the Explorer panel, right-click the file you wish to delete.
2. Select **Delete**.
3. Confirm the deletion in the confirmation dialog.

### Entire Datasets

1. Select the dataset in the Explorer panel.
2. Click the delete icon or right-click and select **Delete**.
3. This will delete all files within the dataset and associated processing results, including derived products such as tiles, previews, and thumbnails.

:::note
Deleted files remain in our backup systems for up to **30 days** for disaster recovery purposes. After 30 days, they are permanently purged from all systems.
:::

## Account Deletion

If you wish to permanently delete your DroneDB Hub account:

1. Contact [support@dronedb.app](mailto:support@dronedb.app) with the subject "Account Deletion Request".
2. Include your account email address and confirm that you wish to delete your account.
3. Your account will enter a **30-day retrieval period** during which you can still access your data and download it.
4. After 30 days, your account, all associated files, and metadata will be permanently deleted from our production systems.

### What Happens After Deletion

- **Your Data:** All files, datasets, and metadata are permanently deleted from production systems. Residual copies in backups will be purged within 30 days.
- **Organization Membership:** If you are a member of organizations, your membership will be revoked. Organization data owned by other members is not affected.
- **Billing:** Any active subscriptions will be cancelled immediately. No refunds will be issued for the remaining billing period.
- **Recovery:** After the 30-day period, account and data deletion is irreversible.