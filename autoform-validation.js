/*
 * all form validation logic is here
 */

validateFormDoc = function validateFormDoc(doc, isModifier, formId, ss, docId, key) {
  var ec = {
    userId: (Meteor.userId && Meteor.userId()) || null,
    isInsert: !isModifier,
    isUpdate: !!isModifier,
    isUpsert: false,
    isFromTrustedCode: false,
    docId: docId
  };

  // Get a version of the doc that has auto values to validate here. We
  // don't want to actually send any auto values to the server because
  // we ultimately want them generated on the server
  var docForValidation = ss.clean(_.clone(doc), {
    isModifier: isModifier,
    filter: false,
    autoConvert: false,
    trimStrings: false,
    extendAutoValueContext: ec
  });

  // Validate
  // If `key` is provided, we validate that key/field only
  if (key) {
    return ss.namedContext(formId).validateOne(docForValidation, key, {
      modifier: isModifier,
      extendedCustomContext: ec
    });
  } else {
    return ss.namedContext(formId).validate(docForValidation, {
      modifier: isModifier,
      extendedCustomContext: ec
    });
  }
};

_validateForm = function _validateForm(formId, formDetails, formDocs, useCollectionSchema) {
  var ss, docId, isValid;

  if (formDetails.validationType === 'none')
    return true;

  // We use the schema for the `schema` attribute if present,
  // else the schema for the collection. If there is a `schema`
  // attribute but you want to force validation against the
  // collection's schema instead, pass useCollectionSchema=true
  ss = (useCollectionSchema && formDetails.collection) ? formDetails.collection.simpleSchema() : formDetails.ss;

  docId = formDetails.doc && formDetails.doc._id || null;

  // Perform validation
  if (formDetails.submitType === "update") {
    // For a type="update" form, we validate the modifier. We don't want to throw
    // errors about missing required fields, etc.
    isValid = validateFormDoc(formDocs.updateDoc, true, formId, ss, docId);
  } else {
    // For any other type of form, we validate the document.
    isValid = validateFormDoc(formDocs.insertDoc, false, formId, ss, docId);
  }

  if (!isValid) {
    selectFirstInvalidField(formId, ss);
  }

  return isValid;
};

_validateField = function _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  // Due to throttling, this can be called after the autoForm template is destroyed.
  // If that happens, we exit without error.
  if (!template || !template.view._domrange || template.view.isDestroyed) {
    return;
  }

  var context = template.data;
  var formId = context.id || defaultFormId;
  var formDetails = formData[formId];
  var docId = formDetails.doc && formDetails.doc._id || null;
  var ss = formDetails.ss;

  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  var formDocs = getFormValues(template, formId, ss);

  // Clean and validate doc
  if (formDetails.submitType === "update") {
    var docToValidate = formDocs.updateDoc;
    var isModifier = true;
  } else {
    var docToValidate = formDocs.insertDoc;
    var isModifier = false;
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !AutoForm.Utility.objAffectsKey(docToValidate, key))
    return true; //skip validation

  return validateFormDoc(docToValidate, isModifier, formId, ss, docId, key);
};

// Throttle field validation to occur at most every 300ms,
// with leading and trailing calls.
validateField = _.throttle(_validateField, 300);

// Selects the focus the first field with an error
selectFirstInvalidField = function selectFirstInvalidField(formId, ss) {
  var ctx = ss.namedContext(formId), template, fields;
  if (!ctx.isValid()) {
    template = templatesById[formId];
    fields = getAllFieldsInForm(template);
    fields.each(function () {
      var f = $(this);
      if (ctx.keyIsInvalid(f.attr('data-schema-key'))) {
        f.focus();
        return false;
      }
    });
  }
};
