/* global AutoForm */

Template.afQuickField.onCreated(function onCreated() {
  const name = this.data.name
  if (this.data.hiddenFields && _.some(Utility.stringToArray(this.data.hiddenFields),
    function(field) {
      return (name == field) } )) {
        this.data.isHidden = true
        // both class for bs3 and bs4
        this.data['formgroup-class'] = "d-none hidden"
    }
})

Template.afQuickField.helpers({
  isGroup: function afQuickFieldIsGroup() {
    var c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    // Render a group of fields if we expect an Object and we don't have options
    // and we have not overridden the type
    const isSubschema = typeof c.defs.type === 'object' && c.defs.type._schema;
    return ((c.defs.type === Object || isSubschema) && !c.atts.options && !c.atts.type);
  },
  isFieldArray: function afQuickFieldIsFieldArray() {
    var c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    // Render an array of fields if we expect an Array and we don't have options
    // and we have not overridden the type
    return (c.defs.type === Array && !c.atts.options && !c.atts.type);
  },
  groupAtts: function afQuickFieldGroupAtts() {
    // afQuickField passes `fields` and `omitFields` on to `afObjectField`
    // and `afArrayField`, but not to `afFormGroup`
    return _.omit(this, 'fields', 'omitFields');
  },
  isHiddenInput: function afQuickFieldIsHiddenInput() {
    var c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    var inputType = c.atts.type;
    if (inputType) {
      var componentDef = AutoForm._inputTypeDefinitions[inputType];
      if (!componentDef) {
        throw new Error('AutoForm: No component found for rendering input with type "' + inputType + '"');
      }
      return componentDef.isHidden;
    }

    return false;
  }
});
