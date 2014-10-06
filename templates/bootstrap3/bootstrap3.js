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

_.each([
    "afFieldSelect_bootstrap3",
    "afSelect_bootstrap3",
    "afSelectMultiple_bootstrap3",
    "afTextarea_bootstrap3",
    "afInputText_bootstrap3",
    "afInputPassword_bootstrap3",
    "afInputButton_bootstrap3",
    "afInputSubmit_bootstrap3",
    "afInputReset_bootstrap3",
    "afInputFile_bootstrap3",
    "afInputHidden_bootstrap3",
    "afInputImage_bootstrap3",
    "afInputDateTime_bootstrap3",
    "afInputDateTimeLocal_bootstrap3",
    "afInputDate_bootstrap3",
    "afInputMonth_bootstrap3",
    "afInputTime_bootstrap3",
    "afInputWeek_bootstrap3",
    "afInputNumber_bootstrap3",
    "afInputEmail_bootstrap3",
    "afInputUrl_bootstrap3",
    "afInputSearch_bootstrap3",
    "afInputTel_bootstrap3",
    "afInputColor_bootstrap3"
  ], function (tmplName) {
  Template[tmplName].helpers({
    atts: function addFormControlAtts() {
      var atts = _.clone(this.atts);
      if (typeof atts["class"] === "string") {
        atts["class"] += " form-control";
      } else {
        atts["class"] = "form-control";
      }
      delete atts.type;
      delete atts.value;
      return atts;
    }
  });
});

_.each([
    "afCheckbox_bootstrap3",
    "afRadio_bootstrap3",
    "afCheckboxGroup_bootstrap3",
    "afRadioGroup_bootstrap3"
  ], function (tmplName) {
  Template[tmplName].helpers({
    atts: function selectedAttsAdjust() {
      var atts = _.clone(this.atts);
      if (this.selected) {
        atts.checked = "";
      }
      return atts;
    }
  });
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
