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
  labelClass: function labelClassHelper() {
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

Template["afFormGroup_bootstrap3-horizontal"].helpers({
  afFieldInputAtts: function () {
    var atts = _.clone(this.afFieldInputAtts || {});
    if ('input-col-class' in atts) {
      delete atts['input-col-class'];
    }
    // We have a special template for check boxes, but otherwise we
    // want to use the same as those defined for bootstrap3 template.
    if (AutoForm.getInputType(this.afFieldInputAtts) === "boolean-checkbox") {
      atts.template = "bootstrap3-horizontal";
    } else {
      atts.template = "bootstrap3";
    }
    return atts;
  },
  afFieldLabelAtts: function () {
    var atts = _.clone(this.afFieldLabelAtts || {});
    atts.template = "bootstrap3";
    return atts;
  },
  afEmptyFieldLabelAtts: function () {
    var atts = _.clone(this.afFieldLabelAtts || {});
    var labelAtts = _.omit(atts, 'name', 'autoform', 'template');
    // Add bootstrap class if necessary
    if (typeof labelAtts['class'] === "string") {
      labelAtts['class'] += " control-label"; //might be added twice but that shouldn't hurt anything
    } else {
      labelAtts['class'] = "control-label";
    }
    return labelAtts;
  },
  rightColumnClass: function () {
    var atts = this.afFieldInputAtts || {};
    return atts['input-col-class'] || "";
  },
  skipLabel: function bshFormGroupSkipLabel() {
    var self = this;

    var type = AutoForm.getInputType(self.afFieldInputAtts);
    return (self.skipLabel || (type === "boolean-checkbox" && !self.afFieldInputAtts.leftLabel));
  }
});

Template["afObjectField_bootstrap3-horizontal"].helpers({
  rightColumnClass: function () {
    var atts = this.atts || {};
    return atts['input-col-class'] || "";
  },
  afFieldLabelAtts: function () {
    var atts = this.atts;
    return {
      template: "bootstrap3",
      "class": atts["label-class"],
      "name": atts.name
    }
  }
});

Template["afArrayField_bootstrap3-horizontal"].helpers({
  rightColumnClass: function () {
    var atts = this.atts || {};
    return atts['input-col-class'] || "";
  },
  afFieldLabelAtts: function () {
    var atts = this.atts || {};
    return {
      template: "bootstrap3",
      "class": atts["label-class"],
      "name": atts.name
    };
  }
});

Template["afCheckbox_bootstrap3-horizontal"].helpers({
  atts: function () {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  },
  attsPlusSpecialClass: function () {
    var atts = _.clone(this.atts);
    if (this.selected) {
      atts.checked = "";
    }
    if (atts["class"]) {
      atts["class"] += " autoform-checkbox-margin-fix";
    } else {
      atts["class"] = "autoform-checkbox-margin-fix"
    }
    return atts;
  },
  useLeftLabel: function () {
    return this.atts.leftLabel;
  }
});