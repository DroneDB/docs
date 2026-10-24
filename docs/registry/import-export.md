---
sidebar_position: 6
sidebar_label: Import & Export
---

# Import & Export

Transfer datasets and organizations between Registry instances.

An import runs as a background job on the target Registry. The request is checked at once, then the job is queued and the endpoint answers `202 Accepted` with the job id and a status URL. Ask the status URL until the job is over, or delete it to cancel the import.

All import endpoints are for **administrators of the target Registry** only. The credentials of the source Registry are sent in the request; they are stored encrypted in the job.

## Importing a dataset

```bash
curl -X POST https://target-registry.com/sys/import-dataset \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{
           "sourceRegistryUrl": "https://source-registry.com",
           "username": "source-user",
           "password": "source-password",
           "sourceOrganization": "source-org",
           "sourceDataset": "source-dataset",
           "destinationOrganization": "target-org",
           "destinationDataset": "target-dataset",
           "mode": "Archive"
         }'
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `sourceRegistryUrl` | Scheme and host of the source Registry instance, without a path (`https://hub.dronedb.app`); `http` or `https`, private and reserved addresses are refused |
| `username`, `password` | Credentials of a user of the source instance who can read the dataset |
| `sourceOrganization` | Organization slug on the source instance |
| `sourceDataset` | Dataset slug on the source instance |
| `destinationOrganization` | Organization slug on the target instance (optional: the source organization slug) |
| `destinationDataset` | Dataset slug on the target instance (optional) |
| `mode` | `Archive` (default): download the dataset as one ZIP archive. `ParallelFiles`: download the files one by one in parallel, and skip a file that already exists with the same hash |

## Importing an organization

Imports every dataset of an organization:

```bash
curl -X POST https://target-registry.com/sys/import-organization \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{
           "sourceRegistryUrl": "https://source-registry.com",
           "username": "source-user",
           "password": "source-password",
           "sourceOrganization": "source-org",
           "destinationOrganization": "target-org",
           "mode": "ParallelFiles"
         }'
```

The parameters are the same as for a dataset, without `sourceDataset` and `destinationDataset`.

## Following the import job

Both endpoints answer `202 Accepted`, with the status URL also in the `Location` header:

```json
{
  "jobId": "1234",
  "statusUrl": "https://target-registry.com/sys/imports/1234"
}
```

An invalid request (missing field, refused URL) is a `400` before any job is queued.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/sys/imports/{jobId}` | State of the import and, once it is over, its outcome |
| `DELETE` | `/sys/imports/{jobId}` | Cancel the import: a queued import does not start, a running one stops (`204`) |

`GET /sys/imports/{jobId}` answers:

```json
{
  "jobId": "1234",
  "state": "Succeeded",
  "result": {
    "importedItems": [
      { "organization": "target-org", "dataset": "target-dataset", "size": 52428800, "fileCount": 120, "skippedFileCount": 0, "importedAt": "2026-10-24T10:00:00Z" }
    ],
    "errors": [],
    "fileErrors": [],
    "totalSize": 52428800,
    "totalFiles": 120,
    "skippedFiles": 0,
    "duration": "00:01:12"
  },
  "error": null
}
```

| Field | Description |
|-------|-------------|
| `state` | The job state: `Enqueued`, `Processing`, `Succeeded`, `Failed`, `Deleted` (canceled), ... |
| `result` | When the job succeeded: the datasets imported, the errors per dataset (`errors`, with the phase: `Authentication`, `Download`, `Save`, `General`) and per file (`fileErrors`, `ParallelFiles` mode only), and the totals |
| `error` | When the job failed: its error message |

A job id that is not an import job answers `404`.

:::info Changed in Registry 3.0
Before Registry 3.0 the import ran inside the request and the endpoint answered `200` with the `result` above when the whole transfer was over. Scripts that called it now poll `statusUrl`.
:::

The number of files downloaded at once and the retries per file of the `ParallelFiles` mode come from the `Import` settings of the target Registry (`RegistryDownloadConcurrency`, default 4; `RegistryDownloadMaxRetries`, default 6). The builds of an imported dataset run as the service, like other background builds.

## Use Cases

- **Data migration**: Move datasets between on-premise and cloud instances
- **Backup and recovery**: Clone datasets to a backup Registry
- **Collaboration**: Share datasets between organizations running their own Registry instances

The Hub's **Import Dataset** tool (a processing task of a dataset) imports from another Registry or from an archive URL into one dataset; see [Processing Platform](./admin/processing-platform.md).
