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

To rescan only some entries, filter by entry type (`-t`), by file extension (`-e`), or both. An entry must match both filters:

```bash
ddb rescan -t georaster,pointcloud
ddb rescan -e dwg,dxf
```

Extensions ignore case and an optional leading dot (`.DWG` is the same as `dwg`). Compound extensions such as `copc.laz` are allowed.

### In Hub

Use the **Rescan Index** processing task to re-scan the dataset.

| Parameter | Description |
|-----------|-------------|
| **Types** | Comma-separated entry types to rescan (omit for all) |
| **Extensions** | Comma-separated file extensions to rescan (omit for all) |
| **Stop on error** | Halt processing on the first error (default: off) |

Without a filter, the task clears the caches and rebuilds all derivative products of the dataset. With a type or extension filter, it rebuilds only the entries that it rescanned.

### Across all datasets

Administrators can rescan the matching entries of every dataset with one request, for example to re-read all DWG and DXF drawings after an upgrade that adds support for them:

```bash
curl -X POST -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"extensions": ["dwg", "dxf"]}' \
  http://localhost:5000/sys/rescan
```

| Field | Description |
|-------|-------------|
| `types` | Entry types to rescan, e.g. `["vector"]` |
| `extensions` | File extensions to rescan, e.g. `["dwg", "dxf"]` |
| `organizationSlug` | Limit the rescan to one organization (optional) |
| `datasetSlug` | Limit the rescan to one dataset; needs `organizationSlug` (optional) |
| `stopOnError` | Stop a dataset rescan at its first error (default: `false`) |

At least one of `types` and `extensions` is required. The endpoint returns `202 Accepted` with the id of a background job. That job submits a **rescan-index** task, with the same filters, for each dataset that has matching entries. Each task shows in the tasks of its dataset. The tasks run on the build queue, so the number of build workers limits how many datasets are rescanned at the same time.

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
