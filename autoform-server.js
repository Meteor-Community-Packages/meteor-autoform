//define AutoForm object; used for forms that are not related to collections

//exported
//DEPRECATED ON SERVER
AutoForm = function(schema) {
  var self = this;
  console.warn("Use of AutoForm objects on the server is deprecated; move your constructor to client-only code");
  if (schema instanceof SimpleSchema) {
    self._simpleSchema = schema;
  } else {
    self._simpleSchema = new SimpleSchema(schema);
  }
};

//DEPRECATED; Use myAutoForm.simpleSchema().namedContext() instead
AutoForm.prototype.namedContext = function(name) {
  console.warn("myAutoForm.namedContext() is deprecated on the server; move to client-only code");
  return this._simpleSchema.namedContext(name);
};

//DEPRECATED; Use myAutoForm.simpleSchema().namedContext().validate() instead
AutoForm.prototype.validate = function(doc, options) {
  options = options || {};
  console.warn("myAutoForm.validate() is deprecated on the server; move to client-only code");
  // Validate doc and return validity
  return this._simpleSchema.namedContext(options.validationContext).validate(doc, options);
};

//DEPRECATED; Use myAutoForm.simpleSchema().namedContext().validateOne() instead
AutoForm.prototype.validateOne = function(doc, keyName, options) {
  options = options || {};
  console.warn("myAutoForm.validateOne() is deprecated on the server; move to client-only code");
  // Validate doc and return validity
  return this._simpleSchema.namedContext(options.validationContext).validateOne(doc, keyName, options);
};

//DEPRECATED ON SERVER
AutoForm.prototype.simpleSchema = function() {
  console.warn("myAutoForm.simpleSchema() is deprecated on the server; move to client-only code");
  return this._simpleSchema;
};

//DEPRECATED ON SERVER
AutoForm.prototype.callbacks = function(cb) {
  console.warn("myAutoForm.callbacks() is deprecated on the server; move to client-only code");
  this._callbacks = cb;
};

//DEPRECATED ON SERVER
if (typeof Meteor.Collection2 !== 'undefined') {
  Meteor.Collection2.prototype.callbacks = function(cb) {
    console.warn("myCollection2.callbacks() is deprecated on the server; move to client-only code");
    this._callbacks = cb;
  };
}