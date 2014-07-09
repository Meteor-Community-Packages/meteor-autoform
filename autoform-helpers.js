/*
 * afFieldMessage
 */
UI.registerHelper('afFieldMessage', function autoFormFieldMessage(options) {
  //help users transition from positional name arg
  if (typeof options === "string") {
    throw new Error('Use the new syntax {{afFieldMessage name="name"}} rather than {{afFieldMessage "name"}}');
  }

  options = parseOptions(options, this, 'afFieldMessage');

  return options.ss.namedContext(options.formId).keyErrorMessage(options.name);
});

/*
 * afFieldIsInvalid
 */
UI.registerHelper('afFieldIsInvalid', function autoFormFieldIsInvalid(options) {
  //help users transition from positional name arg
  if (typeof options === "string") {
    throw new Error('Use the new syntax {{#if afFieldIsInvalid name="name"}} rather than {{#if afFieldIsInvalid "name"}}');
  }

  options = parseOptions(options, this, 'afFieldIsInvalid');

  return options.ss.namedContext(options.formId).keyIsInvalid(options.name);
});

/*
 * afArrayFieldHasMoreThanMinimum
 */
UI.registerHelper('afArrayFieldHasMoreThanMinimum', function autoFormArrayFieldHasMoreThanMinimum(options) {
  options = parseOptions(options, this, 'afArrayFieldHasMoreThanMinimum');

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(options.formId, options.name);
  return (visibleCount > range.minCount);
});

/*
 * afArrayFieldHasLessThanMaximum
 */
UI.registerHelper('afArrayFieldHasLessThanMaximum', function autoFormArrayFieldHasLessThanMaximum(options) {
  options = parseOptions(options, this, 'afArrayFieldHasLessThanMaximum');

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(options.formId, options.name);
  return (visibleCount < range.maxCount);
});

/*
 * afFieldValueIs
 */
UI.registerHelper('afFieldValueIs', function autoFormFieldValueIs(options) {
  options = parseOptions(options, this, 'afFieldValueIs');

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
 * afArrayFieldShowAdd
 */
UI.registerHelper('afArrayFieldShowAdd', function autoFormArrayFieldShowAdd(type) {
  var context = this;
  var last =  arrayTracker.isLastFieldlVisible(context.formId, context.arrayFieldName, context.index);
  if (!last) return (type == 'btn') ? 'invisible' : '';
  
  var range = arrayTracker.getMinMax(formData[context.formId].ss, context.arrayFieldName, context.minCount, context.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(context.formId, context.arrayFieldName);
  if (visibleCount < range.maxCount){
    return '';
  }else{
    return (type == 'btn') ? 'disabled' : 'Max Limit Reached';
  }
});

/*
 * afArrayFieldShowRemove
 */
UI.registerHelper('afArrayFieldShowRemove', function autoFormArrayFieldShowRemove(type) {
  var context = this;
  var range = arrayTracker.getMinMax(formData[context.formId].ss, context.arrayFieldName, context.minCount, context.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(context.formId, context.arrayFieldName);
  if (visibleCount > range.minCount){
    return '';
  }else{
    return (type == 'btn') ? 'disabled' : 'Min Limit Reached';
  }
});

/*
 * afIsEmpty
 */
UI.registerHelper('afArrayFieldIsEmpty', function autoFormArrayFieldIsEmpty(options) {
  options = parseOptions(options, this, 'afIsEmpty');
  return arrayTracker.getVisibleCount(options.formId, options.name) === 0;
});

/*
 * afFieldValueContains
 */
UI.registerHelper('afFieldValueContains', function autoFormFieldValueContains(options) {
  options = parseOptions(options, this, 'afFieldValueContains');

  var currentValue = AutoForm.getFieldValue(options.formId, options.name);
  return _.isArray(currentValue) && _.contains(currentValue, options.value);
});

/*
 * afFieldLabelText
 */
UI.registerHelper('afFieldLabelText', function autoFormFieldLabelText(options) {
  options = parseOptions(options, this, 'afFieldLabelText');

  return options.ss.label(options.name);
});

/*
 * afFieldNames
 */
UI.registerHelper("afFieldNames", function autoFormFieldNames(options) {
  options = parseOptions(options, this, 'afFieldNames');
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
    fieldList = ss.firstLevelSchemaKeys() || [];
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

UI.registerHelper('_af_findAutoForm', function afFindAutoForm(name) {
  var afContext, i = 1;

  do {
    afContext = arguments[i];
    i++;
  } while (afContext && !afContext._af);

  if (!afContext)
    throw new Error(name + " must be used within an autoForm block");

  return afContext;
});

function parseOptions(options, self, helperName) {
  var hash = (options || {}).hash || {};
  // Find the autoform context
  var afContext = hash.autoform && hash.autoform._af || self && self._af || self && self.autoform && self.autoform._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error(helperName + " helper must be used within an autoForm block");
  }

  hash.name && Utility.getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return _.extend({}, afContext, hash);
}