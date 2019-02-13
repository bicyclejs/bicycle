/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// See https://docusaurus.io/docs/site-config for all the possible
// site configuration options.

// List of projects/orgs using your project for the users page.
const users = [
  {
    caption: 'Save Willpower',
    image: '/img/users/savewillpower.svg',
    infoLink: 'https://savewillpower.com/',
    pinned: true,
  },
  {
    caption: 'Canoe Slalom Entries',
    image: 'https://www.canoeslalomentries.co.uk/favicon.ico',
    infoLink: 'https://www.canoeslalomentries.co.uk',
    pinned: true,
  },
  {
    caption: 'Jepso',
    image: '/img/users/jepso.svg',
    infoLink: 'https://www.jepso.com/',
    pinned: true,
  },
];

const siteConfig = {
  title: 'Bicycle', // Title for your website.
  tagline: 'A data fetching and synchronisation library for JavaScript',
  url: 'https://www.bicyclejs.org', // Your website URL
  baseUrl: '/', // Base URL for your project */

  // Used for publishing and more
  projectName: 'bicycle',
  organizationName: 'bicyclejs',

  // For no header links in the top nav bar -> headerLinks: [],
  headerLinks: [
    {doc: 'getting-started', label: 'Docs'},
    {blog: true, label: 'Blog'},
  ],

  // If you have users set above, you add it here:
  users,

  /* path to images for header/footer */
  headerIcon: 'img/tmp/white.svg',
  footerIcon: 'img/tmp/color.png',
  favicon: 'img/tmp/color.png',

  /* Colors for website */
  colors: {
    primaryColor: 'rgb(83,61,233)',
    secondaryColor: 'rgb(83,97,242)',
  },

  /* Custom fonts for website */
  /*
  fonts: {
    myFont: [
      "Times New Roman",
      "Serif"
    ],
    myOtherFont: [
      "-apple-system",
      "system-ui"
    ]
  },
  */

  // This copyright info is used in /core/Footer.js and blog RSS/Atom feeds.
  copyright: `Copyright © ${new Date().getFullYear()} ForbesLindesay`,

  highlight: {
    // Highlight.js theme to use for syntax highlighting in code blocks.
    theme: 'default',
  },

  // Add custom scripts here that would be placed in <script> tags.
  scripts: ['https://buttons.github.io/buttons.js'],

  // On page navigation for the current documentation page.
  onPageNav: 'separate',
  // No .html extensions for paths.
  cleanUrl: true,

  // Open Graph and Twitter card images.
  ogImage: 'img/tmp/color.png',
  twitterImage: 'img/tmp/color.png',

  // Show documentation's last contributor's name.
  // enableUpdateBy: true,

  // Show documentation's last update time.
  // enableUpdateTime: true,

  // You may provide arbitrary config keys to be used as needed by your
  // template. For example, if you need your repo's URL...
  repoUrl: 'https://github.com/bicyclejs/bicycle',
};

module.exports = siteConfig;
