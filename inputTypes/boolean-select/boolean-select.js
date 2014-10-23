AutoForm.addInputType("boolean-select", {
  template: "afBooleanSelect",
  valueOut: function () {
    var val = this.val();
    if (val === "true") {
      return true;
    } else if (val === "false") {
      return false;
    }
  },
  valueConverters: {
    "string": function (val) {
      if (val === true) {
        return "TRUE";
      } else if (val === false) {
        return "FALSE";
      }
      return val;
    },
    "stringArray": function (val) {
      if (val === true) {
        return ["TRUE"];
      } else if (val === false) {
        return ["FALSE"];
      }
      return val;
    },
    "number": function (val) {
      if (val === true) {
        return 1;
      } else if (val === false) {
        return 0;
      }
      return val;
    },
    "numberArray": function (val) {
      if (val === true) {
        return [1];
      } else if (val === false) {
        return [0];
      }
      return val;
    }
  },
  contextAdjust: function (context) {
    var atts = _.omit(context.atts, 'trueLabel', 'falseLabel', 'firstOption');

    // build items list
    context.items = [
      {
        name: context.name,
        value: "",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "",
        selected: (context.value !== false && context.value !== true),
        label: context.atts.firstOption || "(Select One)",
        atts: atts
      },
      {
        name: context.name,
        value: "false",
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: "false",
        selected: (context.value === false),
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
        selected: (context.value === true),
        label: context.atts.trueLabel || "True",
        atts: atts
      }
    ];

    return context;
  }
});

Template["afBooleanSelect"].helpers({
  optionAtts: function afSelectOptionAtts() {
    var item = this;
    var atts = {
      value: item.value
    };
    if (item.selected) {
      atts.selected = "";
    }
    return atts;
  }
});