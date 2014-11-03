Template.afQuickField.helpers({
  isGroup: function afQuickFieldIsGroup(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afQuickField");
    // Render a group of fields if we expect an Object and we don't have options
    // and we have not overridden the type
    return (c.defs.type === Object && !c.atts.options && !c.atts.type);
  },
  isFieldArray: function afQuickFieldIsFieldArray(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afQuickField");
    // Render an array of fields if we expect an Array and we don't have options
    // and we have not overridden the type
    return (c.defs.type === Array && !c.atts.options && !c.atts.type);
  },
  groupAtts: function afQuickFieldGroupAtts() {
    return _.omit(this, 'fields', 'omitFields');
  }
});
