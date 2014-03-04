Package.describe({
  summary: "A smart package for Meteor that adds handlebars helpers to easily create basic forms with automatic insert and update events, and automatic reactive validation."
});

Package.on_use(function(api) {
  api.use('jquery', 'client');
  api.use('underscore', ['client', 'server']);
  api.use('deps', ['client', 'server']);
  api.use(['templating', 'handlebars', 'moment'], 'client');
  api.use('collection2', ['client', 'server'], {weak: true});
  api.use('simple-schema', ['client', 'server']);

  if (typeof api.export !== 'undefined') {
    api.use('livedata', ['client', 'server']);
    api.imply('simple-schema', ['client', 'server']);
    api.export(['AutoForm'], ['client', 'server']);
  }

  api.add_files(['autoform-server.js'], ['server']);
  api.add_files(['autoform.html', 'autoform-client.js'], ['client']);
});