//define AutoForm object; used for forms that are not related to collections

//exported
AutoForm = function(schema) {
    var self = this;
    if (schema instanceof SimpleSchema) {
        self._simpleSchema = schema;
    } else {
        self._simpleSchema = new SimpleSchema(schema);
    }
    self._validationContexts = {
        "default": self._simpleSchema.newContext()
    };
};

AutoForm.prototype.namedContext = function(name) {
    var self = this;
    ensureContext(self, name);
    return self._validationContexts[name];
};

AutoForm.prototype.validate = function(doc, options) {
    var self = this, schema = self._simpleSchema;
    
    //figure out the validation context name and make sure it exists
    var context = _.isObject(options) && typeof options.validationContext === "string" ? options.validationContext : "default";
    ensureContext(self, context);
    
    //clean doc
    doc = schema.clean(doc);
    //validate doc
    self._validationContexts[context].validate(doc, options);

    return self._validationContexts[context].isValid();
};

AutoForm.prototype.validateOne = function(doc, keyName, options) {
    var self = this, schema = self._simpleSchema;
    
    //figure out the validation context name and make sure it exists
    var context = _.isObject(options) && typeof options.validationContext === "string" ? options.validationContext : "default";
    ensureContext(self, context);
    
    //clean doc
    doc = schema.clean(doc);
    //validate doc
    self._validationContexts[context].validateOne(doc, keyName, options);

    return !self._validationContexts[context].keyIsInvalid(keyName);
};

AutoForm.prototype.simpleSchema = function() {
    return this._simpleSchema;
};

AutoForm.prototype.callbacks = function(cb) {
    this._callbacks = cb;
};

//add callbacks() method to Meteor.Collection2
if (typeof Meteor.Collection2 !== 'undefined') {
    Meteor.Collection2.prototype.callbacks = function(cb) {
        this._callbacks = cb;
    };
}

//Private Methods

var ensureContext = function(af, name) {
    af._validationContexts[name] = af._validationContexts[name] || af._simpleSchema.newContext();
};