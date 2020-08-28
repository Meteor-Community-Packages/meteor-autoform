import { throttle } from './common'
import { Utility } from './utility';

/* global AutoForm, validateField:true */

/**
 * Validates a field on a given form by id.
 * @param key {String} a specific schema key to validate
 * @param formId {String} the id the form the key belongs to
 * @param skipEmpty {Boolean} allows to skip validation if the key has no value
 * @param onlyIfAlreadyInvalid
 * @return {*}
 * @private
 */
const _validateField = function _validateField(key, formId, skipEmpty, onlyIfAlreadyInvalid) {
  // Due to throttling, this can be called after the autoForm template is destroyed.
  // If that happens, we exit without error.
  const template = AutoForm.templateInstanceForForm(formId);

  // If form is not currently rendered, return true
  if (!Utility.checkTemplate(template)) return true;

  const form = AutoForm.getCurrentDataForForm(formId);
  const ss = AutoForm.getFormSchema(formId, form);

  if (!ss) return true;

  // Skip validation if onlyIfAlreadyInvalid is true and the form is
  // currently valid.
  if (onlyIfAlreadyInvalid && ss.namedContext(formId).isValid()) {
    return true; // skip validation
  }

  // Create a document based on all the values of all the inputs on the form
  // Get the form type definition
  const ftd = Utility.getFormTypeDef(form.type);

  // Clean and validate doc
  const docToValidate = AutoForm.getFormValues(formId, template, ss, !!ftd.usesModifier);

  // If form is not currently rendered, return true
  if (!docToValidate) {
    return true;
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !AutoForm.Utility.objAffectsKey(docToValidate, key)) {
    return true; // skip validation
  }

  return AutoForm._validateFormDoc(docToValidate, !!ftd.usesModifier, formId, ss, form, key);
}

// Throttle field validation to occur at most every 300ms,
// with leading and trailing calls.
export const validateField = throttle(_validateField, 300);

// make the original function available to tests
if (Meteor.isPackageTest) {
  export { _validateField };
}
