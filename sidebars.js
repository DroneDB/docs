// @ts-check
// One sidebar for each section of the navbar. The sidebars are written by hand: a new page
// must be added here.

/** @param {string} label @param {string[]} items @returns {import('@docusaurus/plugin-content-docs').SidebarItemConfig} */
const category = (label, items, collapsed = true) => ({type: 'category', label, collapsed, items});

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  getStarted: [
    'get-started/index',
    'get-started/tour',
    'get-started/first-dataset',
    'get-started/upload',
    'get-started/share-first-map',
    'get-started/key-concepts',
  ],

  hubGuide: [
    'hub-guide/index',
    category('Organizations & datasets', [
      'hub-guide/datasets/browse',
      'hub-guide/datasets/create',
      'hub-guide/datasets/members',
      'hub-guide/datasets/delete',
    ]),
    category('Managing files', [
      'hub-guide/files/browser',
      'hub-guide/files/properties',
      'hub-guide/files/folders',
      'hub-guide/files/copy-paste',
      'hub-guide/files/import',
      'hub-guide/files/archives',
      'hub-guide/files/download',
      'hub-guide/files/edit-text',
      'hub-guide/files/rescan',
      'hub-guide/files/coordinate-system',
    ]),
    category('Viewing data', [
      'hub-guide/viewing/map',
      'hub-guide/viewing/point-cloud',
      'hub-guide/viewing/3d-model',
      'hub-guide/viewing/3d-viewer',
      'hub-guide/viewing/splats',
      'hub-guide/viewing/splats-georeferenced',
      'hub-guide/viewing/splat-downloads',
      'hub-guide/viewing/panoramas',
      'hub-guide/viewing/videos',
      'hub-guide/viewing/markdown-pdf',
    ]),
    category('Measure & annotate', [
      'hub-guide/measure/map',
      'hub-guide/measure/3d',
      'hub-guide/measure/splat',
      'hub-guide/measure/annotations',
    ]),
    category('Analyse rasters', [
      'hub-guide/analyse/colormaps',
      'hub-guide/analyse/compare-layers',
      'hub-guide/analyse/compare-view',
      'hub-guide/analyse/plant-health',
      'hub-guide/analyse/thermal',
      'hub-guide/analyse/elevation-profile',
      'hub-guide/analyse/contours',
      'hub-guide/analyse/stockpile',
      'hub-guide/analyse/area-statistics',
    ]),
    category('Processing', [
      'hub-guide/processing/builds',
      'hub-guide/processing/photogrammetry',
      'hub-guide/processing/merge-multispectral',
      'hub-guide/processing/mask-borders',
      'hub-guide/processing/align-raster',
      'hub-guide/processing/export-raster',
      'hub-guide/processing/tasks',
    ]),
    category('Sharing & integration', [
      'hub-guide/sharing/visibility',
      'hub-guide/sharing/links-embeds',
      'hub-guide/sharing/qgis',
      'hub-guide/sharing/ogc',
      'hub-guide/sharing/stac',
    ]),
    category('Organizations & account', [
      'hub-guide/account/account',
      'hub-guide/account/preferences',
      'hub-guide/account/build-notifications',
      'hub-guide/account/plans',
      'hub-guide/account/export-delete',
    ]),
  ],

  selfHosting: [
    'self-hosting/index',
    'self-hosting/install',
    'self-hosting/production',
    'self-hosting/configuration',
    'self-hosting/users',
    'self-hosting/ldap',
    'self-hosting/email',
    'self-hosting/update-check',
    'self-hosting/processing-nodes',
    'self-hosting/admin-pages',
    'self-hosting/upgrading',
    'self-hosting/backup-restore',
    'self-hosting/troubleshooting',
  ],

  developers: [
    'developers/index',
    category('DroneDB CLI', [
      'developers/cli/install',
      'developers/cli/quick-start',
      'developers/cli/cookbook',
      'developers/cli/reference',
    ], false),
    'developers/library',
    category('REST API', [
      'developers/api/authentication',
      'developers/api/workflows',
      'developers/api/reference',
    ], false),
    'developers/stac',
    'developers/ogc',
    'developers/processing-api',
    'developers/users-api',
    'developers/building-from-source',
    'developers/contributing',
  ],

  reference: [
    'reference/formats',
    'reference/glossary',
    'reference/faq',
    {type: 'link', label: 'Release notes', href: 'https://github.com/DroneDB/Registry/releases'},
  ],
};

module.exports = sidebars;
