Template.afFieldSelect.helpers({
  // This is similar to the innerContext helper for afFieldInput; keep them in sync
  innerContext: function afFieldInputContext(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afFieldSelect");
    var contentBlock = options.hash.contentBlock;
    var contentBlockContext = options.hash.contentBlockContext;

    // Set up deps, allowing us to re-render the form
    formDeps[c.af.formId] = formDeps[c.af.formId] || new Deps.Dependency;
    formDeps[c.af.formId].depend();

    var ss = c.af.ss;
    var defs = c.defs;

    // Adjust for array fields if necessary
    var defaultValue = defs.defaultValue; //make sure to use pre-adjustment defaultValue for arrays
    if (defs.type === Array) {
      defs = ss.schema(c.atts.name + ".$");
    }

    // Get input value
    var value = getInputValue(c.atts, c.atts.value, c.af.mDoc, defaultValue, {valueIsArray: !!c.atts.multiple});

    // Mark field value as changed for reactive updates
    updateTrackedFieldValue(c.af.formId, c.atts.name);
    
    // Build input data context
    var iData = getInputData(defs, c.atts, value, ss.label(c.atts.name), c.af.submitType);

    // Return input data context
    return _.extend({contentBlock: contentBlock, contentBlockContext: contentBlockContext}, iData);
  }
});