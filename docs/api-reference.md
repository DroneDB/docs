---
sidebar_position: 4
---

# API Reference

DroneDB Registry exposes a REST API for programmatic access to all features. All endpoints return JSON unless otherwise specified.

:::tip Interactive Documentation
Access the interactive API documentation at `/scalar/v1` on your Registry instance (e.g., [hub.dronedb.app/scalar/v1](https://hub.dronedb.app/scalar/v1)).
:::

## Authentication

Most endpoints require JWT authentication. Obtain a token via the authenticate endpoint:

```bash
POST /users/authenticate
Content-Type: application/json

{
  "userName": "admin",
  "password": "password"
}
```

Use the token in subsequent requests:

```bash
Authorization: Bearer <token>
```

Tokens can be refreshed before expiration:

```bash
POST /users/authenticate/refresh
Authorization: Bearer <token>
```

## Organizations

**Base Route:** `/orgs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orgs` | List all organizations |
| GET | `/orgs/public` | List public organizations (no auth required) |
| GET | `/orgs/{orgSlug}` | Get organization details |
| POST | `/orgs` | Create organization |
| PUT | `/orgs/{orgSlug}` | Update organization |
| DELETE | `/orgs/{orgSlug}` | Delete organization |

## Datasets

**Base Route:** `/orgs/{orgSlug}/ds`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orgs/{orgSlug}/ds` | List all datasets in organization |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}` | Get dataset entries |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/ex` | Get extended dataset info |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/stamp` | Get dataset checksum and metadata |
| POST | `/orgs/{orgSlug}/ds` | Create dataset |
| PUT | `/orgs/{orgSlug}/ds/{dsSlug}` | Update dataset |
| DELETE | `/orgs/{orgSlug}/ds/{dsSlug}` | Delete dataset |
| POST | `/orgs/{orgSlug}/ds/{dsSlug}/rename` | Rename dataset |
| POST | `/orgs/{orgSlug}/ds/{dsSlug}/chattr` | Change attributes (visibility) |

## Objects

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}`

### Listing & Searching

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../list?path=` | List objects at path |
| POST | `.../list` | List objects (POST version) |
| POST | `.../search` | Search objects in dataset |
| GET | `.../obj?path=` | Get object info |

### Upload & Modification

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../obj` | Upload object (multipart form) |
| PUT | `.../obj` | Move/rename object |
| DELETE | `.../obj?path=` | Delete object |
| DELETE | `.../obj/batch` | Delete multiple objects |

### Download

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../download?path=` | Download object(s) |
| POST | `.../download` | Download objects (POST version) |
| GET | `.../ddb` | Download DroneDB index file |

### Visualization

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../thumb?path=` | Generate thumbnail |
| GET | `.../tiles/{tz}/{tx}/{ty}.png` | Generate map tile |
| GET | `.../build/{hash}/*` | Get build files (COG, NXS, EPT) |

### Build Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../build` | Start build job for object |
| GET | `.../builds` | List build jobs (paginated) |
| POST | `.../builds/clear` | Clear completed build jobs |

## Share

**Base Route:** `/share`

The Share API enables file uploads via the DroneDB CLI (`ddb share`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/share/init` | Initialize share session |
| GET | `/share/{token}` | Get share batch info |
| POST | `/share/{token}/upload` | Upload file to share |
| POST | `/share/{token}/upload/chunked` | Upload large file in chunks |
| POST | `/share/{token}/commit` | Finalize share |
| POST | `/share/{token}/rollback` | Cancel share |

## Push

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}/push`

The Push API enables syncing local datasets to Registry via the DroneDB CLI (`ddb push`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `.../push/init` | Initialize push operation |
| POST | `.../push/upload` | Upload file during push |
| POST | `.../push/meta` | Upload metadata |
| POST | `.../push/commit` | Finalize push |

## Metadata

**Base Route:** `/orgs/{orgSlug}/ds/{dsSlug}/meta`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `.../meta/list` | List all metadata keys |
| GET | `.../meta/{key}` | Get metadata values by key |
| POST | `.../meta/{key}` | Add metadata entry |
| POST | `.../meta/{key}/set` | Set/replace metadata |
| DELETE | `.../meta/{key}` | Remove all metadata with key |
| DELETE | `.../meta/{id}` | Remove specific metadata entry |
| POST | `.../meta/dump` | Export all metadata |

## Users

**Base Route:** `/users`

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/authenticate` | Login (returns JWT) |
| POST | `/users/authenticate/refresh` | Refresh JWT token |

### User Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users |
| GET | `/users/detailed` | List users with extended info |
| POST | `/users` | Create user |
| PUT | `/users/{userName}` | Update user |
| DELETE | `/users/{userName}` | Delete user |

### Password Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/users/changepwd` | Change current user password |
| PUT | `/users/{userName}/changepwd` | Change user password (admin) |

### Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/roles` | List all roles |
| POST | `/users/roles/{roleName}` | Create role (admin) |
| DELETE | `/users/roles/{roleName}` | Delete role (admin) |

### Storage & Metadata

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/storage` | Get current user storage info |
| GET | `/users/{userName}/storage` | Get user storage info (admin) |
| GET | `/users/{userName}/meta` | Get user metadata |
| POST | `/users/{userName}/meta` | Set user metadata (admin) |

### Organizations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/{userName}/orgs` | Get user's organizations |
| PUT | `/users/{userName}/orgs` | Set user's organizations (admin) |

## STAC

The STAC (SpatioTemporal Asset Catalog) API provides standardized access to public datasets.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stac` | Root STAC Catalog |
| GET | `/orgs/{orgSlug}/ds/{dsSlug}/stac` | Dataset STAC Collection |

Browse STAC catalogs with tools like [STAC Browser](https://radiantearth.github.io/stac-browser/).

## System

**Base Route:** `/sys`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/sys/version` | Get Registry version |
| POST | `/sys/importdataset` | Import dataset from another Registry |
| POST | `/sys/importorg` | Import organization from another Registry |
| POST | `/sys/cleanupbatches` | Cleanup expired batches |
| POST | `/sys/cleanupdatasets` | Cleanup empty datasets |
| POST | `/sys/move-datasets` | Move datasets between orgs (admin) |
| POST | `/sys/merge-orgs` | Merge organizations (admin) |

## Health Checks

| Endpoint | Description |
|----------|-------------|
| `/version` | Application version (no auth) |
| `/quickhealth` | Basic health check (requires auth) |
| `/health` | Full health check (requires auth) |

## Error Responses

API errors return JSON with the following structure:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
