// @ts-check
// Every URL that moved keeps working: the old path redirects to its new page.
// The old pages stay in the repository until the new structure launches; the redirects of
// pages that still exist are added when those pages are deleted.

/** @type {{from: string | string[], to: string}[]} */
const redirects = [
  // Older moves
  {from: '/docs/desktop', to: '/docs/overview'},
  {from: '/docs/multispectral', to: '/docs/features/multispectral'},
  {from: '/docs/terrain-analytics', to: '/docs/features/terrain-analytics'},
  {from: '/docs/api-reference', to: '/docs/integrations/api-reference'},
  {from: '/docs/ogc-services', to: '/docs/integrations/ogc-services'},
  {from: '/docs/registry/stac-api', to: '/docs/integrations/stac-api'},
  {from: '/docs/building-from-source', to: '/docs/contributing/building-from-source'},
  {from: '/docs/registry/production', to: '/docs/registry/admin/production'},
  {from: '/docs/registry/configuration', to: '/docs/registry/admin/configuration'},
  {from: '/docs/registry/user-management', to: '/docs/registry/admin/user-management'},
  {from: '/docs/registry/processing-platform', to: '/docs/registry/admin/processing-platform'},
  {from: '/docs/registry/troubleshooting', to: '/docs/registry/admin/troubleshooting'},
];

module.exports = redirects;
