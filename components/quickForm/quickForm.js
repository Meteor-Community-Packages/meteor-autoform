Template.quickForm.helpers({
  innerContext: function quickFormContext(atts) {
    // Pass along quickForm context to autoForm context, minus a few
    // properties that are specific to quickForms.
    var qfAutoFormContext = _.omit(atts, "buttonContent", "buttonClasses", "fields", "omitFields");

    return {
      qfAutoFormContext: qfAutoFormContext,
      atts: atts,
      // qfShouldRenderButton helper
      qfShouldRenderButton: function qfShouldRenderButton() {
        var self = this;
        var qfAtts = self.atts;
        var submitType = self._af.submitType;
        return (qfAtts.buttonContent !== false && submitType !== "readonly" && submitType !== "disabled");
      }
    };
  }
});