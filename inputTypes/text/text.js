AutoForm.addInputType("text", {
  template: "afInputText",
  valueOut: function () {
    return this.val();
  },
  valueConverters: {
    "stringArray": function (val) {
      if (typeof val === "string") {
        val = val.split(",");
        return _.map(val, function (item) {
          return $.trim(item);
        });
      }
      return val;
    },
    "number": Utility.stringToNumber,
    "numberArray": function (val) {
      if (typeof val === "string") {
        val = val.split(",");
        return _.map(val, function (item) {
          item = $.trim(item);
          return Utility.stringToNumber(item);
        });
      }
      return val;
    },
    "boolean": Utility.stringToBool,
    "booleanArray": function (val) {
      if (typeof val === "string") {
        val = val.split(",");
        return _.map(val, function (item) {
          item = $.trim(item);
          return Utility.stringToBool(item);
        });
      }
      return val;
    },
    "date": Utility.stringToDate,
    "dateArray": function (val) {
      if (typeof val === "string") {
        val = val.split(",");
        return _.map(val, function (item) {
          item = $.trim(item);
          return Utility.stringToDate(item);
        });
      }
      return val;
    }
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
      context.atts.maxlength = context.max;
    }
    return context;
  }
});