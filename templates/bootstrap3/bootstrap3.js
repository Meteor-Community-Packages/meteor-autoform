/* 
 * Template helpers for "bootstrap3" template
 */

Template['afFieldLabel_bootstrap3'].atts = function() {
  var atts = (_.clone(this || {})).atts;
  var labelAtts = _.omit(atts, 'name', 'autoform');
  // Add bootstrap class if necessary; TODO use custom templates
  if (typeof labelAtts['class'] === "string") {
    labelAtts['class'] += " control-label"; //might be added twice but that shouldn't hurt anything
  } else {
    labelAtts['class'] = "control-label";
  }
  // Add "for" attribute if missing
  labelAtts.for = labelAtts.for || atts.name;
  return labelAtts;
};