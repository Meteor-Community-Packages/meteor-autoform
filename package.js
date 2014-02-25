Package.describe({
  summary: "A smart package for Meteor that adds handlebars helpers to easily create basic forms with automatic insert and update events, and automatic reactive validation."
});

Package.on_use(function(api) {
  api.use(['underscore', 'deps', 'templating', 'handlebars', 'moment'], 'client');
  api.use('reload', 'client', {weak: true});
  api.use('collection2', ['client', 'server'], {weak: true});
  api.use('simple-schema', ['client', 'server']);

  if (typeof api.export !== 'undefined') {
    api.use('livedata', 'client');
    api.imply('simple-schema', 'client');
    api.export('AutoForm', 'client');
  }

  api.add_files([
    // bootstrap3 Template
    'templates/bootstrap3/bootstrap3.html',
    'templates/bootstrap3/bootstrap3.js',
    // bootstrap3-span Template
    'templates/bootstrap3-span/bootstrap3-span.html',
    'templates/bootstrap3-span/bootstrap3-span.js',
    // plain Template
    'templates/plain/plain.html',
    'templates/plain/plain.js',
    // plain-span Template
    'templates/plain-span/plain-span.html',
    'templates/plain-span/plain-span.js',
    // Core Files
    'autoform.html',
    'form-preserve.js',
    'autoform.js'
  ], 'client');
});
