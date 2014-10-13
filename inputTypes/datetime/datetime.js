AutoForm.addInputType("datetime", {
  template: "afInputDateTime",
  valueIn: function (val) {
    //convert Date to string value
    return (val instanceof Date) ? Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(val): val;
  },
  valueOut: function () {
    var val = this.val();
    val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
    if (Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
      //Date constructor will interpret val as UTC due to ending "Z"
      return new Date(val);
    } else {
      return null;
    }
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
      context.atts.max = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.max);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.min);
    }
    return context;
  }
});