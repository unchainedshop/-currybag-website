Package.describe({
  name: 'unchained:core-pricing',
  version: '0.45.0',
  summary: 'Unchained Engine Core: Pricing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('1.9');
  api.use('ecmascript');
  api.use('unchained:core-logger@0.45.0');

  api.mainModule('pricing.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-pricing');
  api.mainModule('pricing-tests.js');
});
