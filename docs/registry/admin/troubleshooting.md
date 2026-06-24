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

### Tuning the reverse proxy for large uploads

Registry **streams** uploads straight to storage as the bytes arrive, so a single
large file is written only once. To preserve that throughput end to end, the
reverse proxy in front of Registry must **not** re-buffer the whole request body
before forwarding it. Otherwise every upload is written twice (once into the
proxy's temporary area, once by Registry), the client sees no progress until the
proxy has received the entire file, and the proxy needs scratch space as large as
the upload.

Two things matter for large uploads:

- **Disable request-body buffering** at the proxy so the body is streamed to Registry.
- **Remove (or raise) the proxy's body-size limit** so large files are not rejected.
  You can still cap uploads centrally with the Registry `MaxRequestBodySize`
  setting (see [Configuration](./configuration.md#maxrequestbodysize)); requests
  over the limit are rejected with `413 Payload Too Large`.

#### Nginx (high-throughput uploads)

```nginx
server {
    listen 443 ssl;
    server_name registry.yourdomain.com;

    # Allow large uploads (0 = unlimited, or set an explicit cap e.g. 20g)
    client_max_body_size 0;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # Stream the upload straight to Registry instead of spooling it to a
        # temp file first. This is the single most important upload setting.
        proxy_request_buffering off;
        # Optional: also stream responses (downloads) without buffering.
        proxy_buffering off;

        # Generous timeouts for long transfers over slow links.
        proxy_connect_timeout 60s;
        proxy_send_timeout     3600s;
        proxy_read_timeout     3600s;

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

With the default `proxy_request_buffering on`, nginx writes the entire upload to a
temporary file (`client_body_temp`) before it even contacts Registry. Turning it
**off** restores true streaming. Note that for chunked `Transfer-Encoding` nginx
still buffers unless `proxy_http_version` is `1.1` (or `2`), so keep that line.

#### Apache (httpd) with mod_proxy

Apache's `mod_proxy_http` already streams request bodies to the backend (it does
not spool the whole upload to disk), so the focus is on **limits and timeouts**:

```apache
<VirtualHost *:443>
    ServerName registry.yourdomain.com

    ProxyPreserveHost On
    # timeout (seconds) keeps the backend connection open during long uploads
    ProxyPass        / http://localhost:5000/ timeout=3600
    ProxyPassReverse / http://localhost:5000/

    # Allow large uploads (0 = unlimited, or set an explicit byte cap)
    LimitRequestBody 0

    # mod_reqtimeout aborts slow request bodies by default; relax it so large
    # uploads over slow links are not killed mid-transfer. The deadline is
    # extended as long as data keeps arriving at >= 1 KB/s.
    RequestReadTimeout body=30,MinRate=1024

    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

If large uploads fail with `408 Request Timeout` or a reset connection, the usual
culprit is `mod_reqtimeout` (`RequestReadTimeout`) rather than `Timeout` or
`ProxyTimeout`; adjust the `body=` rule as shown above. Make sure `mod_proxy`,
`mod_proxy_http` and `mod_headers` are enabled.

## Common Issues

**Container fails to start**
- Check logs: `docker-compose logs registry`
- Verify database connectivity
- Ensure DroneDB library is properly installed

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
    http://localhost:5000/system/cleanup-jobindices
  ```
  You can optionally override the retention period: `?retentionDays=30`.
- See `JobIndexRetentionDays` and `JobIndexCleanupCron` in the [Configuration Reference](./configuration.md#jobindexcleanupcron).

**Slow performance**
- Consider switching from SQLite to MySQL/MariaDB
- Add Redis cache for high-traffic instances
- Check `WorkerThreads` configuration

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
# Quick health (basic check)
curl -H "Authorization: Bearer <token>" http://localhost:5000/quickhealth

# Full health (includes database, DroneDB)
curl -H "Authorization: Bearer <token>" http://localhost:5000/health
```

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
| Docker | `docker-compose logs registry` |
| Native | `registry-data/logs/registry.txt` |

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
