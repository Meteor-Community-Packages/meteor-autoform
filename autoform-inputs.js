/* global AutoForm */
import { Utility } from './utility'

/**
 * Creates a flat document that contains all field values as key/value pair, where key = fieldname and value = the
 * field's current input value.
 * @param fields {jQueryObjectList} A current jQuery-Object list, that allows to iterate over each element.
 * @param ss {SimpleSchema} The current SimpleSchema instance for the form, related to the fields.
 * @returns {Object} The document Object with key/value-paired fields.
 */
export const getFlatDocOfFieldValues = function getFlatDocOfFieldValues(fields, ss) {
  const doc = {};
  fields.each(function() {
    let fieldName;
    const val = AutoForm.getInputValue(this, ss);
    if (val !== void 0) {
      // Get the field/schema key name
      fieldName = $(this).attr("data-schema-key");
      doc[fieldName] = val;
    }
  });
  return doc;
};

/*
 * package scope functions
 */

/**
 * Gets the value that should be shown/selected in the input. Returns
 * a string, a boolean, or an array of strings. The value used,
 * in order of preference, is one of:
 * - The `value` attribute provided
 * - The value that is set in the `doc` provided on the containing autoForm
 * - The `defaultValue` from the schema
 * @param atts {Object} The current field attributes
 * @param value {*} The current value of the field, can be anything
 * @param mDoc {Object} The current doc, wrapped by MongoObject
 * @param schemaDefaultValue {*} The defaultValue as defined in the schema
 * @param fieldDefaultValue {*} The defaultValue as defined on the field level
 * @param typeDefs {Object} The type definitions that are used when an input is registered (valueIn, valueIsArray etc.)
 * @returns {*} The (maybe transformed) input value.
 */
export const getInputValue = function getInputValue(
  atts,
  value,
  mDoc,
  schemaDefaultValue,
  fieldDefaultValue,
  typeDefs
) {
  if (typeof value === "undefined") {
    // Get the value for this key in the current document
    if (mDoc) {
      const valueInfo = mDoc.getInfoForKey(atts.name);
      if (valueInfo) {
        value = valueInfo.value;
      } else {
        value = fieldDefaultValue;
      }
    }

    // Only if there is no current document, use the schema defaultValue
    else {
      // Use the field default value if provided
      if (typeof fieldDefaultValue !== "undefined") {
        value = fieldDefaultValue;
      }
      // Or use the defaultValue in the schema
      else {
        value = schemaDefaultValue;
      }
    }
  }

  // Change null or undefined to an empty string
  value = value === null || value === void 0 ? "" : value;

  // If the component expects the value to be an array, and it's not, make it one
  if (typeDefs.valueIsArray && !Array.isArray(value)) {
    if (typeof value === "string") {
      value = value.split(",");
    } else {
      value = [value];
    }
  }

  // At this point we have a value or an array of values.
  // Run through the components valueIn function if we have one.
  // It should then be in whatever format the component expects.
  if (typeof typeDefs.valueIn === "function") {
    value = typeDefs.valueIn(value, atts);
  }

  return value;
};

/**
 * Builds the data context that the input component will have. Not reactive.
 * @param defs {Object} The field definitions
 * @param hash {Object} The field attributes
 * @param value {*} The value of the input, can be many types
 * @param label {String} The label to be displayed
 * @param formType {String} the type of the form (insert, update, normal, method etc.)
 * @example
 * const iData = getInputData(defs, atts, value, ss.label(c.atts.name), form.type);
 */
export const getInputData = function getInputData(defs, hash, value, label, formType) {
  /*
   * Get HTML attributes
   */

  // We don't want to alter the original hash, so we clone it and
  // remove some stuff that should not be HTML attributes.
  const {
    type,
    value: hashValue,
    noselect,
    options,
    template,
    defaultValue,
    data,
    ...inputAtts
  } = hash;

  // Add required if required
  if (typeof inputAtts.required === "undefined" && !defs.optional) {
    inputAtts.required = "";
  }

  // Add data-schema-key to every type of element
  inputAtts["data-schema-key"] = inputAtts.name;

  // Set placeholder to label from schema if requested.
  // We check hash.placeholder instead of inputAtts.placeholder because
  // we're setting inputAtts.placeholder, so it wouldn't be the same on
  // subsequent reactive runs of this function.
  if (hash.placeholder === "schemaLabel") {
    inputAtts.placeholder = label;
  }

  // To enable reactively toggling boolean attributes
  // in a simple way, we add the attributes to the HTML
  // only if their value is `true`. That is, unlike in
  // HTML, their mere presence does not matter.
  ["disabled", "readonly", "checked", "required", "autofocus"].forEach(function(
    booleanProp
  ) {
    if (!(booleanProp in hash)) {
      return;
    }

    // For historical reasons, we treat the string "true" and an empty string as `true`, too.
    // But an empty string value results in the cleanest rendered output for boolean props,
    // so we standardize as that.
    if (
      hash[booleanProp] === true ||
      hash[booleanProp] === "true" ||
      hash[booleanProp] === ""
    ) {
      inputAtts[booleanProp] = "";
    } else {
      // If the value is anything else, we don't render it
      delete inputAtts[booleanProp];
    }
  });

  /*
   * Set up the context. This is the object that becomes `this` in the
   * input type template.
   */

  const inputTypeContext = {
    name: inputAtts.name,
    schemaType: defs.type,
    min: defs.min,
    max: defs.max,
    value: value,
    atts: inputAtts,
    selectOptions: AutoForm.Utility.getSelectOptions(defs, hash)
  };

  /*
   * Merge data property from the field schema with the context.
   * We do not want these turned into HTML attributes.
   */
  if (hash.data) Object.assign(inputTypeContext, hash.data);

  // Before returning the context, we allow the registered form type to
  // adjust it if necessary.
  const ftd = Utility.getFormTypeDef(formType);
  if (typeof ftd.adjustInputContext === "function") {
    return ftd.adjustInputContext(inputTypeContext);
  }

  return inputTypeContext;
};

/**
 * @private Throttle factory-function - specific to markChanged. Timeouts are related to the respective fieldName.
 * @param fn {Function} The markChanged function to be passed
 * @param limit {Number} The throttle limit in ms
 * @return {Function} The throttled markChanged function
 */
function markChangedThrottle(fn, limit) {
  let timeouts = {};
  return function(template, fieldName, fieldValue) {
    clearTimeout(timeouts[fieldName]);
    timeouts[fieldName] = setTimeout(function() {
      fn(template, fieldName, fieldValue);
    }, limit);
  };
}

/**
 * @private If the given field is a subfield within an array (fieldName = something.$) then this
 * ensures, that the ancestor (something) is marked changed, too.
 * @param template
 * @param fieldName
 */
const markChangedAncestors = (template, fieldName) => {
  // To properly handle array fields, we'll mark the ancestors as changed, too
  // FIX THIS
  // XXX Might be a more elegant way to handle this

  const dotPos = fieldName.lastIndexOf(".");
  if (dotPos === -1) return;
  const ancestorFieldName = fieldName.slice(0, dotPos);
  doMarkChanged(template, ancestorFieldName);
};

/**
 * @private Checks, whether a Template can be considered as rendered.
 * @param template
 * @return {*|{}|boolean} truthy/falsy value, based on all checked properties
 */
const isRendered = template => template && template.view && template.view._domrange && !template.view.isDestroyed;

/**
 * @private Applies the change marking, creates a new Tracker Dependency if there is none for the field.
 * @param template
 * @param fieldName
 */
const doMarkChanged = (template, fieldName) => {
  if (!template.formValues[fieldName]) {
    template.formValues[fieldName] = new Tracker.Dependency();
  }
  if (isRendered(template)) {
    template.formValues[fieldName].isMarkedChanged = true;
    template.formValues[fieldName].changed();
  }
  markChangedAncestors(template, fieldName);
};

/**
 * Marks a field as changed and updates the Treacker.Dependdency as changed. Reactivity compatible.
 * @param template {Template} The current form template
 * @param fieldName {String} The name of the current field
 * @param fieldValue {*} The current field value
 */
export const markChanged = markChangedThrottle(function _markChanged(
  template,
  fieldName,
  fieldValue
) {
  // is it really changed?
  const { cachedValue } = template.formValues[fieldName] || {};
  if (fieldValue === cachedValue) return;
  // is there really a value??
  if (fieldValue === undefined) return;
  // is the form rendered???

  if (!isRendered(template)) {
    return markChanged(template, fieldName, fieldValue);
  }
  doMarkChanged(template, fieldName);
}, 150);

/**
 * Creates a formValues entry on the template, in case it does not exist yet and updates the given
 * field by fieldName as changed (if ok for update). Reactivity compatible.
 * @see {markChanged}
 * @param template {Template} The current form template
 * @param fieldName {String} The name of the current field
 * @param fieldValue {*} The current field value
 */
export const updateTrackedFieldValue = function updateTrackedFieldValue(
  template,
  fieldName,
  fieldValue
) {
  if (!template) return;

  template.formValues = template.formValues || {};
  if (!template.formValues[fieldName]) {
    template.formValues[fieldName] = new Tracker.Dependency();
  }

  markChanged(template, fieldName, fieldValue);
};

/**
 * Calls {updateTrackedFieldValue} on all fields it can find in template.formValues. Reactivity compatible.
 * @see {updateTrackedFieldValue}
 * @param template {Template} The current form template
 */
export const updateAllTrackedFieldValues = function updateAllTrackedFieldValues(template) {
  if (template && template.formValues) {
    Object.keys(template.formValues).forEach(function(fieldName) {
      // XXX - if we would not pass a fieldValue here, then there would be none of the fields marked as
      // XXX - changed when the 'reset form'  event is running. We use a random number in order to prevent
      // XXX - the chance of collision with the cachedValue.
      updateTrackedFieldValue(template, fieldName, Math.random());
    });
  }
};

export const getAllFieldsInForm = function getAllFieldsInForm(template, disabled = false) {
  // Get all elements with `data-schema-key` attribute, unless disabled
  const formId = template.data.id;
  const allFields = template.$("[data-schema-key]").filter(function() {
    const fieldForm = $(this)
      .closest("form")
      .attr("id");
    return fieldForm === formId;
  });
  return disabled ? allFields : allFields.not("[disabled]");
  // Exclude fields in sub-forms, since they will belong to a different AutoForm and schema.
  // TODO need some selector/filter that actually works correctly for excluding subforms
  // return template.$('[data-schema-key]').not("[disabled]").not(template.$('form form [data-schema-key]'));
};
