AutoForm.addInputType('url', {
  template: 'afInputUrl',
  valueConverters: {
    stringArray: AutoForm.valueConverters.stringToStringArray
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === 'undefined' && typeof context.max === 'number') {
      context.atts.maxlength = context.max
    }
    return context
  }
})
