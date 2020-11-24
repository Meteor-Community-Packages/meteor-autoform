/* eslint-env mocha */
import { Tracker } from 'meteor/tracker'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { FormData } from '../autoform-formdata'

describe(FormData.name, function () {
  describe('constructor ', function () {
    it('creates a new FormData', function () {
      const fd = new FormData()
      expect(fd instanceof FormData).to.equal(true)
      expect(fd.forms).to.deep.equal({})
    })
  })
  describe('initForm ', function () {
    it('Initializes tracking for a given form, if not already done', function () {
      const fd = new FormData()
      const formId = Random.id()
      fd.initForm(formId)
      expect(fd.forms[formId]).to.deep.equal({
        sourceDoc: null,
        deps: {
          sourceDoc: new Tracker.Dependency()
        }
      })
    })
  })
  describe('sourceDoc ', function () {
    it('sets a source doc for the given form', function () {
      const fd = new FormData()
      const formId = Random.id()
      fd.initForm(formId)
      fd.sourceDoc(formId, { foo: formId })

      expect(fd.forms[formId]).to.deep.equal({ sourceDoc: { foo: formId }, deps: { sourceDoc: { _dependentsById: {} } } })
    })
    it('gets a source doc for the given form', function (done) {
      const fd = new FormData()
      const formId = Random.id()
      fd.initForm(formId)

      Tracker.autorun(() => {
        const sourceDoc = fd.sourceDoc(formId)
        if (!sourceDoc) return

        expect(sourceDoc.foo).to.equal(formId)
        done()
      })

      setTimeout(() => fd.sourceDoc(formId, { foo: formId }), 100)
    })
  })
})
