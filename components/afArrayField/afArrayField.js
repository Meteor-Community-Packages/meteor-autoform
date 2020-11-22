/* global AutoForm, arrayTracker */

Template.afArrayField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName("afArrayField", this.template, this.name);
  },
  innerContext: function afArrayFieldContext() {
    const c = AutoForm.Utility.getComponentContext(this, "afArrayField");
    const name = c.atts.name;
    const fieldMinCount = c.atts.minCount || 0;
    const fieldMaxCount = c.atts.maxCount || Infinity;
    const ss = AutoForm.getFormSchema();
    const formId = AutoForm.getFormId();

    // Init the array tracking for this field
    let docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount);

    return { atts: c.atts };
  }
});
