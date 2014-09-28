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
				return new Date(val);
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