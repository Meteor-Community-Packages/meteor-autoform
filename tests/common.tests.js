/* eslint-env mocha */
import { expect } from 'chai'
import { isObject, isFunction, throttle } from '../common'

describe('common', function () {
  describe(isObject.name, function () {
    it('determines, if something is an object', function () {
      [{}, { foo: {} }, Object.create(null)].forEach(obj => {
        expect(isObject(obj)).to.equal(true)
      });

      [[], () => {}, false, 1, 'foo', new Date()].forEach(obj => {
        expect(isObject(obj)).to.equal(false)
      })
    })
  })
  describe(isFunction.name, function () {
    it('determines, if something is a function', function () {
      [new Date(), 1, false, 'foo', [], {}].forEach(obj => {
        expect(isFunction(obj)).to.equal(false)
      });

      [function () {}, () => {}, async function () {}, async () => {}].forEach(obj => {
        expect(isFunction(obj)).to.equal(true)
      })
    })
  })
  describe(throttle.name, function () {
    it('it throttles by a certain timeout', function (done) {
      let count = 0
      const fn = () => { count++ }
      const throttled = throttle(fn, 10)
      for (let i = 0; i < 1000; i++) {
        throttled()
      }

      setTimeout(() => {
        expect(count).to.equal(1)
        done()
      }, 300)
    })
  })
})
