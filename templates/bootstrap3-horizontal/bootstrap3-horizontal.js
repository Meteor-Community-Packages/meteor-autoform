Template["quickForm_bootstrap3-horizontal"].qfHorizontalAdjust = function (afContext) {
  var ctx = _.clone(this || {});
  ctx.template = "bootstrap3-horizontal";
  ctx['input-col-class'] = afContext['input-col-class'];
  ctx['label-class'] = afContext['label-class'];
  return ctx;
};

Template["afQuickField_bootstrap3-horizontal"].afFieldInputAtts = function () {
  var atts = _.clone(this.afFieldInputAtts || {});
  if ('input-col-class' in atts) {
    delete atts['input-col-class'];
  }
  atts.template = "bootstrap3";
  return atts;
};

Template["afQuickField_bootstrap3-horizontal"].afFieldLabelAtts = function () {
  var atts = _.clone(this.afFieldLabelAtts || {});
  atts.template = "bootstrap3";
  return atts;
};

Template["afQuickField_bootstrap3-horizontal"].rightColumnClass = function () {
  var atts = this.afFieldInputAtts || {};
  return atts['input-col-class'] || "";
};
