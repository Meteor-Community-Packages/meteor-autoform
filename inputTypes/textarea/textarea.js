AutoForm.addInputType('textarea', {
  template: 'afTextarea',
  valueConverters: {
    stringArray: function (val) {
      if (typeof val === 'string' && val.length > 0) {
        return linesToArray(val)
      }
      return val
    },
    number: AutoForm.valueConverters.stringToNumber,
    numberArray: AutoForm.valueConverters.stringToNumberArray,
    boolean: AutoForm.valueConverters.stringToBoolean,
    booleanArray: function (val) {
      if (typeof val === 'string' && val.length > 0) {
        const arr = linesToArray(val)
        return arr.map(function (item) {
          return AutoForm.valueConverters.stringToBoolean(item)
        })
      }
      return val
    },
    date: AutoForm.valueConverters.stringToDate,
    dateArray: function (val) {
      if (typeof val === 'string' && val.length > 0) {
        const arr = linesToArray(val)
        return arr.map(function (item) {
          return AutoForm.valueConverters.stringToDate(item)
        })
      }
      return val
    }
  },
  contextAdjust: function (context) {
    if (typeof context.atts.maxlength === 'undefined' && typeof context.max === 'number') {
      context.atts.maxlength = context.max
    }
    return context
  }
})

function linesToArray (text) {
  text = text.split('\n')
  const lines = []
  text.forEach(function (line) {
    line = line.trim()
    if (line.length) {
      lines.push(line)
    }
  })
  return lines
}
