Package.describe({
  summary: "A smart package for Meteor that adds handlebars helpers to easily create basic forms with automatic insert and update events, and automatic reactive validation."
});

Package.on_use(function(api) {
  api.use(['underscore', 'templating']);
  api.add_files(['autoform.html', 'autoform.js'], ['client']);
});