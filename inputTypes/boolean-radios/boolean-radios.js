AutoForm.addInputType("boolean-radios", {
  template: "afBooleanRadioGroup",
  valueOut: function () {
    var val = this.val();
    if (this.is(":checked")) {
      if (val === "true") {
        return true;
      } else if (val === "false") {
        return false;
      }
    }
  }
});

Template["afBooleanRadioGroup"].helpers({
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
  