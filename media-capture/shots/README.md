# Shot definitions

Every screenshot and clip of the documentation is defined here, one YAML file per docs section
(`get-started.yaml`, `datasets.yaml`, `files.yaml`, `viewing.yaml`, `measure.yaml`,
`analyse.yaml`, `processing.yaml`, `sharing.yaml`, `account.yaml`, `self-hosting.yaml`).
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
  # url: /r/odm                      # any other Hub path (dataset list, /account, /admin/users …)
  base: hub                          # hub | local (local = always the throwaway local Registry)
  auth: none                         # none | demo | admin
  viewport: { width: 1440, height: 900 }   # optional; default 1440×900, device pixel ratio 2
  waitFor:                           # the page is ready when all of these hold
    selector: ".ol-layer canvas"
    networkIdle: true
    extraMs: 1500
  actions:                           # done in order before the shot (or recorded, for a clip)
    - click: "[aria-label='Plant Health']"
    - select: { selector: "[aria-label='Index']", value: NDVI }
    - fill: { selector: "input[name='name']", value: Survey 2026 }
    - hover: "[aria-label='Layers']"
    - press: Enter
    - wait: 1000                     # milliseconds, or a selector to wait for
    - mouse: { click: [720, 450] }   # CSS pixels in the viewport (map and 3D canvases)
    - drag: { from: [600, 400], to: [800, 400] }
    - scroll: { selector: ".file-list", y: 600 }
  highlight: "[aria-label='Plant Health']"   # red rounded box around the control that matters
  crop: null                         # null | a selector | { x, y, width, height } in CSS pixels
  maxSeconds: 20                     # clips only: the recording stops after this
  blocked: null                      # null | data (the showcase data is missing) | release
  youtubeId: null                    # clips only: filled in by hand after the YouTube upload
```

## Rules

- `id` is unique across all files. The section is the first part of the docs path of the page
  that shows it (`get-started`, `datasets`, `files`, `viewing`, `measure`, `analyse`,
  `processing`, `sharing`, `account`, `self-hosting`).
- Select controls by `aria-label` first, then by an existing `title`, then by visible text
  (`text=Share`). Avoid CSS classes of the Hub: they change.
- Shots of data that changes (upload, rename, paste, build, settings) use `auth: demo` and the
  demo organization `acme-surveys`, which `reset-demo.mjs` puts back in the same state before
  each run. Read-only shots use the public `odm` and `odx` datasets with `auth: none`.
- Administrator pages (`/admin/…`, Hangfire) and e-mails use `base: local` and `auth: admin`.
  Production admin pages show real users.
- No personal data in a shot: no real user names, e-mail addresses or private datasets.
- WebGL viewers (point cloud, 3D model, 3D viewer, splat) must wait for their loaded state, and
  the splat viewer must be set to a fixed quality (High), so frames are the same on each run.
