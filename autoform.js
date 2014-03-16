var defaultFormId = "_afGenericID";
var formPreserve = new FormPreserve("autoforms");
var formSchemas = {}; //keep a reference to simplify resetting validation

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

AutoForm.getDefaultTemplateForType = function autoFormGetDefaultTemplateForType(type) {
  if (!deps.defaultTypeTemplates[type]) {
    throw new Error("invalid template type: " + type);
  }
  deps.defaultTypeTemplates[type].depend();
  return defaultTypeTemplates[type];
};

AutoForm._normalizeContext = function autoFormNormalizeContext(context, name) {
  context = context || {};
  var atts = context.atts || {};
  var afContext = atts.autoform || context.autoform;
  if (!afContext || !afContext._af) {
    throw new Error(name + " must be used within an autoForm block");
  }

  return {
    afc: afContext,
    af: afContext._af,
    atts: atts
  };
};

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

Template.autoForm.innerContext = function autoFormTplInnerContext() {
  var context = this;
  var formId = context.id || defaultFormId;

  var collection = lookup(context.collection);
  check(collection, Match.Optional(Meteor.Collection));

  var ss = lookup(context.schema) || collection && collection.simpleSchema();
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

  // Set up the context to be used for everything within the autoform
  //var innerContext = (this instanceof Window) ? {} : _.clone(this);
  // TODO is there a way to grab the calling context if the af is within a block?
  var innerContext = {_af: {}};
  innerContext._af.formId = formId;
  innerContext._af.collection = collection;
  innerContext._af.ss = ss;
  innerContext._af.doc = context.doc; //TODO is this used somewhere?
  innerContext._af.mDoc = mDoc;
  innerContext._af.validationType = context.validation || "submitThenKeyup";
  innerContext._af.submitType = context.type;
  innerContext._af.resetOnSuccess = context.resetOnSuccess;
  return innerContext;
};

Template.quickForm.needsButton = function autoFormNeedsButton() {
  var context = this;
  var needsButton = true;

  // TODO make sure readonly and disabled types work
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

Template.afFieldLabel.label = function getLabel() {
  var c = AutoForm._normalizeContext(this, "afFieldLabel");
  return c.af.ss.label(c.atts.name);
};

Handlebars.registerHelper("_afFieldLabel", function autoFormFieldLabel() {
  var c = AutoForm._normalizeContext(this, "afFieldLabel");

  var template = c.atts.template || AutoForm.getDefaultTemplateForType("afFieldLabel") || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var result = Template['afFieldLabel_' + template];
  if (!result) {
    throw new Error("afFieldLabel: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Handlebars.registerHelper("_afFieldSelect", function autoFormFieldLabel() {
  var c = AutoForm._normalizeContext(this, "afFieldSelect");

  var ss = c.af.ss;
  var defs = getDefs(ss, c.atts.name); //defs will not be undefined

  // Get schema type
  var schemaType = defs.type;
  // Adjust for array fields if necessary
  var expectsArray = false;
  var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
  if (schemaType === Array) {
    defs = ss.schema(c.atts.name + ".$");
    schemaType = defs.type;
    expectsArray = true;
  }

  // Get input value
  var value = getInputValue(c.atts.name, c.atts.value, c.af.mDoc, expectsArray, defaultValue);

  // Add empty options to the hash, which will trigger the correct input data for a select
  var hash = _.extend({}, c.atts, {options: []});

  // Cache some info for use by helpers
  _.extend(this, {
    inputInfo: getInputData(defs, hash, value, "select", ss.label(c.atts.name), expectsArray)
  });

  var template = c.atts.template || AutoForm.getDefaultTemplateForType("afFieldSelect") || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var result = Template['afFieldSelect_' + template];
  if (!result) {
    throw new Error("afFieldSelect: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Handlebars.registerHelper("_afFieldInput", function autoFormFieldInput() {
  var c = AutoForm._normalizeContext(this, "afFieldInput");

  var ss = c.af.ss;
  var defs = getDefs(ss, c.atts.name); //defs will not be undefined

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

  // Cache some info for use by helpers
  _.extend(this, {
    inputInfo: getInputData(defs, c.atts, value, type, ss.label(c.atts.name), expectsArray)
  });

  // Construct template name
  var templateType = getInputTemplateType(c.atts, type, expectsArray);
  var template = c.atts.template || AutoForm.getDefaultTemplateForType(templateType) || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var result = Template[templateType + "_" + template];
  if (!result) {
    throw new Error("afFieldInput: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Handlebars.registerHelper("afDeleteButton", function autoFormDeleteButton() {
  var atts = this;
  var template = atts.template || AutoForm.getDefaultTemplateForType("afDeleteButton") || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var result = Template['afDeleteButton_' + template];
  if (!result) {
    throw new Error("afDeleteButton: \"" + template + "\" is not a valid template name");
  }
  return result;
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

Handlebars.registerHelper("_afQuickField", function autoFormFieldLabel() {
  var c = AutoForm._normalizeContext(this, "afQuickField");

  var ss = c.af.ss;

  var fields = _.filter(ss._schemaKeys, function autoFormFormFieldsSchemaEach(key) {
    if (key.indexOf(c.atts.name + ".") === 0) {
      return true;
    }
  });

  formFields = quickFieldFormFields(fields, c.afc, ss);

  var defs = getDefs(ss, c.atts.name); //defs will not be undefined
  _.extend(this, {
    skipLabel: (c.atts.label === false || (defs.type === Boolean && !("select" in c.atts) && !("radio" in c.atts))),
    labelAtts: quickFieldLabelAtts(c.atts, c.afc),
    inputAtts: quickFieldInputAtts(c.atts, c.afc),
    isGroup: !!(formFields && formFields.length),
    formFields: formFields
  });

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var template = c.atts.template || AutoForm.getDefaultTemplateForType("afQuickField") || AutoForm.getDefaultTemplate();
  var result = Template['afQuickField_' + template];
  if (!result) {
    throw new Error("afQuickField: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Handlebars.registerHelper("_quickForm", function autoFormQuickForm() {
  var atts = this;

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var template = atts.template || AutoForm.getDefaultTemplateForType("afQuickField") || AutoForm.getDefaultTemplate();
  var result = Template['quickForm_' + template];
  if (!result) {
    throw new Error("quickForm: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Template.quickForm.submitButtonAtts = function autoFormSubmitButtonAtts() {
  var context = this;
  var atts = {type: "submit"};
  if (typeof context.buttonClasses === "string") {
    atts['class'] = context.buttonClasses;
  }
  return atts;
};

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

  return quickFieldFormFields(fieldList, context, ss);
};

function quickFieldFormFields(fieldList, autoform, ss) {

  function shouldIncludeField(field) {
    var fieldDefs = ss.schema(field);

    // Don't include fields with denyInsert=true when it's an insert form
    if (fieldDefs.denyInsert && autoform._af.formType === "insert")
      return false;

    // Don't include fields with denyUpdate=true when it's an update form
    if (fieldDefs.denyUpdate && context.type === "update")
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

      info.formFields = quickFieldFormFields(fields, autoform, ss);
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
    autoform: autoform
  };

  if (autoform._af.submitType === "disabled") {
    extendedAtts.disabled = "";
  } else if (autoform._af.submitType === "readonly") {
    extendedAtts.readonly = "";
  }

  // Return info for all requested fields
  return _.map(fieldList, function autoFormFormFieldsListEach(field) {
    return infoForField(field, extendedAtts);
  });
}
;

Template.autoForm.destroyed = function autoFormDestroyed() {
  var self = this;
  self._notInDOM = true;
  var formId = self.data.id || defaultFormId;
  formPreserve.unregisterForm(formId);
};

Handlebars.registerHelper("afFieldMessage", function autoFormFieldMessage(options) {
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

  getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return ss.namedContext(afContext.formId).keyErrorMessage(hash.name);
});

Handlebars.registerHelper("afFieldIsInvalid", function autoFormFieldIsInvalid(options) {
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

  getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return ss.namedContext(afContext.formId).keyIsInvalid(hash.name);
});

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
    var collection = lookup(context.collection);
    var ss = lookup(context.schema) || collection && collection.simpleSchema();
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
    var form = formValues(template, Hooks.getHooks(formId, 'formToDoc'), ss);

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
        userId: (Meteor.userId && Meteor.userId()) || null
      }
    });

    // Prep isValid function
    var validationErrorTriggered = 0;
    function isValid(doc, isModifier, type) {
      var result = validationType === 'none' || ss.namedContext(formId).validate(doc, {
        modifier: isModifier,
        extendedCustomContext: {
          userId: (Meteor.userId && Meteor.userId()) || null
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
          userId: (Meteor.userId && Meteor.userId()) || null
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
        return formValues(template, Hooks.getHooks(formId, 'formToDoc'), ss).insertDoc;
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

function formValues(template, transforms, ss) {
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
      if (isValidDateString(val)) {
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
      if (isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
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
      if (isValidNormalizedLocalDateAndTimeString(val)) {
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
  doc = expandObj(doc);

  // Pass expanded doc through formToDoc hooks
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
;

// TODO should make this a static method in MongoObject
function objAffectsKey(obj, key) {
  var mDoc = new MongoObject(obj);
  return mDoc.affectsKey(key);
}

function expandObj(doc) {
  var newDoc = {}, subkeys, subkey, subkeylen, nextPiece, current;
  _.each(doc, function(val, key) {
    subkeys = key.split(".");
    subkeylen = subkeys.length;
    current = newDoc;
    for (var i = 0; i < subkeylen; i++) {
      subkey = subkeys[i];
      if (typeof current[subkey] !== "undefined" && !_.isObject(current[subkey])) {
        break; //already set for some reason; leave it alone
      }
      if (i === subkeylen - 1) {
        //last iteration; time to set the value
        current[subkey] = val;
      } else {
        //see if the next piece is a number
        nextPiece = subkeys[i + 1];
        nextPiece = parseInt(nextPiece, 10);
        if (isNaN(nextPiece) && !_.isObject(current[subkey])) {
          current[subkey] = {};
        } else if (!isNaN(nextPiece) && !_.isArray(current[subkey])) {
          current[subkey] = [];
        }
      }
      current = current[subkey];
    }
  });
  return newDoc;
}

//returns true if dateString is a "valid date string"
function isValidDateString(dateString) {
  var m = moment(dateString, 'YYYY-MM-DD', true);
  return m && m.isValid();
}

//returns true if timeString is a "valid time string"
function isValidTimeString(timeString) {
  if (typeof timeString !== "string")
    return false;

  //this reg ex actually allows a few invalid hours/minutes/seconds, but
  //we can catch that when parsing
  var regEx = /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9](\.[0-9]{1,3})?)?$/;
  return regEx.test(timeString);
}

//returns a "valid date string" representing the local date
function dateToDateString(date) {
  var m = (date.getMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getFullYear() + '-' + m + '-' + d;
}

//returns a "valid date string" representing the date converted to the UTC time zone
function dateToDateStringUTC(date) {
  var m = (date.getUTCMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getUTCDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getUTCFullYear() + '-' + m + '-' + d;
}

//returns a "valid normalized forced-UTC global date and time string" representing the time converted to the UTC time zone and expressed as the shortest possible string for the given time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute)
//http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#date-and-time-state-(type=datetime)
//http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-normalized-forced-utc-global-date-and-time-string
function dateToNormalizedForcedUtcGlobalDateAndTimeString(date) {
  return moment(date).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
}

//returns true if dateString is a "valid normalized forced-UTC global date and time string"
function isValidNormalizedForcedUtcGlobalDateAndTimeString(dateString) {
  if (typeof dateString !== "string")
    return false;

  var datePart = dateString.substring(0, 10);
  var tPart = dateString.substring(10, 11);
  var timePart = dateString.substring(11, dateString.length - 1);
  var zPart = dateString.substring(dateString.length - 1);
  return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart) && zPart === "Z";
}

//returns a "valid normalized local date and time string"
function dateToNormalizedLocalDateAndTimeString(date, offset) {
  var m = moment(date);
  m.zone(offset);
  return m.format("YYYY-MM-DD[T]hh:mm:ss.SSS");
}

function isValidNormalizedLocalDateAndTimeString(dtString) {
  if (typeof dtString !== "string")
    return false;

  var datePart = dtString.substring(0, 10);
  var tPart = dtString.substring(10, 11);
  var timePart = dtString.substring(11, dtString.length);
  return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart);
}

/**
 *
 */
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
        return dateToDateStringUTC(val);
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
      value = dateToDateStringUTC(value);
    } else if (type === "datetime") {
      value = dateToNormalizedForcedUtcGlobalDateAndTimeString(value);
    } else if (type === "datetime-local") {
      value = dateToNormalizedLocalDateAndTimeString(value, hash["data-offset"]);
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
          hash.max = dateToDateStringUTC(max);
        }
        if (typeof hash.min === "undefined" && min instanceof Date) {
          hash.min = dateToDateStringUTC(min);
        }
        break;
      case "datetime":
        if (typeof hash.max === "undefined" && max instanceof Date) {
          hash.max = dateToNormalizedForcedUtcGlobalDateAndTimeString(max);
        }
        if (typeof hash.min === "undefined" && min instanceof Date) {
          hash.min = dateToNormalizedForcedUtcGlobalDateAndTimeString(min);
        }
        break;
      case "datetime-local":
        if (typeof hash.max === "undefined" && max instanceof Date) {
          hash.max = dateToNormalizedLocalDateAndTimeString(max, hash["data-offset"]);
        }
        if (typeof hash.min === "undefined" && min instanceof Date) {
          hash.min = dateToNormalizedLocalDateAndTimeString(min, hash["data-offset"]);
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

function getInputTemplateType(hash, type, expectsArray) {
  // Extract settings from hash
  var radio = hash.radio;
  var select = hash.select;
  var noselect = hash.noselect;
  var selectOptions = hash.options;

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
  var collection = lookup(context.collection);
  var ss = lookup(context.schema) || collection && collection.simpleSchema();
  var formId = context.id || defaultFormId;

  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  var form = formValues(template, Hooks.getHooks(formId, 'formToDoc'), ss);

  // Clean and validate doc
  if (context.type === "update") {

    // Skip validation if skipEmpty is true and the field we're validating
    // has no value.
    if (skipEmpty && !objAffectsKey(form.updateDoc, key))
      return; //skip validation

    // formValues did some cleaning but didn't add auto values; add them now
    ss.clean(form.updateDoc, {
      isModifier: true,
      filter: false,
      autoConvert: false,
      extendAutoValueContext: {
        userId: (Meteor.userId && Meteor.userId()) || null
      }
    });
    ss.namedContext(formId).validateOne(form.updateDoc, key, {
      modifier: true,
      extendedCustomContext: {
        userId: (Meteor.userId && Meteor.userId()) || null
      }
    });
  } else {

    // Skip validation if skipEmpty is true and the field we're validating
    // has no value.
    if (skipEmpty && !objAffectsKey(form.insertDoc, key))
      return; //skip validation

    // formValues did some cleaning but didn't add auto values; add them now
    ss.clean(form.insertDoc, {
      filter: false,
      autoConvert: false,
      extendAutoValueContext: {
        userId: (Meteor.userId && Meteor.userId()) || null
      }
    });
    ss.namedContext(formId).validateOne(form.insertDoc, key, {
      modifier: false,
      extendedCustomContext: {
        userId: (Meteor.userId && Meteor.userId()) || null
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

function getDefs(ss, name) {
  if (typeof name !== "string") {
    throw new Error("Invalid field name: (not a string)");
  }

  var defs = ss.schema(name);
  if (!defs)
    throw new Error("Invalid field name: " + name);
  return defs;
}

function lookup(obj) {
  if (typeof obj === "string") {
    if (!window || !window[obj]) {
      throw new Error(obj + " is not in the window scope");
    }
    return window[obj];
  }
  return obj;
}
