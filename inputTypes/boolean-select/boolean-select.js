AutoForm.addInputType("boolean-select", {
  template: "afBooleanSelect",
  valueIn: function (val) {
    // switch to a boolean
    return (val === "true") ? true : false;
  },
  valueOut: function () {
    var val = this.val();
    if (val === "true") {
      return true;
    } else if (val === "false") {
      return false;
    }
  },
  contextAdjust: function (context) {
    var atts = _.omit(context.atts, 'trueLabel', 'falseLabel');

    // build items list
    context.items = [
      {
        name: context.name,
        value: "false",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "false",
        selected: !context.value,
        label: context.atts.falseLabel || "False",
        atts: atts
      },
      {
        name: context.name,
        value: "true",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "true",
        selected: context.value,
        label: context.atts.trueLabel || "True",
        atts: atts
      }
    ];

    return context;
  }
});

Template["afBooleanSelect"].helpers({
  optionAtts: function afSelectOptionAtts() {
    var item = this
    var atts = {
      value: item.value
    };
    if (item.selected) {
      atts.selected = "";
    }
    return atts;
  }
});