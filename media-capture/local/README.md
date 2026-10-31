# Local Registry for the documentation screenshots

A local Registry with its Hub, built from a pinned Registry commit (and, if needed, another Hub commit), that holds copies of the public
showcase datasets of hub.dronedb.app. The copies use the **same organization and dataset slugs and
the same file paths** as production, so a capture URL such as

```
/r/odm/brighton-beach/view/b2RtX29ydGhvcGhvdG8vb2RtX29ydGhvcGhvdG8udGlm/map
```

is the same on both. The capture pipeline switches between them by changing only the base URL.

Why local: production runs an older Registry than the one the documentation describes. The new
features (bm3d model viewer, splat measurements, User preferences, compare view, stockpile
materials, and so on) can be captured only from a Registry built from the new sources.

## What runs

| Service | URL | Container |
|---|---|---|
| Registry + Hub | <http://localhost:5180> | `ddb-docs-registry` |
| MailHog web UI (catches the e-mails Registry sends) | <http://localhost:5181> | `ddb-docs-mailhog` |
| NodeODX 2.4.0 (processing node of the photogrammetry task) | not published; Registry reaches it on the Docker network | `ddb-docs-nodeodx` |

The published ports listen on 127.0.0.1 only. Registry uses SQLite and stores everything under
`$DDB_DOCS_HOME/registry-data` (default `/mnt/data/docs-capture/registry-data`). The image installs
the libddb build that the Registry commit pins, with its helper programs (bm3d, gdal-util,
metadata-util, build-lod, Obj2Tiles, untwine, dwg2dxf).

Settings that differ from a default install (all set in `start.sh`; a change applies after
`./start.sh restart`):

| Setting | Local value | Why |
|---|---|---|
| `UpdateCheckCron` | `disabled` | a capture instance must not report to dronedb.app |
| `Smtp` | MailHog, port 1025, no TLS | build notification and other e-mails are captured from the MailHog UI |
| `BuildNotifications:DigestMinutes` | `1` (default 5) | the notification e-mail arrives 1 minute after the build |
| `EnableOrganizationMemberManagement` | `true` (production: false) | organization member screens |
| `EnableStorageLimiter` | `true` | storage quota of the demo user (same as production) |
| `--reset-hub` (command line) | on | the Hub is installed from the image on every start (see [Run it](#run-it)) |
| `ProcessingPlatform:NodeOdx` | one node, `local`, "Local NodeODX" | Run Photogrammetry |

## Accounts

`start.sh` writes `$DDB_DOCS_HOME/credentials.env` (mode 600) on its first run, with generated
passwords. It is never in this repository.

| Variable | Meaning |
|---|---|
| `DDB_DOCS_BASE_URL` | `http://localhost:5180` |
| `DDB_DOCS_ADMIN_USER`, `DDB_DOCS_ADMIN_PASSWORD` | instance administrator (`admin`) |
| `DDB_DOCS_USER`, `DDB_DOCS_PASSWORD` | demo user `docsdemo` (not an administrator); `npm run reset-demo` creates its private organization `acme-surveys` and sets its storage quota (`account.meta` in [`../demo-inputs.yaml`](../demo-inputs.yaml), the only place that sets them) |
| `DDB_DOCS_MEMBER_USER`, `DDB_DOCS_MEMBER_PASSWORD` | second user `docsmember`, member of nothing: add it to `acme-surveys` in the member screens |

Registry accepts user names made of `a-z` and `0-9` only, so the demo user is `docsdemo`, not
`docs-demo`. `start.sh` adds a missing variable to an existing `credentials.env` and creates a
missing account; it does not change an existing password.

## Run it

```bash
cd media-capture/local
./start.sh build            # once, or another Registry commit: ./start.sh build <ref>
                            # or another Hub commit too: ./start.sh build <ref> <hub-ref>
./start.sh start            # starts Registry and MailHog, creates the users
./mirror-datasets.sh        # copies the datasets, then waits for every build
npm run reset-demo          # the demo organization acme-surveys and the account settings
./start.sh status | stop | restart | logs
```

`build` adds a detached `git worktree` of the local Registry clone (`REGISTRY_REPO`, default
`/mnt/data/repos/Registry`) at `$DDB_DOCS_HOME/registry-src`, checks out its Hub submodule at the
pinned commit and runs the repository Dockerfile. It never changes the clone's own working tree.
With a Hub ref (second argument, or `HUB_REF`), it fetches that commit from `HUB_REPO` (default: the
Hub submodule of `REGISTRY_REPO`, so a Hub commit that is not pushed yet works) and checks it out in
the worktree before the build. The image tag names both commits, e.g.
`ddb-docs-registry:66ab9889-hub-0362914`, and the build prints the full hashes.

The Dockerfile downloads the pinned DroneDB CI build, which needs a token with Actions read access
to DroneDB/DroneDB: `DRONEDB_ARTIFACT_TOKEN`, or `gh auth token` when it is not set. After a build,
`docker builder prune -f` frees the build cache (of every build on the machine, not only this one).

A new image is used after `./start.sh restart`: `start` alone keeps a running container on its
image. Registry installs its Hub into `registry-data/ClientApp` and, by default, installs it again
only when the Hub version number grows, so an image with another Hub commit of the same version
would serve the old files; the container runs with `--reset-hub`, which installs the Hub from the
image on every start. The datasets, accounts and settings in `registry-data` stay.

The containers restart with Docker (`--restart unless-stopped`). `stop` removes them and keeps the
data; the next `start` uses the same data and accounts.

## The dataset copy

`datasets.txt` lists the datasets. `mirror-datasets.sh`:

- creates the organizations `odm` and `odx` (name and description from production, public) and each
  dataset, with the dataset meta of production (name, tagline, visibility, licence);
- lists every file on production (`POST /orgs/{org}/ds/{ds}/search`, recursive) and skips each file
  whose hash in the local Registry is already the same;
- for each other file, looks for a local copy with the same size and SHA-256 under
  `DDB_DOCS_LOCAL_SOURCES` (default `/mnt/data/datasets`) and uploads it; only when there is none, it
  downloads the file from production (one at a time: production allows one concurrent download per
  user), checks its hash, uploads it and deletes the download;
- adds the files of `local-only.txt`;
- waits until no build of these datasets is queued or running, then prints entries, files and the
  builds that are not ready.

It only reads production. Run it again at any time: it sends only what is missing or changed. Give
dataset names to copy only those, e.g. `./mirror-datasets.sh odx/splats`.

odx/splats is copied in part: `Willa Global Poland.ply` (3.4 GB, 14.5 million splats; the scene of
the splat pages) and `train.ply` (the small splat of the pipeline test), each with its
`_cameras.json`, `LICENSE.md` and the dataset thumbnail. The other scenes are large and the
documentation does not use them. In `datasets.txt` a space in a path is written `\ `. The
level-of-detail build of `Willa Global Poland.ply` takes about 6 minutes; `npm run reset-demo`
copies it, with its build, into the demo organization on the server.

## Local-only data

`local-only.txt` adds files that are **not on production**. Use them for local capture only. Before
any of them goes to production, confirm its licence and add the licence to the dataset README.

| Dataset | File | Source | Licence |
|---|---|---|---|
| `odx/3d-tiles` (new) | `sample_geo.3tz` | `/mnt/data/datasets/3dtiles/sample_geo.3tz` | **not confirmed** |
| `odm/vector` | `gpx/OldOrchard_2017-07-22.gpx` | sUAS Photogrammetry Suite Test Data (GPS log of the Old Orchard flight, 2017-07-22) | The Unlicense |
| `odx/video` (new) | `DJI_20250214223919_0002_T.MP4` + `.SRT` | DJI Mavic 3T thermal clip, zenodo.org/records/17311189 | CC-BY-4.0 (attribution needed) |
| `odm/caliterra` | `odm_dem/dsm.tif`, `odm_dem/dtm.tif`, `odm_dem/README.md` | `generate-data.sh caliterra-dem` | CC0 1.0, as odm/caliterra |
| `odx/splats-geo` (new) | `brighton-beach.ply`, `georef.json`, `README.md`, `LICENSE` | `generate-data.sh splats-geo` | BSD 2-Clause, as odm/brighton-beach |

The demo organization also uses generated data: the Mask borders dataset of
[`../demo-inputs.yaml`](../demo-inputs.yaml) reads `ortho-black-border.tif` and its masked copy
from `generate-data.sh mask-borders` (BSD 2-Clause, as odm/brighton-beach).

A screenshot of one of these shows data that production does not have: re-capturing it from
production gives a different picture or fails until the data is published there.

### Generated data

`generate-data.sh` makes the data that no showcase dataset has, from the open ODM datasets of the
local Registry, into `/mnt/data/datasets/docs-generated/<name>/` (`DDB_DOCS_GENERATED`). Each folder
has a `README.md` with the source, the steps and the licence (the licence of the ODM dataset it comes
from); the README goes into the dataset with the data. Run it after the first `mirror-datasets.sh`
and before the next one, which uploads the results.

```bash
./generate-data.sh                  # all three, or name some:
./generate-data.sh caliterra-dem    # ODX run of the 78 Caliterra images on the local NodeODX (DSM + DTM,
                                    # 5 cm), moved and scaled onto the published outputs by
                                    # `ddb align -m similarity`; about 10 minutes
./generate-data.sh mask-borders     # the Brighton Beach orthophoto without its alpha band, and `ddb mask`
./generate-data.sh splats-geo       # `ddb gsplat --training-data` of Brighton Beach, trained with Brush
                                    # v0.3.0 (Vulkan, 20 000 steps, 1 000 000 splats); about 5 minutes
```

`splats-geo` downloads the Brush release from GitHub (checked with its SHA-256) into
`$DDB_DOCS_HOME/brush-v0.3.0`. It needs a GPU with Vulkan; it uses about 1.5 GB of GPU memory.

## Known gaps

- No 360° panorama with GPS EXIF (georeferenced panorama) is available locally.
- The two Hat Creek mosaics of odx/hat-creek are not detected as thermal (`raster-value-info` says
  `isThermal: false`, as production 2.7.1 does): libddb reads a raster as thermal only when it has
  one band and its metadata names a temperature, and these have a grey band, an alpha band and no
  such metadata. The Thermal panel shows the Raster Analysis panel for them.
- odm/caliterra lies on a hillside. A click of Stockpile Volume on the sand pile next to the culverts
  (30.170892, -98.090734) detects it against the ground around it: about 15 m², and 6.8 m³ on the
  Best-fit plane the Hub opens a clicked pile with (the detector itself reports 8.2 m³ above the
  plane it fits to the ground around the outline). A polygon of 3.5 m radius drawn around it gives
  9 to 10.5 m³ with the Best-fit plane base; the default Lowest perimeter base of a drawn polygon
  gives 80 to 180 m³, because the pile is on the slope. The debris pile near the excavator is in a
  part of the DSM that ODX filled by interpolation and is not detected.
- WMS of odx/micasense: GetCapabilities answers OGC XML, but GetMap of the six-band Float32
  orthophoto gives a transparent image (`Cannot encode the render of …/cog.tif` in the log); its DSM
  and DTM render.
- The textured models of odx/micasense and odx/sequoia (5 + 6 OBJ files with 16-bit multispectral
  TIFF textures) fail to build: bm3d cannot read those textures. The 3D model view of these two
  datasets shows a failed build.
- `/version` and the admin pages show the version numbers of the pinned commit, which can be lower
  than the version of the release that ships these features.

## Clean up

```bash
./start.sh stop
docker rmi "$(cat /mnt/data/docs-capture/registry-image)"
git -C /mnt/data/repos/Registry worktree remove /mnt/data/docs-capture/registry-src
rm -rf /mnt/data/docs-capture    # data, credentials and state
```
