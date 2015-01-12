/* global AutoForm, arrayTracker, fd */

Template.afArrayField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afArrayField', this.template, this.name);
  },
  innerContext: function afArrayFieldContext() {
    var c = AutoForm.Utility.normalizeContext(this, "afArrayField");
    var name = c.atts.name;
    var fieldMinCount = c.atts.minCount || 0;
    var fieldMaxCount = c.atts.maxCount || Infinity;
    var ss = c.af.ss;
    var formId = c.af.formId;

    // Init the array tracking for this field
    var docCount = fd.getDocCountForField(formId, name);
    if (docCount == null) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount);

    return {
      atts: c.atts
    };
  }
});
