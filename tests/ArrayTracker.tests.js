/* eslint-env mocha */
import { Mongo } from 'meteor/mongo'
import { Tracker } from 'meteor/tracker'
import { Random } from 'meteor/random'
import { expect } from 'chai'
import { ArrayTracker } from '../autoform-arrays'
import { overrideStub, restoreAll, stub } from './test-utils.tests'
import { Utility } from '../utility'

describe('ArrayTracker', function () {
  let arrayTracker, formId, field

  beforeEach(function () {
    arrayTracker = new ArrayTracker()
    formId = Random.id()
    field = Random.id()
  })

  afterEach(function () {
    restoreAll()
  })

  describe('getMinMax', function () {
    it('returns a minCount and maxCount from definitions', function () {
      const def = {
        minCount: 12344,
        maxCount: 12345
      }
      const schema = {}
      const field = Random.id()
      stub(Utility, 'getFieldDefinition', () => def)

      expect(arrayTracker.getMinMax(schema, field)).to.deep.equal(def)
    })
    it('falls back to defauls', function () {
      const def = {}
      const schema = {}
      const field = Random.id()
      stub(Utility, 'getFieldDefinition', () => def)

      expect(arrayTracker.getMinMax(schema, field)).to.deep.equal({
        minCount: 0,
        maxCount: Infinity
      })
    })
    it('allows to override them by field attributes', function () {
      const def = {
        minCount: -12344,
        maxCount: 12344
      }
      const schema = {}
      const field = Random.id()
      stub(Utility, 'getFieldDefinition', () => def)

      expect(arrayTracker.getMinMax(schema, field, 123, 12343)).to.deep.equal({
        minCount: 123,
        maxCount: 12343
      })
    })
  })
  describe('initForm', function () {
    it('adds an internal formId entry', function () {
      arrayTracker.initForm(formId)
      expect(arrayTracker.info[formId]).to.deep.equal({})
    })
    it('keeps an existing entry untouched', function () {
      arrayTracker.info[formId] = { formId }
      arrayTracker.initForm(formId)
      expect(arrayTracker.info[formId]).to.deep.equal({ formId })
    })
  })
  describe('getForm', function () {
    it('returns a form entry for an existing form info', function () {
      arrayTracker.info[formId] = { formId }
      expect(arrayTracker.getForm(formId)).to.deep.equal({ formId })
    })
    it('creates a new entry if not existent yet', function () {
      expect(arrayTracker.getForm(formId)).to.deep.equal({})
      expect(arrayTracker.info[formId]).to.deep.equal({})
    })
  })
  describe('ensureField', function () {
    it('ensures a field exists', function () {
      stub(ArrayTracker.prototype, 'resetField', (formId, field) => {
        arrayTracker.info[formId][field] = { formId }
      })

      arrayTracker.ensureField(formId, field)

      expect(arrayTracker.info[formId]).to.deep.equal({
        [field]: { formId }
      })
    })
  })
  describe('initField', function () {
    it('skips if the field is initialized with a non-null array', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = { array: [] }
      arrayTracker.initField(formId, field)
      expect(arrayTracker.info[formId][field]).to.deep.equal({ array: [] })
    })
    it('creates a default context for a given field', function () {
      const schema = {
        minCount: 1,
        maxCount: 7
      }
      const docCount = 2

      stub(Utility, 'getFieldDefinition', () => ({ type: String }))

      arrayTracker.initField(formId, field, schema, docCount)

      const trackedField = arrayTracker.info[formId][field]
      expect(trackedField.collection.find().count()).to.equal(docCount)
      expect(trackedField.array.length).to.equal(docCount)

      const firstDoc = trackedField.collection.findOne()
      expect(firstDoc.formId).to.equal(formId)
      expect(firstDoc.arrayFieldName).to.equal(field)
      expect(firstDoc.index).to.equal(0)
      expect(firstDoc.minCount).to.equal(undefined)
      expect(firstDoc.maxCount).to.equal(undefined)
      expect(firstDoc.name).to.equal(`${field}.0`)
      expect(trackedField.array[0]).to.deep.equal({
        formId: formId,
        arrayFieldName: field,
        index: 0,
        minCount: undefined,
        maxCount: undefined,
        name: `${field}.0`
      })
    })
  })
  describe('resetField', function () {
    it('creates a default entry for a given field if it not exists', function () {
      arrayTracker.resetField(formId, field)
      expect(arrayTracker.info[formId][field]).to.deep.equal({
        deps: new Tracker.Dependency(),
        array: null,
        count: 0,
        visibleCount: 0
      })
    })
    it('reactively resets a field', function (done) {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        deps: new Tracker.Dependency(),
        array: [],
        count: 1,
        visibleCount: 1,
        collection: new Mongo.Collection(null)
      }
      arrayTracker.info[formId][field].deps.changed()

      Tracker.autorun(() => {
        const currentCount = arrayTracker.getCount(formId, field)
        if (currentCount === 0) {
          done()
        }
      })

      arrayTracker.resetField(formId, field)
    })
  })
  describe('resetForm', function () {
    it('resets a form to a plain object', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = { formId, field }

      stub(ArrayTracker.prototype, 'resetField', () => {
        arrayTracker.info[formId][field] = {}
      })

      arrayTracker.resetForm(formId)
      expect(arrayTracker.info[formId]).to.deep.equal({ [field]: {} })
    })
  })
  describe('untrackForm', function () {
    it('removes any tracking info for a given form', function () {
      const collection = new Mongo.Collection(null)
      collection.insert({})
      collection.insert({})
      collection.insert({})

      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        deps: new Tracker.Dependency(),
        array: [],
        count: 1,
        visibleCount: 1,
        collection: collection
      }
      arrayTracker.untrackForm(formId)
      expect(arrayTracker.info[formId]).to.deep.equal({})
      expect(collection.find().count()).to.equal(0)
    })
  })
  describe('tracksField', function () {
    it('returns true or false, whether a field is tracked', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = { deps: new Tracker.Dependency() }
      expect(arrayTracker.tracksField(formId, field)).to.equal(false)
      arrayTracker.info[formId][field].array = null
      expect(arrayTracker.tracksField(formId, field)).to.equal(false)
      arrayTracker.info[formId][field].array = []
      expect(arrayTracker.tracksField(formId, field)).to.equal(true)
    })
    it('runs reactively', function (done) {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = { array: null, deps: new Tracker.Dependency() }

      Tracker.autorun(() => {
        if (arrayTracker.tracksField(formId, field)) {
          done()
        }
      })

      arrayTracker.info[formId][field].array = []
      arrayTracker.info[formId][field].deps.changed()
    })
  })
  describe('getField', function () {
    it('returns the current field entries', function () {
      const collection = new Mongo.Collection(null)
      collection.insert({ formId, field })

      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        collection: collection,
        deps: new Tracker.Dependency()
      }

      const cursor = arrayTracker.getField(formId, field)
      expect(cursor.count()).to.equal(1)

      const doc = collection.findOne()
      expect(cursor.fetch()).to.deep.equal([doc])
    })
    it('runs reactively', function (done) {
      const collection = new Mongo.Collection(null)
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        collection: collection,
        deps: new Tracker.Dependency()
      }

      Tracker.autorun(() => {
        const cursor = arrayTracker.getField(formId, field)
        const docs = cursor.fetch()
        if (docs.length > 0) {
          const doc = docs[0]
          expect(doc.formId).to.equal(formId)
          expect(doc.field).to.equal(field)
          done()
        }
      })

      collection.insert({ formId, field })
      arrayTracker.info[formId][field].deps.changed()
    })
  })
  describe('getCount', function () {
    it('returns the current count', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        count: 123,
        deps: new Tracker.Dependency()
      }

      expect(arrayTracker.getCount(formId, field)).to.equal(123)
    })
    it('runs reactively', function (done) {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        count: 123,
        deps: new Tracker.Dependency()
      }

      Tracker.autorun(() => {
        const count = arrayTracker.getCount(formId, field)
        if (count === -1) {
          done()
        }
      })

      arrayTracker.info[formId][field].count = -1
      arrayTracker.info[formId][field].deps.changed()
    })
  })
  describe('getVisibleCount', function () {
    it('returns the current visibleCount', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        visibleCount: 123,
        deps: new Tracker.Dependency()
      }

      expect(arrayTracker.getVisibleCount(formId, field)).to.equal(123)
    })
    it('runs reactively', function (done) {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        visibleCount: 123,
        deps: new Tracker.Dependency()
      }

      Tracker.autorun(() => {
        const count = arrayTracker.getVisibleCount(formId, field)
        if (count === -1) {
          done()
        }
      })

      arrayTracker.info[formId][field].visibleCount = -1
      arrayTracker.info[formId][field].deps.changed()
    })
  })
  describe('isFirstFieldlVisible', function () {
    it('will return `true` or `false` depending on whether the current item/field in the array is the first visible item, respectively', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        array: [
          {
            index: 0,
            removed: true
          },
          {
            index: 1
          }
        ],
        deps: new Tracker.Dependency()
      }

      expect(arrayTracker.isFirstFieldlVisible(formId, field, 0)).to.equal(false)
      expect(arrayTracker.isFirstFieldlVisible(formId, field, 1)).to.equal(true)
    })
    it('runs reactively', function (done) {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        array: [
          {
            index: 0
          },
          {
            index: 1
          }
        ],
        deps: new Tracker.Dependency()
      }

      Tracker.autorun(() => {
        if (arrayTracker.isFirstFieldlVisible(formId, field, 1)) {
          done()
        }
      })

      setTimeout(() => {
        arrayTracker.info[formId][field].array[0].removed = true
        arrayTracker.info[formId][field].deps.changed()
      }, 10)
    })
  })
  describe('isLastFieldlVisible', function () {
    it('will return `true` or `false` depending on whether the current item/field in the array is the last visible item, respectively', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        array: [
          {
            index: 0
          },
          {
            index: 1,
            removed: true
          }
        ],
        deps: new Tracker.Dependency()
      }

      expect(arrayTracker.isLastFieldlVisible(formId, field, 1)).to.equal(false)
      expect(arrayTracker.isLastFieldlVisible(formId, field, 0)).to.equal(true)
    })
    it('runs reactively', function (done) {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        array: [
          {
            index: 0
          },
          {
            index: 1
          }
        ],
        deps: new Tracker.Dependency()
      }

      Tracker.autorun(() => {
        if (arrayTracker.isLastFieldlVisible(formId, field, 0)) {
          done()
        }
      })

      setTimeout(() => {
        arrayTracker.info[formId][field].array[1].removed = true
        arrayTracker.info[formId][field].deps.changed()
      }, 10)
    })
  })
  describe('addOneToField', function () {
    it('skips if array is not defined', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {}
      expect(arrayTracker.addOneToField(formId, field)).to.equal(undefined)
    })
    it('increases the array fields by one, if current count is less than max count', function () {
      const collection = new Mongo.Collection(null)
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        deps: new Tracker.Dependency(),
        array: [{
          formId: formId,
          arrayFieldName: field,
          index: 0,
          minCount: undefined,
          maxCount: undefined,
          name: `${field}.0`
        }],
        count: 1,
        visibleCount: 1,
        collection: collection
      }

      collection.insert(arrayTracker.info[formId][field].array[0])

      // ignore if maxCount is reached
      stub(ArrayTracker.prototype, 'getMinMax', () => ({ maxCount: 1 }))
      arrayTracker.addOneToField(formId, field)
      expect(arrayTracker.info[formId][field].collection.find().count()).to.equal(1)
      expect(arrayTracker.info[formId][field].array.length).to.equal(1)
      expect(arrayTracker.info[formId][field].count).to.equal(1)
      expect(arrayTracker.info[formId][field].visibleCount).to.equal(1)

      // increaes if maxcount is not reached
      overrideStub(ArrayTracker.prototype, 'getMinMax', () => ({ maxCount: 2 }))
      stub(Utility, 'getFieldDefinition', () => ({ type: String }))
      stub(AutoForm, 'resetValueCache', () => {})

      arrayTracker.addOneToField(formId, field)
      expect(arrayTracker.info[formId][field].collection.find().count()).to.equal(2)
      expect(arrayTracker.info[formId][field].array.length).to.equal(2)
      expect(arrayTracker.info[formId][field].count).to.equal(2)
      expect(arrayTracker.info[formId][field].visibleCount).to.equal(2)
      expect(arrayTracker.info[formId][field].array[1]).to.deep.equal({
        formId: formId,
        arrayFieldName: field,
        index: 1,
        minCount: undefined,
        maxCount: undefined,
        name: `${field}.1`
      })
    })
    it('runs reactively', function (done) {
      const collection = new Mongo.Collection(null)
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        deps: new Tracker.Dependency(),
        array: [{
          formId: formId,
          arrayFieldName: field,
          index: 0,
          minCount: undefined,
          maxCount: undefined,
          name: `${field}.0`
        }],
        count: 1,
        visibleCount: 1,
        collection: collection
      }

      Tracker.autorun(() => {
        if (arrayTracker.getCount(formId, field) === 2) {
          done()
        }
      })

      setTimeout(() => {
        stub(ArrayTracker.prototype, 'getMinMax', () => ({ maxCount: 2 }))
        stub(Utility, 'getFieldDefinition', () => ({ type: String }))
        stub(AutoForm, 'resetValueCache', () => {})

        arrayTracker.addOneToField(formId, field)
      }, 2)
    })
  })
  describe('removeFromFieldAtIndex', function () {
    it('skips if array is not defined', function () {
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {}
      expect(arrayTracker.removeFromFieldAtIndex(formId, field)).to.equal(undefined)
    })
    it('decreases the array fields by one, if current count is grater than min count', function () {
      const collection = new Mongo.Collection(null)
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        deps: new Tracker.Dependency(),
        array: [{
          formId: formId,
          arrayFieldName: field,
          index: 0,
          minCount: undefined,
          maxCount: undefined,
          name: `${field}.0`
        }, {
          formId: formId,
          arrayFieldName: field,
          index: 1,
          minCount: undefined,
          maxCount: undefined,
          name: `${field}.1`
        }],
        count: 2,
        visibleCount: 2,
        collection: collection
      }

      collection.insert(arrayTracker.info[formId][field].array[0])
      collection.insert(arrayTracker.info[formId][field].array[1])

      // ignore if min count is reached
      stub(ArrayTracker.prototype, 'getMinMax', () => ({ minCount: 2 }))
      arrayTracker.removeFromFieldAtIndex(formId, field, 1)

      expect(arrayTracker.info[formId][field].collection.find().count()).to.equal(2)
      expect(arrayTracker.info[formId][field].array.length).to.equal(2)
      expect(arrayTracker.info[formId][field].count).to.equal(2)
      expect(arrayTracker.info[formId][field].visibleCount).to.equal(2)
      expect(arrayTracker.info[formId][field].array[1].removed).to.equal(undefined)

      // decrease if min count is not reached
      overrideStub(ArrayTracker.prototype, 'getMinMax', () => ({ minCount: 1 }))
      stub(Utility, 'getFieldDefinition', () => ({ type: String }))
      stub(AutoForm, 'resetValueCache', () => {})

      arrayTracker.removeFromFieldAtIndex(formId, field, 1)
      expect(arrayTracker.info[formId][field].collection.find().count()).to.equal(2)
      expect(arrayTracker.info[formId][field].array.length).to.equal(2)
      expect(arrayTracker.info[formId][field].count).to.equal(1)
      expect(arrayTracker.info[formId][field].visibleCount).to.equal(1)

      expect(arrayTracker.info[formId][field].array[1].removed).to.equal(true)

      const doc = collection.findOne({ index: 1 })
      expect(doc.removed).to.equal(true)
    })
    it('runs reactively', function (done) {
      const collection = new Mongo.Collection(null)
      arrayTracker.info[formId] = {}
      arrayTracker.info[formId][field] = {
        deps: new Tracker.Dependency(),
        array: [{
          formId: formId,
          arrayFieldName: field,
          index: 0,
          minCount: undefined,
          maxCount: undefined,
          name: `${field}.0`
        }, {
          formId: formId,
          arrayFieldName: field,
          index: 1,
          minCount: undefined,
          maxCount: undefined,
          name: `${field}.1`
        }],
        count: 2,
        visibleCount: 2,
        collection: collection
      }

      Tracker.autorun(() => {
        if (arrayTracker.getCount(formId, field) === 1) {
          done()
        }
      })

      setTimeout(() => {
        stub(ArrayTracker.prototype, 'getMinMax', () => ({ minCount: 1 }))
        stub(Utility, 'getFieldDefinition', () => ({ type: String }))
        stub(AutoForm, 'resetValueCache', () => {})

        arrayTracker.removeFromFieldAtIndex(formId, field, 1)
      }, 2)
    })
  })
})
