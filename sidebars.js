/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'overview',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/index',
        'getting-started/installation',
        'getting-started/first-dataset',
      ],
    },
    {
      type: 'category',
      label: 'CLI',
      items: [
        'cli/index',
        'cli/examples',
        'cli/cli-reference',
      ],
    },
    {
      type: 'category',
      label: 'Registry',
      items: [
        'registry/index',
        'registry/getting-started',
        'registry/datasets',
        'registry/import-export',
        {
          type: 'category',
          label: 'Administration',
          items: [
            'registry/admin/index',
            'registry/admin/production',
            'registry/admin/configuration',
            'registry/admin/user-management',
            'registry/admin/ldap-authentication',
            'registry/admin/processing-platform',
            'registry/admin/troubleshooting',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Features',
      items: [
        'features/index',
        'features/multispectral',
        'features/terrain-analytics',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'integrations/index',
        'integrations/api-reference',
        'integrations/stac-api',
        'integrations/ogc-services',
      ],
    },
    {
      type: 'category',
      label: 'Contributing',
      items: [
        'contributing/index',
        'contributing/building-from-source',
      ],
    },
    'faq',
  ],
};

module.exports = sidebars;
