export const isObject = obj => toString.call(obj) == '[object Object]'
export const isFunction = obj => toString.call(obj) == '[object Function]'

export const throttle = (fn, limit) => {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), limit)
  }
}