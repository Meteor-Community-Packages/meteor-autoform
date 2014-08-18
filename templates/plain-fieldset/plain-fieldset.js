Template['quickForm_plain-fieldset'].submitButtonAtts = function plfsQuickFormSubmitButtonAtts() {
  var qfAtts = this.atts;
  var atts = {type: "submit"};
  if (typeof qfAtts.buttonClasses === "string") {
    atts['class'] = qfAtts.buttonClasses;
  }
  return atts;
};