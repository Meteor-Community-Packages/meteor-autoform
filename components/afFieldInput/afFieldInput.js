/* global AutoForm, getInputValue, getInputData, updateTrackedFieldValue */

Template.afFieldInput.helpers({
  // similar to AutoForm.getTemplateName, but we have fewer layers of fallback, and we fall back
  // lastly to a template without an _ piece at the end
  getTemplateName: function getTemplateName() {
    var self = this;

    // Determine what `type` attribute should be if not set
    var inputType = AutoForm.getInputType(this);
    var componentDef = AutoForm._inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
    }

    var inputTemplateName = componentDef.template;
    var styleTemplateName = this.template;

    var templateName = AutoForm.getTemplateName(inputTemplateName, styleTemplateName, self.name, true);

    // Special case: the built-in "plain" template uses the basic input templates for
    // everything, so if we found _plain, we use inputTemplateName instead
    if (templateName.indexOf('_plain') !== -1) {
      templateName = null;
    }

    // If no override templateName found, use the exact name from the input type definition
    return templateName ? templateName : inputTemplateName;
  },
  innerContext: function afFieldInputContext() {
    var c = AutoForm.Utility.normalizeContext(this, "afFieldInput");
    var form = AutoForm.getCurrentDataForForm();
    var formId = form.id;
    var ss = AutoForm.getFormSchema();
    var defs = c.defs;

    // Adjust for array fields if necessary
    var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
    if (defs.type === Array) {
      defs = ss.schema(c.atts.name + ".$");
    }

    // Determine what `type` attribute should be if not set
    var inputType = AutoForm.getInputType(this);
    var componentDef = AutoForm._inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
    }

    // Get reactive mDoc
    var mDoc = AutoForm.reactiveFormData.sourceDoc(formId);

    // Get input value
    var value = getInputValue(c.atts, c.atts.value, mDoc, defaultValue, componentDef);

    // Mark field value as changed for reactive updates
    // We need to defer this until the element will be
    // added to the DOM. Otherwise, AutoForm.getFieldValue
    // will not pick up the new value when there are #if etc.
    // blocks involved.
    // See https://github.com/aldeed/meteor-autoform/issues/461
   setTimeout(function () {
      updateTrackedFieldValue(formId, c.atts.name);
    }, 0);
    
    // Build input data context
    var iData = getInputData(defs, c.atts, value, ss.label(c.atts.name), form.type);

    // Adjust and return context
    return (typeof componentDef.contextAdjust === "function") ? componentDef.contextAdjust(iData) : iData;
  }
});
