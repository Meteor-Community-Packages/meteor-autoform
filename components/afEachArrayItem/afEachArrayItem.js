Template.afEachArrayItem.helpers({
  innerContext: function afEachArrayItemContext(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afEachArrayItem");
    var formId = c.af.formId;
    var name = c.atts.name;

    var docCount = fd.getDocCountForField(formId, name);
    if (docCount == null) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, c.af.ss, docCount, c.atts.minCount, c.atts.maxCount);
    
    return arrayTracker.getField(formId, name);
  }
});