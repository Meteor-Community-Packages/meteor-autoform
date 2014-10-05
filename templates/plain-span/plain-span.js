/*
 * Template helpers for "plain-span" template
 */

Template['afFieldLabel_plain-span'].helpers({
  atts: function afFieldLabelAtts() {
    var atts = (this || {}).atts;
    return _.omit(atts, 'name', 'autoform', 'template');
  }
});
