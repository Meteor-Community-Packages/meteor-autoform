import { Hooks } from '../autoform-hooks'
/* global AutoForm */

AutoForm.addFormType('normal', {
  onSubmit: function () {
    const ctx = this

    // Get onSubmit hooks
    // These are called differently from the before hooks because
    // they run async, but they can run in parallel and we need the
    // result of all of them immediately because they can return
    // false to stop normal form submission.
    const hooks = Hooks.getHooks(this.formId, 'onSubmit')

    const hookCount = hooks.length
    let doneCount = 0
    let submitError
    let submitResult

    if (hookCount === 0) {
      // we haven't called preventDefault, so normal browser
      // submission will now happen
      this.endSubmission()
      return
    }

    // Set up onSubmit hook context
    const onSubmitCtx = {
      done: function (error, result) {
        doneCount++
        if (!submitError && error) {
          submitError = error
        }
        if (!submitResult && result) {
          submitResult = result
        }
        if (doneCount === hookCount) {
          // run onError, onSuccess, endSubmit
          ctx.result(submitError, submitResult)
        }
      },
      ...this.hookContext
    }

    // Call all hooks at once.
    // Pass both types of doc plus the doc attached to the form.
    // If any return false, we stop normal submission, but we don't
    // run onError, onSuccess, endSubmit hooks until they all call this.done().
    let shouldStop = false
    hooks.forEach(function eachOnSubmit (hook) {
      const result = hook.call(onSubmitCtx, ctx.insertDoc, ctx.updateDoc, ctx.currentDoc)
      if (shouldStop === false && result === false) {
        shouldStop = true
      }
    })
    if (shouldStop) {
      this.event.preventDefault()
      this.event.stopPropagation()
    }
  },
  needsModifierAndDoc: true,
  validateForm: function () {
    // Get SimpleSchema
    const formSchema = AutoForm.getFormSchema(this.form.id)
    // Validate
    return AutoForm._validateFormDoc(this.formDoc.insertDoc, false, this.form.id, formSchema, this.form)
  }
})
