import { Template } from 'meteor/templating'
console.log("ADDING AUTOCOMPLETE")
AutoForm.addInputType('autocomplete', {
  template: 'afAutocomplete',
  valueOut: function () {
    return this.val()
  },
  valueConverters: {
    stringArray: AutoForm.valueConverters.stringToStringArray,
    number: AutoForm.valueConverters.stringToNumber,
    numberArray: AutoForm.valueConverters.stringToNumberArray,
    boolean: AutoForm.valueConverters.stringToBoolean,
    booleanArray: AutoForm.valueConverters.stringToBooleanArray,
    date: AutoForm.valueConverters.stringToDate,
    dateArray: AutoForm.valueConverters.stringToDateArray
  },
  contextAdjust: function (context) {
    context.atts.autocomplete = 'off'
    return context
  }
})
