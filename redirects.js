// @ts-check
// Every URL that moved keeps working: the old path redirects to its new page. Registry and the
// Hub link to some of these URLs (the update check log line and User-Agent, the upload
// diagnostics, the Align and Mask Borders windows, the entry type help), so they must stay.
// The redirect keeps the #anchor of the old link.

/** @type {Record<string, string | string[]>} new page → old paths */
const moves = {
  '/docs/get-started': ['/docs/overview', '/docs/getting-started', '/docs/desktop'],
  '/docs/get-started/first-dataset': '/docs/getting-started/first-dataset',
  '/docs/self-hosting/install': ['/docs/getting-started/installation', '/docs/registry/getting-started'],
  '/docs/developers/cli/quick-start': '/docs/cli',
  '/docs/developers/cli/cookbook': '/docs/cli/examples',
  '/docs/developers/cli/reference': '/docs/cli/cli-reference',
  '/docs/self-hosting': ['/docs/registry', '/docs/registry/admin'],
  '/docs/hub-guide': ['/docs/registry/datasets', '/docs/features'],
  '/docs/hub-guide/account/preferences': '/docs/registry/preferences',
  '/docs/hub-guide/files/import': '/docs/registry/import-export',
  '/docs/hub-guide/account/export-delete': '/docs/registry/data-export-and-deletion',
  '/docs/self-hosting/production': ['/docs/registry/admin/production', '/docs/registry/production'],
  '/docs/self-hosting/configuration': ['/docs/registry/admin/configuration', '/docs/registry/configuration'],
  '/docs/self-hosting/users': ['/docs/registry/admin/user-management', '/docs/registry/user-management'],
  '/docs/self-hosting/ldap': '/docs/registry/admin/ldap-authentication',
  '/docs/self-hosting/email': '/docs/registry/admin/email',
  '/docs/self-hosting/update-check': '/docs/registry/admin/update-check',
  '/docs/self-hosting/processing-nodes': ['/docs/registry/admin/processing-platform', '/docs/registry/processing-platform'],
  '/docs/self-hosting/troubleshooting': ['/docs/registry/admin/troubleshooting', '/docs/registry/troubleshooting'],
  '/docs/hub-guide/analyse/plant-health': ['/docs/features/multispectral', '/docs/multispectral'],
  '/docs/hub-guide/analyse/stockpile': ['/docs/features/terrain-analytics', '/docs/terrain-analytics'],
  '/docs/hub-guide/processing/align-raster': '/docs/features/raster-alignment',
  '/docs/hub-guide/analyse/colormaps': '/docs/features/georaster-processing',
  '/docs/hub-guide/viewing/3d-viewer': '/docs/features/3d-tiles',
  '/docs/hub-guide/viewing/splats': '/docs/features/gaussian-splat',
  '/docs/hub-guide/viewing/map': '/docs/features/vector-processing',
  '/docs/hub-guide/files/archives': '/docs/features/archive-extraction',
  '/docs/hub-guide/processing/photogrammetry': '/docs/features/photogrammetry-integration',
  '/docs/hub-guide/files/copy-paste': '/docs/features/bulk-operations',
  '/docs/developers': '/docs/integrations',
  '/docs/developers/api/reference': ['/docs/integrations/api-reference', '/docs/api-reference'],
  '/docs/developers/stac': ['/docs/integrations/stac-api', '/docs/registry/stac-api'],
  '/docs/developers/ogc': ['/docs/integrations/ogc-services', '/docs/ogc-services'],
  '/docs/developers/library': '/docs/integrations/library',
  '/docs/developers/contributing': '/docs/contributing',
  '/docs/developers/building-from-source': ['/docs/contributing/building-from-source', '/docs/building-from-source'],
  '/docs/reference/faq': '/docs/faq',
};

/** @type {{from: string | string[], to: string}[]} */
const redirects = Object.entries(moves).map(([to, from]) => ({to, from}));

module.exports = redirects;
