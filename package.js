Package.describe({
  name: "autoform",
  summary: "Provides UI components that allow you to easily create forms with automatic insert and update events, and automatic reactive validation."
});

Package.on_use(function(api) {
  // Dependencies
  api.use(['simple-schema', 'check']);
  api.use(['livedata', 'underscore', 'deps', 'templating', 'handlebars', 'moment', 'ui'], 'client');
  // Weak dependencies
  api.use(['collection2', 'reload'], ['client'], {weak: true});
  // Imply SS to make sure SimpleSchema object is available to app
  api.imply('simple-schema', 'client');
  // Exports
  api.export('AutoForm', 'client');
  api.export('Utility', 'client', {testOnly: true});
  // Files
  api.add_files(['autoform-common.js']);
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
    'templates/bootstrap3-horizontal/bootstrap3-horizontal.css',
    // plain Template
    'templates/plain/plain.html',
    'templates/plain/plain.js',
    // plain-fieldset Template
    'templates/plain-fieldset/plain-fieldset.html',
    'templates/plain-fieldset/plain-fieldset.js',
    // plain-span Template
    'templates/plain-span/plain-span.html',
    'templates/plain-span/plain-span.js',
    // Core Files
    'autoform.html',
    'utility.js',
    'form-preserve.js',
    'autoform-hooks.js',
    'autoform-inputs.js',
    'autoform-formdata.js',
    'autoform-arrays.js',
    'autoform.js',
    'autoform-helpers.js',
    'autoform-events.js'
  ], 'client');
});

Package.on_test(function (api) {
  api.use(['autoform', 'tinytest', 'underscore']);
  api.add_files('tests/utility-tests.js');
  api.add_files('tests/autoform-tests.js');
});
