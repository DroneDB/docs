---
sidebar_position: 5
sidebar_label: STAC API
---

# STAC API

Registry implements the [STAC specification](https://stacspec.org/) for standardized geospatial data discovery.

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `/stac` | STAC API landing page (root catalog) with conformance classes and links |
| `/stac/conformance` | Conformance declaration listing supported STAC API conformance classes |
| `/stac/collections` | List all STAC collections the current user can access |
| `/stac/collections/{orgSlug}/{dsSlug}` | STAC Collection for a specific dataset |
| `/stac/collections/{orgSlug}/{dsSlug}/items` | STAC ItemCollection for a dataset, with optional `bbox`, `datetime`, `limit`, and `offset` filters |
| `/stac/collections/{orgSlug}/{dsSlug}/items/{featureId}` | Single STAC item (feature) from a dataset |
| `/stac/search` | Cross-collection item search (`GET` and `POST`) with `bbox`, `datetime`, `collections`, `ids`, and `intersects` filters |
| `/orgs/{orgSlug}/ds/{dsSlug}/stac` | Dataset collection shortcut (same collection object as `/stac/collections/{org}/{ds}`) |

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
