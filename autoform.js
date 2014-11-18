defaultFormId = "_afGenericID";
formPreserve = new FormPreserve("autoforms");
formData = {}; //for looking up autoform data by form ID
templatesById = {}; //keep a reference of autoForm templates by form `id` for AutoForm.getFormValues
formValues = {}; //for reactive show/hide based on current value of a field
formDeps = {}; //for invalidating the form inner context and causing rerender
inputTypeDefinitions = {}; //for storing input type definitions added by AutoForm.addInputType
fd = new FormData();
arrayTracker = new ArrayTracker();
componentTypeList = ['afArrayField', 'afEachArrayItem', 'afFieldInput', 'afFormGroup', 'afObjectField', 'afQuickField', 'afQuickFields', 'autoForm', 'quickForm'];

// backwards compatibility
if (typeof Tracker === "undefined" && typeof Deps !== "undefined") {
  Tracker = Deps;
}

// reactive templates
globalDefaultTemplate = "bootstrap3"
defaultTypeTemplates = {};
deps = {
  defaultTemplate: new Tracker.Dependency,
  defaultTypeTemplates: {}
};
