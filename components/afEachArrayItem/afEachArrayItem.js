/* global AutoForm, arrayTracker */

Template.afEachArrayItem.helpers({
  innerContext: function afEachArrayItemContext() {
    const ctx = AutoForm.Utility.getComponentContext(this, "afEachArrayItem");
    const formId = AutoForm.getFormId();
    const formSchema = AutoForm.getFormSchema();
    const name = ctx.atts.name;

    let docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = ctx.atts.initialCount;
    }
    arrayTracker.initField(formId, name, formSchema, docCount, ctx.atts.minCount, ctx.atts.maxCount);
    return arrayTracker.getField(formId, name);
  }
});
