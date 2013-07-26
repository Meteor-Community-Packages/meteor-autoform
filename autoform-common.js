//define AutoForm object; used for forms that are not related to collections

// @export AutoForm
AutoForm = function(schema) {
    var self = this;
    self._simpleSchema = new SimpleSchema(schema);
};

_.extend(AutoForm.prototype, {
    validate: function(doc) {
        var self = this, schema = self._simpleSchema;

        //clean doc
        doc = schema.filter(doc);
        doc = schema.autoTypeConvert(doc);
        //validate doc
        schema.validate(doc);

        return schema.valid();
    },
    simpleSchema: function() {
        return this._simpleSchema;
    }
});