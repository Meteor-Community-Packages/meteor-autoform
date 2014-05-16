/*
 * Template helpers for "plain" template
 */

Template['afFieldLabel_plain'].atts = function plFieldLabelAtts() {
  var atts = (_.clone(this || {})).atts;
  var labelAtts = _.omit(atts, 'name', 'autoform', 'template');
  // Add "for" attribute if missing
  labelAtts['for'] = labelAtts['for'] || atts['name'];
  return labelAtts;
};

Template['afDeleteButton_plain'].atts = function plDeleteButtonAtts() {
  var atts = this || {};
  return _.omit(atts, '_af', 'collection', 'doc', 'contentBlock', 'type');
};

Template['quickForm_plain'].submitButtonAtts = function plQuickFormSubmitButtonAtts() {
  var context = this;
  var atts = {type: "submit"};
  if (typeof context.buttonClasses === "string") {
    atts['class'] = context.buttonClasses;
  }
  return atts;
};
