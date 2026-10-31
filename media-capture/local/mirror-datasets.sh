#!/usr/bin/env bash
# Copies the showcase datasets of hub.dronedb.app into the local Registry (start.sh), under the same
# organization and dataset slugs and with the same file paths, then adds the local-only files and
# waits until every build of those datasets has finished.
#
#   mirror-datasets.sh [--no-wait] [<org>/<dataset> ...]
#
# With dataset arguments only those are copied (from datasets.txt and local-only.txt).
# --no-wait   do not wait for the builds
#
# Safe to run again: a file whose hash in the local Registry equals the hash on hub.dronedb.app is
# skipped, so a second run only sends what is missing or changed.
#
# Production is only read, with anonymous GET/POST list requests and one download at a time (it
# allows one concurrent download per user). Before it downloads a file, the script looks for a local
# copy with the same size and SHA-256 under DDB_DOCS_LOCAL_SOURCES and uploads that copy instead.
# Downloaded files are deleted once the local Registry has them.
#
# Environment:
#   DDB_DOCS_HOME            working folder (default /mnt/data/docs-capture; credentials.env is read from it)
#   DDB_DOCS_PROD_URL        source Hub (default https://hub.dronedb.app)
#   DDB_DOCS_LOCAL_SOURCES   colon-separated folders searched for local copies (default /mnt/data/datasets)
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOME_DIR="${DDB_DOCS_HOME:-/mnt/data/docs-capture}"
CREDS="$HOME_DIR/credentials.env"
PROD="${DDB_DOCS_PROD_URL:-https://hub.dronedb.app}"
SOURCES="${DDB_DOCS_LOCAL_SOURCES:-/mnt/data/datasets}"
STATE="$HOME_DIR/mirror-state"
CACHE="$HOME_DIR/mirror-cache"
DATASETS_FILE="$HERE/datasets.txt"
LOCAL_ONLY_FILE="$HERE/local-only.txt"

log() { printf '%s %s\n' "$(date +%H:%M:%S)" "$*" >&2; }
die() { log "error: $*"; exit 1; }

[[ -s "$CREDS" ]] || die "$CREDS not found: run start.sh first"
# shellcheck disable=SC1090
set -a; source "$CREDS"; set +a
B="$DDB_DOCS_BASE_URL"
mkdir -p "$STATE" "$CACHE"

WAIT=1
ONLY=()
for arg in "$@"; do
    case "$arg" in
        --no-wait) WAIT=0 ;;
        -h|--help) sed -n '2,22p' "$0"; exit 0 ;;
        */*) ONLY+=("$arg") ;;
        *) die "unknown argument: $arg" ;;
    esac
done

selected() {
    [[ ${#ONLY[@]} -eq 0 ]] && return 0
    local d; for d in "${ONLY[@]}"; do [[ "$d" == "$1" ]] && return 0; done
    return 1
}

# ------------------------------------------------------------------ HTTP helpers

TOKEN="$(curl -fsS -X POST "$B/users/authenticate" --data-urlencode "username=$DDB_DOCS_ADMIN_USER" \
    --data-urlencode "password=$DDB_DOCS_ADMIN_PASSWORD" | jq -r .token)" || die "cannot log in to $B"

api() { curl -fsS -H "Authorization: Bearer $TOKEN" "$@"; }
api_code() { curl -sS -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$@"; }
prod() { curl -fsS --retry 3 --retry-delay 5 "$@"; }
urlenc() { jq -rn --arg v "$1" '$v|@uri'; }
trim() { local s="$1"; s="${s#"${s%%[![:space:]]*}"}"; printf '%s' "${s%"${s##*[![:space:]]}"}"; }

# All the entries of a dataset (recursive), as a JSON array
list_entries() { # BASE ORG DS [curl options]
    local base="$1" org="$2" ds="$3"; shift 3
    curl -fsS --retry 3 "$@" -X POST "$base/orgs/$org/ds/$ds/search" \
        --data-urlencode 'query=*' --data-urlencode 'recursive=true'
}

# ------------------------------------------------------------------ local copies

declare -A BY_SIZE=()
load_local_index() {
    local index="$STATE/local-index.tsv" dir size path
    : > "$index"
    IFS=: read -ra dirs <<< "$SOURCES"
    for dir in "${dirs[@]}"; do
        [[ -d "$dir" ]] && find "$dir" -type f -size +0 ! -name '*.pbf' -printf '%s\t%p\n' >> "$index"
    done
    while IFS=$'\t' read -r size path; do
        BY_SIZE[$size]+="$path"$'\n'
    done < "$index"
    log "Local copies: ${#BY_SIZE[@]} distinct sizes under $SOURCES"
}

sha256() { sha256sum "$1" | cut -d' ' -f1; }

# A local file with this size and SHA-256, or nothing
find_local_copy() { # SIZE HASH
    local candidates="${BY_SIZE[$1]:-}" path n=0
    [[ -n "$candidates" ]] || return 0
    while IFS= read -r path; do
        [[ -n "$path" ]] || continue
        n=$((n + 1)); [[ $n -gt 20 ]] && break
        if [[ "$(sha256 "$path")" == "$2" ]]; then printf '%s' "$path"; return 0; fi
    done <<< "$candidates"
}

# ------------------------------------------------------------------ local Registry objects

ensure_org() { # ORG
    local org="$1" info
    [[ "$(api_code "$B/orgs/$org")" == 200 ]] && return 0
    if info="$(prod "$PROD/orgs/$org" 2>/dev/null)"; then :; else info='{}'; fi
    api -o /dev/null -X POST "$B/orgs" --data-urlencode "slug=$org" \
        --data-urlencode "name=$(jq -r --arg o "$org" '.name // $o' <<< "$info")" \
        --data-urlencode "description=$(jq -r '.description // ""' <<< "$info")" \
        --data-urlencode "isPublic=$(jq -r '.isPublic // true' <<< "$info")"
    log "Created organization $org"
}

ensure_dataset() { # ORG DS NAME
    local org="$1" ds="$2" name="$3"
    [[ "$(api_code "$B/orgs/$org/ds/$ds")" == 200 ]] && return 0
    api -o /dev/null -X POST "$B/orgs/$org/ds" --data-urlencode "slug=$ds" \
        --data-urlencode "name=$name" --data-urlencode visibility=2
    log "Created dataset $org/$ds"
}

set_meta() { # ORG DS KEY JSON
    api -o /dev/null -X POST "$B/orgs/$1/ds/$2/meta/set" --data-urlencode "key=$3" --data-urlencode "data=$4"
}

declare -A LOCAL_HASH=()
load_local_hashes() { # ORG DS
    local path hash
    LOCAL_HASH=()
    while IFS=$'\t' read -r path hash; do
        LOCAL_HASH[$path]="$hash"
    done < <(list_entries "$B" "$1" "$2" -H "Authorization: Bearer $TOKEN" \
        | jq -r '.[] | select(.type != 1) | [.path, .hash] | @tsv')
}

upload() { # ORG DS PATH SOURCE
    local src="${4//\\/\\\\}"; src="${src//\"/\\\"}"
    local name; name="$(basename "$3")"; name="${name//\\/\\\\}"; name="${name//\"/\\\"}"
    api -o /dev/null --retry 2 -X POST "$B/orgs/$1/ds/$2/obj" \
        --form-string "path=$3" -F "file=@\"$src\";filename=\"$name\""
}

# ------------------------------------------------------------------ mirror

MIRRORED=()

mirror_dataset() { # ORG DS [GLOB ...]
    local org="$1" ds="$2"; shift 2
    local globs=("$@") info list path hash size src g ok skipped=0 sent=0 local_copies=0 downloads=0

    log "== $org/$ds"
    info="$(prod "$PROD/orgs/$org/ds/$ds")" || die "$org/$ds not found on $PROD"
    list="$STATE/$org-$ds.prod.json"
    list_entries "$PROD" "$org" "$ds" > "$list"

    ensure_org "$org"
    ensure_dataset "$org" "$ds" "$(jq -r --arg d "$ds" '.[0].properties.meta.name.data // $d' <<< "$info")"
    # name, tagline, visibility, license...: every dataset-level meta key of production
    while IFS=$'\t' read -r key value; do
        set_meta "$org" "$ds" "$key" "$value"
    done < <(jq -r '.[0].properties.meta // {} | to_entries[] | [.key, (.value.data | tojson)] | @tsv' <<< "$info")

    load_local_hashes "$org" "$ds"

    while IFS=$'\t' read -r path hash size; do
        if [[ ${#globs[@]} -gt 0 ]]; then
            ok=0; for g in "${globs[@]}"; do
                # shellcheck disable=SC2053
                [[ "$path" == $g ]] && { ok=1; break; }
            done
            [[ $ok == 1 ]] || continue
        fi
        if [[ "${LOCAL_HASH[$path]:-}" == "$hash" ]]; then skipped=$((skipped + 1)); continue; fi

        src="$(find_local_copy "$size" "$hash")"
        if [[ -n "$src" ]]; then
            local_copies=$((local_copies + 1))
        else
            src="$CACHE/$org/$ds/$path"
            if [[ ! -f "$src" || "$(sha256 "$src")" != "$hash" ]]; then
                mkdir -p "$(dirname "$src")"
                log "   download $path ($((size / 1024)) KB)"
                prod -o "$src.part" "$PROD/orgs/$org/ds/$ds/download?path=$(urlenc "$path")"
                [[ "$(sha256 "$src.part")" == "$hash" ]] || die "$org/$ds/$path: the download does not match its hash"
                mv "$src.part" "$src"
            fi
            downloads=$((downloads + 1))
        fi

        upload "$org" "$ds" "$path" "$src" || die "$org/$ds/$path: upload failed"
        sent=$((sent + 1))
        [[ "$src" == "$CACHE/"* ]] && rm -f "$src"
    done < <(jq -r '[.[] | select(.type != 1)] | sort_by(.size) | .[] | [.path, .hash, (.size | tostring)] | @tsv' "$list")

    # Folders without files (a folder with files is created by its first upload)
    if [[ ${#globs[@]} -eq 0 ]]; then
        local folders; folders="$(list_entries "$B" "$org" "$ds" -H "Authorization: Bearer $TOKEN" | jq -r '.[] | select(.type == 1) | .path')"
        while IFS= read -r path; do
            grep -qxF -- "$path" <<< "$folders" && continue
            api -o /dev/null -X POST "$B/orgs/$org/ds/$ds/obj" --form-string "path=$path"
            log "   folder $path"
        done < <(jq -r '.[] | select(.type == 1) | .path' "$list")
    fi

    log "   $sent sent ($local_copies from local copies, $downloads downloaded), $skipped already there"
    MIRRORED+=("$org/$ds")
}

add_local_only() { # ORG DS PATH SOURCE NAME
    local org="$1" ds="$2" path="$3" src="$4" name="$5" dir
    if [[ "$src" != /* ]]; then
        IFS=: read -ra dirs <<< "$SOURCES"
        for dir in "${dirs[@]}"; do [[ -f "$dir/$src" ]] && { src="$dir/$src"; break; }; done
    fi
    [[ -f "$src" ]] || { log "   missing local-only source $src: skipped"; return 0; }
    ensure_org "$org"
    ensure_dataset "$org" "$ds" "${name:-$ds}"
    load_local_hashes "$org" "$ds"
    if [[ "${LOCAL_HASH[$path]:-}" == "$(sha256 "$src")" ]]; then return 0; fi
    upload "$org" "$ds" "$path" "$src" || die "$org/$ds/$path: upload failed"
    log "   local-only $org/$ds/$path"
}

# ------------------------------------------------------------------ builds

wait_for_builds() {
    local d org ds entries summary active total
    log "Waiting for the builds of ${#MIRRORED[@]} datasets"
    while :; do
        total=0
        for d in "${MIRRORED[@]}"; do
            org="${d%%/*}"; ds="${d#*/}"
            entries="$(list_entries "$B" "$org" "$ds" -H "Authorization: Bearer $TOKEN")"
            summary="$(jq -r '[.[] | .buildStatus // empty] | group_by(.) | map("\(.[0])=\(length)") | join(" ")' <<< "$entries")"
            active="$(jq '[.[] | select(.buildStatus == "queued" or .buildStatus == "building")] | length' <<< "$entries")"
            total=$((total + active))
            if [[ -n "$summary" ]]; then log "   $d: $summary"; fi
        done
        [[ $total -eq 0 ]] && break
        sleep 30
    done
    log "No build queued or running"
}

report() {
    local d org ds
    printf '\n%-24s %8s %8s  %s\n' dataset entries files 'builds not ready'
    for d in "${MIRRORED[@]}"; do
        org="${d%%/*}"; ds="${d#*/}"
        list_entries "$B" "$org" "$ds" -H "Authorization: Bearer $TOKEN" | jq -r --arg d "$d" '
            [length, ([.[] | select(.type != 1)] | length),
             ([.[] | select(.buildStatus) | "\(.path): \(.buildStatus)"] | join(", "))]
            | "\($d)\t\(.[0])\t\(.[1])\t\(.[2])"' \
            | awk -F'\t' '{ printf "%-24s %8s %8s  %s\n", $1, $2, $3, ($4 == "" ? "-" : $4) }'
    done
}

# ------------------------------------------------------------------ main

load_local_index

# read without -r: a backslash keeps a space inside a glob (Willa\ Global\ Poland.ply)
# shellcheck disable=SC2162
while read -a fields; do
    spec="${fields[0]:-}"
    [[ -z "$spec" || "$spec" == \#* ]] && continue
    selected "$spec" || continue
    mirror_dataset "${spec%%/*}" "${spec#*/}" "${fields[@]:1}"
done < "$DATASETS_FILE"

log "== local-only files"
while IFS='|' read -r spec path src name; do
    spec="$(trim "$spec")"
    [[ -z "$spec" || "$spec" == \#* ]] && continue
    selected "$spec" || continue
    add_local_only "${spec%%/*}" "${spec#*/}" "$(trim "$path")" "$(trim "$src")" "$(trim "$name")"
    [[ " ${MIRRORED[*]} " == *" $spec "* ]] || MIRRORED+=("$spec")
done < "$LOCAL_ONLY_FILE"

find "$CACHE" -mindepth 1 -type d -empty -delete 2>/dev/null || true

[[ $WAIT == 1 ]] && wait_for_builds
report
