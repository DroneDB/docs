---
sidebar_position: 5
sidebar_label: STAC API
---

# STAC API

Registry implements the [STAC specification](https://stacspec.org/) for standardized geospatial data discovery.

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/stac` | Root catalog with links to all public datasets |
| `/orgs/{org}/ds/{ds}/stac` | STAC Collection for a specific dataset |

## Browsing

Use the [STAC Browser](https://radiantearth.github.io/stac-browser/) to explore your catalog:

```
https://radiantearth.github.io/stac-browser/#/external/http://localhost:5000/stac
```

## STAC Compliance

Registry's STAC implementation includes:

- **STAC Catalog**: Root catalog at `/stac` listing all public datasets
- **STAC Collections**: Each dataset is exposed as a STAC Collection
- **STAC Items**: Individual files within datasets are exposed as STAC Items
- **Asset Links**: Direct links to download files and derived products

### Example: Accessing a Dataset via STAC

```bash
# Get the root catalog
curl http://localhost:5000/stac

# Get a specific dataset collection
curl http://localhost:5000/orgs/myorg/ds/mydataset/stac

# Browse with STAC Browser
open "https://radiantearth.github.io/stac-browser/#/external/http://localhost:5000/orgs/myorg/ds/mydataset/stac"
```

### Integration with Other Tools

STAC-compliant tools like [QGIS](https://qgis.org/), [pystac](https://pystac.readthedocs.io/), and [stac-utils](https://stacutils.org/) can connect to your Registry instance for seamless data discovery and access.
