/*
 * Template helpers for "plain" template
 */

Template['afFieldLabel_plain'].helpers({
  atts: function plFieldLabelAtts() {
    var atts = (_.clone(this || {})).atts;
    var labelAtts = _.omit(atts, 'name', 'autoform', 'template');
    // Add "for" attribute if missing
    labelAtts['for'] = labelAtts['for'] || atts['name'];
    return labelAtts;
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

function selectedAttsAdjust() {
  var atts = _.clone(this.atts);
  if (this.selected) {
    atts.checked = "";
  }
  return atts;
}

Template["afCheckbox_plain"].helpers({
  atts: selectedAttsAdjust
});

Template["afRadio_plain"].helpers({
  atts: selectedAttsAdjust
});

Template["afCheckboxGroup_plain"].helpers({
  atts: selectedAttsAdjust
});

Template["afRadioGroup_plain"].helpers({
  atts: selectedAttsAdjust
});

Template["afSelect_plain"].helpers({
  optionAtts: function afSelectOptionAtts() {
    var item = this
    var atts = {
      value: item.value
    };
    if (item.selected) {
      atts.selected = "";
    }
    return atts;
  }
});
