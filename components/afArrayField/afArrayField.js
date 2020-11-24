/* global AutoForm, arrayTracker */
import { Template } from 'meteor/templating'

Template.afArrayField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afArrayField', this.template, this.name)
  },
  innerContext: function afArrayFieldContext () {
    const ctx = AutoForm.Utility.getComponentContext(this, 'afArrayField')
    const name = ctx.atts.name
    const fieldMinCount = ctx.atts.minCount || 0
    const fieldMaxCount = ctx.atts.maxCount || Infinity
    const ss = AutoForm.getFormSchema()
    const formId = AutoForm.getFormId()

    // Init the array tracking for this field
    let docCount = AutoForm.getArrayCountFromDocForField(formId, name)
    if (docCount === undefined) {
      docCount = ctx.atts.initialCount
    }
    arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount)

    return { atts: ctx.atts }
  }
})
