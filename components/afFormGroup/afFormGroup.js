/* global AutoForm */

Template.afFormGroup.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afFormGroup', this.template, this.name);
  },
  innerContext: function afFormGroupContext() {
    var c = AutoForm.Utility.getComponentContext(this, 'afFormGroup');
    var afFieldLabelAtts = formGroupLabelAtts(c.atts);
    var afFieldInputAtts = formGroupInputAtts(c.atts);

    // Construct an `id` attribute for the input, optionally
    // adding a user-provided prefix. Since id attribute is
    // supposed to be unique in the DOM and templates can be
    // included multiple times, it's best not to provide an `id`
    // and generate a random one here for accessibility reasons.
    var id = c.atts.id || Random.id();
    var idPrefix = c.atts['id-prefix'];
    if (idPrefix && idPrefix.length > 0) {
      id = idPrefix + '-' + id;
    }

    // Set the input's `id` attribute and the label's `for` attribute to
    // the same ID.
    // NOTE: `afFieldLabelAtts.for` causes exception in IE8
    afFieldLabelAtts['for'] = afFieldInputAtts.id = id;

    // Get the field's schema definition
    var fieldSchema = AutoForm.getSchemaForField(c.atts.name);

    return {
      skipLabel: (c.atts.label === false),
      afFieldLabelAtts: afFieldLabelAtts,
      afFieldInputAtts: afFieldInputAtts,
      name: c.atts.name,
      required: !fieldSchema.optional,
      labelText: (typeof c.atts.label === 'string') ? c.atts.label : null
    };
  }
});

/*
 * Private
 */

function formGroupLabelAtts(atts) {
  // Separate label options from input options; label items begin with 'label-'
  var labelAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (key.indexOf('label-') === 0) {
      labelAtts[key.substring(6)] = val;
    }
  });
  return labelAtts;
}

function formGroupInputAtts(atts) {
  // Separate label options from input options; label items begin with 'label-'
  // We also don't want the 'label' option
  var inputAtts = {};
  _.each(atts, function autoFormLabelAttsEach(val, key) {
    if (['id-prefix', 'id', 'label'].indexOf(key) === -1 && key.indexOf('label-') !== 0) {
      inputAtts[key] = val;
    }
  });
  return inputAtts;
}
