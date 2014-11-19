Template.afFieldInput.helpers({
  getComponentDef: function getComponentDef() {
    // Determine what `type` attribute should be if not set
    var inputType = AutoForm.getInputType(this);
    var componentDef = inputTypeDefinitions[inputType];
    if (!componentDef) {
      throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
    }
    return componentDef;
  },
  // similar to afTemplateName helper, but we have fewer layers of fallback, and we fall back
  // lastly to a template without an _ piece at the end
  getTemplateName: function getTemplateName(inputTemplateName, styleTemplateName) {
    var self = this, schemaAutoFormDefs, templateFromAncestor, defaultTemplate;

    // In simplest case, just try to combine the two given strings.
    if (styleTemplateName && Template[inputTemplateName + '_' + styleTemplateName]) {
      return inputTemplateName + '_' + styleTemplateName;
    }

    // If the attributes provided a styleTemplateName but that template didn't exist, show a warning
    if (styleTemplateName && AutoForm._debug) {
      console.warn(inputTemplateName + '_' + styleTemplateName + ' is not a valid template name. Falling back to a different template.');
    }

    // Get `autoform` object from the schema, if present.
    if (self.atts && self.atts.name) {
      schemaAutoFormDefs = AutoForm.getSchemaForField(self.atts.name).autoform;
    }

    // Fallback #1: autoform.template from the schema
    if (schemaAutoFormDefs && schemaAutoFormDefs.template && Template[inputTemplateName + '_' + schemaAutoFormDefs.template]) {
      return inputTemplateName + '_' + schemaAutoFormDefs.template;
    }

    // Fallback #2: template attribute on an ancestor component within the same form
    templateFromAncestor = AutoForm.findAttribute("template");
    if (templateFromAncestor && Template[inputTemplateName + '_' + templateFromAncestor]) {
      return inputTemplateName + '_' + templateFromAncestor;
    }

    // Fallback #3: Default template, as set by AutoForm.setDefaultTemplate
    defaultTemplate = AutoForm.getDefaultTemplate();
    if (defaultTemplate && Template[inputTemplateName + '_' + defaultTemplate]) {
      return inputTemplateName + '_' + defaultTemplate;
    }

    // Fallback #4: Just the inputTemplateName with no custom styled piece
    return inputTemplateName;
  },
  innerContext: function afFieldInputContext(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afFieldInput");

    var ss = c.af.ss;
    var defs = c.defs;

    // Adjust for array fields if necessary
    var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
    if (defs.type === Array) {
      defs = ss.schema(c.atts.name + ".$");
    }

    // Get inputTypeDefinition based on `type` attribute
    var componentDef = options.hash.componentDef;

    // Get input value
    var value = getInputValue(c.atts, c.atts.value, c.af.mDoc, defaultValue, componentDef);

    // Mark field value as changed for reactive updates
    updateTrackedFieldValue(c.af.formId, c.atts.name);
    
    // Build input data context
    var iData = getInputData(defs, c.atts, value, ss.label(c.atts.name), c.af.submitType);

    // Adjust and return context
    return (typeof componentDef.contextAdjust === "function") ? componentDef.contextAdjust(iData) : iData;
  }
});
