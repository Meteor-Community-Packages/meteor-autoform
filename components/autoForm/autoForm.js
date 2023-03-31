import MongoObject from 'mongo-object';

/* global AutoForm, ReactiveVar, arrayTracker, Hooks, Utility, setDefaults */
import { Template } from 'meteor/templating'
import { EJSON } from 'meteor/ejson'
import MongoObject from 'mongo-object'
import { isObject, isFunction } from '../../common'
import { Hooks } from '../../autoform-hooks'
import { Utility } from '../../utility'

Template.autoForm.helpers({
  atts: function autoFormTplAtts () {
    // After removing all of the props we know about, everything else should
    // become a form attribute unless it's an array or object.
    let val
    const htmlAttributes = {}
    const context = this
    const removeProps = [
      'schema',
      'collection',
      'validation',
      'doc',
      'resetOnSuccess',
      'type',
      'template',
      'autosave',
      'autosaveOnKeyup',
      'meteormethod',
      'methodargs',
      'filter',
      'autoConvert',
      'removeEmptyStrings',
      'trimStrings'
    ]

    // Filter out any attributes that have a component prefix
    function hasComponentPrefix (prop) {
      return Utility.componentTypeList.some(function (componentType) {
        return prop.indexOf(componentType + '-') === 0
      })
    }

    // Filter out arrays and objects and functions, which are obviously not meant to be
    // HTML attributes.
    for (const prop in context) {
      if (
        Object.prototype.hasOwnProperty.call(context, prop) &&
        !removeProps.includes(prop) &&
        !hasComponentPrefix(prop)
      ) {
        val = context[prop]
        if (!Array.isArray(val) && !isObject(val) && !isFunction(val)) {
          htmlAttributes[prop] = val
        }
      }
    }

    // By default, we add the `novalidate="novalidate"` attribute to our form,
    // unless the user passes `validation="browser"`.
    if (this.validation !== 'browser' && !htmlAttributes.novalidate) {
      htmlAttributes.novalidate = 'novalidate'
    }

    return htmlAttributes
  },
  afDestroyUpdateForm: function (formId) {
    AutoForm._destroyForm[formId] =
      AutoForm._destroyForm[formId] || new ReactiveVar(false)
    return AutoForm._destroyForm[formId].get()
  }
})

Template.autoForm.created = function autoFormCreated () {
  const template = this

  // We'll add tracker dependencies for reactive field values
  // to this object as necessary
  template.formValues = template.formValues || {}

  // We'll store "sticky" errors here. These are errors added
  // manually based on server validation, which we don't want to
  // be wiped out by further client validation.
  template._stickyErrors = {}

  template.autorun(function (c) {
    let data = Template.currentData() // rerun when current data changes
    const formId = data.id

    if (!formId) {
      throw new Error(
        'Every autoForm and quickForm must have an "id" attribute set to a unique string.'
      )
    }

    // When we change the form, loading a different doc, reloading the current doc, etc.,
    // we also want to reset the array counts for the form
    arrayTracker.resetForm(formId)
    // and the stored last key value for the form
    delete AutoForm._lastKeyVals[formId]

    data = setDefaults(data)

    // Clone the doc so that docToForm and other modifications do not change
    // the original referenced object.
    let doc = data.doc ? EJSON.clone(data.doc) : null

    // Update cached form values for hot code reload persistence
    if (data.preserveForm === false) {
      AutoForm.formPreserve.unregisterForm(formId)
    }
    else {
      // Even if we have already registered, we reregister to ensure that the
      // closure values of template, formId, and ss remain correct after each
      // reaction
      AutoForm.formPreserve.registerForm(
        formId,
        function autoFormRegFormCallback () {
          return AutoForm.getFormValues(
            formId,
            template,
            data._resolvedSchema,
            false
          )
        }
      )
    }

    // Retain doc values after a "hot code push", if possible
    if (c.firstRun) {
      const retrievedDoc = AutoForm.formPreserve.getDocument(formId)
      if (retrievedDoc !== false) {
        // Ensure we keep the _id property which may not be present in retrievedDoc.
        doc = { ...doc, ...retrievedDoc }
      }
    }

    let mDoc
    if (doc && Object.keys(doc).length) {
      const hookCtx = { formId: formId }
      // Pass doc through docToForm hooks
      Hooks.getHooks(formId, 'docToForm').forEach(
        function autoFormEachDocToForm (hook) {
          doc = hook.call(hookCtx, doc, data._resolvedSchema)
          if (!doc) {
            throw new Error(
              'Oops! Did you forget to return the modified document from your docToForm hook for the ' +
                formId +
                ' form?'
            )
          }
        }
      )

      // Create a "flat doc" that can be used to easily get values for corresponding
      // form fields.
      mDoc = new MongoObject(doc)
      AutoForm.reactiveFormData.sourceDoc(formId, mDoc)
    }
    else {
      AutoForm.reactiveFormData.sourceDoc(formId, undefined)
    }
  })
}

Template.autoForm.rendered = function autoFormRendered () {
  let lastId
  this.autorun(function () {
    const data = Template.currentData() // rerun when current data changes

    if (data.id === lastId) return
    lastId = data.id

    AutoForm.triggerFormRenderedDestroyedReruns(data.id)
  })
}

Template.autoForm.destroyed = function autoFormDestroyed () {
  const self = this
  const formId = self.data.id

  // TODO if formId was changing reactively during life of instance,
  // some data won't be removed by the calls below.

  // Remove from array fields list
  arrayTracker.untrackForm(formId)

  // Unregister form preservation
  AutoForm.formPreserve.unregisterForm(formId)

  // Trigger value reruns
  AutoForm.triggerFormRenderedDestroyedReruns(formId)
}
