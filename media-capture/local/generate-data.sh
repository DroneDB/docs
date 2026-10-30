#!/usr/bin/env bash
# Makes the showcase data that hub.dronedb.app does not have, from open ODM sample datasets, for the
# local capture Registry (start.sh). mirror-datasets.sh then uploads the results with the other
# local-only files (local-only.txt), and reset-demo.mjs reads the Mask borders files
# (demo-inputs.yaml).
#
#   generate-data.sh [caliterra-dem] [mask-borders] [splats-geo]      (default: all three)
#
#   caliterra-dem  dsm.tif + dtm.tif of odm/caliterra, from a new ODX run of its 78 images on the
#                  local NodeODX (about 8 minutes on 16 cores), moved onto the published
#                  outputs (see measure_shift). Stockpile Volume pages.
#   mask-borders   the Brighton Beach orthophoto with its alpha band removed (a real black border)
#                  and its `ddb mask` copy. Mask Borders page.
#   splats-geo     a Gaussian splat trained with Brush from the splat training data of
#                  odm/brighton-beach (`ddb gsplat --training-data`), with its georef.json.
#                  Georeferenced splats page. Needs a GPU with Vulkan; about 1-2 GB of GPU memory.
#
# Each output folder has a README.md with the source and the licence of the data (the licence of the
# ODM dataset it is made from). The inputs are read from the local Registry, which must hold the
# mirrored odm/caliterra and odm/brighton-beach (mirror-datasets.sh). Nothing is sent anywhere else.
#
# Environment:
#   DDB_DOCS_HOME        working folder (default /mnt/data/docs-capture; credentials.env is read from it)
#   DDB_DOCS_GENERATED   output folder (default /mnt/data/datasets/docs-generated; local-only.txt and
#                        demo-inputs.yaml name its files relative to /mnt/data/datasets)
#   DDB                  the ddb command (default: /mnt/data/repos/DroneDB/build/ddbcmd, else ddb on PATH)
#   NODEODX_CONTAINER    the NodeODX container of start.sh (default ddb-docs-nodeodx)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="${DDB_DOCS_HOME:-/mnt/data/docs-capture}"
OUT="${DDB_DOCS_GENERATED:-/mnt/data/datasets/docs-generated}"
WORK="$HOME_DIR/generate-work"
NODEODX_CONTAINER="${NODEODX_CONTAINER:-ddb-docs-nodeodx}"
BRUSH_VERSION=v0.3.0
DDB="${DDB:-/mnt/data/repos/DroneDB/build/ddbcmd}"
[[ -x "$DDB" ]] || DDB="$(command -v ddb)" || { echo "ddb not found: set DDB" >&2; exit 1; }

log() { printf '%s %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
die() { log "error: $*"; exit 1; }

# shellcheck disable=SC1091
set -a; source "$HOME_DIR/credentials.env"; set +a
B="$DDB_DOCS_BASE_URL"
TOKEN="$(curl -fsS -X POST "$B/users/authenticate" --data-urlencode "username=$DDB_DOCS_ADMIN_USER" \
    --data-urlencode "password=$DDB_DOCS_ADMIN_PASSWORD" | jq -r .token)" || die "cannot log in to $B"
api() { curl -fsS -H "Authorization: Bearer $TOKEN" "$@"; }
urlenc() { jq -rn --arg v "$1" '$v|@uri'; }

# Downloads files of a dataset of the local Registry into a folder, under their dataset paths
fetch() { # ORG DS DEST REGEX
    local path
    api -X POST "$B/orgs/$1/ds/$2/search" --data-urlencode 'query=*' --data-urlencode 'recursive=true' \
        | jq -r --arg re "$4" '.[] | select(.type != 1 and (.path | test($re))) | .path' \
        | while IFS= read -r path; do
            mkdir -p "$3/$(dirname "$path")"
            api -o "$3/$path" "$B/orgs/$1/ds/$2/download?path=$(urlenc "$path")"
        done
}

licence_of_brighton() { api "$B/orgs/odm/ds/brighton-beach/download?path=LICENSE"; }

# ------------------------------------------------------------------ caliterra-dem

# Prints the shift "east north" (metres) that puts the DSM REF_GRID_SRC (resampled to the grid of
# REF) on REF: the best normalised cross-correlation of the two, each minus its 10 m local mean
# (so a pile counts, a slope or a constant height difference does not), over +-20 m
measure_shift() { # REF SRC_ON_REF_GRID
    python3 -I - "$1" "$2" <<'EOF'
import sys
import numpy as np
from osgeo import gdal
gdal.UseExceptions()

def load(path):
    dataset = gdal.Open(path)
    a = dataset.GetRasterBand(1).ReadAsArray().astype(np.float64)
    return a, np.isfinite(a) & (a > -1000)

def high_pass(a, m, k=20):
    def box(z):
        s = np.cumsum(np.cumsum(np.pad(z, ((k + 1, k), (k + 1, k))), 0), 1)
        return s[2*k+1:, 2*k+1:] - s[:-2*k-1, 2*k+1:] - s[2*k+1:, :-2*k-1] + s[:-2*k-1, :-2*k-1]
    x = np.where(m, a, 0.0)
    return np.where(m, x - box(x) / np.maximum(box(m * 1.0), 1), 0.0)

ref, mr = load(sys.argv[1]); src, ms = load(sys.argv[2])
gt = gdal.Open(sys.argv[1]).GetGeoTransform()
R, S = high_pass(ref, mr), high_pass(src, ms)
H, W = R.shape

def ncc(dy, dx):
    a = R[max(0, dy):H + min(0, dy), max(0, dx):W + min(0, dx)]
    b = S[max(0, -dy):H + min(0, -dy), max(0, -dx):W + min(0, -dx)]
    m = mr[max(0, dy):H + min(0, dy), max(0, dx):W + min(0, dx)] & ms[max(0, -dy):H + min(0, -dy), max(0, -dx):W + min(0, -dx)]
    if m.sum() < 1000: return -1
    a, b = a[m], b[m]
    return np.dot(a, b) / np.sqrt(np.dot(a, a) * np.dot(b, b))

reach = int(20 / gt[1])
best = max((ncc(dy, dx), dy, dx) for dy in range(-reach, reach + 1, 2) for dx in range(-reach, reach + 1, 2))
best = max((ncc(dy, dx), dy, dx) for dy in range(best[1] - 2, best[1] + 3) for dx in range(best[2] - 2, best[2] + 3))
print(f"{best[2] * gt[1]:.2f} {best[1] * gt[5]:.2f}")
print(f"correlation {best[0]:.2f}", file=sys.stderr)
EOF
}

caliterra_dem() {
    local dest="$OUT/caliterra-dem" src="$WORK/caliterra" ip uuid code args=() f east north ext
    log "== caliterra-dem"
    mkdir -p "$dest"
    rm -rf "$src"; fetch odm caliterra "$src" '^(images/|odm_georeferencing/odm_georeferenced_model\.laz$)'
    ip="$(docker inspect "$NODEODX_CONTAINER" --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')"
    for f in "$src"/images/*; do args+=(-F "images=@$f"); done
    uuid="$(curl -fsS -X POST "http://$ip:3000/task/new" -F name=caliterra-dem -F 'options=[
        {"name":"dsm","value":true},{"name":"dtm","value":true},{"name":"dem-resolution","value":5},
        {"name":"skip-orthophoto","value":true},{"name":"skip-3dmodel","value":true},
        {"name":"skip-report","value":true},{"name":"pc-quality","value":"medium"},
        {"name":"max-concurrency","value":16}]' "${args[@]}" | jq -r .uuid)"
    log "   NodeODX task $uuid"
    while code="$(curl -fsS "http://$ip:3000/task/$uuid/info" | jq -r .status.code)"; [[ $code == 10 || $code == 20 ]]; do
        sleep 30
    done
    [[ $code == 40 ]] || die "NodeODX task $uuid ended with status $code"
    for f in dsm dtm; do
        docker cp "$NODEODX_CONTAINER:/var/www/data/$uuid/odm_dem/$f.tif" "$src/$f.tif"
    done
    curl -fsS -X POST "http://$ip:3000/task/remove" -d "uuid=$uuid" > /dev/null

    # The new run is georeferenced from the GPS tags again, so it lands metres away from the
    # published outputs (10 m in October 2026). A DSM of the published point cloud (PDAL of the
    # NodeODX image, 25 cm) gives the shift; dsm.tif and dtm.tif move by it. (ddb align does not
    # measure it: it answers 0 or a shift of kilometres for this pair of DSMs.)
    docker cp "$src/odm_georeferencing/odm_georeferenced_model.laz" "$NODEODX_CONTAINER:/tmp/caliterra.laz"
    docker exec "$NODEODX_CONTAINER" pdal translate /tmp/caliterra.laz /tmp/caliterra_dsm.tif --writer gdal \
        --writers.gdal.resolution=0.25 --writers.gdal.output_type=max --writers.gdal.data_type=float32 \
        --writers.gdal.nodata=-9999
    docker cp "$NODEODX_CONTAINER:/tmp/caliterra_dsm.tif" "$src/published_dsm.tif"
    docker exec "$NODEODX_CONTAINER" rm -f /tmp/caliterra.laz /tmp/caliterra_dsm.tif
    ext="$(gdalinfo -json "$src/published_dsm.tif" | jq -r '.cornerCoordinates | "\(.upperLeft[0]) \(.lowerRight[1]) \(.lowerRight[0]) \(.upperLeft[1])"')"
    # shellcheck disable=SC2086
    gdalwarp -q -overwrite -te $ext -tr 0.25 0.25 -r average "$src/dsm.tif" "$src/new_dsm.tif"
    read -r east north < <(measure_shift "$src/published_dsm.tif" "$src/new_dsm.tif")
    log "   shift to the published outputs: east $east m, north $north m"
    for f in dsm dtm; do
        # shellcheck disable=SC2046
        gdal_translate -q -of COG -co COMPRESS=DEFLATE -co PREDICTOR=YES \
            -a_ullr $(gdalinfo -json "$src/$f.tif" | jq -r --argjson e "$east" --argjson n "$north" \
                '.cornerCoordinates | "\(.upperLeft[0] + $e) \(.upperLeft[1] + $n) \(.lowerRight[0] + $e) \(.lowerRight[1] + $n)"') \
            "$src/$f.tif" "$dest/$f.tif"
    done
    rm -rf "$src"
    cat > "$dest/README.md" <<EOF
# DSM and DTM of Caliterra

\`dsm.tif\` (Digital Surface Model) and \`dtm.tif\` (Digital Terrain Model) of the Caliterra construction
site, made for the Stockpile Volume pages of the DroneDB documentation. The ODM outputs published
in \`odm/caliterra\` have an orthophoto, a point cloud and textured models, but no elevation model.

They come from a new ODX run (NodeODX 2.4.0, ODX engine 3.8.4) on the 78 images of \`odm/caliterra\`
(\`images/\`), with:

    dsm: true, dtm: true, dem-resolution: 5 (cm/px), pc-quality: medium,
    skip-orthophoto: true, skip-3dmodel: true, skip-report: true

The run georeferences the images from their GPS tags, as the published run did, and its result lands
some metres away. Both models are moved by $east m east and $north m north, the shift that puts the
DSM on a DSM of the published point cloud, so they lie on the published orthophoto. Their heights are
not changed: they are about 8 m lower than the heights of the published point cloud.

## Source and licence

Aerial photos of Caliterra in Dripping Springs, TX, provided by Dennis Baldwin, licensed under the
Creative Commons CC0 1.0 Universal licence (\`license.html\` of \`odm/caliterra\`). The elevation models
derived from them are under the same licence: CC0 1.0 Universal.
EOF
    log "   $dest"
}

# ------------------------------------------------------------------ mask-borders

mask_borders() {
    local dest="$OUT/mask-borders" src="$WORK/brighton-ortho"
    log "== mask-borders"
    mkdir -p "$dest"
    rm -rf "$src"; fetch odm brighton-beach "$src" '^odm_orthophoto/odm_orthophoto\.tif$'
    # Pixels outside the alpha become 0 (valid pixels of value 0 become 1), then the alpha band and
    # the no-data value are dropped: the border is made of real black pixels
    gdalwarp -q -overwrite -srcalpha -dstnodata 0 -co COMPRESS=DEFLATE -co TILED=YES \
        "$src/odm_orthophoto/odm_orthophoto.tif" "$src/rgb.tif"
    gdal_translate -q -b 1 -b 2 -b 3 -a_nodata none -co COMPRESS=DEFLATE -co TILED=YES \
        -co PHOTOMETRIC=RGB "$src/rgb.tif" "$dest/ortho-black-border.tif"
    rm -f "$dest/ortho-black-border_masked.tif"
    (cd "$dest" && "$DDB" mask ortho-black-border.tif > /dev/null)
    rm -rf "$src"
    {
        cat <<'EOF'
# Orthophoto with a black border (Mask Borders demo)

`ortho-black-border.tif` is the orthophoto of the ODM sample dataset **Brighton Beach**
(`odm/brighton-beach/odm_orthophoto/odm_orthophoto.tif` on hub.dronedb.app) with its alpha band
removed: the pixels outside the reconstruction, transparent in the original, are real black pixels
(RGB 0, 0, 0, no no-data value, no mask). It is the input of the **Mask Borders** tool.

`ortho-black-border_masked.tif` is the output of `ddb mask ortho-black-border.tif` (DroneDB 2.0.0),
the same file that Hub's **Mask Borders** writes.

Made with GDAL:

    gdalwarp -srcalpha -dstnodata 0 odm_orthophoto.tif tmp.tif
    gdal_translate -b 1 -b 2 -b 3 -a_nodata none -co COMPRESS=DEFLATE -co TILED=YES tmp.tif ortho-black-border.tif

(`gdalwarp` turns valid pixels of value 0 into 1, so only the border is 0.)

## Source and licence

Derived from the Brighton Beach sample dataset (images by Piero Toffanin), as published in
`odm/brighton-beach` on hub.dronedb.app. Same licence as the source, the BSD 2-Clause License
(the LICENSE file of odm/brighton-beach):

EOF
        licence_of_brighton | sed 's/^/    /'
    } > "$dest/README.md"
    log "   $dest"
}

# ------------------------------------------------------------------ splats-geo

brush_bin() {
    local dir="$HOME_DIR/brush-$BRUSH_VERSION" asset=brush-app-x86_64-unknown-linux-gnu.tar.xz
    if [[ ! -x "$dir/brush-app-x86_64-unknown-linux-gnu/brush_app" ]]; then
        mkdir -p "$dir"
        gh release download "$BRUSH_VERSION" -R ArthurBrussee/brush -D "$dir" --clobber -p "$asset" -p "$asset.sha256"
        (cd "$dir" && sha256sum -c "$asset.sha256" >&2 && tar xf "$asset" && rm -f "$asset" "$asset.sha256")
    fi
    printf '%s' "$dir/brush-app-x86_64-unknown-linux-gnu/brush_app"
}

# Removes the splats that lie more than MARGIN metres outside the box of the points of the COLMAP
# model (points3D.bin): the floaters a trainer leaves far from the scene, which would make its
# footprint on the map hundreds of metres wide. The other splats are written unchanged, so the
# coordinates and the georeference stay as they are.
crop_splat() { # PLY POINTS3D_BIN MARGIN OUT
    python3 -I - "$@" <<'EOF'
import struct, sys
import numpy as np

ply, points_bin, margin, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
xyz = []
with open(points_bin, 'rb') as f:
    for _ in range(struct.unpack('<Q', f.read(8))[0]):
        _, x, y, z = struct.unpack('<Qddd', f.read(32))
        f.read(11)
        f.read(8 * struct.unpack('<Q', f.read(8))[0])
        xyz.append((x, y, z))
xyz = np.array(xyz)
lo, hi = xyz.min(0) - margin, xyz.max(0) + margin

types = {'float': '<f4', 'double': '<f8', 'uchar': 'u1', 'int': '<i4', 'uint': '<u4'}
with open(ply, 'rb') as f:
    header, props, count = [], [], 0
    while True:
        line = f.readline()
        header.append(line)
        words = line.decode().split()
        if words[:2] == ['element', 'vertex']: count = int(words[2])
        elif words and words[0] == 'property': props.append((words[2], types[words[1]]))
        elif words == ['end_header']: break
    v = np.frombuffer(f.read(), dtype=np.dtype(props), count=count)
keep = np.all([(v[c] >= lo[i]) & (v[c] <= hi[i]) for i, c in enumerate('xyz')], axis=0)
with open(out, 'wb') as f:
    for line in header:
        f.write(f'element vertex {int(keep.sum())}\n'.encode() if line.startswith(b'element vertex') else line)
    f.write(v[keep].tobytes())
print(f'{int((~keep).sum())} of {count} splats removed', file=sys.stderr)
EOF
}

splats_geo() {
    local dest="$OUT/splats-geo" src="$WORK/brighton-project" train="$WORK/brighton-training" brush
    log "== splats-geo"
    mkdir -p "$dest"
    brush="$(brush_bin)"
    rm -rf "$src" "$train"
    fetch odm brighton-beach "$src" '^(images/|cameras\.json$|odm_report/shots\.geojson$|odm_georeferencing/(coords\.txt|odm_georeferenced_model\.laz)$)'
    "$DDB" gsplat --training-data "$train" --max-image-size 1600 --max-points 200000 "$src"
    # Brush keeps the coordinates of the COLMAP model (East, North, Up in metres minus the offset of
    # georef.json): the splat stays georeferenced by that file
    # (in WORK: Brush writes its kernel autotune cache to target/ in the current folder)
    (cd "$WORK" && "$brush" "$train" --total-steps 20000 --max-splats 1000000 --sh-degree 2 \
        --max-resolution 1600 --seed 42 --export-every 20000 --export-path "$WORK/brush-out" \
        --export-name 'brighton-beach_{iter}.ply')
    crop_splat "$WORK/brush-out/brighton-beach_20000.ply" "$train/sparse/0/points3D.bin" 10 "$dest/brighton-beach.ply"
    cp "$train/georef.json" "$dest/georef.json"
    licence_of_brighton > "$dest/LICENSE"
    rm -rf "$src" "$train" "$WORK/brush-out" "$WORK/target"
    cat > "$dest/README.md" <<EOF
# Brighton Beach, georeferenced Gaussian splat

\`brighton-beach.ply\` is a 3D Gaussian splat of Brighton Beach (Lake Superior, Minnesota, US), and
\`georef.json\` is its georeference: the splat is in metres, X East, Y North, Z up, from the point
given by \`georef.json\` in $(jq -r .crs "$dest/georef.json").

How it was made:

1. \`ddb gsplat --training-data training --max-image-size 1600 --max-points 200000 <odm/brighton-beach>\`
   (DroneDB 2.0.0): a COLMAP model of the 18 images of the ODM project, the images at 1600 px and
   200 000 points of its point cloud, and \`georef.json\`. Hub does the same with
   **Tools › Export splat training data**.
2. Trained with [Brush](https://github.com/ArthurBrussee/brush) $BRUSH_VERSION (Apache-2.0):
   \`brush_app training --total-steps 20000 --max-splats 1000000 --sh-degree 2 --max-resolution 1600 --seed 42\`.
   Brush keeps the coordinates of the COLMAP model, so \`georef.json\` stays valid.
3. The splats more than 10 m outside the box of the 200 000 points (floaters, about 0.2 %) are removed;
   the others are unchanged.

The images are all nadir: the splat is sharp from above and poor from the side.

## Source and licence

Derived from the Brighton Beach sample dataset (images by Piero Toffanin), as published in
\`odm/brighton-beach\` on hub.dronedb.app. Same licence as the source: BSD 2-Clause License, see
\`LICENSE\`.
EOF
    log "   $dest"
}

# ------------------------------------------------------------------ main

mkdir -p "$WORK"
[[ $# -gt 0 ]] || set -- caliterra-dem mask-borders splats-geo
for what in "$@"; do
    case "$what" in
        caliterra-dem) caliterra_dem ;;
        mask-borders) mask_borders ;;
        splats-geo) splats_geo ;;
        -h|--help) sed -n '2,27p' "$0"; exit 0 ;;
        *) die "unknown data: $what" ;;
    esac
done
rmdir "$WORK" 2>/dev/null || true
log "Done: upload with ./mirror-datasets.sh (local-only.txt)"
