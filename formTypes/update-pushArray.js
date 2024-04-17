/* global AutoForm */

AutoForm.addFormType('update-pushArray', {
  onSubmit: function () {
    const ctx = this

    // Prevent browser form submission
    this.event.preventDefault()

    // Make sure we have a collection
    const collection = this.collection
    if (!collection) {
      throw new Error('AutoForm: You must specify a collection when form type is update-pushArray.')
    }

    // Make sure we have a scope
    const scope = ctx.formAttributes.scope
    if (!scope) {
      throw new Error('AutoForm: You must specify a scope when form type is update-pushArray.')
    }

    // Run "before.update" hooks
    this.runBeforeHooks(this.insertDoc, function (doc) {
      if (!Object.keys(doc).length) { // make sure this check stays after the before hooks
        // Nothing to update. Just treat it as a successful update.
        ctx.result(null, 0)
      }
      else {
        const modifer = { $push: {} }
        modifer.$push[scope] = doc
        // Perform update
        collection.update({ _id: ctx.docId }, modifer, ctx.validationOptions, ctx.result)
      }
    })
  },
  validateForm: function () {
    // Get SimpleSchema
    const formSchema = AutoForm.getFormSchema(this.form.id)
    // We validate as if it's an insert form
    return AutoForm._validateFormDoc(this.formDoc, false, this.form.id, formSchema, this.form)
  },
  adjustSchema: function (formSchema) {
    return formSchema.getObjectSchema(`${this.form.scope}.$`)
  },
  shouldPrevalidate: function () {
    // Prevalidate because the form is generated with a schema
    // that has keys different from the collection schema
    return true
  }
})
