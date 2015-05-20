/* global AutoForm */

Template.afObjectField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afObjectField', this.template, this.name);
  }
});
