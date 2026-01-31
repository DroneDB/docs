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

**Slow performance**
- Consider switching from SQLite to MySQL/MariaDB
- Add Redis cache for high-traffic instances
- Check `WorkerThreads` configuration

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

1. Check the [FAQ](../faq.md)
2. Search [GitHub Issues](https://github.com/DroneDB/Registry/issues)
3. Commercial support is available at [dronedb.app/contact](https://dronedb.app/contact)
