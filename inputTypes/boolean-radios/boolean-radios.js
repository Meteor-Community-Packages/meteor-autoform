AutoForm.addInputType("boolean-radios", {
  template: "afBooleanRadioGroup",
  valueOut: function () {
    if (this.find('input[value=false]').is(":checked")) {
      return false;
    } else if (this.find('input[value=true]').is(":checked")) {
      return true;
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
  }
});

Template["afBooleanRadioGroup"].helpers({
  falseAtts: function falseAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'data-schema-key');
    if (this.value === false) {
      atts.checked = "";
    }
    return atts;
  },
  trueAtts: function trueAtts() {
    var atts = _.omit(this.atts, 'trueLabel', 'falseLabel', 'data-schema-key');
    if (this.value === true) {
      atts.checked = "";
    }
    return atts;
  },
  dsk: function () {
    return {'data-schema-key': this.atts['data-schema-key']};
  }
});
