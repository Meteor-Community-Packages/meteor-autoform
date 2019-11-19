/* global AutoForm */

/*
 * Template helpers for "bootstrap3" templates
 */

Template.registerHelper('attsPlusFormControlClass', function attsPlusFormControlClass() {
  var atts = { ...this.atts };
  // Add bootstrap class
  atts = AutoForm.Utility.addClass(atts, "form-control");
  return atts;
});

Template.registerHelper('attsPlusBtnClass', function attsPlusBtnClass() {
  var atts = { ...this.atts };
  // Add bootstrap class
  atts = AutoForm.Utility.addClass(atts, "btn");
  return atts;
});
