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
  innerContext: function afFieldInputContext(options) {
    var c = Utility.normalizeContext(options.hash, "afFieldInput");

    // Set up deps, allowing us to re-render the form
    formDeps[c.af.formId] = formDeps[c.af.formId] || new Deps.Dependency;
    formDeps[c.af.formId].depend();

    var ss = c.af.ss;
    var defs = c.defs;

    var fieldExpectsArray = AutoForm.expectsArray(c.atts);

    // Adjust for array fields if necessary
    var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
    if (defs.type === Array) {
      defs = ss.schema(c.atts.name + ".$");
    }

    // Get inputTypeDefinition based on `type` attribute
    var componentDef = options.hash.componentDef;

    // Get input value
    var value = getInputValue(c.atts, c.atts.value, c.af.mDoc, defaultValue, componentDef);

    // Track field's value for reactive show/hide of other fields by value
    updateTrackedFieldValue(c.af.formId, c.atts.name, value);
    
    // Build input data context
    var iData = getInputData(defs, c.atts, value, ss.label(c.atts.name), fieldExpectsArray, c.af.submitType);

    // Adjust and return context
    return (typeof componentDef.contextAdjust === "function") ? componentDef.contextAdjust(iData) : iData;
  }
});