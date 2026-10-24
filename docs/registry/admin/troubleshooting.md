---
sidebar_position: 7
sidebar_label: Troubleshooting
---

# Troubleshooting

## Reverse Proxy Configuration

When running behind a reverse proxy (nginx, Apache, etc.), configure `ExternalUrlOverride` to ensure correct URL generation:

```json
{
  "ExternalUrlOverride": "https://registry.yourdomain.com"
}
```

### Nginx Example

```nginx
server {
    listen 443 ssl;
    server_name registry.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 0;
    }
}
```

Registry applies `X-Forwarded-For` and `X-Forwarded-Proto` only when the proxy's address is in
`KnownProxies` or `KnownNetworks` (see
[Behind a reverse proxy](./production.md#behind-a-reverse-proxy)). If the logs show the same
`172.x.0.1` address for every client, or all anonymous users share one rate limit, add the
Docker bridge range to `KnownNetworks`.

### Tuning the reverse proxy for large uploads

Registry **streams** uploads straight to storage as the bytes arrive, and it hashes
each file while it is written, so the response follows the last byte within
milliseconds. A reverse proxy keeps that behaviour only if it forwards the body as
it arrives and, over HTTP/2, gives each upload stream a large enough window.

Four settings matter:

- **Request-body buffering.** With buffering on (the nginx default), the proxy writes
  the whole upload to a temporary file before it contacts Registry. The upload is
  written to disk twice, the proxy needs scratch space as large as the file, and the
  browser shows 100 % while the proxy is still replaying the file to Registry
  (*file size ÷ temp-disk speed*: tens of seconds per GB on mechanical disks).
  Buffering off streams the body to Registry.
- **The HTTP/2 stream window.** With buffering off and HTTP/2 enabled, nginx
  advertises `http2_body_preread_size` (64 KB by default) as the window of each
  upload stream and refills it one buffer at a time. Each stream then moves at most
  *window ÷ round-trip time*: 1.6 MB/s at 40 ms, 0.64 MB/s at 100 ms, whatever the
  uplink. A single large file uses one stream, so it is the worst case. Raise the
  window to 2 MB (20 MB/s per stream at 100 ms). HTTP/1.1 is not affected: TCP does
  the flow control.
- **Body-size limit.** Remove (or raise) the proxy's limit. You can still cap uploads
  centrally with the Registry `MaxRequestBodySize` setting (see
  [Configuration](./configuration.md#maxrequestbodysize)); larger requests are
  rejected with `413 Payload Too Large` before any byte is stored.
- **Read timeout.** `proxy_read_timeout` must cover the time between the last byte of
  the upload and the response. Registry hashes while it receives the file, so this is
  normally the index commit (milliseconds). Two cases make it longer: buffering on
  (the replay above) and older Registry versions, which hash after the upload
  (*file size ÷ min(hash rate, disk read rate)*, e.g. 10 GB on a mechanical-disk host
  ≈ 70 s). Keep it at 600 s or more.

#### Nginx

```nginx
server {
    listen 443 ssl;            # or "listen 443 ssl http2;" (nginx < 1.25) / "http2 on;"
    server_name registry.yourdomain.com;

    # Allow large uploads (0 = unlimited, or an explicit cap e.g. 20g)
    client_max_body_size 0;

    # Required when HTTP/2 is enabled and request buffering is off: the per-stream
    # upload window (server level, not allowed inside location). Costs up to 2 MB of
    # memory per upload in flight.
    http2_body_preread_size 2m;
    client_body_buffer_size 2m;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;          # required for unbuffered request bodies

        # Stream the upload to Registry instead of spooling it to a temp file first
        proxy_request_buffering off;

        proxy_connect_timeout 600s;
        proxy_send_timeout    600s;
        proxy_read_timeout    600s;
        send_timeout          600s;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Buffering **on** is still a valid choice, for example for a proxy that must absorb
slow clients: it does not hit the HTTP/2 window limit, but it keeps the second copy
on disk and the wait after 100 %. Response buffering (`proxy_buffering`) can stay on:
Registry's live task updates (server-sent events) turn it off per response with
`X-Accel-Buffering: no`.

#### Apache (httpd) with mod_proxy

Apache's `mod_proxy_http` already streams request bodies to the backend (it does
not spool the whole upload to disk), so the focus is on **limits, timeouts and the
HTTP/2 window**:

```apache
<VirtualHost *:443>
    ServerName registry.yourdomain.com

    ProxyPreserveHost On
    # timeout (seconds) keeps the backend connection open during long uploads
    ProxyPass        / http://localhost:5000/ timeout=600
    ProxyPassReverse / http://localhost:5000/

    # Allow large uploads (0 = unlimited, or set an explicit byte cap)
    LimitRequestBody 0

    # mod_reqtimeout aborts slow request bodies by default; relax it so large
    # uploads over slow links are not killed mid-transfer. The deadline is
    # extended as long as data keeps arriving at >= 1 KB/s.
    RequestReadTimeout body=30,MinRate=1024

    # With mod_http2 (Protocols h2 http/1.1): the per-stream window is 64 KB by
    # default and caps every upload at window ÷ round-trip time
    H2WindowSize 2097152

    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

If large uploads fail with `408 Request Timeout` or a reset connection, the usual
culprit is `mod_reqtimeout` (`RequestReadTimeout`) rather than `Timeout` or
`ProxyTimeout`; adjust the `body=` rule as shown above. Make sure `mod_proxy`,
`mod_proxy_http` and `mod_headers` are enabled.

#### Caddy and Traefik

Both stream request bodies and use 1 MB HTTP/2 windows: no upload settings are
needed. Keep their default timeouts above the longest upload.

#### Checking the result: upload diagnostics

In the Hub, open **My Account → Upload diagnostics** and press **Run test**. The Hub
sends 8 MB of random data to Registry (`POST /sys/upload-probe`, discarded on
arrival) on one connection and then on six in parallel, and shows the protocol the
browser negotiated (`h2` or `http/1.1`), the round-trip time and the throughput.
When a single HTTP/2 stream runs at about 64 KB (or 1 MB) ÷ round-trip time, the
page shows "The reverse proxy window is limiting uploads" with a link to this
section. The test is limited to a few runs per minute per user.

#### "504 Gateway Timeout" after the upload reached 100 %

The proxy gave up waiting for the response while Registry was still adding the file
(see **Read timeout** above). The file is usually in the dataset. The Hub does not
upload it again: it asks Registry for the state of that upload
(`GET /orgs/{org}/ds/{ds}/obj/uploads/{uploadId}`) and marks the file done once
Registry reports it. Raise `proxy_read_timeout` if this happens often.

## Common Issues

**`no matching manifest for linux/arm64/v8` when you pull the image**
- The `dronedb/registry` image is built for `linux/amd64` only. You are on an Apple Silicon Mac or another ARM computer.
- Add `--platform linux/amd64` to the `docker run` command. See [Apple Silicon and other ARM computers](../getting-started.md#apple-silicon-and-other-arm-computers).

**Container fails to start**
- Check logs: `docker-compose logs registry`
- Verify database connectivity
- Ensure DroneDB library is properly installed

**"Unable to use the DDB library" at start**
- Registry needs the DroneDB library 2.x, with every function Registry calls. Use the Docker image, or install the DroneDB build pinned in `Directory.Build.props` of your Registry version.

**Registry exits with code 1 and "Invalid setting: ..."**
- A setting in `appsettings.json` or the environment is invalid; the message names the key. Fix it and check with `Registry.Web <storage folder> --check` (see [Configuration](./configuration.md)).

**Container never becomes healthy**
- The health check must call `/healthcheck.sh` (the image's own check) or `GET /health/live`. `/quickhealth` needs the `MonitorToken` or an administrator, so a `curl .../quickhealth` health check never passes.

**Authentication errors**
- Verify `Secret` is set and consistent
- Check token expiration settings
- Clear browser cookies

**File upload failures**
- Check `MaxRequestBodySize` setting
- Verify storage path permissions
- Check available disk space

**Build jobs stuck or failing**
- Check Hangfire dashboard at `/hangfire`
- Verify DroneDB library is accessible
- Check disk space and memory

**JobIndices table growing too large**
- The `JobIndices` table keeps track of build jobs. A scheduled cleanup task removes old terminal records automatically (default: every night at 4:00 AM, retaining 60 days). If the table has already grown very large, trigger an immediate one-off purge:
  ```bash
  curl -X POST -H "Authorization: Bearer <admin-token>" \
    http://localhost:5000/sys/cleanup-jobindices
  ```
  You can optionally override the retention period: `?retentionDays=30`.
- See `JobIndexRetentionDays` and `JobIndexCleanupCron` in the [Configuration Reference](./configuration.md#jobindexcleanupcron).

**Slow performance**
- Consider switching from SQLite to MySQL/MariaDB
- Add Redis cache for high-traffic instances
- Check `WorkerThreads` configuration

## Dataset initialization fails on macOS

**Symptoms**
- Creating a dataset fails with `filesystem error: cannot copy: Permission denied`.
- The logs repeat `Table 'entries' not found (not a valid database: ...)` every minute
  for one or more datasets, often `public/default`.

**Cause**

`/data` is a host folder that Docker Desktop shares through virtiofs. DroneDB cannot
copy its empty index template onto this file system. Each failed attempt leaves a
`.ddb` folder with an empty `dbase.sqlite` file. Registry then treats the dataset as
initialized and does not try again.

**Solution**

Run Registry with a named volume for `/data`, as shown in
[macOS: use a named volume](../getting-started.md#macos-use-a-named-volume).

To keep the settings and users from the old folder, copy them into the volume before
you start the new container. This command also removes the broken `.ddb` folders, so
Registry creates the dataset indexes again:

```bash
docker volume create registry-data
docker run --rm -v registry-data:/data -v /ABSOLUTE/PATH/TO/OLD/DATA:/old alpine \
  sh -c 'cp -a /old/. /data/ && rm -rf /data/datasets/*/*/.ddb'
```

:::caution
The `rm` command removes the index of every dataset in the volume. Use it only for an
instance where no dataset was initialized correctly.
:::

## Upgrading: Point clouds (EPT → COPC)

Starting with Registry 2.3.0, point cloud streaming uses the **COPC** format
(`build/<hash>/copc/cloud.copc.laz`) instead of the legacy **EPT** layout
(`build/<hash>/ept/ept.json`). Backwards compatibility with old EPT artifacts
has been intentionally dropped to keep the build pipeline simple, so any
dataset that was built before the upgrade must be migrated **before** point
clouds become viewable again.

You have two options:

1. **Run the migration script** (recommended). It rebuilds COPC artifacts in
   place from the existing source LAS/LAZ files, without touching the
   database. From the DroneDB repository:
   ```bash
   python scripts/migrate-to-copc.py /path/to/registry-data/datasets
   ```
   The script requires PDAL on `PATH` and is idempotent (already-migrated
   datasets are skipped).

2. **Trigger a rebuild** of each affected dataset from the Hub UI
   (Settings → Rebuild) or via the `/build` API. This regenerates all build
   artifacts, not only point clouds, and is therefore slower.

After migration, run a one-off cleanup to drop orphaned EPT folders:
```bash
curl -X POST -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" -d '{}' \
  http://localhost:5000/system/cleanup
```

See `DatasetCleanupCron` in the [Configuration Reference](./configuration.md)
for the recurring full-cleanup schedule.

## Health Checks

Use the health endpoints to diagnose issues:

```bash
# Liveness (no auth): the process serves HTTP
curl http://localhost:5000/health/live

# Quick health (basic check)
curl -H "Authorization: Bearer <token>" http://localhost:5000/quickhealth

# Full health (includes database, DroneDB)
curl -H "Authorization: Bearer <token>" http://localhost:5000/health
```

`<token>` is an administrator's token or the `MonitorToken`; the token can also be passed as
`?token=<MonitorToken>`.

### Health Check Response

The `/health` endpoint returns detailed status for:

- **Database**: Connection and query status
- **DroneDB**: Library availability and version
- **Storage**: Disk space availability
- **Hangfire**: Background job processor status

## Logs

### Log Locations

| Deployment | Log Location |
|------------|--------------|
| Docker | `docker-compose logs registry`; files in `data/logs/`: `registry-web*.txt`, `registry-node-<host name>*.txt`, `registry-thumbs*.txt` |
| Native | `registry-data/logs/registry*.txt` |

Log files roll daily and the last 14 are kept (100 MB at most per file). Give each processing
node container a fixed `hostname`: its log file is named after it.

### Adjusting Log Verbosity

Change log level in `appsettings.json`:

```json
"LevelSwitches": {
    "$CONTROL_SWITCH": "Warning"
}
```

Available levels: `Verbose`, `Debug`, `Information`, `Warning`, `Error`, `Fatal`

## Getting Help

If you're still experiencing issues:

1. Check the [FAQ](/docs/faq)
2. Search [GitHub Issues](https://github.com/DroneDB/Registry/issues)
3. Commercial support is available at [dronedb.app/contact](https://dronedb.app/contact)
