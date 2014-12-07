/* global AutoForm:true */
/* global formPreserve */
/* global Utility */
/* global Hooks */
/* global templatesById */
/* global deps */
/* global globalDefaultTemplate:true */
/* global defaultTypeTemplates:true */
/* global SimpleSchema */
/* global getFormValues */
/* global formValues */
/* global formData */
/* global inputTypeDefinitions */
/* global _validateField */
/* global _validateForm */
/* global arrayTracker */
/* global getInputType */
/* global formDeps */

// This file defines the public, exported API

AutoForm = AutoForm || {}; //exported

AutoForm.formPreserve = formPreserve;

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

  if (template && template.view._domrange) {
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
  if (!template || !template.view._domrange) {
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
  var template = templatesById[formId];
  if (!template || !template.view._domrange) {
    return;
  }

  // find AutoForm schema
  var data = formData[formId];
  // ss will be the schema for the `schema` attribute if present,
  // else the schema for the collection
  var ss = data.ss;

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
  typeDef = _.where(inputTypeDefinitions, {template: inputTypeTemplate})[0];

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
  _.extend(inputTypeDefinitions, obj);
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
  if (!template || !template.view._domrange) {
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
  // Gather all form values
  var formDocs = AutoForm.getFormValues(formId);

  return _validateForm(formId, formData[formId], formDocs);
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
    af = Template.parentData(n++);
  } while (af && !af._af);
  if (!af || !af._af) {
    throw new Error((type || "AutoForm.find") + " must be used within an autoForm block");
  }
  return af._af;
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
  var n = 0, af, val, stopAt = -1;
  // we go one level past _af so that we get the original autoForm or quickForm attributes, too
  do {
    af = Template.parentData(n++);
    if (af && af.atts && af.atts[attrName] !== void 0) {
      val = af.atts[attrName];
    } else if (af && af[attrName] !== void 0) {
      val = af[attrName];
    }
    if (af && af._af) {
      stopAt = n + 1;
    }
  } while (af && stopAt < n && val === void 0);
  return val;
};

/**
 * @method AutoForm.findAttributesWithPrefix
 * @param {String} prefix Attribute prefix
 * @public
 * @return {Object} An object containing all of the found attributes and their values, with the prefix removed from the keys.
 *
 * Call this method from a UI helper. Searches for attributes that start with the given prefix, looking up the parent context tree until the closest autoform is reached.
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
  return AutoForm.Utility.getDefs(ss, name);
};

/**
 * @method AutoForm.invalidateFormContext
 * @public
 * @param {String} formId The form ID.
 * @return {undefined}
 *
 * Call this to force invalidate the form context, such as when you're changing the `doc`
 * and it does not react by itself.
 */
AutoForm.invalidateFormContext = function autoFormInvalidateFormContext(formId) {
  formDeps[formId] = formDeps[formId] || new Tracker.Dependency();
  formDeps[formId].changed();
};

/**
 * @method AutoForm.isSubForm
 * @param {[type]} formId The form ID.
 * @param {[type]} [template] The current template for the form with the given ID.
 * @return {Boolean} Whether the given form is a subform (is contained within another form).
 */
AutoForm.isSubForm = function autoFormIsSubForm(formId, template) {
  template = template || templatesById[formId];
  var $form = template.$('form').first();
  return $form.parents('form').length > 0;
}
