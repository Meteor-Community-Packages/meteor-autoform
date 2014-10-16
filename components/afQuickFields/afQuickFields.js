Template.afQuickFields.helpers({
  quickFieldAtts: function afQuickFieldsQuickFieldAtts() {
    return _.extend({options: "auto"}, Template.parentData(2), this);
  }
});