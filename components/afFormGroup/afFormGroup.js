Template.afFormGroup.helpers({
  innerContext: function afFormGroupContext(options) {
    var c = Utility.normalizeContext(options.hash, "afFormGroup");
    return {
      skipLabel: (c.atts.label === false),
      afFieldLabelAtts: formGroupLabelAtts(c.atts),
      afFieldInputAtts: formGroupInputAtts(c.atts),
      atts: {name: c.atts.name}
    };
  }
});

/*
 * Private
 */

function formGroupLabelAtts(atts) {
  // Separate label options from input options; label items begin with "label-"
  var labelAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (key.indexOf("label-") === 0) {
      labelAtts[key.substring(6)] = val;
    }
  });

  return labelAtts;
}

function formGroupInputAtts(atts) {
  // Separate label options from input options; label items begin with "label-"
  // We also don't want the "label" option
  return _.omit(atts, function (val, key) {
    return (key === "label" || key.indexOf("label-") === 0);
  });
}