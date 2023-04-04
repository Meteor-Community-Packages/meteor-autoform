/* eslint-env mocha */
/* global Package */
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { FormPreserve } from '../form-preserve'

const preserve = (name) => new FormPreserve(name)

describe('FormPreserve', function () {
  describe('constructor', function () {
    it('throws on invalid migrationName', function () {
      console.log(FormPreserve)
      expect(() => preserve()).to.throw('You must define an unique migration name of type String')
      expect(() => preserve(1)).to.throw('You must define an unique migration name of type String')
      expect(() => preserve(false)).to.throw('You must define an unique migration name of type String')
      expect(() => preserve({})).to.throw('You must define an unique migration name of type String')
      expect(() => preserve([])).to.throw('You must define an unique migration name of type String')
      expect(() => preserve(() => {})).to.throw('You must define an unique migration name of type String')

      const fp = preserve(Random.id())
      expect(fp instanceof FormPreserve).to.equal(true)
      expect(fp.retrievedDocuments).to.deep.equal({})
      expect(fp.registeredForms).to.deep.equal({})
    })

    it('loads migrationData if the Reload package is installed', function () {
      // let's simple-stub the reload package
      const fakeMigratioData = { [Random.id()]: { foo: Random.id() } }
      const Reload = {
        _migrationData: function (name) { return fakeMigratioData },
        _onMigrate: function (name, fn) {}
      }
      Package.reload = { Reload }

      const fp = preserve(Random.id())
      expect(fp.retrievedDocuments).to.deep.equal(fakeMigratioData)
      delete Package.reload
    })
  })
  describe('getDocument', function () {
    it('returns false if a doc is not in retrievedDocuments', function () {
      const fp = preserve(Random.id())
      expect(fp.getDocument()).to.equal(false)
      expect(fp.getDocument(Random.id())).to.equal(false)
    })
    it('returns the doc if it is in retrievedDocuments', function () {
      const fp = preserve(Random.id())
      const formId = Random.id()
      const expectDoc = { foo: Random.id() }
      fp.retrievedDocuments[formId] = expectDoc
      expect(fp.getDocument(formId)).to.deep.equal(expectDoc)
    })
  })
  describe('clearDocument', function () {
    it('removes a registered doc', function () {
      const fp = preserve(Random.id())
      const formId = Random.id()
      const expectDoc = { foo: Random.id() }
      fp.retrievedDocuments[formId] = expectDoc
      fp.clearDocument(formId)
      expect(fp.getDocument(formId)).to.equal(false)
    })
  })
  describe('registerForm', function () {
    it('adds a form to the resgiteredforms', function () {
      const fp = preserve(Random.id())
      const formId = Random.id()
      fp.registerForm(formId, () => formId)

      expect(fp.registeredForms[formId]()).to.equal(formId)
    })
  })
  describe('formIsRegistered', function () {
    it('returns true on registered forms, otherwise false', function () {
      const fp = preserve(Random.id())
      const formId = Random.id()
      fp.registeredForms[formId] = () => formId
      expect(fp.formIsRegistered(formId)).to.equal(true)
      expect(fp.formIsRegistered()).to.equal(false)
      expect(fp.formIsRegistered(Random.id())).to.equal(false)
    })
  })
  describe('unregisterForm', function () {
    it('removes a form from registered forms', function () {
      const fp = preserve(Random.id())
      const formId = Random.id()
      fp.registeredForms[formId] = () => formId

      fp.unregisterForm(formId)
      expect(fp.registeredForms[formId]).to.equal(undefined)
    })
  })
  describe('unregisterAllForms', function () {
    it('removes all forms', function () {
      const fp = preserve(Random.id())
      fp.registeredForms[Random.id()] = () => {}
      fp.registeredForms[Random.id()] = () => {}
      fp.registeredForms[Random.id()] = () => {}

      fp.unregisterAllForms()
      expect(fp.registeredForms).to.deep.equal({})
    })
  })
  describe('_retrieveRegisteredDocuments', function () {
    it('retrieves from all forms', function () {
      const fp = preserve(Random.id())
      const source = {}
      source.one = () => ({ index: 0 })
      source.two = () => ({ index: 1 })
      source.three = () => ({ index: 2 })
      Object.assign(fp.registeredForms, source)

      const result = fp._retrieveRegisteredDocuments()
      expect(result).to.deep.equal({
        one: { index: 0 },
        two: { index: 1 },
        three: { index: 2 }
      })
    })
  })
})
