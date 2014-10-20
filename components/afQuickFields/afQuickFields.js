Template.afQuickFields.helpers({
  quickFieldAtts: function afQuickFieldsQuickFieldAtts() {
    // Get the attributes that were on the afQuickFields component
    var afQuickFieldsComponentAtts = Template.parentData(2);
    // It's possible to call {{> afQuickFields}} with no attributes, in which case we
    // don't want the "attributes" because they're really just the parent context.
    if (afQuickFieldsComponentAtts.atts) {
      afQuickFieldsComponentAtts = {};
    }
    return _.extend({options: "auto"}, afQuickFieldsComponentAtts, this);
  }
});