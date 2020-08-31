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
  var c = AutoForm.Utility.getComponentContext(this, "afFieldInput");
  var form = AutoForm.getCurrentDataForForm();
  var formId = form.id;
  var ss = AutoForm.getFormSchema();
  var defs = c.defs;
  const instance = Template.instance();
  const template = AutoForm.templateInstanceForForm();

  // Get schema default value.
  // We must do this before adjusting defs for arrays.
  var schemaDefaultValue = defs.defaultValue;

  // Adjust for array fields if necessary
  if (defs.type === Array) {
    defs = AutoForm.Utility.getFieldDefinition(ss, c.atts.name + ".$");
  }

  // Determine what `type` attribute should be if not set
  var inputType = AutoForm.getInputType(this);
  var componentDef = AutoForm._inputTypeDefinitions[inputType];
  if (!componentDef) {
    throw new Error(
      'AutoForm: No component found for rendering input with type "' +
        inputType +
        '"'
    );
  }

  // Get reactive mDoc
  var mDoc = AutoForm.reactiveFormData.sourceDoc(formId);

  // Get input value
  var value = getInputValue(
    c.atts,
    c.atts.value,
    mDoc,
    schemaDefaultValue,
    c.atts.defaultValue,
    componentDef,
    template
  );

  // Build input data context
  var iData = getInputData(
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
    var self = this;

    // Determine what `type` attribute should be if not set
    var inputType = AutoForm.getInputType(this);
    var componentDef = AutoForm._inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error(
        'AutoForm: No component found for rendering input with type "' +
          inputType +
          '"'
      );
    }

    var inputTemplateName = componentDef.template;
    var styleTemplateName = this.template;

    // We skip the check for existence here so that we can get the `_plain` string
    // even though they don't exist.
    var templateName = AutoForm.getTemplateName(
      inputTemplateName,
      styleTemplateName,
      self.name,
      true
    );

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
