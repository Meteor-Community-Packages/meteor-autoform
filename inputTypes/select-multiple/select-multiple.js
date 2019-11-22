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
        const { label, value, ...htmlAtts } = subOpt
        var subItems = opt.options.map(function (subOpt) {
          return {
            name: context.name,
            label,
            value,
            htmlAtts,
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
        const { label, value, ...htmlAtts } = opt
        return {
          name: context.name,
          label,
          value,
          htmlAtts,
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
