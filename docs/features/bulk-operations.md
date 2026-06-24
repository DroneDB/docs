---
sidebar_position: 13
sidebar_label: Bulk Operations
---

# Bulk Operations

DroneDB provides tools for managing large datasets efficiently -- bulk download, index rescan, cleanup, and database comparison.

## Bulk Download (ZIP)

Package an entire dataset or a selection of entries into a downloadable ZIP archive.

### In Hub

1. Open a dataset
2. Select files (or use "Select All")
3. Click **Download** to create a ZIP archive
4. For large selections, the archive is built as a background task

### Processing platform

Bulk download runs as a `bulk-download` task in the processing platform. For small selections, the ZIP is streamed directly. For large datasets, a Hangfire job handles the packaging.

| Parameter | Description |
|-----------|-------------|
| **Paths** | Optional list of entry paths (omit for full dataset) |
| **Archive name** | Custom name for the downloaded ZIP file |

## Rescan Index

Re-process all indexed files to update metadata, geometry, and type classification. Useful after bulk file modifications or when metadata extraction rules have changed.

### CLI

```bash
ddb rescan
```

### In Hub

Use the **Rescan Index** processing task to re-scan the dataset. This clears caches and rebuilds derivative products.

| Parameter | Description |
|-----------|-------------|
| **Types** | Comma-separated entry types to rescan (omit for all) |
| **Stop on error** | Halt processing on the first error (default: off) |

## Cleanup

Remove stale database entries and orphaned build artifacts from the index.

### CLI

```bash
ddb cleanup
```

The cleanup command:

- Removes entries that no longer exist on the filesystem
- Deletes orphaned build artifacts (tiles, thumbnails, COGs) for removed entries
- Shrinks the database file

## Delta (Diff)

Compare two DroneDB databases and generate a list of differences.

### CLI

```bash
ddb delta database1.ddb database2.ddb
```

The delta command outputs a list of add/remove actions with file paths and hash values. This is used internally by the push/pull sync mechanism to determine what needs to be transferred.

## Status

Show the current state of the index compared to the filesystem.

### CLI

```bash
ddb status
```

| Symbol | Meaning |
|--------|---------|
| `?` | New file (not indexed) |
| `!` | Deleted file (indexed but missing from disk) |
| `M` | Modified file (hash mismatch) |

## System cache cleanup

Clear the user cache directory (thumbnails, downloaded tiles, etc.).

### CLI

```bash
ddb system clean
```

:::tip
Run `ddb cleanup` periodically on datasets that receive frequent push/pull operations to keep the database size manageable.
:::
