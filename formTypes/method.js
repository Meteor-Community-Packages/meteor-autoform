/* global AutoForm, validateForm */

AutoForm.addFormType('method', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    if (!this.methodName) {
      throw new Error('When form type is "method", you must also provide a "meteormethod" attribute');
    }

    // Run "before.method" hooks
    this.runBeforeHooks(this.insertDoc, function (doc) {
      // Validate. If both schema and collection were provided, then we validate
      // against the collection schema here. Otherwise we validate against whichever
      // one was passed.
      if (validateForm(c.formId,
                       {insertDoc: c.insertDoc, updateDoc: c.updateDoc},
                       c.ssIsOverride) === false) {
        this.failedValidation();
      } else {
        // Call the method
        Meteor.call(c.formAttributes.meteormethod, doc, c.updateDoc, c.docId, c.result);
      }
    });
  }
});
