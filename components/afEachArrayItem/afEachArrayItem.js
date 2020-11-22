/* global AutoForm, arrayTracker */

Template.afEachArrayItem.helpers({
  innerContext: function afEachArrayItemContext() {
    const c = AutoForm.Utility.getComponentContext(this, "afEachArrayItem");
    const formId = AutoForm.getFormId();
    const ss = AutoForm.getFormSchema();
    const name = c.atts.name;

    let docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, c.atts.minCount, c.atts.maxCount);
    return arrayTracker.getField(formId, name);
  }
});
