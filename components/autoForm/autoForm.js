var contextDependency = new Tracker.Dependency();

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
    var formId = this.id || defaultFormId;

    contextDependency.depend();

    // Set up the context to be used for everything within the autoform.
    var innerContext = {_af: formData[formId]};

    // Preserve outer context, allowing access within autoForm block without needing ..
    _.extend(innerContext, outerContext);
    return innerContext;
  },
  afDestroyUpdateForm: function () {
    return afDestroyUpdateForm.get();
  }
});

Template.autoForm.created = function autoFormCreated() {
  var template = this;

  template.autorun(function () {
    var data = Template.currentData(); // rerun when current data changes
    var formId = data.id || defaultFormId;

    // rerun when manually invalidated
    if (!formDeps[formId]) {
      formDeps[formId] = new Tracker.Dependency();
    }
    formDeps[formId].depend();

    // cache template instance for lookup by formId
    templatesById[formId] = template;

    // When we change the form, loading a different doc, reloading the current doc, etc.,
    // we also want to reset the array counts for the form
    arrayTracker.resetForm(formId);

    var collection = AutoForm.Utility.lookup(data.collection);
    var ss = AutoForm.Utility.getSimpleSchemaFromContext(data, formId);

    // Clone the doc so that docToForm and other modifications do not change
    // the original referenced object.
    var doc = data.doc ? EJSON.clone(data.doc) : null;

    // Update cached form values for hot code reload persistence
    if (data.preserveForm === false) {
      formPreserve.unregisterForm(formId);
    } else if (!formPreserve.formIsRegistered(formId)) {
      formPreserve.registerForm(formId, function autoFormRegFormCallback() {
        return getFormValues(template, formId, ss).insertDoc;
      });
    }

    // Retain doc values after a "hot code push", if possible
    var retrievedDoc = formPreserve.getDocument(formId);
    if (retrievedDoc !== false) {
      // Ensure we keep the _id property which may not be present in retrievedDoc.
      doc = _.extend(doc || {}, retrievedDoc);
    }

    var mDoc;
    if (doc && !_.isEmpty(doc)) {
      var hookCtx = {formId: formId};
      // Pass doc through docToForm hooks
      _.each(Hooks.getHooks(formId, 'docToForm'), function autoFormEachDocToForm(hook) {
        doc = hook.call(hookCtx, doc, ss, formId);
      });
      // Create a "flat doc" that can be used to easily get values for corresponding
      // form fields.
      mDoc = new MongoObject(doc);
      fd.sourceDoc(formId, mDoc);
    } else {
      fd.sourceDoc(formId, null);
    }

    // Check autosave
    var autosave, resetOnSuccess;
    if (data.autosave === true && data.type === "update") {
      // Autosave and never reset on success
      autosave = true;
      resetOnSuccess = false;
    } else {
      autosave = false;
      resetOnSuccess = data.resetOnSuccess;
    }

    // Cache form data for lookup by form ID
    formData[formId] = {
      formId: formId,
      collection: collection,
      ss: ss,
      ssIsOverride: !!collection && !!data.schema,
      doc: doc,
      mDoc: mDoc,
      validationType: (data.validation == null ? "submitThenKeyup" : data.validation),
      submitType: data.type,
      submitMethod: data.meteormethod,
      resetOnSuccess: resetOnSuccess,
      autosave: autosave,
      filter: data.filter,
      autoConvert: data.autoConvert,
      removeEmptyStrings: data.removeEmptyStrings,
      trimStrings: data.trimStrings
    };
    formStates[formId] = formStates[formId]  || new ReactiveVar("pristine");
    formStates[formId].set("pristine");

    // This ensures that anything dependent on field values will properly
    // react to field values set from the database document. That is,
    // computations dependent on AutoForm.getFieldValue will rerun properly
    // when the form is initially rendered using values from `doc`.
    setTimeout(function () {
      updateAllTrackedFieldValues(formId);
    }, 0);

    contextDependency.changed();
  });
};

Template.autoForm.destroyed = function autoFormDestroyed() {
  var self = this;
  var formId = self.data.id || defaultFormId;

  // TODO if formId was changing reactively during life of instance,
  // some data won't be removed by the calls below.

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
