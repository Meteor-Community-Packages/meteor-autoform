/* global AutoForm */

Template.afObjectField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afObjectField', this.template, this.name);
  },
  innerContext: function () {
    const c = AutoForm.Utility.getComponentContext(this, 'afObjectField');
    return { ...this, ...c.atts }
  }
});
