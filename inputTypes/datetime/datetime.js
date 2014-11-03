AutoForm.addInputType("datetime", {
  template: "afInputDateTime",
  valueIn: function (val) {
    //convert Date to string value
    return (val instanceof Date) ? AutoForm.Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(val): val;
  },
  valueOut: function () {
    var val = this.val();
    val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
    if (AutoForm.Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
      //Date constructor will interpret val as UTC due to ending "Z"
      return new Date(val);
    } else {
      return null;
    }
  },
  valueConverters: {
    "string": function (val) {
      return (val instanceof Date) ? AutoForm.Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(val) : val;
    },
    "stringArray": function (val) {
      if (val instanceof Date) {
        return [AutoForm.Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(val)];
      }
      return val;
    },
    "number": function (val) {
      return (val instanceof Date) ? val.getTime() : val;
    },
    "numberArray": function (val) {
      if (val instanceof Date) {
        return [val.getTime()];
      }
      return val;
    },
    "dateArray": function (val) {
      if (val instanceof Date) {
        return [val];
      }
      return val;
    }
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
      context.atts.max = AutoForm.Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.max);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = AutoForm.Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.min);
    }
    return context;
  }
});