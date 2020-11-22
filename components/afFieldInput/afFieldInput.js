/* global AutoForm, getInputValue, getInputData, updateTrackedFieldValue */

import { getInputData, getInputValue, updateTrackedFieldValue } from '../../autoform-inputs'

Template.afFieldInput.onRendered(() => {
  const template = AutoForm.templateInstanceForForm();
  const instance = Template.instance();
  updateTrackedFieldValue(
    template,
    instance.afFieldName,
    instance.afFieldValue
  );
});

export function afFieldInputContext() {
  const c = AutoForm.Utility.getComponentContext(this, "afFieldInput");
  const form = AutoForm.getCurrentDataForForm();
  const formId = form.id;
  const ss = AutoForm.getFormSchema();
  let defs = c.defs;
  const instance = Template.instance();

  // Get schema default value.
  // We must do this before adjusting defs for arrays.
  const schemaDefaultValue = defs.defaultValue;

  // Adjust for array fields if necessary
  if (defs.type === Array) {
    defs = AutoForm.Utility.getFieldDefinition(ss, c.atts.name + ".$");
  }

  // Determine what `type` attribute should be if not set
  const inputType = AutoForm.getInputType(this);
  const componentDef = AutoForm._inputTypeDefinitions[inputType];
  if (!componentDef) {
    throw new Error(`AutoForm: No component found for rendering input with type "${inputType}"`);
  }

  // Get reactive mDoc
  const mDoc = AutoForm.reactiveFormData.sourceDoc(formId, void 0);

  // Get input value
  const value = getInputValue(
    c.atts,
    c.atts.value,
    mDoc,
    schemaDefaultValue,
    c.atts.defaultValue,
    componentDef,
  );

  // Build input data context
  const iData = getInputData(
    defs,
    c.atts,
    value,
    ss.label(c.atts.name),
    form.type
  );

  // These are needed for onRendered

  instance.afFieldName = c.atts.name;
  instance.afFieldValue = value;

  // Adjust and return context
  return typeof componentDef.contextAdjust === "function"
    ? componentDef.contextAdjust(iData)
    : iData;
}

Template.afFieldInput.helpers({
  // similar to AutoForm.getTemplateName, but we have fewer layers of fallback, and we fall back
  // lastly to a template without an _ piece at the end
  getTemplateName: function getTemplateName() {
    const self = this;
    // Determine what `type` attribute should be if not set
    const inputType = AutoForm.getInputType(this);
    const componentDef = AutoForm._inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error(`AutoForm: No component found for rendering input with type "${inputType}"`);
    }

    const inputTemplateName = componentDef.template;
    const styleTemplateName = this.template;

    // on first attempt we try to get the template without skipping non-existent
    // templates in order to circumvent false-positives that may occur due to
    // custom data context, set in conten blocks or dynamic templates
    let templateName = AutoForm.getTemplateName(
      inputTemplateName,
      styleTemplateName,
      self.name,
      false
    );

    if (!templateName) {
      // In case we found nothing, we skip the check for existence here so that
      // we can get the `_plain` string even though they don't exist.
      templateName = AutoForm.getTemplateName(
        inputTemplateName,
        styleTemplateName,
        self.name,
        true
      );
    }

    // Special case: the built-in "plain" template uses the basic input templates for
    // everything, so if we found _plain, we use inputTemplateName instead
    if (templateName.indexOf("_plain") !== -1) {
      templateName = null;
    }

    // If no override templateName found, use the exact name from the input type definition
    if (!templateName || !Template[templateName]) {
      templateName = inputTemplateName;
    }

    return templateName;
  },
  innerContext: afFieldInputContext
});
