function findAtts() {
  var c, n = 0;
  do {
    c = UI._parentData(n++);
  } while (c && !c.atts);
  return c && c.atts;
}

Template['quickForm_bootstrap3-horizontal'].helpers({
  inputClass: function inputClassHelper() {
    var atts = findAtts();
    if (atts) {
      return atts["input-col-class"];
    }
  },
  labelClass: function inputClassHelper() {
    var atts = findAtts();
    if (atts) {
      return atts["label-class"];
    }
  },
  submitButtonAtts: function bsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {type: "submit"};
    if (typeof qfAtts.buttonClasses === "string") {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary';
    }
    return atts;
  },
  qfAutoFormContext: function () {
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
  }
});

Template["afFormGroup_bootstrap3-horizontal"].afFieldInputAtts = function () {
  var atts = _.clone(this.afFieldInputAtts || {});
  if ('input-col-class' in atts) {
    delete atts['input-col-class'];
  }
  atts.template = "bootstrap3";
  return atts;
};

Template["afFormGroup_bootstrap3-horizontal"].afFieldLabelAtts = function () {
  var atts = _.clone(this.afFieldLabelAtts || {});
  atts.template = "bootstrap3";
  return atts;
};

Template["afFormGroup_bootstrap3-horizontal"].afEmptyFieldLabelAtts = function () {
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

Template["afFormGroup_bootstrap3-horizontal"].rightColumnClass = function () {
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