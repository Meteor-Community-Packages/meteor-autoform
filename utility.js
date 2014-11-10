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
  cleanNulls: function cleanNulls(doc, isArray, keepEmptyStrings) {
    var newDoc = isArray ? [] : {};
    _.each(doc, function(val, key) {
      if (!_.isArray(val) && isBasicObject(val)) {
        val = cleanNulls(val, false, keepEmptyStrings); //recurse into plain objects
        if (!_.isEmpty(val)) {
          newDoc[key] = val;
        }
      } else if (_.isArray(val)) {
        val = cleanNulls(val, true, keepEmptyStrings); //recurse into non-typed arrays
        if (!_.isEmpty(val)) {
          newDoc[key] = val;
        }
      } else if (!Utility.isNullUndefinedOrEmptyString(val)) {
        newDoc[key] = val;
      } else if (keepEmptyStrings && typeof val === "string" && val.length === 0) {
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
  reportNulls: function reportNulls(flatDoc, keepEmptyStrings) {
    var nulls = {};
    // Loop through the flat doc
    _.each(flatDoc, function(val, key) {
      // If value is undefined, null, or an empty string, report this as null so it will be unset
      if (val === null) {
        nulls[key] = "";
      } else if (val === void 0) {
        nulls[key] = "";
      } else if (!keepEmptyStrings && typeof val === "string" && val.length === 0) {
        nulls[key] = "";
      }
      // If value is an array in which all the values recursively are undefined, null, or an empty string, report this as null so it will be unset
      else if (_.isArray(val) && Utility.cleanNulls(val, true, keepEmptyStrings).length === 0) {
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
  docToModifier: function docToModifier(doc, keepEmptyStrings) {
    var modifier = {};

    // Flatten doc
    var mDoc = new MongoObject(doc);
    var flatDoc = mDoc.getFlatObject({keepArrays: true});
    mDoc = null;
    // Get a list of null, undefined, and empty string values so we can unset them instead
    var nulls = Utility.reportNulls(flatDoc, keepEmptyStrings);
    flatDoc = Utility.cleanNulls(flatDoc, false, keepEmptyStrings);

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
    var options = select && select.options || [];
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
   * @method Utility.lookup
   * @private
   * @param {Any} obj
   * @returns {Any}
   *
   * If `obj` is a string, returns the value of the property with that
   * name on the `window` object. Otherwise returns `obj`.
   */
  lookup: function lookup(obj) {
    var ref = window, arr;
    if (typeof obj === "string") {
      arr = obj.split(".");
      while(arr.length && (ref = ref[arr.shift()]));
      if (!ref) {
        throw new Error(obj + " is not in the window scope");
      }
      return ref;
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
   * @method Utility.compactArrays
   * @private
   * @param  {Object} obj
   * @return {undefined}
   *
   * Edits the object by reference, compacting any arrays at any level recursively.
   */
  compactArrays: function compactArrays(obj) {
    if (_.isObject(obj)) {
      _.each(obj, function (val, key) {
        if (_.isArray(val)) {
          obj[key] = _.without(val, void 0, null);
          _.each(obj[key], function (arrayItem) {
            compactArrays(arrayItem);
          });
        } else if (!(val instanceof Date) && _.isObject(val)) {
          //recurse into objects
          compactArrays(val);
        }
      });
    }
  },
  /**
   * @method Utility.bubbleEmpty
   * @private
   * @param  {Object} obj
   * @return {undefined}
   *
   * Edits the object by reference.
   */
  bubbleEmpty: function bubbleEmpty(obj, keepEmptyStrings) {
    if (_.isObject(obj)) {
      _.each(obj, function (val, key) {
        if (_.isArray(val)) {
          _.each(val, function (arrayItem) {
            bubbleEmpty(arrayItem);
          });
        } else if (isBasicObject(val)) {
          var allEmpty = _.all(val, function (prop) {
            return (prop === void 0 || prop === null || (!keepEmptyStrings && typeof prop === "string" && prop.length === 0));
          });
          if (_.isEmpty(val) || allEmpty) {
            obj[key] = null;
          } else {
            //recurse into objects
            bubbleEmpty(val);
          }
        }
      });
    }
  },
  /**
   * @method Utility.getSimpleSchemaFromContext
   * @private
   * @param  {Object} context
   * @return {SimpleSchema}
   *
   * Given a context object that may or may not have schema and collection properties,
   * returns a SimpleSchema instance or throws an error if one cannot be obtained.
   */
  getSimpleSchemaFromContext: function getSimpleSchemaFromContext(context, formId) {
    // If schema attribute, use that
    var ss = Utility.lookup(context.schema);
    if (ss) {
      if (ss instanceof SimpleSchema) {
        return ss;
      } else {
        throw new Error('AutoForm: schema attribute for form with id "' + formId + '" is not a SimpleSchema instance');
      }
    }
    // If no schema attribute, use the schema attached to the collection
    var collection = Utility.lookup(context.collection);
    if (collection) {
      if (typeof collection.simpleSchema === 'function') {
        return collection.simpleSchema();
      } else {
        throw new Error('AutoForm: collection attribute for form with id "' + formId + '" refers to a collection that does not have a schema, or is not a collection. You might have forgotten to attach a schema to the collection or you might need to add the collection2 package to your app.');
      }
    }
    // If we got this far, we have no schema so throw an error
    throw new Error('AutoForm: form with id "' + formId + '" needs either "schema" or "collection" attribute');
  },
  /**
   * @method Utility.isNullUndefinedOrEmptyString
   * @private
   * @param  {Any} val
   * @return {Boolean}
   *
   * Returns `true` if the value is null, undefined, or an empty string
   */
  isNullUndefinedOrEmptyString: function isNullUndefinedOrEmptyString(val) {
    return (val === void 0 || val === null || (typeof val === "string" && val.length === 0));
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
    return Utility.isValidDateString(datePart) && tPart === "T" && Utility.isValidTimeString(timePart) && zPart === "Z";
  },
  /**
   * @method Utility.dateToNormalizedLocalDateAndTimeString
   * @private
   * @param {Date} date The Date object
   * @param {String} [timezoneId] A valid timezoneId that moment-timezone understands, e.g., "America/Los_Angeles"
   * @return {String}
   *
   * Returns a "valid normalized local date and time string".
   */
  dateToNormalizedLocalDateAndTimeString: function dateToNormalizedLocalDateAndTimeString(date, timezoneId) {
    var m = moment(date);
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
    return Utility.isValidDateString(datePart) && tPart === "T" && Utility.isValidTimeString(timePart);
  },
  /**
   * @method Utility.normalizeContext
   * @private
   * @param  {Object} context A context object, potentially with an `atts` property.
   * @param {String} name The name of the helper or component we're calling from.
   * @return {Object} Normalized context object
   *
   * Returns an object with `afc`, `af`, and `atts` properties, normalized from whatever object is passed in.
   * This helps deal with the fact that we have to pass the ancestor autoform's context to different
   * helpers and components in different ways, but in all cases we want to get access to it and throw
   * an error if we can't find an autoform context.
   */
  normalizeContext: function autoFormNormalizeContext(context, name) {
    var atts, autoform, defs, itemDefs, allowedValues, formComponentAttributes,
      fieldAttributes, fieldAttributesForComponentType;

    context = context || {};
    atts = context.atts ? _.clone(context.atts) : _.clone(context);
    autoform = AutoForm.find(name);
    defs = Utility.getDefs(autoform.ss, atts.name); //defs will not be undefined

    // For array fields, `allowedValues` is on the array item definition
    if (defs.type === Array) {
      itemDefs = Utility.getDefs(autoform.ss, atts.name + ".$");
      allowedValues = itemDefs.allowedValues;
    } else {
      allowedValues = defs.allowedValues;
    }

    // Look up the tree if we're in a helper, checking to see if any ancestor components
    // had a <componentType>-attribute specified.
    formComponentAttributes = AutoForm.findAttributesWithPrefix(name + "-");

    // Get any field-specific attributes defined in the schema.
    // They can be in autoform.attrName or autoform.componentType.attrName, with
    // the latter overriding the former.
    fieldAttributes = _.clone(defs.autoform) || {};
    fieldAttributesForComponentType = fieldAttributes[name] || {};
    fieldAttributes = _.omit(fieldAttributes, componentTypeList);
    fieldAttributes = _.extend({}, fieldAttributes, fieldAttributesForComponentType);

    // If options="auto", we want to use defs.autoform.options
    // if specified and otherwise fall back to "allowed"
    if (fieldAttributes.options && atts.options === "auto")
      delete atts.options;

    // "autoform" option in the schema provides default atts
    atts = _.extend({}, formComponentAttributes, fieldAttributes, atts);

    // If still set to "auto", then there were no options in defs, so we use "allowed"
    if (atts.options === "auto") {
      if (allowedValues) {
        atts.options = "allowed";
      } else {
        delete atts.options;
      }
    }

    return {
      af: autoform,
      atts: atts,
      defs: defs
    };
  },
  /**
   * @method Utility.stringToArray
   * @private
   * @param {String|Array} s A variable that might be a string or an array.
   * @param {String} errorMessage Error message to use if it's not a string or an array.
   * @return {Array} The array, building it from a comma-delimited string if necessary.
   */
  stringToArray: function stringToArray(s, errorMessage) {
    if (typeof s === "string") {
      return s.replace(/ /g, '').split(',');
    } else if (!_.isArray(s)) {
      throw new Error(errorMessage);
    } else {
      return s;
    }
  },
  /**
   * @method Utility.stringToBool
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Boolean|String} The string converted to a Boolean.
   *
   * If the string is "true" or "1", returns `true`. If the string is "false" or "0", returns `false`. Otherwise returns the original string.
   */
  stringToBool: function stringToBool(val) {
    if (typeof val === "string" && val.length > 0) {
      var lval = val.toLowerCase();
      if (lval === "true" || lval === "1") {
        return true;
      } else if (lval === "false" || lval === "0") {
        return false;
      }
    }
    return val;
  },
  /**
   * @method Utility.stringToNumber
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Number|String} The string converted to a Number or the original value.
   *
   * Returns Number(val) unless the result is NaN.
   */
  stringToNumber: function stringToNumber(val) {
    if (typeof val === "string" && val.length > 0) {
      var numVal = Number(val);
      if (!isNaN(numVal)) {
        return numVal;
      }
    }
    return val;
  },
  /**
   * @method Utility.stringToDate
   * @private
   * @param {String} val A string or null or undefined.
   * @return {Date|String} The string converted to a Date instance.
   *
   * Returns new Date(val) as long as val is a string with at least one character. Otherwise returns the original string.
   */
  stringToDate: function stringToDate(val) {
    if (typeof val === "string" && val.length > 0) {
      return new Date(val);
    }
    return val;
  },
  /**
   * @method Utility.addClass
   * @private
   * @param {Object} atts An object that might have a "class" property
   * @param {String} klass The class string to add
   * @return {Object} The object with klass added to the "class" property, creating the property if necessary
   */
  addClass: function addClass(atts, klass) {
    if (typeof atts["class"] === "string") {
      atts["class"] += " " + klass;
    } else {
      atts["class"] = klass;
    }
    return atts;
  }
};


// getPrototypeOf polyfill
if (typeof Object.getPrototypeOf !== "function") {
  if (typeof "".__proto__ === "object") {
    Object.getPrototypeOf = function(object) {
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object) {
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}

/* Tests whether "obj" is an Object as opposed to
 * something that inherits from Object
 *
 * @param {any} obj
 * @returns {Boolean}
 */
var isBasicObject = function(obj) {
  return _.isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype;
};
