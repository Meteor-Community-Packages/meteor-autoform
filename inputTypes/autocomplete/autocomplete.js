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
    // Add all defined options
    context.selectOptions.forEach(function(opt) {
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

    return context
  }
})

Template.afAutocomplete.onRendered(function() {
  /* AUTOCOMPLETE
   ***************
   * This uses the same datums as select types, which
   * means that 'options' come from simple-schema.
   *
   * It allows selection by arrows up/down/enter; mouse click;
   * and when enough characters entered make a positive match.
   * Arrow nanigation is circlular; top to bottom & vice versa.
   *
   * It needs some class definitions and styles, such as:
   *
   * .autocomplete {
   *   .ac-container { // trick to prevent calculating position
   *     position: relative;
   *     height: 0;
   *
   *     .ac-suggestions {
   *       position: absolute;
   *       top: 0;
   *       left: 0;
   *       width: 100%;
   *       z-index: $zindex-modal + 1;
   *       border-radius: $border-radius-lg;
   *       background-color: lighten($card-black-background, 6%);
   *       overflow: hidden;
   *
   *       > div {
   *         padding: 15px;
   *         font-size: $font-size-sm;
   *
   *         &:first-child {
   *           border-color: lighten($nav-gray,5%);
   *           border-top: 2px solid;
   *         }
   *
   *         &:hover,
   *         &.ac-selected {
   *           background-color: darken($white, 10%);
   *           color: $black;
   *         }
   *       }
   *     }
   *   }
   * }
   */

  // get the instance items
  // defined in several ways
  const me = Template.instance()
  const items = me.data.items

  // secure the dom so multiple autocompletes don't clash
  const $me = $(me.firstNode)
  const $input = $me.children('input')
  const $container = $me.children('.ac-container')
  const $suggestions = $container.children('.ac-suggestions')

  // prepare for arrow navigation
  let currIndex = -1
  let totalItems = 0

  // prevent form submit from "Enter/Return"
  $input.keypress((e) =>
  {
    if (e.originalEvent.key === "Enter")
    {
      e.preventDefault()
      e.stopPropagation()
    }
  })

  // detect the keystrokes
  $input.keyup((e) =>
  {
    // only populate when typing characters or deleting
    // otherwise, we are navigating
    if (/ArrowDown|ArrowUp|Enter/.test(e.originalEvent.key) === false)
    {
      // we're typing
      // filter results from input
      let result = me.data.items.filter((i) => {
        let reg = new RegExp(e.target.value, 'gi')
        return reg.test(i.value)
      })

      // display results in 'suggestions' div
      $suggestions.empty()
      let len = result.length
      totalItems = result.length
      if (len > 1)
      {
        while (--len > -1)
        {
          // populate suggestions
          let html = `<div data-value=${result[len].value}>${result[len].label}`
          $suggestions.append(html)
        }

        // clear any manual navigated selections on hover
        $suggestions.children().hover((e) => {
          $suggestions.children().removeClass('ac-selected')
          currIndex = -1
        })

        // choose an answer on click
        $suggestions.children().click((e) => {
          let dataValue = $(e.target).attr('data-value')
          $input.val(dataValue)
          $suggestions.empty()
        })
      }
      else if (e.originalEvent.key !== "Backspace")
      {
        // only force populate if not deleting
        // bc we all make mistakes
        if (result.length === 1)
        {
          $input.val(result[0].value)
        }
      }
    }
    else // we're navigating suggestions
    {
      // start highlighting at the 0 index
      if (/ArrowDown/.test(e.originalEvent.key) === true)
      {
        // navigating down
        if (currIndex === totalItems - 1)
        {
          currIndex = -1
        }
        // remove all classes from the children
        $suggestions.children().removeClass('ac-selected')
        $suggestions.children('div').eq(++currIndex).addClass('ac-selected')
      }
      else if (/ArrowUp/.test(e.originalEvent.key) === true)
      {
        if (currIndex <= 0)
        {
          currIndex = totalItems
        }
        // navigating up
        // remove all classes from the children
        $suggestions.children().removeClass('ac-selected')
        $suggestions.children('div').eq(--currIndex).addClass('ac-selected')
      }
      else if (/Enter/.test(e.originalEvent.key) === true)
      {
        // we're selecting
        let enterVal = $suggestions.children('div').eq(currIndex).attr('data-value')
        $input.val(enterVal)
        $suggestions.empty()
        currIndex = -1
        totalItems = 0
      }
    }
  })
})
