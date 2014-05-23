var defaultFormId = "_afGenericID";
var formPreserve = new FormPreserve("autoforms");
var formData = {}; //for looking up autoform data by form ID
var templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues
var arrayFields = {}; //track # of array fields per form
var formValues = {}; //for reactive show/hide based on current value of a field

AutoForm = {}; //exported

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
        onError: []
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

  formData[formId] && formData[formId].ss && formData[formId].ss.namedContext(formId).resetValidation();
  // If simpleSchema is undefined, we haven't yet rendered the form, and therefore
  // there is no need to reset validation for it. No error need be thrown.
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
  return getTrackedFieldValue(formId, fieldName);
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
function afGenericGetTemplate(templateType, templateName) {
  var result;

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
      copy = func(copy);
    });
    // Create a "flat doc" that can be used to easily get values for corresponding
    // form fields.
    mDoc = new MongoObject(copy);
  }

  // Set up the context to be used for everything within the autoform.
  var innerContext = {_af: {
    formId: formId,
    collection: collection,
    ss: ss,
    doc: context.doc,
    mDoc: mDoc,
    validationType: context.validation || "submitThenKeyup",
    submitType: context.type,
    resetOnSuccess: context.resetOnSuccess
  }};

  // Cache context for lookup by formId
  formData[formId] = innerContext._af;

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
  if (arrayFields[formId]) {
    delete arrayFields[formId];
  }

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

Template.quickForm.qfContext = function quickFormContext(atts) {
  // Pass along quickForm context to autoForm context, minus a few
  // properties that are specific to quickForms.
  var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

  return _.extend({
    qfFormFields: qfFormFields,
    qfNeedsButton: qfNeedsButton,
    qfAutoFormContext: qfAutoFormContext
  }, atts);
};

function qfFormFields() {
  var context = this;
  var ss = context._af.ss;

  // Get the list of fields we want included
  var fieldList;
  if (context.fields) {
    fieldList = context.fields;
    if (typeof fieldList === "string") {
      fieldList = fieldList.replace(/ /g, '').split(',');
    }
    if (!_.isArray(fieldList)) {
      throw new Error('AutoForm: fields attribute must be an array or a string containing a comma-delimited list of fields');
    }
  } else {
    // If we weren't given a fieldList, use all first level schema keys by default
    fieldList = ss.firstLevelSchemaKeys() || [];
  }

  // If user wants to omit some fields, remove those from the array
  if (context.omitFields) {
    var omitFields = stringToArray(context.omitFields);
    if (!_.isArray(omitFields)) {
      throw new Error('AutoForm: omitFields attribute must be an array or a string containing a comma-delimited list of fields');
    }
    fieldList = _.difference(fieldList, omitFields);
  }
  return quickFieldFormFields(fieldList, context._af, true);
}

function quickFieldFormFields(fieldList, afContext, useAllowedValuesAsOptions) {
  var ss = afContext.ss;
  var addedFields = [];

  // Filter out fields we truly don't want
  fieldList = _.filter(fieldList, function shouldIncludeField(field) {
    var fieldDefs = ss.schema(field);

    // Don't include fields with denyInsert=true when it's an insert form
    if (fieldDefs.denyInsert && afContext.submitType === "insert")
      return false;

    // Don't include fields with denyUpdate=true when it's an update form
    if (fieldDefs.denyUpdate && afContext.submitType === "update")
      return false;

    return true;
  });

  // If we've filtered out all fields, we're done
  if (!fieldList || !fieldList.length)
    return [];

  // Define extra properties to be added to all fields
  var extendedAtts = {
    autoform: {_af: afContext}
  };

  if (afContext.submitType === "disabled") {
    extendedAtts.disabled = "";
  } else if (afContext.submitType === "readonly") {
    extendedAtts.readonly = "";
  }

  // Define a function to get the necessary info for each requested field
  function infoForField(field, extendedProps) {

    // Ensure fields are not added more than once
    if (_.contains(addedFields, field))
      return;

    // Get schema definitions for this field
    var fieldDefs = ss.schema(field);

    var info = {name: field};

    // If there are allowedValues defined, use them as select element options
    if (useAllowedValuesAsOptions) {
      var av = fieldDefs.type === Array ? ss.schema(field + ".$").allowedValues : fieldDefs.allowedValues;
      if (_.isArray(av)) {
        info.options = "allowed";
      }
    }

    addedFields.push(field);

    // Return the field info along with the extra properties that
    // all fields should have
    return _.extend(info, extendedProps);
  }

  // Return info for all requested fields
  return _.map(fieldList, function autoFormFormFieldsListEach(field) {
    return infoForField(field, extendedAtts);
  });
}

function qfNeedsButton() {
  var context = this;
  var needsButton = true;

  switch (context._af.submitType) {
    case "readonly":
    case "disabled":
      needsButton = false;
      break;
    default:
      needsButton = true;
      break;
  }

  return needsButton;
}

/*
 * afFieldLabel
 */

UI.registerHelper('afFieldLabel', function afFieldLabelHelper() {
  throw new Error('Use the new syntax {{> afFieldLabel name="name"}} rather than {{afFieldLabel "name"}}');
});

function getLabel() {
  var c = Utility.normalizeContext(this, "afFieldLabel");
  return c.af.ss.label(c.atts.name);
}

Template.afFieldLabel.labelContext = function getLabelContext(autoform, atts) {
  return {
    autoform: autoform,
    atts: atts,
    label: getLabel
  };
};

/*
 * afFieldSelect
 */

UI.registerHelper('afFieldSelect', function afFieldSelectHelper() {
  throw new Error('Use the new syntax {{> afFieldSelect name="name"}} rather than {{afFieldSelect "name"}}');
});

Template.afFieldSelect.inputContext = function afFieldSelectInputContext(options) {
  var ctx = ((options || {}).hash || {});
  var c = ctx.outerContext;
  var iData = getInputData(c.defs, c.atts, c.value, "select", c.ss.label(c.atts.name), c.expectsArray);
  return _.extend({contentBlock: ctx.contentBlock}, iData);
};

/*
 * afFieldInput
 */

UI.registerHelper('afFieldInput', function afFieldInputHelper() {
  throw new Error('Use the new syntax {{> afFieldInput name="name"}} rather than {{afFieldInput "name"}}');
});

Template.afFieldInput.inputOuterContext =
Template.afFieldSelect.inputOuterContext =
function (options) {
  var c = Utility.normalizeContext(options.hash, "afFieldInput");

  var ss = c.af.ss;
  var defs = Utility.getDefs(ss, c.atts.name); //defs will not be undefined

  // Get schema type
  var schemaType = defs.type;
  // Adjust for array fields if necessary
  var expectsArray = false;
  var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
  if (schemaType === Array) {
    defs = ss.schema(c.atts.name + ".$");
    schemaType = defs.type;

    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    expectsArray = !c.atts.type;
  }

  // Get input value
  var value = getInputValue(c.atts.name, c.atts.value, c.af.mDoc, expectsArray, defaultValue);

  // Track field's value for reactive show/hide of other fields by value
  updateTrackedFieldValue(c.af.formId, c.atts.name, value);

  // Get type
  var type = getInputType(c.atts, defs, value);

  // Get template type
  var templateType = getInputTemplateType(c.atts, type, schemaType, expectsArray);

  return {
    defs: defs,
    ss: ss,
    atts: c.atts,
    type: type,
    value: value,
    expectsArray: expectsArray,
    templateType: templateType
  };
};

Template.afFieldInput.inputContext = function (options) {
  var c = ((options || {}).hash || {}).outerContext;
  return getInputData(c.defs, c.atts, c.value, c.type, c.ss.label(c.atts.name), c.expectsArray);
};

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
  var ss = c.af.ss;

  return {
    name: name,
    label: ss.label(name)
  };
};

/*
 * afObjectField
 */

UI.registerHelper('afObjectField', function afObjectFieldHelper() {
  throw new Error('Use the syntax {{> afObjectField name="name"}} rather than {{afObjectField "name"}}');
});

Template.afObjectField.innerContext = function (options) {
  var c = Utility.normalizeContext(options.hash, "afObjectField");
  var name = c.atts.name;
  var ss = c.af.ss;

  // Get list of field names that are descendants of this field's name
  var fields = autoFormChildKeys(ss, name);

  // Tack child field name on to end of parent field name. This
  // ensures that we keep the desired array index for array items.
  fields = _.map(fields, function (field) {
    return name + "." + field;
  });

  // Get rid of nested fields specified in omitFields
  if(typeof c.afc.omitFields !== "undefined"){
    var omitFields = stringToArray(c.afc.omitFields);
    fields = _.reject(fields,function(f){
       return _.contains(omitFields,SimpleSchema._makeGeneric(f))
    });
  }
  var formFields = quickFieldFormFields(fields, c.af, true);

  return {
    fields: formFields,
    label: ss.label(name)
  };
};

function stringToArray(s){
  if (typeof s === "string") {
    return s.replace(/ /g, '').split(',');
  }else{
    return s;
  }
};

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
  var defs = Utility.getDefs(ss, c.atts.name); //defs will not be undefined

  return {
    skipLabel: (c.atts.label === false || (defs.type === Boolean && !("select" in c.atts) && !("radio" in c.atts))),
    afFieldLabelAtts: labelAtts,
    afFieldInputAtts: inputAtts,
    atts: {name: inputAtts.name, autoform: inputAtts.autoform}
  };
};

Template.afQuickField.isGroup = function afQuickFieldIsGroup(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");
  var ss = c.af.ss;
  var defs = Utility.getDefs(ss, c.atts.name); //defs will not be undefined

  return (defs.type === Object);
};

Template.afQuickField.isFieldArray = function afQuickFieldIsFieldArray(options) {
  var c = Utility.normalizeContext(options.hash, "afQuickField");
  var ss = c.af.ss;
  var defs = Utility.getDefs(ss, c.atts.name); //defs will not be undefined

  // Render an array of fields if we expect an array and we don't have options
  return (defs.type === Array && !c.atts.options);
};

/*
 * afEachArrayItem
 */

Template.afEachArrayItem.innerContext = function afEachArrayItemInnerContext(name, af) {
  if (!af || !af._af) {
    throw new Error(name + " must be used within an autoForm block");
  }

  var afContext = af._af;
  var arrayCount = arrayFieldCount(afContext.formId, name);
  if (afContext.mDoc) {
    var keyInfo = afContext.mDoc.getInfoForKey(name);
    if (keyInfo && _.isArray(keyInfo.value)) {
      arrayCount = Math.max(arrayCount, keyInfo.value.length);
    }
  }

  var ss = afContext.ss;

  // If this is an array of objects, collect names of object props
  var childKeys = [];
  if (ss.schema(name + '.$').type === Object) {
    childKeys = autoFormChildKeys(ss, name + '.$');
  }

  var loopArray = [];
  for (var i = 0; i < arrayCount; i++) {
    var loopCtx = {name: name + '.' + i, index: i};

    // If this is an array of objects, add child key names under loopCtx.current[childName] = fullKeyName
    if (childKeys.length) {
      loopCtx.current = {};
      _.each(childKeys, function (k) {
        loopCtx.current[k] = name + '.' + i + '.' + k;
      });
    }

    loopArray.push(loopCtx);
  };

  return loopArray;
};

/*
 * afFieldMessage
 */

UI.registerHelper('afFieldMessage', function autoFormFieldMessage(options) {
  //help users transition from positional name arg
  if (typeof options === "string") {
    throw new Error('Use the new syntax {{afFieldMessage name="name"}} rather than {{afFieldMessage "name"}}');
  }

  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || this && this._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error("afFieldMessage helper must be used within an autoForm block");
  }

  Utility.getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return ss.namedContext(afContext.formId).keyErrorMessage(hash.name);
});

/*
 * afFieldIsInvalid
 */

UI.registerHelper('afFieldIsInvalid', function autoFormFieldIsInvalid(options) {
  //help users transition from positional name arg
  if (typeof options === "string") {
    throw new Error('Use the new syntax {{#if afFieldIsInvalid name="name"}} rather than {{#if afFieldIsInvalid "name"}}');
  }

  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || this && this._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error("afFieldIsInvalid helper must be used within an autoForm block");
  }

  Utility.getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return ss.namedContext(afContext.formId).keyIsInvalid(hash.name);
});

/*
 * afFieldValueIs
 */

UI.registerHelper('afFieldValueIs', function autoFormFieldValueIs(options) {
  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || this && this._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error("afFieldValueIs helper must be used within an autoForm block");
  }

  Utility.getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return getTrackedFieldValue(afContext.formId, hash.name) === hash.value;
});

/*
 * afFieldValueContains
 */

UI.registerHelper('afFieldValueContains', function autoFormFieldValueContains(options) {
  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || this && this._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error("afFieldValueContains helper must be used within an autoForm block");
  }

  Utility.getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  var currentValue = getTrackedFieldValue(afContext.formId, hash.name);
  return _.isArray(currentValue) && _.contains(currentValue, hash.value);
});

/*
 * Events
 */

function doBefore(docId, doc, hooks, name) {
  _.each(hooks, function doBeforeHook(hook) {
    if (hook) {
      if (docId) {
        doc = hook(docId, doc);
      } else {
        doc = hook(doc);
      }
      if (!_.isObject(doc)) {
        throw new Error(name + " must return an object");
      }
    }
  });
  return doc;
}

Template.autoForm.events({
  'submit form': function autoFormSubmitHandler(event, template) {
    var submitButton = template.find("button[type=submit]") || template.find("input[type=submit]");
    if (!submitButton) {
      return;
    }

    submitButton.disabled = true;

    //determine what we want to do
    var context = this;
    var isInsert = (context.type === "insert");
    var isUpdate = (context.type === "update");
    var isRemove = (context.type === "remove");
    var isMethod = (context.type === "method");
    var isNormalSubmit = (!isInsert && !isUpdate && !isRemove && !isMethod);
    var method = context.meteormethod;

    //init
    var validationType = context.validation || "submitThenKeyup";
    var formId = context.id || defaultFormId;
    var collection = Utility.lookup(context.collection);
    var ss = Utility.getSimpleSchemaFromContext(context, formId);
    var currentDoc = context.doc || null;
    var docId = currentDoc ? currentDoc._id : null;
    var resetOnSuccess = context.resetOnSuccess;

    // Gather hooks
    var beforeInsert = Hooks.getHooks(formId, 'before', 'insert');
    var beforeUpdate = Hooks.getHooks(formId, 'before', 'update');
    var beforeRemove = Hooks.getHooks(formId, 'before', 'remove');
    var beforeMethod = method && Hooks.getHooks(formId, 'before', method);
    var afterInsert = Hooks.getHooks(formId, 'after', 'insert');
    var afterUpdate = Hooks.getHooks(formId, 'after', 'update');
    var afterRemove = Hooks.getHooks(formId, 'after', 'remove');
    var afterMethod = method && Hooks.getHooks(formId, 'after', method);
    var onSuccess = Hooks.getHooks(formId, 'onSuccess');
    var onError = Hooks.getHooks(formId, 'onError');
    var onSubmit = Hooks.getHooks(formId, 'onSubmit');

    // Prevent browser form submission if we're planning to do our own thing
    if (!isNormalSubmit) {
      event.preventDefault();
    }

    // Prep haltSubmission function
    function haltSubmission() {
      event.preventDefault();
      event.stopPropagation();
      submitButton.disabled = false;
    }

    // Prep function to select the focus the first field with an error
    function selectFirstInvalidField() {
      var ctx = ss.namedContext(formId);
      if (!ctx.isValid()) {
        _.every(template.findAll('[data-schema-key]'), function selectFirstInvalidFieldEvery(input) {
          if (ctx.keyIsInvalid(input.getAttribute('data-schema-key'))) {
            input.focus();
            return false;
          } else {
            return true;
          }
        });
      }
    }

    // Prep reset form function
    function autoFormDoResetForm() {
      if (!template._notInDOM) {
        template.find("form").reset();
        var focusInput = template.find("[autofocus]");
        focusInput && focusInput.focus();
      }
    }

    // Prep callback creator function
    function makeCallback(name, afterHook) {
      return function autoFormActionCallback(error, result) {
        if (error) {
          selectFirstInvalidField();
          _.each(onError, function onErrorEach(hook) {
            hook(name, error, template);
          });
        } else {
          // By default, we reset form after successful submit, but
          // you can opt out.
          if (resetOnSuccess !== false) {
            autoFormDoResetForm();
          }
          _.each(onSuccess, function onSuccessEach(hook) {
            hook(name, result, template);
          });
        }
        _.each(afterHook, function afterHookEach(hook) {
          hook(error, result, template);
        });
        submitButton.disabled = false;
      };
    }

    // If type is "remove", do that right away since we don't need to gather
    // form values or validate.
    if (isRemove) {
      // Call beforeRemove hooks if present, and stop if any return false
      var shouldStop = _.any(beforeRemove, function eachBeforeRemove(hook) {
        return (hook(docId) === false);
      });
      if (shouldStop) {
        return haltSubmission();
      }
      if(!collection) {
          throw new Error("AutoForm: You must specify a collection when form type is remove.");
      }
      collection.remove(docId, makeCallback('remove', afterRemove));
      return;
    }

    // Gather all form values
    var form = getFormValues(template, formId, ss);

    // Execute some before hooks
    var insertDoc = isInsert ? doBefore(null, form.insertDoc, beforeInsert, 'before.insert hook') : form.insertDoc;
    var updateDoc = isUpdate && !_.isEmpty(form.updateDoc) ? doBefore(docId, form.updateDoc, beforeUpdate, 'before.update hook') : form.updateDoc;

    // Get a version of the doc that has auto values to validate here. We
    // don't want to actually send any auto values to the server because
    // we ultimately want them generated on the server
    var insertDocForValidation = ss.clean(_.clone(insertDoc), {
      filter: false,
      autoConvert: false,
      extendAutoValueContext: {
        userId: (Meteor.userId && Meteor.userId()) || null,
        isInsert: true,
        isUpdate: false,
        isUpsert: false,
        isFromTrustedCode: false
      }
    });

    // Prep isValid function
    var validationErrorTriggered = 0;
    function isValid(doc, isModifier, type) {
      var result = validationType === 'none' || ss.namedContext(formId).validate(doc, {
        modifier: isModifier,
        extendedCustomContext: {
          userId: (Meteor.userId && Meteor.userId()) || null,
          isInsert: !isModifier,
          isUpdate: !!isModifier,
          isUpsert: false,
          isFromTrustedCode: false
        }
      });
      if (!result && !validationErrorTriggered) {
        selectFirstInvalidField();
        _.each(onError, function onErrorEach(hook) {
          hook(type, new Error('failed validation'), template);
        });
        validationErrorTriggered++;
      }
      return result;
    }

    // Perform validation for onSubmit call or for normal form submission
    if (((onSubmit.length > 0) || isNormalSubmit) && !isValid(insertDocForValidation, false, 'pre-submit validation')) {
      return haltSubmission();
    }

    // Call onSubmit
    if (onSubmit.length > 0) {
      var context = {
        event: event,
        template: template,
        resetForm: autoFormDoResetForm
      };
      // Pass both types of doc to onSubmit
      var shouldStop = _.any(onSubmit, function eachOnSubmit(hook) {
        return (hook.call(context, insertDoc, updateDoc, currentDoc) === false);
      });
      if (shouldStop) {
        return haltSubmission();
      }
    }

    // Now we will do the requested insert, update, remove, method, or normal
    // browser form submission. Even though we may have already validated above
    // if we have an onSubmit hook, we do it again upon insert or update
    // because collection2 validation catches additional stuff like unique and
    // because our form schema need not be the same as our collection schema.
    if (isInsert) {
      if(!collection) {
         throw new Error("AutoForm: You must specify a collection when form type is insert.");
      }
      collection.insert(insertDoc, {validationContext: formId}, makeCallback('insert', afterInsert));
    } else if (isUpdate) {
      var updateCallback = makeCallback('update', afterUpdate);
      if (_.isEmpty(updateDoc)) {
        // Nothing to update. Just treat it as a successful update.
        updateCallback(null, 0);
      } else {
        if(!collection) {
          throw new Error("AutoForm: You must specify a collection when form type is update.");
        }
        collection.update(docId, updateDoc, {validationContext: formId}, updateCallback);
      }
    }

    // We won't do an else here so that a method could be called in
    // addition to another action on the same submit
    if (method) {
      var methodDoc = doBefore(null, form.insertDoc, beforeMethod, 'before.method hook');
      // Get a copy of the doc with auto values added to use for validation
      var methodDocForValidation = ss.clean(_.clone(methodDoc), {
        filter: false,
        autoConvert: false,
        extendAutoValueContext: {
          userId: (Meteor.userId && Meteor.userId()) || null,
          isInsert: true, //methodDoc should be treated like insertDoc
          isUpdate: false,
          isUpsert: false,
          isFromTrustedCode: false
        }
      });
      // Validate first
      if (!isValid(methodDocForValidation, false, method)) {
        return haltSubmission();
      }
      Meteor.call(method, methodDoc, form.updateDoc, makeCallback(method, afterMethod));
    }
  },
  'keyup [data-schema-key]': function autoFormKeyUpHandler(event, template) {
    var validationType = template.data.validation || 'submitThenKeyup';
    var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup');
    var skipEmpty = !(event.keyCode === 8 || event.keyCode === 46); //if deleting or backspacing, don't skip empty
    if ((validationType === 'keyup' || validationType === 'submitThenKeyup')) {
      validateField(event.currentTarget.getAttribute("data-schema-key"), template, skipEmpty, onlyIfAlreadyInvalid);
    }
  },
  'blur [data-schema-key]': function autoFormBlurHandler(event, template) {
    var validationType = template.data.validation || 'submitThenKeyup';
    var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
    if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
      validateField(event.currentTarget.getAttribute("data-schema-key"), template, false, onlyIfAlreadyInvalid);
    }
  },
  'change form': function autoFormChangeHandler(event, template) {
    var key = event.target.getAttribute("data-schema-key");
    if (!key)
      return;

    var formId = this.id;
    var data = formData[formId];
    if (data && data.ss) {
      var ss = data.ss;
      formPreserve.registerForm(formId, function autoFormRegFormCallback() {
        return getFormValues(template, formId, ss).insertDoc;
      });

      // Get field's value for reactive show/hide of other fields by value
      updateTrackedFieldValue(formId, key, getFieldValue(template, key));
    }
    var validationType = data.validationType || 'submitThenKeyup';
    var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
    if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
      validateField(key, template, false, onlyIfAlreadyInvalid);
    }
  },
  'reset form': function autoFormResetHandler(event, template) {
    var context = this;
    var formId = context.id || defaultFormId;
    AutoForm.resetForm(formId);
    if (context.doc) {
      //reload form values from doc
      event.preventDefault();
      template['__component__'].render();
    }
  },
  'click .autoform-remove-item': function autoFormClickRemoveItem(event, template) {
    var self = this;

    event.preventDefault();

    var button = template.$(event.currentTarget);
    var name = button.attr('data-autoform-field');
    var index = self.index;
    var data = template.data;
    var formId = data && data.id || defaultFormId;
    var fData = formData[formId];
    if (!fData) {
      throw new Error('AutoForm: Can\'t find form data for form with ID "' + formId + '"');
    }

    //if update, make sure we remove from source doc so that values are correct
    //XXX seems not necessary but do further testing
    // var mDoc = fData.mDoc;
    // if (mDoc) {
    //   var keyInfo = mDoc.getInfoForKey(name);
    //   if (keyInfo && _.isArray(keyInfo.value)) {
    //     var newArray = _.reject(keyInfo.value, function (v, i) {
    //       return (i === index);
    //     });
    //     mDoc.setValueForKey(name, newArray);
    //   }
    // }

    var thisItem = button.closest('.autoform-array-item');
    var itemCount = thisItem.siblings('.autoform-array-item').length + 1;
    var minCount = getMinMax(formId, name).minCount;

    // remove the item we clicked
    if (itemCount > minCount) {
      thisItem.remove();
      removeArrayField(formId, name);
    }
  },
  'click .autoform-add-item': function autoFormClickAddItem(event, template) {
    event.preventDefault();

    var button = template.$(event.currentTarget);
    var name = button.attr('data-autoform-field');
    var data = template.data;
    var formId = data && data.id || defaultFormId;

    var thisItem = button.closest('.autoform-array-item');
    var itemCount = thisItem.siblings('.autoform-array-item').length + 1;
    addArrayField(formId, name);
  }
});

/*
 * Private Helper Functions
 */

function getFieldsValues(fields) {
  var doc = {};
  _.each(fields, function formValuesEach(field) {
    var name = field.getAttribute("data-schema-key");
    var val = field.value || field.getAttribute('contenteditable') && field.innerHTML; //value is undefined for contenteditable
    var type = field.getAttribute("type") || "";
    type = type.toLowerCase();
    var tagName = field.tagName || "";
    tagName = tagName.toLowerCase();

    // Handle select
    if (tagName === "select") {
      if (val === "true") { //boolean select
        doc[name] = true;
      } else if (val === "false") { //boolean select
        doc[name] = false;
      } else if (field.hasAttribute("multiple")) {
        //multiple select, so we want an array value
        doc[name] = Utility.getSelectValues(field);
      } else {
        doc[name] = val;
      }
      return;
    }

    // Handle checkbox
    if (type === "checkbox") {
      if (val === "true") { //boolean checkbox
        doc[name] = field.checked;
      } else { //array checkbox
        // Add empty array no matter what,
        // to ensure that unchecking all boxes
        // will empty the array.
        if (!_.isArray(doc[name])) {
          doc[name] = [];
        }
        // Add the value to the array only
        // if checkbox is selected.
        field.checked && doc[name].push(val);
      }
      return;
    }

    // Handle radio
    if (type === "radio") {
      if (field.checked) {
        if (val === "true") { //boolean radio
          doc[name] = true;
        } else if (val === "false") { //boolean radio
          doc[name] = false;
        } else {
          doc[name] = val;
        }
      }
      return;
    }

    // Handle number
    if (type === "select") {
      doc[name] = Utility.maybeNum(val);
      return;
    }

    // Handle date inputs
    if (type === "date") {
      if (Utility.isValidDateString(val)) {
        //Date constructor will interpret val as UTC and create
        //date at mignight in the morning of val date in UTC time zone
        doc[name] = new Date(val);
      } else {
        doc[name] = null;
      }
      return;
    }

    // Handle date inputs
    if (type === "datetime") {
      val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
      if (Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
        //Date constructor will interpret val as UTC due to ending "Z"
        doc[name] = new Date(val);
      } else {
        doc[name] = null;
      }
      return;
    }

    // Handle date inputs
    if (type === "datetime-local") {
      val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
      var offset = field.getAttribute("data-offset") || "Z";
      if (Utility.isValidNormalizedLocalDateAndTimeString(val)) {
        doc[name] = new Date(val + offset);
      } else {
        doc[name] = null;
      }
      return;
    }

    // Handle all other inputs
    doc[name] = val;
  });

  return doc;
}

function getFieldValue(template, key) {
  var doc = getFieldsValues(template.$('[data-schema-key="' + key + '"]'));
  return doc && doc[key];
}

function getFormValues(template, formId, ss) {
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
    doc = transform(doc);
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
}

function getInputValue(name, value, mDoc, expectsArray, defaultValue) {
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

  function stringValue(val, skipDates) {
    if (val instanceof Date) {
      if (skipDates) {
        return val;
      } else {
        return Utility.dateToDateStringUTC(val);
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
    // We will convert dates to a string later, after we
    // know what the field type will be.
    // Convert everything else to a string now.
    value = stringValue(value, true);
  }

  // We return either a string, an array of strings, or an instance of Date
  return value;
}

function getInputData(defs, hash, value, type, label, expectsArray) {
  var schemaType = defs.type;

  var min = (typeof defs.min === "function") ? defs.min() : defs.min;
  var max = (typeof defs.max === "function") ? defs.max() : defs.max;

  if (type === "datetime-local") {
    hash["data-offset"] = hash.offset || "Z";
  }

  //convert Date value to required string value based on field type
  if (value instanceof Date) {
    if (type === "date") {
      value = Utility.dateToDateStringUTC(value);
    } else if (type === "datetime") {
      value = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(value);
    } else if (type === "datetime-local") {
      value = Utility.dateToNormalizedLocalDateAndTimeString(value, hash["data-offset"]);
    }
  }

  // Extract settings from hash
  var firstOption = hash.firstOption;
  var radio = hash.radio;
  var select = hash.select;
  var noselect = hash.noselect;
  var trueLabel = hash.trueLabel;
  var falseLabel = hash.falseLabel;
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

  // Set placeholder to label from schema if requested
  if (hash.placeholder === "schemaLabel") {
    hash.placeholder = label;
  }

  // Determine what options to use
  var data = {};

  // Add name to every type of element
  data.name = hash.name;

  data.expectsArray = expectsArray;

  // Clean hash so that we can add anything remaining as attributes
  hash = _.omit(hash,
          "name",
          "autoform",
          "value",
          "data-schema-key",
          "firstOption",
          "radio",
          "select",
          "noselect",
          "trueLabel",
          "falseLabel",
          "options",
          "offset",
          "template");

  // Add required to every type of element, if required
  if (typeof hash.required === "undefined" && !defs.optional) {
    hash.required = "";
  }

  if (selectOptions) {
    // Build anything that should be a select, which is anything with options
    data.items = [];
    _.each(selectOptions, function(opt) {
      var selected = expectsArray ? _.contains(value, opt.value.toString()) : (opt.value.toString() === value.toString());
      data.items.push({
        name: data.name,
        label: opt.label,
        value: opt.value,
        checked: selected ? "checked" : "",
        selected: selected ? "selected" : "",
        atts: hash
      });
    });
    if (!noselect) {
      hash.autocomplete = "off"; //can fix issues with some browsers selecting the firstOption instead of the selected option
      if (expectsArray) {
        hash.multiple = "";
      }
      data.firstOption = (firstOption && !expectsArray) ? firstOption : "";
      data.cls = hash["class"] || "";
      hash = _.omit(hash, "class");
      data.atts = hash;
    }
  } else if (type === "textarea") {
    if (typeof hash.maxlength === "undefined" && typeof max === "number") {
      hash.maxlength = max;
    }
    data.cls = hash["class"] || "";
    hash = _.omit(hash, "class");
    data.atts = hash;
    data.value = value;
  } else if (type === "contenteditable") {
    if (typeof hash['data-maxlength'] === "undefined" && typeof max === "number") {
      hash['data-maxlength'] = max;
    }
    data.atts = hash;
    data.value = value;
  } else if (type === "boolean") {
    value = (value === "true") ? true : false;
    var items = [
      {
        name: data.name,
        value: "false",
        checked: !value ? "checked" : "",
        selected: !value ? "selected" : "",
        label: falseLabel
      },
      {
        name: data.name,
        value: "true",
        checked: value ? "checked" : "",
        selected: value ? "selected" : "",
        label: trueLabel
      }
    ];
    if (radio) {
      data.items = items;
      data.items[0].atts = hash;
      data.items[1].atts = hash;
    } else if (select) {
      data.items = items;
      data.cls = hash["class"] || "";
      hash = _.omit(hash, "class");
      data.atts = hash;
    } else {
      //don't add required attribute to this one because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
      delete hash.required;
      data.label = label;
      data.value = "true";
      data.checked = value ? "checked" : "";
      data.atts = hash;
    }
  } else {
    // All other input types
    switch (type) {
      case "number":
        if (typeof hash.max === "undefined" && typeof max === "number") {
          hash.max = max;
        }
        if (typeof hash.min === "undefined" && typeof min === "number") {
          hash.min = min;
        }
        if (typeof hash.step === "undefined" && defs.decimal) {
          hash.step = '0.01';
        }
        break;
      case "date":
        if (typeof hash.max === "undefined" && max instanceof Date) {
          hash.max = Utility.dateToDateStringUTC(max);
        }
        if (typeof hash.min === "undefined" && min instanceof Date) {
          hash.min = Utility.dateToDateStringUTC(min);
        }
        break;
      case "datetime":
        if (typeof hash.max === "undefined" && max instanceof Date) {
          hash.max = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(max);
        }
        if (typeof hash.min === "undefined" && min instanceof Date) {
          hash.min = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(min);
        }
        break;
      case "datetime-local":
        if (typeof hash.max === "undefined" && max instanceof Date) {
          hash.max = Utility.dateToNormalizedLocalDateAndTimeString(max, hash["data-offset"]);
        }
        if (typeof hash.min === "undefined" && min instanceof Date) {
          hash.min = Utility.dateToNormalizedLocalDateAndTimeString(min, hash["data-offset"]);
        }
        break;
    }

    if (typeof hash.maxlength === "undefined"
            && typeof max === "number"
            && _.contains(["text", "email", "search", "password", "tel", "url"], type)
            ) {
      hash.maxlength = max;
    }

    data.type = type;
    data.value = value;
    data.cls = hash["class"] || "";
    hash = _.omit(hash, "class");
    data.atts = hash;
  }

  return data;
}

function getInputType(hash, defs, value) {
  var schemaType = defs.type;
  var valHasLineBreaks = typeof value === "string" ? (value.indexOf("\n") !== -1) : false;
  var max = (typeof defs.max === "function") ? defs.max() : defs.max;

  var type = "text";
  if (hash.type) {
    type = hash.type;
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Email) {
    type = "email";
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Url) {
    type = "url";
  } else if (schemaType === String && (hash.rows || valHasLineBreaks || max >= 150)) {
    type = "textarea";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    type = "boolean";
  }
  return type;
}

function getInputTemplateType(atts, type, schemaType, expectsArray) {
  // Extract settings from attributes
  var radio = atts.radio;
  var select = atts.select;
  var noselect = atts.noselect;
  var selectOptions = atts.options;

  // Determine which template to render
  var templateType;
  if (selectOptions) {
    if (noselect) {
      if (expectsArray) {
        templateType = "afCheckboxGroup";
      } else {
        templateType = "afRadioGroup";
      }
    } else {
      templateType = "afSelect";
    }
  } else if (type === "textarea") {
    templateType = "afTextarea";
  } else if (type === "contenteditable") {
    templateType = "afContenteditable";
  } else if (type === "boolean") {
    if (radio) {
      templateType = "afRadioGroup";
    } else if (select) {
      templateType = "afSelect";
    } else {
      templateType = "afCheckbox";
    }
  } else {
    // All other input types
    templateType = "afInput";
  }

  return templateType;
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

    // Skip validation if skipEmpty is true and the field we're validating
    // has no value.
    if (skipEmpty && !Utility.objAffectsKey(form.updateDoc, key))
      return; //skip validation

    // getFormValues did some cleaning but didn't add auto values; add them now
    ss.clean(form.updateDoc, {
      isModifier: true,
      filter: false,
      autoConvert: false,
      extendAutoValueContext: {
        userId: (Meteor.userId && Meteor.userId()) || null,
        isInsert: false,
        isUpdate: true,
        isUpsert: false,
        isFromTrustedCode: false
      }
    });
    ss.namedContext(formId).validateOne(form.updateDoc, key, {
      modifier: true,
      extendedCustomContext: {
        userId: (Meteor.userId && Meteor.userId()) || null,
        isInsert: false,
        isUpdate: true,
        isUpsert: false,
        isFromTrustedCode: false
      }
    });
  } else {

    // Skip validation if skipEmpty is true and the field we're validating
    // has no value.
    if (skipEmpty && !Utility.objAffectsKey(form.insertDoc, key))
      return; //skip validation

    // getFormValues did some cleaning but didn't add auto values; add them now
    ss.clean(form.insertDoc, {
      filter: false,
      autoConvert: false,
      extendAutoValueContext: {
        userId: (Meteor.userId && Meteor.userId()) || null,
        isInsert: true,
        isUpdate: false,
        isUpsert: false,
        isFromTrustedCode: false
      }
    });
    ss.namedContext(formId).validateOne(form.insertDoc, key, {
      modifier: false,
      extendedCustomContext: {
        userId: (Meteor.userId && Meteor.userId()) || null,
        isInsert: true,
        isUpdate: false,
        isUpsert: false,
        isFromTrustedCode: false
      }
    });
  }
}

//throttling function that calls out to _validateField
var vok = {}, tm = {};
function validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
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
}

// Returns schema keys that are direct children of the given schema key
// XXX this could be a method on ss
function autoFormChildKeys(ss, name) {
  name = SimpleSchema._makeGeneric(name);
  var prefix = name + ".";

  var childKeys = [];
  _.each(ss._schemaKeys, function (key) {
    // If it's a direct child, add it to the list
    if (key.indexOf(prefix) === 0) {
      var ending = key.slice(prefix.length);
      if (ending.indexOf('.') === -1) {
        childKeys.push(ending);
      }
    }
  });
  return childKeys;
}

function updateTrackedFieldValue(formId, key, val) {
  formValues[formId] = formValues[formId] || {};
  formValues[formId][key] = formValues[formId][key] || {_deps: new Deps.Dependency};
  formValues[formId][key]._val = val;
  formValues[formId][key]._deps.changed();
}

function getTrackedFieldValue(formId, key) {
  formValues[formId] = formValues[formId] || {};
  formValues[formId][key] = formValues[formId][key] || {_deps: new Deps.Dependency};
  formValues[formId][key]._deps.depend();
  return formValues[formId][key]._val;
}

/*
 * Array Fields Helper Functions
 */

function getMinMax(formId, name) {
  var ss = formData[formId] && formData[formId].ss;
  if (!ss) {
    return {minCount: 0};
  }
  var defs = Utility.getDefs(ss, name);
  return {minCount: defs.minCount || 0, maxCount: defs.maxCount};
}

function arrayFieldCount(formId, name) {
  initArrayFieldCount(formId, name);
  arrayFields[formId][name].deps.depend();
  return arrayFields[formId][name].count;
}

function initArrayFieldCount(formId, name) {
  var range = getMinMax(formId, name);

  arrayFields[formId] = arrayFields[formId] || {};
  arrayFields[formId][name] = arrayFields[formId][name] || {};
  arrayFields[formId][name].deps = arrayFields[formId][name].deps || new Deps.Dependency;
  arrayFields[formId][name].removedCount = arrayFields[formId][name].removedCount || 0;
  if (typeof arrayFields[formId][name].count !== "number") {
    arrayFields[formId][name].count = Math.max(1, range.minCount); //respect minCount from schema
    arrayFields[formId][name].deps.changed();
  }
}

function setArrayFieldCount(formId, name, count) {
  initArrayFieldCount(formId, name);

  //respect minCount and maxCount from schema
  var range = getMinMax(formId, name);
  if (range.maxCount) {
    count = Math.min(count, range.maxCount + arrayFields[formId][name].removedCount);
  }
  count = Math.max(count, range.minCount + arrayFields[formId][name].removedCount);

  arrayFields[formId][name].count = count;
  arrayFields[formId][name].deps.changed();
}

function addArrayField(formId, name) {
  initArrayFieldCount(formId, name);
  setArrayFieldCount(formId, name, arrayFields[formId][name].count + 1);
}

function removeArrayField(formId, name) {
  initArrayFieldCount(formId, name);
  arrayFields[formId][name].removedCount++;
  arrayFields[formId][name].deps.changed();
}
