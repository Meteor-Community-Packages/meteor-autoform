> File: ["utility.js"](utility.js)
> Where: {client}

-

#### <a name="Utility.cleanNulls"></a>Utility.cleanNulls(doc)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __cleanNulls__ is defined in `Utility`*

__Arguments__

* __doc__ *{Object}*  
 Source object

-

__Returns__  *{Object}*


Returns an object in which all properties with null, undefined, or empty
string values have been removed, recursively.

> ```cleanNulls: function cleanNulls(doc, isArray, keepEmptyStrings) { ...``` [utility.js:11](utility.js#L11)

-

#### <a name="Utility.reportNulls"></a>Utility.reportNulls(flatDoc)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __reportNulls__ is defined in `Utility`*

__Arguments__

* __flatDoc__ *{Object}*  
 An object with no properties that are also objects.

-

__Returns__  *{Object}*
An object in which the keys represent the keys in the

original object that were null, undefined, or empty strings, and the value
of each key is "".

> ```reportNulls: function reportNulls(flatDoc, keepEmptyStrings) { ...``` [utility.js:40](utility.js#L40)

-

#### <a name="Utility.docToModifier"></a>Utility.docToModifier(doc)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __docToModifier__ is defined in `Utility`*

__Arguments__

* __doc__ *{Object}*  
 An object to be converted into a MongoDB modifier

-

__Returns__  *{Object}*
A MongoDB modifier.


Converts an object into a modifier by flattening it, putting keys with
null, undefined, and empty string values into `modifier.$unset`, and
putting the rest of the keys into `modifier.$set`.

> ```docToModifier: function docToModifier(doc, keepEmptyStrings) { ...``` [utility.js:69](utility.js#L69)

-

#### <a name="Utility.getSelectValues"></a>Utility.getSelectValues(select)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __getSelectValues__ is defined in `Utility`*

__Arguments__

* __select__ *{[Element](#Element)}*  
 DOM Element from which to get current values

-

__Returns__  *{string[]}*


Gets a string array of all the selected values in a given `select` DOM element.

> ```getSelectValues: function getSelectValues(select) { ...``` [utility.js:96](utility.js#L96)

-

#### <a name="Utility.maybeNum"></a>Utility.maybeNum(val)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __maybeNum__ is defined in `Utility`*

__Arguments__

* __val__ *{string}*  

-

__Returns__  *{String|Number}*


If the given string can be converted to a number, returns the number.
Otherwise returns the string.

> ```maybeNum: function maybeNum(val) { ...``` [utility.js:119](utility.js#L119)

-

#### <a name="Utility.lookup"></a>Utility.lookup(obj)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __lookup__ is defined in `Utility`*

__Arguments__

* __obj__ *{Any}*  

-

__Returns__  *{Any}*


If `obj` is a string, returns the value of the property with that
name on the `window` object. Otherwise returns `obj`.

> ```lookup: function lookup(obj) { ...``` [utility.js:137](utility.js#L137)

-

#### <a name="Utility.getDefs"></a>Utility.getDefs(ss, name)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __getDefs__ is defined in `Utility`*

__Arguments__

* __ss__ *{[SimpleSchema](#SimpleSchema)}*  
* __name__ *{String}*  

-

__Returns__  *{Object}*
Schema definitions object


Returns the schema definitions object from a SimpleSchema instance. Equivalent to calling
`ss.schema(name)` but handles throwing errors if `name` is not a string or is not a valid
field name for this SimpleSchema instance.

> ```getDefs: function getDefs(ss, name) { ...``` [utility.js:160](utility.js#L160)

-

#### <a name="Utility.objAffectsKey"></a>Utility.objAffectsKey({Object}, {String})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __objAffectsKey__ is defined in `Utility`*

__Arguments__

* __{Object}__ *{any}*  
obj
* __{String}__ *{any}*  
key

-

__Returns__  *{Boolean}*

__TODO__
```
* should make this a static method in MongoObject
```


> ```objAffectsKey: function objAffectsKey(obj, key) { ...``` [utility.js:178](utility.js#L178)

-

#### <a name="Utility.expandObj"></a>Utility.expandObj({Object})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __expandObj__ is defined in `Utility`*

__Arguments__

* __{Object}__ *{any}*  
doc

-

__Returns__  *{Object}*


Takes a flat object and returns an expanded version of it.

> ```expandObj: function expandObj(doc) { ...``` [utility.js:190](utility.js#L190)

-

#### <a name="Utility.compactArrays"></a>Utility.compactArrays({Object})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __compactArrays__ is defined in `Utility`*

__Arguments__

* __{Object}__ *{any}*  
obj

-

__Returns__  *{undefined}*


Edits the object by reference, compacting any arrays at any level recursively.

> ```compactArrays: function compactArrays(obj) { ...``` [utility.js:227](utility.js#L227)

-

#### <a name="Utility.bubbleEmpty"></a>Utility.bubbleEmpty({Object})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __bubbleEmpty__ is defined in `Utility`*

__Arguments__

* __{Object}__ *{any}*  
obj

-

__Returns__  *{undefined}*


Edits the object by reference.

> ```bubbleEmpty: function bubbleEmpty(obj, keepEmptyStrings) { ...``` [utility.js:250](utility.js#L250)

-

#### <a name="Utility.getSimpleSchemaFromContext"></a>Utility.getSimpleSchemaFromContext({Object})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __getSimpleSchemaFromContext__ is defined in `Utility`*

__Arguments__

* __{Object}__ *{any}*  
context

-

__Returns__  *{SimpleSchema}*


Given a context object that may or may not have schema and collection properties,
returns a SimpleSchema instance or throws an error if one cannot be obtained.

> ```getSimpleSchemaFromContext: function getSimpleSchemaFromContext(context, formId) { ...``` [utility.js:280](utility.js#L280)

-

#### <a name="Utility.isNullUndefinedOrEmptyString"></a>Utility.isNullUndefinedOrEmptyString({Any})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __isNullUndefinedOrEmptyString__ is defined in `Utility`*

__Arguments__

* __{Any}__ *{any}*  
val

-

__Returns__  *{Boolean}*


Returns `true` if the value is null, undefined, or an empty string

> ```isNullUndefinedOrEmptyString: function isNullUndefinedOrEmptyString(val) { ...``` [utility.js:310](utility.js#L310)

-

#### <a name="Utility.isValidDateString"></a>Utility.isValidDateString({String})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __isValidDateString__ is defined in `Utility`*

__Arguments__

* __{String}__ *{any}*  
 dateString

-

__Returns__  *{Boolean}*


Returns `true` if dateString is a "valid date string"

> ```isValidDateString: function isValidDateString(dateString) { ...``` [utility.js:321](utility.js#L321)

-

#### <a name="Utility.isValidTimeString"></a>Utility.isValidTimeString({String})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __isValidTimeString__ is defined in `Utility`*

__Arguments__

* __{String}__ *{any}*  
 timeString

-

__Returns__  *{Boolean}*


Returns `true` if timeString is a "valid time string"

> ```isValidTimeString: function isValidTimeString(timeString) { ...``` [utility.js:333](utility.js#L333)

-

#### <a name=""></a>({Date})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*

__Arguments__

* __{Date}__ *{any}*  
date

-

__Returns__  *{String}*


Returns a "valid date string" representing the local date.

> ```dateToDateString: function dateToDateString(date) { ...``` [utility.js:350](utility.js#L350)

-

#### <a name=""></a>({Date})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*

__Arguments__

* __{Date}__ *{any}*  
date

-

__Returns__  *{String}*


Returns a "valid date string" representing the date converted to the UTC time zone.

> ```dateToDateStringUTC: function dateToDateStringUTC(date) { ...``` [utility.js:369](utility.js#L369)

-

#### <a name=""></a>({Date})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*

__Arguments__

* __{Date}__ *{any}*  
date

-

__Returns__  *{String}*


Returns a "valid normalized forced-UTC global date and time string" representing the time
converted to the UTC time zone and expressed as the shortest possible string for the given
time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute).

http:
http:

> ```dateToNormalizedForcedUtcGlobalDateAndTimeString: function dateToNormalizedForcedUtcGlobalDateAndTimeString(date) { ...``` [utility.js:393](utility.js#L393)

-

#### <a name=""></a>({String})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*

__Arguments__

* __{String}__ *{any}*  
dateString

-

__Returns__  *{Boolean}*


Returns true if dateString is a "valid normalized forced-UTC global date and time string"

> ```isValidNormalizedForcedUtcGlobalDateAndTimeString: function isValidNormalizedForcedUtcGlobalDateAndTimeString(dateString) { ...``` [utility.js:404](utility.js#L404)

-

#### <a name="Utility.dateToNormalizedLocalDateAndTimeString"></a>Utility.dateToNormalizedLocalDateAndTimeString(date, [timezoneId])&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __dateToNormalizedLocalDateAndTimeString__ is defined in `Utility`*

__Arguments__

* __date__ *{[Date](#Date)}*  
The Date object
* __timezoneId__ *{String}*    (Optional)
A valid timezoneId that moment-timezone understands, e.g., "America/Los_Angeles"

-

__Returns__  *{String}*


Returns a "valid normalized local date and time string".

> ```dateToNormalizedLocalDateAndTimeString: function dateToNormalizedLocalDateAndTimeString(date, timezoneId) { ...``` [utility.js:423](utility.js#L423)

-

#### <a name=""></a>({String})&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*

__Arguments__

* __{String}__ *{any}*  
dtString

-

__Returns__  *{Boolean}*


Returns true if dtString is a "valid normalized local date and time string"

> ```isValidNormalizedLocalDateAndTimeString: function isValidNormalizedLocalDateAndTimeString(dtString) { ...``` [utility.js:443](utility.js#L443)

-

#### <a name="Utility.normalizeContext"></a>Utility.normalizeContext({Object}, name)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __normalizeContext__ is defined in `Utility`*

__Arguments__

* __{Object}__ *{any}*  
context A context object, potentially with an `atts` or `autoform` property.
* __name__ *{String}*  
The name of the helper or component we're calling from, for in a potential error message.

-

__Returns__  *{Object}*
Normalized context object


Returns an object with `afc`, `af`, and `atts` properties, normalized from whatever object is passed in.
This helps deal with the fact that we have to pass the ancestor autoform's context to different
helpers and components in different ways, but in all cases we want to get access to it and throw
an error if we can't find an autoform context.

> ```normalizeContext: function autoFormNormalizeContext(context, name) { ...``` [utility.js:464](utility.js#L464)

-

#### <a name="Utility.stringToArray"></a>Utility.stringToArray(A)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*
*This method __stringToArray__ is defined in `Utility`*

__Arguments__

* __A__ *{String|Array}*  
variable that might be a string or an array.

-

__Returns__  *{Array}*
The array, building it from a comma-delimited string if necessary.


> ```stringToArray: function stringToArray(s, errorMessage) { ...``` [utility.js:515](utility.js#L515)

-

#### <a name="isBasicObject"></a>isBasicObject(obj)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
```
Tests whether "obj" is an Object as opposed to
something that inherits from Object
```
-
*This method is private*

__Arguments__

* __obj__ *{any}*  

-

__Returns__  *{Boolean}*


> ```var isBasicObject = function(obj) { ...``` [utility.js:547](utility.js#L547)

-


---
> File: ["form-preserve.js"](form-preserve.js)
> Where: {client}

-

#### <a name="FormPreserve"></a>new FormPreserve(migrationName)&nbsp;&nbsp;<sub><i>Client</i></sub> ####
-
*This method is private*

__Arguments__

* __migrationName__ *{String}*  

-


Internal helper object to preserve form inputs across Hot Code Push
and across "pages" navigation if the option is enabled.

> ```FormPreserve = function formPreserveConstructor(migrationName) { ...``` [form-preserve.js:9](form-preserve.js#L9)

-


---
> File: ["autoform.js"](autoform.js)
> Where: {client}

-

#### <a name=""></a>&nbsp;&nbsp;<sub><i>undefined</i></sub> ####
```
Gets the value that should be shown/selected in the input. Returns
a string, a boolean, or an array of strings. The value used,
in order of preference, is one of:
* The `value` attribute provided
* The value that is set in the `doc` provided on the containing autoForm
* The `defaultValue` from the schema
```
-

> ```function getInputValue(name, atts, expectsArray, inputType, value, mDoc, defaultValue) { ...``` [autoform.js:541](autoform.js#L541)

-


---
> File: ["autoform-api.js"](autoform-api.js)
> Where: {client}

-

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
