/* global _validateForm:true, AutoForm, getFormValues, validateField:true, getAllFieldsInForm */

/*
 * all form validation logic is here
 */

_validateForm = function _validateForm(formId, formDocs, useCollectionSchema) {
  var ss, docId, isValid, collection;
  var form = AutoForm.getCurrentDataForForm(formId);

  if (form.validation === 'none') {
    return true;
  }

  ss = AutoForm.getFormSchema(formId);
  collection = AutoForm.getFormCollection(formId);
  // We use the schema for the `schema` attribute if present,
  // else the schema for the collection. If there is a `schema`
  // attribute but you want to force validation against the
  // collection's schema instead, pass useCollectionSchema=true
  ss = (useCollectionSchema && collection) ? collection.simpleSchema() : ss;

  docId = (form.doc && form.doc._id) || null;

  // Perform validation
  if (form.type === "update" || form.type === "method-update") {
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

function _validateField(key, template, ss, skipEmpty, onlyIfAlreadyInvalid) {
  var docToValidate, isModifier;

  // Due to throttling, this can be called after the autoForm template is destroyed.
  // If that happens, we exit without error.
  if (!template || !template.view._domrange || template.view.isDestroyed) {
    return;
  }

  var context = template.data;
  var formId = context.id;
  var form = AutoForm.getCurrentDataForForm(formId);
  var docId = (form.doc && form.doc._id) || null;

  // Skip validation if onlyIfAlreadyInvalid is true and the form is
  // currently valid.
  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  var formDocs = getFormValues(template, formId, ss);

  // Clean and validate doc
  if (form.type === "update" || form.type === "method-update") {
    docToValidate = formDocs.updateDoc;
    isModifier = true;
  } else {
    docToValidate = formDocs.insertDoc;
    isModifier = false;
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !AutoForm.Utility.objAffectsKey(docToValidate, key)) {
    return true; //skip validation
  }

  return validateFormDoc(docToValidate, isModifier, formId, ss, docId, key);
}

// Throttle field validation to occur at most every 300ms,
// with leading and trailing calls.
validateField = _.throttle(_validateField, 300);


/*
 * PRIVATE
 */

function validateFormDoc(doc, isModifier, formId, ss, docId, key) {
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
  var docForValidation = _.clone(doc);
  ss.clean(docForValidation, {
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
}

// Selects the focus the first field with an error
function selectFirstInvalidField(formId, ss) {
  var ctx = ss.namedContext(formId), template, fields;
  if (!ctx.isValid()) {
    template = AutoForm.templateInstanceForForm(formId);
    fields = getAllFieldsInForm(template);
    fields.each(function () {
      var f = $(this);
      if (ctx.keyIsInvalid(f.attr('data-schema-key'))) {
        f.focus();
        return false;
      }
    });
  }
}
