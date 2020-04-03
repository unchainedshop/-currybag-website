Package.describe({
  name: 'unchained:core-settings',
  version: '0.45.0',
  summary:
    'This package contains api to define settings for the unchained engine.',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.get': '4.4.2',
});

Package.onUse((api) => {
  api.versionsFrom('1.8.0.2');
  api.use('ecmascript');
  api.mainModule('core-settings.js');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('unchained:core-settings');
  api.mainModule('core-settings-tests.js');
});
