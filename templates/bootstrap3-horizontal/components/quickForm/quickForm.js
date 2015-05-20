Template['quickForm_bootstrap3-horizontal'].helpers({
  inputClass: function () {
    return this.atts["input-col-class"];
  },
  labelClass: function () {
    return this.atts["label-class"];
  },
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'id-prefix', 'input-col-class', 'label-class');
  },
  submitButtonAtts: function () {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary';
    }
    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext || {});
    ctx = AutoForm.Utility.addClass(ctx, "form-horizontal");
    delete ctx["input-col-class"];
    delete ctx["label-class"];
    delete ctx["id-prefix"];
    return ctx;
  }
});
