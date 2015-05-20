Template.afBooleanRadioGroup_bootstrap3.helpers({
  falseAtts: function falseAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'data-schema-key');
    if (this.value === false) {
      atts.checked = "";
    }
    return atts;
  },
  trueAtts: function trueAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'data-schema-key');
    if (this.value === true) {
      atts.checked = "";
    }
    return atts;
  },
  dsk: function () {
    return {'data-schema-key': this.atts['data-schema-key']};
  }
});
