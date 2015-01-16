Template.afEachArrayItem.helpers({
  innerContext: function afEachArrayItemContext(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afEachArrayItem");
    var formId = AutoForm.getFormId();
    var ss = AutoForm.getFormSchema();
    var name = c.atts.name;

    var docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, c.atts.minCount, c.atts.maxCount);
    
    return arrayTracker.getField(formId, name);
  }
});
