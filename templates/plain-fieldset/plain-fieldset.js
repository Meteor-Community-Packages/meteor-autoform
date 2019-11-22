Template['quickForm_plain-fieldset'].helpers({
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    const { 'id-prefix': IdPrefix } = this.atts
    return { 'id-prefix': IdPrefix }
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
