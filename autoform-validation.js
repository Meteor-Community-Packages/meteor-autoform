_validateForm = function _validateForm(formId, template) {
  // First gether necessary form details
  var data = formData[formId];
  var skipValidate = (data.validationType === 'none');
  var ss = data.ss;
  // ss will be the schema for the `schema` attribute if present,
  // else the schema for the collection

  // Gather all form values
  var form = getFormValues(template, formId, ss);

  // Perform validation
  form.insertDocIsValid = skipValidate || validateFormDoc(form.insertDoc, false, formId, ss);

  return form;
};

validateFormDoc = function validateFormDoc(doc, isModifier, formId, ss) {
  var ec = {
    userId: (Meteor.userId && Meteor.userId()) || null,
    isInsert: !isModifier,
    isUpdate: !!isModifier,
    isUpsert: false,
    isFromTrustedCode: false
  };

  // Get a version of the doc that has auto values to validate here. We
  // don't want to actually send any auto values to the server because
  // we ultimately want them generated on the server
  var docForValidation = ss.clean(_.clone(doc), {
    isModifier: isModifier,
    filter: false,
    autoConvert: false,
    extendAutoValueContext: ec
  });

  // Validate
  return ss.namedContext(formId).validate(docForValidation, {
    modifier: isModifier,
    extendedCustomContext: ec
  });
};

_validateField = function _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (!template || template._notInDOM) {
    return; //skip validation
  }

  var context = template.data;
  var formId = context.id || defaultFormId;
  var ss = Utility.getSimpleSchemaFromContext(context, formId);

  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  var form = getFormValues(template, formId, ss);

  // Clean and validate doc
  if (context.type === "update") {
    var docToValidate = form.updateDoc;
    var isModifier = true;
  } else {
    var docToValidate = form.insertDoc;
    var isModifier = false;
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !Utility.objAffectsKey(docToValidate, key))
    return; //skip validation

  var userId = (Meteor.userId && Meteor.userId()) || null;

  // getFormValues did some cleaning but didn't add auto values; add them now
  ss.clean(docToValidate, {
    isModifier: isModifier,
    filter: false,
    autoConvert: false,
    extendAutoValueContext: {
      userId: userId,
      isInsert: !isModifier,
      isUpdate: isModifier,
      isUpsert: false,
      isFromTrustedCode: false
    }
  });
  return ss.namedContext(formId).validateOne(docToValidate, key, {
    modifier: isModifier,
    extendedCustomContext: {
      userId: userId,
      isInsert: !isModifier,
      isUpdate: isModifier,
      isUpsert: false,
      isFromTrustedCode: false
    }
  });
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
  	template.$('[data-schema-key]').each(function () {
  	  var f = $(this);
  	  if (ctx.keyIsInvalid(f.attr('data-schema-key'))) {
        f.focus();
        return false;
      }
  	});
  }
};