/*
 * Template helpers for "bootstrap3" template
 */

Template['afFieldLabel_bootstrap3'].atts = function bsFieldLabelAtts() {
  var atts = (this || {}).atts;
  var labelAtts = _.omit(atts, 'name', 'autoform', 'template');
  // Add bootstrap class if necessary
  if (typeof labelAtts['class'] === "string") {
    labelAtts['class'] += " control-label"; //might be added twice but that shouldn't hurt anything
  } else {
    labelAtts['class'] = "control-label";
  }
  // Add "for" attribute if missing
  labelAtts['for'] = labelAtts['for'] || atts['name'];
  return labelAtts;
};

Template['afDeleteButton_bootstrap3'].atts = function bsDeleteButtonAtts() {
  var atts = this || {};
  var buttonAtts = _.omit(atts, '_af', 'collection', 'doc', 'contentBlock', 'type', 'id');
  // Add bootstrap class if necessary
  if (typeof buttonAtts['class'] === "string") {
    buttonAtts['class'] += " btn btn-danger"; //might be added twice but that shouldn't hurt anything
  } else {
    buttonAtts['class'] = "btn btn-danger";
  }
  return buttonAtts;
};

Template['quickForm_bootstrap3'].submitButtonAtts = function bsQuickFormSubmitButtonAtts() {
  var qfAtts = this.atts;
  var atts = {type: "submit"};
  atts['class'] = 'btn btn-primary';
  if (typeof qfAtts.buttonClasses === "string") {
    atts['class'] += ' ' + qfAtts.buttonClasses;
  }
  return atts;
};

Template['quickForm_bootstrap3'].qfNeedsButton = function bsQuickFormNeedsButton() {
  var submitType = this._af.submitType;
  return (submitType !== "readonly" && submitType !== "disabled");
};

function addFormControlAtts() {
  var atts = _.clone(this.atts);
  if (typeof atts["class"] === "string") {
    atts["class"] += " form-control";
  } else {
    atts["class"] = "form-control";
  }
  return atts;
}

Template["afFieldSelect_bootstrap3"].atts = addFormControlAtts;
Template["afSelect_bootstrap3"].atts = addFormControlAtts;
Template["afTextarea_bootstrap3"].atts = addFormControlAtts;
Template["afInput_bootstrap3"].atts = addFormControlAtts;

Template["afCheckbox_bootstrap3"].atts = 
Template["afRadio_bootstrap3"].atts =
Template["afCheckboxGroup_bootstrap3"].atts = 
Template["afRadioGroup_bootstrap3"].atts = function () {
  var atts = _.clone(this.atts);
  if (this.selected) {
    atts.checked = "";
  }
  return atts;
};

Template["afSelect_bootstrap3"].optionAtts = function () {
  var item = this
  var atts = {
    value: item.value
  };
  if (item.selected) {
    atts.selected = "";
  }
  return atts;
};