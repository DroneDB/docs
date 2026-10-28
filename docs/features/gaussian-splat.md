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
2. `build-lod` converts it into a **RAD** level-of-detail container, `model.rad`. The source is never modified and nothing is written next to it. An SPZ version 4 source (`NGSP`, ZSTD) is first rewritten as version 3 in a temporary folder, because `build-lod` reads versions 1 to 3.
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
| `upSource` | `ground-plane`: a plane fitted to the splats is the ground, and `up` is the side that most of the rest of the opacity is on. `pca`: no ground was found, so `up` is the flattest direction of the scene, with the side told by the skew of the splats (its confidence is at most 0.8). `georef`: the splat is georeferenced, `up` is `[0, 0, 1]` and the confidence is 1 without looking at the splats |

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

`build-lod` is supervised by an idle deadline: a run that prints no output for this long is stopped and the build fails. The default is **3600 seconds**. `DDB_BUILDLOD_IDLE_TIMEOUT_SECONDS` sets it to an integer from 1 to 86400 (24 hours); any other value fails the build before it starts. See [Building from Source](/docs/contributing/building-from-source#gaussian-splat-lod-producer-build-lod-required) for how to build the tool.

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
- A gzip-based SPZ (versions 1 to 3) is copied unchanged; an SPZ version 4 is rewritten as version 3.
- `.ksplat` and `.sog` are not converted (the command says which formats are).

You can tune the spherical-harmonics quantization with the `DDB_GSPLAT_SH_BITS` environment variable:

```bash
# Reduce SH bit depth to save bandwidth (values 1-8)
DDB_GSPLAT_SH_BITS=5 ddb gsplat scene.ply scene.spz

# Control first-band and remaining-bands bit depth independently
DDB_GSPLAT_SH_BITS=5,4 ddb gsplat scene.ply scene.spz
```

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

### View settings

The gear button opens the view settings:

- **Up axis**: which way is up in the scene. The first choice, **Auto**, is there when the build estimated an up it is confident of (`upConfidence` of at least 0.6 in `bounds.json`, see [Which way is up](#which-way-is-up)); it is labelled with where the estimate comes from: *Auto (ground plane)*, *Auto (principal axes)* or *Auto (georeferenced)*. The other choices are the six axes of the stored scene. Most 3DGS exports are stored with Y down (`−Y`); photogrammetry exports often use `+Z`. Change the choice when the scene looks upside down or on its side.
- **Point size**: scales the splats from 0.25x to 3x.
- **Ground plane calibration**: a roll and a pitch of up to 45 degrees on top of the up axis, to make walls and doors look vertical.

These settings are remembered on your device for each splat (for the 200 most recently changed ones), so a user who cannot write to the dataset keeps their own view. A splat opens with the first of these that exists:

1. The orientation in the views file (below).
2. What you chose on this device.
3. **Auto**, when the build has a confident estimate.
4. `−Y`, the default.

So a choice of yours or a saved orientation always beats the estimate, and a splat built before the estimate existed, or one whose estimate was not confident, opens as it did before. Auto is only a choice while there is an up to follow, the estimate of the build or the vector the views file saved; without one it is skipped and the next source decides.

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
- **Measurements** (toolbar at the top left): point (coordinates), distance (a line through any number of points), height (the difference along the scene's up between two points) and area (three or more points). Click the points; `Enter` or a right click ends a shape and `Escape` cancels it. Values are in the units of the file until the scene has a scale.
- **Set the scale**: pick two points on something of a known length and enter the real length in metres; distances, heights and areas are then shown in metres. The scale is saved in the views file as `metersPerUnit`. It is offered to users who can write to the dataset, on a scene that has none.

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
