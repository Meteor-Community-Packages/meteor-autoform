// This file defines the public, exported API

AutoForm = AutoForm || {}; //exported

AutoForm.formPreserve = formPreserve;

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
 * @param {TemplateInstance} [template] Looked up if not provided. Pass in for efficiency.
 * @returns {undefined}
 *
 * Resets an autoform, including resetting validation errors. The same as clicking the reset button for an autoform.
 */
AutoForm.resetForm = function autoFormResetForm(formId, template) {
  template = template || templatesById[formId];
  if (template && !template._notInDOM) {
    template.$("form")[0].reset();
  }
};

/**
 * @method AutoForm.setDefaultTemplate
 * @public
 * @param {String} template
 */
AutoForm.setDefaultTemplate = function autoFormSetDefaultTemplate(template) {
  defaultTemplate = template;
  deps.defaultTemplate.changed();
};

/**
 * @method AutoForm.getDefaultTemplate
 * @public
 *
 * Reactive.
 */
AutoForm.getDefaultTemplate = function autoFormGetDefaultTemplate() {
  deps.defaultTemplate.depend();
  return defaultTemplate;
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
 * @method AutoForm.inputValueHandlers
 * @public
 * @param {Object} handlers An object defining one or more selectors with corresponding handler function.
 * @return {undefined}
 *
 * Use this method to add custom input value handlers, which will be checked before
 * the built-in handlers.
 */
AutoForm.inputValueHandlers = function afInputValueHandlers(handlers) {
  _.extend(customInputValueHandlers, handlers);
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

/**
 * @method AutoForm.validateForm
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` you want to validate.
 * @return {Boolean} Is it valid?
 *
 * In addition to returning a boolean that indicates whether the form is currently valid,
 * this method causes the reactive validation messages to appear.
 */
AutoForm.validateForm = function autoFormValidateForm(formId) {
  var template = templatesById[formId];
  if (!template || template._notInDOM) {
    throw new Error("validateForm: There is currently no autoForm template rendered for the form with id " + formId);
  }

  var data = formData[formId];
  // ss will be the schema for the `schema` attribute if present,
  // else the schema for the collection
  var ss = data.ss;

  // Gather all form values
  var formDocs = getFormValues(template, formId, ss);

  var isValid = _validateForm(formId, data, formDocs);

  if (isValid === false) {
    selectFirstInvalidField(formId, ss, template);
    return false;
  } else {
    return true;
  }
};

/**
 * @method AutoForm.getValidationContext
 * @public
 * @param {String} formId The `id` attribute of the `autoForm` for which you want the validation context
 * @return {SimpleSchemaValidationContext} The SimpleSchema validation context object.
 *
 * Use this method to get the validation context, which can be used to check
 * the current invalid fields, manually invalidate fields, etc.
 */
AutoForm.getValidationContext = function autoFormGetValidationContext(formId) {
  var data = formData[formId];
  // ss will be the schema for the `schema` attribute if present,
  // else the schema for the collection
  var ss = data.ss;
  return ss.namedContext(formId);
};

/**
 * @method AutoForm.find
 * @public
 * @return {Object} The data context for the closest autoform.
 *
 * Call this method from a UI helper to get the data context for the closest autoform. Always returns the context or throws an error.
 */
AutoForm.find = function autoFormFind(type) {
  var n = 0, af;
  do {
    af = UI._parentData(n++);
  } while (af && !af._af);
  if (!af || !af._af) {
    throw new Error((type || "AutoForm.find") + " must be used within an autoForm block");
  }
  return af._af;
};

/**
 * @method AutoForm.debug
 * @public
 *
 * Call this method in client code while developing to turn on extra logging.
 */
AutoForm.debug = function autoFormDebug() {
  SimpleSchema.debug = true;
  AutoForm._debug = true;
  AutoForm.addHooks(null, {
    onError: function (operation, error, template) {
      console.log("Error in " + this.formId, operation, error);
    }
  });
};

/**
 * @property AutoForm.arrayTracker
 * @public
 * @param {Object} atts
 * @param {Object} defs
 * @param {Boolean} expectsArray
 *
 * @return {ArrayTracker}
 */
AutoForm.arrayTracker = arrayTracker;

/**
 * @method AutoForm.getInputType
 * @param {Object} atts The attributes provided to afFieldInput.
 * @public
 * @return {String} The input type. Most are the same as the `type` attributes for HTML input elements, but some are special strings that autoform interprets.
 *
 * Call this method from a UI helper to get the type string for the input control.
 */
AutoForm.getInputType = getInputType;

/**
 * @method AutoForm.getSchemaForField
 * @public
 * @param {String} name The field name attribute / schema key.
 * @param {Object} [autoform] The autoform context. Optionally pass this if you've already retrieved it using AutoForm.find as a performance enhancement.
 * @return {Object} 
 *
 * Call this method from a UI helper to get the field definitions based on the schema used by the closest containing autoForm.
 * Always throws an error or returns the schema object.
 */
AutoForm.getSchemaForField = function autoFormGetSchemaForField(name, autoform) {
  var ss;
  if (autoform) {
    ss = autoform.ss;
  }
  if (!ss) {
    ss = AutoForm.find().ss;
  }
  return Utility.getDefs(ss, name);
};

/**
 * @method AutoForm.expectsArray
 * @public
 * @param {Object} atts The attributes provided to afFieldInput.
 * @return {Boolean} 
 *
 * Call this method from a UI helper to determine whether the user is expecting the input control to produce an array value.
 */
AutoForm.expectsArray = expectsArray;