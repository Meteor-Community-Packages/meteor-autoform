/* global AutoForm */
import './utility.js'
import './autoform-validation.js'
import './autoform-hooks.js'
import './autoform-inputs.js'
import './autoform-api.js'
import { FormPreserve } from './form-preserve'
import { FormData } from './autoform-formdata'

AutoForm = AutoForm || {} // eslint-disable-line no-global-assign

// formPreserve is used to keep current form data across hot code
// reloads for any forms that are currently rendered
AutoForm.formPreserve = new FormPreserve('autoforms')

AutoForm.reactiveFormData = new FormData()

AutoForm._inputTypeDefinitions = {} // for storing input type definitions added by AutoForm.addInputType
AutoForm._formTypeDefinitions = {} // for storing submit type definitions added by AutoForm.addFormType

// Used by AutoForm._forceResetFormValues; temporary hack
AutoForm._destroyForm = {}

module.exports.AutoForm = AutoForm
