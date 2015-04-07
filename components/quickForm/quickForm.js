/* global AutoForm */

Template.quickForm.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('quickForm', this.template);
  },
  fieldsets: function () {

    // get schema
    var schema = eval(this.collection).simpleSchema()._schema;

    // get list of unique field groups with any falsy values removed
    var fieldsets = _.compact(_.unique(_.map(schema, function (property, key) {
      return property.autoform && property.autoform.group;
    })));

    // build fieldsets array
    var fieldsets = _.map(fieldsets, function (property, key) {

      var fieldsetName = property;

      // for each fieldset, get list of field names
      var fieldsForFieldset = _.compact(_.map(schema, function (property, key) {
        return property.autoform && property.autoform.group && property.autoform.group === fieldsetName && key;
      }));

      return {
        name: fieldsetName,
        fields: fieldsForFieldset
      };
    });
    
    return fieldsets;
  },
  fieldsWithNoFieldsets: function () {
    // get schema
    var schema = eval(this.collection).simpleSchema()._schema;
    var fieldsWithNoFieldset = _.compact(_.map(schema, function (property, key) {
      return (!property.autoform || !property.autoform.group) && key;
    }));
    return {fields: fieldsWithNoFieldset};
  },
  innerContext: function quickFormContext() {
    var atts = Template.parentData(1);

    // get "fields" list from current fieldset
    atts.fields = this.fields;

    // Pass along quickForm context to autoForm context, minus a few
    // properties that are specific to quickForms.
    var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

    // Determine whether we want to render a submit button
    var qfShouldRenderButton = (atts.buttonContent !== false && atts.type !== "readonly" && atts.type !== "disabled");

    var context = {
      qfAutoFormContext: qfAutoFormContext,
      atts: atts,
      qfShouldRenderButton: qfShouldRenderButton
    };
    return context;
  }
});
