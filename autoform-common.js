//define AutoForm object; used for forms that are not related to collections

// @export AutoForm
AutoForm = function(schema) {
    var self = this;
    //public properties
    self.invalidFields = [];
    self.deps = {};
    //set up validation dependencies
    var fieldNames = _.keys(schema);
    _.each(fieldNames, function(name) {
        self.deps[name] = new Deps.Dependency;
    });
    //private properties
    self._schema = schema;
    self._simpleSchema = new SimpleSchema(schema);
};

_.extend(AutoForm.prototype, {
    validate: function(doc) {
        var self = this,
                schema = self._simpleSchema,
                addedFields = [],
                removedFields = [],
                changedFields = [];

        //whitelist
        doc = schema.filter(doc);
        doc = schema.autoTypeConvert(doc);

        //note any currently invalid fields so that we can mark them as changed
        //due to new validation (they may be valid now, or invalid in a different way)
        _.each(self.invalidFields, function(obj) {
            removedFields.push(obj.name);
        });

        //perform validation
        self.invalidFields = schema.validate(doc);

        //add newly invalid fields to changedFields
        _.each(self.invalidFields, function(obj) {
            addedFields.push(obj.name);
        });

        //mark all changed fields as changed
        changedFields = _.union(addedFields, removedFields);
        _.each(changedFields, function(name) {
            self.deps[name].changed();
        });

        return !self.invalidFields.length;
    },
    resetValidation: function() {
        var self = this, removedFields = [];
        _.each(self.invalidFields, function(obj) {
            removedFields.push(obj.name);
        });
        self.invalidFields = [];
        _.each(removedFields, function(name) {
            self.deps[name].changed();
        });
    },
    schema: function(field) {
        if (field) {
            return this._schema[field];
        } else {
            return this._schema;
        }
    },
    simpleSchema: function() {
        return this._simpleSchema;
    }
});