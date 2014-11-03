Template.afFormGroup.helpers({
  innerContext: function afFormGroupContext(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afFormGroup");
    return {
      skipLabel: (c.atts.label === false),
      afFieldLabelAtts: formGroupLabelAtts(c.atts),
      afFieldInputAtts: formGroupInputAtts(c.atts),
      atts: {name: c.atts.name},
      labelText: (typeof c.atts.label === "string") ? c.atts.label : null
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
  var inputAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (key !== "label" && key.indexOf("label-") !== 0) {
      inputAtts[key] = val;
    }
  });
  return inputAtts;
}
