---
sidebar_position: 5
sidebar_label: DroneDB Library (C API)
description: 'Integrate the DroneDB library (libddb) through its C API: versions, start-up, configuration, errors, entry paths, cancellation and the build manifest'
---

# DroneDB Library (C API)

The DroneDB library, `libddb` (`libddb.so` on Linux, `ddb.dll` on Windows), does the indexing, builds, tiles, thumbnails and raster analysis behind the `ddb` command line and Registry. Programs use it through its C API, declared in `ddb.h`. Registry calls it from .NET with P/Invoke; any language with a C foreign-function interface can do the same.

This page is for integrators who load the library themselves. The `ddb` command line contains the library and needs none of this.

## Versions and ABI

The library, its C ABI and the release have **one version**, the `version` of DroneDB's `package.json` (2.0.0 for this release). It is written into the generated header `ddb_version.h`:

| Macro | Value in 2.0.0 |
|-------|----------------|
| `DDB_VERSION_MAJOR`, `DDB_VERSION_MINOR`, `DDB_VERSION_PATCH`, `DDB_VERSION_STRING` | `2`, `0`, `0`, `"2.0.0"` |
| `DDB_ABI_MAJOR`, `DDB_ABI_MINOR` | `2`, `0` (the major and minor of the version) |

The ABI follows semantic versioning: a removed or changed export needs a new major version, a new export at least a new minor. Within a major version the C ABI only grows, and the JSON outputs only gain fields.

Every release publishes, next to the `.deb` and the Windows zip:

| Asset | Content |
|-------|---------|
| `ddb.h` | The C API (valid C11 and C++) |
| `ddb_export.h` | The export macro `DDB_DLL`, one file for every platform |
| `ddb_version.h` | The version macros above |
| `ddb.symbols` | The list of exported functions |
| `SHA256SUMS` | The SHA-256 of every asset |

The library exports exactly the functions listed in `ddb.symbols` (108 in 2.0.0) and nothing else; its C++ classes and functions are internal. Pin a release by version and SHA-256, and build against that release's headers.

## Start-up and shutdown

A host checks the library before it uses it, configures it, then registers the process:

```c
#include <ddb.h>

int start_ddb(void) {
    uint32_t abi = DDBGetAbiVersion();               /* callable before DDBRegisterProcess */
    if ((abi >> 16) != DDB_ABI_MAJOR) return -1;     /* another major version: refuse */

    const char *caps = DDBGetCapabilities();         /* JSON: abi, version, errorCodes, errorReasons,
                                                        cancellable, symbols; owned by the library */
    (void)caps;

    if (DDBConfigure("{\"cpuPoolSize\": 6, \"gdalCacheMb\": 512}") != DDBERR_NONE) return -1;
    /* optional: DDBSetLogCallback(cb, minLevel, user) to receive the native log records */

    if (DDBRegisterProcess(false) != DDBERR_NONE) {  /* a failed initialization is final */
        /* DDBGetLastError() has the reason */
        return -1;
    }
    return 0;
}
```

When the host stops, after it has stopped sending work, it calls `DDBShutdown(timeoutMs)`: new calls are refused with `DDBERR_SHUTDOWN`, the calls in flight are asked to stop and are waited for, the pooled index connections are checkpointed and closed, and the log is flushed.

Registry runs this sequence at start-up and refuses to start when the library is not 2.x or lacks an export it calls.

## Process configuration

`DDBConfigure(json)` sets process-wide settings; `DDBGetEffectiveConfig` returns the settings in effect, where each one comes from (`configure`, `environment` or `default`) and the core count. Each setting takes the `DDBConfigure` value, else its environment variable, else the default. A value of `null` puts a setting back to its environment variable or default. An unknown name or an invalid value returns `DDBERR_INVALIDARGS` and changes nothing. Call it before `DDBRegisterProcess`; it can also be called later, and a change applies to the work that reads the setting afterwards.

| Setting | Environment variable | Default | Meaning |
|---------|----------------------|---------|---------|
| `cpuPoolSize` | `DDB_CPU_POOL_SIZE` | cores − 1 | Worker threads the library may run at once beside the calling threads, across every call (parallel indexing, GDAL threads, PDAL readers, Obj2Tiles, untwine). `0` runs every call on its calling thread only. |
| `ioThreads` | `DDB_IO_THREADS` | `4` | Threads of one disk-bound section (hashing the files of a delta, deleting build folders). |
| `minFreeDiskMb` | `DDB_MIN_FREE_DISK_MB` | `512` | Free MiB a build or a copy of build artifacts needs on the volume it writes to; below it the call fails with the reason `lowDiskSpace`. `0` turns the check off. |
| `gdalCacheMb` | `DDB_GDAL_CACHE_MB` | `1024` | Size in MiB of GDAL's block cache, shared by the whole process (tiles, renders, thumbnails, statistics, builds); 16 to 1048576. Set with `DDBConfigure`, it is the size of the cache at once, raising or lowering GDAL's own default (5 % of the RAM) and winning over `GDAL_CACHEMAX`. From the environment or the default it is an upper bound only: `DDBRegisterProcess` lowers GDAL's cache to it, never raises it, and leaves an explicit `GDAL_CACHEMAX` alone. A build in flight keeps the cache it asked for (`DDB_COG_CACHE_MB`) until it ends. |
| `cacheDir` | `DDB_HOME` (then `$DDB_HOME/.ddb`) | `~/.ddb` | Absolute folder where the library caches thumbnails, tiles, index templates and DSM tiles. The registry credentials of the `ddb` command line stay in the profile folder. |

Environment variables are read strictly: digits only, so `1024MB` is ignored and the default applies. The other environment variables of the library (index connections, COG builds, renders) are listed in the [CLI reference](/docs/cli/cli-reference).

## Errors

Every export returns a `DDBErr`:

| Code | Value | Meaning |
|------|-------|---------|
| `DDBERR_NONE` | 0 | Success |
| `DDBERR_EXCEPTION` | 1 | Failure; see the message |
| `DDBERR_BUILDDEPMISSING` | 2 | A build waits for a missing companion file |
| `DDBERR_BUILDINPROGRESS` | 3 | Another build of the entry is running |
| `DDBERR_CANCELED` | 4 | Canceled by the progress callback or a cancel token |
| `DDBERR_BUSY` | 5 | The index is busy |
| `DDBERR_NOTFOUND` | 6 | Not found (`DDBGet` of a missing path) |
| `DDBERR_INVALIDARGS` | 7 | Invalid arguments: a client error |
| `DDBERR_RETRYABLE` | 8 | A temporary condition; `DDBGetLastErrorReason()` says which (`lowDiskSpace`, `noSpaceOnDevice`, `idleTimeout`) |
| `DDBERR_SHUTDOWN` | 9 | The library is shutting down |

After a failure, read `DDBGetLastError()` (the whole message, UTF-8) and `DDBGetLastErrorReason()` on the same thread, before any other call: the last error belongs to the calling thread and is cleared when a call starts. A failed call leaves its output pointers untouched or NULL; outputs are written only on success. `DDBERR_INVALIDARGS` and `DDBERR_RETRYABLE` are returned by the exports added in 2.0; the older exports keep the codes they returned in 1.x (`DDBERR_EXCEPTION` with the same reason), except for a refused entry path (below), a canceled token and a shutdown.

## Entry paths

An entry path is a path inside a dataset, relative to its root (`photos/a.jpg`), as the index stores it. Every export that takes one applies the rule of `DDBNormalizePath`:

- `\` and `/` both separate segments; `.` segments and repeated or trailing separators are dropped, so `a\b`, `./a//b/` and `a/b` name the same entry;
- a path that is absolute (a leading `/` or `\`, or a drive such as `C:`), has a `..` segment, names the reserved `.ddb` folder at any depth, or is not valid UTF-8 is refused: the call returns `DDBERR_INVALIDARGS`, changes nothing, and the last error reads `Invalid <argument> '<path>': <code>` (`absolute`, `traversal`, `reserved`, `encoding`, `empty`).

This applies to `DDBGet`, `DDBListEntries` and `DDBListEntriesEx` (folder; `""` and `"."` are the root), `DDBSearch`, `DDBMoveEntry`, `DDBBuild` (source), `DDBIsBuildable`, `DDBIsBuildActive`, `DDBIsBuildComplete`, `DDBGetBuildStatus`, `DDBGetBuildArtifacts`, the `DDBMeta*` exports (and the rows of `DDBMetaRestore`), `DDBStac` and `DDBStacData`, `DDBResolveBuildFile`, and every path inside a delta (`DDBApplyDelta`, `DDBApplyDeltaEx`, `DDBComputeDeltaLocals`). It also applies to the exports that existed in 1.x, whose other invalid arguments still return `DDBERR_EXCEPTION`.

Filesystem paths are not entry paths and keep their meaning: the files `DDBAdd`, `DDBAddWithOptions` and `DDBAddWithHints` add, the paths of `DDBRemove`, `DDBList` and `DDBInfo`, dataset folders, output files and `DDBBuild`'s destination.

Call `DDBNormalizePath(path, reservedJson, &out)` to check or normalize a path before using it (it answers `{"path": "<normalized>"}` or `{"rejected": "<code>"}`); `reservedJson` adds names reserved as the first segment (Registry reserves its own upload folder this way). DroneDB keeps the expected results of 54 inputs in `tests/contract/vectors/entry-paths.json`, so a host can test that it rejects the same paths.

## Cancellation

A cancel token stops the work of a call from another thread:

1. `DDBCreateCancelToken(&token)`, one per request or job;
2. `DDBSetThreadCancelToken(token)` on the thread that makes the call, right before it (the next call takes it; set it again before every cancellable call);
3. `DDBCancel(token)` from any thread: the call stops at its next checkpoint and returns `DDBERR_CANCELED`;
4. `DDBFreeCancelToken(token)` when the host no longer needs it.

The `cancellable` list of `DDBGetCapabilities()` names the exports that honour a token. In 2.0.0 there are 28:

- tiles, renders and thumbnails: `DDBTile`, `DDBMemoryTile`, `DDBMemoryTileEx`, `DDBMemoryTileFmt`, `DDBRenderRasterRegion`, `DDBRenderRasterRegionEx`, `DDBRenderRasterIndex`, `DDBGenerateThumbnail`, `DDBGenerateMemoryThumbnail`, `DDBGenerateMemoryThumbnailEx`;
- exports and builds: `DDBExportRaster`, `DDBExportRaster2`, `DDBBuild`, `DDBBuildEx`;
- raster analysis: `DDBGetRasterMetadata`, `DDBGetRasterValueInfo`, `DDBGetRasterPointValue`, `DDBGetRasterAreaStats`, `DDBGetRasterProfile`, `DDBCalculateVolume`, `DDBDetectStockpile`, `DDBDetectAllStockpiles`, `DDBGenerateContours`, `DDBMaskBorders`;
- Gaussian splats: `DDBExportSplatTrainingData`;
- deltas: `DDBComputeDeltaLocals`, `DDBApplyDelta`, `DDBApplyDeltaEx`.

A canceled call leaves no partial output (a canceled `DDBMaskBorders` writes no file). `DDBApplyDelta` and `DDBApplyDeltaEx` are atomic to a cancel: they stop while they read and hash the added files, with the dataset and the source files as they were, and once they start to change the dataset they apply the delta whole and return `DDBERR_NONE`.

## Builds

`DDBBuild(ddbPath, source, dest, force, pendingOnly)` builds the derivative products of an entry. `DDBBuildEx(ddbPath, source, dest, force, pendingOnly, optionsJson)` takes the same arguments and a JSON object of options; `DDBBuild` is `DDBBuildEx` without options. The only option is `{"threads": N}`, an integer from 1 to 4096 (not `2.0`, `true` or `"2"`): the most threads each build of the call may use. It only lowers the `DDB_BUILD_THREADS` budget and never raises it. It bounds the GDAL threads of a raster build, the `bm3d` program of a 3D model build, the cores of Obj2Tiles and the PDAL `writers.copc` fallback; Untwine and `build-lod` have no thread option and are not bounded. `NULL`, `""` and `{}` mean no cap. A malformed text, a value that is not an object, any other key, or a `threads` outside the rule returns `DDBERR_EXCEPTION` with a message that names the problem, before anything is built. Registry uses the cap for the [background rebuild](/docs/registry/admin/configuration#processingbudget) of models.

## Build manifest

The library owns the layout of build outputs, the build state and the rules of each entry type. A host serves what these exports return and never composes a build path itself:

| Export | Returns |
|--------|---------|
| `DDBGetEntryTypes` | Every entry type: `id`, `name`, `buildable`, `thumbnail` (`none`, `file`: rendered from the file, `build`: from an artifact once built), `sidecarExtensions`, `roles` |
| `DDBGetBuildArtifacts` | For many entries with one index open: `buildable`, `state` (`none`, `pending`, `building`, `complete`), `missingDependencies`, `lastAttempt`, `retryAfter` (Unix seconds from which a pending build is retried), `root` and the artifacts that exist |
| `DDBListEntriesEx` | A listing with the same build object per entry (option `withBuild`) |
| `DDBResolveBuildFile` | The checked absolute path of a file of a build (`.../build/{hash}/{path}`, tiles included) |
| `DDBCopyBuildArtifacts` | Copies an entry's build, with its pending marker, to another dataset |

An artifact is `{role, path, kind, mediaType, downloadName?, index?, legacy?, fallbackFor?}`: `path` is relative to the build root, `kind` is `file` or `dir` (`index` names the descriptor of a directory), `downloadName` is set for downloadable artifacts. A `legacy: true` artifact is the output of an older build layout. Its `fallbackFor` names the role it stands in for, and the artifact is listed only while that role is missing, so a client that reads the roles in its order of preference shows the old output until a rebuild writes the new one. Roles say what an artifact is for, never where it is, and are only ever added: pass an unknown role through.

| Role | Artifact | Media type |
|------|----------|------------|
| `raster.cog` | Cloud Optimized GeoTIFF of a GeoRaster | `image/tiff; application=geotiff; profile=cloud-optimized` |
| `vector.gpkg` | GeoPackage of a vector | `application/geopackage+sqlite3` |
| `vector.mvt` | Mapbox Vector Tiles (directory; index: the TileJSON) | `application/json` |
| `vector.local` | Drawing-coordinate metadata of a CAD drawing without a CRS | `application/json` |
| `pointcloud.copc` | Cloud Optimized Point Cloud | `application/vnd.laszip+copc` |
| `pointcloud.ept` | Entwine Point Tiles of datasets built before COPC (legacy, read only; `fallbackFor: "pointcloud.copc"`) | `application/json` |
| `model.bm3d` | bm3d multiresolution 3D model (`bm3d/model.bm3d`) | `application/vnd.dronedb.bm3d` |
| `model.nexus` | Nexus multiresolution mesh of models built before bm3d (`nxs/model.nxz`; legacy, read only; `fallbackFor: "model.bm3d"`) | `application/octet-stream` |
| `model.3dtiles` | OGC 3D Tiles (directory; index: `tileset.json`) | `application/json` |
| `gsplat.lod` | Level-of-detail Gaussian Splat (`gsplat/model.rad`, streamed with range requests) | `application/octet-stream` |
| `gsplat.spz` | SPZ Gaussian Splat of builds before the RAD layout (`gsplat/model.spz`; legacy, read only; `fallbackFor: "gsplat.lod"`) | `application/octet-stream` |
| `gsplat.bounds` | Bounding box of the splats to frame the first view, with the estimated `up` and, for a georeferenced splat, its `wgs84Footprint` (`gsplat/bounds.json`; optional) | `application/json` |

A rebuild of a model writes `bm3d/` and removes `nxs/` only after `bm3d/` is published, and a failed rebuild keeps `nxs/`, so a model stays viewable while it is rebuilt.

Registry passes these artifacts to clients as `artifacts: [{role, url, mediaType}]` on each entry.

## Training data of a Gaussian splat

`DDBExportSplatTrainingData(ddbPath, folder, outFolder, optionsJson, progress, progressUserData, &output)` is `ddb gsplat --training-data` on a dataset. It reads the ODM project that is in `folder` of the dataset (an entry path; `NULL`, `""` and `"."` are the root) and writes the [training data](/docs/features/gaussian-splat#training-data-from-an-odm-project) into `outFolder`, a folder of the filesystem (UTF-8) that is created if it is missing and must not be the folder of the project: a COLMAP sparse model in `sparse/0`, the images in `images/` and `georef.json`. The project needs `cameras.json`, `odm_report/shots.geojson`, `images/` and `odm_georeferencing/coords.txt`, and has its point cloud in `odm_georeferencing/odm_georeferenced_model.laz` or `odm_filterpoints/point_cloud.ply`. The call only reads the dataset.

| Argument | Meaning |
|----------|---------|
| `optionsJson` | `NULL`, `""` or `{}` for the defaults, else an object with `maxImageSize` (the longest side of the images in pixels; 0, the default, exports the originals) and `maxPoints` (the most points of the model; 100000 by default, 0 writes none). Both are whole numbers from 0. A member that is not known, or not a whole number in range, is refused with `DDBERR_INVALIDARGS`. |
| `progress`, `progressUserData` | Optional (`NULL` for none). Called with the fraction done (0 to 1) and the phase (`cameras`, `points`, `images` or `model`), one call at a time; a non-zero return cancels the call. |

On success `output` is a JSON object, to free with `DDBFree`: `{"warnings": ["..."], "images": 412, "points": 98211}`. The warnings are what a user should know before training: images that were left out, an approximated lens, no point cloud, images that mostly look straight down.

| Return | When |
|--------|------|
| `DDBERR_NONE` | Done |
| `DDBERR_INVALIDARGS` | An argument is `NULL` or empty, or an option is refused |
| `DDBERR_NOTFOUND` | `folder` is not in the dataset |
| `DDBERR_EXCEPTION` | A file of the project is missing or unusable (the message names it, `coords.txt` included), or no image can be exported (the message gives the reasons) |
| `DDBERR_CANCELED` | The cancel token was canceled, or the progress callback returned non-zero |
| `DDBERR_BUSY` | Database contention |

A failed or canceled call may leave a partial `outFolder`: delete it. The export is in the `cancellable` list of `DDBGetCapabilities()`.

## Spectral indices of a raster

`DDBGetRasterInfo` reports, in `indexLayer`, the spectral indices `DDBRenderRasterIndex` (the WMS index layer) can render from the raster: a subset of `NDVI`, `NDRE`, `NDWI`, `SAVI`, `EVI`, in that order, `[]` when there are none. The bands come from the raster's sensor profile; a raster without named bands and with five data bands or more is read as R, G, B, RedEdge, NIR. SAVI and EVI are listed only for floating-point rasters. `DDBRenderRasterIndex` refuses an index the list does not hold, with the reason.

The formula list of `DDBGetRasterMetadata` marks the formulas a raster cannot compute with `"disabled": true` and a `disabledReason` ("Requires bands: ..." or, for SAVI, OSAVI and EVI on an integer raster, "... needs reflectance values"). See [Multispectral imagery](/docs/features/multispectral#vegetation-indices).

## Index files

The library keeps idle index connections open between calls and leaves committed changes in `.ddb/dbase.sqlite-wal`. Call `DDBCheckpoint` before copying `dbase.sqlite` without its WAL, and `DDBReleaseConnections` before deleting, moving or replacing a dataset folder from the same process. Details and settings: [CLI reference](/docs/cli/cli-reference).

## Output contract

The JSON outputs Registry reads (listings, entries, build manifest, STAC, raster information, capabilities, effective configuration) have JSON Schemas and golden fixtures in DroneDB's `tests/contract` folder. Field names and types are frozen within a major version; times are integer Unix seconds.
