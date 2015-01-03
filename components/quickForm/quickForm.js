Template.quickForm.helpers({
  getTemplateName: function () {
    var self = this;
    return AutoForm.getTemplateName('quickForm', self.template, self.atts && self.atts.name);
  },
  innerContext: function quickFormContext() {
    var atts = this;
    
    // Pass along quickForm context to autoForm context, minus a few
    // properties that are specific to quickForms.
    var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

    // Determine whether we want to render a submit button
    var qfShouldRenderButton = (atts.buttonContent !== false && atts.type !== "readonly" && atts.type !== "disabled");

    return {
      qfAutoFormContext: qfAutoFormContext,
      atts: atts,
      qfShouldRenderButton: qfShouldRenderButton
    };
  }
});
