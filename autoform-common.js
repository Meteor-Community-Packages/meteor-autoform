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
        default: self._simpleSchema.newContext()
    };
    //store a generic validation context
    self._validationContext = "default";
};

AutoForm.prototype.currentContext = function(name) {
    var self = this;
    if (name) {
        //set current context, creating it first if necessary
        self._validationContexts[name] = self._validationContexts[name] || self._simpleSchema.newContext();
        self._validationContext = name;
    } else {
        //get current context
        return self._validationContext;
    }
};

AutoForm.prototype.namedContext = function(name) {
    var self = this;
    self._validationContexts[name] = self._validationContexts[name] || self._simpleSchema.newContext();
    return self._validationContexts[name];
};

AutoForm.prototype.ensureContext = function(name) {
    var self = this;
    self._validationContexts[name] = self._validationContexts[name] || self._simpleSchema.newContext();
};

AutoForm.prototype.validate = function(doc, isModifier) {
    var self = this, schema = self._simpleSchema;

    //clean doc
    doc = schema.clean(doc);
    //validate doc
    self._validationContexts[self._validationContext].validate(doc, {modifier: isModifier});

    return self._validationContexts[self._validationContext].isValid();
};

AutoForm.prototype.validateOne = function(doc, keyName, isModifier) {
    var self = this, schema = self._simpleSchema;

    //clean doc
    doc = schema.clean(doc);
    //validate doc
    self._validationContexts[self._validationContext].validateOne(doc, keyName, {modifier: isModifier});

    return !self._validationContexts[self._validationContext].keyIsInvalid(keyName);
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