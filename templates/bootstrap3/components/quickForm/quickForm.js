Template.quickForm_bootstrap3.helpers({
  quickFieldsAtts: function () {
    // These are the quickForm attributes that we want to forward to
    // the afQuickFields component.
    return _.pick(this.atts, 'id-prefix');
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
