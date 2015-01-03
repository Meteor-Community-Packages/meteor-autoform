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
    // placeholder issue: http://stackoverflow.com/a/27755631/4315996
    var $element = template.$(event.target);
    if ($element.html() && !$element.text().trim().length) {
        $element.empty();
    }
    $element.change();
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
