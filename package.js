/* eslint-env meteor */
Package.describe({
  name: 'aldeed:autoform',
  summary:
    'Easily create forms with automatic insert and update, and automatic reactive validation.',
  git: 'https://github.com/Meteor-Community-Packages/meteor-autoform.git',
  version: '9.0.0'
})

Npm.depends({
  'mongo-object': '3.0.1'
})

Package.onUse(function (api) {
  api.versionsFrom(['3.0.1'])

  // Dependencies
  api.use([
    'ejson',
    'reactive-var',
    'reactive-dict',
    'random',
    'ecmascript',
    'mongo',
    'blaze@3.0.0',
    'templating@1.4.4',
    'jquery@3.0.0'
  ])

  api.use(
    [
      'momentjs:moment@2.30.1',
      'mrt:moment-timezone@0.2.1',
     // 'aldeed:collection2@4.0.4',
      'aldeed:simple-schema@3.0.0',
      'aldeed:moment-timezone@0.4.0',
      'reload'
    ],
    'client',
    { weak: true }
  )

  // Exports
  api.export('AutoForm', 'client')

  // adding the core files in order to keep it backwards-compatible with
  // extensions and themes
  api.addFiles([
    './utility.js',
    './form-preserve.js',
    './autoform-hooks.js',
    './autoform-formdata.js',
    './autoform-arrays.js',
    './autoform.js',
    './autoform-validation.js',
    './autoform-inputs.js',
    './autoform-api.js'
  ], 'client')

  // api.mainModule('main.js', 'client')
})

Package.onTest(function (api) {
  api.versionsFrom(['2.8.0', '3.0.1'])
  // Running the tests requires a dummy project in order to
  // resolve npm dependencies and the test env dependencies.
  api.use([
    'ecmascript',
    'random',
    'tracker',
    'mongo',
    'blaze@3.0.0',
    'templating@1.4.4',
    'meteortesting:mocha@3.2.0'
  ])
  api.use([
    'aldeed:collection2@4.0.4',
    'momentjs:moment@2.30.1'
  ], 'client', { weak: true })
  api.use([
    'aldeed:autoform@8.0.0',
    'aldeed:moment-timezone',
    'aldeed:simple-schema@3.0.0'
  ], 'client')

  api.addFiles([
    'tests/setup.tests.js',
    'tests/utility.tests.js',
    'tests/common.tests.js',
    'tests/FormPreserve.tests.js',
    'tests/FormData.tests.js',
    'tests/Hooks.tests.js',
    'tests/ArrayTracker.tests.js',
    'tests/autoform-inputs.tests.js',
    'tests/autoform-helpers.tests.js',
    'tests/autoform-validation.tests.js',
    'tests/autoform-api.tests.js',
    // component specific
    'tests/components/quickForm/quickFormUtils.tests.js',
    // input types
    'tests/inputTypes/value-converters.tests.js'
  ], 'client')
})
