/*
 * Template helpers for "bootstrap3" template
 */

Template['quickForm_bootstrap3'].helpers({
  submitButtonAtts: function bsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
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
  },
  bsFieldLabelAtts: function bsFieldLabelAtts() {
    var atts = _.clone(this.afFieldLabelAtts);
    // Add bootstrap class
    atts = AutoForm.Utility.addClass(atts, "control-label");
    return atts;
  }
});

_.each([
    "afSelect_bootstrap3",
    "afBooleanSelect_bootstrap3",
    "afSelectMultiple_bootstrap3",
    "afTextarea_bootstrap3",
    "afInputText_bootstrap3",
    "afInputPassword_bootstrap3",
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
      // Add bootstrap class
      atts = AutoForm.Utility.addClass(atts, "form-control");
      return atts;
    }
  });
});

_.each([
    "afInputButton_bootstrap3",
    "afInputSubmit_bootstrap3",
    "afInputReset_bootstrap3",
  ], function (tmplName) {
  Template[tmplName].helpers({
    atts: function addFormControlAtts() {
      var atts = _.clone(this.atts);
      // Add bootstrap class
      atts = AutoForm.Utility.addClass(atts, "btn");
      return atts;
    }
  });
});

Template["afRadio_bootstrap3"].helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});

_.each([
    "afCheckboxGroup_bootstrap3",
    "afRadioGroup_bootstrap3",
    "afCheckboxGroupInline_bootstrap3",
    "afRadioGroupInline_bootstrap3"
  ], function (tmplName) {
  Template[tmplName].helpers({
    atts: function selectedAttsAdjust() {
      var atts = _.clone(this.atts);
      if (this.selected) {
        atts.checked = "";
      }
      // remove data-schema-key attribute because we put it
      // on the entire group
      delete atts["data-schema-key"];
      return atts;
    },
    dsk: function dsk() {
      return {
        "data-schema-key": this.atts["data-schema-key"]
      }
    }
  });
});

var selectHelpers = {
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
};
Template["afSelect_bootstrap3"].helpers(selectHelpers);
Template["afSelectMultiple_bootstrap3"].helpers(selectHelpers);
Template["afBooleanSelect_bootstrap3"].helpers(selectHelpers);

Template["afBooleanRadioGroup_bootstrap3"].helpers({
  falseAtts: function falseAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel');
    if (this.value === false) {
      atts.checked = "";
    }
    return atts;
  },
  trueAtts: function trueAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel');
    if (this.value === true) {
      atts.checked = "";
    }
    return atts;
  }
});
