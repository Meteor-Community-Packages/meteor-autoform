var defaultFramework = "bootstrap3";
var formPreserve = new FormPreserve("autoforms");

AutoForm = function(schema) {
  var self = this;
  if (schema instanceof SimpleSchema) {
    self._simpleSchema = schema;
  } else if ("Collection2" in Meteor && schema instanceof Meteor.Collection2) {
    self._collection = schema;
    self._simpleSchema = self._collection.simpleSchema();
  } else {
    self._simpleSchema = new SimpleSchema(schema);
  }

  self._hooks = {
    before: {
      //insert, update, remove, "methodName"
    },
    after: {
      //insert, update, remove, "methodName"
    },
    formToDoc: null,
    docToForm: null,
    onSubmit: null,
    onSuccess: null,
    onError: null
  };
};

AutoForm.prototype.simpleSchema = function() {
  return this._simpleSchema;
};

AutoForm.prototype.hooks = function(hooks) {
  _.extend(this._hooks, hooks);
};

AutoForm.resetForm = function(formId, simpleSchema) {
  if (typeof formId !== "string") {
    return;
  }

  simpleSchema && simpleSchema.namedContext(formId).resetValidation();
  clearSelections(formId);
};

if (typeof Handlebars !== 'undefined') {
  Handlebars.registerHelper("autoForm", function(options) {
    var hash = (options || {}).hash || {};

    //copy hash from quickForm if this is an autoForm created by the quickForm helper
    if (hash.qfHash) {
      hash = hash.qfHash;
    }

    var schemaObj = getAutoForm(hash.schema);

    // Set up the context to be used for everything within the autoform
    var autoFormContext = {};
    autoFormContext.context = (this instanceof Window) ? {} : _.clone(this);
    autoFormContext.atts = hash.atts || hash;
    
    //formId is used to track input selections so that they are retained
    //when the form is rerendered. If the id attribute is not provided,
    //we use a generic ID, which will usually still result in retension
    //of values, but might not work properly if any forms have input
    //elements (schema keys) with the same name
    var formId = autoFormContext.atts.id || "_afGenericID";
    autoFormContext.context._formId = formId;

    // formPreserve: retrieve doc after "hot code push"
    var retrievedDoc = formPreserve.getDocument(formId);
    if (retrievedDoc !== false) hash.doc = retrievedDoc;

    // Allow passing a Collection2 as the schema, but wrap in AutoForm
    if ("Collection2" in Meteor && schemaObj instanceof Meteor.Collection2) {
      schemaObj = new AutoForm(schemaObj);
    }

    var flatDoc;
    if (hash.doc) {
      var mDoc = new MongoObject(hash.doc);
      flatDoc = mDoc.getFlatObject();
      mDoc = null;
      var docToForm = schemaObj._hooks.docToForm || schemaObj.docToForm;

      if (typeof docToForm === "function") {
        flatDoc = docToForm(flatDoc);
      }
    } else {
      flatDoc = {};
    }

    // If a custom context was supplied, keep it
    autoFormContext.context._afObj = schemaObj;
    autoFormContext.context._ss = schemaObj.simpleSchema();
    autoFormContext.context._doc = hash.doc;
    autoFormContext.context._flatDoc = flatDoc;
    autoFormContext.context._framework = hash.framework || defaultFramework;
    autoFormContext.context._validationType = hash.validation || "submitThenKeyup";
    autoFormContext.context._resetOnSuccess = hash.resetOnSuccess;

    // Remove from hash everything that we don't want as a form attribute
    hash = cleanObj(hash, ["__content", "schema", "validation", "framework", "doc", "qfHash", "resetOnSuccess"]);

    return Template._autoForm.withData(autoFormContext);
  });

  Handlebars.registerHelper("quickForm", function(options) {
    var hash = (options || {}).hash || {};

    var autoForm = getAutoForm(hash.schema);

    var context = {
      formFields: []
    };

    var fieldWhitelist;
    if (hash.fields) {
      if (_.isArray(hash.fields)) {
        fieldWhitelist = hash.fields;
      } else if (typeof hash.fields === "string") {
        fieldWhitelist = hash.fields.replace(/ /g, '').split(',');
      }
    }

    var ss = autoform.simpleSchema();
    function addField(field, list) {
      var fieldDefs = ss.schema(field);

      // Don't include fields with denyInsert=true when it's an insert form
      if (fieldDefs.denyInsert && hash.type === "insert")
        return;

      // Don't include fields with denyUpdate=true when it's an update form
      if (fieldDefs.denyUpdate && hash.type === "update")
        return;

      // Don't include fields with array placeholders
      if (field.indexOf("$") !== -1)
        return;

      if (fieldDefs.type === Object) {
        var addedGroup, label = ss.label(field);
        _.each(ss._schemaKeys, function(key) {
          if (key.indexOf(field + ".") === 0) {
            if (!addedGroup) {
              addedGroup = {
                name: field,
                label: label,
                isGroup: true,
                formFields: []
              };
              context.formFields.push(addedGroup);
            }
            addField(key, addedGroup.formFields);
          }
        });
        return;
      }

      var info = {name: field};

      // If there are allowedValues defined, use them as select element options
      var av = fieldDefs.allowedValues;
      if (fieldDefs.type === Array) {
        var arrayItemDefs = ss.schema(field + ".$");
        av = arrayItemDefs.allowedValues;
      }
      if (_.isArray(av)) {
        info.options = "allowed";
      }

      list.push(info);
    }

    // Add top level (or requested) fields
    _.each(fieldWhitelist || ss.firstLevelSchemaKeys(), function(key) {
      addField(key, context.formFields);
    });

    // Prepare additional form customizations
    context.buttonClasses = hash.buttonClasses || "";
    context.buttonContent = hash.buttonContent || "Submit";
    context.needsButton = true;

    // Determine what type of form to create
    switch (hash.type) {
      case "insert":
      case "update":
      case "remove":
        context.buttonClasses += " " + hash.type;
        break;

      case "method":
        context.method = hash.method;
        break;

      case "readonly":
        context.isReadOnly = true;
        context.needsButton = false;
        break;

      case "disabled":
        context.isDisabled = true;
        context.needsButton = false;
        break;

      default:
        // Normal browser form submission
        break;
    }

    // Remove from hash everything that we don't want passed along to autoform
    hash = cleanObj(hash, ["__content", "buttonContent", "buttonClasses", "method", "type", "fields"]);

    // Store the hash for the autoForm helper to use
    context.qfHash = hash;

    return Template._quickForm.withData(context);
  });

  Template._autoForm.created = function() {
    var self = this;
    var formId = self.data.atts.id;
    formPreserve.registerForm(formId, function () {
      return formValues(self, self.data.context._afObj._hooks.formToDoc, self.data.context._ss);
    });
  };

  Template._autoForm.destroyed = function () {
    var self = this;
    self._notInDOM = true;
    var formId = self.data.atts.id;
    formPreserve.unregisterForm(formId);
  };

  Template._autoForm.afQuickField = function(name, options) {
    var hash = (options || {}).hash || {};
    var afContext = hash.autoform || this, ss = afContext._ss;
    if (!ss)
      throw new Error("afQuickField helper must be used within an autoForm block");

    var defs = getDefs(ss, name); //defs will not be undefined

    //boolean type renders a check box that already has a label, so don't generate another label
    var skipLabel = hash.label === false || (defs.type === Boolean && !("select" in hash) && !("radio" in hash));

    // Figure out the desired framework
    var framework = hash.framework || afContext._framework || defaultFramework;

    // Remove unwanted props from the hash
    hash = cleanObj(hash, ["framework", "label"]);

    //separate label options from input options; label items begin with "label-"
    var labelHash = {};
    var inputHash = {};
    _.each(hash, function(val, key) {
      if (key.indexOf("label-") === 0) {
        key = key.substring(6);
        labelHash[key] = val;
      } else {
        inputHash[key] = val;
      }
    });

    //set up context for _afQuickField template
    var qfContext = afContext || {};
    qfContext.name = name;
    qfContext.skipLabel = skipLabel;
    qfContext.labelHash = labelHash;
    qfContext.inputHash = inputHash;

    switch (framework) {
      case "bootstrap3":
        return Template._afQuickField_Bootstrap3.withData(qfContext);

      default:
        return Template._afQuickField_Plain.withData(qfContext);
    }
  };

  Template._autoForm.afFieldMessage = function(name, options) {
    var hash = (options || {}).hash || {};
    var autoform = hash.autoform || this, ss = autoform._ss;
    if (!ss) {
      throw new Error("afFieldMessage helper must be used within an autoForm block");
    }

    getDefs(ss, name); //for side effect of throwing errors when name is not in schema
    return ss.namedContext(autoform._formId).keyErrorMessage(name);
  };

  Template._autoForm.afFieldIsInvalid = function(name, options) {
    var hash = (options || {}).hash || {};
    var autoform = hash.autoform || this, ss = autoform._ss;
    if (!ss) {
      throw new Error("afFieldIsInvalid helper must be used within an autoForm block");
    }

    getDefs(ss, name); //for side effect of throwing errors when name is not in schema
    return ss.namedContext(autoform._formId).keyIsInvalid(name);
  };

  Template._autoForm.afFieldInput = function(name, options) {
    var hash = (options || {}).hash || {};

    //copy hash from quickField if this is an input created by the quickField helper
    if (hash.qfHash) {
      hash = hash.qfHash;
    }

    var afContext = hash.autoform || this, ss = afContext._ss;
    if (!ss) {
      throw new Error("afFieldInput helper must be used within an autoForm block");
    }

    var defs = getDefs(ss, name); //defs will not be undefined
    return getInputTemplate(name, afContext, defs, hash);
  };

  Template._autoForm.afFieldLabel = function(name, options) {
    var hash = (options || {}).hash || {};

    //copy hash from quickField if this is a label created by the quickField helper
    if (hash.qfHash) {
      hash = hash.qfHash;
    }

    var afContext = hash.autoform || this, ss = afContext._ss;
    if (!ss) {
      throw new Error("afFieldLabel helper must be used within an autoForm block");
    }

    var framework = hash.framework || afContext._framework || defaultFramework;
    var cls = hash["class"] || "";
    var element = hash.element || "label";
    
    if (element === "label" && !('for' in hash)) {
      hash.for = name;
    }

    hash = cleanObj(hash, ["autoform", "framework", "class", "element"]);

    var lblContext = {
      label: ss.label(name),
      cls: cls,
      element: element,
      atts: hash
    };

    //TODO merge element/framework/template concepts
    switch (framework) {
      case "bootstrap3":
        return Template._afLabel_Bootstrap3.withData(lblContext);

      default:
        return Template._afLabel_Plain.withData(lblContext);
    }
  };

  function doBefore(docId, doc, hook, name) {
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
    return doc;
  }

  Template._autoForm.events({
    'submit form': function(event, template) {
      var submitButton = template.find("button[type=submit]");
      if (!submitButton) {
        return;
      }

      submitButton.disabled = true;

      //determine what we want to do
      var isInsert = hasClass(submitButton, "insert");
      var isUpdate = hasClass(submitButton, "update");
      var isRemove = hasClass(submitButton, "remove");
      var method = submitButton.getAttribute("data-meteor-method");
      var isNormalSubmit = (!isInsert && !isUpdate && !isRemove && !method);

      //init
      var self = this, context = self.context;
      var validationType = context._validationType;
      var afObj = context._afObj;
      var hooks = afObj._hooks;
      var formId = context._formId;
      var currentDoc = context._doc || null;
      var docId = currentDoc ? currentDoc._id : null;
      var ss = context._ss;
      var resetOnSuccess = context._resetOnSuccess;
      
      // Gather hooks
      var beforeInsert = hooks.before.insert;
      var beforeUpdate = hooks.before.update;
      var beforeRemove = hooks.before.remove;
      var beforeMethod = method && hooks.before[method];
      var afterInsert = hooks.after.insert;
      var afterUpdate = hooks.after.update;
      var afterRemove = hooks.after.remove;
      var afterMethod = method && hooks.after[method];
      var onSuccess = hooks.onSuccess;
      var onError = hooks.onError;
      var onSubmit = hooks.onSubmit;
      
      // Prevent browser form submission if we're planning to do our own thing
      if (!isNormalSubmit) {
        event.preventDefault();
      }
      
      // Gather all form values
      var form = formValues(template, hooks.formToDoc, ss);
      
      // Execute before hooks
      var insertDoc = isInsert ? doBefore(null, form.insertDoc, beforeInsert, 'before.insert hook') : form.insertDoc;
      var updateDoc = isUpdate && !_.isEmpty(form.updateDoc) ? doBefore(docId, form.updateDoc, beforeUpdate, 'before.update hook') : form.updateDoc;
      var methodDoc = method ? doBefore(null, form.insertDoc, beforeMethod, 'before.method hook') : form.insertDoc;

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
      
      // Prep haltSubmission function
      function haltSubmission() {
        event.preventDefault();
        event.stopPropagation();
        submitButton.disabled = false;
      }
      
      // Prep function to select the focus the first field with an error
      function selectFirstInvalidField() {
        if (! ss.namedContext(formId).isValid()) {
          var ctx = ss.namedContext(formId);
          _.every(template.findAll('[data-schema-key]'), function (input) {
            if (ctx.keyIsInvalid(input.getAttribute('data-schema-key'))) {
              input.focus();
              return false;
            } else {
              return true;
            }
          });
        }
      }

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
          onError && onError(type, new Error('failed validation'), template);
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
          resetForm: function() {
            if (!template._notInDOM) {
              template.find("form").reset();
              var focusInput = template.find("[autofocus]");
              focusInput && focusInput.focus();
            }
          }
        };
        // Pass both types of doc to onSubmit
        var shouldContinue = onSubmit.call(context, insertDoc, updateDoc, currentDoc);
        if (shouldContinue === false) {
          return haltSubmission();
        }
      }
      
      // Prep callback creator function
      function makeCallback(name, afterHook) {
        return function(error, result) {
          if (error) {
            selectFirstInvalidField();
            onError && onError(name, error, template);
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
            onSuccess && onSuccess(name, result, template);
          }
          afterHook && afterHook(error, result, template);
          submitButton.disabled = false;
        };
      }
      
      // Now we will do the requested insert, update, remove, method, or normal
      // browser form submission. Even though we may have already validated above
      // if we have an onSubmit hook, we do it again upon insert or update
      // because collection2 validation catches additional stuff like unique.
      if (isInsert) {
        afObj._collection && afObj._collection.insert(insertDoc, {validationContext: formId}, makeCallback('insert', afterInsert));
      } else if (isUpdate) {
        if (!_.isEmpty(updateDoc)) {
          afObj._collection && afObj._collection.update(docId, updateDoc, {validationContext: formId}, makeCallback('update', afterUpdate));
        }
      } else if (isRemove) {
        //call beforeRemove if present, and stop if it's false
        if (beforeRemove && beforeRemove(docId) === false) {
          //stopped
          return haltSubmission();
        } else {
          afObj._collection && afObj._collection.remove(docId, makeCallback('remove', afterRemove));
        }
      }

      // We won't do an else here so that a method could be called in
      // addition to another action on the same submit
      if (method) {
        var methodDocForValidation = ss.clean(_.clone(methodDoc), {
          isModifier: true,
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
        Meteor.call(method, methodDoc, makeCallback(method, afterMethod));
      }

      formPreserve.unregisterForm(formId);
    },
    'keyup [data-schema-key]': function(event, template) {
      var validationType = template.data.context._validationType;
      var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup');
      var skipEmpty = !(event.keyCode === 8 || event.keyCode === 46); //if deleting or backspacing, don't skip empty
      if ((validationType === 'keyup' || validationType === 'submitThenKeyup')) {
        validateField(event.currentTarget.getAttribute("data-schema-key"), template, skipEmpty, onlyIfAlreadyInvalid);
      }
    },
    'blur [data-schema-key]': function(event, template) {
      var validationType = template.data.context._validationType;
      var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
      if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
        validateField(event.currentTarget.getAttribute("data-schema-key"), template, false, onlyIfAlreadyInvalid);
      }
    },
    'change [data-schema-key]': function(event, template) {
      if (event.currentTarget.nodeName.toLowerCase() === "select") {
        //workaround for selection being lost on rerender
        //store the selections in memory and reset in rendered
        setSelections(event.currentTarget, template.data._formId);
      }
      var validationType = template.data.context._validationType;
      var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
      if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
        validateField(event.currentTarget.getAttribute("data-schema-key"), template, false, onlyIfAlreadyInvalid);
      }
    },
    'reset form': function() {
      var self = this, context = self.context, ss = context._ss, formId = context._formId;
      if (ss && formId) {
        AutoForm.resetForm(formId, ss);
        formPreserve.unregisterForm(formId);
      }
    }
  });

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

var maybeNum = function(val) {
  // Convert val to a number if possible; otherwise, just use the value
  var floatVal = parseFloat(val);
  if (!isNaN(floatVal)) {
    return floatVal;
  } else {
    return val;
  }
};

var formValues = function(template, transform, ss) {
  var fields = template.findAll("[data-schema-key]");
  var doc = {};
  _.each(fields, function(field) {
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
      val = val.replace(/ /g, "T");
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
      val = val.replace(/ /g, "T");
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
  if (typeof transform === "function") {
    doc = transform(doc);
  }
  // We return doc, insertDoc, and updateDoc.
  // For insertDoc, delete any properties that are null, undefined, or empty strings,
  // and expand to use subdocuments instead of dot notation keys.
  // For updateDoc, convert to modifier object with $set and $unset.
  // Do not add auto values to either.
  var result = {
    doc: doc,
    insertDoc: ss.clean(expandObj(cleanNulls(doc)), {
      isModifier: true,
      getAutoValues: false
    }),
    updateDoc: ss.clean(docToModifier(doc), {
      isModifier: true,
      getAutoValues: false
    })
  };
  return result;
};

var expandObj = function(doc) {
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
};

var cleanNulls = function(doc) {
  var newDoc = {};
  _.each(doc, function(val, key) {
    if (val !== void 0 && val !== null && !(typeof val === "string" && val.length === 0)) {
      newDoc[key] = val;
    }
  });
  return newDoc;
};

var reportNulls = function(doc) {
  var nulls = {};
  _.each(doc, function(val, key) {
    if (val === void 0 || val === null || (typeof val === "string" && val.length === 0)) {
      nulls[key] = "";
    }
  });
  return nulls;
};

//returns true if dateString is a "valid date string"
var isValidDateString = function(dateString) {
  var m = moment(dateString, 'YYYY-MM-DD', true);
  return m && m.isValid();
};

//returns true if timeString is a "valid time string"
var isValidTimeString = function(timeString) {
  if (typeof timeString !== "string")
    return false;

  //this reg ex actually allows a few invalid hours/minutes/seconds, but
  //we can catch that when parsing
  var regEx = /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9](\.[0-9]{1,3})?)?$/;
  return regEx.test(timeString);
};

//returns a "valid date string" representing the local date
var dateToDateString = function(date) {
  var m = (date.getMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getFullYear() + '-' + m + '-' + d;
};

//returns a "valid date string" representing the date converted to the UTC time zone
var dateToDateStringUTC = function(date) {
  var m = (date.getUTCMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getUTCDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getUTCFullYear() + '-' + m + '-' + d;
};

//returns a "valid normalized forced-UTC global date and time string" representing the time converted to the UTC time zone and expressed as the shortest possible string for the given time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute)
//http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#date-and-time-state-(type=datetime)
//http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-normalized-forced-utc-global-date-and-time-string
var dateToNormalizedForcedUtcGlobalDateAndTimeString = function(date) {
  return moment(date).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
};

//returns true if dateString is a "valid normalized forced-UTC global date and time string"
var isValidNormalizedForcedUtcGlobalDateAndTimeString = function(dateString) {
  if (typeof dateString !== "string")
    return false;

  var datePart = dateString.substring(0, 10);
  var tPart = dateString.substring(10, 11);
  var timePart = dateString.substring(11, dateString.length - 1);
  var zPart = dateString.substring(dateString.length - 1);
  return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart) && zPart === "Z";
};

//returns a "valid normalized local date and time string"
var dateToNormalizedLocalDateAndTimeString = function(date, offset) {
  var m = moment(date);
  m.zone(offset);
  return m.format("YYYY-MM-DD[T]hh:mm:ss.SSS");
};

var isValidNormalizedLocalDateAndTimeString = function(dtString) {
  if (typeof dtString !== "string")
    return false;

  var datePart = dtString.substring(0, 10);
  var tPart = dtString.substring(10, 11);
  var timePart = dtString.substring(11, dtString.length);
  return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart);
};

var getSelectValues = function(select) {
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
};


var getInputTemplate = function(name, autoform, defs, hash) {
  var schemaType = defs.type;

  // Adjust for array fields if necessary
  var expectsArray = false;
  if (schemaType === Array) {
    defs = autoform._ss.schema(name + ".$");
    schemaType = defs.type;

    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    expectsArray = !hash.type;
  }

  // Determine what the current value is, if any
  var value;
  if (typeof hash.value === "undefined") {
    var flatDoc = autoform._flatDoc, arrayVal;
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
    if (expectsArray && ! (value instanceof Array)) {
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

  var label = autoform._ss.label(name);
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
  var framework = hash.framework || autoform._framework || defaultFramework;

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
  hash = cleanObj(hash, [
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
    "framework",
    "offset"
  ]);


  // Determine which template to render and what options to use
  var template, data = {};
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
    if (noselect) {
      if (expectsArray) {
        template = "_afCheckboxGroup";
      } else {
        template = "_afRadioGroup";
      }
    } else {
      hash.autocomplete = "off"; //can fix issues with some browsers selecting the firstOption instead of the selected option
      if (expectsArray) {
        hash.multiple = "";
      }
      data.firstOption = (firstOption && !expectsArray) ? firstOption : "";
      data.cls = hash["class"] || "";
      hash = cleanObj(hash, ["class"]);
      data.atts = hash;
      template = "_afSelect";
    }
  } else if (type === "textarea") {
    if (typeof hash.maxlength === "undefined" && typeof max === "number") {
      hash.maxlength = max;
    }
    data.cls = hash["class"] || "";
    hash = cleanObj(hash, ["class"]);
    data.atts = hash;
    template = "_afTextarea";
  } else if (type === "contenteditable") {
    //TODO convert this type
    //html = '<div contenteditable="true" data-schema-key="' + name + '" name="' + name + '"' + objToAttributes(hash) + req + max + '>' + value + '</div>';
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
      template = "_afRadioGroup";
    } else if (select) {
      data.items = items;
      data.cls = hash["class"] || "";
      hash = cleanObj(hash, ["class"]);
      data.atts = hash;
      template = "_afSelect";
    } else {
      //don't add required attribute to this one because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
      delete hash.required;
      data.label = label;
      data.value = "true";
      data.checked = value ? "checked" : "";
      data.atts = hash;
      template = "_afCheckbox";
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
    hash = cleanObj(hash, ["class"]);
    data.atts = hash;
    template = "_afInput";
  }

  // Return the correct template
  switch (framework) {
    case "bootstrap3":
      template += "_Bootstrap3";
      break;
    default:
      template += "_Plain";
      break;
  }
  return Template[template].withData(data);
};

var cleanObj = function(hash, props) {
  _.each(props, function(prop) {
    if (prop in hash) {
      delete hash[prop];
    }
  });

  return hash;
};

var _validateField = function(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (!template || template._notInDOM) {
    return;
  }

  var formId = template.data.context._formId;
  var afObj = template.data.context._afObj;

  var ss = afObj.simpleSchema();

  if (onlyIfAlreadyInvalid &&
          ss.namedContext(formId).isValid()) {
    return;
  }

  // Create a document based on all the values of all the inputs on the form
  var form = formValues(template, afObj._hooks.formToDoc, ss);

  // Determine whether we're validating for an insert or an update
  var isUpdate = !!template.find("button.update");

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
      filter: false,
      autoConvert: false,
      extendAutoValueContext: {
        userId: (Meteor.userId && Meteor.userId()) || null
      }
    });
    afObj.simpleSchema().namedContext(formId).validateOne(form.updateDoc, key, {
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
    afObj.simpleSchema().namedContext(formId).validateOne(form.insertDoc, key, {
      modifier: false,
      extendedCustomContext: {
        userId: (Meteor.userId && Meteor.userId()) || null
      }
    });
  }
};
//throttling function that calls out to _validateField
var vok = {}, tm = {};
var validateField = function(key, template, skipEmpty, onlyIfAlreadyInvalid) {
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

var autoformSelections = {};
var setSelections = function(select, formId) {
  var key = select.getAttribute('data-schema-key');
  if (!key) {
    return;
  }
  var selections = [];
  for (var i = 0, ln = select.length, opt; i < ln; i++) {
    opt = select.options[i];
    if (opt.selected) {
      selections.push(opt.value);
    }
  }
  if (!(formId in autoformSelections)) {
    autoformSelections[formId] = {};
  }
  autoformSelections[formId][key] = selections;
};
var clearSelections = function(formId) {
  if (formId in autoformSelections) {
    delete autoformSelections[formId];
  }
};
var hasSelections = function(formId) {
  return (formId in autoformSelections);
};
var getSelections = function(formId) {
  return autoformSelections[formId];
};

var hasClass = function(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
};

var docToModifier = function(doc) {
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
};

var getDefs = function(ss, name) {
  if (typeof name !== "string") {
    throw new Error("Invalid field name: (not a string)");
  }

  var defs = ss.schema(name);
  if (!defs)
    throw new Error("Invalid field name: " + name);
  return defs;
};

var getAutoForm = function(autoform) {
  if (typeof autoform === "string") {
    if (!window || !window[autoform]) {
      throw new Error("autoForm schema " + autoform + " is not in the window scope");
    }
    autoform = window[autoform];
  }

  // Allow passing a Collection2 as the schema, but wrap in AutoForm
  if ("Collection2" in Meteor && autoform instanceof Meteor.Collection2) {
    autoform = new AutoForm(autoform);
  }

  if (typeof autoform.simpleSchema !== "function") {
    throw new Error('autoForm schema must be an object with a "simpleSchema" method');
  }

  return autoform;
};
