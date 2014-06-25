defaultFormId = "_afGenericID";
formPreserve = new FormPreserve("autoforms");
formData = {}; //for looking up autoform data by form ID
var templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues
var arrayFields = {}; //track # of array fields per form
var formValues = {}; //for reactive show/hide based on current value of a field
var fd = new FormData();
arrayTracker = new ArrayTracker();

AutoForm = AutoForm || {}; //exported

/**
 * @method AutoForm.addHooks
 * @public
 * @param {String[]|String|null} formIds Form `id` or array of form IDs to which these hooks apply. Specify `null` to add hooks that will run for every form.
 * @param {Object} hooks Hooks to add, where supported names are "before", "after", "formToDoc", "docToForm", "onSubmit", "onSuccess", and "onError".
 * @returns {undefined}
 *
 * Defines hooks to be used by one or more forms. Extends hooks lists if called multiple times for the same
 * form.
 */
AutoForm.addHooks = function autoFormAddHooks(formIds, hooks, replace) {
  if (typeof formIds === "string") {
    formIds = [formIds];
  }

  // If formIds is null, add global hooks
  if (!formIds) {
    Hooks.addHooksToList(Hooks.global, hooks, replace);
  } else {
    _.each(formIds, function (formId) {

      // Init the hooks object if not done yet
      Hooks.form[formId] = Hooks.form[formId] || {
        before: {},
        after: {},
        formToDoc: [],
        docToForm: [],
        onSubmit: [],
        onSuccess: [],
        onError: [],
        beginSubmit: [],
        endSubmit: []
      };

      Hooks.addHooksToList(Hooks.form[formId], hooks, replace);
    });
  }
};

/**
 * @method AutoForm.hooks
 * @public
 * @param {Object} hooks
 * @returns {undefined}
 *
 * Defines hooks by form id. Extends hooks lists if called multiple times for the same
 * form.
 */
AutoForm.hooks = function autoFormHooks(hooks, replace) {
  _.each(hooks, function(hooksObj, formId) {
    AutoForm.addHooks(formId, hooksObj, replace);
  });
};

/**
 * @method AutoForm.resetForm
 * @public
 * @param {String} formId
 * @returns {undefined}
 *
 * Resets validation for an autoform.
 */
AutoForm.resetForm = function autoFormResetForm(formId) {
  if (typeof formId !== "string") {
    return;
  }

  formPreserve.unregisterForm(formId);

  // Reset array counts
  arrayTracker.resetForm(formId);

  if (formData[formId]) {
    formData[formId].ss && formData[formId].ss.namedContext(formId).resetValidation();
    // If simpleSchema is undefined, we haven't yet rendered the form, and therefore
    // there is no need to reset validation for it. No error need be thrown.
  }
};

var deps = {};

var defaultTemplate = "bootstrap3";
deps.defaultTemplate = new Deps.Dependency;
AutoForm.setDefaultTemplate = function autoFormSetDefaultTemplate(template) {
  defaultTemplate = template;
  deps.defaultTemplate.changed();
};

AutoForm.getDefaultTemplate = function autoFormGetDefaultTemplate() {
  deps.defaultTemplate.depend();
  return defaultTemplate;
};

// All use global template by default
var defaultTypeTemplates = {
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
deps.defaultTypeTemplates = {
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
};

/**
 * @method AutoForm.setDefaultTemplateForType
 * @public
 * @param {String} type
 * @param {String} template
 */
AutoForm.setDefaultTemplateForType = function autoFormSetDefaultTemplateForType(type, template) {
  if (!deps.defaultTypeTemplates[type]) {
    throw new Error("invalid template type: " + type);
  }
  if (template !== null && !Template[type + "_" + template]) {
    throw new Error("setDefaultTemplateForType can't set default template to \"" + template + "\" for type \"" + type + "\" because there is no defined template with the name \"" + type + "_" + template + "\"");
  }
  defaultTypeTemplates[type] = template;
  deps.defaultTypeTemplates[type].changed();
};

/**
 * @method AutoForm.getDefaultTemplateForType
 * @public
 * @param {String} type
 * @return {String} Template name
 *
 * Reactive.
 */
AutoForm.getDefaultTemplateForType = function autoFormGetDefaultTemplateForType(type) {
  if (!deps.defaultTypeTemplates[type]) {
    throw new Error("invalid template type: " + type);
  }
  deps.defaultTypeTemplates[type].depend();
  return defaultTypeTemplates[type];
};

/**
 * @method AutoForm.getFormValues
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want current values for.
 * @return {Object}
 *
 * Returns an object representing the current values of all schema-based fields in the form.
 * The returned object contains two properties, "insertDoc" and "updateDoc", which represent
 * the field values as a normal object and as a MongoDB modifier, respectively.
 */
AutoForm.getFormValues = function autoFormGetFormValues(formId) {
  var template = templatesById[formId];
  if (!template || template._notInDOM) {
    throw new Error("getFormValues: There is currently no autoForm template rendered for the form with id " + formId);
  }
  // Get a reference to the SimpleSchema instance that should be used for
  // determining what types we want back for each field.
  var context = template.data;
  var ss = Utility.getSimpleSchemaFromContext(context, formId);
  return getFormValues(template, formId, ss);
};

/**
 * @method AutoForm.getFieldValue
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want current values for.
 * @param {String} fieldName The name of the field for which you want the current value.
 * @return {Any}
 *
 * Returns the value of the field (the value that would be used if the form were submitted right now).
 * This is a reactive method that will rerun whenever the current value of the requested field changes.
 */
AutoForm.getFieldValue = function autoFormGetFieldValue(formId, fieldName) {
  formValues[formId] = formValues[formId] || {};
  formValues[formId][fieldName] = formValues[formId][fieldName] || {_deps: new Deps.Dependency};
  formValues[formId][fieldName]._deps.depend();
  return formValues[formId][fieldName]._val;
};

/**
 * @method AutoForm.validateField
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want to validate.
 * @param {String} fieldName The name of the field within the `autoForm` you want to validate.
 * @param {Boolean} [skipEmpty=false] Set to `true` to skip validation if the field has no value. Useful for preventing `required` errors in form fields that the user has not yet filled out.
 * @return {Boolean} Is it valid?
 *
 * In addition to returning a boolean that indicates whether the field is currently valid,
 * this method causes the reactive validation messages to appear.
 */
AutoForm.validateField = function autoFormValidateField(formId, fieldName, skipEmpty) {
  var template = templatesById[formId];
  if (!template || template._notInDOM) {
    throw new Error("validateField: There is currently no autoForm template rendered for the form with id " + formId);
  }

  return _validateField(fieldName, template, skipEmpty, false);
};

/*
 * Shared
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

Template.afFieldInput.getTemplate =
Template.afFieldLabel.getTemplate =
Template.afFieldSelect.getTemplate =
Template.afDeleteButton.getTemplate =
Template.afQuickField.getTemplate =
Template.afObjectField.getTemplate =
Template.afArrayField.getTemplate =
Template.quickForm.getTemplate =
function afGenericGetTemplate(templateType, templateName, fieldName, autoform) {
  var result;

  // Template may be specified in schema.
  // Skip for quickForm and afDeleteButton because they render a form
  // and not a field.
  if (fieldName && autoform) {
    var defs = Utility.getDefs(autoform._af.ss, fieldName); //defs will not be undefined
    templateName = templateName || (defs.autoform && defs.autoform.template);
  }
  
  var defaultTemplate = AutoForm.getDefaultTemplateForType(templateType) || AutoForm.getDefaultTemplate();

  // Determine template name
  if (templateName) {
    var result = Template[templateType + '_' + templateName];
    if (!result) {
      console.warn(templateType + ': "' + templateName + '" is not a valid template name. Falling back to default template, "' + defaultTemplate + '".');
    }
  }

  if (!result) {
    result = Template[templateType + '_' + defaultTemplate];
    if (!result) {
      throw new Error(templateType + ': "' + defaultTemplate + '" is not a valid template name');
    }
  }

  // Return the template instance that we want to use
  return result;
};

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
  return _.omit(context, "schema", "collection", "validation", "doc", "resetOnSuccess", "type", "template");
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
    // Pass doc through docToForm hooks
    _.each(Hooks.getHooks(formId, 'docToForm'), function autoFormEachDocToForm(func) {
      copy = func(copy, ss, formId);
    });
    // Create a "flat doc" that can be used to easily get values for corresponding
    // form fields.
    mDoc = new MongoObject(copy);
    fd.sourceDoc(formId, mDoc);
  } else {
    fd.sourceDoc(formId, null);
  }

  // Set up the context to be used for everything within the autoform.
  var innerContext = {_af: {
    formId: formId,
    collection: collection,
    ss: ss,
    doc: context.doc,
    mDoc: mDoc,
    validationType: (typeof context.validation === "undefined" ? "submitThenKeyup" : context.validation),
    submitType: context.type,
    resetOnSuccess: context.resetOnSuccess
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

UI.registerHelper('quickForm', function quickFormHelper() {
  throw new Error('Use the new syntax {{> quickForm}} rather than {{quickForm}}');
});

Template.quickForm.innerContext = function quickFormContext(atts) {
  // Pass along quickForm context to autoForm context, minus a few
  // properties that are specific to quickForms.
  var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

  return {
    qfAutoFormContext: qfAutoFormContext,
    atts: atts
  };
};

/*
 * afFieldLabel
 */

UI.registerHelper('afFieldLabel', function afFieldLabelHelper() {
  throw new Error('Use the new syntax {{> afFieldLabel name="name"}} rather than {{afFieldLabel "name"}}');
});

/*
 * afFieldInput
 */

UI.registerHelper('afFieldInput', function afFieldInputHelper() {
  throw new Error('Use the new syntax {{> afFieldInput name="name"}} rather than {{afFieldInput "name"}}');
});

Template.afFieldInput.getTemplateType = function getTemplateType() {
  return getInputTemplateType(this.type);
};

Template.afFieldSelect.innerContext =
Template.afFieldInput.innerContext = function afFieldInputInnerContext(options) {
  var c = Utility.normalizeContext(options.hash, "afFieldInput and afFieldSelect");
  var contentBlock = options.hash.contentBlock; // applies only to afFieldSelect

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
  return _.extend({_af: c.af, contentBlock: contentBlock, type: inputType}, iData);
};

/*
 * afFieldSelect
 */

UI.registerHelper('afFieldSelect', function afFieldSelectHelper() {
  throw new Error('Use the new syntax {{> afFieldSelect name="name"}} rather than {{afFieldSelect "name"}}');
});

/*
 * afDeleteButton
 */

UI.registerHelper('afDeleteButton', function afDeleteButtonHelper() {
  throw new Error('Use the syntax {{> afDeleteButton collection=collection doc=doc}}');
});

Template.afDeleteButton.innerContext = function afDeleteButtonInnerContext(ctx, contentBlock) {
  return _.extend(ctx, {contentBlock: contentBlock});
};

/*
 * afArrayField
 */

UI.registerHelper('afArrayField', function afArrayFieldHelper() {
  throw new Error('Use the syntax {{> afArrayField name="name"}} rather than {{afArrayField "name"}}');
});

Template.afArrayField.innerContext = function (options) {
  var c = Utility.normalizeContext(options.hash, "afArrayField");
  var name = c.atts.name;
  var fieldMinCount = c.atts.minCount || 0;
  var fieldMaxCount = c.atts.maxCount || Infinity;
  var ss = c.af.ss;
  var formId = c.af.formId;

  // Init the array tracking for this field
  var docCount = fd.getDocCountForField(formId, name);
  arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount);

  return {
    atts: c.atts,
    autoform: c.afc
  };
};

/*
 * afObjectField
 */

UI.registerHelper('afObjectField', function afObjectFieldHelper() {
  throw new Error('Use the syntax {{> afObjectField name="name"}} rather than {{afObjectField "name"}}');
});

/*
 * afQuickField
 */

UI.registerHelper('afQuickField', function afQuickFieldHelper() {
  throw new Error('Use the new syntax {{> afQuickField name="name"}} rather than {{afQuickField "name"}}');
});

function quickFieldLabelAtts(context, autoform) {
  // Remove unwanted props from the hash
  context = _.omit(context, 'label');

  // Separate label options from input options; label items begin with "label-"
  var labelContext = {
    name: context.name,
    template: context.template,
    autoform: autoform
  };
  _.each(context, function autoFormLabelContextEach(val, key) {
    if (key.indexOf("label-") === 0) {
      labelContext[key.substring(6)] = val;
    }
  });

  return labelContext;
}

function quickFieldInputAtts(context, autoform) {
  // Remove unwanted props from the hash
  context = _.omit(context, 'label');

  // Separate label options from input options; label items begin with "label-"
  var inputContext = {autoform: autoform};
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

  var labelAtts = quickFieldLabelAtts(c.atts, c.afc);
  var inputAtts = quickFieldInputAtts(c.atts, c.afc);

  return {
    skipLabel: (c.atts.label === false || (c.defs.type === Boolean && !("select" in c.atts) && !("radio" in c.atts))),
    afFieldLabelAtts: labelAtts,
    afFieldInputAtts: inputAtts,
    atts: {name: inputAtts.name, autoform: inputAtts.autoform}
  };
};

Template.afQuickField.isGroup = function afQuickFieldIsGroup(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");
  // Render a group of fields if we expect an Object
  return (c.defs.type === Object);
};

Template.afQuickField.isFieldArray = function afQuickFieldIsFieldArray(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");

  // Render an array of fields if we expect an Array and we don't have options
  return (c.defs.type === Array && !c.atts.options);
};

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
  var doc = getFieldsValues(template.$("[data-schema-key]").not("[disabled]"));

  // Expand the object
  doc = Utility.expandObj(doc);

  // As array items are removed, gaps can appear in the numbering,
  // which results in arrays that have undefined items. Here we
  // remove any array items that are undefined.
  Utility.compactArrays(doc);

  // Pass expanded doc through formToDoc hooks
  var transforms = Hooks.getHooks(formId, 'formToDoc');
  _.each(transforms, function formValuesTransform(transform) {
    doc = transform(doc, ss, formId);
  });

  // We return doc, insertDoc, and updateDoc.
  // For insertDoc, delete any properties that are null, undefined, or empty strings.
  // For updateDoc, convert to modifier object with $set and $unset.
  // Do not add auto values to either.
  var result = {
    insertDoc: ss.clean(Utility.cleanNulls(doc), {
      isModifier: false,
      getAutoValues: false
    }),
    updateDoc: ss.clean(Utility.docToModifier(doc), {
      isModifier: true,
      getAutoValues: false
    })
  };
  return result;
};

/*
 * Gets the value that should be shown/selected in the input. Returns
 * a string or an array of strings. The value used,
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

  // We return either a string or an array of strings
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
    value = (value === "true") ? true : false;

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
  var max = (typeof defs.max === "function") ? defs.max() : defs.max;

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
  } else if (schemaType === String && (atts.rows || max >= 150)) {
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

function _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (!template || template._notInDOM) {
    return; //skip validation
  }

  var context = template.data;
  var formId = context.id || defaultFormId;
  var ss = Utility.getSimpleSchemaFromContext(context, formId);

  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  var form = getFormValues(template, formId, ss);

  // Clean and validate doc
  if (context.type === "update") {
    var docToValidate = form.updateDoc;
    var isModifier = true;
  } else {
    var docToValidate = form.insertDoc;
    var isModifier = false;
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !Utility.objAffectsKey(docToValidate, key))
    return; //skip validation

  var userId = (Meteor.userId && Meteor.userId()) || null;

  // getFormValues did some cleaning but didn't add auto values; add them now
  ss.clean(docToValidate, {
    isModifier: isModifier,
    filter: false,
    autoConvert: false,
    extendAutoValueContext: {
      userId: userId,
      isInsert: !isModifier,
      isUpdate: isModifier,
      isUpsert: false,
      isFromTrustedCode: false
    }
  });
  return ss.namedContext(formId).validateOne(docToValidate, key, {
    modifier: isModifier,
    extendedCustomContext: {
      userId: userId,
      isInsert: !isModifier,
      isUpdate: isModifier,
      isUpsert: false,
      isFromTrustedCode: false
    }
  });
}

//throttling function that calls out to _validateField
var vok = {}, tm = {};
validateField = function validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (vok[key] === false) {
    Meteor.clearTimeout(tm[key]);
    tm[key] = Meteor.setTimeout(function() {
      vok[key] = true;
      _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid);
    }, 300);
    return;
  }
  vok[key] = false;
  _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid);
};

updateTrackedFieldValue = function updateTrackedFieldValue(formId, key, val) {
  formValues[formId] = formValues[formId] || {};
  formValues[formId][key] = formValues[formId][key] || {_deps: new Deps.Dependency};
  formValues[formId][key]._val = val;
  formValues[formId][key]._deps.changed();
};