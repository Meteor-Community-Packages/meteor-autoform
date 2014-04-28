/*
 * Template helpers for "plain-span" template
 */

Template['afFieldLabel_plain-span'].atts = function() {
  var atts = (this || {}).atts;
  return _.omit(atts, 'name', 'autoform', 'template');
};
