/*
 * Template helpers for "plain" template
 */

Template['quickForm_plain'].helpers({
  afQuickFieldAtts: function () {
    var qfAtts = this.atts;
    var atts = {};
    if (qfAtts["id-prefix"]) {
      atts["id-prefix"] = qfAtts["id-prefix"];
    }
    return atts;
  },
  submitButtonAtts: function plQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    }
    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext || {});
    if (ctx["id-prefix"])
      delete ctx["id-prefix"];
    return ctx;
  }
});
