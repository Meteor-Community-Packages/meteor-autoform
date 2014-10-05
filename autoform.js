defaultFormId = "_afGenericID";
formPreserve = new FormPreserve("autoforms");
formData = {}; //for looking up autoform data by form ID
templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues
formValues = {}; //for reactive show/hide based on current value of a field
formDeps = {}; //for invalidating the form inner context and causing rerender
fd = new FormData();
arrayTracker = new ArrayTracker();
customInputValueHandlers = {};
globalDefaultTemplate = "bootstrap3"
// All use global template by default
defaultTypeTemplates = {
  quickForm: null,
  afFieldLabel: null,
  afFieldSelect: null,
  afCheckboxGroup: null,
  afRadioGroup: null,
  afSelect: null,
  afTextarea: null,
  afContenteditable: null,
  afCheckbox: null,
  afRadio: null,
  afInput: null,
  afFormGroup: null,
  afObjectField: null,
  afArrayField: null
};

deps = {
  defaultTemplate: new Deps.Dependency,
  defaultTypeTemplates: {
    quickForm: new Deps.Dependency,
    afFieldLabel: new Deps.Dependency,
    afFieldSelect: new Deps.Dependency,
    afCheckboxGroup: new Deps.Dependency,
    afRadioGroup: new Deps.Dependency,
    afSelect: new Deps.Dependency,
    afTextarea: new Deps.Dependency,
    afContenteditable: new Deps.Dependency,
    afCheckbox: new Deps.Dependency,
    afRadio: new Deps.Dependency,
    afInput: new Deps.Dependency,
    afFormGroup: new Deps.Dependency,
    afObjectField: new Deps.Dependency,
    afArrayField: new Deps.Dependency
  }
};

/*
 * Private Helper Functions
 */

function getFieldsValues(fields) {
  var doc = {};
  fields.each(function formValuesEach() {
    var field = $(this);
    var fieldName = field.attr("data-schema-key");

    // use custom handlers first, and then use built-in handlers
    _.every([customInputValueHandlers, defaultInputValueHandlers], function (handlerList) {
      return _.every(handlerList, function (handler, selector) {
        if (field.filter(selector).length === 1) {
          // Special handling for checkboxes that create arrays
          // XXX maybe there is a way to do this better
          var isArrayCheckBox = (field.hasClass("autoform-array-item"));
          if (isArrayCheckBox) {
            // Add empty array no matter what,
            // to ensure that unchecking all boxes
            // will empty the array.
            if (!_.isArray(doc[fieldName])) {
              doc[fieldName] = [];
            }
          }
          var val = handler.call(field);
          if (val !== void 0) {
            if (isArrayCheckBox) {
              doc[fieldName].push(val);
            } else {
              doc[fieldName] = val;
            }
          }
          return false;
        }
        return true;
      });
    });
  });

  return doc;
}

getFieldValue = function getFieldValue(template, key) {
  var doc = getFieldsValues(template.$('[data-schema-key="' + key + '"], [data-schema-key^="' + key + '."]'));
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
  var doc = getFieldsValues(template.$("[data-schema-key]").not("[disabled]"));

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
getInputValue = function getInputValue(name, atts, expectsArray, inputType, value, mDoc, defaultValue) {
  if (typeof value === "undefined") {
    // Get the value for this key in the current document
    if (mDoc) {
      var valueInfo = mDoc.getInfoForKey(name);
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

  function stringValue(val) {
    if (val instanceof Date) {
      //convert Dates to string value based on field inputType
      if (value instanceof Date) {
        if (inputType === "datetime") {
          return Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(val);
        } else if (inputType === "datetime-local") {
          return Utility.dateToNormalizedLocalDateAndTimeString(val, atts.timezoneId);
        } else {
          // This fallback will be used for type="date" as well
          // as for select arrays, since it would not make much
          // sense to do anything other than the date portion
          // in select controls.
          return Utility.dateToDateStringUTC(val);
        }
      }
    } else if (val.toString) {
      return val.toString();
    } else {
      return val;
    }
  }

  // If we're expecting value to be an array, and it's not, make it one
  if (expectsArray && !_.isArray(value)) {
    if (typeof value === "string") {
      value = value.split(',');
    } else {
      value = [value];
    }
  }

  // Convert to strings
  if (_.isArray(value)) {
    value = _.map(value, function (v) {
      return stringValue(v);
    });
  } else {
    value = stringValue(value);
  }

  // Switch to a boolean value for boolean fields
  if (inputType === "boolean-radios" || inputType === "boolean-select" || inputType === "boolean-checkbox") {
    value = (value === "true") ? true : false;
  }

  // We return either a string, a boolean, or an array of strings
  return value;
};

getInputData = function getInputData(defs, hash, value, inputType, label, expectsArray, submitType, _af) {
  var schemaType = defs.type;

  // We don't want to alter the original hash, so we clone it and
  // remove some stuff that should not be HTML attributes
  // XXX It would be better to use a whitelist of allowed attributes
  var inputAtts = _.omit(hash,
          "autoform",
          "value",
          "firstOption",
          "radio",
          "select",
          "noselect",
          "trueLabel",
          "falseLabel",
          "options",
          "offset", //deprecated attr, but we'll remove it for now
          "timezoneId",
          "template");

  // Add required to every type of element, if required
  if (typeof inputAtts.required === "undefined" && !defs.optional) {
    inputAtts.required = "";
  }

  // Add disabled or readonly if the form has that submit type
  if (submitType === "disabled") {
    inputAtts.disabled = "";
  } else if (submitType === "readonly") {
    inputAtts.readonly = "";
  }

  var min = (typeof defs.min === "function") ? defs.min() : defs.min;
  var max = (typeof defs.max === "function") ? defs.max() : defs.max;

  if (inputType === "datetime-local") {
    if (typeof hash.timezoneId === "string") {
      inputAtts["data-timezone-id"] = hash.timezoneId;
    }
  }

  // Extract settings from hash
  var firstOption = hash.firstOption;
  var radio = hash.radio;
  var select = hash.select;
  var noselect = hash.noselect;
  var trueLabel = hash.trueLabel || "True";
  var falseLabel = hash.falseLabel || "False";
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

  // Set placeholder to label from schema if requested
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

  // Add data-schema-key to every type of element
  inputAtts['data-schema-key'] = inputAtts['name'];

  // Determine what options to use
  var data = {};

  data.name = inputAtts['name'];
  data.expectsArray = expectsArray;

  if (selectOptions) {
    // Build anything that should be a select, which is anything with options
    data.items = [];
    // For check boxes, we add the "autoform-array-item" class
    if (noselect && expectsArray) {
      inputAtts["class"] = (inputAtts["class"] || "") + " autoform-array-item";
    }
    // If rendering a select element
    if (!noselect) {
      inputAtts.autocomplete = "off"; //can fix issues with some browsers selecting the firstOption instead of the selected option
      if (expectsArray) {
        inputAtts.multiple = "";
      }
      // If a firstOption was provided, add that to the items list first
      if (firstOption && !expectsArray) {
        data.items.push({
          name: data.name,
          label: firstOption,
          value: "",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "",
          selected: false,
          atts: inputAtts
        });
      }
    }
    // Add all defined options
    _.each(selectOptions, function(opt) {
      var selected = expectsArray ? _.contains(value, opt.value.toString()) : (opt.value.toString() === value.toString());
      data.items.push({
        name: data.name,
        label: opt.label,
        value: opt.value,
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: opt.value,
        selected: selected,
        atts: inputAtts
      });
    });
  } else if (inputType === "textarea") {
    if (typeof inputAtts.maxlength === "undefined" && typeof max === "number") {
      inputAtts.maxlength = max;
    }
    data.value = value;
  } else if (inputType === "contenteditable") {
    if (typeof inputAtts['data-maxlength'] === "undefined" && typeof max === "number") {
      inputAtts['data-maxlength'] = max;
    }
    data.value = value;
  } else if (inputType === "boolean-radios" || inputType === "boolean-select" || inputType === "boolean-checkbox") {

    // add autoform-boolean class, which we use when building object
    // from form values later
    inputAtts["class"] = (inputAtts["class"] || "") + " autoform-boolean";

    function getItems() {
      return [
        {
          name: data.name,
          value: "false",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "false",
          selected: !value,
          label: falseLabel,
          atts: inputAtts
        },
        {
          name: data.name,
          value: "true",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "true",
          selected: value,
          label: trueLabel,
          atts: inputAtts
        }
      ];
    }
    
    if (inputType === "boolean-radios" || inputType === "boolean-select") {
      data.items = getItems();
    } else {
      //don't add required attribute to checkboxes because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
      delete inputAtts.required;
      data.value = "true";
      data.selected = value;
    }
  } else {
    // All other inputTypes
    switch (inputType) {
      case "number":
        if (typeof inputAtts.max === "undefined" && typeof max === "number") {
          inputAtts.max = max;
        }
        if (typeof inputAtts.min === "undefined" && typeof min === "number") {
          inputAtts.min = min;
        }
        if (typeof inputAtts.step === "undefined" && defs.decimal) {
          inputAtts.step = '0.01';
        }
        break;
      case "date":
        if (typeof inputAtts.max === "undefined" && max instanceof Date) {
          inputAtts.max = Utility.dateToDateStringUTC(max);
        }
        if (typeof inputAtts.min === "undefined" && min instanceof Date) {
          inputAtts.min = Utility.dateToDateStringUTC(min);
        }
        break;
      case "datetime":
        if (typeof inputAtts.max === "undefined" && max instanceof Date) {
          inputAtts.max = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(max);
        }
        if (typeof inputAtts.min === "undefined" && min instanceof Date) {
          inputAtts.min = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(min);
        }
        break;
      case "datetime-local":
        if (typeof inputAtts.max === "undefined" && max instanceof Date) {
          inputAtts.max = Utility.dateToNormalizedLocalDateAndTimeString(max, inputAtts["data-timezone-id"]);
        }
        if (typeof inputAtts.min === "undefined" && min instanceof Date) {
          inputAtts.min = Utility.dateToNormalizedLocalDateAndTimeString(min, inputAtts["data-timezone-id"]);
        }
        break;
      case "hidden":
        if (schemaType === Boolean) {
          // add autoform-boolean class, which we use when building object
          // from form values later
          inputAtts["class"] = (inputAtts["class"] || "") + " autoform-boolean";
        }
    }

    if (typeof inputAtts.maxlength === "undefined"
            && typeof max === "number"
            && _.contains(["text", "email", "search", "password", "tel", "url"], inputType)
            ) {
      inputAtts.maxlength = max;
    }

    data.type = inputType;
    data.value = value;
  }

  // We set this one down here because some of the code paths above alter inputAtts
  data.atts = inputAtts;

  return data;
};

getInputTemplateType = function getInputTemplateType(type) {
  // Special types
  var typeMap = {
    "select": "afSelect",
    "select-checkbox": "afCheckboxGroup",
    "select-radio": "afRadioGroup",
    "textarea": "afTextarea",
    "contenteditable": "afContenteditable",
    "boolean-radios": "afRadioGroup",
    "boolean-select": "afSelect",
    "boolean-checkbox": "afCheckbox",
  };

  // All other input types
  var defaultTemplateType = "afInput";
  
  return typeMap[type] || defaultTemplateType;
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

invalidateFormContext = function invalidateFormContext(formId) {
  formDeps[formId] = formDeps[formId] || new Deps.Dependency;
  formDeps[formId].changed();
};
