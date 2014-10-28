AutoForm.addInputType("month", {
  template: "afInputMonth",
  valueConverters: {
    "stringArray": function (val) {
      if (typeof val === "string" && val.length > 0) {
        return [val];
      }
      return val;
    }
  }
});