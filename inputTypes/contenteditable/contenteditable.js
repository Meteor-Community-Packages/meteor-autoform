AutoForm.addInputType("contenteditable", {
  template: "afContenteditable",
  valueOut: function () {
    return this.html();
  },
  contextAdjust: function (context) {
    if (typeof context.atts['data-maxlength'] === "undefined" && typeof context.max === "number") {
      context.atts['data-maxlength'] = context.max;
    }
    return context;
  }
});


Template.afContenteditable.events({
    'blur div[contenteditable=true]': function (event, template) {
        var el = $(event.target),
            text = el.text(),
            input = el.siblings('input');

        input.val(text).change();
    }
});