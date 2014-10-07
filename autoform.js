defaultFormId = "_afGenericID";
formPreserve = new FormPreserve("autoforms");
formData = {}; //for looking up autoform data by form ID
templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues
formValues = {}; //for reactive show/hide based on current value of a field
formDeps = {}; //for invalidating the form inner context and causing rerender
fd = new FormData();
arrayTracker = new ArrayTracker();

// reactive templates
globalDefaultTemplate = "bootstrap3"
defaultTypeTemplates = {};
deps = {
  defaultTemplate: new Deps.Dependency,
  defaultTypeTemplates: {}
};

/*
 * Private Helper Functions
 */

function getFieldsValues(fields, ss) {
  var doc = {};
  fields.each(function formValuesEach() {
    var field = $(this);
    var fieldName = field.attr("data-schema-key");

    // Special handling for checkboxes that create arrays
    // XXX maybe there is a way to do this better
    var isArrayCheckBox = (field.hasClass("af-array-item-checkbox"));
    if (isArrayCheckBox) {
      // Add empty array no matter what,
      // to ensure that unchecking all boxes
      // will empty the array.
      if (!_.isArray(doc[fieldName])) {
        doc[fieldName] = [];
      }
    }

    var val;

    var noHandler = _.every(inputTypeDefinitions, function (def) {
      if (!def.valueOut) return true;

      if (def.valueOut.get && def.valueOut.selector && field.filter(def.valueOut.selector).length === 1) {
        val = def.valueOut.get.call(field);
        return false;
      }

      return true;
    });

    // Get value in default way
    if (noHandler) {
      if (field.attr("data-null-value") !== void 0) {
        val = null;
      } else {
        val = field.val();
      }
    }

    if (val !== void 0) {
      // adjust if boolean is expected
      if (val === "true" && ss && ss.schema(fieldName).type === Boolean) {
        val = true;
      } else if (val === "false" && ss && ss.schema(fieldName).type === Boolean) {
        val = false;
      }
      if (isArrayCheckBox) {
        doc[fieldName].push(val);
      } else {
        doc[fieldName] = val;
      }
    }

  });

  return doc;
}

getFieldValue = function getFieldValue(template, key) {
  var formInfo = formData[template.data.id];
  var doc = getFieldsValues(template.$('[data-schema-key="' + key + '"], [data-schema-key^="' + key + '."]'), formInfo.ss);
  return doc && doc[key];
};

getFormValues = function getFormValues(template, formId, ss) {
  var formInfo = formData[formId];
  // By default, we do not keep empty strings
  var keepEmptyStrings = false;
  if (formInfo.removeEmptyStrings === false) {
    keepEmptyStrings = true;
  }
  // By default, we do filter
  var filter = true;
  if (formInfo.filter === false) {
    filter = false;
  }
  // By default, we do autoConvert
  var autoConvert = true;
  if (formInfo.autoConvert === false) {
    autoConvert = false;
  }
  // By default, we do trimStrings
  var trimStrings = true;
  if (formInfo.trimStrings === false) {
    trimStrings = false;
  }

  // Build doc from field values
  var doc = getFieldsValues(template.$("[data-schema-key]").not("[disabled]"), ss);

  // Expand the object
  doc = Utility.expandObj(doc);

  // As array items are removed, gaps can appear in the numbering,
  // which results in arrays that have undefined items. Here we
  // remove any array items that are undefined.
  Utility.compactArrays(doc);

  // When all fields that comprise a sub-object are empty, we should unset
  // the whole subobject and not complain about required fields in it. For example,
  // if `profile.address` has several properties but they are all null or undefined,
  // we will set `profile.address=null`. This ensures that we don't get incorrect validation
  // errors about required fields that are children of optional objects.
  Utility.bubbleEmpty(doc, keepEmptyStrings);

  // Pass expanded doc through formToDoc hooks
  var hookCtx = {
    template: template,
    formId: formId
  };
  var transforms = Hooks.getHooks(formId, 'formToDoc');
  _.each(transforms, function formValuesTransform(transform) {
    doc = transform.call(hookCtx, doc, ss, formId);
  });

  // We return doc, insertDoc, and updateDoc.
  // For insertDoc, delete any properties that are null, undefined, or empty strings.
  // For updateDoc, convert to modifier object with $set and $unset.
  // Do not add auto values to either.
  var result = {
    insertDoc: ss.clean(Utility.cleanNulls(doc, false, keepEmptyStrings), {
      isModifier: false,
      getAutoValues: false,
      filter: filter,
      autoConvert: autoConvert,
      trimStrings: trimStrings
    }),
    updateDoc: ss.clean(Utility.docToModifier(doc, keepEmptyStrings), {
      isModifier: true,
      getAutoValues: false,
      filter: filter,
      autoConvert: autoConvert,
      trimStrings: trimStrings
    })
  };
  return result;
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
    else if (defaultValue !== null && defaultValue !== undefined) {
      value = defaultValue;
    }
  }

  // Change null or undefined to an empty string
  value = (value == null) ? '' : value;

  // If the component expects the value to be an array, and it's not, make it one
  if (typeDefs.valueIsArray && !_.isArray(value)) {
    if (typeof value === "string") {
      value = value.split(',');
    } else {
      value = [value];
    }
  }

  // Convert to strings
  function stringValue(val) {
    if (!(val instanceof Date) && val.toString) {
      return val.toString();
    } else {
      return val;
    }
  }

  if (_.isArray(value)) {
    value = _.map(value, function (v) {
      return stringValue(v);
    });
  } else {
    value = stringValue(value);
  }

  // At this point we have a Date, a string, or an array of strings.
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
getInputData = function getInputData(defs, hash, value, label, expectsArray, submitType) {
  var schemaType = defs.type;

  /*
   * Get HTML attributes
   */

  // We don't want to alter the original hash, so we clone it and
  // remove some stuff that should not be HTML attributes.
  var inputAtts = _.omit(hash,
          "autoform",
          "type",
          "value",
          "firstOption",
          "radio",
          "select",
          "noselect",
          "trueLabel",
          "falseLabel",
          "options",
          "template");

  // Add required if required
  if (typeof inputAtts.required === "undefined" && !defs.optional) {
    inputAtts.required = "";
  }

  // Add disabled or readonly if the form has that submit type
  if (submitType === "disabled") {
    inputAtts.disabled = "";
  } else if (submitType === "readonly") {
    inputAtts.readonly = "";
  }

   // Add data-schema-key to every type of element
  inputAtts['data-schema-key'] = inputAtts['name'];

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
    if (!_.has(hash, booleanProp))
      return;

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
   * Get select options
   */

  var selectOptions = hash.options;

  // Handle options="allowed"
  if (selectOptions === "allowed") {
    selectOptions = _.map(defs.allowedValues, function(v) {
      var label = v;
      if (hash.capitalize && v.length > 0 && schemaType === String) {
        label = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      }

      return {label: label, value: v};
    });
  }
  // If options are specified in the schema, they may be a function
  // that has not yet been evaluated.
  else if (typeof selectOptions === "function") {
    selectOptions = selectOptions();
  }

  /*
   * Return the context
   */

  return {
    name: inputAtts['name'],
    expectsArray: expectsArray,
    schemaType: schemaType,
    min: (typeof defs.min === "function") ? defs.min() : defs.min,
    max: (typeof defs.max === "function") ? defs.max() : defs.max,
    decimal: defs.decimal,
    value: value,
    trueLabel: hash.trueLabel || "True",
    falseLabel: hash.falseLabel || "False",
    atts: inputAtts,
    firstOption: hash.firstOption,
    selectOptions: selectOptions
  };
};

updateTrackedFieldValue = function updateTrackedFieldValue(formId, key, val) {
  formValues[formId] = formValues[formId] || {};
  formValues[formId][key] = formValues[formId][key] || {_deps: new Deps.Dependency};
  formValues[formId][key]._val = val;
  formValues[formId][key]._deps.changed();
};

updateAllTrackedFieldValues = function updateAllTrackedFieldValues(formId) {
  var template = templatesById[formId];
  if (!template)
    return;
  _.each(formValues[formId], function (o, key) {
    updateTrackedFieldValue(formId, key, getFieldValue(template, key));
  });
};
