---
sidebar_position: 11
sidebar_label: Vector Processing
---

# Vector Data Processing

DroneDB indexes, processes, and serves vector data for web visualization and OGC interoperability. Vector entries are converted to Mapbox Vector Tiles (MVT) and GeoPackage formats for efficient streaming.

## Supported formats

| Format | Extension | Notes |
|--------|-----------|-------|
| GeoJSON | `.geojson` | Full feature collection support |
| Shapefile | `.shp` | Requires accompanying `.shx`, `.dbf` files |
| Shapefile (compressed) | `.shz` | Zipped shapefile |
| FlatGeobuf | `.fgb` | Efficient binary vector format |
| GeoPackage | `.gpkg` | Multi-layer support |
| DXF | `.dxf` | AutoCAD drawing exchange |
| DWG | `.dwg` | AutoCAD native format |
| TopoJSON | `.topojson` | Topology-encoded geometry |
| KML | `.kml` | Keyhole Markup Language |
| KMZ | `.kmz` | Zipped KML (multi-layer) |

## Processing pipeline

When a vector file is added to a DroneDB index, the build process generates:

| Output | Description |
|--------|-------------|
| **MVT tiles** | Mapbox Vector Tiles for web map rendering (EPSG:3857) |
| **GeoPackage** | Reprojected copy with spatial index (EPSG:4326) |

### Multi-layer support

GeoPackage and KMZ sources can contain multiple layers. DroneDB preserves all layers during processing, making them available as separate tile layers and OGC collections.

### Reprojection

- **GeoPackage output**: EPSG:4326 (WGS84 latitude/longitude)
- **MVT tiles**: EPSG:3857 (Web Mercator)
- Source SRS is detected automatically and reprojected during build

### MVT tile budget

Maximum zoom level is computed dynamically based on a tile budget of 10,000 tiles maximum, preventing excessive tile generation for large datasets.

## CLI

```bash
# Index a vector file
ddb add contours.geojson

# Build MVT tiles and GeoPackage
ddb build
```

## In Hub

Vector data is displayed on the map using the built-in vector tile renderer:

- **MVT tiles**: Precomputed tiles are served via the `/mvt/{hash}/{z}/{x}/{y}.pbf` endpoint
- **Layer switching**: Multi-layer sources show individual layer toggles
- **Styling**: Default styling with hover effects and click-to-inspect attributes

## OGC interoperability

Vector entries are exposed through:

- **WFS 2.0.0**: Feature access with GeoJSON and GML output
- **OGC API - Features**: RESTful JSON API for vector collections
- **OGC API - Tiles**: MVT tiles via the OGC API - Tiles standard
- **MVT endpoint**: Direct Mapbox-compatible tile pyramid

See [OGC Services](/docs/integrations/ogc-services) for endpoint details and QGIS integration instructions.

## Query API

The vector query API supports:

- **BBOX filtering**: Filter features by bounding box
- **Pagination**: Limit and offset for large feature sets
- **Output formats**: GeoJSON and GML
