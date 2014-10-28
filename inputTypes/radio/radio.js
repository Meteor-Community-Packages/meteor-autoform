AutoForm.addInputType("radio", {
  template: "afRadio",
  valueOut: function () {
    if (this.is(":checked")) {
      return this.val();
    }
  },
  valueConverters: {
    "stringArray": function (val) {
      if (typeof val === "string" && val.length > 0) {
        return [val];
      }
      return val;
    }
  }
});

Template["afRadio"].helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});