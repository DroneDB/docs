// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DroneDB',
  tagline: 'Documentation',
  url: 'https://docs.dronedb.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'DroneDB', // Usually your GitHub org/user name.
  projectName: 'docs', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          //editUrl:
            //'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'DroneDB',
        logo: {
          alt: 'DroneDB',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'desktop',
            position: 'left',
            label: 'Desktop',
          },
        //   {
        //     type: 'doc',
        //     docId: 'intro',
        //     position: 'left',
        //     label: 'Hub',
        //   },
        //   {
        //     type: 'doc',
        //     docId: 'intro',
        //     position: 'left',
        //     label: 'Registry',
        //   },
        //   {
        //     type: 'doc',
        //     docId: 'intro',
        //     position: 'left',
        //     label: 'Server',
        //   },
        //   {
        //     type: 'doc',
        //     docId: 'intro',
        //     position: 'left',
        //     label: 'ddb',
        //   },
          {
            href: 'https://github.com/DroneDB',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Overview',
                to: '/docs/overview',
              },
            ],
          },
          {
            title: 'Social',
            items: [
              {
                label: 'Twitter',
                href: 'https://twitter.com/dronedb',
              },
            ],
          },
          {
            title: 'Sites',
            items: [
              {
                label: "dronedb.app",
                href: "https://dronedb.app"
              }
            ],
          },
        ],
        copyright: `Made with ❤ by DroneDB Contributors`,
      },
      prism: {
        theme: lightCodeTheme
      },
      colorMode: {
        disableSwitch: true
      }
    }),
};

module.exports = config;
