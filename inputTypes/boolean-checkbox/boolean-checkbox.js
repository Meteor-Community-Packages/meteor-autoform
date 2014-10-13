AutoForm.addInputType("boolean-checkbox", {
  template: "afCheckbox",
  valueIn: function (val) {
    // switch to a boolean
    return (val === "true") ? true : false;
  },
  valueOut: function () {
    return this.is(":checked");
  },
  contextAdjust: function (context) {
    //don't add required attribute to checkboxes because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
    delete context.atts.required;
    
    context.selected = context.value;
    context.value = "true";

    return context;
  }
});

Template["afCheckbox"].helpers({
  atts: function selectedAttsAdjust() {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});