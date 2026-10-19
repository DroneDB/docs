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
| DXF | `.dxf` | AutoCAD drawing exchange; see [CAD drawings](#cad-drawings-dxf-and-dwg) |
| DWG | `.dwg` | AutoCAD native format, converted with LibreDWG; see [CAD drawings](#cad-drawings-dxf-and-dwg) |
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

## CAD drawings (DXF and DWG)

### DWG conversion

DWG files are converted to a temporary DXF with [GNU LibreDWG](https://www.gnu.org/software/libredwg/) `dwg2dxf`, then built like any DXF. The converter ships with the Debian package and the Windows build. It runs as a separate process, with a time limit of 120 seconds (`DDB_DWG2DXF_MAX_SECONDS`).

- Supported: DWG R13 to R2018 (AutoCAD 2018 and later save as R2018).
- A file that does not convert, or converts to nothing readable, fails the build with a message that names the DWG version. Export the drawing as DXF from your CAD software and upload that instead.
- 3D solids are not converted. A drawing that contains only 3D solids has nothing to display.
- `DDB_DWG2DXF_PATH` points DroneDB to a different `dwg2dxf` binary. When set, it is the only location used.

### Coordinate system

DXF and DWG files usually carry no coordinate system that GDAL can read. DroneDB looks for one in this order:

1. A `.prj` file with the same name next to the drawing (`site.dwg` and `site.prj`). This is optional, and it takes priority. It uses the same convention as ArcGIS for CAD files. A `.prj` that holds a local coordinate system, for example `LOCAL_CS["Drawing"]`, keeps the drawing off the map on purpose.
2. The coordinate system stored in the drawing by AutoCAD or Civil 3D (geographic location, the `GEODATA` object). Most survey drawings have one.
3. For DXF only: coordinates that fit in longitude and latitude are read as WGS84 (EPSG:4326), because GIS tools export longitude/latitude data as DXF without a coordinate system. This is never done for DWG, which only CAD software writes. The file details in the Hub show "assumed" when this rule applied.

The Hub shows where the coordinate system came from in the file details (**coordinate system** row).

When none applies, the drawing has **no geolocation**. DroneDB builds it in its own coordinates and does not place it on the map. The Hub opens it in the 3D viewer without a globe and shows the drawing units from the file (for example "Local coordinates (m)"). To put such a drawing on the map, upload a `.prj` with the same name. DroneDB then rebuilds the drawing. Deleting the `.prj` makes it local again.

Drawings without geolocation are not published through WMS, WFS, WMTS or the OGC API collection list, because they cannot be served in any coordinate system.

## CLI

```bash
# Index a vector file
ddb add contours.geojson

# A DWG drawing with an optional coordinate system file
ddb add site.dwg site.prj

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
