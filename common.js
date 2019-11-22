export const isObject = x => !!x &&
  !Array.isArray(x) &&
  typeof x === 'object' &&
  x.constructor.name.indexOf('Object') > -1 &&
  x === Object(x);