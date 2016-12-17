Template.afObjectField_bootstrap3.helpers({
  quickFieldsAtts: function () {
    console.log(this,Template.instance())
    return _.pick(this, 'name', 'id-prefix');
  },
  panelClass: function() {
    console.log(this,Template.instance())
    return this.panelClass || 'panel-default';
  }
});
