Template["quickForm_bootstrap3-horizontal"].qfHorizontalAdjust = function (afContext) {
  var ctx = _.clone(this || {});
  ctx.template = "bootstrap3-horizontal";
  ctx['input-col-class'] = afContext['input-col-class'];
  ctx['label-class'] = afContext['label-class'];
  return ctx;
};

Template["quickForm_bootstrap3-horizontal"].qfAutoFormContext = function () {
  var ctx = _.clone(this.qfAutoFormContext || {});
  if (typeof ctx["class"] === "string") {
    ctx["class"] += " form-horizontal";
  } else {
    ctx["class"] = "form-horizontal";
  }
  return ctx;
};

Template['quickForm_bootstrap3-horizontal'].submitButtonAtts = function bsQuickFormSubmitButtonAtts() {
  var context = this;
  var atts = {type: "submit"};
  atts['class'] = 'btn btn-primary';
  if (typeof context.buttonClasses === "string") {
    atts['class'] += ' ' + context.buttonClasses;
  }
  return atts;
};

Template["afQuickField_bootstrap3-horizontal"].afFieldInputAtts = function () {
  var atts = _.clone(this.afFieldInputAtts || {});
  if ('input-col-class' in atts) {
    delete atts['input-col-class'];
  }
  atts.template = "bootstrap3";
  return atts;
};

Template["afQuickField_bootstrap3-horizontal"].afFieldLabelAtts = function () {
  var atts = _.clone(this.afFieldLabelAtts || {});
  atts.template = "bootstrap3";
  return atts;
};

Template["afQuickField_bootstrap3-horizontal"].afEmptyFieldLabelAtts = function () {
  var atts = _.clone(this.afFieldLabelAtts || {});
  var labelAtts = _.omit(atts, 'name', 'autoform', 'template');
  // Add bootstrap class if necessary
  if (typeof labelAtts['class'] === "string") {
    labelAtts['class'] += " control-label"; //might be added twice but that shouldn't hurt anything
  } else {
    labelAtts['class'] = "control-label";
  }
  return labelAtts;
};

Template["afQuickField_bootstrap3-horizontal"].rightColumnClass = function () {
  var atts = this.afFieldInputAtts || {};
  return atts['input-col-class'] || "";
};

Template["afObjectField_bootstrap3-horizontal"].qfAtts = function () {
  var atts = _.clone(this || {});
  atts.template = "bootstrap3-horizontal";
  return atts;
};

Template["afObjectField_bootstrap3-horizontal"].log = function (val) {
  console.log(val);
};