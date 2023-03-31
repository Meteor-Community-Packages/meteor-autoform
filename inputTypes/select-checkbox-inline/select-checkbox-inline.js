/* global $ */
import { Template } from 'meteor/templating'

AutoForm.addInputType('select-checkbox-inline', {
  template: 'afCheckboxGroupInline',
  valueIsArray: true,
  valueOut: function () {
    const val = []
    this.find('input[type=checkbox]').each(function () {
      if ($(this).is(':checked')) {
        val.push($(this).val())
      }
    })
    return val
  },
  contextAdjust: function (context) {
    const itemAtts = { ...context.atts }

    // build items list
    context.items = []

    // Add all defined options
    context.selectOptions.forEach(function (opt) {
      context.items.push({
        name: context.name,
        label: opt.label,
        value: opt.value,
        // _id must be included because it is a special property that
        // #each uses to track unique list items when adding and removing them
        // See https://github.com/meteor/meteor/issues/2174
        _id: opt.value,
        selected: (context.value.includes(opt.value)),
        atts: itemAtts
      })
    })

    return context
  }
})

Template.afCheckboxGroupInline.helpers({
  atts: function selectedAttsAdjust () {
    const atts = { ...this.atts }
    if (this.selected) {
      atts.checked = ''
    }
    // remove data-schema-key attribute because we put it
    // on the entire group
    delete atts['data-schema-key']
    return atts
  },
  dsk: function dsk () {
    return {
      'data-schema-key': this.atts['data-schema-key']
    }
  }
})
