AutoForm.addInputType("select-multiple", {
  template: "afSelectMultiple",
  valueIsArray: true,
  valueOut: function () {
    return AutoForm.Utility.getSelectValues(this[0]);
  },
  contextAdjust: function (context) {
    // build items list
    context.items = context.selectOptions.map(function (opt) {
      if (opt.optgroup) {
        var subItems = opt.options.map(function (subOpt) {
          return {
            name: context.name,
            label: subOpt.label,
            value: subOpt.value,
            htmlAtts: _.omit(subOpt, 'label', 'value'),
            // _id must be included because it is a special property that
            // #each uses to track unique list items when adding and removing them
            // See https://github.com/meteor/meteor/issues/2174
            _id: subOpt.value,
            selected: context.value.includes(subOpt.value),
            disabled: !!opt.disabled,
            atts: context.atts
          };
        });
        return {
          optgroup: opt.optgroup,
          items: subItems
        };
      } else {
        return {
          name: context.name,
          label: opt.label,
          value: opt.value,
          htmlAtts: _.omit(opt, 'label', 'value'),
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: opt.value,
          selected: context.value.includes(opt.value),
          disabled: !!opt.disabled,
          atts: context.atts
        };
      }
    });

    return context;
  }
});
