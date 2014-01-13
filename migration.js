// Intern `Migration` object helper to preserve form inputs across Hot 
// Code Push and across "pages" navigation if the option is enabled.

Migration = function(migrationName) {
  var self = this;
  if (! _.isString(migrationName))
    throw Error("You must define an unique migration name of type String");
  self.registerForms = {};
  self.retrievedDocuments = {};
  if (Package.reload) {
    var Reload = Package.reload.Reload;
    self.retrievedDocuments = Reload._migrationData(migrationName) || {};
    Reload._onMigrate(migrationName, function () { 
      return [true, self._retrieveRegisteredDocuments()];
    });
  }
};

Migration.prototype.getDocument = function (formId) {
  var self = this;
  if (! _.has(self.retrievedDocuments, formId))
    return false; 
  else
    return self.retrievedDocuments[formId];
};

Migration.prototype.saveDocument = function (formId) {
  this.retrievedDocuments[formId] = this.registerForms[formId]();
}

Migration.prototype.registerForm = function (formId, retrieveFunc) {
  this.registerForms[formId] = retrieveFunc;
};

Migration.prototype.unregisterForm = function (formId) {
  delete this.registerForms[formId];
};

Migration.prototype._retrieveRegisteredDocuments = function () {
  res = {};
  _.each(this.registerForms, function (retrieveFunc, formId) {
    res[formId] = retrieveFunc();
  });
  return res;
};
