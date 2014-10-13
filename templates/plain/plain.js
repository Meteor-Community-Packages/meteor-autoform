/*
 * Template helpers for "plain" template
 */

Template['afFieldLabel_plain'].helpers({
  atts: function plFieldLabelAtts() {
    var atts = (_.clone(this || {})).atts;
    return _.omit(atts, 'name', 'autoform', 'template');
  }
});

Template['quickForm_plain'].helpers({
  submitButtonAtts: function plQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {type: "submit"};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    }
    return atts;
  }
});
