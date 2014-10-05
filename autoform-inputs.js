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
	// Does the schema/form expect the value of the field to be an array?
	var expectsArray = AutoForm.expectsArray(atts);

	// What is the `type` in the schema definition?
	var defs = AutoForm.getSchemaForField(atts.name);
  var schemaType = defs.type;
  if (schemaType === Array) {
    schemaType = AutoForm.find().ss.schema(atts.name + ".$");
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
      if (expectsArray) {
        type = "select-checkbox";
      } else {
        type = "select-radio";
      }
    } else {
      type = "select";
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