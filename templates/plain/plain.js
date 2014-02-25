/* 
 * Template helpers for "plain" template
 */

Template['afFieldLabel_plain'].atts = function() {
  var atts = (_.clone(this || {})).atts;
  var labelAtts = _.omit(atts, 'name', 'autoform');
  // Add "for" attribute if missing
  labelAtts.for = labelAtts.for || atts.name;
  return labelAtts;
};