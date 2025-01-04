/**
 * Resolves optional/weak momentjs dependency
 * @return {function|undefined}
 */
export const getMoment = (throwIfNotFound) => {
  if (!moment) {
    const message = 'aldeed:autoform requires momentjs:moment to handle date/time.'
    if (throwIfNotFound) {
      throw new TypeError(message)
    }
    else {
      console.warn(message)
    }
  }
  return moment
}

const name = 'momentjs:moment'
const moment = ((packageDef) => {
  if (typeof packageDef !== 'undefined' && packageDef[name]) {
    return packageDef[name].moment
  }
})(window.Package)
