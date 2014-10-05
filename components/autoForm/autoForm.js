Template.autoForm.helpers({
  atts: function autoFormTplAtts() {
    var context = _.clone(this);

    // By default, we add the `novalidate="novalidate"` attribute to our form,
    // unless the user passes `validation="browser"`.
    if (context.validation !== "browser" && !context.novalidate) {
      context.novalidate = "novalidate";
    }
    // After removing all of the props we know about, everything else should
    // become a form attribute.
    // XXX Would be better to use a whitelist of HTML attributes allowed on form elements
    return _.omit(context, "schema", "collection", "validation", "doc", "resetOnSuccess",
        "type", "template", "autosave", "meteormethod", "filter", "autoConvert", "removeEmptyStrings", "trimStrings");
  },
  innerContext: function autoFormTplContext(outerContext) {
    var context = this;
    var formId = context.id || defaultFormId;
    var collection = Utility.lookup(context.collection);
    var ss = Utility.getSimpleSchemaFromContext(context, formId);

    // Retain doc values after a "hot code push", if possible
    var retrievedDoc = formPreserve.getDocument(formId);
    if (retrievedDoc !== false) {
      // Ensure we keep the _id property which may not be present in retrievedDoc.
      context.doc = _.extend({}, context.doc || {}, retrievedDoc);
    }

    var mDoc;
    if (context.doc && !_.isEmpty(context.doc)) {
      // Clone doc
      var copy = _.clone(context.doc);
      var hookCtx = {formId: formId};
      // Pass doc through docToForm hooks
      _.each(Hooks.getHooks(formId, 'docToForm'), function autoFormEachDocToForm(hook) {
        copy = hook.call(hookCtx, copy, ss, formId);
      });
      // Create a "flat doc" that can be used to easily get values for corresponding
      // form fields.
      mDoc = new MongoObject(copy);
      fd.sourceDoc(formId, mDoc);
    } else {
      fd.sourceDoc(formId, null);
    }

    // Check autosave
    var autosave, resetOnSuccess;
    if (context.autosave === true && context.type === "update") {
      // Autosave and never reset on success
      autosave = true;
      resetOnSuccess = false;
    } else {
      autosave = false;
      resetOnSuccess = context.resetOnSuccess;
    }

    // Set up the context to be used for everything within the autoform.
    var innerContext = {_af: {
      formId: formId,
      collection: collection,
      ss: ss,
      ssIsOverride: !!collection && !!context.schema,
      doc: context.doc || null,
      mDoc: mDoc,
      validationType: (context.validation == null ? "submitThenKeyup" : context.validation),
      submitType: context.type,
      submitMethod: context.meteormethod,
      resetOnSuccess: resetOnSuccess,
      autosave: autosave,
      filter: context.filter,
      autoConvert: context.autoConvert,
      removeEmptyStrings: context.removeEmptyStrings,
      trimStrings: context.trimStrings
    }};

    // Cache context for lookup by formId
    formData[formId] = innerContext._af;

    // When we change the form, loading a different doc, reloading the current doc, etc.,
    // we also want to reset the array counts for the form
    arrayTracker.resetForm(formId);

    // Preserve outer context, allowing access within autoForm block without needing ..
    _.extend(innerContext, outerContext);
    return innerContext;
  }
});

Template.autoForm.created = function autoFormCreated() {
  var self = this;
  var formId = self.data.id || defaultFormId;
  // Add to templatesById list
  templatesById[formId] = self;
};

Template.autoForm.destroyed = function autoFormDestroyed() {
  var self = this;
  self._notInDOM = true;
  var formId = self.data.id || defaultFormId;

  // Remove from templatesById list
  if (templatesById[formId]) {
    delete templatesById[formId];
  }

  // Remove from data list
  if (formData[formId]) {
    delete formData[formId];
  }

  // Remove from array fields list
  arrayTracker.untrackForm(formId);

  // Remove from field values
  if (formValues[formId]) {
    delete formValues[formId];
  }

  // Unregister form preservation
  formPreserve.unregisterForm(formId);
};