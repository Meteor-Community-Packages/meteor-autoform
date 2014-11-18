// Global template helpers (exported)

var regHelper = Template.registerHelper;
if (typeof regHelper !== "function") {
  regHelper = UI.registerHelper;
}

/*
 * afFieldMessage
 */
regHelper('afFieldMessage', function autoFormFieldMessage(options) {
  options = parseOptions(options, 'afFieldMessage');

  return options.ss.namedContext(options.formId).keyErrorMessage(options.name);
});

/*
 * afFieldIsInvalid
 */
regHelper('afFieldIsInvalid', function autoFormFieldIsInvalid(options) {
  options = parseOptions(options, 'afFieldIsInvalid');

  return options.ss.namedContext(options.formId).keyIsInvalid(options.name);
});

/*
 * afArrayFieldHasMoreThanMinimum
 */
regHelper('afArrayFieldHasMoreThanMinimum', function autoFormArrayFieldHasMoreThanMinimum(options) {
  options = parseOptions(options, 'afArrayFieldHasMoreThanMinimum');

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(options.formId, options.name);
  return (visibleCount > range.minCount);
});

/*
 * afArrayFieldHasLessThanMaximum
 */
regHelper('afArrayFieldHasLessThanMaximum', function autoFormArrayFieldHasLessThanMaximum(options) {
  options = parseOptions(options, 'afArrayFieldHasLessThanMaximum');

  var range = arrayTracker.getMinMax(options.ss, options.name, options.minCount, options.maxCount);
  var visibleCount = arrayTracker.getVisibleCount(options.formId, options.name);
  return (visibleCount < range.maxCount);
});

/*
 * afFieldValueIs
 */
regHelper('afFieldValueIs', function autoFormFieldValueIs(options) {
  options = parseOptions(options, 'afFieldValueIs');

  var currentValue = AutoForm.getFieldValue(options.formId, options.name);
  return currentValue === options.value;
});

/*
 * afArrayFieldIsFirstVisible
 */
regHelper('afArrayFieldIsFirstVisible', function autoFormArrayFieldIsFirstVisible() {
  var context = this;
  return arrayTracker.isFirstFieldlVisible(context.formId, context.arrayFieldName, context.index);
});

/*
 * afArrayFieldIsLastVisible
 */
regHelper('afArrayFieldIsLastVisible', function autoFormArrayFieldIsLastVisible() {
  var context = this;
  return arrayTracker.isLastFieldlVisible(context.formId, context.arrayFieldName, context.index);
});

/*
 * afFieldValueContains
 */
regHelper('afFieldValueContains', function autoFormFieldValueContains(options) {
  options = parseOptions(options, 'afFieldValueContains');

  var currentValue = AutoForm.getFieldValue(options.formId, options.name);
  return _.isArray(currentValue) && _.contains(currentValue, options.value);
});

/*
 * afFieldLabelText
 */
regHelper('afFieldLabelText', function autoFormFieldLabelText(options) {
  options = parseOptions(options, 'afFieldLabelText');

  if (SimpleSchema._makeGeneric(options.name).slice(-1) === "$") {
    // for array items we don't want to inflect the label because
    // we will end up with a number
    var label = options.ss.label(options.name);
    if (!isNaN(parseInt(label, 10))) {
      return null;
    } else {
      return label;
    }
  } else {
    return options.ss.label(options.name);
  }
});

/*
 * afFieldNames
 */
regHelper("afFieldNames", function autoFormFieldNames(options) {
  options = parseOptions(options, 'afFieldNames');
  var ss = options.ss, name = options.name, namePlusDot, genericName, genericNamePlusDot;

  if (name) {
    namePlusDot = name + ".";
    genericName = SimpleSchema._makeGeneric(name);
    genericNamePlusDot = genericName + ".";
  }

  // Get the list of fields we want included
  var fieldList = options.fields || AutoForm.findAttribute("fields");
  if (fieldList) {
    fieldList = AutoForm.Utility.stringToArray(fieldList, 'AutoForm: fields attribute must be an array or a string containing a comma-delimited list of fields');

    // Take only those fields in the fieldList that are descendants of the `name` field
    if (name) {
      // Replace generic name with real name. We assume that field names
      // with $ apply to all array items. Field list will not have the
      // correct array field item number instead of $.
      if (genericName !== name) {
        fieldList = _.map(fieldList, function (field) {
          if (field.indexOf(genericNamePlusDot) === 0) {
            return namePlusDot + field.slice(genericNamePlusDot.length);
          }
          return field;
        });
      }

      fieldList = _.filter(fieldList, function filterFieldsByName(field) {
        return field.indexOf(namePlusDot) === 0;
      });
    }

    // If top level fields, be sure to remove any with $ in them
    else {
      fieldList = _.filter(fieldList, function filterFieldsByName(field) {
        return (field.slice(-2) !== '.$' && field.indexOf('.$.') === -1);
      });
    }

    // First we filter out any fields that are subobjects where the
    // parent object is also in the fieldList and is NOT the current
    // field name.
    // This means that if you do `fields="address,address.city"` we
    // will use an afObjectField for address and include only the
    // "city" field within that, but if you instead do `fields="address.city"`
    // we will use a single field for the city, with no afObjectField
    // template around it.
    fieldList = _.reject(fieldList, function (field) {
      var lastDotPos = field.lastIndexOf(".");
      if (lastDotPos === -1) {
        return false; //keep
      }

      var parentField = field.slice(0, lastDotPos);
      if (parentField.slice(-2) === ".$") {
        parentField = parentField.slice(0, -2);
      }
      return _.contains(fieldList, parentField) && parentField !== name && parentField !== genericName;
    });
  }

  if (!fieldList || fieldList.length === 0) {
    // Get list of field names that are descendants of this field's name.
    // If name/genericName is undefined, this will return top-level
    // schema keys.
    fieldList = ss.objectKeys(genericName);

    if (name) {
      // Tack child field name on to end of parent field name. This
      // ensures that we keep the desired array index for array items.
      fieldList = _.map(fieldList, function (field) {
        return name + "." + field;
      });
    }
  }

  // If user wants to omit some fields, remove those from the array
  var omitFields = options.omitFields || AutoForm.findAttribute("omitFields");
  if (omitFields) {
    omitFields = AutoForm.Utility.stringToArray(omitFields, 'AutoForm: omitFields attribute must be an array or a string containing a comma-delimited list of fields');
    fieldList = _.difference(fieldList, omitFields);
    // If omitFields contains generic field names (with $) we omit those too
    fieldList = _.reject(fieldList, function (f) {
      return _.contains(omitFields, SimpleSchema._makeGeneric(f));
    });
  }

  // Filter out fields we never want
  fieldList = _.filter(fieldList, function shouldIncludeField(field) {
    var fieldDefs = ss.schema(field);

    // Don't include fields with autoform.omit=true
    if (fieldDefs.autoform && fieldDefs.autoform.omit === true)
      return false;

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
 * afTemplateName
 *
 * Returns the full template name. In the simplest scenario, this is templateType_templateName
 * as passed in. However, if templateName is not provided, it is looked up in the following
 * manner:
 *
 * 1. autoform.<componentType>.template from the schema (field+type override for all forms)
 * 2. autoform.template from the schema (field override for all forms)
 * 3. template-<componentType> attribute on an ancestor component within the same form (form+type for all fields)
 * 4. template attribute on an ancestor component within the same form (form specificity for all types and fields)
 * 5. Default template for component type, as set by AutoForm.setDefaultTemplateForType
 * 6. Default template, as set by AutoForm.setDefaultTemplate.
 * 7. Built-in default template, currently bootstrap-3.
 */
regHelper('afTemplateName', function afTemplateNameHelper(templateType, templateName) {
  var self = this, result, schemaAutoFormDefs, templateFromAncestor, defaultTemplate;

  var result = templateType + '_' + templateName; // templateName might be undefined, but the result will be the same
  if (Template[result]) {
    return result;
  }

  // If the attributes provided a templateName but that template didn't exist, show a warning
  if (templateName && AutoForm._debug) {
    console.warn(templateType + ': "' + templateName + '" is not a valid template name. Falling back to a different template.');
  }

  // Get `autoform` object from the schema, if present.
  // Skip for quickForm because it renders a form and not a field.
  if (templateType !== 'quickForm' && self.atts && self.atts.name) {
    schemaAutoFormDefs = AutoForm.getSchemaForField(self.atts.name).autoform;
  }

  // Fallback #1: autoform.<componentType>.template from the schema
  if (schemaAutoFormDefs && schemaAutoFormDefs[templateType] && schemaAutoFormDefs[templateType].template && Template[templateType + '_' + schemaAutoFormDefs[templateType].template]) {
    return templateType + '_' + schemaAutoFormDefs[templateType].template;
  }

  // Fallback #2: autoform.template from the schema
  if (schemaAutoFormDefs && schemaAutoFormDefs.template && Template[templateType + '_' + schemaAutoFormDefs.template]) {
    return templateType + '_' + schemaAutoFormDefs.template;
  }

  // Fallback #3: template-<componentType> attribute on an ancestor component within the same form
  templateFromAncestor = AutoForm.findAttribute("template-" + templateType);
  if (templateFromAncestor && Template[templateType + '_' + templateFromAncestor]) {
    return templateType + '_' + templateFromAncestor;
  }

  // Fallback #4: template attribute on an ancestor component within the same form
  templateFromAncestor = AutoForm.findAttribute("template");
  if (templateFromAncestor && Template[templateType + '_' + templateFromAncestor]) {
    return templateType + '_' + templateFromAncestor;
  }

  // Fallback #5: Default template for component type, as set by AutoForm.setDefaultTemplateForType
  defaultTemplate = AutoForm.getDefaultTemplateForType(templateType);
  if (defaultTemplate && Template[templateType + '_' + defaultTemplate]) {
    return templateType + '_' + defaultTemplate;
  }

  // Fallback #6: Default template, as set by AutoForm.setDefaultTemplate
  defaultTemplate = AutoForm.getDefaultTemplate();
  if (defaultTemplate && Template[templateType + '_' + defaultTemplate]) {
    return templateType + '_' + defaultTemplate;
  }

  // Fallback #7: hard-coded default
  return "bootstrap3";
});

/*
 * PRIVATE
 */

function parseOptions(options, helperName) {
  var hash = (options || {}).hash || {};
  // Find the autoform context
  var afContext = AutoForm.find(helperName);
  // Call getDefs for side effect of throwing errors when name is not in schema
  hash.name && AutoForm.Utility.getDefs(afContext.ss, hash.name);
  return _.extend({}, afContext, hash);
}
