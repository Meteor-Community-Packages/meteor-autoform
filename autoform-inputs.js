// Default Handlers
defaultInputValueHandlers = {
	'select.autoform-boolean': function () {
		var val = this.val();
		if (val === "true") {
			return true;
		} else if (val === "false") {
			return false;
		} 
	},
	'select[multiple]': function () {
		return Utility.getSelectValues(this[0]);
	},
	'select': function () {
		return this.val();
	},
	'input.autoform-boolean[type=checkbox]': function () {
		// boolean checkbox
		return this.is(":checked");
	},
	'input.autoform-array-item[type=checkbox]': function () {
		// array checkbox
		if (this.is(":checked")) {
			return this.val();
		}
	},
	'input.autoform-boolean[type=radio]': function () {
		//boolean radio
		var val = this.val();
		if (this.is(":checked")) {
			if (val === "true") {
	        	return true;
	        } else if (val === "false") {
	         	return false;
	        }
		}
	},
	'input[type=radio]': function () {
		if (this.is(":checked")) {
			return this.val();
		}
	},
	'input.autoform-boolean[type=hidden]': function () {
		// type overridden to hidden, but schema expects boolean
		var val = this.val();
		if (val === "true") {
			return true;
		} else if (val === "false") {
			return false;
		}
	},
	'[type=select]': function () {
		return Utility.maybeNum(this.val());
	},
	'input[type=date]': function () {
		var val = this.val();
		if (Utility.isValidDateString(val)) {
			//Date constructor will interpret val as UTC and create
			//date at mignight in the morning of val date in UTC time zone
			return new Date(val);
		} else {
			return null;
		}
	},
	'input[type=datetime]': function () {
		var val = this.val();
		val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
		if (Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
			//Date constructor will interpret val as UTC due to ending "Z"
			return new Date(val);
		} else {
			return null;
		}
	},
	'input[type=datetime-local]': function () {
		var val = this.val();
		val = (typeof val === "string") ? val.replace(/ /g, "T") : val;
		if (Utility.isValidNormalizedLocalDateAndTimeString(val)) {
			var timezoneId = this.attr("data-timezone-id");
			// default is local, but if there's a timezoneId, we use that
			if (typeof timezoneId === "string") {
				if (typeof moment.tz !== "function") {
	        throw new Error("If you specify a timezoneId, make sure that you've added a moment-timezone package to your app");
	      }
	      return moment.tz(val, timezoneId).toDate();
			} else {
				return moment(val).toDate();
			}
		} else {
			return null;
		}
	},
	'[contenteditable]': function () {
		return this.html();
	},
	'[data-null-value]': function () {
		return null;
	},
	'[data-schema-key]': function () {
		// fallback
		return this.val();
	}
};

// Maps a `type=<typeString>` to the component type that should be used to render it
inputTypeDefinitions = {
  "select": {
    componentName:"afSelect",
    contextAdjust: function (context) {
      //can fix issues with some browsers selecting the firstOption instead of the selected option
      context.atts.autocomplete = "off";

      // build items list
      context.items = [];

      // If a firstOption was provided, add that to the items list first
      if (context.firstOption) {
        context.items.push({
          name: context.name,
          label: context.firstOption,
          value: "",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "",
          selected: false,
          atts: context.atts
        });
      }

      // Add all defined options
      _.each(context.selectOptions, function(opt) {
        context.items.push({
          name: context.name,
          label: opt.label,
          value: opt.value,
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: opt.value,
          selected: (opt.value.toString() === context.value.toString()),
          atts: context.atts
        });
      });

      return context;
    }
  },
  "select-multiple": {
    componentName:"afSelectMultiple",
    valueIsArray: true,
    contextAdjust: function (context) {
      // build items list
      context.items = _.map(context.selectOptions, function(opt) {
        return {
          name: context.name,
          label: opt.label,
          value: opt.value,
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: opt.value,
          selected: _.contains(context.value, opt.value.toString()),
          atts: context.atts
        };
      });

      return context;
    }
  },
  "select-checkbox": {
    componentName:"afCheckboxGroup",
    valueIsArray: true,
    contextAdjust: function (context) {
      // add the "autoform-array-item" class
      context.atts["class"] = (context.atts["class"] || "") + " autoform-array-item";
      return context;
    }
  },
  "select-radio": {
    componentName:"afRadioGroup"
  },
  "textarea": {
    componentName:"afTextarea",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "contenteditable": {
    componentName:"afContenteditable",
    contextAdjust: function (context) {
      if (typeof context.atts['data-maxlength'] === "undefined" && typeof context.max === "number") {
        context.atts['data-maxlength'] = context.max;
      }
      return context;
    }
  },
  "boolean-radios": {
    componentName:"afRadioGroup",
    valueIn: function (val) {
      // switch to a boolean
      return (val === "true") ? true : false;
    },
    contextAdjust: function (context) {
      // add autoform-boolean class, which we use when building object
      // from form values later
      context.atts["class"] = (context.atts["class"] || "") + " autoform-boolean";

      // build items list
      context.items = [
        {
          name: context.name,
          value: "false",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "false",
          selected: !context.value,
          label: context.falseLabel,
          atts: context.atts
        },
        {
          name: context.name,
          value: "true",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "true",
          selected: context.value,
          label: context.trueLabel,
          atts: context.atts
        }
      ];

      return context;
    }
  },
  "boolean-select": {
    componentName:"afSelect",
    valueIn: function (val) {
      // switch to a boolean
      return (val === "true") ? true : false;
    },
    contextAdjust: function (context) {
      // add autoform-boolean class, which we use when building object
      // from form values later
      context.atts["class"] = (context.atts["class"] || "") + " autoform-boolean";

      // build items list
      context.items = [
        {
          name: context.name,
          value: "false",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "false",
          selected: !context.value,
          label: context.falseLabel,
          atts: context.atts
        },
        {
          name: context.name,
          value: "true",
          // _id must be included because it is a special property that
          // #each uses to track unique list items when adding and removing them
          // See https://github.com/meteor/meteor/issues/2174
          _id: "true",
          selected: context.value,
          label: context.trueLabel,
          atts: context.atts
        }
      ];

      return context;
    }
  },
  "boolean-checkbox": {
    componentName:"afCheckbox",
    valueIn: function (val) {
      // switch to a boolean
      return (val === "true") ? true : false;
    },
    contextAdjust: function (context) {
      // add autoform-boolean class, which we use when building object
      // from form values later
      context.atts["class"] = (context.atts["class"] || "") + " autoform-boolean";

      //don't add required attribute to checkboxes because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
      delete context.atts.required;
      
      context.selected = context.value;
      context.value = "true";

      return context;
    }
  },
  "text": {
    componentName: "afInputText",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "password": {
    componentName: "afInputPassword",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "button": {
    componentName: "afInputButton"
  },
  "submit": {
    componentName: "afInputSubmit"
  },
  "reset": {
    componentName: "afInputReset"
  },
  "file": {
    componentName: "afInputFile"
  },
  "hidden": {
    componentName: "afInputHidden",
    contextAdjust: function (context) {
      if (context.schemaType === Boolean) {
        // add autoform-boolean class, which we use when building object
        // from form values later
        context.atts["class"] = (context.atts["class"] || "") + " autoform-boolean";
      }
      return context;
    }
  },
  "image": {
    componentName: "afInputImage"
  },
  "month": {
    componentName: "afInputMonth"
  },
  "time": {
    componentName: "afInputTime"
  },
  "week": {
    componentName: "afInputWeek"
  },
  "number": {
    componentName: "afInputNumber",
    contextAdjust: function (context) {
      if (typeof context.atts.max === "undefined" && typeof context.max === "number") {
        context.atts.max = context.max;
      }
      if (typeof context.atts.min === "undefined" && typeof context.min === "number") {
        context.atts.min = context.min;
      }
      if (typeof context.atts.step === "undefined" && context.decimal) {
        context.atts.step = '0.01';
      }
      return context;
    }
  },
  "email": {
    componentName: "afInputEmail",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "url": {
    componentName: "afInputUrl",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "search": {
    componentName: "afInputSearch",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "tel": {
    componentName: "afInputTel",
    contextAdjust: function (context) {
      if (typeof context.atts.maxlength === "undefined" && typeof context.max === "number") {
        context.atts.maxlength = context.max;
      }
      return context;
    }
  },
  "color": {
    componentName: "afInputColor"
  },
  "date": {
    componentName: "afInputDate",
    valueIn: function (val) {
      //convert Date to string value
      return (val instanceof Date) ? Utility.dateToDateStringUTC(val) : val;
    },
    contextAdjust: function (context) {
      if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
        context.atts.max = Utility.dateToDateStringUTC(context.max);
      }
      if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
        context.atts.min = Utility.dateToDateStringUTC(context.min);
      }
      return context;
    }
  },
  "datetime": {
    componentName: "afInputDateTime",
    valueIn: function (val) {
      //convert Date to string value
      return (val instanceof Date) ? Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(val): val;
    },
    contextAdjust: function (context) {
      if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
        context.atts.max = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.max);
      }
      if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
        context.atts.min = Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString(context.min);
      }
      return context;
    }
  },
  "datetime-local": {
    componentName: "afInputDateTimeLocal",
    valueIn: function (val, atts) {
      //convert Date to string value
      return (val instanceof Date) ? Utility.dateToNormalizedLocalDateAndTimeString(val, atts.timezoneId) : val;
    },
    contextAdjust: function (context) {
      if (typeof context.atts.max === "undefined" && context.max instanceof Date) {
        context.atts.max = Utility.dateToNormalizedLocalDateAndTimeString(context.max, context.atts.timezoneId);
      }
      if (typeof context.atts.min === "undefined" && context.min instanceof Date) {
        context.atts.min = Utility.dateToNormalizedLocalDateAndTimeString(context.min, context.atts.timezoneId);
      }
      if (context.atts.timezoneId) {
        context.atts["data-timezone-id"] = context.atts.timezoneId;
      }
      delete context.atts.timezoneId;
      return context;
    }
  }
};

// must be used in a template helper
expectsArray = function expectsArray(inputAtts) {
	// If the user overrides the type to anything,
  // then we won't be using a select box and
  // we won't be expecting an array for the current value.
  // This logic should probably be more robust. The idea is that
  // the user should be able to specify any type of control to use
  // to override the default logic, and then she can use either a custom input
  // handler or formToDoc hook to change the value into the expected array.
	return (AutoForm.getSchemaForField(inputAtts.name).type === Array && !inputAtts.type);
};

// Determines based on different options what type of input/control should be used
getInputType = function getInputType(atts) {
	var expectsArray = false, defs, schemaType;

	// Get schema definition, using the item definition for array fields
	defs = AutoForm.getSchemaForField(atts.name);
  schemaType = defs.type;
  if (schemaType === Array) {
    expectsArray = true;
    defs = AutoForm.getSchemaForField(atts.name + ".$");
    schemaType = defs.type;
  }

  // Based on the `type` attribute, the `type` from the schema, and/or
  // other characteristics such as regEx and whether an array is expected,
  // choose which type string to return.
  // TODO allow outside packages to extend/override this logic.
  var type = "text";
  if (atts.type) {
    type = atts.type;
  } else if (atts.options) {
    if (atts.noselect) {
      // Does the schema expect the value of the field to be an array?
      // If so, use a check box group, which will return an array value.
      if (expectsArray) {
        type = "select-checkbox";
      } else {
        type = "select-radio";
      }
    } else {
      if (expectsArray) {
        type = "select-multiple";
      } else {
        type = "select";
      }
    }
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Email) {
    type = "email";
  } else if (schemaType === String && defs.regEx === SimpleSchema.RegEx.Url) {
    type = "url";
  } else if (schemaType === String && atts.rows) {
    type = "textarea";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    if (atts.radio) {
      type = "boolean-radios";
    } else if (atts.select) {
      type = "boolean-select";
    } else {
      type = "boolean-checkbox";
    }
  }
  return type;
};

