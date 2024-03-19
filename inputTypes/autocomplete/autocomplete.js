import { Template } from 'meteor/templating'
import { ReactiveVar } from 'meteor/reactive-var'

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
    const { ...itemAtts } = context.atts
    // remove non-essential atts from visible input
    const visibleAtts = Object.assign({}, context.atts)

    ;['data-schema-key', 'id', 'name'].forEach(key => {
      delete visibleAtts[key]
    })

    // add form-control to remaining classes
    context.visibleAtts = visibleAtts

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
  const items = new ReactiveVar([])
  let isOption

  me.autorun(() => {
    const data = Template.currentData()
    items.set(data.items)
    isOption = value => data.selectOptions.find(option => option.value === value)
  })

  // secure the dom so multiple autocompletes don't clash
  const $input = me.$('input[type="text"]')
  const $hidden = me.$('input[type="hidden"]')
  const $container = me.$('.dropdown')
  const $suggestions = me.$('.dropdown-menu')

  // prepare for arrow navigation
  let currIndex = -1
  let totalItems = 0
  let showing = false

  const clearDropdown = function (e, haltEvents = false) {
    if (showing === true) {
      // hide the menu and reset the params
      $suggestions.empty().removeClass('show')
      $container.removeClass('show')
      currIndex = -1
      totalItems = 0
      showing = false
      if (haltEvents === true) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
  }

  // keydown catches escape
  $input.keydown((e) => {
    // prevent form submit from "Enter/Return" if showing
    if (
      /Enter|Tab/.test(e.originalEvent.key) === true &&
      showing === true
    ) {
      e.preventDefault()
      e.stopPropagation()
    }
    // allow Escape to close the dropdown
    else if (
      /Escape/.test(e.originalEvent.key) === true &&
      showing === true
    ) {
      clearDropdown(e, true)
    }
  })

  /**
   * Ensure reactivity when changing the hidden value to a valid option or a
   * falsy value (= deleting the value / clearing the field)
   */
  const updateValue = value => {
    $hidden.val(value)

    if (!value || isOption(value)) {
      $hidden.trigger('change')
    }
  }

  const callback = function (e) {
    // only populate when typing characters or deleting
    // otherwise, we are navigating
    if (/ArrowDown|ArrowUp|ArrowLeft|ArrowRight|Enter|Escape|Tab/.test(e.originalEvent.key) === false) {
      // we're typing
      // ensure hidden and visible values match for validation
      updateValue($input.val())
      // filter results from visible input value
      const result = items.get().filter((i) => {
        const reg = new RegExp(e.target.value, 'gi')
        return reg.test(i.label)
      })

      // display results in 'suggestions' div
      $suggestions.empty()
      let html
      const len = result.length
      totalItems = result.length

      if (len > 1) {
        currIndex = -1
        for (let i = 0; i < len; i++) {
          // populate suggestions
          html = `<div class="dropdown-item" data-suggestion="1" data-index="${i}" data-value="${result[i].value}" data-label="${result[i].label}">${result[i].label}</div>`
          $suggestions.append(html)
        }
        $suggestions.addClass('show')
        $container.addClass('show')
        showing = true

        // clear any manual navigated selections on hover
        $suggestions.children().hover((e) => {
          $suggestions.children().removeClass('active')
          const $target = me.$(e.target)
          $target.addClass('active')
          currIndex = Number.parseInt($target.data('index'), 10)

          // make sure showing remains true
          showing = true
        })

        // prevent blur when clicking on a suggestion!
        $suggestions.children().on('mousedown', e => {
          e.preventDefault()
          e.stopPropagation()
        })

        // choose an answer on click
        $suggestions.children().on('click', (e) => {
          const dataValue = me.$(e.target).attr('data-value')
          const dataLabel = me.$(e.target).attr('data-label')
          $input.val(dataLabel)
          updateValue(dataValue)
          clearDropdown(e, false)
          $input.focus()
        })
      }
      else if (e.originalEvent.key !== 'Backspace') {
        // only force populate if not deleting
        // bc we all make mistakes
        if (result.length === 1) {
          $input.val(result[0].label)
          updateValue(result[0].value)
          clearDropdown(e, false)
          $input.focus()
        }
        else {
          // no results, hide
          clearDropdown(e, false)
        }
      }
    }
    else if (showing === true) { // we're navigating suggestions
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
      else if (/Enter|Tab/.test(e.originalEvent.key) === true) {
        // we're selecting
        if (currIndex === -1) {
          currIndex = 0
        }
        const enterValue = $suggestions.children('div').eq(currIndex).attr('data-value')
        const enterLabel = $suggestions.children('div').eq(currIndex).attr('data-label')
        $input.val(enterLabel)
        updateValue(enterValue)
        clearDropdown(e, false)
        $input.focus()
      }
    }
  }

  // mousedown triggers before blur, so we can check if mousedown is connected
  // to a suggestion element and this prevent further bubbling to blur:
  // https://stackoverflow.com/a/12092486
  $input.on('mousedown', e => {
    if (me.$(e.currentTarget).data('suggestion')) {
      e.preventDefault()
      e.stopPropagation()
    }
  })

  $input.on('blur', e => {
    $hidden.trigger('blur') // triggers re-validation
    clearDropdown(e, false)
  })

  // detect keystrokes
  $input.on('keyup', e => {
    callback(e)
  })

  // show on double click
  $input.on('dblclick', (e) => {
    callback(e)
  })

  // show on double click
  $input.on('touchstart', (e) => {
    $hidden.trigger('touchstart')
    callback(e)
  })
})

Template.afAutocomplete.onDestroyed(function () {
  const instance = this
  const $input = instance.$('input[type="text"]')
  $input.off()

  const $hidden = instance.$('input[type="hidden"]')
  $hidden.off()

  const $container = instance.$('.dropdown')
  $container.off()

  const $suggestions = instance.$('.dropdown-menu')
  $suggestions.off()
})
