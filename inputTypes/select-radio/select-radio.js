AutoForm.addInputType("select-radio", {
  template: "afRadioGroup",
  valueOut: function () {
    if (this.is(":checked")) {
      return this.val();
    }
  }
});

Template["afRadioGroup"].helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});