/* global AutoForm */

AutoForm.addFormType('update', {
  onSubmit: function () {
    const ctx = this;

    // Prevent browser form submission
    this.event.preventDefault();

    // Make sure we have a collection
    const collection = this.collection;
    if (!collection) {
      throw new Error("AutoForm: You must specify a collection when form type is update.");
    }

    // Run "before.update" hooks
    this.runBeforeHooks(this.updateDoc, function (modifier) {
      if (!Object.keys(modifier).length) { // make sure this check stays after the before hooks
        // Nothing to update. Just treat it as a successful update.
        ctx.result(null, 0);
      } else {
        // Perform update
        collection.update({ _id: ctx.docId }, modifier, ctx.validationOptions, ctx.result);
      }
    });
  },
  usesModifier: true,
  validateForm: function () {
    // Get SimpleSchema
    const formSchema = AutoForm.getFormSchema(this.form.id);
    // We validate the modifier. We don't want to throw errors about missing required fields, etc.
    return AutoForm._validateFormDoc(this.formDoc, true, this.form.id, formSchema, this.form);
  },
  shouldPrevalidate: function () {
    // Prevalidate only if there is both a `schema` attribute and a `collection` attribute
    return !!this.formAttributes.collection && !!this.formAttributes.schema;
  }
});
