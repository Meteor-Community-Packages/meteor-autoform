/* global moment */
import MongoObject from 'mongo-object'
import { isObject } from './common'

/**
 * @private
 * @type {RegExp}
 * Used to validate time strings. This reg ex actually allows a few invalid hours/minutes/seconds,
 * but we can catch that when parsing.
 */
const timeStringRegExp = /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9](\.[0-9]{1,3})?)?$/

export const Utility = {
  componentTypeList: [
    'afArrayField',
    'afEachArrayItem',
    'afFieldInput',
    'afFormGroup',
    'afObjectField',
    'afQuickField',
    'afQuickFields',
    'autoForm',
    'quickForm'
  ],
  /**
   * @method Utility.cleanNulls
   * @private
   * @param {Object} doc - Source object
   * @param {Boolean} isArray
   * @param {Boolean} keepEmptyStrings
   * @returns {Object}
   *
   * Returns an object in which all properties with null, undefined, or empty
   * string values have been removed, recursively.
   */
  cleanNulls: function cleanNulls (doc, isArray, keepEmptyStrings) {
    const newDoc = isArray ? [] : {}
    Object.entries(doc).forEach(function ([key, val]) {
      if (!Array.isArray(val) && isBasicObject(val)) {
        val = cleanNulls(val, false, keepEmptyStrings) // recurse into plain objects
        if (Object.keys(val).length) {
          newDoc[key] = val
        }
      }

      else if (Array.isArray(val)) {
        if (!keepEmptyStrings) {
          val = val.filter((v) => ![null, undefined, ''].includes(v))
        }
        val = cleanNulls(val, true, keepEmptyStrings) // recurse into non-typed arrays
        if (Object.keys(val).length) {
          newDoc[key] = val
        }
      }

      else if (!Utility.isNullUndefinedOrEmptyString(val)) {
        newDoc[key] = val
      }

      else if (
        keepEmptyStrings &&
        typeof val === 'string' &&
        val.length === 0) {
        newDoc[key] = val
      }
    })
    return newDoc
  },
  /**
   * @method Utility.reportNulls
   * @private
   * @param {Object} flatDoc - An object with no properties that are also objects.
   * @param {Boolean} keepEmptyStrings
   * @returns {Object} An object in which the keys represent the keys in the
   * original object that were null, undefined, or empty strings, and the value
   * of each key is "".
   */
  reportNulls: function reportNulls (flatDoc, keepEmptyStrings) {
    const nulls = {}
    // Loop through the flat doc
    Object.entries(flatDoc).forEach(function ([key, val]) {
      // If value is undefined, null, or an empty string,
      // report this as null so it will be unset
      if (val === null) {
        nulls[key] = ''
      }
      else if (val === undefined) {
        nulls[key] = ''
      }
      else if (
        !keepEmptyStrings &&
        typeof val === 'string' &&
        val.length === 0) {
        nulls[key] = ''
      }
      else if (
        // If value is an array in which all the values recursively are undefined,
        // null, or an empty string, report this as null so it will be unset
        Array.isArray(val) &&
        Utility.cleanNulls(val, true, keepEmptyStrings).length === 0
      ) {
        nulls[key] = ''
      }
    })
    return nulls
  },
  /**
   * @method Utility.docToModifier
   * @private
   * @param {Object} doc - An object to be converted into a MongoDB modifier
   * @param {Object} [options] - Options
   * @param {Boolean} [options.keepEmptyStrings] - Pass `true` to keep empty strings in the $set. Otherwise $unset them.
   * @param {Boolean} [options.keepArrays] - Pass `true` to $set entire arrays. Otherwise the modifier will $set individual array items.
   * @returns {Object} A MongoDB modifier.
   *
   * Converts an object into a modifier by flattening it, putting keys with
   * null, undefined, and empty string values into `modifier.$unset`, and
   * putting the rest of the keys into `modifier.$set`.
   */
  docToModifier: function docToModifier (doc, options) {
    const modifier = {}
    options = options || {}

    // Flatten doc
    const mDoc = new MongoObject(doc)
    let flatDoc = mDoc.getFlatObject({
      keepArrays: Boolean(options.keepArrays)
    })
    // Get a list of null, undefined, and empty string values so we can unset them instead
    const nulls = Utility.reportNulls(
      flatDoc,
      Boolean(options.keepEmptyStrings)
    )
    flatDoc = Utility.cleanNulls(
      flatDoc,
      false,
      Boolean(options.keepEmptyStrings)
    )

    if (Object.keys(flatDoc).length) {
      modifier.$set = flatDoc
    }
    if (Object.keys(nulls).length) {
      modifier.$unset = nulls
    }
    return modifier
  },
  /**
   * @method Utility.getSelectValues
   * @private
   * @param {Element} select - DOM Element from which to get current values
   * @returns {string[]}
   *
   * Gets a string array of all the selected values in a given `select` DOM element.
   */
  getSelectValues: function getSelectValues (select) {
    const result = []
    const options = (select && select.options) || []
    let opt

    for (let i = 0, ln = options.length; i < ln; i++) {
      opt = options[i]

      if (opt.selected) {
        result.push(opt.value || opt.text)
      }
    }
    return result
  },
  /*
   * Get select options
   */
  getSelectOptions: function getSelectOptions (defs, hash) {
    const schemaType = defs.type
    let selectOptions = hash.options

    // Handle options="allowed"
    if (selectOptions === 'allowed') {
      selectOptions = defs.allowedValues.map(function (v) {
        let label = v
        if (hash.capitalize && v.length > 0 && schemaType === String) {
          label = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()
        }

        return { label: label, value: v }
      })
    } // eslint-disable-line brace-style

    // Hashtable
    else if (isObject(selectOptions) && !Array.isArray(selectOptions)) {
      selectOptions = Object.entries(selectOptions).map(function ([k, v]) {
        return { label: v, value: schemaType(k) }
      })
    }

    return selectOptions
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
  lookup: function lookup (obj) {
    let ref = window
    let arr
    if (typeof obj === 'string') {
      arr = obj.split('.')
      while (arr.length && (ref = ref[arr.shift()]));
      if (!ref) {
        throw new Error(`${obj} is not in the window scope`)
      }
      return ref
    }
    return obj
  },
  /**
   * @method Utility.getFieldDefinition
   * @private
   * @param {SimpleSchema} ss
   * @param {String} name
   * @return {Object} Schema definitions object
   *
   * Returns the schema definitions object from a SimpleSchema instance, grabbing the first
   * type definition out of potentially multiple.
   */
  getFieldDefinition (ss, name) {
    const def = ss.getDefinition(name)
    if (!def) return

    return {
      ...def,
      ...((def.type && def.type[0]) || {})
    }
  },
  /**
   * @method Utility.objAffectsKey
   * @private
   * @param  {Object} obj
   * @param  {String} key
   * @return {Boolean}
   * @todo should make this a static method in MongoObject
   */
  objAffectsKey: function objAffectsKey (obj, key) {
    const mDoc = new MongoObject(obj)
    return mDoc.affectsKey(key)
  },
  /**
   * @method Utility.expandObj
   * @private
   * @param  {Object} doc
   * @return {Object}
   *
   * Takes a flat object and returns an expanded version of it.
   */
  expandObj: function expandObj (doc) {
    const newDoc = {}
    let subkeys, subkey, subkeylen, nextPiece, current
    Object.entries(doc).forEach(function ([key, val]) {
      subkeys = key.split('.')
      subkeylen = subkeys.length
      current = newDoc
      for (let i = 0; i < subkeylen; i++) {
        subkey = subkeys[i]
        if (
          typeof current[subkey] !== 'undefined' &&
          !isObject(current[subkey]) &&
          !Array.isArray(current[subkey])
        ) {
          break // already set for some reason; leave it alone
        }
        if (i === subkeylen - 1) {
          // last iteration; time to set the value
          current[subkey] = val
        }
        else {
          // see if the next piece is a number
          nextPiece = subkeys[i + 1]
          nextPiece = parseInt(nextPiece, 10)
          if (
            isNaN(nextPiece) &&
            !isObject(current[subkey]) &&
            !Array.isArray(current[subkey])
          ) {
            current[subkey] = {}
          }
          else if (!isNaN(nextPiece) && !Array.isArray(current[subkey])) {
            current[subkey] = []
          }
        }
        current = current[subkey]
      }
    })
    return newDoc
  },
  /**
   * @method Utility.compactArrays
   * @private
   * @param  {Object} obj
   * @return {undefined}
   *
   * Edits the object by reference, compacting any arrays at any level recursively.
   */
  compactArrays: function compactArrays (obj) {
    if (isObject(obj)) {
      Object.entries(obj).forEach(function ([key, val]) {
        if (Array.isArray(val)) {
          obj[key] = val.filter((item) => ![undefined, null].includes(item))
          obj[key].forEach(compactArrays)
        }
        else if (isObject(val)) {
          // recurse into objects
          compactArrays(val)
        }
      })
    }
  },
  /**
   * @method Utility.bubbleEmpty
   * @private
   * @param  {Object} obj
   * @param {String} keepEmptyStrings
   * @return {undefined}
   *
   * Edits the object by reference.
   */
  bubbleEmpty: function bubbleEmpty (obj, keepEmptyStrings) {
    if (isObject(obj)) {
      Object.entries(obj).forEach(function ([key, val]) {
        if (Array.isArray(val)) {
          val.forEach(bubbleEmpty) // TODO what if array is empty? Remove?
        }
        else if (isBasicObject(val)) {
          const allEmpty = Object.values(val).every(function (prop) {
            return (
              prop === undefined ||
              prop === null ||
              (!keepEmptyStrings &&
                typeof prop === 'string' &&
                prop.length === 0)
            )
          })

          if (!Object.keys(val).length || allEmpty) {
            obj[key] = null
          }
          else {
            // recurse into objects
            bubbleEmpty(val)
          }
        }
      })
    }
  },
  /**
   * @method Utility.isNullUndefinedOrEmptyString
   * @private
   * @param  {Any} val
   * @return {Boolean}
   *
   * Returns `true` if the value is null, undefined, or an empty string
   */
  isNullUndefinedOrEmptyString: function isNullUndefinedOrEmptyString (val) {
    return (
      val === undefined ||
      val === null ||
      (typeof val === 'string' && val.length === 0)
    )
  },
  /**
   * @method Utility.isValidDateString
   * @private
   * @param  {String}  dateString
   * @return {Boolean}
   *
   * Returns `true` if dateString is a "valid date string"
   */
  isValidDateString: function isValidDateString (dateString) {
    const m = moment(dateString, 'YYYY-MM-DD', true)
    return m && m.isValid()
  },
  /**
   * @method Utility.isValidTimeString
   * @private
   * @param  {String}  timeString
   * @return {Boolean}
   *
   * Returns `true` if timeString is a "valid time string"
   */
  isValidTimeString: function isValidTimeString (timeString) {
    if (typeof timeString !== 'string') {
      return false
    }

    return timeStringRegExp.test(timeString)
  },
  /**
   * @method  Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString
   * @private
   * @param  {String} dateString
   * @return {Boolean}
   *
   * Returns true if dateString is a "valid normalized forced-UTC global date and time string"
   */
  isValidNormalizedForcedUtcGlobalDateAndTimeString: function isValidNormalizedForcedUtcGlobalDateAndTimeString (
    dateString
  ) {
    if (typeof dateString !== 'string') {
      return false
    }

    const datePart = dateString.substring(0, 10)
    const tPart = dateString.substring(10, 11)
    const timePart = dateString.substring(11, dateString.length - 1)
    const zPart = dateString.substring(dateString.length - 1)
    return (
      Utility.isValidDateString(datePart) &&
      tPart === 'T' &&
      Utility.isValidTimeString(timePart) &&
      zPart === 'Z'
    )
  },
  /**
   * @method  Utility.isValidNormalizedLocalDateAndTimeString
   * @private
   * @param  {String} dtString
   * @return {Boolean}
   *
   * Returns true if dtString is a "valid normalized local date and time string"
   */
  isValidNormalizedLocalDateAndTimeString: function isValidNormalizedLocalDateAndTimeString (
    dtString
  ) {
    if (typeof dtString !== 'string') {
      return false
    }

    const datePart = dtString.substring(0, 10)
    const tPart = dtString.substring(10, 11)
    const timePart = dtString.substring(11, dtString.length)
    return (
      Utility.isValidDateString(datePart) &&
      tPart === 'T' &&
      Utility.isValidTimeString(timePart)
    )
  },
  /**
   * @method Utility.getComponentContext
   * @private
   * @param  {Object} context A context (`this`) object
   * @param {String} name The name of the helper or component we're calling from.
   * @return {Object|undefined} Normalized context object
   *
   * Returns an object with `atts` and `defs` properties, normalized from whatever object is passed in.
   * This helps deal with the fact that we have to pass the ancestor autoform's context to different
   * helpers and components in different ways, but in all cases we want to get access to it and throw
   * an error if we can't find an autoform context.
   */
  getComponentContext: function autoFormGetComponentContext (context, name) {
    let atts = { ...context }
    const ss = AutoForm.getFormSchema()
    const defs = Utility.getFieldDefinition(ss, atts.name)
    if (!defs) return

    // Look up the tree if we're in a helper, checking to see if any ancestor components
    // had a <componentType>-attribute specified.
    const formComponentAttributes = AutoForm.findAttributesWithPrefix(
      name + '-'
    )

    // Get any field-specific attributes defined in the schema.
    // They can be in autoform.attrName or autoform.componentType.attrName, with
    // the latter overriding the former.
    let fieldAttributes = { ...defs.autoform }

    const fieldAttributesForComponentType = fieldAttributes[name] || {}
    fieldAttributes = Object.entries(fieldAttributes).reduce(
      (result, [key, value]) => {
        if (!Utility.componentTypeList.includes(key)) result[key] = value
        return result
      },
      {}
    )
    fieldAttributes = {
      ...fieldAttributes,
      ...fieldAttributesForComponentType
    }

    // "autoform" option in the schema provides default atts
    atts = { ...formComponentAttributes, ...fieldAttributes, ...atts }

    // eval any attribute that is provided as a function
    const evaluatedAtts = {}
    Object.entries(atts).forEach(function ([k, v]) {
      if (typeof v === 'function') {
        evaluatedAtts[k] = v.call({
          name: atts.name
        })
      }
      else {
        evaluatedAtts[k] = v
      }
    })

    return {
      atts: evaluatedAtts,
      defs: defs
    }
  },
  /**
   * @method Utility.stringToArray
   * @private
   * @param {String|Array} s A variable that might be a string or an array.
   * @param {String} errorMessage Error message to use if it's not a string or an array.
   * @return {Array} The array, building it from a comma-delimited string if necessary.
   */
  stringToArray: function stringToArray (s, errorMessage) {
    if (typeof s === 'string') {
      return s.replace(/ /g, '').split(',')
    }
    else if (!Array.isArray(s)) {
      throw new Error(errorMessage)
    }
    else {
      return s
    }
  },
  /**
   * @method Utility.addClass
   * @private
   * @param {Object} atts An object that might have a "class" property
   * @param {String} klass The class string to add
   * @return {Object} The object with klass added to the "class" property, creating the property if necessary
   */
  addClass: function addClass (atts, klass) {
    if (typeof atts.class === 'string') {
      atts.class += ` ${klass}`
    }
    else {
      atts.class = klass
    }
    return atts
  },
  /**
   * @method Utility.getFormTypeDef
   * @private
   * @param {String} formType The form type
   * @return {Object} The definition. Throws an error if type hasn't been defined.
   */
  getFormTypeDef: function getFormTypeDef (formType) {
    const ftd = AutoForm._formTypeDefinitions[formType]
    if (!ftd) {
      throw new Error(`AutoForm: Form type "${formType}" has not been defined`)
    }
    return ftd
  },
  checkTemplate: function checkTemplate (template) {
    return !!(
      template &&
      template.view &&
      template.view._domrange &&
      !template.view.isDestroyed
    )
  },
  // This is copied from mongo-object to avoid a direct dep on that package
  // XXX: we have already direct dep on that package, so it makes no difference anymore,
  // plus it's safer to use the "original" to enforce DRY at least
  makeKeyGeneric (key) {
    return MongoObject.makeKeyGeneric(key)
  }
}

/* Tests whether "obj" is an Object as opposed to
 * something that inherits from Object.
 *
 * @param {any} obj
 * @returns {Boolean}
 */
const isBasicObject = function (obj) {
  return isObject(obj) && Object.getPrototypeOf(obj) === Object.prototype
}
