---
title: OGC Services (WMS / WFS / WMTS / WCS / OGC API)
sidebar_label: OGC Services
---

# OGC Services

DroneDB Registry exposes every published dataset through a complete suite of OGC web services.
This lets you load Hub datasets directly into QGIS, ArcGIS, MapServer, GeoServer, OpenLayers,
MapLibre and any other client that speaks the standard OGC protocols.

The services are served per-dataset under
`/orgs/{orgSlug}/ds/{dsSlug}/` and discover the same `GeoRaster` and `Vector`
entries that you see in the web viewer.

## Supported standards

| Standard | Version | Endpoint root | Notes |
|----------|---------|---------------|-------|
| WMS | 1.1.1 & 1.3.0 | `/wms` | Multi-layer compositing, transparent backgrounds, NDVI/NDRE/NDWI/EVI/SAVI styles |
| WFS | 2.0.0 (1.1.0 alias) | `/wfs` | GeoJSON + GML output, BBOX filtering, paging via `count`/`startIndex` |
| WMTS | 1.0.0 | `/wmts` | XYZ tile pyramid backed by the per-dataset MVT cache for vectors and COG for rasters |
| WCS | 2.0.1 (1.1.x & 1.0.0 negotiable) | `/wcs` | GeoTIFF + PNG/JPEG `GetCoverage`, `ACCEPTVERSIONS` negotiation |
| OGC API – Features | 1.0 | `/ogcapi` | JSON landing page, conformance, collections, items |
| OGC API – Tiles | 1.0 | `/ogcapi/collections/{id}/tiles` | Vector (MVT `pbf`) and raster (`png`) tiles |
| Vector Tiles (Mapbox) | - | `/mvt/{hash}/{z}/{x}/{y}.pbf` | Direct tile pyramid, also used by the built-in viewer |

All endpoints share the same authentication: Basic auth, JWT bearer tokens, or
share-link tokens accepted by the rest of Registry. Public datasets work
anonymously.

## Quick start

Pick a public dataset hosted on Hub, e.g. `https://hub.dronedb.app/orgs/demo/ds/example`,
and replace `{base}` below with that base URL.

### WMS GetCapabilities

```bash
curl '{base}/wms?service=WMS&request=GetCapabilities&version=1.3.0'
```

### WMS GetMap

```bash
curl '{base}/wms?service=WMS&request=GetMap&version=1.3.0' \
     --data-urlencode 'layers=odm_orthophoto.tif' \
     --data-urlencode 'styles=NDVI' \
     --data-urlencode 'crs=EPSG:3857' \
     --data-urlencode 'bbox=1110000,4900000,1130000,4920000' \
     --data-urlencode 'width=512' \
     --data-urlencode 'height=512' \
     --data-urlencode 'format=image/png' \
     -G -o ndvi.png
```

Supported `STYLES`:

| Style | Formula | Use case |
|-------|---------|----------|
| (default) | true-color RGB rendering | natural-color orthophotos |
| `NDVI` | `(NIR − Red) / (NIR + Red)` | vegetation health |
| `NDRE` | `(NIR − RedEdge) / (NIR + RedEdge)` | crop stress, late-season chlorophyll |
| `NDWI` | `(Green − NIR) / (Green + NIR)` | water bodies |
| `SAVI` | `((NIR − Red) / (NIR + Red + 0.5)) × 1.5` | sparse vegetation |
| `EVI`  | `2.5 × (NIR − Red) / (NIR + 6×Red − 7.5×Blue + 1)` | dense canopies |

Spectral indices require a multispectral GeoRaster (≥3 bands using the
DroneDB convention `R=1, G=2, B=3, RedEdge=4, NIR=5`).

### WFS GetFeature (GeoJSON)

```bash
curl '{base}/wfs?service=WFS&request=GetFeature&version=2.0.0' \
     --data-urlencode 'typeNames=contours.gpkg' \
     --data-urlencode 'count=500' \
     --data-urlencode 'bbox=9.18,45.46,9.20,45.48,EPSG:4326' \
     --data-urlencode 'outputFormat=application/json' \
     -G > features.geojson
```

### MVT tile

```bash
curl '{base}/mvt/{hash}/14/8550/5824.pbf' -o tile.pbf
```

Where `{hash}` is the entry hash returned by `/orgs/{orgSlug}/ds/{dsSlug}/list`.

## QGIS step-by-step

### 1 – Add a WMS connection

1. Open **Layer → Add Layer → Add WMS/WMTS Layer…**
2. Click **New**, then fill in:
   - **Name**: `My DroneDB Hub`
   - **URL**: `https://hub.dronedb.app/orgs/{orgSlug}/ds/{dsSlug}/wms`
   - For private datasets, expand **Authentication** and add a Basic auth or
     bearer-token configuration.
3. Click **OK** → **Connect**. The dataset layers (one per `GeoRaster` /
   `Vector` entry) appear in the tree, with all available `STYLES`.
4. Select the desired layer + style and click **Add**.

### 2 – Add a WFS connection

1. Open **Layer → Add Layer → Add WFS Layer…**
2. **New** → URL `https://hub.dronedb.app/orgs/{orgSlug}/ds/{dsSlug}/wfs`
3. Set **Version** to `2.0.0` and **Max number of features** to e.g. `5000`.
4. Click **Connect**; select one or more `typeNames` and click **Add**.

QGIS will use BBOX filtering automatically as you pan/zoom.

### 3 – Add an OGC API – Features connection

1. **Layer → Add Layer → Add WFS Layer…**
2. **New** → expand **OGC API – Features** and set URL to
   `https://hub.dronedb.app/orgs/{orgSlug}/ds/{dsSlug}/ogcapi`.
3. Connect; the JSON landing page exposes one collection per vector entry.

### 4 – Add an XYZ tile layer (MVT)

1. **Browser** → right-click **XYZ Tiles → New Connection…**
2. URL template:
   `https://hub.dronedb.app/orgs/{orgSlug}/ds/{dsSlug}/mvt/{hash}/{z}/{x}/{y}.pbf`
   (replace `{hash}` with the entry hash; leave `{z}/{x}/{y}` literal).
3. Set Min/Max zoom to `0`/`18` and **OK**.

## OpenLayers (Vue 3)

```js
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import MVT from 'ol/format/MVT.js';

const layer = new VectorTileLayer({
  declutter: true,
  source: new VectorTileSource({
    format: new MVT(),
    url: `${baseApi}/mvt/${entryHash}/{z}/{x}/{y}.pbf`,
    minZoom: 0, maxZoom: 18, overlaps: false,
  }),
  style: myStyleFunction,
});
```

## MapLibre GL JS

```js
map.addSource('ddb', {
  type: 'vector',
  tiles: [`${baseApi}/mvt/${entryHash}/{z}/{x}/{y}.pbf`],
  minzoom: 0,
  maxzoom: 18,
});
map.addLayer({ id: 'ddb-poly', type: 'fill', source: 'ddb',
               'source-layer': 'default', paint: { 'fill-color': '#36c' } });
```

## WMTS

WMTS exposes the per-dataset tile pyramid both as KVP (`GetCapabilities` / `GetTile`)
and as a RESTful tile template.

### GetCapabilities

```bash
curl '{base}/wmts?service=WMTS&request=GetCapabilities&version=1.0.0'
```

Use `SECTIONS` to request a subset of the capabilities document, e.g.
`&SECTIONS=Contents`.

### RESTful tiles

```text
{base}/wmts/1.0.0/{layer}/{style}/{tileMatrixSet}/{z}/{y}/{x}.{ext}
```

`{ext}` is validated by the route and only the following are accepted:

| Extension | Media type | Layer kind |
|-----------|------------|------------|
| `pbf` | `application/vnd.mapbox-vector-tile` | vector |
| `png` | `image/png` | raster |
| `jpg` / `jpeg` | `image/jpeg` | raster |

> WebP is **not** a supported WMTS tile format - requesting `.webp` returns
> `404 Not Found` (the route does not match) rather than a tile, because the
> underlying tile generator only emits PNG/JPEG for rasters and MVT for vectors.

`{layer}` may be percent-encoded when it contains a path separator
(e.g. `folder%2Ffile.shp`).

### KVP GetTile

```bash
curl '{base}/wmts?service=WMTS&request=GetTile&version=1.0.0' \
     --data-urlencode 'layer=odm_orthophoto.tif' \
     --data-urlencode 'style=default' \
     --data-urlencode 'format=image/png' \
     --data-urlencode 'tileMatrixSet=WebMercatorQuad' \
     --data-urlencode 'tileMatrix=14' \
     --data-urlencode 'tileRow=5824' \
     --data-urlencode 'tileCol=8550' \
     -G -o tile.png
```

## WCS

### GetCapabilities & version negotiation

WCS supports three protocol generations and negotiates the version per request:

- **`VERSION`** (WCS 1.0 / 1.1 style) - an exact match is used, otherwise the
  highest supported version *less than or equal to* the requested one.
- **`ACCEPTVERSIONS`** (OWS Common 2.0 style, comma-separated) - the **first**
  version in the client's preference order that the server also supports is
  selected (client-driven order, not server-highest).
- When neither is supplied, the server advertises its highest version (`2.0.1`).

If no requested version can be satisfied the server returns an
`ows:ExceptionReport` with code `VersionNegotiationFailed`.

```bash
# Ask for 1.1.x first, fall back to 2.0.1
curl '{base}/wcs?service=WCS&request=GetCapabilities&acceptversions=1.1.1,2.0.1'
```

### GetCoverage

```bash
curl '{base}/wcs?service=WCS&request=GetCoverage&version=2.0.1' \
     --data-urlencode 'coverageId=dsm.tif' \
     --data-urlencode 'format=image/tiff' \
     --data-urlencode 'subset=E(1110000,1130000)' \
     --data-urlencode 'subset=N(4900000,4920000)' \
     -G -o dsm.tif
```

`format` accepts `image/tiff` (GeoTIFF), `image/png` and `image/jpeg`.

## OGC API – Features & Tiles

The OGC API surface is mounted at `/orgs/{orgSlug}/ds/{dsSlug}/ogcapi` and
returns JSON.

| Method & path | Purpose |
|---------------|---------|
| `GET /ogcapi` | Landing page (links to conformance & collections) |
| `GET /ogcapi/conformance` | Conformance declaration |
| `GET /ogcapi/collections` | List collections (one per vector layer) |
| `GET /ogcapi/collections/{collectionId}` | Single collection metadata |
| `GET /ogcapi/collections/{collectionId}/items` | Features as GeoJSON (`bbox`, `limit`, `offset`) |
| `GET /ogcapi/collections/{collectionId}/items/{featureId}` | Single feature (GeoJSON) |
| `GET /ogcapi/collections/{collectionId}/tiles` | Available tile sets for the collection |
| `GET /ogcapi/collections/{collectionId}/tiles/{tileMatrixSet}/{z}/{y}/{x}` | A single tile |

Items are returned with media type `application/geo+json`. Tiles are returned
with the media type matching the layer kind: vector layers serve
`application/vnd.mapbox-vector-tile`, raster layers serve `image/png`.

```bash
# Features
curl '{base}/ogcapi/collections/contours.gpkg/items?bbox=9.18,45.46,9.20,45.48&limit=500'

# A vector tile (served as application/vnd.mapbox-vector-tile)
curl '{base}/ogcapi/collections/contours.gpkg/tiles/WebMercatorQuad/14/5824/8550' -o tile.pbf
```

## Endpoint reference

All routes are relative to `{base}` = `/orgs/{orgSlug}/ds/{dsSlug}`.

| Service | Route |
|---------|-------|
| WMS | `GET {base}/wms` (KVP), `GET {base}/wms/p/{folder}` (folder-scoped) |
| WFS | `GET {base}/wfs`, `GET {base}/wfs/p/{folder}` |
| WMTS | `GET {base}/wmts`, `GET {base}/wmts/p/{folder}`, `GET {base}/wmts/1.0.0/{layer}/{style}/{tms}/{z}/{y}/{x}.{ext}` |
| WCS | `GET {base}/wcs` |
| OGC API | `GET {base}/ogcapi[/conformance|/collections...]` |
| MVT | `GET {base}/mvt/{hash}/{z}/{x}/{y}.pbf` |

## Error handling

OGC exceptions follow the version-appropriate envelope. The service is detected
from the request path and the protocol version is negotiated per service, so the
same error always renders with the correct schema - including authentication and
authorization failures, which are emitted by the shared OGC pipeline rather than
the generic Registry error page.

| Service / version | Envelope |
|-------------------|----------|
| WMS 1.1.1 | `ServiceExceptionReport` v1.1.1 |
| WMS 1.3.0 | `ServiceExceptionReport` (namespace `http://www.opengis.net/ogc`) |
| WCS 1.0.0 | `ServiceExceptionReport` v1.2.0 (predates OWS Common) |
| WCS 2.0 | `ows:ExceptionReport` (OWS 2.0 namespace) |
| WFS 2.0 / WMTS 1.0 / WCS 1.1 | `ows:ExceptionReport` (OWS 1.1 namespace) |

Authentication failures return HTTP `401` with a `WWW-Authenticate: Basic`
challenge and an exception envelope (code `AuthenticationFailed`) matching the
requested service. Datasets that cannot be found return `404` with code
`NotFound`.

Common codes: `MissingParameterValue`, `InvalidParameterValue`, `LayerNotDefined`,
`OperationNotSupported`, `InvalidFormat`, `VersionNegotiationFailed`,
`AuthenticationFailed`.

## Caching

- WMS/WCS responses set `Cache-Control: public, max-age=300`.
- MVT and WMTS tiles set `Cache-Control: public, max-age=86400, immutable`
  because they are deterministic build artefacts keyed by entry hash.
- The layer catalog (entries enumeration) is cached in Redis for 5 minutes
  per `(org, dataset, folder)`.

## See also

- [Multispectral imagery](./multispectral.md)
- [Building from source](./building-from-source.md)
- [API reference](./api-reference.md)
