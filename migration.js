// Intern `Migration` object helper to preserve form inputs across Hot 
// Code Push and across "pages" navigation if the option is enabled.

Migration = function(migrationName) {
  var self = this;
  if (_.isUndefined(migrationName))
    throw Error("You must define an unique migration name");
  self.migrationName = migrationName;
  self.registerForms = {};
  self.retrievedDocuments = {};
  if (Package.reload) {
    self.retrievedDocuments = Reload._migrationData(self.migrationName);
    Reload._onMigrate(self.migrationName, function () { 
      return [true, self._retrieveRegisteredDocuments()];
    });
  }
};

Migration.prototype.getDocument = function (formId) {
  var self = this;
  if (! _.has(self.retrievedDocuments, formId))
    return {}; 
  else
    return self.retrievedDocuments[formId];
};

Migration.prototype.saveDocument = function (formId, doc) {
  this.retrievedDocuments[formId] = doc;
}

Migration.prototype.registerForm = function (formId, retrieveFunc) {
  this.registerForms[formId] = retrieveFunc;
};

Migration.prototype.unregisterForm = function (formId) {
  delete this.registerForms[formId];
};

Migration.prototype._retrieveRegisteredDocuments = function () {
  return _.map(this.registerForms, function (retrieveFunc) {
    return retrieveFunc();
  });
};
