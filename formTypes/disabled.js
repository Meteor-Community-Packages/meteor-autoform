/* global AutoForm */

AutoForm.addFormType('disabled', {
  onSubmit: function () {
    // Prevent browser form submission
    this.event.preventDefault();
    // Nothing else
  },
  adjustInputContext: function (ctx) {
    ctx.atts.disabled = "";
    return ctx;
  },
  hideArrayItemButtons: true
});
