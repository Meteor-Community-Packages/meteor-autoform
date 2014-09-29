
#### <a name="AutoForm.addHooks"></a>AutoForm.addHooks(formIds, hooks)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __addHooks__ is defined in `AutoForm`*

__Arguments__

* __formIds__ *{[String[]](#String[])|String|null}*  
Form `id` or array of form IDs to which these hooks apply. Specify `null` to add hooks that will run for every form.
* __hooks__ *{Object}*  
Hooks to add, where supported names are "before", "after", "formToDoc", "docToForm", "onSubmit", "onSuccess", and "onError".

-

__Returns__  *{undefined}*


Defines hooks to be used by one or more forms. Extends hooks lists if called multiple times for the same
form.

> ```AutoForm.addHooks = function autoFormAddHooks(formIds, hooks, replace) { ...``` [autoform-api.js:15](autoform-api.js#L15)

-

#### <a name="AutoForm.hooks"></a>AutoForm.hooks(hooks)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __hooks__ is defined in `AutoForm`*

__Arguments__

* __hooks__ *{Object}*  

-

__Returns__  *{undefined}*


Defines hooks by form id. Extends hooks lists if called multiple times for the same
form.

> ```AutoForm.hooks = function autoFormHooks(hooks, replace) { ...``` [autoform-api.js:53](autoform-api.js#L53)

-

#### <a name="AutoForm.resetForm"></a>AutoForm.resetForm(formId, [template])&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __resetForm__ is defined in `AutoForm`*

__Arguments__

* __formId__ *{String}*  
* __template__ *{[TemplateInstance](#TemplateInstance)}*    (Optional)
Looked up if not provided. Pass in for efficiency.

-

__Returns__  *{undefined}*


Resets an autoform, including resetting validation errors. The same as clicking the reset button for an autoform.

> ```AutoForm.resetForm = function autoFormResetForm(formId, template) { ...``` [autoform-api.js:68](autoform-api.js#L68)

-

#### <a name="AutoForm.setDefaultTemplate"></a>AutoForm.setDefaultTemplate(template)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __setDefaultTemplate__ is defined in `AutoForm`*

__Arguments__

* __template__ *{String}*  

-


> ```AutoForm.setDefaultTemplate = function autoFormSetDefaultTemplate(template) { ...``` [autoform-api.js:80](autoform-api.js#L80)

-

#### <a name="AutoForm.getDefaultTemplate"></a>AutoForm.getDefaultTemplate()&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __getDefaultTemplate__ is defined in `AutoForm`*


Reactive.

> ```AutoForm.getDefaultTemplate = function autoFormGetDefaultTemplate() { ...``` [autoform-api.js:91](autoform-api.js#L91)

-

#### <a name="AutoForm.setDefaultTemplateForType"></a>AutoForm.setDefaultTemplateForType(type, template)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __setDefaultTemplateForType__ is defined in `AutoForm`*

__Arguments__

* __type__ *{String}*  
* __template__ *{String}*  

-


> ```AutoForm.setDefaultTemplateForType = function autoFormSetDefaultTemplateForType(type, template) { ...``` [autoform-api.js:102](autoform-api.js#L102)

-

#### <a name="AutoForm.getDefaultTemplateForType"></a>AutoForm.getDefaultTemplateForType(type)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __getDefaultTemplateForType__ is defined in `AutoForm`*

__Arguments__

* __type__ *{String}*  

-

__Returns__  *{String}*
Template name


Reactive.

> ```AutoForm.getDefaultTemplateForType = function autoFormGetDefaultTemplateForType(type) { ...``` [autoform-api.js:121](autoform-api.js#L121)

-

#### <a name="AutoForm.getFormValues"></a>AutoForm.getFormValues(formId)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __getFormValues__ is defined in `AutoForm`*

__Arguments__

* __formId__ *{String}*  
The `id` attribute of the `autoForm` you want current values for.

-

__Returns__  *{Object}*


Returns an object representing the current values of all schema-based fields in the form.
The returned object contains two properties, "insertDoc" and "updateDoc", which represent
the field values as a normal object and as a MongoDB modifier, respectively.

> ```AutoForm.getFormValues = function autoFormGetFormValues(formId) { ...``` [autoform-api.js:139](autoform-api.js#L139)

-

#### <a name="AutoForm.getFieldValue"></a>AutoForm.getFieldValue(formId, fieldName)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __getFieldValue__ is defined in `AutoForm`*

__Arguments__

* __formId__ *{String}*  
The `id` attribute of the `autoForm` you want current values for.
* __fieldName__ *{String}*  
The name of the field for which you want the current value.

-

__Returns__  *{Any}*


Returns the value of the field (the value that would be used if the form were submitted right now).
This is a reactive method that will rerun whenever the current value of the requested field changes.

> ```AutoForm.getFieldValue = function autoFormGetFieldValue(formId, fieldName) { ...``` [autoform-api.js:161](autoform-api.js#L161)

-

#### <a name="AutoForm.inputValueHandlers"></a>AutoForm.inputValueHandlers(handlers)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __inputValueHandlers__ is defined in `AutoForm`*

__Arguments__

* __handlers__ *{Object}*  
An object defining one or more selectors with corresponding handler function.

-

__Returns__  *{undefined}*


Use this method to add custom input value handlers, which will be checked before
the built-in handlers.

> ```AutoForm.inputValueHandlers = function afInputValueHandlers(handlers) { ...``` [autoform-api.js:177](autoform-api.js#L177)

-

#### <a name="AutoForm.validateField"></a>AutoForm.validateField(formId, fieldName, [skipEmpty])&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __validateField__ is defined in `AutoForm`*

__Arguments__

* __formId__ *{String}*  
The `id` attribute of the `autoForm` you want to validate.
* __fieldName__ *{String}*  
The name of the field within the `autoForm` you want to validate.
* __skipEmpty__ *{Boolean}*    (Optional = false)
Set to `true` to skip validation if the field has no value. Useful for preventing `required` errors in form fields that the user has not yet filled out.

-

__Returns__  *{Boolean}*
Is it valid?


In addition to returning a boolean that indicates whether the field is currently valid,
this method causes the reactive validation messages to appear.

> ```AutoForm.validateField = function autoFormValidateField(formId, fieldName, skipEmpty) { ...``` [autoform-api.js:192](autoform-api.js#L192)

-

#### <a name="AutoForm.validateForm"></a>AutoForm.validateForm(formId)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __validateForm__ is defined in `AutoForm`*

__Arguments__

* __formId__ *{String}*  
The `id` attribute of the `autoForm` you want to validate.

-

__Returns__  *{Boolean}*
Is it valid?


In addition to returning a boolean that indicates whether the form is currently valid,
this method causes the reactive validation messages to appear.

> ```AutoForm.validateForm = function autoFormValidateForm(formId) { ...``` [autoform-api.js:210](autoform-api.js#L210)

-

#### <a name="AutoForm.getValidationContext"></a>AutoForm.getValidationContext(formId)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __getValidationContext__ is defined in `AutoForm`*

__Arguments__

* __formId__ *{String}*  
The `id` attribute of the `autoForm` for which you want the validation context

-

__Returns__  *{SimpleSchemaValidationContext}*
The SimpleSchema validation context object.


Use this method to get the validation context, which can be used to check
the current invalid fields, manually invalidate fields, etc.

> ```AutoForm.getValidationContext = function autoFormGetValidationContext(formId) { ...``` [autoform-api.js:243](autoform-api.js#L243)

-

#### <a name="AutoForm.find"></a>AutoForm.find()&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __find__ is defined in `AutoForm`*

__Returns__  *{Object}*
The data context for the closest autoform.


Call this method from a UI helper to get the data context for the closest autoform.

> ```AutoForm.find = function autoFormFind(type) { ...``` [autoform-api.js:258](autoform-api.js#L258)

-

#### <a name="AutoForm.debug"></a>AutoForm.debug()&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method __debug__ is defined in `AutoForm`*


Call this method in client code while developing to turn on extra logging.

> ```AutoForm.debug = function autoFormDebug() { ...``` [autoform-api.js:275](autoform-api.js#L275)

-

#### <a name="AutoForm.arrayTracker"></a>AutoForm.arrayTracker {function}&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This property __arrayTracker__ is defined in `AutoForm`*

__Returns__  *{ArrayTracker}*



> ```AutoForm.arrayTracker = arrayTracker;``` [autoform-api.js:290](autoform-api.js#L290)

-
