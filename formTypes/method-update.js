/* global AutoForm, _validateForm */

AutoForm.addFormType('method-update', {
  onSubmit: function () {
    var c = this;

    // Prevent browser form submission
    this.event.preventDefault();

    if (!this.formAttributes.meteormethod) {
      throw new Error('When form type is "method-update", you must also provide a "meteormethod" attribute');
    }

    // Run "before.method" hooks
    this.runBeforeHooks(this.updateDoc, function (updateDoc) {
      // Validate. If both schema and collection were provided, then we validate
      // against the collection schema here. Otherwise we validate against whichever
      // one was passed.
      if (_validateForm(c.formId,
                       {updateDoc: updateDoc},
                       c.ssIsOverride) === false) {
        this.failedValidation();
      } else {
        // Call the method
        Meteor.call(c.formAttributes.meteormethod, updateDoc, c.docId, c.result);
      }
    });
  }
});
