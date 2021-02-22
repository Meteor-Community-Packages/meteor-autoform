/* global AutoForm, arrayTracker */
import { Template } from 'meteor/templating'

Template.afEachArrayItem.helpers({
  innerContext: function afEachArrayItemContext () {
    const ctx = AutoForm.Utility.getComponentContext(this, 'afEachArrayItem')
    const formId = AutoForm.getFormId()
    const formSchema = AutoForm.getFormSchema()
    const name = ctx.atts.name

    let docCount = AutoForm.getArrayCountFromDocForField(formId, name)
    if (docCount === undefined) {
      docCount = ctx.atts.initialCount
    }

    const minCount = typeof ctx.atts.minCount === 'number' ? ctx.atts.minCount : ctx.defs.minCount
    const maxCount = typeof ctx.atts.maxCount === 'number' ? ctx.atts.maxCount : ctx.defs.maxCount

    arrayTracker.initField(formId, name, formSchema, docCount, minCount, maxCount)
    return arrayTracker.getField(formId, name)
  }
})
