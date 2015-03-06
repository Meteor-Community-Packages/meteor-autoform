/* global AutoForm, getInputType:true, getInputValue:true, getAllFieldsInForm:true, getInputData:true, updateTrackedFieldValue:true, updateAllTrackedFieldValues:true, getFlatDocOfFieldValues:true */

getFlatDocOfFieldValues = function getFlatDocOfFieldValues(fields, ss) {
  var doc = {};
  fields.each(function () {
    var fieldName, val = AutoForm.getInputValue(this, ss);
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

// Determines based on different options what type of input/control should be used
getInputType = function getInputType(atts) {
  var expectsArray = false, defs, schemaType;

  atts = AutoForm.Utility.normalizeContext(atts, 'afFieldInput').atts;

  // If a `type` attribute is specified, we just use that
  if (atts.type) {
    return atts.type;
  }

  // Get schema definition, using the item definition for array fields
  defs = AutoForm.getSchemaForField(atts.name);
  schemaType = defs.type;
  if (schemaType === Array) {
    expectsArray = true;
    defs = AutoForm.getSchemaForField(atts.name + ".$");
    schemaType = defs.type;
  }

  // Based on the `type` attribute, the `type` from the schema, and/or
  // other characteristics such as regEx and whether an array is expected,
  // choose which type string to return.
  // TODO allow outside packages to extend/override this logic.
  var type = "text";
  if (atts.options) {
    if (atts.noselect) {
      // Does the schema expect the value of the field to be an array?
      // If so, use a check box group, which will return an array value.
      if (expectsArray) {
        type = "select-checkbox";
      } else {
        type = "select-radio";
      }
    } else {
      if (expectsArray) {
        type = "select-multiple";
      } else {
        type = "select";
      }
    }
  } else if (schemaType === String && atts.rows) {
    type = "textarea";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    type = "boolean-checkbox";
  }
  return type;
};

/*
 * Gets the value that should be shown/selected in the input. Returns
 * a string, a boolean, or an array of strings. The value used,
 * in order of preference, is one of:
 * * The `value` attribute provided
 * * The value that is set in the `doc` provided on the containing autoForm
 * * The `defaultValue` from the schema
 */
getInputValue = function getInputValue(atts, value, mDoc, defaultValue, typeDefs) {
  if (typeof value === "undefined") {
    // Get the value for this key in the current document
    if (mDoc) {
      var valueInfo = mDoc.getInfoForKey(atts.name);
      if (valueInfo) {
        value = valueInfo.value;
      }
    }

    // Only if there is no current document, use the schema defaultValue
    else {
      value = defaultValue;
    }
  }

  // Change null or undefined to an empty string
  value = (value === null || value === void 0) ? '' : value;

  // If the component expects the value to be an array, and it's not, make it one
  if (typeDefs.valueIsArray && !_.isArray(value)) {
    if (typeof value === "string") {
      value = value.split(',');
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
  var inputAtts = _.omit(hash,
          "type",
          "value",
          "noselect",
          "options",
          "template");

  // Add required if required
  if (typeof inputAtts.required === "undefined" && !defs.optional) {
    inputAtts.required = "";
  }

   // Add data-schema-key to every type of element
  inputAtts['data-schema-key'] = inputAtts.name;

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
  _.each(["disabled", "readonly", "checked", "required", "autofocus"], function (booleanProp) {
    if (!_.has(hash, booleanProp)) {
      return;
    }

    // For historical reasons, we treat the string "true" and an empty string as `true`, too.
    // But an empty string value results in the cleanest rendered output for boolean props,
    // so we standardize as that.
    if (hash[booleanProp] === true || hash[booleanProp] === "true" || hash[booleanProp] === "") {
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
    min: (typeof defs.min === "function") ? defs.min() : defs.min,
    max: (typeof defs.max === "function") ? defs.max() : defs.max,
    decimal: defs.decimal,
    value: value,
    atts: inputAtts,
    selectOptions: AutoForm.Utility.getSelectOptions(defs, hash)
  };

  // Before returning the context, we allow the registered form type to
  // adjust it if necessary.
  var ftd = AutoForm._formTypeDefinitions[formType];
  if (!ftd) {
    throw new Error('AutoForm: Form type "' + formType + '" has not been defined');
  }
  if (typeof ftd.adjustInputContext === 'function') {
    inputTypeContext = ftd.adjustInputContext(inputTypeContext);
  }

  return inputTypeContext;
};

updateTrackedFieldValue = function updateTrackedFieldValue(template, fieldName) {

  function markChanged() {
    if (!template.formValues[fieldName]) {
      template.formValues[fieldName] = new Tracker.Dependency();
    }

    template.formValues[fieldName].changed();
  }

  markChanged();

  // To properly handle array fields, we'll mark the ancestors as changed, too
  // XXX Might be a more elegant way to handle this
  var dotPos = fieldName.lastIndexOf('.');
  while (dotPos !== -1) {
    fieldName = fieldName.slice(0, dotPos);
    markChanged();
    dotPos = fieldName.lastIndexOf('.');
  }
};

updateAllTrackedFieldValues = function updateAllTrackedFieldValues(template) {
  _.each(template.formValues, function (o, fieldName) {
    updateTrackedFieldValue(template, fieldName);
  });
};

getAllFieldsInForm = function getAllFieldsInForm(template) {
  // Get all elements with `data-schema-key` attribute, unless disabled
  return template.$("[data-schema-key]").not("[disabled]");
  // Exclude fields in sub-forms, since they will belong to a different AutoForm and schema.
  // TODO need some selector/filter that actually works correctly for excluding subforms
  // return template.$('[data-schema-key]').not("[disabled]").not(template.$('form form [data-schema-key]'));
};
