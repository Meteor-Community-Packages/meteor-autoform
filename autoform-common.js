//define AutoForm object; used for forms that are not related to collections

//exported
AutoForm = function(schema) {
    var self = this;
    if (schema instanceof SimpleSchema) {
        self._simpleSchema = schema;
    } else {
        self._simpleSchema = new SimpleSchema(schema);
    }
};

AutoForm.prototype.validate = function(doc) {
    var self = this, schema = self._simpleSchema;

    //clean doc
    doc = schema.filter(doc);
    doc = schema.autoTypeConvert(doc);
    //validate doc
    schema.validate(doc);

    return schema.valid();
};

AutoForm.prototype.validateOne = function(doc, keyName) {
    var self = this, schema = self._simpleSchema;

    //clean doc
    doc = schema.filter(doc);
    doc = schema.autoTypeConvert(doc);
    //validate doc
    schema.validateOne(doc, keyName);

    return !schema.keyIsInvalid(keyName);
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

    Meteor.Collection2.prototype.validate = function(doc) {
        var self = this, schema = self._simpleSchema;

        //clean doc
        doc = schema.filter(doc);
        doc = schema.autoTypeConvert(doc);
        //validate doc
        schema.validate(doc);

        return schema.valid();
    };

    Meteor.Collection2.prototype.validateOne = function(doc, keyName) {
        var self = this, schema = self._simpleSchema;

        //clean doc
        doc = schema.filter(doc);
        doc = schema.autoTypeConvert(doc);
        //validate doc
        schema.validateOne(doc, keyName);

        return !schema.keyIsInvalid(keyName);
    };
}