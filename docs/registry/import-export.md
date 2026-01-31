---
sidebar_position: 6
sidebar_label: Import & Export
---

# Import & Export

Transfer datasets and organizations between Registry instances.

## Importing Datasets

Import datasets from another Registry instance via API:

```bash
POST /system/importdataset
{
  "sourceUrl": "https://source-registry.com",
  "orgSlug": "source-org",
  "dsSlug": "source-dataset",
  "targetOrgSlug": "target-org",
  "targetDsSlug": "target-dataset",
  "token": "auth-token"
}
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `sourceUrl` | Base URL of the source Registry instance |
| `orgSlug` | Organization slug on the source instance |
| `dsSlug` | Dataset slug on the source instance |
| `targetOrgSlug` | Organization slug on the target instance |
| `targetDsSlug` | Dataset slug on the target instance |
| `token` | Authentication token for the source instance |

## Importing Organizations

Import entire organizations with all their datasets:

```bash
POST /system/importorg
{
  "sourceUrl": "https://source-registry.com",
  "orgSlug": "source-org",
  "targetOrgSlug": "target-org",
  "token": "auth-token"
}
```

### Parameters

| Parameter | Description |
|-----------|-------------|
| `sourceUrl` | Base URL of the source Registry instance |
| `orgSlug` | Organization slug on the source instance |
| `targetOrgSlug` | Organization slug on the target instance |
| `token` | Authentication token for the source instance |

## Authentication

Both import endpoints require:

1. **Admin privileges** on the target Registry instance
2. **Valid authentication token** from the source Registry instance

## Use Cases

- **Data migration**: Move datasets between on-premise and cloud instances
- **Backup and recovery**: Clone datasets to a backup Registry
- **Collaboration**: Share datasets between organizations running their own Registry instances
