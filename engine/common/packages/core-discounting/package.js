Package.describe({
  name: 'unchained:core-discounting',
  version: '0.45.0',
  summary: 'Unchained Engine Core: Discounting',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.9');
  api.use('ecmascript');
  api.use('unchained:utils@0.45.0');
  api.use('unchained:core-logger@0.45.0');

  api.mainModule('discounting.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-discounting');
  api.mainModule('discounting-tests.js');
});
