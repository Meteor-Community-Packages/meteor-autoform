AutoForm.addInputType("contenteditable", {
  template: "afContenteditable",
  valueOut: function () {
    return this.html();
  },
  contextAdjust: function (context) {
    if (typeof context.atts["data-maxlength"] === "undefined" && typeof context.max === "number") {
      context.atts["data-maxlength"] = context.max;
    }
    if (context.atts["placeholder"]) {
      context.atts["data-placeholder"] = context.atts["placeholder"];
      delete context.atts["placeholder"];
    }
    return context;
  }
});

Template.afContenteditable.events({
  "blur [contenteditable]": function (event, template) {
    var $element = template.$(event.target);
    var pollTimeout = $element.data("poll-timeout");
    if (pollTimeout) {
      $element.data("poll-timeout", false);
      clearTimeout(pollTimeout);
    }
    // placeholder issue: http://stackoverflow.com/a/27755631/4315996
    if ($element.html().length && !$element.text().trim().length) {
        $element.empty();
    }
    var initial = $element.data("initial-value");
    var current = $element.html();
    if (initial != current) {
      $element.change();
    }
    // field may lost value: https://github.com/aldeed/meteor-autoform/issues/590
  },
  "focus [contenteditable]": function (event, template) {
    var $element = template.$(event.target);
    $element.data("initial-value", $element.html());
    $element.data("previous-value", $element.html());
    function checkForContentChanged() {
      var previous = $element.data("previous-value");
      var current = $element.html();
      if (previous != current) {
        $element.trigger("input2"); // final event - change
        $element.data("previous-value", current);
      }
      $element.data("poll-timeout", setTimeout(checkForContentChanged, 500));
    }
    $element.data("poll-timeout", setTimeout(checkForContentChanged, 500));
  },
  "keyup [contenteditable]": function (event, template) {
    // [esc] support
    if (event.which == 27) {
      var $element = template.$(event.target);
      $element.html($element.data("initial-value"));
      $element.blur();
    }
  }
});

Template.afContenteditable.helpers({
  out: function () {
    var atts = "";
    for (key in this.atts) {
      atts += ' ' + key + '="' + this.atts[key] + '"';
    }
    // BUGFIX: https://github.com/aldeed/meteor-autoform/issues/383
    return '<div contenteditable="true"' + atts + '>' + this.value + '</div>';
  }
});
