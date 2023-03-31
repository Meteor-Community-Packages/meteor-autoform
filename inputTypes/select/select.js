AutoForm.addInputType('select', {
  template: 'afSelect',
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
    // can fix issues with some browsers selecting the firstOption instead of the selected option
    context.atts.autocomplete = 'off'

    let { firstOption, ...itemAtts } = context.atts

    // build items list
    context.items = []

    // If a firstOption was provided, add that to the items list first
    if (firstOption !== false) {
      if (typeof firstOption === 'function') {
        firstOption = firstOption()
      }
      context.items.push({
        name: context.name,
        label: (typeof firstOption === 'string' ? firstOption : '(Select One)'),
        value: '',
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        //
        // Setting this to an empty string caused problems if option with value
        // 1 was in the options list because Spacebars evaluates "" to 1 and
        // considers that a duplicate.
        // See https://github.com/aldeed/meteor-autoform/issues/656
        _id: 'AUTOFORM_EMPTY_FIRST_OPTION',
        selected: false,
        atts: itemAtts
      })
    }

    // Add all defined options
    context.selectOptions.forEach(function (opt) {
      if (opt.optgroup) {
        const subItems = opt.options.map(function (subOpt) {
          const { label, value, ...htmlAtts } = subOpt
          return {
            name: context.name,
            label,
            value,
            htmlAtts,
            // _id must be included because it is a special property that
            // #each uses to track unique list items when adding and removing them
            // See https://github.com/meteor/meteor/issues/2174
            //
            // The toString() is necessary because otherwise Spacebars evaluates
            // any string to 1 if the other values are numbers, and then considers
            // that a duplicate.
            // See https://github.com/aldeed/meteor-autoform/issues/656
            _id: subOpt.value.toString(),
            selected: (subOpt.value === context.value),
            atts: itemAtts
          }
        })
        context.items.push({
          optgroup: opt.optgroup,
          items: subItems
        })
      }
      else {
        const { label, value, ...htmlAtts } = opt
        context.items.push({
          name: context.name,
          label,
          value,
          htmlAtts,
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          //
          // The toString() is necessary because otherwise Spacebars evaluates
          // any string to 1 if the other values are numbers, and then considers
          // that a duplicate.
          // See https://github.com/aldeed/meteor-autoform/issues/656
          _id: opt.value.toString(),
          selected: (opt.value === context.value),
          atts: itemAtts
        })
      }
    })

    return context
  }
})
