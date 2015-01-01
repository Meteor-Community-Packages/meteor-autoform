Template['quickForm_plain-fieldset'].helpers({
  idPrefix: function () {
    return this.atts["id-prefix"];
  },
  submitButtonAtts: function plfsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    }
    return atts;
  }
});
