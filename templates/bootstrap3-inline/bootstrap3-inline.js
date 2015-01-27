Template['quickForm_bootstrap3-inline'].helpers({
  quickFieldsAtts: function () {
    var qfAtts = this.atts;
    var atts = {};
    if (qfAtts["id-prefix"]) {
      atts["id-prefix"] = qfAtts["id-prefix"];
    }
    if (qfAtts["label-class"]) {
      atts["label-class"] = qfAtts["label-class"];
    }
    return atts;
  },
  submitButtonAtts: function () {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary autoform-inline-align';
    }
    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext || {});
    ctx = AutoForm.Utility.addClass(ctx, "form-inline");
    if (ctx["id-prefix"])
      delete ctx["id-prefix"];
    if (ctx["label-class"])
      delete ctx["label-class"];
    return ctx;
  }
});

Template["afFormGroup_bootstrap3-inline"].helpers({
  afFieldInputAtts: function () {
    var atts = _.clone(this.afFieldInputAtts || {});
    // Use the same templates as those defined for bootstrap3 template.
    atts.template = "bootstrap3";
    return atts;
  }
});
