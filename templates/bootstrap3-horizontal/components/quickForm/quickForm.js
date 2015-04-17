Template['quickForm_bootstrap3-horizontal'].helpers({
  inputClass: function () {
    return this.atts["input-col-class"];
  },
  labelClass: function () {
    return this.atts["label-class"];
  },
  fieldGroupLabel: function () {
    var name = this.name;

    // if field group name is of the form XY_abcde where "XY" is a number, remove prefix
    if (!isNaN(parseInt(name.substr(0,2), 10)) && name.charAt(2) === "_") {
      name = name.substr(3);
    }

    // if SimpleSchema.defaultLabel is defined, use it
    if (typeof SimpleSchema.defaultLabel === "function") {
      return SimpleSchema.defaultLabel(name);
    } else {
      // else, just capitalise name
      return name.charAt(0).toUpperCase() + name.slice(1)
    }
  },
  getFieldsWithNoGroups: function () {
    // if there are no fields with no groups, don't call afQuickFields at all
    return this.fieldsWithNoGroups.atts.fields.length ? this.fieldsWithNoGroups : null;
  },
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    atts = _.pick(this.atts, 'fields', 'id-prefix');
    return atts;
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
