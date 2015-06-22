Template.quickForm_bootstrap3.helpers({
  fieldGroupClass: function () {
    return this.name === '_defaultGroup' ? 'af-defaultFieldGroup' : 'af-fieldGroup';
  },
  fieldGroupLabel: function () {
    var name = this.name;

    // if this is the default field group, don't show the label
    if (name === '_defaultGroup') {
      return false;
    }

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
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    atts = _.pick(this.atts, 'fields', 'id-prefix', 'input-col-class', 'label-class');
    return atts;
  },
  submitButtonAtts: function bsQuickFormSubmitButtonAtts() {
    var qfAtts = this.atts;
    var atts = {};
    if (typeof qfAtts.buttonClasses === 'string') {
      atts['class'] = qfAtts.buttonClasses;
    } else {
      atts['class'] = 'btn btn-primary';
    }
    return atts;
  },
  qfAutoFormContext: function () {
    var ctx = _.clone(this.qfAutoFormContext);
    delete ctx['id-prefix'];
    return ctx;
  }
});
