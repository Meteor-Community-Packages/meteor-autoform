/*
 * Template helpers for "bootstrap3-span" template
 */

Template['afFieldLabel_bootstrap3-span'].atts = function() {
  var atts = (_.clone(this || {})).atts;
  var spanAtts = _.omit(atts, 'name', 'autoform', 'template');
  // Add bootstrap class if necessary; TODO use custom templates
  if (typeof spanAtts['class'] === "string") {
    spanAtts['class'] += " control-label"; //might be added twice but that shouldn't hurt anything
  } else {
    spanAtts['class'] = "control-label";
  }
  return spanAtts;
};
