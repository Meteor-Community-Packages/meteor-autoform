/* global AutoForm */
import { Tracker } from 'meteor/tracker'
import { FormPreserve } from './form-preserve'
import { FormData } from './autoform-formdata'
import { ArrayTracker } from './autoform-arrays'

AutoForm = AutoForm || {} // eslint-disable-line no-global-assign

// formPreserve is used to keep current form data across hot code
// reloads for any forms that are currently rendered
AutoForm.formPreserve = new FormPreserve('autoforms')

AutoForm.reactiveFormData = new FormData()

AutoForm._inputTypeDefinitions = {} // for storing input type definitions added by AutoForm.addInputType
AutoForm._formTypeDefinitions = {} // for storing submit type definitions added by AutoForm.addFormType

arrayTracker = new ArrayTracker() // eslint-disable-line no-global-assign

// Used by AutoForm._forceResetFormValues; temporary hack
AutoForm._destroyForm = {}

// reactive templates
globalDefaultTemplate = 'bootstrap3' // eslint-disable-line no-global-assign
defaultTypeTemplates = {} // eslint-disable-line no-global-assign
deps = { // eslint-disable-line no-global-assign
  defaultTemplate: new Tracker.Dependency(),
  defaultTypeTemplates: {}
}
