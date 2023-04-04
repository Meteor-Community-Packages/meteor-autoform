/* global AutoForm */
import { Meteor } from 'meteor/meteor'

AutoForm.addFormType('method', {
  onSubmit: function () {
    const ctx = this

    // Prevent browser form submission
    this.event.preventDefault()

    if (!this.formAttributes.meteormethod) {
      throw new Error(
        'When form type is "method", you must also provide a "meteormethod" attribute'
      )
    }

    // Run "before.method" hooks
    this.runBeforeHooks(this.insertDoc, function (doc) {
      // Validate. If both schema and collection were provided, then we validate
      // against the collection schema here. Otherwise we validate against whichever
      // one was passed.
      const valid =
        ctx.formAttributes.validation === 'none' ||
        ctx.formTypeDefinition.validateForm.call({
          form: ctx.formAttributes,
          formDoc: doc,
          useCollectionSchema: ctx.ssIsOverride
        })

      if (valid === false) {
        ctx.failedValidation()
      }
      else {
        const { methodargs } = ctx.formAttributes
        const args = methodargs
          ? typeof methodargs === 'function'
              ? methodargs()
              : methodargs
          : []
        // Call the method. If a ddp connection was provided, use
        // that instead of the default Meteor connection
        let ddp = ctx.formAttributes.ddp
        ddp = ddp && typeof ddp.call === 'function' ? ddp : Meteor
        ddp.call(ctx.formAttributes.meteormethod, doc, ...args, ctx.result)
      }
    })
  },
  validateForm: function () {
    // Get SimpleSchema
    let formSchema = AutoForm.getFormSchema(this.form.id)

    const collection = AutoForm.getFormCollection(this.form.id)
    // If there is a `schema` attribute but you want to force validation against the
    // collection's schema instead, pass useCollectionSchema=true
    formSchema = this.useCollectionSchema && collection
      ? collection.simpleSchema()
      : formSchema

    // Validate
    return AutoForm._validateFormDoc(
      this.formDoc,
      false,
      this.form.id,
      formSchema,
      this.form
    )
  },
  shouldPrevalidate: function () {
    // Prevalidate only if there is both a `schema` attribute and a `collection` attribute
    return !!this.formAttributes.collection && !!this.formAttributes.schema
  }
})
