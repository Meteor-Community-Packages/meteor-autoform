/* eslint-env mocha */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { _validateField } from '../autoform-validation'
import { restoreAll, stub } from './test-utils.tests'
import { Utility } from '../utility'

describe('validation', function () {
  afterEach(function () {
    restoreAll()
  })

  describe('validateField', function () {
    it('returns true if form is not currently rendered', function () {
      stub(AutoForm, 'templateInstanceForForm', () => {})
      stub(Utility, 'checkTemplate', () => false)
      expect(_validateField()).to.equal(true)
    })
    it('returns true if no schema is found', function () {
      stub(AutoForm, 'templateInstanceForForm', () => {})
      stub(Utility, 'checkTemplate', () => true)
      stub(AutoForm, 'getCurrentDataForForm', () => {})
      stub(AutoForm, 'getFormSchema', () => null)
      expect(_validateField()).to.equal(true)
    })
    it('returns true if onlyIfAlreadyInvalid is true and schema is valid', function () {
      let expectedCall = false
      const schema = {
        namedContext: () => {
          return {
            isValid () {
              expectedCall = true
              return true
            }
          }
        }
      }
      stub(AutoForm, 'templateInstanceForForm', () => {})
      stub(Utility, 'checkTemplate', () => true)
      stub(AutoForm, 'getCurrentDataForForm', () => {})
      stub(AutoForm, 'getFormSchema', () => schema)
      expect(_validateField(undefined, undefined, undefined, true)).to.equal(true)
      expect(expectedCall).to.equal(true)
    })
    it('returns true if there is no doc to validate', function () {
      let expectedCall = false
      stub(AutoForm, 'templateInstanceForForm', () => {})
      stub(Utility, 'checkTemplate', () => true)
      stub(AutoForm, 'getCurrentDataForForm', () => ({}))
      stub(AutoForm, 'getFormSchema', () => ({}))
      stub(Utility, 'getFormTypeDef', () => ({}))
      stub(AutoForm, 'getFormValues', () => {
        expectedCall = true
        return undefined
      })

      expect(_validateField(undefined, undefined, undefined, undefined)).to.equal(true)
      expect(expectedCall).to.equal(true)
    })
    it("returns true if skipEmpty is true and the field we're validating has no value", function () {
      let expectedCall = false

      stub(AutoForm, 'templateInstanceForForm', () => {})
      stub(Utility, 'checkTemplate', () => true)
      stub(AutoForm, 'getCurrentDataForForm', () => ({}))
      stub(AutoForm, 'getFormSchema', () => ({}))
      stub(Utility, 'getFormTypeDef', () => ({}))
      stub(AutoForm, 'getFormValues', () => ({}))
      stub(Utility, 'objAffectsKey', () => {
        expectedCall = true
        return false
      })

      expect(_validateField(undefined, undefined, true, undefined)).to.equal(true)
      expect(expectedCall).to.equal(true)
    })
    it('returns, whether the form is valid or not', function () {
      const valid = Random.id()

      stub(AutoForm, 'templateInstanceForForm', () => {})
      stub(Utility, 'checkTemplate', () => true)
      stub(AutoForm, 'getCurrentDataForForm', () => ({}))
      stub(AutoForm, 'getFormSchema', () => ({}))
      stub(Utility, 'getFormTypeDef', () => ({}))
      stub(AutoForm, 'getFormValues', () => ({}))
      stub(Utility, 'objAffectsKey', () => true)
      stub(AutoForm, '_validateFormDoc', () => valid)

      expect(_validateField()).to.equal(valid)
    })
  })
})
