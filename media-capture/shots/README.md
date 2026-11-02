# Shot definitions

Every screenshot and clip of the documentation is defined here, one YAML file per docs section
(`get-started.yaml`, `datasets.yaml`, `files.yaml`, `viewing.yaml`, `measure.yaml`,
`analyse.yaml`, `processing.yaml`, `sharing.yaml`, `account.yaml`, `self-hosting.yaml`,
`reference.yaml`).
`npm run media` captures them; nobody makes docs images by hand.

## Entry

```yaml
- id: analyse/plant-health--ndvi     # <section>/<feature>--<shot>; image: static/media/<id>.webp
  type: screenshot                   # screenshot | clip
  alt: NDVI of a multispectral orthophoto on the map   # alt text and default caption
  page: hub-guide/analyse/plant-health                 # docs page that shows it
  open:                              # the Hub page to open: either `open` or `url`
    org: odx
    ds: micasense
    path: odm_orthophoto/odm_orthophoto.tif
    view: map                        # map | pointcloud | model | unified | splat | panorama | markdown
    # compare: [a.tif, b.tif]        # instead of path and view: the map of the first with the others added (2+ rasters, split on)
  # url: /r/odm                      # any other Hub path (dataset list, /account, /admin/users …),
                                     # or an absolute URL that is not a Hub (http://localhost:5181/, the
                                     # MailHog of the local Registry): --base and base do not change it
  # desktop: qgis                    # instead of open/url: a desktop program, made by hand (see below)
  base: hub                          # hub | local (local = always the throwaway local Registry)
  auth: none                         # none | demo | admin
  viewport: { width: 1440, height: 900 }   # optional; screenshots 1440×900 at device pixel ratio 2, clips 1920×1200 at 1
                                     # the screen has the same size: 390×844 gives the phone layout
  uploadKBps: 4000                   # optional; the page uploads at most this fast (KB/s), so an
                                     # upload to a local Registry shows its progress
  waitFor:                           # the page is ready when all of these hold
    selector: ".ol-layer canvas"
    networkIdle: true
    extraMs: 1500
    # stable: true                   # screenshots: wait until two frames in a row are the same (default true)
    # timeout: 60000                 # longest wait for the selector, the network and the spinners
  actions:                           # done in order before the shot (or recorded, for a clip)
    - click: "[aria-label='Plant Health']"
    - rightClick: "text=odm_orthophoto.tif"   # opens the context menu of a file; the same as
    - click: { selector: "text=odm_orthophoto.tif", button: right }   # button: left | right | middle
    - click: { selector: "text=IMG_0180_2.tif", modifiers: [Control] } # Alt, Control, ControlOrMeta, Meta, Shift
    - click: { selector: "role=menuitem[name='Compare in Map']", popup: true }  # the shot goes on in the
                                     # tab the click opens (screenshots only)
    - select: { selector: "[aria-label='Index']", value: NDVI }
    - fill: { selector: "input[name='name']", value: Survey 2026 }
    - hover: "[aria-label='Layers']"
    - press: Enter
    - wait: 1000                     # milliseconds, or a selector to wait for
    - mouse: { click: [720, 450] }   # CSS pixels in the viewport (map and 3D canvases)
    - drag: { from: [600, 400], to: [800, 400] }
    - drag: { selector: "[aria-label='Layer opacity']", from: [0.95, 0.5], to: [0.4, 0.5] }   # fractions
                                     # of the element's box: a slider, wherever the Hub puts it
    - scroll: { selector: ".file-list", y: 600 }   # mouse wheel over it: a list scrolls, a map zooms (y < 0 in)
    - mouse: { dblclick: [720, 450] }              # also { move: [x, y] }; click/dblclick take button: right
    - setFiles: { selector: "input[type=file]", files: [brighton-beach/images/DJI_0018.JPG] }
    - setFiles: { selector: "[aria-label='Files']", files: [brighton-beach] }   # one folder: a folder drop
  highlight: "[aria-label='Plant Health']"   # red rounded box around the control that matters
  crop: null                         # null | a selector | { x, y, width, height } in CSS pixels
  maxSeconds: 20                     # clips only: the recording stops after this
  blocked: null                      # null | data (the showcase data is missing) | release
  youtubeId: null                    # clips only: filled in by hand after the YouTube upload
```

## Waits and actions

- Without `waitFor.selector`, a shot of a viewer (`open.view`) waits for the loaded state of that
  viewer (`VIEW_READY` in `capture.mjs`). Every shot also waits until no loading spinner is
  visible. `networkIdle` is true when it is not set.
- `setFiles` gives files to a file input, or drops them on a drop zone (any other element) the way a
  drag from the desktop does. A relative path is read from the demo inputs root (`DDB_DOCS_INPUTS`,
  default `/mnt/data/datasets`, the same root as `demo-inputs.yaml`); input files are never committed.
  One folder instead of files keeps its structure: each file has its path in the folder, as with a
  folder input or a folder dragged from the desktop; the folder must hold real files (Playwright
  skips symbolic links in it). A file input may be hidden: a picker button
  that creates one (Select Folder) is clicked first, then `setFiles` names the input
  (`input[type='file'][webkitdirectory]`).
- Relative times ("1 hour ago") are the same on each run: on a page that is not a viewer, the
  page clock starts 90 minutes after the last `reset-demo` of the shot's Hub and runs on from
  there. The demo data, made during the reset, shows "1 hour ago"; other data shows its age at the
  time of that reset. Without a reset of that Hub the clock is the real one.
- In a clip, the cursor moves to each control before it acts, and actions are 0.5 s apart.
- Notifications that come and go (`.p-toast`) are hidden in the image, unless a selector of the
  shot names a toast.
- A screenshot is at most 250 KB: the WebP quality goes down from 85 to 60, then the image is
  scaled down, at most to half its size (full-screen aerial imagery: the CSS size of the
  viewport). The capture prints when it scaled an image; crop the shot to the panel that matters
  to keep the full resolution.

## Shots made by hand

A shot of a desktop program (QGIS) cannot be captured in the browser. Its entry has
`desktop: <program>` and no `open` or `url`; the other keys are the same. The capture skips it
and reports whether its image is there. Its image (screenshot, or clip poster) is made by hand at
`static/media/<id>.webp`, as a WebP of at most 250 KB, at device pixel ratio 2 for a screenshot;
`npm run media:index` lists it like a captured one.

## Rules

- `id` is unique across all files. The section is the first part of the docs path of the page
  that shows it (`get-started`, `datasets`, `files`, `viewing`, `measure`, `analyse`,
  `processing`, `sharing`, `account`, `self-hosting`, `reference`).
- Select controls by `aria-label` first (`[aria-label='Settings']`), then a button with a visible
  text by role and name (`role=button[name='Create Dataset']`: it skips hidden copies), then by an
  existing `title`, then by visible text (`text=Share`). Avoid CSS classes of the Hub: they change.
  `role=…[name='…']` must match the whole accessible name, and the tabs and file tiles of the
  dataset page have their icon glyph in it: select those with `[role='tab']:has-text('Map')`.
  A control without a name gets one in the Hub, not a class selector here.
- Shots of data that changes (upload, rename, paste, build, settings) use `auth: demo` and the
  demo organization `acme-surveys`, which `reset-demo.mjs` puts back in the same state before
  each run. Read-only shots use the public `odm` and `odx` datasets with `auth: none`.
- Administrator pages (`/admin/…`, Hangfire) and e-mails use `base: local` and `auth: admin`.
  Production admin pages show real users.
- No personal data in a shot: no real user names, e-mail addresses or private datasets.
- WebGL viewers (point cloud, 3D model, 3D viewer, splat) must wait for their loaded state, and
  the splat viewer must be set to a fixed quality (High), so frames are the same on each run.
