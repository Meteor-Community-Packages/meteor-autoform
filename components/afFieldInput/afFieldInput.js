Template.afFieldInput.helpers({
  getTemplateType: function afFieldInputGetTemplateType() {
    return getInputTemplateType(this.type);
  },
  innerContext: function afFieldInputContext(options) {
    var c = Utility.normalizeContext(options.hash, "afFieldInput and afFieldSelect");
    var contentBlock = options.hash.contentBlock; // applies only to afFieldSelect
    var contentBlockContext = options.hash.contentBlockContext; // applies only to afFieldSelect

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

    // Get inputType
    var inputType = AutoForm.getInputType(c.atts);

    // Get input value
    var value = getInputValue(c.atts.name, c.atts, fieldExpectsArray, inputType, c.atts.value, c.af.mDoc, defaultValue);

    // Track field's value for reactive show/hide of other fields by value
    updateTrackedFieldValue(c.af.formId, c.atts.name, value);
    
    // Get input data context
    var iData = getInputData(defs, c.atts, value, inputType, ss.label(c.atts.name), fieldExpectsArray, c.af.submitType, c.af);

    // Return input data context
    return _.extend({_af: c.af, contentBlock: contentBlock, contentBlockContext: contentBlockContext, type: inputType}, iData);
  }
});