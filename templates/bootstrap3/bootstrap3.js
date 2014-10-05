/*
 * Template helpers for "bootstrap3" template
 */

Template['afFieldLabel_bootstrap3'].helpers({
  atts: function bsFieldLabelAtts() {
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
  }
});

Template['quickForm_bootstrap3'].helpers({
  submitButtonAtts: function bsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {type: "submit"};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary';
    }
    return atts;
  }
});

Template['afFormGroup_bootstrap3'].helpers({
  skipLabel: function bsFormGroupSkipLabel() {
    var self = this;

    var type = AutoForm.getInputType(self.afFieldInputAtts);
    return (self.skipLabel || type === "boolean-checkbox");
  }
});

function addFormControlAtts() {
  var atts = _.clone(this.atts);
  if (typeof atts["class"] === "string") {
    atts["class"] += " form-control";
  } else {
    atts["class"] = "form-control";
  }
  return atts;
}

Template["afFieldSelect_bootstrap3"].helpers({
  atts: addFormControlAtts
});

Template["afSelect_bootstrap3"].helpers({
  atts: addFormControlAtts
});

Template["afTextarea_bootstrap3"].helpers({
  atts: addFormControlAtts
});

Template["afInput_bootstrap3"].helpers({
  atts: addFormControlAtts
});

function selectedAttsAdjust() {
  var atts = _.clone(this.atts);
  if (this.selected) {
    atts.checked = "";
  }
  return atts;
}

Template["afCheckbox_bootstrap3"].helpers({
  atts: selectedAttsAdjust
});

Template["afRadio_bootstrap3"].helpers({
  atts: selectedAttsAdjust
});

Template["afCheckboxGroup_bootstrap3"].helpers({
  atts: selectedAttsAdjust
});

Template["afRadioGroup_bootstrap3"].helpers({
  atts: selectedAttsAdjust
});

Template["afSelect_bootstrap3"].helpers({
  optionAtts: function afSelectOptionAtts() {
    var item = this;
    var atts = {
      value: item.value
    };
    if (item.selected) {
      atts.selected = "";
    }
    return atts;
  }
});
