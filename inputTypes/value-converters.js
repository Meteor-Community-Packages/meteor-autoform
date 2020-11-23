import { Utility } from '../utility'

const isDate = d => Object.prototype.toString.call(d) === '[object Date]'
const toTrimmedString = s => s.trim()

/**
 * The conversion functions in this file can be used by input types to convert
 * heir outgoing values into the data type expected by the schema.
 */
AutoForm.valueConverters = {

  /**
   * Converts a boolean to a string
   * @param val
   * @return {String} a String value representing a boolean value
   */
  booleanToString: function booleanToString(val) {
    if (val === true) {
      return "TRUE";
    }
    if (val === false) {
      return "FALSE";
    }
    return val;
  },
  booleanToStringArray: function booleanToStringArray(val) {
    if (val === true) {
      return ["TRUE"];
    }
    if (val === false) {
      return ["FALSE"];
    }
    return val;
  },
  booleanToNumber: function booleanToNumber(val) {
    if (val === true) {
      return 1;
    }
    if (val === false) {
      return 0;
    }
    return val;
  },
  booleanToNumberArray: function booleanToNumberArray(val) {
    if (val === true) {
      return [1];
    }
    if (val === false) {
      return [0];
    }
    return val;
  },
  /**
   * @method  AutoForm.valueConverters.dateToDateString
   * @private
   * @param  {Date} val
   * @return {String}
   *
   * Returns a "valid date string" representing the local date in format
   * YYYY-MM-DD
   */
  dateToDateString: function dateToDateString(val) {
    if (!isDate(val)) return val

    const fyr = (val.getFullYear()).toString().padStart(4, '0')
    const mon = (val.getMonth() + 1).toString().padStart(2, '0')
    const day = (val.getDate()).toString().padStart(2, '0')

    return `${fyr}-${mon}-${day}`
  },
  /**
   * @method  AutoForm.valueConverters.dateToDateStringUTC
   * @private
   * @param  {Date} val
   * @return {String}
   *
   * Returns a "valid date string" representing the date converted to the UTC time zone.
   */
  dateToDateStringUTC: function dateToDateStringUTC(val) {
    if (!isDate(val)) return val

    const fyr = (val.getUTCFullYear()).toString().padStart(4, '0')
    const mon = (val.getUTCMonth() + 1).toString().padStart(2, '0')
    const day = (val.getUTCDate()).toString().padStart(2, '0')

    return `${fyr}-${mon}-${day}`
  },
  /**
   *
   * @param val
   * @return {*}
   */
  dateToDateStringUTCArray: function dateToDateStringUTCArray(val) {
    if (!isDate(val)) return val

    return [AutoForm.valueConverters.dateToDateStringUTC(val)];
  },
  /**
   * @method  AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString
   * @private
   * @param  {Date} val
   * @return {String}
   *
   * Returns a "valid normalized forced-UTC global date and time string" representing the time
   * converted to the UTC time zone and expressed as the shortest possible string for the given
   * time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute).
   *
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#date-and-time-state-(type=datetime)
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-normalized-forced-utc-global-date-and-time-string
   */
  dateToNormalizedForcedUtcGlobalDateAndTimeString: function dateToNormalizedForcedUtcGlobalDateAndTimeString(val) {
    if (!isDate(val)) return val

    return val.toISOString()
  },
  dateToNormalizedForcedUtcGlobalDateAndTimeStringArray: function dateToNormalizedForcedUtcGlobalDateAndTimeStringArray(val) {
    if (!isDate(val)) return val

    return [AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString(val)];
  },
  /**
   * @method AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString
   * @private
   * @param {Date} date The Date object
   * @param {String} [timezoneId] A valid timezoneId that moment-timezone understands, e.g., "America/Los_Angeles"
   * @return {String}
   *
   * Returns a "valid normalized local date and time string".
   */
  dateToNormalizedLocalDateAndTimeString: function dateToNormalizedLocalDateAndTimeString(date, timezoneId) {
    if (!isDate(date)) return date

    const m = moment(date);
    // by default, we assume local timezone; add moment-timezone to app and pass timezoneId
    // to use a different timezone
    if (typeof timezoneId === "string") {
      if (typeof m.tz !== "function") {
        throw new Error("If you specify a timezoneId, make sure that you've added a moment-timezone package to your app");
      }
      m.tz(timezoneId);
    }
    return m.format("YYYY-MM-DD[T]HH:mm:ss.SSS");
  },
  /**
   * Returns the timestamp number of a date
   * @param {Date} val
   * @return {number} the unix timestamp of the date
   */
  dateToNumber: function dateToNumber(val) {
    return isDate(val)
      ? val.getTime()
      : val;
  },
  dateToNumberArray: function dateToNumberArray(val) {
    return isDate(val)
      ? [val.getTime()]
      : val;
  },
  dateToDateArray: function dateToDateArray(val) {
    return isDate(val)
      ? [val]
      : val;
  },
  /**
   * Returns an array of (trimmed) strings from a comma-separated string.
   * @example 'hello, world' => ['hello', 'world']
   * @param {string] val
   * @return {[String]}
   */
  stringToStringArray: function stringToStringArray(val) {
    if (typeof val === "string") {
      return val.split(",").map(toTrimmedString)
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.stringToNumber
   * @public
   * @param {String} val A string or null or undefined.
   * @return {Number|String} The string converted to a Number or the original value.
   *
   * For strings, returns Number(val) unless the result is NaN. Otherwise returns val.
   */
  stringToNumber: function stringToNumber(val) {
    if (typeof val === "string" && val.length > 0) {
      const numVal = Number(val);
      if (!isNaN(numVal)) {
        return numVal;
      }
    }
    return val;
  },
  stringToNumberArray: function stringToNumberArray(val) {
    if (typeof val === "string") {
      return val.split(",").map(item => AutoForm.valueConverters.stringToNumber(item.trim()))
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.stringToBoolean
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Boolean|String} The string converted to a Boolean.
   *
   * If the string is "true" or "1", returns `true`. If the string is "false" or "0", returns `false`. Otherwise returns the original string.
   */
  stringToBoolean: function stringToBoolean(val) {
    if (typeof val === "string" && val.length > 0) {
      const lowerCaseVal = val.toLowerCase();
      if (lowerCaseVal === "true" || lowerCaseVal === "1") {
        return true;
      }
      if (lowerCaseVal === "false" || lowerCaseVal === "0") {
        return false;
      }
    }
    return val;
  },
  stringToBooleanArray: function stringToBooleanArray(val) {
    if (typeof val === "string") {
      return val.split(",").map(item => AutoForm.valueConverters.stringToBoolean(item.trim()))
    }
    return val;
  },
  /**
   * @method AutoForm.valueConverters.stringToDate
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Date|String} The string converted to a Date instance.
   *
   * Returns new Date(val) as long as val is a string with at least one character.
   * If the resulting date is an 'Invalid Date' the original string is returned.
   * Otherwise returns the original string.
   */
  stringToDate: function stringToDate(val) {
    if (typeof val === "string" && val.length > 0) {
      let d = undefined

      // try number-strings first
      const num = Number(val)
      d = !Number.isNaN(num) && new Date(num)

      if (d && d.toString() !== 'Invalid Date') {
        return d
      }

      // fallback to direct value input
      d = new Date(val);

      if (d.toString() !== 'Invalid Date') {
        return d
      }
    }
    return val;
  },
  stringToDateArray: function stringToDateArray(val) {
    if (typeof val === "string") {
      return val.split(",").map(item => AutoForm.valueConverters.stringToDate(item.trim()));
    }
    return val;
  },
  numberToString: function numberToString(val) {
    if (typeof val === "number") {
      return val.toString();
    }
    return val;
  },
  numberToStringArray: function numberToStringArray(val) {
    if (typeof val === "number") {
      return [val.toString()];
    }
    return val;
  },
  numberToNumberArray: function numberToNumberArray(val) {
    if (typeof val === "number") {
      return [val];
    }
    return val;
  },
  numberToBoolean: function numberToBoolean(val) {
    if (val === 0) {
      return false;
    }
    if (val === 1) {
      return true;
    }
    return val;
  },
  numberToBooleanArray: function numberToBooleanArray(val) {
    if (val === 0) {
      return [false];
    }
    if (val === 1) {
      return [true];
    }
    return val;
  }
};

// BACKWARDS COMPATIBILITY - some of these were formerly on the Utility object
Utility.dateToDateString = AutoForm.valueConverters.dateToDateString;
Utility.dateToDateStringUTC = AutoForm.valueConverters.dateToDateStringUTC;
Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString = AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString;
Utility.dateToNormalizedLocalDateAndTimeString = AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString;
Utility.stringToBool = AutoForm.valueConverters.stringToBoolean;
Utility.stringToNumber = AutoForm.valueConverters.stringToNumber;
Utility.stringToDate = AutoForm.valueConverters.stringToDate;
