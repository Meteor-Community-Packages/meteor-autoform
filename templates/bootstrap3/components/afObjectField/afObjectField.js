Template.afObjectField_bootstrap3.helpers({
  quickFieldsAtts: function () {
    const { name, 'id-prefix': IdPrefix } = this
    return { name, 'id-prefix': IdPrefix }
  },
  panelClass: function () {
    return this.panelClass || 'panel-default';
  }
});
