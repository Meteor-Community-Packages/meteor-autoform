/*
 * afFieldMessage
 */
UI.registerHelper('afFieldMessage', function autoFormFieldMessage(options) {
  options = parseOptions(options, 'afFieldMessage');

  return options.ss.namedContext(options.formId).keyErrorMessage(options.name);
});

/*
 * afFieldIsInvalid
 */
UI.registerHelper('afFieldIsInvalid', function autoFormFieldIsInvalid(options) {
  options = parseOptions(options, 'afFieldIsInvalid');

  return options.ss.namedContext(options.formId).keyIsInvalid(options.name);
});

/*
 * afArrayFieldHasMoreThanMinimum
 */
UI.registerHelper('afArrayFieldHasMoreThanMinimum', function autoFormArrayFieldHasMoreThanMinimum(options) {
  options = parseOptions(options, 'afArrayFieldHasMoreThanMinimum');

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(options.formId, options.name);
  return (visibleCount > range.minCount);
});

/*
 * afArrayFieldHasLessThanMaximum
 */
UI.registerHelper('afArrayFieldHasLessThanMaximum', function autoFormArrayFieldHasLessThanMaximum(options) {
  options = parseOptions(options, 'afArrayFieldHasLessThanMaximum');

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(options.formId, options.name);
  return (visibleCount < range.maxCount);
});

/*
 * afFieldValueIs
 */
UI.registerHelper('afFieldValueIs', function autoFormFieldValueIs(options) {
  options = parseOptions(options, 'afFieldValueIs');

  var currentValue = AutoForm.getFieldValue(options.formId, options.name);
  return currentValue === options.value;
});

/*
 * afArrayFieldIsFirstVisible
 */
UI.registerHelper('afArrayFieldIsFirstVisible', function autoFormArrayFieldIsFirstVisible() {
  var context = this;
  return arrayTracker.isFirstFieldlVisible(context.formId, context.arrayFieldName, context.index);
});

/*
 * afArrayFieldIsLastVisible
 */
UI.registerHelper('afArrayFieldIsLastVisible', function autoFormArrayFieldIsLastVisible() {
  var context = this;
  return arrayTracker.isLastFieldlVisible(context.formId, context.arrayFieldName, context.index);
});

/*
 * afFieldValueContains
 */
UI.registerHelper('afFieldValueContains', function autoFormFieldValueContains(options) {
  options = parseOptions(options, 'afFieldValueContains');

  var currentValue = AutoForm.getFieldValue(options.formId, options.name);
  return _.isArray(currentValue) && _.contains(currentValue, options.value);
});

/*
 * afFieldLabelText
 */
UI.registerHelper('afFieldLabelText', function autoFormFieldLabelText(options) {
  options = parseOptions(options, 'afFieldLabelText');

  return options.ss.label(options.name);
});

/*
 * afFieldNames
 */
UI.registerHelper("afFieldNames", function autoFormFieldNames(options) {
  options = parseOptions(options, 'afFieldNames');
  var ss = options.ss;
  var name = options.name;

  // Get the list of fields we want included
  var fieldList = options.fields;
  if (fieldList) {
    fieldList = Utility.stringToArray(fieldList, 'AutoForm: fields attribute must be an array or a string containing a comma-delimited list of fields');
  } else if (name) {
    // If we weren't given a fieldList but were given a field name, use subfields by default
    
    // Get list of field names that are descendants of this field's name
    fieldList = autoFormChildKeys(ss, name);

    // Tack child field name on to end of parent field name. This
    // ensures that we keep the desired array index for array items.
    fieldList = _.map(fieldList, function (field) {
      return name + "." + field;
    });
  } else {
    // If we weren't given a fieldList or a field name, use all first level schema keys by default
    fieldList = ss.objectKeys() || [];
  }

  // If user wants to omit some fields, remove those from the array
  var omitFields = options.omitFields;
  if (omitFields) {
    omitFields = Utility.stringToArray(omitFields, 'AutoForm: omitFields attribute must be an array or a string containing a comma-delimited list of fields');
    fieldList = _.difference(fieldList, omitFields);
    // If omitFields contains generic field names (with $) we omit those too
    fieldList = _.reject(fieldList, function (f) {
      return _.contains(omitFields, SimpleSchema._makeGeneric(f));
    });
  }

  // Filter out fields we never want
  fieldList = _.filter(fieldList, function shouldIncludeField(field) {
    var fieldDefs = ss.schema(field);

    // Don't include fields with denyInsert=true when it's an insert form
    if (fieldDefs.denyInsert && options.submitType === "insert")
      return false;

    // Don't include fields with denyUpdate=true when it's an update form
    if (fieldDefs.denyUpdate && options.submitType === "update")
      return false;

    return true;
  });

  // Ensure fields are not added more than once
  fieldList = _.unique(fieldList);

  return fieldList;
});

/*
 * PRIVATE
 */

function parseOptions(options, helperName) {
  var hash = (options || {}).hash || {};
  // Find the autoform context
  var afContext = AutoForm.find(helperName);
  // Call getDefs for side effect of throwing errors when name is not in schema
  hash.name && Utility.getDefs(afContext.ss, hash.name);
  return _.extend({}, afContext, hash);
}