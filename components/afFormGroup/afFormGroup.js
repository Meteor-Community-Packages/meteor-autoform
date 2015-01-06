Template.afFormGroup.helpers({
  innerContext: function afFormGroupContext(options) {
    var c = AutoForm.Utility.normalizeContext(options.hash, "afFormGroup");
    var afFieldLabelAtts = formGroupLabelAtts(c.atts);
    var afFieldInputAtts = formGroupInputAtts(c.atts);
    var id = c.atts["id-prefix"] || "";
    if (id) {
      id += "-";
    }
    id += c.atts.id || c.atts.name.replace(".", "-");
    afFieldLabelAtts.for = afFieldInputAtts.id = id;
    return {
      skipLabel: (c.atts.label === false),
      afFieldLabelAtts: afFieldLabelAtts,
      afFieldInputAtts: afFieldInputAtts,
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
    if (["id-prefix", "id", "label"].indexOf(key) === -1 && key.indexOf("label-") !== 0) {
      inputAtts[key] = val;
    }
  });
  return inputAtts;
}
