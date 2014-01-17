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

  api.add_files(['autoform.html', 'form-preserve.js', 'autoform.js'], 'client');
});
