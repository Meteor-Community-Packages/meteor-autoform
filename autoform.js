var defaultFormId = "_afGenericID";
var formPreserve = new FormPreserve("autoforms");
var formSchemas = {}; //keep a reference to simplify resetting validation
var templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues

AutoForm = {};

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
AutoForm.addHooks = function autoFormAddHooks(formIds, hooks) {
  if (typeof formIds === "string") {
    formIds = [formIds];
  }

  // If formIds is null, add global hooks
  if (!formIds) {
    Hooks.addHooksToList(Hooks.global, hooks);
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

      Hooks.addHooksToList(Hooks.form[formId], hooks);
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
AutoForm.hooks = function autoFormHooks(hooks) {
  _.each(hooks, function(hooksObj, formId) {
    AutoForm.addHooks(formId, hooksObj);
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

  var simpleSchema = formSchemas[formId];
  simpleSchema && simpleSchema.namedContext(formId).resetValidation();
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
  afQuickField: null
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
  afQuickField: new Deps.Dependency
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
AutoForm.getFormValues = function (formId) {
  var template = templatesById[formId];
  if (!template || template._notInDOM) {
    throw new Error("getFormValues: There is currently no autoForm template rendered for the form with id " + formId);
  }
  // Get a reference to the SimpleSchema instance that should be used for
  // determining what types we want back for each field.
  var context = template.data;
  var collection = Utility.lookup(context.collection);
  var ss = Utility.lookup(context.schema) || collection && collection.simpleSchema();
  return getFormValues(template, formId, ss);
};

/*
 * Shared
 */

UI.body._af_findAutoForm = function afFindAutoForm(name) {
  var afContext, i = 1;

  do {
    afContext = arguments[i];
    i++;
  } while (afContext && !afContext._af);

  if (!afContext)
    throw new Error(name + " must be used within an autoForm block");

  return afContext;
};

Template.afFieldInput.getTemplate =
Template.afFieldLabel.getTemplate =
Template.afFieldSelect.getTemplate =
Template.afDeleteButton.getTemplate =
Template.afQuickField.getTemplate =
Template.quickForm.getTemplate =
function afGenericGetTemplate(templateType, templateName) {
  // Determine template name
  var template = templateName || AutoForm.getDefaultTemplateForType(templateType) || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use
  var result = Template[templateType + '_' + template];
  if (!result) {
    throw new Error(templateType + ': "' + template + '" is not a valid template name');
  }
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
  return _.omit(context, "schema", "collection", "validation", "doc", "resetOnSuccess");
};

Template.autoForm.innerContext = function autoFormTplInnerContext(outerContext) {
  var context = this;
  var formId = context.id || defaultFormId;

  var collection = Utility.lookup(context.collection);
  check(collection, Match.Optional(Meteor.Collection));

  var ss = Utility.lookup(context.schema) || collection && collection.simpleSchema();
  if (!Match.test(ss, SimpleSchema)) {
    throw new Error("autoForm with id " + formId + " needs either 'schema' or 'collection' attribute");
  }

  // Cache a reference to help with resetting validation later
  formSchemas[formId] = ss;

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
  var innerContext = {_af: {}};
  innerContext._af.formId = formId;
  innerContext._af.collection = collection;
  innerContext._af.ss = ss;
  innerContext._af.doc = context.doc;
  innerContext._af.mDoc = mDoc;
  innerContext._af.validationType = context.validation || "submitThenKeyup";
  innerContext._af.submitType = context.type;
  innerContext._af.resetOnSuccess = context.resetOnSuccess;
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

  // Unregister form preservation
  formPreserve.unregisterForm(formId);
};

/*
 * quickForm
 */

UI.registerHelper('quickForm', function () {
  throw new Error('Use the new syntax {{> quickForm}} rather than {{quickForm}}');
});

Template.quickForm.formFields = function quickFormFields() {
  var context = this;
  var ss = context._af.ss;

  // Get the list of fields we want included
  var fieldList;
  if (context.fields) {
    if (_.isArray(context.fields)) {
      fieldList = context.fields;
    } else if (typeof context.fields === "string") {
      fieldList = context.fields.replace(/ /g, '').split(',');
    }
  }
  fieldList = fieldList || ss.firstLevelSchemaKeys();

  return quickFieldFormFields(fieldList, context._af);
};

function quickFieldFormFields(fieldList, afContext) {
  var ss = afContext.ss;

  function shouldIncludeField(field) {
    var fieldDefs = ss.schema(field);

    // Don't include fields with denyInsert=true when it's an insert form
    if (fieldDefs.denyInsert && afContext.submitType === "insert")
      return false;

    // Don't include fields with denyUpdate=true when it's an update form
    if (fieldDefs.denyUpdate && afContext.submitType === "update")
      return false;

    // Don't include fields with array placeholders
    if (field.indexOf("$") !== -1)
      return false;

    // Don't include fields with more than one level of descendents
    if (field.split(".").length > 2)
      return false;

    return true;
  }

  var addedFields = [];
  function infoForField(field, extendedProps) {

    if (_.contains(addedFields, field))
      return;

    var fieldDefs = ss.schema(field);

    var info;
    if (fieldDefs.type === Object) {
      info = {
        name: field,
        label: ss.label(field)
      };

      var fields = _.filter(ss._schemaKeys, function autoFormFormFieldsSchemaEach(key) {
        if (key.indexOf(field + ".") === 0) {
          return true;
        }
      });

      info.formFields = quickFieldFormFields(fields, afContext);
      addedFields = addedFields.concat(fields);
    } else {
      info = {name: field};
      // If there are allowedValues defined, use them as select element options
      var av = fieldDefs.type === Array ? ss.schema(field + ".$").allowedValues : fieldDefs.allowedValues;
      if (_.isArray(av)) {
        info.options = "allowed";
      }
      addedFields.push(field);
    }

    return _.extend(info, extendedProps);
  }

  // Filter out fields we truly don't want
  fieldList = _.filter(fieldList, shouldIncludeField);

  if (!fieldList || !fieldList.length)
    return [];

  var extendedAtts = {
    autoform: {_af: afContext}
  };

  if (afContext.submitType === "disabled") {
    extendedAtts.disabled = "";
  } else if (afContext.submitType === "readonly") {
    extendedAtts.readonly = "";
  }

  // Return info for all requested fields
  return _.map(fieldList, function autoFormFormFieldsListEach(field) {
    return infoForField(field, extendedAtts);
  });
}

Template.quickForm.needsButton = function autoFormNeedsButton() {
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
};

Template.quickForm.afContext = function autoFormContext() {
  // Pass along quickForm context to autoForm context, minus a few
  // properties that are specific to quickForms.
  return _.omit(this, "buttonContent", "buttonClasses", "fields");
};

// findComponentWithProp = function (id, comp) {
//   while (comp) {
//     if (typeof comp[id] !== 'undefined')
//       return comp;
//     comp = comp.parent;
//   }
//   return null;
// };

// getAutoFormData = function (comp) {
//   comp = findComponentWithProp('data', comp);
//   if (!comp) {
//     return null;
//   }
//   var data = (typeof comp.data === 'function' ? comp.data() : comp.data);
//   if (data._af) {
//     return data;
//   } else if (comp.parent) {
//     return getAutoFormData(comp.parent);
//   } else {
//     return null;
//   }
// };

// Template.afFieldLabel.created = function () {
//   var af = getAutoFormData(this.__component__);
//   if (this.data) {
//     this.data.autoform = af;
//   }
// };

/*
 * afFieldLabel
 */

UI.registerHelper('afFieldLabel', function () {
  throw new Error('Use the new syntax {{> afFieldLabel name="name"}} rather than {{afFieldLabel "name"}}');
});

Template.afFieldLabel.label = function getLabel() {
  var c = Utility.normalizeContext(this, "afFieldLabel");
  return c.af.ss.label(c.atts.name);
};

/*
 * afFieldSelect
 */

UI.registerHelper('afFieldSelect', function () {
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

UI.registerHelper('afFieldInput', function () {
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

  // Get type
  var type = getInputType(c.atts, defs, value);

  // Get template type
  var templateType = getInputTemplateType(c.atts, type, schemaType);

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

UI.registerHelper('afDeleteButton', function () {
  throw new Error('Use the syntax {{> afDeleteButton collection=collection doc=doc}}');
});

Template.afDeleteButton.innerContext = function afDeleteButtonInnerContext(ctx, contentBlock) {
  return _.extend(ctx, {contentBlock: contentBlock});
};

/*
 * afQuickField
 */

UI.registerHelper('afQuickField', function () {
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

  var fields = _.filter(ss._schemaKeys, function autoFormFormFieldsSchemaEach(key) {
    if (key.indexOf(c.atts.name + ".") === 0) {
      return true;
    }
  });

  var formFields = quickFieldFormFields(fields, c.af);
  var labelAtts = quickFieldLabelAtts(c.atts, c.afc);
  var inputAtts = quickFieldInputAtts(c.atts, c.afc);

  var defs = Utility.getDefs(ss, c.atts.name); //defs will not be undefined
  return {
    skipLabel: (c.atts.label === false || (defs.type === Boolean && !("select" in c.atts) && !("radio" in c.atts))),
    afFieldLabelAtts: labelAtts,
    afFieldInputAtts: inputAtts,
    afFieldMessageAtts: {name: inputAtts.name, autoform: inputAtts.autoform},
    afFieldIsInvalidAtts: {name: inputAtts.name, autoform: inputAtts.autoform},
    isGroup: !!(formFields && formFields.length),
    formFields: formFields
  };
};

/*
 * afFieldMessage
 */

UI.body.afFieldMessage = function autoFormFieldMessage(options) {
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
};

/*
 * afFieldIsInvalid
 */

UI.body.afFieldIsInvalid = function autoFormFieldIsInvalid(options) {
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
};

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
    var collection = Utility.lookup(context.collection);
    var ss = Utility.lookup(context.schema) || collection && collection.simpleSchema();
    var formId = context.id || defaultFormId;
    var currentDoc = context.doc || null;
    var docId = currentDoc ? currentDoc._id : null;
    var resetOnSuccess = context.resetOnSuccess;

    if ((isInsert || isUpdate || isRemove) && !collection) {
      throw new Error("AutoForm: You must specify a collection when form type is insert, update, or remove.");
    }

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
      collection.insert(insertDoc, {validationContext: formId}, makeCallback('insert', afterInsert));
    } else if (isUpdate) {
      var updateCallback = makeCallback('update', afterUpdate);
      if (_.isEmpty(updateDoc)) {
        // Nothing to update. Just treat it as a successful update.
        updateCallback(null, 0);
      } else {
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
  'change [data-schema-key]': function autoFormChangeHandler(event, template) {
    var afContext = (this && this.autoform && this.autoform._af) || {};
    if (afContext) {
      var formId = afContext.formId;
      var ss = afContext.ss;
      formId && ss && formPreserve.registerForm(formId, function autoFormRegFormCallback() {
        return getFormValues(template, formId, ss).insertDoc;
      });
    }
    var validationType = template.data.validation || 'submitThenKeyup';
    var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
    if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
      validateField(event.currentTarget.getAttribute("data-schema-key"), template, false, onlyIfAlreadyInvalid);
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
  }
});

/*
 * Private Helper Functions
 */

function getFormValues(template, formId, ss) {
  var fields = template.findAll("[data-schema-key]");
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
      } else if (field.checked) { //array checkbox
        if (!_.isArray(doc[name])) {
          doc[name] = [];
        }
        doc[name].push(val);
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

  // Expand the object
  doc = Utility.expandObj(doc);

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
          "offset");

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

function getInputTemplateType(atts, type, schemaType) {
  // Extract settings from attributes
  var radio = atts.radio;
  var select = atts.select;
  var noselect = atts.noselect;
  var selectOptions = atts.options;
  var expectsArray = (schemaType === Array && !atts.type)

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
  var collection = Utility.lookup(context.collection);
  var ss = Utility.lookup(context.schema) || collection && collection.simpleSchema();
  var formId = context.id || defaultFormId;

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
