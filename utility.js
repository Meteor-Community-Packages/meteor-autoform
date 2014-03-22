Utility = {
  /**
   * @method Utility.cleanNulls
   * @private
   * @param {Object} doc - Source object
   * @returns {Object}
   *
   * Returns an object in which all properties with null, undefined, or empty
   * string values have been removed, recursively.
   */
  cleanNulls: function cleanNulls(doc) {
    var newDoc = {};
    _.each(doc, function(val, key) {
      if (!_.isArray(val) && !(val instanceof Date) && _.isObject(val)) {
        val = cleanNulls(val); //recurse into objects
        if (!_.isEmpty(val)) {
          newDoc[key] = val;
        }
      } else if (val !== void 0 && val !== null && !(typeof val === "string" && val.length === 0)) {
        newDoc[key] = val;
      }
    });
    return newDoc;
  },
  /**
   * @method Utility.reportNulls
   * @private
   * @param {Object} flatDoc - An object with no properties that are also objects.
   * @returns {Object} An object in which the keys represent the keys in the
   * original object that were null, undefined, or empty strings, and the value
   * of each key is "".
   */
  reportNulls: function reportNulls(flatDoc) {
    var nulls = {};
    _.each(flatDoc, function(val, key) {
      if (val === void 0 || val === null || (typeof val === "string" && val.length === 0)) {
        nulls[key] = "";
      }
    });
    return nulls;
  },
  /**
   * @method Utility.docToModifier
   * @private
   * @param {Object} doc - An object to be converted into a MongoDB modifier
   * @returns {Object} A MongoDB modifier.
   *
   * Converts an object into a modifier by flattening it, putting keys with
   * null, undefined, and empty string values into `modifier.$unset`, and
   * putting the rest of the keys into `modifier.$set`.
   */
  docToModifier: function docToModifier(doc) {
    var modifier = {};

    // Flatten doc
    var mDoc = new MongoObject(doc);
    var flatDoc = mDoc.getFlatObject();
    mDoc = null;
    // Get a list of null, undefined, and empty string values so we can unset them instead
    var nulls = Utility.reportNulls(flatDoc);
    flatDoc = Utility.cleanNulls(flatDoc);

    // For arrays, we need the $set value as an array
    // rather than as separate array values, so we'll do
    // that adjustment here.
    //
    // For example, if we have "numbers.0" = 1 and "numbers.1" = 2,
    // we will create "numbers" = [1,2]
    //
    // This means that we cannot have a field
    // that updates just one item in an array without overwriting
    // the whole array, but there is no good way around that for
    // now because we can't ensure that there is an existing array
    // and therefore MongoDB might end up creating an object ({"0": value})
    // instead of an array. If we could use non-id selectors on the
    // client, then we could set the array to [] if it is null, ensuring
    // that MongoDB would know it's supposed to be an array.
    _.each(flatDoc, function(flatVal, flatKey) {
      var lastDot = flatKey.lastIndexOf(".");
      var beginning = flatKey.slice(0, lastDot);
      var end = flatKey.slice(lastDot + 1);
      var intEnd = parseInt(end, 10);
      if (!isNaN(intEnd)) {
        flatDoc[beginning] = flatDoc[beginning] || [];
        flatDoc[beginning][intEnd] = flatVal;
        delete flatDoc[flatKey];
      }
    });

    if (!_.isEmpty(flatDoc)) {
      modifier.$set = flatDoc;
    }
    if (!_.isEmpty(nulls)) {
      modifier.$unset = nulls;
    }
    return modifier;
  },
  /**
   * @method Utility.getSelectValues
   * @private
   * @param {Element} select - DOM Element from which to get current values
   * @returns {string[]}
   *
   * Gets a string array of all the selected values in a given `select` DOM element.
   */
  getSelectValues: function getSelectValues(select) {
    var result = [];
    var options = select && select.options;
    var opt;

    for (var i = 0, ln = options.length; i < ln; i++) {
      opt = options[i];

      if (opt.selected) {
        result.push(opt.value || opt.text);
      }
    }
    return result;
  },
  /**
   * @method Utility.maybeNum
   * @private
   * @param {string} val
   * @returns {String|Number}
   *
   * If the given string can be converted to a number, returns the number.
   * Otherwise returns the string.
   */
  maybeNum: function maybeNum(val) {
    // Convert val to a number if possible; otherwise, just use the value
    var floatVal = parseFloat(val);
    if (!isNaN(floatVal)) {
      return floatVal;
    } else {
      return val;
    }
  },
  /**
   * @method Utility.lookup
   * @private
   * @param {Any} obj
   * @returns {Any}
   *
   * If `obj` is a string, returns the value of the property with that
   * name on the `window` object. Otherwise returns `obj`.
   */
  lookup: function lookup(obj) {
    if (typeof obj === "string") {
      if (!window || !window[obj]) {
        throw new Error(obj + " is not in the window scope");
      }
      return window[obj];
    }
    return obj;
  },
  /**
   * @method Utility.getDefs
   * @private
   * @param {SimpleSchema} ss
   * @param {String} name
   * @return {Object} Schema definitions object
   *
   * Returns the schema definitions object from a SimpleSchema instance. Equivalent to calling
   * `ss.schema(name)` but handles throwing errors if `name` is not a string or is not a valid
   * field name for this SimpleSchema instance.
   */
  getDefs: function getDefs(ss, name) {
    if (typeof name !== "string") {
      throw new Error("Invalid field name: (not a string)");
    }

    var defs = ss.schema(name);
    if (!defs)
      throw new Error("Invalid field name: " + name);
    return defs;
  },
  /**
   * @method Utility.objAffectsKey
   * @private
   * @param  {Object} obj
   * @param  {String} key
   * @return {Boolean}
   * @todo should make this a static method in MongoObject
   */
  objAffectsKey: function objAffectsKey(obj, key) {
    var mDoc = new MongoObject(obj);
    return mDoc.affectsKey(key);
  },
  /**
   * @method Utility.expandObj
   * @private
   * @param  {Object} doc
   * @return {Object}
   *
   * Takes a flat object and returns an expanded version of it.
   */
  expandObj: function expandObj(doc) {
    var newDoc = {}, subkeys, subkey, subkeylen, nextPiece, current;
    _.each(doc, function(val, key) {
      subkeys = key.split(".");
      subkeylen = subkeys.length;
      current = newDoc;
      for (var i = 0; i < subkeylen; i++) {
        subkey = subkeys[i];
        if (typeof current[subkey] !== "undefined" && !_.isObject(current[subkey])) {
          break; //already set for some reason; leave it alone
        }
        if (i === subkeylen - 1) {
          //last iteration; time to set the value
          current[subkey] = val;
        } else {
          //see if the next piece is a number
          nextPiece = subkeys[i + 1];
          nextPiece = parseInt(nextPiece, 10);
          if (isNaN(nextPiece) && !_.isObject(current[subkey])) {
            current[subkey] = {};
          } else if (!isNaN(nextPiece) && !_.isArray(current[subkey])) {
            current[subkey] = [];
          }
        }
        current = current[subkey];
      }
    });
    return newDoc;
  },
  /**
   * @method Utility.isValidDateString
   * @private
   * @param  {String}  dateString
   * @return {Boolean}
   *
   * Returns `true` if dateString is a "valid date string"
   */
  isValidDateString: function isValidDateString(dateString) {
    var m = moment(dateString, 'YYYY-MM-DD', true);
    return m && m.isValid();
  },
  /**
   * @method Utility.isValidTimeString
   * @private
   * @param  {String}  timeString
   * @return {Boolean}
   *
   * Returns `true` if timeString is a "valid time string"
   */
  isValidTimeString: function isValidTimeString(timeString) {
    if (typeof timeString !== "string")
      return false;

    //this reg ex actually allows a few invalid hours/minutes/seconds, but
    //we can catch that when parsing
    var regEx = /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9](\.[0-9]{1,3})?)?$/;
    return regEx.test(timeString);
  },
  /**
   * @method  Utility.dateToDateString
   * @private
   * @param  {Date} date
   * @return {String}
   *
   * Returns a "valid date string" representing the local date.
   */
  dateToDateString: function dateToDateString(date) {
    var m = (date.getMonth() + 1);
    if (m < 10) {
      m = "0" + m;
    }
    var d = date.getDate();
    if (d < 10) {
      d = "0" + d;
    }
    return date.getFullYear() + '-' + m + '-' + d;
  },
  /**
   * @method  Utility.dateToDateStringUTC
   * @private
   * @param  {Date} date
   * @return {String}
   *
   * Returns a "valid date string" representing the date converted to the UTC time zone.
   */
  dateToDateStringUTC: function dateToDateStringUTC(date) {
    var m = (date.getUTCMonth() + 1);
    if (m < 10) {
      m = "0" + m;
    }
    var d = date.getUTCDate();
    if (d < 10) {
      d = "0" + d;
    }
    return date.getUTCFullYear() + '-' + m + '-' + d;
  },
  /**
   * @method  Utility.dateToNormalizedForcedUtcGlobalDateAndTimeString
   * @private
   * @param  {Date} date
   * @return {String}
   *
   * Returns a "valid normalized forced-UTC global date and time string" representing the time
   * converted to the UTC time zone and expressed as the shortest possible string for the given
   * time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute).
   *
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#date-and-time-state-(type=datetime)
   * http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-normalized-forced-utc-global-date-and-time-string
   */
  dateToNormalizedForcedUtcGlobalDateAndTimeString: function dateToNormalizedForcedUtcGlobalDateAndTimeString(date) {
    return moment(date).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
  },
  /**
   * @method  Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString
   * @private
   * @param  {String} dateString
   * @return {Boolean}
   *
   * Returns true if dateString is a "valid normalized forced-UTC global date and time string"
   */
  isValidNormalizedForcedUtcGlobalDateAndTimeString: function isValidNormalizedForcedUtcGlobalDateAndTimeString(dateString) {
    if (typeof dateString !== "string")
      return false;

    var datePart = dateString.substring(0, 10);
    var tPart = dateString.substring(10, 11);
    var timePart = dateString.substring(11, dateString.length - 1);
    var zPart = dateString.substring(dateString.length - 1);
    return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart) && zPart === "Z";
  },
  /**
   * @method Utility.dateToNormalizedLocalDateAndTimeString
   * @private
   * @param {Date} date
   * @param {String} offset A valid offset string (to pass to moment.zone)
   * @return {String}
   *
   * Returns a "valid normalized local date and time string".
   */
  dateToNormalizedLocalDateAndTimeString: function dateToNormalizedLocalDateAndTimeString(date, offset) {
    var m = moment(date);
    m.zone(offset);
    return m.format("YYYY-MM-DD[T]hh:mm:ss.SSS");
  },
  /**
   * @method  Utility.isValidNormalizedLocalDateAndTimeString
   * @private
   * @param  {String} dtString
   * @return {Boolean}
   *
   * Returns true if dtString is a "valid normalized local date and time string"
   */
  isValidNormalizedLocalDateAndTimeString: function isValidNormalizedLocalDateAndTimeString(dtString) {
    if (typeof dtString !== "string")
      return false;

    var datePart = dtString.substring(0, 10);
    var tPart = dtString.substring(10, 11);
    var timePart = dtString.substring(11, dtString.length);
    return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart);
  },
  /**
   * @method Utility.normalizeContext
   * @private
   * @param  {Object} context A context object, potentially with an `atts` or `autoform` property.
   * @param {String} name The name of the helper or component we're calling from, for in a potential error message.
   * @return {Object} Normalized context object
   *
   * Returns an object with `afc`, `af`, and `atts` properties, normalized from whatever object is passed in.
   * This helps deal with the fact that we have to pass the ancestor autoform's context to different
   * helpers and components in different ways, but in all cases we want to get access to it and throw
   * an error if we can't find an autoform context.
   */
  normalizeContext: function autoFormNormalizeContext(context, name) {
    context = context || {};
    var atts = context.atts || context;
    var afContext = atts.autoform || context.autoform;
    if (!afContext || !afContext._af) {
      throw new Error(name + " must be used within an autoForm block");
    }

    return {
      afc: afContext,
      af: afContext._af,
      atts: atts
    };
  }
};
