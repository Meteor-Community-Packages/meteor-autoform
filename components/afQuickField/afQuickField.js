/* global AutoForm */
import { Template } from 'meteor/templating'

Template.afQuickField.helpers({
  isReady: function afIsComponentContextReady () {
    const context = AutoForm.Utility.getComponentContext(this, 'afQuickField') || {}
    return Object.keys(context).length > 0
  },
  isGroup: function afQuickFieldIsGroup () {
    const ctx = AutoForm.Utility.getComponentContext(this, 'afQuickField')
    // Render a group of fields if we expect an Object and we don"t have options
    // and we have not overridden the type
    const isSubschema = typeof ctx.defs.type === 'object' && ctx.defs.type._schema
    return ((ctx.defs.type === Object || isSubschema) && !ctx.atts.options && !ctx.atts.type)
  },
  isFieldArray: function afQuickFieldIsFieldArray () {
    const ctx = AutoForm.Utility.getComponentContext(this, 'afQuickField')
    // Render an array of fields if we expect an Array and we don"t have options
    // and we have not overridden the type
    return (ctx.defs.type === Array && !ctx.atts.options && !ctx.atts.type)
  },
  groupAtts: function afQuickFieldGroupAtts () {
    // afQuickField passes `fields` and `omitFields` on to `afObjectField`
    // and `afArrayField`, but not to `afFormGroup`
    const { fields, omitFields, ...rest } = this
    return rest
  },
  isHiddenInput: function afQuickFieldIsHiddenInput () {
    const ctx = AutoForm.Utility.getComponentContext(this, 'afQuickField')
    const inputType = ctx.atts.type
    if (inputType) {
      const componentDef = AutoForm._inputTypeDefinitions[inputType]
      if (!componentDef) {
        throw new Error(`AutoForm: No component found for rendering input with type "${inputType}"`)
      }
      return componentDef.isHidden
    }

    return false
  }
})
