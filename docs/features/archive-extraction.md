---
sidebar_position: 8
sidebar_label: Archive Extraction
---

# Archive Extraction

Upload and extract compressed archives (ZIP) directly into a DroneDB dataset. Archive extraction makes it easy to ingest large collections of files without uploading them individually.

## How it works

When an archive file (ZIP) is added to a dataset, DroneDB can automatically extract its contents and index each file individually. The extracted files are treated as if they were uploaded one by one, with full metadata extraction and automatic build job queuing for processable entries.

## CLI

Add an archive file to a DroneDB index:

```bash
ddb add survey_data.zip
```

The archive is extracted to the dataset directory and each file is indexed automatically.

## In Hub

### Upload an archive

1. Open a dataset in Hub
2. Click **Upload** and select a ZIP file
3. The archive is uploaded and queued for extraction via the processing platform
4. Once extraction completes, the individual files appear in the file browser

### Processing options

| Option | Description |
|--------|-------------|
| **Delete archive** | Remove the original ZIP file after extraction (default: off) |
| **Overwrite** | Replace existing files with the same name (default: off) |
| **Destination path** | Extract to a specific subfolder within the dataset |

## Supported formats

| Format | Extension | Notes |
|--------|-----------|-------|
| ZIP | `.zip` | Full support, including nested directories |

## Workflow example

```bash
# 1. Clone a dataset
ddb clone my-org/survey-data

# 2. Add an archive (extracts automatically)
ddb add flight_2024_06.zip

# 3. The archive contents are now indexed
ddb list

# 4. Build derivative products for extracted files
ddb build
```

## In Registry (Processing Platform)

Archive extraction runs as a background Hangfire job. You can monitor progress at `/hangfire` or via the tasks API. The job automatically enqueues build tasks for any extracted entries that support derivative products (COG, COPC, NXS, etc.).

:::tip
For very large archives, consider using the `ddb push` command instead of web upload to avoid browser timeouts.
:::
