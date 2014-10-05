_validateForm = function _validateForm(formId, formDetails, formDocs, useCollectionSchema) {
  if (formDetails.validationType === 'none')
    return true;

  // We use the schema for the `schema` attribute if present,
  // else the schema for the collection. If there is a `schema`
  // attribute but you want to force validation against the
  // collection's schema instead, pass useCollectionSchema=true
  var ss = (useCollectionSchema && formDetails.collection) ? formDetails.collection.simpleSchema() : formDetails.ss;
  
  var docId = formDetails.doc && formDetails.doc._id || null;

  // Perform validation
  if (formDetails.submitType === "update") {
    // For a type="update" form, we validate the modifier. We don't want to throw
    // errors about missing required fields, etc.
    return validateFormDoc(formDocs.updateDoc, true, formId, ss, docId);
  } else {
    // For any other type of form, we validate the document.
    return validateFormDoc(formDocs.insertDoc, false, formId, ss, docId);
  }
};

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

_validateField = function _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (!template || template._notInDOM) {
    return; //skip validation
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
  if (skipEmpty && !Utility.objAffectsKey(docToValidate, key))
    return true; //skip validation

  return validateFormDoc(docToValidate, isModifier, formId, ss, docId, key);
};

//throttling function that calls out to _validateField
var vok = {}, tm = {}, _prevent = false;
validateField = function validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (vok[key] === false) {
    Meteor.clearTimeout(tm[key]);
    tm[key] = Meteor.setTimeout(function() {
      vok[key] = true;
      if (!_prevent) {
        _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid);
      }
    }, 300);
    return;
  }
  vok[key] = false;
  if (!_prevent) {
    _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid);
  }
};

// To prevent issues with keyup validation firing right after we've
// invalidated due to submission, we can quickly and temporarily stop
// field validation.
preventQueuedValidation = function preventQueuedValidation() {
  _prevent = true;
  Meteor.setTimeout(function() {
    _prevent = false;
  }, 500);
};

// Prep function to select the focus the first field with an error
selectFirstInvalidField = function selectFirstInvalidField(formId, ss, template) {
  var ctx = ss.namedContext(formId);
  if (!ctx.isValid()) {
    // Exclude fields in sub-forms, since they will belong to a different AutoForm and schema.
    var fields = template.$('[data-schema-key]').not(template.$('form form [data-schema-key]'));
    fields.each(function () {
      var f = $(this);
      if (ctx.keyIsInvalid(f.attr('data-schema-key'))) {
        f.focus();
        return false;
      }
    });
  }
};