// @ts-check

const {themes} = require('prism-react-renderer');
const redirects = require('./redirects');

const HUB_URL = 'https://hub.dronedb.app';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'DroneDB',
  tagline: 'Store, view, measure and share drone data in your browser',
  url: 'https://docs.dronedb.app',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'warn',
  favicon: 'img/favicon.ico',
  trailingSlash: false,

  organizationName: 'DroneDB',
  projectName: 'docs',

  customFields: {
    hubUrl: HUB_URL,
  },

  plugins: [
    ['@docusaurus/plugin-client-redirects', {redirects}],
  ],

  themes: [
    '@docusaurus/theme-mermaid',
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['en', 'it'],
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
      }),
    ],
  ],

  markdown: {
    mermaid: true,
    mdx1Compat: {
      comments: false,
      admonitions: true,
      headingIds: false,
    },
  },

  // Untranslated pages fall back to English. Screenshots and clips are shared by every
  // locale, because the Hub itself is in English.
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'it', 'fr', 'de', 'es', 'zh-Hans'],
    localeConfigs: {
      en: {label: 'English', htmlLang: 'en'},
      it: {label: 'Italiano', htmlLang: 'it'},
      fr: {label: 'Français', htmlLang: 'fr'},
      de: {label: 'Deutsch', htmlLang: 'de'},
      es: {label: 'Español', htmlLang: 'es'},
      'zh-Hans': {label: '简体中文', htmlLang: 'zh-Hans'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/DroneDB/docs/edit/master/',
          showLastUpdateTime: true,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.svg',
      navbar: {
        title: 'DroneDB',
        logo: {alt: 'DroneDB', src: 'img/logo.svg'},
        items: [
          {type: 'docSidebar', sidebarId: 'getStarted', position: 'left', label: 'Get started'},
          {type: 'docSidebar', sidebarId: 'hubGuide', position: 'left', label: 'Hub guide'},
          {type: 'docSidebar', sidebarId: 'selfHosting', position: 'left', label: 'Self-hosting'},
          {type: 'docSidebar', sidebarId: 'developers', position: 'left', label: 'Developers'},
          {type: 'doc', docId: 'reference/faq', position: 'left', label: 'FAQ'},
          {type: 'localeDropdown', position: 'right'},
          {href: 'https://github.com/DroneDB', label: 'GitHub', position: 'right'},
          {href: HUB_URL, label: 'Open Hub', position: 'right', className: 'navbar-open-hub'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {label: 'Get started', to: '/docs/get-started'},
              {label: 'Hub guide', to: '/docs/hub-guide'},
              {label: 'Self-hosting', to: '/docs/self-hosting'},
              {label: 'Developers', to: '/docs/developers'},
            ],
          },
          {
            title: 'Reference',
            items: [
              {label: 'Supported formats', to: '/docs/reference/formats'},
              {label: 'Glossary', to: '/docs/reference/glossary'},
              {label: 'FAQ', to: '/docs/reference/faq'},
            ],
          },
          {
            title: 'DroneDB',
            items: [
              {label: 'DroneDB Hub', href: HUB_URL},
              {label: 'dronedb.app', href: 'https://dronedb.app'},
              {label: 'YouTube', href: 'https://www.youtube.com/@DroneDB'},
              {label: 'GitHub', href: 'https://github.com/DroneDB'},
            ],
          },
        ],
        copyright: `Made with ❤ by DroneDB Contributors`,
      },
      prism: {
        theme: themes.github,
        darkTheme: themes.dracula,
        additionalLanguages: ['bash', 'powershell', 'json', 'yaml', 'csharp'],
      },
      colorMode: {
        defaultMode: 'light',
        respectPrefersColorScheme: true,
      },
    }),
};

module.exports = config;
