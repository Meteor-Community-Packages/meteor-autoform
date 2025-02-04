/* global Package */
import { EJSON } from 'meteor/ejson'

/**
 * Internal helper object to preserve form inputs across Hot Code Push
 * and across "pages" navigation if the option is enabled.
 */
export class FormPreserve {
  /**
   * @constructor
   * @param {String} migrationName
   */
  constructor (migrationName) {
    const self = this
    if (typeof migrationName !== 'string') {
      throw Error('You must define an unique migration name of type String')
    }
    self.registeredForms = {}
    self.retrievedDocuments = {}
    if (Package.reload) {
      const Reload = Package.reload.Reload
      self.retrievedDocuments = Reload._migrationData(migrationName) || '{}'

      // Currently migration does not seem to support proper storage
      // of Date type. It comes back as a string, so we need to store
      // EJSON instead.
      if (typeof self.retrievedDocuments === 'string') {
        self.retrievedDocuments = EJSON.parse(self.retrievedDocuments)
      }

      Reload._onMigrate(migrationName, function () {
        const doc = self._retrieveRegisteredDocuments()
        return [true, EJSON.stringify(doc)]
      })
    }
  }

  getDocument (formId) {
    const self = this
    if (!(formId in self.retrievedDocuments)) {
      return false
    }

    return self.retrievedDocuments[formId]
  }

  clearDocument (formId) {
    delete this.retrievedDocuments[formId]
  }

  registerForm (formId, retrieveFunc) {
    this.registeredForms[formId] = retrieveFunc
  }

  formIsRegistered (formId) {
    return !!this.registeredForms[formId]
  }

  unregisterForm (formId) {
    delete this.registeredForms[formId]
    delete this.retrievedDocuments[formId]
  }

  unregisterAllForms () {
    const self = this
    self.registeredForms = {}
    self.retrievedDocuments = {}
  }

  _retrieveRegisteredDocuments () {
    const self = this
    const res = {}
    Object
      .entries(self.registeredForms)
      .forEach(function ([formId, retrieveFunc]) {
        res[formId] = retrieveFunc()
      })
    return res
  }
}
