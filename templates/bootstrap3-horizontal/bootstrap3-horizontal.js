Template["quickForm_bootstrap3-horizontal"].qfAutoFormContext = function () {
  var ctx = _.clone(this.qfAutoFormContext || {});
  if (typeof ctx["class"] === "string") {
    ctx["class"] += " form-horizontal";
  } else {
    ctx["class"] = "form-horizontal";
  }
  if (ctx["input-col-class"])
    delete ctx["input-col-class"];
  if (ctx["label-class"])
    delete ctx["label-class"];
  return ctx;
};

Template['quickForm_bootstrap3-horizontal'].submitButtonAtts = function bsQuickFormSubmitButtonAtts(qfContext) {
  var qfAtts = qfContext.atts;
  var atts = {type: "submit"};
  atts['class'] = 'btn btn-primary';
  if (typeof qfAtts.buttonClasses === "string") {
    atts['class'] += ' ' + qfAtts.buttonClasses;
  }
  return atts;
};

Template['quickForm_bootstrap3-horizontal'].qfNeedsButton = function bsQuickFormNeedsButton() {
  var submitType = this._af.submitType;
  return (submitType !== "readonly" && submitType !== "disabled");
};

Template['quickForm_bootstrap3-horizontal'].qfClasses = function bsQuickFormClasses(qfContext) {
  // This helper is a workaround for the fact that it does not
  // seem to work currently to do input-col-class=../atts.input-col-class
  // in the template because dashes in the attribute value cause problems.
  return {
    inputClass: qfContext.atts["input-col-class"],
    labelClass: qfContext.atts["label-class"]
  };
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

Template["afObjectField_bootstrap3-horizontal"].rightColumnClass = function () {
  var atts = this.atts || {};
  return atts['input-col-class'] || "";
};

Template["afObjectField_bootstrap3-horizontal"].afFieldLabelAtts = function () {
  var atts = this.atts;
  return {
    template: "bootstrap3",
    "class": atts["label-class"],
    "name": atts.name
  };
};

Template["afArrayField_bootstrap3-horizontal"].rightColumnClass = function () {
  var atts = this.atts || {};
  return atts['input-col-class'] || "";
};

Template["afArrayField_bootstrap3-horizontal"].afFieldLabelAtts = function () {
  var atts = this.atts || {};
  return {
    template: "bootstrap3",
    "class": atts["label-class"],
    "name": atts.name
  };
};