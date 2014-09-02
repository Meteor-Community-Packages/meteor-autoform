defaultFormId = "_afGenericID";
formPreserve = new FormPreserve("autoforms");
formData = {}; //for looking up autoform data by form ID
templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues
formValues = {}; //for reactive show/hide based on current value of a field
formDeps = {}; //for invalidating the form inner context and causing rerender
var fd = new FormData();
arrayTracker = new ArrayTracker();
customInputValueHandlers = {};
defaultTemplate = "bootstrap3";
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
  afDeleteButton: null,
  afQuickField: null,
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
    afDeleteButton: new Deps.Dependency,
    afQuickField: new Deps.Dependency,
    afObjectField: new Deps.Dependency,
    afArrayField: new Deps.Dependency
  }
};

/*
 * Shared
 */

UI.registerHelper('afTemplateName', function afTemplateNameHelper(templateType, templateName) {
  var self = this;

  // Template may be specified in schema.
  // Skip for quickForm and afDeleteButton because they render a form
  // and not a field.
  if (!templateName && templateType !== 'quickForm' && templateType !== 'afDeleteButton') {
    var autoform = AutoForm.find(templateType);
    var fieldName = self.name;

    if (fieldName && autoform) {
      var defs = Utility.getDefs(autoform.ss, fieldName); //defs will not be undefined
      templateName = (defs.autoform && defs.autoform.template);
    }
  }

  // Determine default template
  var defaultTemplate = AutoForm.getDefaultTemplateForType(templateType) || AutoForm.getDefaultTemplate();

  // Determine template name
  var result;
  if (templateName) {
    result = templateType + '_' + templateName;
    if (!Template[result]) {
      // TODO should warn only in debug mode
      console.warn(templateType + ': "' + templateName + '" is not a valid template name. Falling back to default template, "' + defaultTemplate + '".');
    }
  }

  if (!result) {
    result = templateType + '_' + defaultTemplate;
    if (!Template[result]) {
      throw new Error(templateType + ': "' + defaultTemplate + '" is not a valid template name');
    }
  }

  // Return the template name that we want to use
  return result;
});

/*
 * autoForm
 */

Template.autoForm.atts = function autoFormTplAtts() {
  var context = _.clone(this);

  // By default, we add the `novalidate="novalidate"` attribute to our form,
  // unless the user passes `validation="browser"`.
  if (context.validation !== "browser" && !context.novalidate) {
    context.novalidate = "novalidate";
  }
  // After removing all of the props we know about, everything else should
  // become a form attribute.
  // XXX Would be better to use a whitelist of HTML attributes allowed on form elements
  return _.omit(context, "schema", "collection", "validation", "doc", "resetOnSuccess",
      "type", "template", "autosave", "meteormethod", "filter", "autoConvert", "removeEmptyStrings");
};

Template.autoForm.innerContext = function autoFormTplInnerContext(outerContext) {
  var context = this;
  var formId = context.id || defaultFormId;
  var collection = Utility.lookup(context.collection);
  var ss = Utility.getSimpleSchemaFromContext(context, formId);

  // Retain doc values after a "hot code push", if possible
  var retrievedDoc = formPreserve.getDocument(formId);
  if (retrievedDoc !== false) {
    context.doc = retrievedDoc;
  }

  var mDoc;
  if (context.doc && !_.isEmpty(context.doc)) {
    // Clone doc
    var copy = _.clone(context.doc);
    var hookCtx = {formId: formId};
    // Pass doc through docToForm hooks
    _.each(Hooks.getHooks(formId, 'docToForm'), function autoFormEachDocToForm(hook) {
      copy = hook.call(hookCtx, copy, ss, formId);
    });
    // Create a "flat doc" that can be used to easily get values for corresponding
    // form fields.
    mDoc = new MongoObject(copy);
    fd.sourceDoc(formId, mDoc);
  } else {
    fd.sourceDoc(formId, null);
  }

  // Check autosave
  var autosave, resetOnSuccess;
  if (context.autosave === true && context.type === "update") {
    // Autosave and never reset on success
    autosave = true;
    resetOnSuccess = false;
  } else {
    autosave = false;
    resetOnSuccess = context.resetOnSuccess;
  }

  // Set up the context to be used for everything within the autoform.
  var innerContext = {_af: {
    formId: formId,
    collection: collection,
    ss: ss,
    ssIsOverride: !!collection && !!context.schema,
    doc: context.doc || null,
    mDoc: mDoc,
    validationType: (context.validation == null ? "submitThenKeyup" : context.validation),
    submitType: context.type,
    submitMethod: context.meteormethod,
    resetOnSuccess: resetOnSuccess,
    autosave: autosave,
    filter: context.filter,
    autoConvert: context.autoConvert,
    removeEmptyStrings: context.removeEmptyStrings
  }};

  // Cache context for lookup by formId
  formData[formId] = innerContext._af;

  // When we change the form, loading a different doc, reloading the current doc, etc.,
  // we also want to reset the array counts for the form
  arrayTracker.resetForm(formId);

  // Preserve outer context, allowing access within autoForm block without needing ..
  _.extend(innerContext, outerContext);
  return innerContext;
};

Template.autoForm.created = function autoFormCreated() {
  var self = this;
  var formId = self.data.id || defaultFormId;
  // Add to templatesById list
  templatesById[formId] = self;
};

Template.autoForm.destroyed = function autoFormDestroyed() {
  var self = this;
  self._notInDOM = true;
  var formId = self.data.id || defaultFormId;

  // Remove from templatesById list
  if (templatesById[formId]) {
    delete templatesById[formId];
  }

  // Remove from data list
  if (formData[formId]) {
    delete formData[formId];
  }

  // Remove from array fields list
  arrayTracker.untrackForm(formId);

  // Remove from field values
  if (formValues[formId]) {
    delete formValues[formId];
  }

  // Unregister form preservation
  formPreserve.unregisterForm(formId);
};

/*
 * quickForm
 */

Template.quickForm.innerContext = function quickFormContext(atts) {
  // Pass along quickForm context to autoForm context, minus a few
  // properties that are specific to quickForms.
  var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

  return {
    qfAutoFormContext: qfAutoFormContext,
    atts: atts,
    // qfShouldRenderButton helper
    qfShouldRenderButton: function qfShouldRenderButton() {
      var self = this;
      var qfAtts = self.atts;
      var submitType = self._af.submitType;
      return (qfAtts.buttonContent !== false && submitType !== "readonly" && submitType !== "disabled");
    }
  };
};

/*
 * afFieldInput
 */

Template.afFieldInput.getTemplateType = function getTemplateType() {
  return getInputTemplateType(this.type);
};

Template.afFieldSelect.innerContext =
Template.afFieldInput.innerContext = function afFieldInputInnerContext(options) {
  var c = Utility.normalizeContext(options.hash, "afFieldInput and afFieldSelect");
  var contentBlock = options.hash.contentBlock; // applies only to afFieldSelect
  var contentBlockContext = options.hash.contentBlockContext; // applies only to afFieldSelect

  // Set up deps, allowing us to re-render the form
  formDeps[c.af.formId] = formDeps[c.af.formId] || new Deps.Dependency;
  formDeps[c.af.formId].depend();

  var ss = c.af.ss;
  var defs = c.defs;

  // Adjust for array fields if necessary
  var expectsArray = false;
  var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
  if (defs.type === Array) {
    defs = ss.schema(c.atts.name + ".$");

    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    expectsArray = !c.atts.type;
  }

  // Get inputType
  var inputType = getInputType(c.atts, defs, expectsArray);

  // Get input value
  var value = getInputValue(c.atts.name, c.atts, expectsArray, inputType, c.atts.value, c.af.mDoc, defaultValue);

  // Track field's value for reactive show/hide of other fields by value
  updateTrackedFieldValue(c.af.formId, c.atts.name, value);

  // Get input data context
  var iData = getInputData(defs, c.atts, value, inputType, ss.label(c.atts.name), expectsArray, c.af.submitType, c.af);

  // Return input data context
  return _.extend({_af: c.af, contentBlock: contentBlock, contentBlockContext: contentBlockContext, type: inputType}, iData);
};

/*
 * afDeleteButton
 */

Template.afDeleteButton.innerContext = function afDeleteButtonInnerContext(ctx, contentBlock) {
  return _.extend(ctx, {contentBlock: contentBlock});
};

/*
 * afArrayField
 */

Template.afArrayField.innerContext = function (options) {
  var c = Utility.normalizeContext(options.hash, "afArrayField");
  var name = c.atts.name;
  var fieldMinCount = c.atts.minCount || 0;
  var fieldMaxCount = c.atts.maxCount || Infinity;
  var ss = c.af.ss;
  var formId = c.af.formId;

  // Init the array tracking for this field
  var docCount = fd.getDocCountForField(formId, name) || c.atts.initialValueCount;
  arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount);

  return {
    atts: c.atts
  };
};

/*
 * afQuickField
 */

function quickFieldLabelAtts(context) {
  // Remove unwanted props from the hash
  context = _.omit(context, 'label');

  // Separate label options from input options; label items begin with "label-"
  var labelContext = {
    name: context.name,
    template: context.template
  };
  _.each(context, function autoFormLabelContextEach(val, key) {
    if (key.indexOf("label-") === 0) {
      labelContext[key.substring(6)] = val;
    }
  });

  return labelContext;
}

function quickFieldInputAtts(context) {
  // Remove unwanted props from the hash
  context = _.omit(context, 'label');

  // Separate label options from input options; label items begin with "label-"
  var inputContext = {};
  _.each(context, function autoFormInputContextEach(val, key) {
    if (key.indexOf("label-") !== 0) {
      inputContext[key] = val;
    }
  });

  return inputContext;
}

Template.afQuickField.innerContext = function afQuickFieldInnerContext(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");
  var ss = c.af.ss;

  var labelAtts = quickFieldLabelAtts(c.atts);
  var inputAtts = quickFieldInputAtts(c.atts);

  return {
    skipLabel: (c.atts.label === false || (c.defs.type === Boolean && !("select" in c.atts) && !("radio" in c.atts))),
    afFieldLabelAtts: labelAtts,
    afFieldInputAtts: inputAtts,
    atts: {name: inputAtts.name}
  };
};

Template.afQuickField.isGroup = function afQuickFieldIsGroup(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");
  // Render an array of fields if we expect an Object and we don't have options
  // and we have not overridden the type
  return (c.defs.type === Object && !c.atts.options && !c.atts.type);
};

Template.afQuickField.isFieldArray = function afQuickFieldIsFieldArray(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");
  // Render an array of fields if we expect an Array and we don't have options
  // and we have not overridden the type
  return (c.defs.type === Array && !c.atts.options && !c.atts.type);
};

/*
 * afQuickFields
 */

Template.afQuickFields.helpers({
  quickFieldAtts: function quickFieldAtts() {
    return _.extend({options: "auto"}, UI._parentData(2), this);
  }
});

/*
 * afEachArrayItem
 */

Template.afEachArrayItem.innerContext = function afEachArrayItemInnerContext(options) {
  var c = Utility.normalizeContext(options.hash, "afEachArrayItem");
  var formId = c.af.formId;
  var name = c.atts.name;
  var docCount = fd.getDocCountForField(formId, name);

  arrayTracker.initField(formId, name, c.af.ss, docCount, c.atts.minCount, c.atts.maxCount);

  return arrayTracker.getField(formId, name);
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
      autoConvert: autoConvert
    }),
    updateDoc: ss.clean(Utility.docToModifier(doc, keepEmptyStrings), {
      isModifier: true,
      getAutoValues: false,
      filter: filter,
      autoConvert: autoConvert
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
function getInputValue(name, atts, expectsArray, inputType, value, mDoc, defaultValue) {
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
          var offset = atts.offset || "Z";
          // TODO switch to use timezoneId attribute instead of offset
          return Utility.dateToNormalizedLocalDateAndTimeString(val, offset);
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
}

function getInputData(defs, hash, value, inputType, label, expectsArray, submitType, _af) {
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
          "offset",
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
    // `offset` is deprecated and replaced by `timezoneId`
    inputAtts["data-offset"] = hash.offset || "Z";
    inputAtts["data-timezoneId"] = hash.timezoneId || "UTC";
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
          inputAtts.max = Utility.dateToNormalizedLocalDateAndTimeString(max, inputAtts["data-offset"]);
        }
        if (typeof inputAtts.min === "undefined" && min instanceof Date) {
          inputAtts.min = Utility.dateToNormalizedLocalDateAndTimeString(min, inputAtts["data-offset"]);
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
}

function getInputType(atts, defs, expectsArray) {
  var schemaType = defs.type;

  var type = "text";
  if (atts.type) {
    type = atts.type;
  } else if (atts.options) {
    if (atts.noselect) {
      if (expectsArray) {
        type = "select-checkbox";
      } else {
        type = "select-radio";
      }
    } else {
      type = "select";
    }
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Email) {
    type = "email";
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Url) {
    type = "url";
  } else if (schemaType === String && atts.rows) {
    type = "textarea";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    if (atts.radio) {
      type = "boolean-radios";
    } else if (atts.select) {
      type = "boolean-select";
    } else {
      type = "boolean-checkbox";
    }
  }
  return type;
}

function getInputTemplateType(type) {
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
}

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
