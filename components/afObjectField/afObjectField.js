Template.afObjectField.helpers({
  getTemplateName: function () {
    var self = this;
    return AutoForm.getTemplateName('afObjectField', self.template, self.atts && self.atts.name);
  }
});
