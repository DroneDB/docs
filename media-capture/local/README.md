# Local Registry for the documentation screenshots

A local Registry with its Hub, built from a pinned Registry commit, that holds copies of the public
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
| `ProcessingPlatform:NodeOdx` | one node, `local`, "Local NodeODX" | Run Photogrammetry |

## Accounts

`start.sh` writes `$DDB_DOCS_HOME/credentials.env` (mode 600) on its first run, with generated
passwords. It is never in this repository.

| Variable | Meaning |
|---|---|
| `DDB_DOCS_BASE_URL` | `http://localhost:5180` |
| `DDB_DOCS_ADMIN_USER`, `DDB_DOCS_ADMIN_PASSWORD` | instance administrator (`admin`) |
| `DDB_DOCS_USER`, `DDB_DOCS_PASSWORD` | demo user `docsdemo` (not an administrator), owner of the private organization `acme-surveys`, storage quota 20 GB (`DDB_DOCS_QUOTA_MB`) |
| `DDB_DOCS_MEMBER_USER`, `DDB_DOCS_MEMBER_PASSWORD` | second user `docsmember`, member of nothing: add it to `acme-surveys` in the member screens |

Registry accepts user names made of `a-z` and `0-9` only, so the demo user is `docsdemo`, not
`docs-demo`. `start.sh` adds a missing variable to an existing `credentials.env` and creates a
missing account; it does not change an existing password.

## Run it

```bash
cd media-capture/local
./start.sh build            # once, or to move to another Registry commit: ./start.sh build <ref>
./start.sh start            # starts Registry and MailHog, creates the accounts
./mirror-datasets.sh        # copies the datasets, then waits for every build
./start.sh status | stop | restart | logs
```

`build` adds a detached `git worktree` of the local Registry clone (`REGISTRY_REPO`, default
`/mnt/data/repos/Registry`) at `$DDB_DOCS_HOME/registry-src`, checks out its Hub submodule at the
pinned commit and runs the repository Dockerfile. It never changes the clone's own working tree.
The Dockerfile downloads the pinned DroneDB CI build, which needs a token with Actions read access
to DroneDB/DroneDB: `DRONEDB_ARTIFACT_TOKEN`, or `gh auth token` when it is not set. After a build,
`docker builder prune -f` frees the build cache.

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

odx/splats is copied in part: `train.ply`, its `train_cameras.json`, `LICENSE.md` and the dataset
thumbnail. The other scenes are several GB each and the documentation does not use them.

## Local-only data

`local-only.txt` adds files that are **not on production**. Use them for local capture only. Before
any of them goes to production, confirm its licence and add the licence to the dataset README.

| Dataset | File | Source | Licence |
|---|---|---|---|
| `odx/3d-tiles` (new) | `sample_geo.3tz` | `/mnt/data/datasets/3dtiles/sample_geo.3tz` | **not confirmed** |
| `odm/vector` | `gpx/OldOrchard_2017-07-22.gpx` | sUAS Photogrammetry Suite Test Data (GPS log of the Old Orchard flight, 2017-07-22) | The Unlicense |
| `odx/video` (new) | `DJI_20250214223919_0002_T.MP4` + `.SRT` | DJI Mavic 3T thermal clip, zenodo.org/records/17311189 | CC-BY-4.0 (attribution needed) |

A screenshot of one of these shows data that production does not have: re-capturing it from
production gives a different picture or fails until the data is published there.

## Known gaps

- No 360° panorama with GPS EXIF (georeferenced panorama) is available locally.
- No DSM for odm/caliterra: its local ODM output has an empty `odm_dem/`. The stockpile pages need
  one (an ODM run with `--dsm`).
- No georeferenced splat (a splat with its georef sidecar).
- No orthophoto with borders for the Mask borders page.
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
