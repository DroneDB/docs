#!/usr/bin/env bash
# Local Registry 3.0 (with its Hub) for the documentation screenshots.
#
#   start.sh build [REF [HUB_REF]]
#                          build the image from a Registry worktree at REF (default: fixes-and-optimizations),
#                          with its Hub at HUB_REF (default: the Hub commit that REF pins)
#   start.sh start         start Registry, NodeODX and MailHog, wait until Registry answers, create the users
#   start.sh stop          stop and remove the containers (the data stays)
#   start.sh restart       stop + start
#   start.sh status        show the containers and the health of Registry
#   start.sh logs          follow the Registry log
#
# Everything lives under DDB_DOCS_HOME (default /mnt/data/docs-capture):
#   registry-src/      git worktree of the Registry repository (with its Hub submodule)
#   registry-image     the tag of the image that `build` made, read by `start`
#   registry-data/     the storage folder of Registry (/data in the container: settings, databases, datasets)
#   credentials.env    generated passwords (chmod 600, never in a repository)
#
# Environment:
#   DDB_DOCS_HOME        working folder (default /mnt/data/docs-capture)
#   DDB_DOCS_PORT        HTTP port of Registry on the host (default 5180)
#   DDB_DOCS_MAIL_PORT   web UI port of MailHog on the host (default 5181)
#   REGISTRY_REPO        local clone of DroneDB/Registry used by `build` (default /mnt/data/repos/Registry);
#                        `build` adds a detached worktree, it never touches the clone's working tree
#   HUB_REF              Hub commit, branch or tag for `build` when no HUB_REF argument is given
#   HUB_REPO             Hub repository that HUB_REF is read from (default: the Hub submodule of REGISTRY_REPO,
#                        so a local commit that is not pushed yet can be built)
#   DRONEDB_ARTIFACT_TOKEN  token that can read the Actions artifacts of DroneDB/DroneDB (the image installs
#                        the libddb build that Registry pins); defaults to `gh auth token`
set -euo pipefail

HOME_DIR="${DDB_DOCS_HOME:-/mnt/data/docs-capture}"
PORT="${DDB_DOCS_PORT:-5180}"
MAIL_PORT="${DDB_DOCS_MAIL_PORT:-5181}"
REGISTRY_REPO="${REGISTRY_REPO:-/mnt/data/repos/Registry}"
HUB_PATH=Registry.Web/ClientApp
HUB_REPO="${HUB_REPO:-$REGISTRY_REPO/$HUB_PATH}"
SRC="$HOME_DIR/registry-src"
DATA="$HOME_DIR/registry-data"
CREDS="$HOME_DIR/credentials.env"
IMAGE_FILE="$HOME_DIR/registry-image"
NET=ddb-docs
REGISTRY_CTR=ddb-docs-registry
MAIL_CTR=ddb-docs-mailhog
MAILHOG_IMAGE=mailhog/mailhog:v1.0.1
NODE_CTR=ddb-docs-nodeodx
NODEODX_IMAGE=webodm/nodeodx:2.4.0
BASE_URL="http://localhost:$PORT"

log() { printf '%s\n' "$*" >&2; }
die() { log "error: $*"; exit 1; }

gen_password() { printf 'Docs%s9' "$(openssl rand -hex 10)"; }

# Writes the variables that credentials.env does not have yet (a new one is added to an existing file)
ensure_credentials() {
    mkdir -p "$HOME_DIR"
    (umask 077; touch "$CREDS")
    chmod 600 "$CREDS"
    add_var DDB_DOCS_BASE_URL "$BASE_URL"
    add_var DDB_DOCS_ADMIN_USER admin
    add_var DDB_DOCS_ADMIN_PASSWORD "$(gen_password)"
    # Registry user names are [a-z0-9] only, so the demo user cannot be "docs-demo"
    add_var DDB_DOCS_USER docsdemo
    add_var DDB_DOCS_PASSWORD "$(gen_password)"
    # A second user, member of nothing, for the organization member screens
    add_var DDB_DOCS_MEMBER_USER docsmember
    add_var DDB_DOCS_MEMBER_PASSWORD "$(gen_password)"
}

add_var() { grep -q "^$1=" "$CREDS" || printf '%s=%s\n' "$1" "$2" >> "$CREDS"; }

load_credentials() {
    # shellcheck disable=SC1090
    set -a; source "$CREDS"; set +a
}

cmd_build() {
    local ref="${1:-fixes-and-optimizations}" hub_ref="${2:-${HUB_REF:-}}" commit hub_commit tag
    commit="$(git -C "$REGISTRY_REPO" rev-parse --verify "$ref^{commit}")"
    if [[ ! -e "$SRC/.git" ]]; then
        mkdir -p "$HOME_DIR"
        git -C "$REGISTRY_REPO" worktree add --detach "$SRC" "$commit"
    else
        git -C "$SRC" checkout --detach "$commit"
    fi
    git -C "$SRC" submodule update --init
    if [[ -n "$hub_ref" ]]; then
        # Another Hub than the pinned one: fetched from HUB_REPO, so it may be a local commit
        hub_commit="$(git -C "$HUB_REPO" rev-parse --verify "$hub_ref^{commit}")"
        git -C "$SRC/$HUB_PATH" fetch --quiet "$HUB_REPO" "$hub_commit"
        git -C "$SRC/$HUB_PATH" checkout --quiet --detach "$hub_commit"
    fi
    hub_commit="$(git -C "$SRC/$HUB_PATH" rev-parse HEAD)"
    tag="ddb-docs-registry:${commit:0:8}-hub-${hub_commit:0:7}"
    DRONEDB_ARTIFACT_TOKEN="${DRONEDB_ARTIFACT_TOKEN:-$(gh auth token)}" \
        DOCKER_BUILDKIT=1 docker build \
        --secret id=dronedb_artifact_token,env=DRONEDB_ARTIFACT_TOKEN \
        -t "$tag" "$SRC"
    printf '%s\n' "$tag" > "$IMAGE_FILE"
    log "Built $tag (Registry $commit, Hub $hub_commit)"
    log "Run '$0 restart' to use it (start alone keeps a running container on its image)."
    log "Clean up the build cache with: docker builder prune -f"
}

wait_healthy() {
    local i
    for i in $(seq 1 180); do
        if curl -fsS --max-time 5 -o /dev/null "$BASE_URL/health/live" 2>/dev/null; then return 0; fi
        sleep 2
    done
    die "Registry did not answer on $BASE_URL within 6 minutes (docker logs $REGISTRY_CTR)"
}

# token USER PASSWORD -> JWT on stdout. Retries for a minute: the first start answers the health
# probe before it has created the default admin.
token() {
    local i t
    for i in $(seq 1 30); do
        t="$(curl -fsS -X POST "$BASE_URL/users/authenticate" \
            --data-urlencode "username=$1" --data-urlencode "password=$2" 2>/dev/null | jq -r .token)" || t=
        if [[ -n "$t" && "$t" != null ]]; then printf '%s' "$t"; return 0; fi
        sleep 2
    done
    return 1
}

ensure_user() { # ADMIN_TOKEN USER PASSWORD
    if ! curl -fsS -H "Authorization: Bearer $1" "$BASE_URL/users" \
        | jq -e --arg u "$2" 'any(.[]; .userName == $u)' >/dev/null; then
        curl -fsS -o /dev/null -X POST "$BASE_URL/users" -H "Authorization: Bearer $1" \
            -H 'Content-Type: application/json' \
            -d "$(jq -n --arg u "$2" --arg p "$3" '{userName: $u, password: $p, email: ($u + "@example.com"), roles: []}')"
        log "Created user $2"
    fi
}

# The users only: the demo organization, its datasets and the account metadata (storage quota)
# are the demo inputs of reset-demo (media-capture/demo-inputs.yaml)
ensure_accounts() {
    local admin
    admin="$(token "$DDB_DOCS_ADMIN_USER" "$DDB_DOCS_ADMIN_PASSWORD")" || die "cannot log in as $DDB_DOCS_ADMIN_USER"
    ensure_user "$admin" "$DDB_DOCS_USER" "$DDB_DOCS_PASSWORD"
    ensure_user "$admin" "$DDB_DOCS_MEMBER_USER" "$DDB_DOCS_MEMBER_PASSWORD"
}

# Creates the container the first time, then starts it
run_once() { # NAME docker-run-arguments...
    local name="$1"; shift
    docker container inspect "$name" >/dev/null 2>&1 || docker run -d --name "$name" "$@" >/dev/null
    docker start "$name" >/dev/null
}

cmd_start() {
    [[ -s "$IMAGE_FILE" ]] || die "no image yet: run '$0 build' first"
    local image; image="$(cat "$IMAGE_FILE")"
    ensure_credentials
    load_credentials
    mkdir -p "$DATA/temp" "$DATA/home"

    docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET" >/dev/null

    run_once "$MAIL_CTR" --network "$NET" --restart unless-stopped -p "127.0.0.1:$MAIL_PORT:8025" "$MAILHOG_IMAGE"
    # Photogrammetry node, reachable by Registry only (no host port)
    run_once "$NODE_CTR" --network "$NET" --restart unless-stopped "$NODEODX_IMAGE"

    # Runs as the host user, so the files under registry-data stay readable and removable.
    # The settings come from the environment (AppSettings__...), on top of the appsettings.json that
    # the first start writes into registry-data. Differences from a default install:
    #  - the update check is off: a local capture instance must not report to dronedb.app;
    #  - e-mail goes to MailHog, and the build notification digest is sent after 1 minute, not 5;
    #  - organization member management and the storage limiter are on;
    #  - the NodeODX container is the processing node of the photogrammetry task;
    #  - --reset-hub: Registry installs its Hub into registry-data/ClientApp, and again only when the Hub
    #    version number grows, so an image built with another Hub commit of the same version would serve
    #    the old files; the Hub is installed from the image on every start instead.
    run_once "$REGISTRY_CTR" --network "$NET" --restart unless-stopped \
        --user "$(id -u):$(id -g)" \
        -p "127.0.0.1:$PORT:5000" \
        -v "$DATA:/data" \
        -e HOME=/data/home \
        -e AppSettings__DefaultAdmin__UserName="$DDB_DOCS_ADMIN_USER" \
        -e AppSettings__DefaultAdmin__Email=admin@example.com \
        -e AppSettings__DefaultAdmin__Password="$DDB_DOCS_ADMIN_PASSWORD" \
        -e AppSettings__ExternalUrlOverride="$BASE_URL" \
        -e AppSettings__UpdateCheckCron=disabled \
        -e AppSettings__EnableOrganizationMemberManagement=true \
        -e AppSettings__EnableStorageLimiter=true \
        -e AppSettings__Smtp__Enabled=true \
        -e AppSettings__Smtp__Host="$MAIL_CTR" \
        -e AppSettings__Smtp__Port=1025 \
        -e AppSettings__Smtp__Security=None \
        -e AppSettings__Smtp__FromAddress=hub@example.com \
        -e AppSettings__Smtp__FromName="DroneDB Hub (local)" \
        -e AppSettings__BuildNotifications__DigestMinutes=1 \
        -e AppSettings__ProcessingPlatform__NodeOdx__0__Id=local \
        -e AppSettings__ProcessingPlatform__NodeOdx__0__Url="http://$NODE_CTR:3000" \
        -e AppSettings__ProcessingPlatform__NodeOdx__0__Title="Local NodeODX" \
        "$image" --reset-hub
    wait_healthy
    ensure_accounts
    log "Registry: $BASE_URL   MailHog: http://localhost:$MAIL_PORT   credentials: $CREDS"
    log "The demo organization and its data: npm run reset-demo"
    log "A setting changed in this script applies after: $0 restart"
}

cmd_stop() {
    docker rm -f "$REGISTRY_CTR" "$NODE_CTR" "$MAIL_CTR" >/dev/null 2>&1 || true
    log "Stopped (data kept in $DATA)"
}

cmd_status() {
    docker ps -a --filter "name=^ddb-docs-" --format '{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
    if curl -fsS --max-time 5 -o /dev/null "$BASE_URL/health/live" 2>/dev/null; then
        log "Registry healthy on $BASE_URL"
    else
        log "Registry not answering on $BASE_URL"
    fi
}

case "${1:-start}" in
    build) shift; cmd_build "$@" ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    restart) cmd_stop; cmd_start ;;
    status) cmd_status ;;
    logs) docker logs -f --tail 200 "$REGISTRY_CTR" ;;
    *) sed -n '2,12p' "$0"; exit 2 ;;
esac
