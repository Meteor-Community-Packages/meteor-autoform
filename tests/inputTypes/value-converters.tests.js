/* eslint-env mocha */
import '../../inputTypes/value-converters'
import { expect } from 'chai'

describe('inputTypes - value converters', function () {
  describe(AutoForm.valueConverters.booleanToNumber.name, function () {
    it('converts a boolean to string', function () {
      expect(AutoForm.valueConverters.booleanToString(true)).to.equal('TRUE')
      expect(AutoForm.valueConverters.booleanToString(false)).to.equal('FALSE')
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.booleanToString(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.booleanToStringArray.name, function () {
    it('converts a boolean to string array', function () {
      expect(AutoForm.valueConverters.booleanToStringArray(true))
        .to.deep.equal(['TRUE'])
      expect(AutoForm.valueConverters.booleanToStringArray(false))
        .to.deep.equal(['FALSE'])
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.booleanToStringArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.booleanToNumber.name, function () {
    it('converts a boolean to number', function () {
      expect(AutoForm.valueConverters.booleanToNumber(true)).to.equal(1)
      expect(AutoForm.valueConverters.booleanToNumber(false)).to.equal(0)
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.booleanToNumber(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.booleanToNumberArray.name, function () {
    it('converts a boolean to number array', function () {
      expect(AutoForm.valueConverters.booleanToNumberArray(true)).to.deep.equal([1])
      expect(AutoForm.valueConverters.booleanToNumberArray(false)).to.deep.equal([0])
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.booleanToNumberArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToDateString.name, function () {
    it('converts date to date string', function () {
      const then = new Date('Monday, 05 Feb 1979 15:42:38')
      expect(AutoForm.valueConverters.dateToDateString(then)).to.equal('1979-02-05')
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToDateString(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToDateStringUTC.name, function () {
    it('converts date to UTC date string', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToDateStringUTC(date)).to.equal('2020-11-22')
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToDateStringUTC(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToDateStringUTCArray.name, function () {
    it('converts date to UTC date string array', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToDateStringUTCArray(date)).to.deep.equal(['2020-11-22'])
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToDateStringUTCArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString.name, function () {
    it('converts date to normalized UTC date and time string ', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeString(date)).to.equal('2020-11-22T23:00:38.000Z')
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToDateStringUTCArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeStringArray.name, function () {
    it('converts date to normalized UTC date and time string array', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeStringArray(date)).to.deep.equal(['2020-11-22T23:00:38.000Z'])
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToNormalizedForcedUtcGlobalDateAndTimeStringArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString.name, function () {
    it('converts date to normalized local date and time string array', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(date)).to.equal('2020-11-23T00:00:38.000')
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToNormalizedLocalDateAndTimeString(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToNumber.name, function () {
    it('converts date to a unix timestamp number', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToNumber(date)).to.equal(1606086038000)
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToNumber(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToNumberArray.name, function () {
    it('converts date to a unix timestamp number array', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToNumberArray(date)).to.deep.equal([1606086038000])
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToNumberArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.dateToDateArray.name, function () {
    it('converts date to an array', function () {
      const date = new Date('Mon Nov 23 2020 00:00:38 GMT+0100')
      expect(AutoForm.valueConverters.dateToDateArray(date)).to.deep.equal([date])
    })
    it('ignores other types', function () {
      [1, 0, '1', '0', '', 'true', 'TRUE', 'false', 'false', {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.dateToDateArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToStringArray.name, function () {
    it('converts string to a string array', function () {
      const str = 'hello, world'
      const expected = ['hello', 'world']
      expect(AutoForm.valueConverters.stringToStringArray(str)).to.deep.equal(expected)
    })
    it('ignores other types', function () {
      [1, 0, true, false, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToStringArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToNumber.name, function () {
    it('converts string to a number', function () {
      expect(AutoForm.valueConverters.stringToNumber('1')).to.equal(1)
      expect(AutoForm.valueConverters.stringToNumber('1.3')).to.equal(1.3)
      expect(AutoForm.valueConverters.stringToNumber('-1.5')).to.equal(-1.5)
    })
    it('ignores other types', function () {
      ['', 1, 0, 'null', 'foo', true, false, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToNumber(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToNumberArray.name, function () {
    it('converts string to a number array', function () {
      expect(AutoForm.valueConverters.stringToNumberArray('1')).to.deep.equal([1])
      expect(AutoForm.valueConverters.stringToNumberArray('1.3')).to.deep.equal([1.3])
      expect(AutoForm.valueConverters.stringToNumberArray('-1.5')).to.deep.equal([-1.5])
      expect(AutoForm.valueConverters.stringToNumberArray('null')).to.deep.equal(['null'])
      expect(AutoForm.valueConverters.stringToNumberArray('')).to.deep.equal([''])
      expect(AutoForm.valueConverters.stringToNumberArray('foo')).to.deep.equal(['foo'])
      expect(AutoForm.valueConverters.stringToNumberArray('1,2, 3')).to.deep.equal([1, 2, 3])
    })
    it('ignores other types', function () {
      [1, 0, true, false, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToNumberArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToBoolean.name, function () {
    it('converts string to boolean', function () {
      expect(AutoForm.valueConverters.stringToBoolean('1')).to.equal(true)
      expect(AutoForm.valueConverters.stringToBoolean('true')).to.equal(true)
      expect(AutoForm.valueConverters.stringToBoolean('TRUE')).to.equal(true)
      expect(AutoForm.valueConverters.stringToBoolean('0')).to.equal(false)
      expect(AutoForm.valueConverters.stringToBoolean('false')).to.equal(false)
      expect(AutoForm.valueConverters.stringToBoolean('FALSE')).to.equal(false)
    })
    it('ignores other types', function () {
      ['', 1, 0, 'foo', null, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToBoolean(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToBooleanArray.name, function () {
    it('converts string to a boolean array', function () {
      expect(AutoForm.valueConverters.stringToBooleanArray('1,true, TRUE')).to.deep.equal([true, true, true])
      expect(AutoForm.valueConverters.stringToBooleanArray('0      , false,FALSE')).to.deep.equal([false, false, false])
      expect(AutoForm.valueConverters.stringToBooleanArray('null,foo,undefined')).to.deep.equal(['null', 'foo', 'undefined'])
    })
    it('ignores other types', function () {
      [1, 0, true, false, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToBooleanArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToDate.name, function () {
    it('converts string to a date', function () {
      expect(AutoForm.valueConverters.stringToDate('100')
        .getTime()).to.equal(100)
      expect(AutoForm.valueConverters.stringToDate('Thu Jan 01 1971 01:00:00 GMT+0100')
        .getTime()).to.equal(31536000000)
    })
    it('ignores other types', function () {
      ['', 1, 0, 'null', 'foo', true, false, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToDate(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.stringToDateArray.name, function () {
    it('converts string to a date array', function () {
      const toTime = d => d.getTime ? d.getTime() : d
      expect(AutoForm.valueConverters.stringToDateArray('100')
        .map(toTime)).to.deep.equal([100])
      expect(AutoForm.valueConverters.stringToDateArray('Thu Jan 01 1971 01:00:00 GMT+0100')
        .map(toTime)).to.deep.equal([31536000000])
      expect(AutoForm.valueConverters.stringToDateArray('100, null')
        .map(toTime)).to.deep.equal([100, 'null'])
    })
    it('ignores other types', function () {
      [1, 0, true, false, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.stringToDateArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.numberToString.name, function () {
    it('converts a number to string', function () {
      expect(AutoForm.valueConverters.numberToString(0)).to.equal('0')

      const rand = Math.random()
      expect(AutoForm.valueConverters.numberToString(rand)).to.equal(String(rand))
    })
    it('ignores other types', function () {
      ['1', '0', '', true, false, null, undefined, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.numberToString(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.numberToStringArray.name, function () {
    it('converts a number to string array', function () {
      expect(AutoForm.valueConverters.numberToStringArray(0)).to.deep.equal(['0'])

      const rand = Math.random()
      expect(AutoForm.valueConverters.numberToStringArray(rand)).to.deep.equal([String(rand)])
    })
    it('ignores other types', function () {
      ['1', '0', '', true, false, null, undefined, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.numberToStringArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.numberToNumberArray.name, function () {
    it('converts a number to number array', function () {
      expect(AutoForm.valueConverters.numberToNumberArray(0)).to.deep.equal([0])

      const rand = Math.random()
      expect(AutoForm.valueConverters.numberToNumberArray(rand)).to.deep.equal([rand])
    })
    it('ignores other types', function () {
      ['1', '0', '', true, false, null, undefined, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.numberToNumberArray(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.numberToBoolean.name, function () {
    it('converts a number to boolean', function () {
      expect(AutoForm.valueConverters.numberToBoolean(0)).to.equal(false)
      expect(AutoForm.valueConverters.numberToBoolean(1)).to.equal(true)
    })
    it('ignores other types', function () {
      ['1', '0', '', true, false, null, 100, -1, undefined, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.numberToBoolean(value)).to.equal(value)
        })
    })
  })
  describe(AutoForm.valueConverters.numberToBooleanArray.name, function () {
    it('converts a number to boolean array', function () {
      expect(AutoForm.valueConverters.numberToBooleanArray(0)).to.deep.equal([false])
      expect(AutoForm.valueConverters.numberToBooleanArray(1)).to.deep.equal([true])
    })
    it('ignores other types', function () {
      ['1', '0', '', true, false, null, 100, -1, undefined, {}, []]
        .forEach(value => {
          expect(AutoForm.valueConverters.numberToBooleanArray(value)).to.equal(value)
        })
    })
  })
})
