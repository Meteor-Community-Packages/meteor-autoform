AutoForm.addInputType("datetime-local", {
  template: "afInputDateTimeLocal",
  valueIn: function (val, atts) {
    //convert Date to string value
    return (val instanceof Date) ? AutoForm.Utility.dateToNormalizedLocalDateAndTimeString(val, atts.timezoneId) : val;
  },
  valueOut: function () {
    var val = this.val();
    val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
    if (AutoForm.Utility.isValidNormalizedLocalDateAndTimeString(val)) {
      var timezoneId = this.attr("data-timezone-id");
      // default is local, but if there's a timezoneId, we use that
      if (typeof timezoneId === "string") {
        if (typeof moment.tz !== "function") {
          throw new Error("If you specify a timezoneId, make sure that you've added a moment-timezone package to your app");
        }
        return moment.tz(val, timezoneId).toDate();
      } else {
        return moment(val).toDate();
      }
    } else {
      return null;
    }
  },
  valueConverters: {
    "string": function (val) {
      return (val instanceof Date) ? AutoForm.Utility.dateToNormalizedLocalDateAndTimeString(val, this.attr("data-timezone-id")) : val;
    },
    "stringArray": function (val) {
      if (val instanceof Date) {
        return [AutoForm.Utility.dateToNormalizedLocalDateAndTimeString(val, this.attr("data-timezone-id"))];
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
      context.atts.max = AutoForm.Utility.dateToNormalizedLocalDateAndTimeString(context.max, context.atts.timezoneId);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = AutoForm.Utility.dateToNormalizedLocalDateAndTimeString(context.min, context.atts.timezoneId);
    }
    if (context.atts.timezoneId) {
      context.atts["data-timezone-id"] = context.atts.timezoneId;
    }
    delete context.atts.timezoneId;
    return context;
  }
});