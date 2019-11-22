Template.afBooleanRadioGroup_bootstrap3.helpers({
  falseAtts: function falseAtts() {
    const { trueLabel, falseLabel, nullLabel, 'data-schema-key': dataSchemaKey, ...atts } = this.atts
    if (this.value === false) {
      atts.checked = "";
    }
    return atts;
  },
  trueAtts: function trueAtts() {
    const { trueLabel, falseLabel, nullLabel, 'data-schema-key': dataSchemaKey, ...atts } = this.atts
    if (this.value === true) {
      atts.checked = "";
    }
    return atts;
  },
  nullAtts: function nullAtts() {
    const { trueLabel, falseLabel, nullLabel, 'data-schema-key': dataSchemaKey, ...atts } = this.atts
    if (this.value !== true && this.value !== false) {
      atts.checked = "";
    }
    return atts;
  },
  dsk: function () {
    return { 'data-schema-key': this.atts['data-schema-key'] };
  }
});
