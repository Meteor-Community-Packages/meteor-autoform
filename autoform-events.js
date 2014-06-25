function doBefore(docId, doc, hooks, template, name) {
  // We pass the template instance in case the hook
  // needs the data context
  _.each(hooks, function doBeforeHook(hook) {
    if (hook) {
      if (docId) {
        doc = hook(docId, doc, template);
      } else {
        doc = hook(doc, template);
      }
      if (!_.isObject(doc)) {
        throw new Error(name + " must return an object");
      }
    }
  });
  return doc;
}

function beginSubmit(formId, template) {
  if (!template || template._notInDOM)
    return;
  // Get user-defined hooks
  var hooks = Hooks.getHooks(formId, 'beginSubmit');
  if (hooks.length) {
    _.each(hooks, function beginSubmitHooks(hook) {
      hook(formId, template);
    });
  } else {
    // If there are no user-defined hooks, by default we disable the submit button during submission
    var submitButton = template.find("button[type=submit]") || template.find("input[type=submit]");
    if (submitButton) {
      submitButton.disabled = true;
    }
  }
}

function endSubmit(formId, template) {
  if (!template || template._notInDOM)
    return;
  // Get user-defined hooks
  var hooks = Hooks.getHooks(formId, 'endSubmit');
  if (hooks.length) {
    _.each(hooks, function endSubmitHooks(hook) {
      hook(formId, template);
    });
  } else {
    // If there are no user-defined hooks, by default we disable the submit button during submission
    var submitButton = template.find("button[type=submit]") || template.find("input[type=submit]");
    if (submitButton) {
      submitButton.disabled = false;
    }
  } 
}

Template.autoForm.events({
  'submit form': function autoFormSubmitHandler(event, template) {
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
    var schema = context.schema;
    // ss will be the schema for the `schema` attribute if present,
    // else the schema for the collection
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
      // Run endSubmit hooks (re-enabled submit button or form, etc.)
      endSubmit(formId, template);
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
        // Run endSubmit hooks (re-enabled submit button or form, etc.)
        endSubmit(formId, template);
      };
    }

    // If type is "remove", do that right away since we don't need to gather
    // form values or validate.
    if (isRemove) {
      // Run beginSubmit hooks (disable submit button or form, etc.)
      beginSubmit(formId, template);

      // Call beforeRemove hooks if present, and stop if any return false
      var shouldStop = _.any(beforeRemove, function eachBeforeRemove(hook) {
        return (hook(docId, template) === false);
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

    // Run beginSubmit hooks (disable submit button or form, etc.)
    // NOTE: This needs to stay after getFormValues in case a
    // beginSubmit hook disables inputs. We don't get values for
    // disabled inputs, but if they are just disabling during submission,
    // then we actually do want the values.
    beginSubmit(formId, template);

    // Execute some before hooks
    var insertDoc = isInsert ? doBefore(null, form.insertDoc, beforeInsert, template, 'before.insert hook') : form.insertDoc;
    var updateDoc = isUpdate && !_.isEmpty(form.updateDoc) ? doBefore(docId, form.updateDoc, beforeUpdate, template, 'before.update hook') : form.updateDoc;

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
      // If there is an override schema supplied, validate against that first
      if (schema && !isValid(insertDocForValidation, false, 'pre-submit validation')) {
        return haltSubmission();
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
        // If there is an override schema supplied, validate against that first
        if (schema) {
          // Get a version of the doc that has auto values to validate here. We
          // don't want to actually send any auto values to the server because
          // we ultimately want them generated on the server
          var updateDocForValidation = ss.clean(_.clone(updateDoc), {
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
          if (!isValid(updateDocForValidation, true, 'pre-submit validation')) {
            return haltSubmission();
          }
        }
        collection.update(docId, updateDoc, {validationContext: formId}, updateCallback);
      }
    }

    // We won't do an else here so that a method could be called in
    // addition to another action on the same submit
    if (method) {
      var methodDoc = doBefore(null, form.insertDoc, beforeMethod, template, 'before.method hook');
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
      Meteor.call(method, methodDoc, form.updateDoc, docId, makeCallback(method, afterMethod));
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
  'keydown .autoform-array-item input': function (event, template) {
    // When enter is pressed in an array item field, default behavior
    // seems to be to "click" the remove item button. This doesn't make
    // sense so we stop it.
    if (event.keyCode === 13) {
      event.preventDefault();
    }
  },
  'click .autoform-remove-item': function autoFormClickRemoveItem(event, template) {
    var self = this; // This type of button must be used within an afEachArrayItem block, so we know the context

    event.preventDefault();

    var name = self.arrayFieldName;
    var minCount = self.minCount; // optional, overrides schema
    var maxCount = self.maxCount; // optional, overrides schema
    var index = self.index;
    var data = template.data;
    var formId = data && data.id || defaultFormId;
    var ss = formData[formId].ss;

    // remove the item we clicked
    arrayTracker.removeFromFieldAtIndex(formId, name, index, ss, minCount, maxCount);
  },
  'click .autoform-add-item': function autoFormClickAddItem(event, template) {
    event.preventDefault();

    // We pull from data attributes because the button could be manually
    // added anywhere, so we don't know the data context.
    var btn = $(event.currentTarget);
    var name = btn.attr("data-autoform-field");
    var minCount = btn.attr("data-autoform-minCount"); // optional, overrides schema
    var maxCount = btn.attr("data-autoform-maxCount"); // optional, overrides schema
    var data = template.data;
    var formId = data && data.id || defaultFormId;
    var ss = formData[formId].ss;

    arrayTracker.addOneToField(formId, name, ss, minCount, maxCount);
  }
});