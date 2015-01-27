/* global AutoForm:true, SimpleSchema, Utility, Hooks, deps, globalDefaultTemplate:true, defaultTypeTemplates:true, getFormValues, formValues, _validateForm, validateField, arrayTracker, getInputType, ReactiveVar */

// This file defines the public, exported API

AutoForm = AutoForm || {}; //exported

AutoForm.Utility = Utility;

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

// Expose the hooks references to aid with automated testing
AutoForm._hooks = Hooks.form;
AutoForm._globalHooks = Hooks.global;

/**
 * @method AutoForm._forceResetFormValues
 * @public
 * @param {String} formId
 * @returns {undefined}
 *
 * Forces an AutoForm's values to properly update.
 * See https://github.com/meteor/meteor/issues/2431
 */
AutoForm._forceResetFormValues = function autoFormForceResetFormValues(formId) {
  AutoForm._destroyForm[formId] = AutoForm._destroyForm[formId] || new ReactiveVar(false);

  AutoForm._destroyForm[formId].set(true);
  setTimeout(function () {
    AutoForm._destroyForm[formId].set(false);
  }, 0);
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
  template = template || AutoForm.templateInstanceForForm(formId);

  if (template && template.view._domrange && !template.view.isDestroyed) {
    template.$("form")[0].reset();
  }
};

/**
 * @method AutoForm.setDefaultTemplate
 * @public
 * @param {String} template
 */
AutoForm.setDefaultTemplate = function autoFormSetDefaultTemplate(template) {
  globalDefaultTemplate = template;
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
  return globalDefaultTemplate;
};

/**
 * @method AutoForm.setDefaultTemplateForType
 * @public
 * @param {String} type
 * @param {String} template
 */
AutoForm.setDefaultTemplateForType = function autoFormSetDefaultTemplateForType(type, template) {
  if (!deps.defaultTypeTemplates[type]) {
    deps.defaultTypeTemplates[type] = new Tracker.Dependency();
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
    deps.defaultTypeTemplates[type] = new Tracker.Dependency();
  }
  deps.defaultTypeTemplates[type].depend();
  return defaultTypeTemplates[type];
};

/**
 * @method AutoForm.getTemplateName
 * @public
 * @param {String} templateType
 * @param {String} templateName
 * @param {String} [fieldName]
 * @param {Boolean} [skipExistsCheck] Pass `true` to return a template name even if that template hasn't been defined.
 * @return {String} Template name
 *
 * Returns the full template name. In the simplest scenario, this is templateType_templateName
 * as passed in. However, if templateName is not provided, it is looked up in the following
 * manner:
 *
 * 1. autoform.<componentType>.template from the schema (field+type override for all forms)
 * 2. autoform.template from the schema (field override for all forms)
 * 3. template-<componentType> attribute on an ancestor component within the same form (form+type for all fields)
 * 4. template attribute on an ancestor component within the same form (form specificity for all types and fields)
 * 5. Default template for component type, as set by AutoForm.setDefaultTemplateForType
 * 6. Default template, as set by AutoForm.setDefaultTemplate.
 * 7. Built-in default template, currently bootstrap-3.
 */
AutoForm.getTemplateName = function autoFormGetTemplateName(templateType, templateName, fieldName, skipExistsCheck) {
  var schemaAutoFormDefs, templateFromAncestor, defaultTemplate;

  function templateExists(t) {
    return !!(skipExistsCheck || Template[t]);
  }

  // Default case: use the `template` attribute provided
  if (templateName && templateExists(templateType + '_' + templateName)) {
    return templateType + '_' + templateName;
  }

  // If the attributes provided a templateName but that template didn't exist, show a warning
  if (templateName && AutoForm._debug) {
    console.warn(templateType + ': "' + templateName + '" is not a valid template name. Falling back to a different template.');
  }

  // Get `autoform` object from the schema, if present.
  // Skip for quickForm because it renders a form and not a field.
  if (templateType !== 'quickForm' && fieldName) {
    schemaAutoFormDefs = AutoForm.getSchemaForField(fieldName).autoform;
  }

  // Fallback #1: autoform.<componentType>.template from the schema
  if (schemaAutoFormDefs && schemaAutoFormDefs[templateType] && schemaAutoFormDefs[templateType].template && templateExists(templateType + '_' + schemaAutoFormDefs[templateType].template)) {
    return templateType + '_' + schemaAutoFormDefs[templateType].template;
  }

  // Fallback #2: autoform.template from the schema
  if (schemaAutoFormDefs && schemaAutoFormDefs.template && templateExists(templateType + '_' + schemaAutoFormDefs.template)) {
    return templateType + '_' + schemaAutoFormDefs.template;
  }

  // Fallback #3: template-<componentType> attribute on an ancestor component within the same form
  templateFromAncestor = AutoForm.findAttribute("template-" + templateType);
  if (templateFromAncestor && templateExists(templateType + '_' + templateFromAncestor)) {
    return templateType + '_' + templateFromAncestor;
  }

  // Fallback #4: template attribute on an ancestor component within the same form
  templateFromAncestor = AutoForm.findAttribute("template");
  if (templateFromAncestor && templateExists(templateType + '_' + templateFromAncestor)) {
    return templateType + '_' + templateFromAncestor;
  }

  // Fallback #5: Default template for component type, as set by AutoForm.setDefaultTemplateForType
  defaultTemplate = AutoForm.getDefaultTemplateForType(templateType);
  if (defaultTemplate && templateExists(templateType + '_' + defaultTemplate)) {
    return templateType + '_' + defaultTemplate;
  }

  // Fallback #6: Default template, as set by AutoForm.setDefaultTemplate
  defaultTemplate = AutoForm.getDefaultTemplate();
  if (defaultTemplate && templateExists(templateType + '_' + defaultTemplate)) {
    return templateType + '_' + defaultTemplate;
  }

  // Found nothing. Return undefined
  return;
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
  var template = AutoForm.templateInstanceForForm(formId);
  if (!template || !template.view._domrange || template.view.isDestroyed) {
    throw new Error("getFormValues: There is currently no autoForm template rendered for the form with id " + formId);
  }
  // Get a reference to the SimpleSchema instance that should be used for
  // determining what types we want back for each field.
  var context = template.data;
  var ss = AutoForm.Utility.getSimpleSchemaFromContext(context, formId);
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
  // reactive dependency
  formValues[formId] = formValues[formId] || {};
  formValues[formId][fieldName] = formValues[formId][fieldName] || new Tracker.Dependency();
  formValues[formId][fieldName].depend();

  // find AutoForm template
  var template = AutoForm.templateInstanceForForm(formId);
  if (!template || !template.view._domrange || template.view.isDestroyed) {
    return;
  }

  // find AutoForm schema
  var ss = AutoForm.getFormSchema(formId);

  // get element reference
  var element = template.$('[data-schema-key="' + fieldName + '"]')[0];

  return AutoForm.getInputValue(element, ss);
};

/**
 * @method AutoForm.getInputTypeTemplateNameForElement
 * @public
 * @param {DOMElement} element The input DOM element, generated by an autoform input control
 * @return {String}
 *
 * Returns the name of the template used to render the element.
 */
AutoForm.getInputTypeTemplateNameForElement = function autoFormGetInputTypeTemplateNameForElement(element) {
  // get the enclosing view
  var view = Blaze.getView(element);
  // if the enclosing view is not a template, perhaps because
  // the template contains a block helper like if, with, each,
  // then look up the view chain until we arrive at a template
  while (view && view.name.slice(0, 9) !== "Template.") {
    view = view.parentView;
  }

  if (!view) {
    throw new Error("The element does not appear to be in a template view");
  }

  // View names have "Template." at the beginning so we slice that off.
  return view.name.slice(9);
};

/**
 * @method AutoForm.getInputValue
 * @public
 * @param {DOMElement} element The input DOM element, generated by an autoform input control, which must have a `data-schema-key` attribute set to the correct schema key name.
 * @param {SimpleSchema} [ss] Provide the SimpleSchema instance if you already have it.
 * @return {Any}
 *
 * Returns the value of the field (the value that would be used if the form were submitted right now).
 * Unlike `AutoForm.getFieldValue`, this function is not reactive.
 */
AutoForm.getInputValue = function autoFormGetInputValue(element, ss) {
  var field, fieldName, fieldType, arrayItemFieldType, val, typeDef, inputTypeTemplate, dataContext, autoConvert;

  dataContext = Blaze.getData(element);
  if (dataContext && dataContext.atts) {
    autoConvert = dataContext.atts.autoConvert;
  }

  // Get jQuery field reference
  field = $(element);

  // Get the field/schema key name
  fieldName = field.attr("data-schema-key");

  // If we have a schema, we can autoconvert to the correct data type
  if (ss) {
    fieldType = ss.schema(fieldName).type;
  }

  // Get the name of the input type template used to render the input element
  inputTypeTemplate = AutoForm.getInputTypeTemplateNameForElement(element);

  // Slice off the potential theme template, after the underscore.
  inputTypeTemplate = inputTypeTemplate.split("_")[0];

  // Figure out what registered input type was used to render this element
  typeDef = _.where(AutoForm._inputTypeDefinitions, {template: inputTypeTemplate})[0];

  // If field has a "data-null-value" attribute, value should always be null
  if (field.attr("data-null-value") !== void 0) {
    val = null;
  }
  // Otherwise get the field's value using the input type's `valueOut` function if provided
  else if (typeDef && typeDef.valueOut) {
    val = typeDef.valueOut.call(field);
  }
  // Otherwise get the field's value in a default way
  else {
    val = field.val();
  }

  // run through input's type converter if provided
  if (val !== void 0 && autoConvert !== false && typeDef && typeDef.valueConverters && fieldType) {
    var converterFunc;
    if (fieldType === String) {
      converterFunc = typeDef.valueConverters.string;
    } else if (fieldType === Number) {
      converterFunc = typeDef.valueConverters.number;
    } else if (fieldType === Boolean) {
      converterFunc = typeDef.valueConverters.boolean;
    } else if (fieldType === Date) {
      converterFunc = typeDef.valueConverters.date;
    } else if (fieldType === Array) {
      arrayItemFieldType = ss.schema(fieldName + ".$").type;
      if (arrayItemFieldType === String) {
        converterFunc = typeDef.valueConverters.stringArray;
      } else if (arrayItemFieldType === Number) {
        converterFunc = typeDef.valueConverters.numberArray;
      } else if (arrayItemFieldType === Boolean) {
        converterFunc = typeDef.valueConverters.booleanArray;
      } else if (arrayItemFieldType === Date) {
        converterFunc = typeDef.valueConverters.dateArray;
      }
    }

    if (typeof converterFunc === "function") {
      val = converterFunc.call(field, val);
    }
  }

  return val;
};

/**
 * @method AutoForm.addInputType
 * @public
 * @param {String} name The type string that this definition is for.
 * @param {Object} definition Defines how the input type should be rendered.
 * @param {String} definition.componentName The component name. A template with the name <componentName>_bootstrap3, and potentially others, must be defined.
 * @return {undefined}
 *
 * Use this method to add custom input components.
 */
AutoForm.addInputType = function afAddInputType(name, definition) {
  var obj = {};
  obj[name] = definition;
  _.extend(AutoForm._inputTypeDefinitions, obj);
};

/**
 * @method AutoForm.addFormType
 * @public
 * @param {String} name The type string that this definition is for.
 * @param {Object} definition Defines how the submit type should work
 * @param {String} definition.componentName The component name. A template with the name <componentName>_bootstrap3, and potentially others, must be defined.
 * @return {undefined}
 *
 * Use this method to add custom input components.
 */
AutoForm.addFormType = function afAddFormType(name, definition) {
  var obj = {};
  obj[name] = definition;
  _.extend(AutoForm._formTypeDefinitions, obj);
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
  var template = AutoForm.templateInstanceForForm(formId);
  if (!template || !template.view._domrange || template.view.isDestroyed) {
    throw new Error("validateField: There is currently no autoForm template rendered for the form with id " + formId);
  }

  var ss = AutoForm.getFormSchema(formId);
  return validateField(fieldName, template, ss, skipEmpty, false);
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
  // Gather all form values
  var formDocs = AutoForm.getFormValues(formId);

  return _validateForm(formId, formDocs);
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
  var ss = AutoForm.getFormSchema(formId);
  return ss && ss.namedContext(formId);
};

/**
 * @method AutoForm.findAttribute
 * @param {String} attrName Attribute name
 * @public
 * @return {Any|undefined} Searches for the given attribute, looking up the parent context tree until the closest autoform is reached.
 *
 * Call this method from a UI helper. Might return undefined.
 */
AutoForm.findAttribute = function autoFormFindAttribute(attrName) {
  var val, view, viewData;

  var instance = Template.instance();
  if (!instance) {
    return val;
  }

  function checkView() {
    // Is the attribute we're looking for on here?
    // If so, stop searching
    viewData = Blaze.getData(view);
    if (viewData && viewData.atts && viewData.atts[attrName] !== void 0) {
      val = viewData.atts[attrName];
    } else if (viewData && viewData[attrName] !== void 0) {
      // When searching for "template", make sure we didn't just
      // find the one that's on Template.dynamic
      if (attrName !== 'template' || !('data' in viewData)) {
        val = viewData[attrName];
      }
    }
  }

  // Loop
  view = instance.view;
  while (val === undefined && view && view.name !== 'Template.autoForm') {
    checkView();
    view = view.originalParentView || view.parentView;
  }

  // If we've reached the form, check there, too
  if (val === undefined && view && view.name === 'Template.autoForm') {
    checkView();
  }

  return val;
};

/**
 * @method AutoForm.findAttributesWithPrefix
 * @param {String} prefix Attribute prefix
 * @public
 * @return {Object} An object containing all of the found attributes and their values, with the prefix removed from the keys.
 *
 * Call this method from a UI helper. Searches for attributes that start with the given prefix, looking up the parent context tree until the closest autoform is reached.
 *
 * TODO change this to use logic like AutoForm.findAttribute
 */
AutoForm.findAttributesWithPrefix = function autoFormFindAttributesWithPrefix(prefix) {
  var n = 0, af, searchObj, stopAt = -1, obj = {};
  // we go one level past _af so that we get the original autoForm or quickForm attributes, too
  do {
    af = Template.parentData(n++);
    if (af) {
      if (af.atts) {
        searchObj = af.atts;
      } else {
        searchObj = af;
      }
      if (_.isObject(searchObj)) {
        _.each(searchObj, function (v, k) {
          if (k.indexOf(prefix) === 0) {
            obj[k.slice(prefix.length)] = v;
          }
        });
      }
      if (af._af) {
        stopAt = n + 1;
      }
    }
  } while (af && stopAt < n);
  return obj;
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
    onError: function (operation, error) {
      console.log("Error in " + this.formId, operation, error);
    }
  });
};

/**
 * @property AutoForm.arrayTracker
 * @public
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
 * @return {Object}
 *
 * Call this method from a UI helper to get the field definitions based on the schema used by the closest containing autoForm.
 * Always throws an error or returns the schema object.
 */
AutoForm.getSchemaForField = function autoFormGetSchemaForField(name) {
  var ss = AutoForm.getFormSchema();
  return AutoForm.Utility.getDefs(ss, name);
};

/**
 * @method AutoForm.getLabelForField
 * @public
 * @param {String} name The field name attribute / schema key.
 * @return {Object}
 *
 * Call this method from a UI helper to get the field definitions based on the schema used by the closest containing autoForm.
 * Always throws an error or returns the schema object.
 */
AutoForm.getLabelForField = function autoFormGetSchemaForField(name) {
  var ss = AutoForm.getFormSchema(), label = ss.label(name);
  // for array items we don't want to inflect the label because
  // we will end up with a number;
  // TODO this check should probably be in the SimpleSchema code
  if (SimpleSchema._makeGeneric(name).slice(-1) === "$" && !isNaN(parseInt(label, 10))) {
    label = null;
  }
  return label;
};

/**
 * Gets the template instance for the form. The form
 * must be currently rendered. If not, returns `undefined`.
 * @param   {String}                     formId The form's `id` attribute
 * @returns {TemplateInstance|undefined} The template instance.
 */
AutoForm.templateInstanceForForm = function (formId) {
  var formElement = document.getElementById(formId);
  if (!formElement) {
    return;
  }

  var view = Blaze.getView(formElement);
  if (!view) {
    return;
  }

  // Currently we have an #unless wrapping the form,
  // so we need to go up a level. This should continue to
  // work even if we remove that #unless or add other wrappers.
  while (typeof view.templateInstance !== 'function' && view.parentView) {
    view = view.parentView;
  }

  return view.templateInstance();
};

/**
 * Looks in the document attached to the form to see if the
 * requested field exists and is an array. If so, returns the
 * length (count) of the array. Otherwise returns undefined.
 * @param   {String}           formId The form's `id` attribute
 * @param   {String}           field  The field name (schema key)
 * @returns {Number|undefined} Array count in the attached document.
 */
AutoForm.getArrayCountFromDocForField = function (formId, field) {
  var mDoc = AutoForm.reactiveFormData.sourceDoc(formId);
  var docCount;
  if (mDoc) {
    var keyInfo = mDoc.getInfoForKey(field);
    if (keyInfo && _.isArray(keyInfo.value)) {
      docCount = keyInfo.value.length;
    }
  }
  return docCount;
};

/**
 * Returns the current data context for a form. Always returns an object
 * or throws an error.
 * You can call this without a formId from within a helper and
 * the data for the nearest containing form will be returned.
 * @param   {String} formId The form's `id` attribute
 * @returns {Object} Current data context for the form, or an empty object.
 */
AutoForm.getCurrentDataForForm = function (formId) {
  var formElement;

  // get data for form with formId if passed
  if (formId) {
    formElement = document.getElementById(formId);
    if (!formElement) {
      throw new Error('No form with ID ' + formId + ' is currently rendered. If you are calling AutoForm.getCurrentDataForForm, or something that calls it, from within a template helper, try calling without passing a formId');
    }
    return Blaze.getData(formElement) || {};
  }

  // otherwise get data for nearest form from within helper
  var instance = Template.instance();
  if (!instance) {
    return {};
  }

  var view = instance.view;
  while (view && view.name !== 'Template.autoForm') {
    view = view.originalParentView || view.parentView;
  }

  if (view && view.name === 'Template.autoForm') {
    return Blaze.getData(view) || {};
  }

  return {};
};

/**
 * Returns the current data context for a form plus some extra properties.
 * Always returns an object or throws an error.
 * You can call this without a formId from within a helper and
 * the data for the nearest containing form will be returned.
 * @param   {String} [formId] The form's `id` attribute
 * @returns {Object} Current data context for the form, or an empty object.
 */
AutoForm.getCurrentDataPlusExtrasForForm = function (formId) {
  var data = AutoForm.getCurrentDataForForm(formId);

  data = _.clone(data);

  // add form type definition
  var formType = data.type || 'normal';
  data.formTypeDef = AutoForm._formTypeDefinitions[formType];
  if (!data.formTypeDef) {
    throw new Error('AutoForm: Form type "' + formType + '" has not been defined');
  }

  return data;
};

AutoForm.getFormCollection = function (formId) {
  var data = AutoForm.getCurrentDataForForm(formId);
  return AutoForm.Utility.lookup(data.collection);
};

/**
 * Gets the schema for a form, from the `schema` attribute if
 * provided, or from the schema attached to the `Mongo.Collection`
 * specified in the `collection` attribute. The form must be
 * currently rendered.
 * @param   {String}   formId The form's `id` attribute
 * @returns {SimpleSchema|undefined} The SimpleSchema instance
 */
AutoForm.getFormSchema = function (formId) {
  var schema = AutoForm.getCurrentDataForForm(formId).schema;
  if (schema) {
    return schema;
  } else {
    var collection = AutoForm.getFormCollection(formId);
    if (collection && typeof collection.simpleSchema === 'function') {
      return collection.simpleSchema();
    }
  }
};

/**
 * Call in a helper to get the containing form's `id` attribute. Reactive.
 * @returns {String} The containing form's `id` attribute value
 */
AutoForm.getFormId = function () {
  return AutoForm.getCurrentDataForForm().id;
};
