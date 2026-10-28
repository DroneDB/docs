---
sidebar_position: 10
sidebar_label: Gaussian Splats
---

# Gaussian Splats

DroneDB indexes 3D Gaussian Splatting scenes, builds them into a streamed level-of-detail file and shows them in the Hub viewer. A scene reconstructed from drone imagery opens in the browser with only the detail in view downloaded, so a multi-gigabyte splat is usable without waiting for the whole file.

## Supported formats

| Format | Extension | Told from other files by | Splat count and SH degree at indexing | Accepted as a build source | Converted by `ddb gsplat` |
|--------|-----------|--------------------------|---------------------------------------|----------------------------|---------------------------|
| **PLY** | `.ply` | Its header (a splat PLY is told from a point cloud or a mesh by its content) | Yes, from the header | Yes | Yes |
| **SPLAT** | `.splat` | Its extension | Yes (32 bytes per splat, no spherical harmonics) | Yes | Yes |
| **SPZ** | `.spz` | Its extension | Yes, from the header | Yes (versions 1 to 4) | Yes |
| **KSPLAT** | `.ksplat` | Its extension | Yes, from the header | Yes | No |
| **SOG** | `.sog` | Its extension | No: the count is inside the ZIP, which indexing does not open | Yes | No |
| **RAD** | `.rad` | Its extension | No: the file is chunked and indexing does not read it | Yes, as it is (no `build-lod`) | No |

- **PLY** means the 3DGS layout (`x`, `y`, `z`, `f_dc_0..2`, `opacity`, `scale_0..2`, `rot_0..3` and optional `f_rest_*`) or the SuperSplat compressed layout (a `chunk` element). A PLY with a `face` element is a mesh, not a splat.
- **SOG** is a single-file bundle (a ZIP with `meta.json` and the WebP images of the splats). A `.sog` upload is indexed as a Gaussian Splat and built like the others.
- **RAD** is the level-of-detail container of Spark, the format a build writes. A trainer can deliver one as it is (a WebODM task makes a `splats.rad`), and a `.rad` added to a dataset is a Gaussian Splat: the build checks it, publishes it as `model.rad` and does not run `build-lod` (see [Uploading a RAD file](#uploading-a-rad-file)).
- The thumbnail of a built splat is rendered from its `model.rad` (from the old `.spz` for a dataset built before the RAD layout), so it does not depend on the source format. See [Thumbnail](#thumbnail).

:::note
A splat PLY and a point-cloud PLY have the same extension. DroneDB reads the header to decide: a PLY that looks like a splat is a Gaussian Splat entry, and one that fails the checks below stays a Gaussian Splat entry and its build fails with the reason.
:::

### What a splat PLY must look like

The build reads a PLY with `build-lod`, which is stricter than the PLY format. DroneDB checks the header before it starts the tool and fails the build with what to change in the export:

- The format must be **binary little-endian**, version 1.0. An ASCII or a big-endian PLY is refused (`ASCII splat PLY is not supported: export it as binary little-endian`).
- No list properties, and only the types `char`, `uchar`, `short`, `ushort`, `int`, `uint`, `float` and `double`.
- The `vertex` element must have `x`, `y`, `z`, `f_dc_0..2`, `opacity`, `scale_0..2` and `rot_0..3`. A missing one is named (`Splat PLY is missing properties: ...`).
- The number of `f_rest_*` properties must be **0, 9, 24 or 45** (spherical-harmonics degree 0 to 3). Any other number is refused (`f_rest count 12 is not 0, 9, 24 or 45`).
- A SuperSplat compressed PLY needs a `chunk` element with at least one record for every 256 splats and the `packed_*` properties.

A splat file whose data is damaged (for example, a position that is not a number) passes the header check and is refused by `build-lod`; the build error then carries the reason `build-lod` printed.

## Build pipeline

`ddb build` (and the Registry, when a splat is uploaded) turns the source into a streamed file:

1. The source is indexed as a `GaussianSplat` entry.
2. `build-lod` converts it into a **RAD** level-of-detail container, `model.rad`. The source is never modified and nothing is written next to it. `build-lod` reads every SPZ version as it is: the gzip-based versions 1 to 3 and version 4 (`NGSP`, ZSTD).
3. DroneDB computes the bounding box of the splats from `model.rad` and writes it as `bounds.json`, which the viewer uses to frame the first view. It also estimates which way is up (see [Which way is up](#which-way-is-up)). If the box cannot be computed the build still delivers `model.rad`.

The build artifacts are `model.rad` (role `gsplat.lod`) and `bounds.json` (role `gsplat.bounds`). The RAD format lets the viewer load coarse splats first and refine the scene as the camera moves; the file is read with HTTP range requests.

Datasets built before the RAD layout hold a `model.spz` (role `gsplat.spz`, legacy). The viewer still opens it while there is no `model.rad`, and a rebuild writes `model.rad` and removes the old file. Rebuild those datasets to get streaming.

`ddb gsplat` is not the build: it neither indexes nor produces the RAD (see [Converting to SPZ](#converting-to-spz-for-other-tools)).

### Which way is up

Splats do not say which way is up: a scene from COLMAP or the original 3DGS tools is stored with Y down, one from ODM with Z up. The build looks at the coarse splats of `model.rad` and writes the answer in `bounds.json` next to the bounding box:

```json
{
  "min": [-12.4, -0.8, -9.1],
  "max": [11.9, 6.2, 10.3],
  "up": [0.01, -0.99, 0.02],
  "upConfidence": 0.86,
  "upSource": "ground-plane"
}
```

| Field | Meaning |
|-------|---------|
| `up` | A unit vector, in the coordinates of `model.rad`, that points to the sky |
| `upConfidence` | From 0 to 1. Viewers use `up` from **0.6** |
| `upSource` | `ground-plane`: a plane fitted to the splats is the ground, and `up` is the side that most of the rest of the opacity is on. `pca`: no ground was found, so `up` is the flattest direction of the scene, with the side told by the skew of the splats (its confidence is at most 0.8). `georef`: the splat is [georeferenced](#georeferencing), `up` is `[0, 0, 1]` and the confidence is 1 without looking at the splats |

The estimate is low in confidence where the splats allow two answers, so that a confident `up` is one to rely on: a scene that is not flat along any direction (a room is as high as it is wide), two grounds that disagree (a wooded slope behind a subject that stands on level ground) and a ground with as much opacity on one side as on the other. The viewer then does not use it. A scene of fewer than 16 splats has an `up` with confidence 0, and one whose splats cannot be read has none; the build still delivers `model.rad` and `bounds.json`.

`up`, `upConfidence` and `upSource` are optional: a `bounds.json` from an earlier build has none of them, and the viewer uses its default (below).

### Uploading a RAD file

A `.rad` added to a dataset is already what a build makes, so the build does not run `build-lod`:

1. DroneDB reads the file with its own RAD reader: the header and the centres of every chunk. A file that cannot be read fails the build with the reason (for example `it is not a RAD file this can read`, or `the RAD file holds no splats`) instead of reaching a viewer that cannot read it.
2. The file is **copied** into the build as `model.rad`. The dataset file stays as it is, and changing it later does not change the published model until the next build.
3. `bounds.json` is written with the bounding box and the up vector, as for any other source.

Because there is no `build-lod` run, such a build also works where the program is not installed. A `.rad` has no splat count in the index (the Hub shows it as unknown).

### `build-lod` is required

A Gaussian Splat build needs the `build-lod` program (Spark's level-of-detail producer, built from the `vendor/spark` submodule with a Rust toolchain). **Without it a splat build fails** with:

```text
Building Gaussian Splats requires the build-lod tool, which was not found (set DDB_BUILDLOD_PATH or place build-lod next to the DroneDB executable)
```

The build does not wait for the tool and does not fall back to another format. Install `build-lod`, then build again.

DroneDB looks for it, in this order:

1. `DDB_BUILDLOD_PATH`, when set and not empty. It is authoritative: a value that is not an executable file means the tool is unavailable.
2. The folder of the running executable, then its `../bin`.
3. The folder of the DroneDB library, then its `../bin` (how programs that load the library, such as the Registry, find the tools packaged with it).
4. The `PATH`.

`build-lod` is supervised by an idle deadline: a run that prints no output for this long is stopped and the build fails with `build-lod killed after N s without output`, where N is the deadline. `build-lod` prints nothing while it sorts the splats, builds each level of its tree, prunes and writes the RAD, and these steps take longer as the splat grows, so the deadline grows with the number of splats:

- **8 minutes per million splats**, rounded up to a whole second;
- at least **3600 seconds** (1 hour) and at most **86400 seconds** (24 hours).

For example, a PLY of 31.6 million splats (7.45 GB) gets about 4.2 hours. The splat count comes from the header of the source (PLY, `.splat`, SPZ, `.ksplat`). For a `.sog`, which has no header DroneDB reads, it is estimated from the file size at 236 bytes per splat (a PLY with SH degree 3), so a compressed `.sog` often gets the minimum.

`DDB_BUILDLOD_IDLE_TIMEOUT_SECONDS` replaces this deadline for every build with an integer from 1 to 86400 (24 hours); any other value fails the build before it starts. See [Building from Source](/docs/contributing/building-from-source#gaussian-splat-lod-producer-build-lod-required) for how to build the tool.

## Thumbnail

The thumbnail of a built splat is a perspective view of the scene standing upright, painted as the splats really are: every splat is an ellipse with its own size and orientation, and the one in front hides the one behind. It is made from `model.rad` (or the old `.spz`), so it does not depend on the source format, and it is the same at every size up to 4096 px.

- The camera looks down on the scene from 35 degrees above the ground of the `up` of `bounds.json`, turned 35 degrees from the narrowest side of the subject. When `up` is missing or not confident, the thumbnail stands the scene on `−Y`, which is how the viewer opens it.
- It aims at the densest part of the scene, so floaters and the far background do not decide the framing, and leaves out what stands between the camera and the subject, the sky high above it and what lies under the ground.
- A **room** (splats on both sides of the flattest direction, a floor and a ceiling) is shown opened from above like a doll's house: seen from 55 degrees with its upper part and its near side cut away.
- A splat that would cover more than an eighth of the picture is a blur and is not drawn.

## CLI

```bash
# Index a Gaussian Splat file
ddb add scene.ply

# Build model.rad and bounds.json (needs build-lod)
ddb build
```

`ddb build -p scene.ply` builds one file. The products are written under `.ddb/build/` in the dataset; `ddb push` sends the dataset to a Registry, which builds splats itself.

### Converting to SPZ for other tools

```bash
# Convert a Gaussian Splat to a compressed .spz file
ddb gsplat scene.ply scene.spz
```

`ddb gsplat input.{ply|splat|spz} [output.spz]` writes an `.spz` that other tools (for example, a viewer or an editor that reads SPZ) can open. It is a conversion of one file: it does not touch the index, does not build anything and does not need `build-lod`.

- Without an output path it uses the input name with the `.spz` extension. For an `.spz` input that is the input itself, so give another path: the command refuses to overwrite the file it converts.
- The output is written whole or not at all, so a failed conversion leaves no half-written file.
- A gzip-based SPZ (versions 1 to 3) is copied unchanged; an SPZ version 4 is rewritten as version 3, which every SPZ reader opens (a version 4 file needs a reader of version 4).
- `.ksplat` and `.sog` are not converted (the command says which formats are).

You can tune the spherical-harmonics quantization with the `DDB_GSPLAT_SH_BITS` environment variable:

```bash
# Reduce SH bit depth to save bandwidth (values 1-8)
DDB_GSPLAT_SH_BITS=5 ddb gsplat scene.ply scene.spz

# Control first-band and remaining-bands bit depth independently
DDB_GSPLAT_SH_BITS=5,4 ddb gsplat scene.ply scene.spz
```

## Georeferencing

A splat is stored in the coordinates of the program that trained it, which say nothing about where on the Earth the scene is. A **georeferenced** splat has a local frame with a known place: its X axis points East, Y North and Z up, in metres. DroneDB then knows the position of the scene, so the Hub draws it on the map of the dataset, stands it upright without an estimate, and gives its measurements and the coordinates of a point in metres and on the Earth.

DroneDB does not georeference a splat by what it looks like: a **sidecar** file next to it says where the frame is.

### Sidecar files

When a splat is indexed, DroneDB looks for these files, in this order, and takes the first one that holds a usable georeference. `<stem>` is the name of the splat without its extension.

| File | Where |
|------|-------|
| `<stem>.geo.json` | The folder of the splat |
| `georef.json` | The folder of the splat (it georeferences every splat in that folder) |
| `reference_lla.json` | The folder of the splat |
| `coords.txt` | The folder of the splat (ODM's file) |
| `odm_georeferencing/coords.txt` | The folder of the splat (a splat at the root of an ODM project) |
| `reference_lla.json`, `opensfm/reference_lla.json` | The folder above the splat |
| `odm_georeferencing/coords.txt` | The folder above the splat |

A sidecar says where the frame is in one of two ways.

**A projected CRS and an offset** (`<stem>.geo.json` or `georef.json` with `crs` and `offset`, or ODM's `coords.txt`). A point of the scene is the coordinates of the splat plus the offset, in that CRS, which must be a projected one. `crs` is an EPSG code, a PROJ string or WKT. The offset is `[x, y]` or `[x, y, z]` (`z` is 0 when it is left out):

```json
{
  "crs": "EPSG:32632",
  "offset": [683240.5, 5047920.25, 0]
}
```

`coords.txt` is the file ODM writes in `odm_georeferencing/`: the CRS on the first line (`WGS84 UTM 32N`, or an EPSG code, a PROJ string or WKT) and the easting and northing of the offset on the second:

```text
WGS84 UTM 32N
683240.5 5047920.25
```

**A point of the Earth** (`<stem>.geo.json`, `georef.json` or `reference_lla.json` with a latitude and a longitude). The frame is the local East-North-Up plane at that point. `latitude` may also be written `lat`, `longitude` `lon` or `lng`, and `altitude` `alt` or `elevation` (0 when it is left out):

```json
{
  "latitude": 45.4642,
  "longitude": 9.19,
  "altitude": 120.0
}
```

The sidecar is read when the splat is indexed. Add it together with the splat, or before it: a splat that was indexed before its sidecar existed is not georeferenced until it is indexed again. The same sidecars georeference 3D models.

### What a georeferenced splat gets

- **The dataset map** draws the splat. At first it is a point, the position of the origin of its frame. Once the splat is built the point becomes the footprint of its bounding box, a polygon, read from the `wgs84Footprint` of `bounds.json`. Double-click the splat on the map to open it in the viewer; a splat with no georeference is not on the map.
- **Up is `+Z`** exactly, whatever the splats look like: `bounds.json` has `"up": [0, 0, 1]`, `"upConfidence": 1` and `"upSource": "georef"`, the thumbnail stands the scene on it and the viewer opens it with *Auto (georeferenced)* unless a views file or your device says otherwise.
- **The viewer works in metres**: distances, heights and areas are in metres, and the scale does not need to be set (the button is not offered).
- **Coordinates** of a measured point are shown in the CRS of the splat or in WGS84, with a button to change (see [Camera views, pins and measurements](#camera-views-pins-and-measurements)).

`bounds.json` of a georeferenced splat then looks like this (`wgs84Footprint` is a GeoJSON polygon of longitude and latitude, a closed ring):

```json
{
  "min": [-85.2, -61.4, -3.1],
  "max": [92.7, 70.3, 41.8],
  "up": [0, 0, 1],
  "upConfidence": 1,
  "upSource": "georef",
  "wgs84Footprint": {
    "type": "Polygon",
    "coordinates": [[[9.1888, 45.4637], [9.1912, 45.4637], [9.1912, 45.4648], [9.1888, 45.4648], [9.1888, 45.4637]]]
  }
}
```

With a projected CRS the footprint is the exact conversion of the four corners of the bounding box. With a point of the Earth it is the box laid on the local plane, which is accurate for the size of a scene.

### Training data from an ODM project

A splat trained from drone images is georeferenced if it is trained in the coordinates of the photogrammetry. `ddb gsplat --training-data` makes the input of a trainer from the outputs of an ODM project, in those coordinates:

```bash
ddb gsplat --training-data <output folder> [--max-image-size <pixels>] [--max-points <count>] <ODM project folder>
```

It reads the project and writes, in the output folder. The export never replaces a file it did not make, so the output folder:

- must be missing (it is created) or empty, so a second export needs a new or emptied folder;
- must be neither the ODM project folder, a folder that holds it nor a folder inside it (links are resolved), because the export writes `georef.json` and replaces an image of the same name in `images/`;
- must not be inside a DroneDB dataset when the export is asked of the library (`DDBExportSplatTrainingData`), because a `georef.json` in a dataset becomes the georeference of every model and splat beside it at the next index. The command applies the first two rules alone, so do not run it with a dataset as the output folder.

It writes:

| Output | What it is |
|--------|------------|
| `sparse/0/cameras.bin`, `images.bin`, `points3D.bin` | A COLMAP sparse model (binary, little-endian) in the CRS of `coords.txt` minus its offset, so in **metres with the axes East, North and Up** |
| `images/` | The images the model names: the originals linked from the project (copied where a link is not possible), or resized with `--max-image-size` |
| `georef.json` | `{"crs": ..., "offset": [easting, northing, 0]}` from `coords.txt`: the sidecar for the splat you train |

What the project must have:

- `cameras.json`, `odm_report/shots.geojson` (the poses of the images), the `images/` folder and `odm_georeferencing/coords.txt`. A missing one stops the export with an error that names the file.
- The point cloud, `odm_georeferencing/odm_georeferenced_model.laz` or else `odm_filterpoints/point_cloud.ply`. It gives the points of the model; without it `points3D.bin` is empty (a warning says so) and the trainer starts from random points.

| Option | Meaning |
|--------|---------|
| `--max-image-size <pixels>` | The longest side of the exported images. A smaller image keeps its size. The images are written as JPEG at quality 95, and the cameras are recomputed for their size. Without it the originals are used. |
| `--max-points <count>` | The most points of the model, thinned evenly on a 3D grid. 100000 by default; 0 writes none; at most 10000000 (a larger value is refused, because the grid holds every point it keeps). |

The command prints the output folder on the standard output. On the standard error it prints the warnings (`Warning: ...`) and the number of images and points. Read them before you train:

- **Images that look straight down.** When more than 98% of the images are within 12 degrees of nadir the export says so: a splat trained from them is sharp from above and poor from any other angle. Images taken at an angle, or around the subject, are needed to look at it from the side.
- **The lens.** Brown cameras (ODM's default) become COLMAP's `OPENCV` model, which has no third radial term (`k3`). It is folded into `k1` and `k2` by a fit over the radius of the image, and a warning gives the distance in pixels it moves the lens when that is more than 0.05. Perspective cameras become `RADIAL` and `fisheye_opencv` ones `OPENCV_FISHEYE`.
- **Images that are left out**, with the reason and the first names: an image of a camera model COLMAP has none for (only `brown`, `perspective` and `fisheye_opencv` are exported, so not a spherical camera), one whose camera is not in `cameras.json`, one whose file is not in `images/` or whose size is not its camera's, or one whose file name another shot has. If no image can be exported the command fails and gives the reasons.
- **The point cloud**: missing, empty, or lying away from the cameras (probably not in the coordinates of the project).

Then:

1. **Train the splat outside DroneDB**, with any 3DGS trainer that reads a COLMAP model (a folder with `images/` and `sparse/0/`). DroneDB does not train.
2. **Keep the coordinates.** The splat is georeferenced only if it is in the coordinates of the model it was trained from; a trainer or an editor that recentres, rotates or rescales the scene when it saves it breaks the georeference, and nothing in the file says so.
3. **Upload the splat next to `georef.json`**, in the same folder of the dataset (or give it its own `<stem>.geo.json` with the same content). The splat is indexed as georeferenced, and `ddb build` or the Registry builds it as any other.

```bash
ddb gsplat --training-data ./training --max-image-size 2000 ./odm_project
# ... train on ./training, which gives scene.ply ...
cp scene.ply ./training/georef.json my-dataset/
cd my-dataset && ddb add scene.ply georef.json && ddb build
```

### Exporting the training data from Hub

When the ODM project is uploaded to a dataset, Hub makes the same export without a command line. Select the folder of the project in the file browser (or the dataset itself, when the project is at its root), open the **Tools** menu and choose **Export splat training data**. The item is shown for one selected folder when the server offers the `splat-training-export` task, and it needs read access only.

The dialog warns when the folder does not look like an ODM project (neither `cameras.json` nor `odm_georeferencing/coords.txt`); the export then fails if a project file is missing. It asks for:

| Field | Meaning | Range | Default |
|-------|---------|-------|---------|
| **Largest image side (pixels)** | The longest side of the exported images (`--max-image-size`); 0 keeps the originals | whole number, 0 to 16384 | 1600 |
| **Most points** | The most points of the sparse model (`--max-points`); 0 writes none | whole number, 0 to 10000000 | 100000 |
| **File name** | The name of the ZIP | no folders, at most 150 characters | `<folder>-training-data.zip` (`dataset-training-data.zip` for the root) |

**Export** starts a background task and the dialog shows its progress by phase (cameras, points, images, model). When it is done the dialog offers **Download**. The ZIP holds what `ddb gsplat --training-data` writes, at its root: `sparse/0/cameras.bin`, `images.bin` and `points3D.bin`, `images/` and `georef.json`. With a largest side the images are JPEGs at that size; with 0 the original files are archived unchanged, so the ZIP can be large.

The warnings of the export (images that look straight down, an approximated lens, images left out, the point cloud) are listed in the dialog as soon as the task writes them, and stay in the log of the task. Read them before you train; the rest of the workflow (training outside DroneDB, keeping the coordinates, uploading the splat next to `georef.json`) is the one described above, with `georef.json` taken from the ZIP.

## In Hub

The Hub renders a built splat with [Spark](https://sparkjs.dev/) on three.js. The viewer shows a progress bar while the file loads, frames the scene from `bounds.json`, and shows a badge when it is streaming levels of detail. If the splat is not built yet, the viewer says so instead of showing an empty view.

### Browser requirements

The viewer needs **WebGL 2**. A browser or device without it shows an error that says so; try another browser or turn on hardware acceleration in the browser settings. If the browser takes the graphics context away the viewer warns you and comes back when it is given back.

### Navigation

There are two modes, chosen with the first two buttons at the right edge and remembered in your [preferences](/docs/registry/preferences) (fly is the default).

| | Fly | Earth |
|---|-----|-------|
| **Look / pan** | Drag with the left button (or one finger) to look around | Drag with the left button (or one finger) to grab and pan the ground |
| **Orbit** | | Right-drag orbits around the point under the pointer |
| **Pan / zoom** | Right-drag pans, the wheel zooms, a two-finger pinch zooms and pans | The wheel (or a two-finger pinch) zooms toward the pointer |
| **Move** | `W` `A` `S` `D` or the arrow keys; `Q` down, `E` up; `Shift` goes faster | |

The pad at the bottom right repeats the movement keys as press-and-hold buttons, larger on touch screens.

Other keys, when you are not typing in a field and no dialog is open:

| Key | Action |
|-----|--------|
| `1` to `9` (also on the numeric pad) | Go to the saved camera with that number |
| `-` / `+` | Previous / next saved camera |
| `P` | Start or stop the tour of the cameras |

The rail on the left edge lists the saved cameras (click one to fly to it), starts or stops an orbit around the scene, and starts or stops the tour. Users who can write to the dataset also have the buttons that save the current view as a camera and save the views file.

### Quality

How much the viewer draws decides how fast it is. The **Quality** setting is one of **Auto** (the default), **Low**, **Medium** and **High**. A preset sets four things:

| | Low | Medium | High |
|---|-----|--------|------|
| **Colour detail** (the highest spherical-harmonics degree drawn) | 0: flat colour | 1 | 3: full view-dependent colour |
| **Level of detail** (how fine the splats picked for the view are) | 0.5x: stops at splats about twice as large | 0.75x | 1x |
| **Splat budget** (the share of the splats Spark keeps for the view, out of its default for the device: 2.5 million on a desktop, less on a phone) | 25% | 50% | 100% |
| **Sharpness** (the highest pixel ratio the canvas is drawn at, never above the screen's own) | 1 | 1.5 | 2 |

Lower the quality on a slow device; **High** draws the most the viewer can.

**Auto** starts at High and watches how long the frames take:

- Under **30 frames per second** for about 2 seconds, it goes down one preset.
- Above **55 frames per second** for about 5 seconds, it goes up one preset. Going up waits longer so a scene that only just fits is not pushed back and forth.
- If a preset it just went up to proves too slow within 30 seconds, it does not try that preset again while the viewer stays open.
- A single long frame (a chunk uploading) is smoothed, and a page that is not drawing, such as a hidden tab, measures nothing.

The setting is in the [Preferences](/docs/registry/preferences) (**Viewers**, **Gaussian splats**, **Quality**) and in the view settings of the viewer, which are the same preference. A change takes effect at once on an open scene. In the view settings, and in the [About this splat](#about-this-splat-and-its-downloads) panel, Auto says which preset it draws at.

### View settings

The gear button opens the view settings: the up axis, the [quality](#quality), the point size and the ground plane calibration.

- **Up axis**: which way is up in the scene. The first choice, **Auto**, is there when the build estimated an up it is confident of (`upConfidence` of at least 0.6 in `bounds.json`, see [Which way is up](#which-way-is-up)); it is labelled with where the estimate comes from: *Auto (ground plane)*, *Auto (principal axes)* or *Auto (georeferenced)*. The other choices are the six axes of the stored scene. Most 3DGS exports are stored with Y down (`−Y`); photogrammetry exports often use `+Z`. Change the choice when the scene looks upside down or on its side.
- **Point size**: scales the splats from 0.25x to 3x.
- **Ground plane calibration**: a roll and a pitch of up to 45 degrees on top of the up axis, to make walls and doors look vertical.

These settings are remembered on your device for each splat (for the 200 most recently changed ones), so a user who cannot write to the dataset keeps their own view. A splat opens with the first of these that exists:

1. The orientation in the views file (below).
2. What you chose on this device.
3. **Auto**, when the build has a confident estimate.
4. `−Y`, the default.

So a choice of yours or a saved orientation always beats the estimate, and a splat built before the estimate existed, or one whose estimate was not confident, opens as it did before. Auto is only a choice while there is an up to follow, the estimate of the build or the vector the views file saved; without one it is skipped and the next source decides.

### About this splat and its downloads

The (i) button at the right edge opens a panel about the splat:

| Row | What it says |
|-----|--------------|
| **Splats** | The number of splats the index holds, or *Unknown* (SOG and RAD files have no count at indexing) |
| **Colour detail (SH)** | The spherical-harmonics degree, 0 (flat colour) to 3 (full) |
| **Size** | The extent of the bounding box in `bounds.json`: in metres for a georeferenced splat or one with a scale, otherwise in file units |
| **Level of detail** | *Streaming* with the number of chunks on the way, *Up to date for this view* with the pages in memory, or *Whole file loaded* for a file that is not a RAD (the levels are then built in the browser) |
| **Georeferenced** | *No*, or *Yes* with the CRS or the local East-North-Up frame |
| **Estimated up** | The `up` of `bounds.json` as an axis (`+Z`) or a vector, with its confidence and source, for example `+Z, 85% sure (ground plane)`; *Not estimated* without one |
| **Quality** | The setting, and for Auto the preset it draws at: *Auto (medium)* |

The panel also has the downloads of the splat. They are in the **Tools** menu of the file browser for a selected splat too:

| Download | What you get | When |
|----------|--------------|------|
| **Download original** | The file that was uploaded | Always |
| **Download level-of-detail (.rad)** | `model.rad`, the streamed container of the build | The build is complete |
| **Download .spz** | The `model.spz` of a build made before the RAD layout | Only while the splat has no `model.rad` (a rebuild replaces it) |
| **Download .spz (for other tools)** | A `.spz` converted from the file that was uploaded, for an editor or a viewer that reads SPZ | The build is complete, the file is a PLY, SPLAT or SPZ, and the server offers the `splat-spz-export` task |

The artifacts are downloaded by role from the Registry and saved named after the splat (`scene.rad`, `scene.spz`); the library's own names for them, which a client that downloads a build without asking for a role gets, are `model.rad`, `model.spz` and `export.spz`.

A splat that is not built, or is being built, offers the original only.

#### The .spz for other tools

The first request for **Download .spz (for other tools)** runs the `splat-spz-export` task of the [Processing Platform](/docs/registry/admin/processing-platform#splat-spz-export) and shows a notice that the file is being prepared; the browser downloads it when the task is done. The conversion decodes the whole file in memory, so a large splat takes a while and runs in the queue of builds. While the splat is being built, or another export of it is running, the task waits for the entry and tries again.

- The file is kept in the build of the splat as `gsplat/export.spz` (the artifact role `gsplat.export`, listed only while the file exists), so a second request downloads it at once. It is made again when the uploaded file is newer than it, and a forced rebuild of the splat removes it with the rest of `gsplat/`, so it is converted again on the next request. It never replaces `model.rad`, and it does not make a build complete.
- Only a PLY, a SPLAT or an SPZ is converted. A `.ksplat`, `.sog` or `.rad` source has no item, and the library refuses it.
- The same conversion from a shell is [`ddb gsplat`](#converting-to-spz-for-other-tools), which does not need a build.

### Camera views, pins and measurements

Cameras, pins and measurements are stored with the splat in a JSON file next to it, named like the splat with `_cameras.json` in place of the extension (`scene.ply` uses `scene_cameras.json`). The viewer writes version 2 of the file and reads version 1 and the earliest layout (a bare list of cameras) as they are; a file is rewritten as version 2 only when you save. Older viewers read the cameras and the orientation of a version 2 file and ignore the rest.

```json
{
  "version": 2,
  "orientation": { "upAxis": "-y", "flipped": true, "tiltRoll": 0, "tiltPitch": 0 },
  "scale": { "metersPerUnit": 0.5 },
  "cameras": [
    { "id": 1, "name": "Entrance", "position": [0, 1.6, 4], "quaternion": [0, 0, 0, 1], "fov": 60, "target": [0, 1.4, 0] }
  ],
  "annotations": [
    { "id": 2, "title": "Gate", "text": "Markdown text", "link": "https://example.com", "image": "photos/gate.jpg", "position": [1, 0, 2], "view": null }
  ],
  "measurements": [
    { "id": 3, "kind": "distance", "points": [[0, 0, 0], [1, 0, 0]] }
  ]
}
```

When the orientation is Auto, `upAxis` is `"auto"` and the file also holds the vector it was resolved to as `up` (for example `"up": [0.01, -0.99, 0.02]`), and it has no `flipped`. The saved vector is used before the estimate of `bounds.json`, so the saved cameras still match the scene after a rebuild that estimates another up.

All positions are in the coordinates of the splat file, so they stay where they are when you change the up axis or the tilt.

- **Camera views** (camera button): save the current view with a name, update it, rename, reorder and delete it. The cameras are numbered in list order, which is also the number of the key that calls them, and they are the stops of the tour.
- **Pins** (map-pin button): a title, a text in Markdown, a link and a picture, placed by clicking a point of the scene. The `link` must be a web address and the `image` a path of a file inside the dataset. Clicking a pin shows its card and flies to the view saved with it, and the tour also visits the pins that have a view.
- **Measurements** (toolbar at the top left): point (coordinates), distance (a line through any number of points), height (the difference along the scene's up between two points) and area (three or more points). Click the points; `Enter` or a right click ends a shape and `Escape` cancels it. Clicking the active tool again cancels it. Values are in the units of the file until the scene has a scale, and in metres after it; while they are not, a note under the toolbar says so.
- **Point coordinates**: a point shows its position in the coordinates of the splat file, from its origin: in file units, or in metres once the scene has a scale. On a [georeferenced](#georeferencing) splat it shows where the point is on the Earth, and a button at the end of the toolbar changes how: in the **CRS** of the splat (the button is named after it, for example `EPSG:32632`; the values are `x, y, z m` of that CRS, or `E, N, U m` from the origin of a local East-North-Up frame) or in **WGS84** (`latitude°, longitude°, height m`). The card of a pin on such a splat shows its coordinates the same way. WGS84 is offered when the Hub can convert the CRS, which it does for the UTM zones of WGS84 (`EPSG:326xx` and `EPSG:327xx`, or ODM's `WGS84 UTM 32N`) and for a CRS given as a PROJ string or WKT; for another EPSG code the button is not there and the coordinates stay in the CRS.
- **Set the scale** (the arrows button at the end of the toolbar): pick two points on something of a known length, then enter its real length in metres. Distances, heights and areas are then shown in metres, and the coordinates of a point in metres from the origin. The scale is kept as `metersPerUnit` in the views file when you save it, and setting it again replaces it. The button is offered to users who can write to the dataset, except on a georeferenced splat, which is in metres already.

Reading is for everyone, changing is for users who can write to the dataset. A user without write access sees the saved cameras, pins and measurements, and can measure, but what they measure is theirs for the session and is not saved.

If the views file cannot be read (for example, it was edited by hand into invalid JSON) the viewer warns you, and saving asks before it replaces the file.

## Workflow example

```bash
# 1. Index the Gaussian Splat output from ODX or another processor
ddb add scene.ply

# 2. Build the streamed format (needs build-lod)
ddb build

# 3. Push to Hub
ddb push
```

The Hub detects the Gaussian Splat entry and opens it with the splat viewer.
