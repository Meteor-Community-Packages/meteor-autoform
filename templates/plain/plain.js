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
  return _.omit(atts, '_af', 'collection', 'doc', 'contentBlock', 'type', 'id');
};

Template['quickForm_plain'].submitButtonAtts = function plQuickFormSubmitButtonAtts() {
  var qfAtts = this.atts;
  var atts = {type: "submit"};
  if (typeof qfAtts.buttonClasses === "string") {
    atts['class'] = qfAtts.buttonClasses;
  }
  return atts;
};

Template["afCheckboxGroup_plain"].atts = 
Template["afCheckbox_plain"].atts = 
Template["afRadio_plain"].atts = function () {
  var atts = _.clone(this.atts);
  if (this.selected) {
    atts.checked = "";
  }
  return atts;
};

Template["afSelect_plain"].optionAtts = function () {
  var item = this
  var atts = {
    value: item.value
  };
  if (item.selected) {
    atts.selected = "";
  }
  return atts;
};
