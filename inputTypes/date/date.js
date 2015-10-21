AutoForm.addInputType("date", {
  template: "afInputDate",
  valueIn: function (val) {
    //convert Date to string value
    return AutoForm.valueConverters.dateToDateStringUTC(val);
  },
  valueOut: function () {
    var val = this.val();
    if (AutoForm.Utility.isValidDateString(val)) {
      //Create date at mignight in the morning of val date in UTC time zone
      var vals = val.split('-');
      --vals[1];
      return new Date(Date.UTC.apply(Date, vals));
    } else {
      return null;
    }
  },
  valueConverters: {
    "string": AutoForm.valueConverters.dateToDateStringUTC,
    "stringArray": AutoForm.valueConverters.dateToDateStringUTCArray,
    "number": AutoForm.valueConverters.dateToNumber,
    "numberArray": AutoForm.valueConverters.dateToNumberArray,
    "dateArray": AutoForm.valueConverters.dateToDateArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
      context.atts.max = AutoForm.valueConverters.dateToDateStringUTC(context.max);
    }
    if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
      context.atts.min = AutoForm.valueConverters.dateToDateStringUTC(context.min);
    }
    return context;
  }
});
