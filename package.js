Package.describe({
  name: "autoform",
  summary: "Provides UI components that allow you to easily create forms with automatic insert and update events, and automatic reactive validation."
});

Package.on_use(function(api) {
  api.use(['underscore', 'deps', 'templating', 'handlebars', 'moment', 'ui'], 'client');
  api.use('reload', 'client', {weak: true});
  api.use('collection2', ['client', 'server'], {weak: true});
  api.use('simple-schema', ['client', 'server']);

  if (typeof api.export !== 'undefined') {
    api.use('livedata', 'client');
    api.imply('simple-schema', 'client');
    api.export('AutoForm', 'client');
    api.export('Utility', 'client', {testOnly: true});
  }

  api.add_files([
    // bootstrap3 Template
    'templates/bootstrap3/bootstrap3.html',
    'templates/bootstrap3/bootstrap3.js',
    // bootstrap3-span Template
    'templates/bootstrap3-span/bootstrap3-span.html',
    'templates/bootstrap3-span/bootstrap3-span.js',
    // bootstrap3-horizontal Template
    'templates/bootstrap3-horizontal/bootstrap3-horizontal.html',
    'templates/bootstrap3-horizontal/bootstrap3-horizontal.js',
    // plain Template
    'templates/plain/plain.html',
    'templates/plain/plain.js',
    // plain-span Template
    'templates/plain-span/plain-span.html',
    'templates/plain-span/plain-span.js',
    // Core Files
    'autoform.html',
    'utility.js',
    'form-preserve.js',
    'hooks.js',
    'autoform-inputs.js',
    'autoform-formdata.js',
    'autoform-arrays.js',
    'autoform.js'
  ], 'client');
});

Package.on_test(function (api) {
  api.use(['autoform', 'tinytest', 'underscore']);
  api.add_files('tests/utility-tests.js');
  api.add_files('tests/autoform-tests.js');
});
