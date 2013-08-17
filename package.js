Package.describe({
    summary: "A smart package for Meteor that adds handlebars helpers to easily create basic forms with automatic insert and update events, and automatic reactive validation."
});

Package.on_use(function(api) {
    api.imply('simple-schema', ['client', 'server']);
    
    api.use('underscore', ['client', 'server']);
    api.use('deps', 'client');
    api.use('startup', 'client');
    api.use('templating', 'client');
    api.use('collection2', ['client', 'server'],  {weak: true});
    
    api.add_files(['autoform-common.js'], ['client', 'server']);
    api.add_files(['autoform-server.js'], ['server']);
    api.add_files(['autoform.html', 'autoform-client.js'], ['client']);
    
    api.export(['AutoForm'], ['client', 'server']);
});