AutoForm.addInputType("select-checkbox", {
  template: "afCheckboxGroup",
  valueIsArray: true,
  valueOut: function () {
    var val = [];
    this.find('input[type=checkbox]').each(function () {
      if ($(this).is(":checked")) {
        val.push($(this).val());
      }
    });
    return val;
  }
});

Template["afCheckboxGroup"].helpers({
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