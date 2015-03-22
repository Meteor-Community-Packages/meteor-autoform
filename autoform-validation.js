/* global _validateForm:true, AutoForm, validateField:true, getAllFieldsInForm */

/*
 * all form validation logic is here
 */

_validateForm = function _validateForm(formId, formDocs, useCollectionSchema) {
  var form = AutoForm.getCurrentDataForForm(formId);
  var formType = form.type;

  if (form.validation === 'none') {
    return true;
  }

  // Call validateForm from the requested form type definition
  var ftd = AutoForm._formTypeDefinitions[formType];
  if (!ftd) {
    throw new Error('AutoForm: Form type "' + formType + '" has not been defined');
  }

  return ftd.validateForm.call({
    form: form,
    formDocs: formDocs,
    useCollectionSchema: useCollectionSchema
  });
};

function _validateField(key, formId, skipEmpty, onlyIfAlreadyInvalid) {
  var docToValidate, isModifier;

  // Due to throttling, this can be called after the autoForm template is destroyed.
  // If that happens, we exit without error.
  var template;
  try{
    template = AutoForm.templateInstanceForForm(formId);
  }catch(e){}
  if (!template || !template.view._domrange || template.view.isDestroyed) {
    return;
  }

  var form = AutoForm.getCurrentDataForForm(formId);
  var ss = AutoForm.getFormSchema(formId);

  if (!ss) {
    return;
  }

  // Skip validation if onlyIfAlreadyInvalid is true and the form is
  // currently valid.
  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return; //skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  var formDocs = AutoForm.getFormValues(formId, template, ss);

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

  return AutoForm._validateFormDoc(docToValidate, isModifier, formId, ss, form, key);
}

// Throttle field validation to occur at most every 300ms,
// with leading and trailing calls.
validateField = _.throttle(_validateField, 300);
