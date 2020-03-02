/* global AutoForm, getInputValue:true, getAllFieldsInForm:true, getInputData:true, updateTrackedFieldValue:true, updateAllTrackedFieldValues:true, getFlatDocOfFieldValues:true */

getFlatDocOfFieldValues = function getFlatDocOfFieldValues(fields, ss) {
  var doc = {};
  fields.each(function() {
    var fieldName,
      val = AutoForm.getInputValue(this, ss);
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

/*
 * Gets the value that should be shown/selected in the input. Returns
 * a string, a boolean, or an array of strings. The value used,
 * in order of preference, is one of:
 * * The `value` attribute provided
 * * The value that is set in the `doc` provided on the containing autoForm
 * * The `defaultValue` from the schema
 */
getInputValue = function getInputValue(
  atts,
  value,
  mDoc,
  schemaDefaultValue,
  fieldDefaultValue,
  typeDefs,
  template
) {
  if (typeof value === "undefined") {
    // Get the value for this key in the current document
    if (mDoc) {
      var valueInfo = mDoc.getInfoForKey(atts.name);
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

/*
 * Builds the data context that the input component will have.
 */
getInputData = function getInputData(defs, hash, value, label, formType) {
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

  var inputTypeContext = {
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
  var ftd = Utility.getFormTypeDef(formType);
  if (typeof ftd.adjustInputContext === "function") {
    inputTypeContext = ftd.adjustInputContext(inputTypeContext);
  }

  return inputTypeContext;
};

function markChangedThrottle(fn, limit) {
  let timeouts = {};
  return function(template, fieldName, fieldValue) {
    clearTimeout(timeouts[fieldName]);
    timeouts[fieldName] = setTimeout(function() {
      fn(template, fieldName, fieldValue);
    }, limit);
  };
}

const markChangedAncestors = (template, fieldName) => {
  // To properly handle array fields, we'll mark the ancestors as changed, too
  // FIX THIS
  // XXX Might be a more elegant way to handle this

  var dotPos = fieldName.lastIndexOf(".");
  if (dotPos == -1) return;
  fieldName = fieldName.slice(0, dotPos);
  doMarkChanged(template, fieldName);
};

const doMarkChanged = (template, fieldName, fieldValue) => {
  if (!template.formValues[fieldName]) {
    template.formValues[fieldName] = new Tracker.Dependency();
  }
  if (
    template &&
    template.view &&
    template.view._domrange &&
    !template.view.isDestroyed
  ) {
    template.formValues[fieldName].isMarkedChanged = true;
    template.formValues[fieldName].changed();
  }
  markChangedAncestors(template, fieldName);
};

export const markChanged = markChangedThrottle(function(
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
  const rendered =
    template &&
    template.view &&
    template.view._domrange &&
    !template.view.isDestroyed;
  if (!rendered) return markChanged(template, fieldName, fieldValue);

  doMarkChanged(template, fieldName, fieldValue);
},
150);

updateTrackedFieldValue = function updateTrackedFieldValue(
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

updateAllTrackedFieldValues = function updateAllTrackedFieldValues(template) {
  if (template && template.formValues) {
    Object.keys(template.formValues).forEach(function(fieldName) {
      updateTrackedFieldValue(template, fieldName);
    });
  }
};

getAllFieldsInForm = function getAllFieldsInForm(template, disabled = false) {
  // Get all elements with `data-schema-key` attribute, unless disabled
  const formId = template.data.id;
  const allFields = template.$("[data-schema-key]").filter(function() {
    const fieldForm = $(this)
      .closest("form")
      .attr("id");
    return fieldForm == formId;
  });
  return disabled ? allFields : allFields.not("[disabled]");
  // Exclude fields in sub-forms, since they will belong to a different AutoForm and schema.
  // TODO need some selector/filter that actually works correctly for excluding subforms
  // return template.$('[data-schema-key]').not("[disabled]").not(template.$('form form [data-schema-key]'));
};
