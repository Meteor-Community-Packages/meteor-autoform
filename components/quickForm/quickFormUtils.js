const falsyValues = [null, undefined, '', false]
const byFalsyValues = f => !falsyValues.includes(f)

/**
 * Takes a schema object and returns a sorted array of field group names for it
 *
 * @param   {Object}   schemaObj Like from mySimpleSchema.schema()
 * @returns {String[]} Array of field group names
 */
export const getSortedFieldGroupNames = function getSortedFieldGroupNames (schemaObj) {
  const names = Object
    .values(schemaObj)
    .map(field => field.autoform && field.autoform.group)
    .filter(byFalsyValues)

  // Remove duplicate names and sort
  return [...new Set(names)].sort()
}

/**
 * Returns the schema field names that belong in the group.
 *
 * @param   {String}   groupName The group name
 * @param   {Object}   schemaObj Like from mySimpleSchema.schema()
 * @returns {String[]} Array of field names (schema keys)
 */
export const getFieldsForGroup = function getFieldsForGroup (groupName, schemaObj) {
  return Object
    .entries(schemaObj)
    .map(([fieldName, field]) => {
      return (fieldName.slice(-2) !== '.$') &&
        field.autoform &&
        field.autoform.group === groupName &&
        fieldName
    })
    .filter(byFalsyValues)
}

/**
 * Returns the schema field names that don't belong to a group
 *
 * @param   {Object}   schemaObj Like from mySimpleSchema.schema()
 * @returns {String[]} Array of field names (schema keys)
 */
export const getFieldsWithNoGroup = function getFieldsWithNoGroup (schemaObj) {
  return Object
    .entries(schemaObj)
    .map(function ([fieldName, field]) {
      return (fieldName.slice(-2) !== '.$') &&
        (!field.autoform || !field.autoform.group) &&
        fieldName
    })
    .filter(byFalsyValues)
}
