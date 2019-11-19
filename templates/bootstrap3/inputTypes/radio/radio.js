Template.afRadio_bootstrap3.helpers({
  atts: function selectedAttsAdjust() {
    var atts = { ...this.atts };
    if (this.selected) {
      atts.checked = "";
    }
    return atts;
  }
});
