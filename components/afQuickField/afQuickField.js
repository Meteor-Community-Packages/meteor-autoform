/* global AutoForm */

Template.afQuickField.helpers({
  isReady: function afIsComponentContextReady() {
    const context = AutoForm.Utility.getComponentContext(this, "afQuickField") || {};
    return Object.keys(context).length > 0;
  },
  isGroup: function afQuickFieldIsGroup() {
    const c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    // Render a group of fields if we expect an Object and we don"t have options
    // and we have not overridden the type
    const isSubschema = typeof c.defs.type === "object" && c.defs.type._schema;
    return ((c.defs.type === Object || isSubschema) && !c.atts.options && !c.atts.type);
  },
  isFieldArray: function afQuickFieldIsFieldArray() {
    const c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    // Render an array of fields if we expect an Array and we don"t have options
    // and we have not overridden the type
    return (c.defs.type === Array && !c.atts.options && !c.atts.type);
  },
  groupAtts: function afQuickFieldGroupAtts() {
    // afQuickField passes `fields` and `omitFields` on to `afObjectField`
    // and `afArrayField`, but not to `afFormGroup`
    const { fields, omitFields, ...rest } = this
    return rest;
  },
  isHiddenInput: function afQuickFieldIsHiddenInput() {
    const c = AutoForm.Utility.getComponentContext(this, "afQuickField");
    const inputType = c.atts.type;
    if (inputType) {
      const componentDef = AutoForm._inputTypeDefinitions[inputType];
      if (!componentDef) {
        throw new Error(`AutoForm: No component found for rendering input with type "${inputType}"`);
      }
      return componentDef.isHidden;
    }

    return false;
  }
});
