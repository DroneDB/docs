# Capture pipeline

Every screenshot and clip of the documentation is captured from a running Hub by these tools;
nobody makes docs images by hand. The shot definitions are in `shots/` (format:
[`shots/README.md`](shots/README.md)).

| File | What it does |
|------|--------------|
| `capture.mjs` | Captures the shots with Playwright (`npm run media`, `npm run media:capture`) |
| `overlay.js` | Injected into the pages: cursor dot and click ripple in clips, red highlight box |
| `encode.sh` | ffmpeg: screenshots to WebP (≤ 250 KB), clips to H.264 MP4 and a poster |
| `build-media-index.mjs` | Writes `src/data/media.json` from the shots and the images (`npm run media:index`) |
| `reset-demo.mjs` | Puts the demo data back in its fixed state (`npm run reset-demo`) |
| `demo-inputs.yaml` | The demo datasets and their files, as data |
| `YOUTUBE.md` | How to upload the clips |
| `local/` | The local Registry 3.0 that mirrors the showcase datasets (usage at the top of `start.sh` and `mirror-datasets.sh`) |
| `test/` | Shots that test the pipeline itself; never captured into `static/media` |
| `out/` | Recorded MP4s waiting for the YouTube upload (not in git) |
| `.auth/` | Cached sign-ins, one per role and Hub (not in git) |

The site checks are in `../scripts/`: `npm run check:links` and `npm run coverage` (below).

## Prerequisites

- Node ≥ 20 and `npm install` (Playwright 1.63.0 is a devDependency; the docs build does not
  use it). Playwright uses Chromium build 1243: if `~/.cache/ms-playwright/chromium-1243` is
  missing, run `npx playwright install chromium`.
- ffmpeg with libwebp and libx264 (`ffmpeg -encoders | grep -E 'libwebp|libx264'`), ffprobe and
  `zip`.
- A GPU for the WebGL viewers. The capture runs Chromium in its new headless mode (the full
  browser, with the GPU through ANGLE) and stops when WebGL renders in software
  (`--allow-software-gl` to capture anyway). `--headed` shows the window; without a display,
  run it under `xvfb-run -a`.
- Accounts and URLs, from the environment or from `credentials.env` of the local Registry
  (`$DDB_DOCS_HOME/credentials.env`, default `/mnt/data/docs-capture`; a variable that is set wins):

| Variable | Use |
|----------|-----|
| `DDB_DOCS_BASE_URL` | Hub of the `base: hub` shots and of `reset-demo` (default `https://hub.dronedb.app`; `--base` wins) |
| `DDB_DOCS_LOCAL_URL` | Hub of the `base: local` shots (default `http://localhost:$DDB_DOCS_PORT`, port 5180) |
| `DDB_DOCS_USER`, `DDB_DOCS_PASSWORD` | The demo account (`auth: demo`) |
| `DDB_DOCS_ADMIN_USER`, `DDB_DOCS_ADMIN_PASSWORD` | The administrator (`auth: admin`, account metadata in `reset-demo`) |
| `DDB_DOCS_INPUTS` | Root of the local input files (`setFiles`, `file:` in `demo-inputs.yaml`; default `/mnt/data/datasets`) |
| `DDB_DOCS_SOURCE_URL` | Hub that `reset-demo` downloads the `from:` files from (default: the Hub it resets) |
| `DDB_HUB_SRC` | Hub source for `npm run coverage` (default `/mnt/data/repos/Registry/Registry.Web/ClientApp`) |

Never commit credentials, input files or recorded MP4s.

## Capture from the local Registry (now)

```bash
media-capture/local/start.sh start            # Registry 3.0 + MailHog on localhost:5180 / 5181
media-capture/local/mirror-datasets.sh        # the showcase datasets, same org/dataset slugs
npm run reset-demo                            # the demo organization acme-surveys
npm run media -- --only viewing/              # capture a section, then update media.json
```

With `credentials.env` present, `DDB_DOCS_BASE_URL` is the local Registry, so every shot comes
from it.

## Capture from production (after it runs Registry 3.0)

The same shots, another base URL and the production demo account:

```bash
export DDB_DOCS_BASE_URL=https://hub.dronedb.app DDB_DOCS_USER=… DDB_DOCS_PASSWORD=…
npm run reset-demo
npm run media                                 # base: local shots still use the local Registry
```

Photogrammetry shots use processing quota: capture them only when they change
(`--only processing/photogrammetry`).

## Commands

| Command | |
|---------|--|
| `npm run media -- [options]` | Capture, then regenerate `src/data/media.json` |
| `npm run media:capture -- --list` | List the shots: captured, missing, blocked, made by hand |
| `npm run media:capture -- --dry-run --only files/` | Check the shots and print the URLs and outputs, without a browser |
| `npm run media:capture -- --only <prefix>` | Capture the ids that start with the prefix (repeatable) |
| `npm run media:capture -- --base <url>` | Another Hub for the `base: hub` shots |
| `npm run media:index` | Regenerate `src/data/media.json`; `-- --check` fails when it is out of date |
| `npm run reset-demo -- --dry-run` | Resolve every demo input and print the plan |
| `npm run reset-demo -- --only site-a` | Reset only these datasets |
| `npm run check:links` | Check the Hub links of the pages on hub.dronedb.app (`-- --offline`: syntax only; `-- --base <url>`: another Hub) |
| `npm run coverage` | Report the Hub features that no page names (`-- --list`: the ids; `-- --report-only`: exit 0) |

`node media-capture/capture.mjs --help` (and the other scripts) print all the options.

What a capture does for each shot: it opens the page (signed in as the role of `auth`, cached in
`.auth/`; the page clock of a page that is not a viewer starts 90 minutes after the last `reset-demo`
of that Hub, so relative times do not change between runs), waits for the viewer's loaded state or the shot's selector, an idle network (the
server-sent events stream of a dataset page does not count), no spinner, the fonts and `extraMs`;
it fails on a 5xx answer of the Hub or an error message on the page. Then it runs the actions,
draws the highlight, waits until two frames in a row are the same and writes the image. A failed
attempt is tried again twice, then the shot fails loudly and its previous image stays. The splat
viewer is set to the High quality preset unless the shot sets the quality itself.

Clips are recorded at 1920×1200 (device pixel ratio 1) with a cursor dot and a ripple on each
click; the recording is cut from the moment the page is ready to `maxSeconds`, encoded to
`out/<id>.mp4`, and a screenshot of its final frame becomes the poster `static/media/<id>.webp`.

## Add a shot

1. Add an entry to `shots/<section>.yaml` (format in `shots/README.md`). Use `aria-label`
   selectors first, then `title`, then visible text.
2. Shots that change data use `auth: demo` and the organization `acme-surveys`; add what they need
   to `demo-inputs.yaml` (and say so in the header comment of the shot file).
3. `npm run media:capture -- --dry-run --only <id>`, then `npm run media -- --only <id>`, and look
   at `static/media/<id>.webp`.
4. Use it in MDX: `<Screenshot id="<id>" />` or `<Clip id="<id>" />`. A clip needs the YouTube
   upload ([YOUTUBE.md](YOUTUBE.md)).
5. Commit the shot file, the image and `src/data/media.json` together.

## hub_feature ids (coverage report)

`npm run coverage` lists the Hub routes, the actions of the file context menu and the
Preferences tabs of a Hub checkout, and fails when no docs page names one in its `hub_feature`
front matter (a string or a list). Run it on the checkout of each Registry release tag.
`npm run coverage -- --list` prints every id it expects. The forms:

| Id | Source | Examples |
|----|--------|----------|
| `route:<RouteName>` | the `name` of a route in `webapp/js/router.js` (not NotFound, not LoginHome) | `route:SingleMap`, `route:CompareMap`, `route:Account` |
| `menu:<label-slug>` | a context-menu action in `webapp/js/libs/contextMenuItems.js`, and each row of `BUILD_DOWNLOADS` and `SPLAT_DOWNLOADS`: the label in lower case, every run of other characters than letters and digits replaced by one hyphen | `menu:open-map`, `menu:compare-to`, `menu:share-embed`, `menu:download-spz-for-other-tools` |
| `prefs:<tab>` | the `value` of a tab in `webapp/js/features/account/PreferencesDialog.vue` | `prefs:units`, `prefs:viewers`, `prefs:notifications` |

The submenus Tools and Experimental are not actions (their items are). Other values of
`hub_feature` (a viewer panel such as `stockpile`) are allowed and ignored; a `route:`, `menu:`
or `prefs:` id that the Hub does not have fails the report.

## Maintenance on each Registry release

The docs owner (HeDo) does these steps.

1. `npm run coverage` on the release tag of the Hub, and pages for what is new.
2. `npm run reset-demo && npm run media`.
3. Review the changed images (`git diff --stat static/media`, then look at each one) and commit them
   with `src/data/media.json`.
4. Upload the changed clips ([YOUTUBE.md](YOUTUBE.md)) and update their `youtubeId`.
