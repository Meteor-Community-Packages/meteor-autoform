/* global AutoForm */

Template.quickForm.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('quickForm', this.template);
  },
  innerContext: function quickFormContext() {
    var atts = this;
    var schema = {};

    // --------------- A. Schema --------------- //

    // get schema
    // note: replace this by a standard function?
    if (atts.schema && atts.schema._schema) {
      schema = atts.schema._schema;
    } else if (atts.collection) {
      if (typeof atts.collection == "String") {
        schema = eval(atts.collection).simpleSchema()._schema;
      } else {
        schema = atts.collection.simpleSchema()._schema;
      }
    }
    
    // if atts.fields exists, transform it into an array
    if (atts.fields) {
      // note: is there a standard function we can use here instead of replace and split?
      atts.fields = atts.fields.replace(" ", "").split(",");

      // restrict the schema to specified fields
      // note: haven't found a clean way to do this all in one go yet, so doing it later in B & C. 
    }

    // --------------- B. Field With Groups --------------- //

    // get list of unique field groups with any falsy values removed
    // note: if atts.fields is specified, only consider fields contained in it
    var fieldGroups = _.compact(_.unique(_.map(schema, function (property, key) {
      return (!atts.fields || _.contains(atts.fields, key)) && property.autoform && property.autoform.group ;
    }))).sort();

    // build fieldGroups array
    fieldGroups = _.map(fieldGroups, function (property, key) {

      var fieldGroupName = property;

      // for each fieldset, get list of field names
      var fieldsForGroup = _.compact(_.map(schema, function (property, key) {
        return property.autoform && property.autoform.group && property.autoform.group === fieldGroupName && key;
      }));

      // copy parent atts over to field group context, while adding "name" and overwriting "fields"
      var fieldGroup = {
        name: fieldGroupName,
        atts: _.clone(atts) // note: clone atts to make sure we don't modify the original
      };
      fieldGroup.atts.fields = fieldsForGroup;

      return fieldGroup;
    });

    // --------------- C. Field With No Groups --------------- //

    // get all fields with no field group specified
    // note: if atts.fields is specified, only consider fields contained in it
    // always omit fields with "$" in their name
    var fieldsWithNoGroupsArray = _.compact(_.map(schema, function (property, key) {
      key = SimpleSchema._makeGeneric(key);
      return key.indexOf("$") == "-1" && (!atts.fields || _.contains(atts.fields, key)) && (!property.autoform || !property.autoform.group) && key;
    }));
    // copy parent atts, and then overwrite "fields" property
    fieldsWithNoGroups = {atts: _.clone(atts)};
    fieldsWithNoGroups.atts.fields = fieldsWithNoGroupsArray;

    // --------------- D. Context --------------- //

    // Pass along quickForm context to autoForm context, minus a few
    // properties that are specific to quickForms.
    var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

    // Determine whether we want to render a submit button
    var qfShouldRenderButton = (atts.buttonContent !== false && atts.type !== "readonly" && atts.type !== "disabled");

    var context = {
      qfAutoFormContext: qfAutoFormContext,
      atts: atts,
      qfShouldRenderButton: qfShouldRenderButton,
      fieldsWithNoGroups: fieldsWithNoGroups,
      fieldGroups: fieldGroups
    };
    return context;
  }
});
