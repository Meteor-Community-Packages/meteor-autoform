/* global AutoForm:true, FormPreserve */

AutoForm = AutoForm || {};

// formPreserve is used to keep current form data across hot code
// reloads for any forms that are currently rendered
AutoForm.formPreserve = new FormPreserve("autoforms");

// In formDocs, we store the MongoObject version of the document that was attached
// to a form, keyed by form `id`. This is reactive, but is not persisted across hot
// code pushes.
AutoForm.reactiveFormData = new FormData();

formValues = {}; //for reactive show/hide based on current value of a field
formDeps = {}; //for invalidating the form inner context and causing rerender
inputTypeDefinitions = {}; //for storing input type definitions added by AutoForm.addInputType

arrayTracker = new ArrayTracker();
componentTypeList = ['afArrayField', 'afEachArrayItem', 'afFieldInput', 'afFormGroup', 'afObjectField', 'afQuickField', 'afQuickFields', 'autoForm', 'quickForm'];

// backwards compatibility
if (typeof Tracker === "undefined" && typeof Deps !== "undefined") {
  Tracker = Deps;
}

afDestroyUpdateForm = new ReactiveVar(false);

// reactive templates
globalDefaultTemplate = "bootstrap3";
defaultTypeTemplates = {};
deps = {
  defaultTemplate: new Tracker.Dependency(),
  defaultTypeTemplates: {}
};
