export const isObject = obj => Object.prototype.toString.call(obj) === '[object Object]';
export const isFunction = obj => {
  const type = Object.prototype.toString.call(obj);
  return type === '[object Function]' || type === '[object AsyncFunction]';
}

export const throttle = (fn, limit) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), limit)
  }
}
