/* global AutoForm */

AutoForm.addFormType('readonly', {
  onSubmit: function () {
    // Prevent browser form submission
    this.event.preventDefault();
    // Nothing else
  },
  adjustInputContext: function (ctx) {
    ctx.atts.readonly = "";
    return ctx;
  },
  hideArrayItemButtons: true
});
