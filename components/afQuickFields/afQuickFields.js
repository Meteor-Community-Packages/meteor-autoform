Template.afQuickFields.helpers({
  quickFieldAtts: function afQuickFieldsQuickFieldAtts() {
    return _.extend({options: "auto"}, UI._parentData(2), this);
  }
});