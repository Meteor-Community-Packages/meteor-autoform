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
 * afFieldValueContains
 */
UI.registerHelper('afFieldValueContains', function autoFormFieldValueContains(options) {
  options = parseOptions(options, this, 'afFieldValueContains');

  var currentValue = AutoForm.getFieldValue(options.formId, options.name);
  return _.isArray(currentValue) && _.contains(currentValue, options.value);
});

/*
 * PRIVATE
 */

function parseOptions(options, self, helperName) {
  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || self && self._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error(helperName + " helper must be used within an autoForm block");
  }

  Utility.getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return _.extend({}, afContext, hash);
}