var defaultFormId = "_afGenericID";
var formPreserve = new FormPreserve("autoforms");
var formHooks = {};
var formSchemas = {}; //keep a reference to simplify resetting validation

AutoForm = {};

/**
 * @param {Object} hooks
 * @returns {undefined}
 * 
 * Defines hooks by form id. Safe to be called multiple times for the same
 * form.
 */
AutoForm.hooks = function autoFormHooks(hooks) {
  _.each(hooks, function(hooksObj, formId) {
    
    // Init the hooks object for this formId if not done yet
    formHooks[formId] = formHooks[formId] || {
      before: {},
      after: {},
      formToDoc: [],
      docToForm: [],
      onSubmit: [],
      onSuccess: [],
      onError: []
    };
    
    // Add before hooks
    hooksObj.before && _.each(hooksObj.before, function autoFormBeforeHooksEach(func, type) {
      if (typeof func !== "function") {
        throw new Error("AutoForm before hook must be a function, not " + typeof func);
      }
      formHooks[formId].before[type] = formHooks[formId].before[type] || [];
      formHooks[formId].before[type].push(func);
    });
    
    // Add after hooks
    hooksObj.after && _.each(hooksObj.after, function autoFormAfterHooksEach(func, type) {
      if (typeof func !== "function") {
        throw new Error("AutoForm after hook must be a function, not " + typeof func);
      }
      formHooks[formId].after[type] = formHooks[formId].after[type] || [];
      formHooks[formId].after[type].push(func);
    });
    
    // Add all other hooks
    _.each(['formToDoc', 'docToForm', 'onSubmit', 'onSuccess', 'onError'], function autoFormHooksEach(name) {
      if (hooksObj[name]) {
        if (typeof hooksObj[name] !== "function") {
          throw new Error("AutoForm " + name + " hook must be a function, not " + typeof hooksObj[name]);
        }
        formHooks[formId][name].push(hooksObj[name]);
      }
    });
  });
};

function getHooks(formId, type, subtype) {
  if (subtype) {
    return formHooks[formId] && formHooks[formId][type] && formHooks[formId][type][subtype] || [];
  } else {
    return formHooks[formId] && formHooks[formId][type] || [];
  }
}

/**
 * @param {String} formId
 * @param {SimpleSchema} simpleSchema
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
  
  //clearSelections(formId); // TODO don't think this is needed with new engine
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
    console.log("Retrieved preserved form document", retrievedDoc);
    context.doc = retrievedDoc;
  }

  var flatDoc;
  if (context.doc) {
    // We create and use a "flat doc" instead of dynamic lookups because
    // that makes it easier for the user to alter using a docToForm function.
    var mDoc = new MongoObject(_.clone(context.doc));
    flatDoc = mDoc.getFlatObject();
    mDoc = null;
    // Pass flat doc through docToForm hooks
    _.each(getHooks(formId, 'docToForm'), function autoFormEachDocToForm(func) {
      flatDoc = func(flatDoc);
    });
  } else {
    flatDoc = {};
  }

  // Set up the context to be used for everything within the autoform
  //var innerContext = (this instanceof Window) ? {} : _.clone(this);
  // TODO is there a way to grab the calling context if the af is within a block?
  var innerContext = {_af: {}};
  innerContext._af.formId = formId;
  innerContext._af.collection = collection;
  innerContext._af.ss = ss;
  innerContext._af.doc = context.doc; //TODO is this used somewhere?
  innerContext._af.flatDoc = flatDoc;
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
  var context = this || {};
  var atts = context.atts || {};
  var afContext = atts.autoform || context.autoform;
  if (!afContext || !afContext._af) {
    throw new Error("afFieldLabel helper must be used within an autoForm block");
  }
  
  var ss = afContext._af.ss;
  
  return ss.label(atts.name);
};

Handlebars.registerHelper("_afFieldLabel", function autoFormFieldLabel(context) {
  var context = this || {};
  var atts = context.atts || {};
  var afContext = atts.autoform || context.autoform;
  if (!afContext || !afContext._af) {
    throw new Error("afFieldLabel helper must be used within an autoForm block");
  }

  var template = atts.template || AutoForm.getDefaultTemplateForType("afFieldLabel") || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var result = Template['afFieldLabel_' + template];
  if (!result) {
    throw new Error("afFieldLabel: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Template.afFieldInput.inputInfo = function getLabel() {
  var context = this || {};
  var atts = context.atts || {};
  var afContext = atts.autoform || context.autoform;
  if (!afContext || !afContext._af) {
    throw new Error("afFieldInput template must be used within an autoForm block");
  }
  
  var ss = afContext._af.ss;
  var defs = getDefs(ss, atts.name); //defs will not be undefined
  
  return getInputData(atts.name, ss, afContext._af.flatDoc, defs, atts);
};

Handlebars.registerHelper("_afFieldInput", function autoFormFieldInput() {
  var context = this || {};
  var atts = context.atts || {};
  var afContext = atts.autoform || context.autoform;
  if (!afContext || !afContext._af) {
    throw new Error("afFieldInput template must be used within an autoForm block");
  }
  
  var ss = afContext._af.ss;
  var defs = getDefs(ss, atts.name); //defs will not be undefined
  
  // TODO figure out a way to not duplicate this call and still get valHasLineBreaks
  var data = getInputData(atts.name, ss, afContext._af.flatDoc, defs, atts);
  
  // Construct template name
  var templateType = getInputTemplateType(atts.name, ss, defs, atts, data.valHasLineBreaks);
  var template = atts.template || AutoForm.getDefaultTemplateForType(templateType) || AutoForm.getDefaultTemplate();

  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var result = Template[templateType + "_" + template];
  if (!result) {
    throw new Error("afFieldInput: \"" + template + "\" is not a valid template name");
  }
  return result;
});

Handlebars.registerHelper("afDeleteButton", function autoFormFieldLabel(context) {
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

function quickFieldLabelAtts(context) {
  // Remove unwanted props from the hash
  context = _.omit(context, 'label');

  // Separate label options from input options; label items begin with "label-"
  var labelContext = {name: context.name, template: context.template};
  _.each(context, function autoFormLabelContextEach(val, key) {
    if (key.indexOf("label-") === 0) {
      labelContext[key.substring(6)] = val;
    }
  });

  return labelContext;
};

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
};

Handlebars.registerHelper("_afQuickField", function autoFormFieldLabel() {
  var context = this || {};
  var atts = context.atts || {};
  var afContext = (atts.autoform || context.autoform);
  if (!afContext || !afContext._af) {
    throw new Error("afQuickField helper must be used within an autoForm block");
  }
  
  var ss = afContext._af.ss;
  
  var field = atts.name;
  var formFields = _.filter(ss._schemaKeys, function autoFormFormFieldsSchemaEach(key) {
    if (key.indexOf(field + ".") === 0) {
      return true;
    }
  });
  formFields = quickFieldFormFields(formFields, afContext, ss);
  
  var defs = getDefs(ss, atts.name); //defs will not be undefined
  _.extend(afContext, {
    skipLabel: (atts.label === false || (defs.type === Boolean && !("select" in atts) && !("radio" in atts))),
    labelContext: quickFieldLabelAtts(atts),
    inputContext: quickFieldInputAtts(atts),
    isGroup: !!formFields,
    formFields: formFields
  });
  
  // Return the template instance that we want to use, which will be
  // built with the same 'this' value
  var template = atts.template || AutoForm.getDefaultTemplateForType("afQuickField") || AutoForm.getDefaultTemplate();
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

  function infoForField(field, extendedProps) {
    var info = {name: field};
    var fieldDefs = ss.schema(field);

    if (fieldDefs.type === Object) {
      info = {
        name: field,
        label: ss.label(field),
        formFields: []
      };
    } else {
      // If there are allowedValues defined, use them as select element options
      var av = fieldDefs.type === Array ? ss.schema(field + ".$").allowedValues : fieldDefs.allowedValues;
      if (_.isArray(av)) {
        info.options = "allowed";
      }
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
};

Template.autoForm.destroyed = function autoFormDestroyed() {
  var self = this;
  self._notInDOM = true;
  var formId = self.data.id || defaultFormId;
  formPreserve.unregisterForm(formId);
};

Template.autoForm.afFieldMessage = function autoFormFieldMessage(options) {
  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || this && this._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error("afQuickField helper must be used within an autoForm block");
  }

  getDefs(ss, hash.name); //for side effect of throwing errors when name is not in schema
  return ss.namedContext(afContext.formId).keyErrorMessage(hash.name);
};

//Handlebars.registerHelper("afFieldMessage", );

Handlebars.registerHelper("afFieldIsInvalid", function autoFormFieldIsInvalid(options) {
  var hash = (options || {}).hash || {};
  var afContext = hash.autoform && hash.autoform._af || this && this._af;
  var ss = afContext.ss;
  if (!ss) {
    throw new Error("afQuickField helper must be used within an autoForm block");
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
    var beforeInsert = getHooks(formId, 'before', 'insert');
    var beforeUpdate = getHooks(formId, 'before', 'update');
    var beforeRemove = getHooks(formId, 'before', 'remove');
    var beforeMethod = method && getHooks(formId, 'before', method);
    var afterInsert = getHooks(formId, 'after', 'insert');
    var afterUpdate = getHooks(formId, 'after', 'update');
    var afterRemove = getHooks(formId, 'after', 'remove');
    var afterMethod = method && getHooks(formId, 'after', method);
    var onSuccess = getHooks(formId, 'onSuccess');
    var onError = getHooks(formId, 'onError');
    var onSubmit = getHooks(formId, 'onSubmit');

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
    
    // Prep callback creator function
    function makeCallback(name, afterHook) {
      return function autoFormActionCallback(error, result) {
        if (error) {
          selectFirstInvalidField();
          _.each(onError, function onErrorEach(hook) {
            hook(name, error, template);
          });
        } else {
          // Potentially reset form after successful submit.
          // Update forms are opt-in while all others are opt-out.
          if (!template._notInDOM &&
                  ((name !== 'update' && resetOnSuccess !== false) ||
                          (name === 'update' && resetOnSuccess === true))) {
            template.find("form").reset();
            var focusInput = template.find("[autofocus]");
            focusInput && focusInput.focus();
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
    var form = formValues(template, getHooks(formId, 'formToDoc'), ss);

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
    if ((onSubmit || isNormalSubmit) && !isValid(insertDocForValidation, false, 'pre-submit validation')) {
      return haltSubmission();
    }

    // Call onSubmit
    if (onSubmit) {
      var context = {
        event: event,
        template: template,
        resetForm: function autoFormDoResetForm() {
          if (!template._notInDOM) {
            template.find("form").reset();
            var focusInput = template.find("[autofocus]");
            focusInput && focusInput.focus();
          }
        }
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
//    if (event.currentTarget.nodeName.toLowerCase() === "select") {
//      //workaround for selection being lost on rerender
//      //store the selections in memory and reset in rendered
//      setSelections(event.currentTarget, template.data._formId);
//    }
    var afContext = (this && this.autoform && this.autoform._af) || {};
    if (afContext) {
      var formId = afContext.formId;
      var ss = afContext.ss;
      formPreserve.registerForm(formId, function autoFormRegFormCallback() {
        return formValues(template, getHooks(formId, 'formToDoc'), ss).insertDoc;
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

if (typeof Handlebars !== 'undefined') {

  //This is a workaround for what seems to be a Meteor issue.
  //When Meteor updates an existing form, it selectively updates the attributes,
  //but attributes that are properties don't have the properties updated to match.
  //This means that selected is not updated properly even if the selected
  //attribute is on the element.
//  Template._autoForm.rendered = function() {
//    //using autoformSelections is only necessary when the form is invalid, and will
//    //cause problems if done when the form is valid, but we still have
//    //to transfer the selected attribute to the selected property when
//    //the form is valid, to make sure current values show correctly for
//    //an update form
//    var self = this, formID = self.data.formID;
//
//    var selections = getSelections(formID);
//    if (!selections) {
//      // on first render, cache the initial selections for all select elements
//      _.each(self.findAll("select"), function(selectElement) {
//        // first transfer the selected attribute to the selected property
//        _.each(selectElement.options, function(option) {
//          option.selected = option.hasAttribute("selected"); //transfer att to prop
//        });
//        // then cache the selections
//        setSelections(selectElement, formID);
//      });
//      // selections will be updated whenever they change in the
//      // onchange event handler, too
//      return;
//    } else {
//      // whenever we rerender, keep the correct selected values
//      // by resetting them all from the cached values
//      _.each(self.findAll("select"), function(selectElement) {
//        var key = selectElement.getAttribute('data-schema-key');
//        var selectedValues = selections[key];
//        if (selectedValues && selectedValues.length) {
//          _.each(selectElement.options, function(option) {
//            if (_.contains(selectedValues, option.value)) {
//              option.selected = true;
//            }
//          });
//        }
//      });
//    }
//  };
//
//  Template._autoForm.destroyed = function() {
//    var self = this, formID = self.data.formID;
//
//    self._notInDOM = true;
//    self.data.schema.simpleSchema().namedContext(formID).resetValidation();
//    clearSelections(formID);
//  };
}

function maybeNum(val) {
  // Convert val to a number if possible; otherwise, just use the value
  var floatVal = parseFloat(val);
  if (!isNaN(floatVal)) {
    return floatVal;
  } else {
    return val;
  }
}

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
        doc[name] = getSelectValues(field);
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
      doc[name] = maybeNum(val);
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
  // Pass flat doc through formToDoc hooks
  _.each(transforms, function formValuesTransform(transform) {
    doc = transform(doc);
  });
  // We return doc, insertDoc, and updateDoc.
  // For insertDoc, delete any properties that are null, undefined, or empty strings,
  // and expand to use subdocuments instead of dot notation keys.
  // For updateDoc, convert to modifier object with $set and $unset.
  // Do not add auto values to either.
  var result = {
    doc: doc,
    insertDoc: ss.clean(expandObj(cleanNulls(doc)), {
      isModifier: false,
      getAutoValues: false
    }),
    updateDoc: ss.clean(docToModifier(doc), {
      isModifier: true,
      getAutoValues: false
    })
  };
  return result;
};

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

function cleanNulls(doc) {
  var newDoc = {};
  _.each(doc, function(val, key) {
    if (val !== void 0 && val !== null && !(typeof val === "string" && val.length === 0)) {
      newDoc[key] = val;
    }
  });
  return newDoc;
}

function reportNulls(doc) {
  var nulls = {};
  _.each(doc, function(val, key) {
    if (val === void 0 || val === null || (typeof val === "string" && val.length === 0)) {
      nulls[key] = "";
    }
  });
  return nulls;
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

function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i = 0, iLen = options.length; i < iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}

function getInputData(name, ss, flatDoc, defs, hash) {
  var schemaType = defs.type;

  // Adjust for array fields if necessary
  var expectsArray = false;
  if (schemaType === Array) {
    defs = ss.schema(name + ".$");
    schemaType = defs.type;

    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    expectsArray = !hash.type;
  }

  // Determine what the current value is, if any
  var value;
  if (typeof hash.value === "undefined") {
    var arrayVal;
    if (expectsArray) {

      // For arrays, we need the flatDoc value as an array
      // rather than as separate array values, so we'll do
      // that adjustment here.
      // For example, if we have "numbers.0" = 1 and "numbers.1" = 2,
      // we will create "numbers" = [1,2]
      _.each(flatDoc, function(flatVal, flatKey) {
        var l = name.length;
        if (flatKey.slice(0, l + 1) === name + ".") {
          var end = flatKey.slice(l + 1);
          var intEnd = parseInt(end, 10);
          if (!isNaN(intEnd)) {
            flatDoc[name] = flatDoc[name] || [];
            flatDoc[name][intEnd] = flatVal;
          }
        }
      });

      if (schemaType === Date) {
        value = [];
        if (flatDoc && name in flatDoc) {
          arrayVal = flatDoc[name];
          _.each(arrayVal, function(v) {
            value.push(dateToDateStringUTC(v));
          });
        }
      } else {
        value = [];
        if (flatDoc && name in flatDoc) {
          arrayVal = flatDoc[name];
          _.each(arrayVal, function(v) {
            value.push(v.toString());
          });
        }
      }
    }

    // If not array
    else {
      if (flatDoc && name in flatDoc) {
        value = flatDoc[name];
        if (!(value instanceof Date)) { //we will convert dates to a string later, after we know what the field type will be
          value = value.toString();
        }
      } else {
        value = "";
      }
    }
  } else {
    value = hash.value;
    if (expectsArray && !(value instanceof Array)) {
      value = [value];
    }
  }

  var valHasLineBreaks = typeof value === "string" ? (value.indexOf("\n") !== -1) : false;

  //get type
  var type = "text";
  if (hash.type) {
    type = hash.type;
  } else if (schemaType === String && (hash.rows || valHasLineBreaks)) {
    type = "textarea";
  } else if (schemaType === String && defs.regEx === SchemaRegEx.Email) {
    type = "email";
  } else if (schemaType === String && defs.regEx === SchemaRegEx.Url) {
    type = "url";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    type = "boolean";
  }

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

  var label = ss.label(name);
  var min = defs.min;
  var max = defs.max;

  // If min/max are functions, call them
  if (typeof min === "function") {
    min = min();
  }
  if (typeof max === "function") {
    max = max();
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

  // Determine what options to use
  var data = {valHasLineBreaks: valHasLineBreaks};
  if (typeof hash.required === "undefined" && !defs.optional) {
    hash.required = "";
  }
  data.name = name;
  if (selectOptions) {
    // Build anything that should be a select, which is anything with options
    data.items = [];
    _.each(selectOptions, function(opt) {
      var selected = expectsArray ? _.contains(value, opt.value.toString()) : (opt.value.toString() === value.toString());
      data.items.push({
        name: name,
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
  } else if (type === "contenteditable") {
    if (typeof hash['data-maxlength'] === "undefined" && typeof max === "number") {
      hash['data-maxlength'] = max;
    }
    data.atts = hash;
  } else if (type === "boolean") {
    value = (value === "true") ? true : false;
    var items = [
      {
        name: name,
        value: "false",
        checked: !value ? "checked" : "",
        selected: !value ? "selected" : "",
        label: falseLabel
      },
      {
        name: name,
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

function getInputTemplateType(name, ss, defs, hash, valHasLineBreaks) {
  var schemaType = defs.type;

  // Adjust for array fields if necessary
  var expectsArray = false;
  if (schemaType === Array) {
    defs = ss.schema(name + ".$");
    schemaType = defs.type;

    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    expectsArray = !hash.type;
  }

  //get type
  var type = "text";
  if (hash.type) {
    type = hash.type;
  } else if (schemaType === String && (hash.rows || valHasLineBreaks)) {
    type = "textarea";
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Email) {
    type = "email";
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Url) {
    type = "url";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    type = "boolean";
  }

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
    return;
  }

  var context = template.data;
  var collection = lookup(context.collection);
  var ss = lookup(context.schema) || collection && collection.simpleSchema();
  var formId = context.id || defaultFormId;

  if (onlyIfAlreadyInvalid &&
          ss.namedContext(formId).isValid()) {
    return;
  }

  // Create a document based on all the values of all the inputs on the form
  var form = formValues(template, getHooks(formId, 'formToDoc'), ss);

  // Determine whether we're validating for an insert or an update
  var isUpdate = (context.type === "update");

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty) {

    // If validating for an insert, delete any properties that are
    // null, undefined, or empty strings so that the "empty" check will be
    // accurate. For an update, we want to keep null and "" because these
    // values might be invalid.
    var doc = form.doc;
    if (!isUpdate) {
      doc = cleanNulls(doc);
    }

    if (!(key in doc)) {
      return; //skip validation
    }
  }

  // Clean and validate doc
  if (isUpdate) {
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

//var autoformSelections = {};
//var setSelections = function(select, formId) {
//  var key = select.getAttribute('data-schema-key');
//  if (!key) {
//    return;
//  }
//  var selections = [];
//  for (var i = 0, ln = select.length, opt; i < ln; i++) {
//    opt = select.options[i];
//    if (opt.selected) {
//      selections.push(opt.value);
//    }
//  }
//  if (!(formId in autoformSelections)) {
//    autoformSelections[formId] = {};
//  }
//  autoformSelections[formId][key] = selections;
//};
//var clearSelections = function(formId) {
//  if (formId in autoformSelections) {
//    delete autoformSelections[formId];
//  }
//};
//var hasSelections = function(formId) {
//  return (formId in autoformSelections);
//};
//var getSelections = function(formId) {
//  return autoformSelections[formId];
//};

function docToModifier(doc) {
  var updateObj = {};
  var nulls = reportNulls(doc);
  doc = cleanNulls(doc);

  if (!_.isEmpty(doc)) {
    updateObj.$set = doc;
  }
  if (!_.isEmpty(nulls)) {
    updateObj.$unset = nulls;
  }
  return updateObj;
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