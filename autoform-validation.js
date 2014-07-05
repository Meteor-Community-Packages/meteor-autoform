_validateForm = function _validateForm(formId, template) {
  // First gether necessary form details
  var data = formData[formId];
  var isInsert = (data.submitType === "insert");
  var isUpdate = (data.submitType === "update");
  var isRemove = (data.submitType === "remove");
  var method = data.submitMethod;
  var isNormalSubmit = (!isInsert && !isUpdate && !isRemove && !method);
  var validationType = data.validationType;
  var skipValidate = (validationType === 'none');
  // ss will be the schema for the `schema` attribute if present,
  // else the schema for the collection
  var ss = data.ss;
  var currentDoc = data.doc;
  var docId = currentDoc ? currentDoc._id : null;

  // Gather all form values
  var form = getFormValues(template, formId, ss);

  // Perform validation
  var result = {};
  if (method) {
    // For a form that calls a method, we validate the doc after running it through
    // all before hooks for the method.
    var beforeMethod = Hooks.getHooks(formId, 'before', method);
    var methodDoc = doBefore(null, form.insertDoc, beforeMethod, template, 'before.method hook');
    result.methodDoc = methodDoc;
    result.methodDocIsValid = skipValidate || validateFormDoc(methodDoc, false, formId, ss);
  }

  if (isUpdate) {
    // For an update form, we validate the modifier after running it through
    // all before update hooks.
    var beforeUpdate = Hooks.getHooks(formId, 'before', 'update');
    var updateDoc = doBefore(docId, form.updateDoc, beforeUpdate, template, 'before.update hook');
    result.updateDoc = updateDoc;
    result.updateDocIsValid = skipValidate || validateFormDoc(updateDoc, true, formId, ss);
  } else if (isInsert) {
    // For an insert form, we validate the doc after running it through
    // all before insert hooks.
    var beforeInsert = Hooks.getHooks(formId, 'before', 'insert');
    var insertDoc = doBefore(null, form.insertDoc, beforeInsert, template, 'before.insert hook');
    result.insertDoc = insertDoc;
    result.insertDocIsValid = skipValidate || validateFormDoc(insertDoc, false, formId, ss);
  }

  var onSubmit = Hooks.getHooks(formId, 'onSubmit');
  if (onSubmit.length > 0 || isNormalSubmit) {
    // onSubmit hooks receive both insert doc and update modifier, but
    // we only need to validate the insert doc; neither go through any
    // before hooks.
    result.submitDoc = form.insertDoc;
    result.submitDocIsValid = skipValidate || validateFormDoc(form.insertDoc, false, formId, ss);
    result.submitUpdateDoc = form.updateDoc;
  }

  return result;
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
var vok = {}, tm = {};
validateField = function validateField(key, template, skipEmpty, onlyIfAlreadyInvalid) {
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