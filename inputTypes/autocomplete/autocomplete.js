import { Template } from 'meteor/templating'

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
    const itemAtts = { ...context.atts }

    // build items list
    context.items = []

    // re-use selectOptions to keep it DRY
    // Add all defined options or default
    if (context.selectOptions) {
      context.selectOptions.forEach(function (opt) {
        // there are no subgroups here
        const { label, value, ...htmlAtts } = opt
        context.items.push({
          name: context.name,
          label,
          value,
          htmlAtts,
          _id: opt.value.toString(),
          selected: (opt.value === context.value),
          atts: itemAtts
        })
      })
    }
    else {
      console.warn('autocomplete requires options for suggestions.')
    }

    return context
  }
})

Template.afAutocomplete.onRendered(function () {
  /* AUTOCOMPLETE
   ***************
   * This uses the same datums as select types, which
   * means that 'options' come from simple-schema.
   *
   * It allows selection by arrows up/down/enter; mouse click;
   * and when enough characters entered make a positive match.
   * Arrow navigation is circlular; top to bottom & vice versa.
   *
   * It uses the 'dropdown' classes in bootstrap 4 for styling.
   */

  // get the instance items
  // defined in several ways
  const me = Template.instance()

  // secure the dom so multiple autocompletes don't clash
  const $input = me.$('input')
  const $container = me.$('.dropdown')
  const $suggestions = me.$('.dropdown-menu')

  // prepare for arrow navigation
  let currIndex = -1
  let totalItems = 0

  // prevent form submit from "Enter/Return"
  $input.keypress((e) => {
    if (e.originalEvent.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
    }
  })

  // detect the keystrokes
  $input.keyup((e) => {
    // only populate when typing characters or deleting
    // otherwise, we are navigating
    if (/ArrowDown|ArrowUp|Enter/.test(e.originalEvent.key) === false) {
      // we're typing
      // filter results from input
      const result = me.data.items.filter((i) => {
        const reg = new RegExp(e.target.value, 'gi')
        return reg.test(i.label)
      })

      // display results in 'suggestions' div
      $suggestions.empty()
      let html
      let len = result.length
      totalItems = result.length

      if (len > 1) {
        currIndex = -1
        while (--len > -1) {
          // populate suggestions
          html = `<div class="dropdown-item" data-value="${result[len].value}">${result[len].label}</div>`
          $suggestions.append(html)
          $suggestions.addClass('show')
          $container.addClass('show')
        }

        // clear any manual navigated selections on hover
        $suggestions.children().hover((e) => {
          $suggestions.children().removeClass('active')
          currIndex = -1
        })

        // choose an answer on click
        $suggestions.children().click((e) => {
          const dataValue = me.$(e.target).attr('data-value')
          $input.val(dataValue)
          $suggestions.empty()
          $suggestions.removeClass('show')
          $container.removeClass('show')
        })
      }
      else if (e.originalEvent.key !== 'Backspace') {
        // only force populate if not deleting
        // bc we all make mistakes
        if (result.length === 1) {
          $input.val(result[0].value)
          $suggestions.removeClass('show')
          $container.removeClass('show')
        }
        else {
          // no results, hide
          $suggestions.removeClass('show')
          $container.removeClass('show')
        }
      }
    }
    else { // we're navigating suggestions
      // start highlighting at the 0 index
      if (/ArrowDown/.test(e.originalEvent.key) === true) {
        // navigating down
        if (currIndex === totalItems - 1) {
          currIndex = -1
        }
        // remove all classes from the children
        $suggestions.children().removeClass('active')
        $suggestions.children('div').eq(++currIndex).addClass('active')
      }
      else if (/ArrowUp/.test(e.originalEvent.key) === true) {
        if (currIndex <= 0) {
          currIndex = totalItems
        }
        // navigating up
        // remove all classes from the children
        $suggestions.children().removeClass('active')
        $suggestions.children('div').eq(--currIndex).addClass('active')
      }
      else if (/Enter/.test(e.originalEvent.key) === true) {
        // we're selecting
        const enterVal = $suggestions.children('div').eq(currIndex).attr('data-value')
        $input.val(enterVal)
        $suggestions.empty()
        $suggestions.removeClass('show')
        $container.removeClass('show')
        currIndex = -1
        totalItems = 0
      }
    }
  })
})
