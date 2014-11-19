AutoForm
=========================

AutoForm is a smart package for Meteor that adds handlebars helpers to easily create basic
forms with automatic insert and update events, and automatic reactive validation.

## Change Log

### 4.0.2 - 4.0.6

Several fixes

### 4.0.1

Bug fix

### 4.0.0

This is a significant rewrite, and there are a number of changes that are not backwards compatible. The primary reason for the rewrite is to enable easier creation of custom form input types (autoform widgets) that can be provided by add-on packages. Some changes were also made to cut out features that were not providing much added value compared to the code they required.

* **BREAKING** The logic that determines what style template is used for a form or a component of a form is now different. Generally speaking, there are more potential places at which you can define the template to use, and it tries to use the template used by the closest ancestor component if not overridden.
* **BREAKING** The `AutoForm.inputValueHandlers` function is now gone. If you were using it, you should switch to the new method for defining custom input types. Refer to "Defining Custom Input Types" in the Readme.
* **BREAKING** When your schema for a field includes the Email or Url regular expression built into SimpleSchema, AutoForm no longer automatically uses the `email` or `url` type, respectively, for the form input. You can manually set the `type` attribute or specify `autoform.type` in the schema.
* **BREAKING** The `radio` and `select` attributes no longer do anything. Instead, specify an override `type` attribute of "boolean-radios" or "boolean-select", respectively.
* A new `AutoForm.getSchemaForField` function can be used within a template helper function to get the schema definition for a field by finding the closest autoForm and using the schema attached to it.
* **BREAKING** The `afFieldLabel` component is gone. If you were using it, you should replace with your own label element using `afFieldLabelText` for the text, something like `<label class="control-label">{{afFieldLabelText name='firstName'}}</label>`
* **BREAKING** If you don't provide a `firstOption` attribute for a single select control, a default first option that says "(Select One)" is used. You can omit the first option using `firstOption=false`, but it's best to have one in most cases to avoid confusing behavior.
* **BREAKING** The `afFieldSelect` component is gone. See [the demo](http://autoform.meteor.com/select) for the new way to provide optgroups.
* A new `AutoForm.invalidateFormContext` function can be called in situations where you reactively change the `doc` attribute of a form and you need to force the form to rerender.
* You can now set `label="some text"` on an `afFormGroup` (or `afQuickField`) component to provide some label text instead of using the schema label.
* Fix which element is passed as the updated element for autosave forms.

### 3.2.0

* Documentation corrections. (Thanks @paulellery and @jakozaur)
* Fixes to logic for throwing errors: don't do it if there are validation errors, and call endSubmit (e.g., to re-enable buttons) before doing it. (Thanks @jakozaur)
* Internal code revisions for better backwards and forewards compatibility (Thanks @SachaG)
* The bootstrap3-horizontal template now recognizes a `leftLabel` attribute that you can set to `true` on your boolean check box fields to put the check box label in the left column instead of to the right of the check box.
* In hooks for update forms, you can now use `this.docId` to figure out which document is being updated.
* In hooks for autosave forms, you can now use `this.autoSaveChangedElement` to get the element that caused the automatic form submission. You can use this, for example, to display some kind of indicator that the changed field was saved.

### 3.1.0

When AutoForm pre-validates, it now passes `docId` to autoValue and custom context, just as collection2 would do.

### 3.0.0

* Fixes to form preservation during hot code push.
* You can now disable form preservation for a specific form by setting `preserveForm=false` attribute on the `autoForm` or `quickForm`.
* Expose `formPreserve` object as `AutoForm.formPreserve`. Add `unregisterAllForms` method. You can now do `AutoForm.formPreserve.unregisterForm(formId)` or `AutoForm.formPreserve.unregisterAllForms()` to resolve strange issues due to faulty form preservation logic.
* Support for `offset` attribute on `datetime-local` inputs is removed and replaced by a `timezoneId` attribute, which should be set to a timezone ID that `moment-timezone` understands. You'll also need to add the `moment-timezone` library to your app, for example, by adding the `mrt:moment-timezone` Meteor package.
* If a form has no `onError` or `after` hooks, insert, update, and method call errors are now thrown.
* Other fixes

### 2.0.2

Minor fix to template selection logic. Make sure default template is always used if specific template is not found.

### 2.0.1

Update collection2 weak dependency to 2.0.0.

### 2.0.0

Minor fixes (thanks @aramk) and use 0.9.1 core packages, which means you can't use this one on 0.9.0. Not my fault; blame Meteor.

### 1.0.0

* Removed `afDeleteButton`
* Removed support for `type="remove"` forms
* Updates for >=1.0.0 dependencies on aldeed:simple-schema and aldeed:collection2
* Made the array tracker object public as `AutoForm.arrayTracker`. This allows you to, for example, add and remove array item fields from code.
* Add support for `initialCount` attribute on `afArrayField` and `afEachArrayItem` components. By default, if there is no `doc` attached to the form, there is initially 1 item field shown, or minCount fields if minCount is greater than 1. This logic is unchanged, but now you can override that default initial count to be something other than 1, including 0. Note that minCount will still always take precedence.
* Previously, the component template that generates a form group was prefixed with `afQuickField_`. Now it is prefixed with `afFormGroup_`, and this template is rendered also when you use a new `afFormGroup` component. This separation allows `afQuickField` to act solely as a logic component; it decides whether a particular key should be rendered using `afArrayField`, `afObjectField`, or `afFormGroup`, and then forwards all your attributes to the chosen component. So `afQuickField` no longer has a template associated with it. To update your code, change "afQuickField_" to "afFormGroup_" for any custom templates you have, and if you are calling `AutoForm.setDefaultTemplateForType` for "afQuickField", change it to "afFormGroup".
* You can set `trimStrings` attributes to `false` on an autoForm or quickForm to change the default behavior for document cleaning for that form.
* You can now set `autoform.omit` to `true` in the schema definition for a field to prevent it from ever being included in quickForms, afObjectFields, afArrayFields, etc. This is useful for autoValue properties such as `createdAt` that you know you will not want on a form.

### 0.17.1

Fix for Dates being stripped out on submission

### 0.17.0

* Requires Meteor 0.8.2+
* Fix issue with datetime-local field being 12 hours off
* The `autoform` attribute is no longer ever necessary. AutoForm can locate the closest form no matter how many times you use blocks that change the context within a form.
* If you set `buttonContent=false` on a `quickForm`, it won't generate a button.
* BREAKING! If you provide `buttonClasses` attribute on a `quickForm`, the bootstrap templates no longer add "btn btn-primary" to your classes.
* `type="remove"` forms and the `afDeleteButton` are now deprecated but still work for now. Use the [delete-button package](https://github.com/aldeed/meteor-delete-button).
* Most hooks now have `this.event`, `this.template`, `this.formId`, and `this.resetForm()`. You can use `this.formId` in conjunction with a global hook to implement hook logic for multiple forms.
* You can set `filter`, `autoConvert`, and/or `removeEmptyStrings` attributes to `false` on an autoForm or quickForm to change the default behavior for document cleaning for that form.
* You can now call `AutoForm.debug()` to enable additional logging during development.
* Add `afQuickFields` component. See readme.
* When all fields that comprise a sub-object are empty, we now unset the whole sub-object. This prevents issues when some of the properties are required, but the sub-object itself is optional.

### 0.16.1

An insert form will now insert properly even if the `collection` does not have an attached schema.

### 0.16.0

* Fix error when you add `autoform` to your app but not `simple-schema`.
* You can now use object dot notation when setting collection or schema for a form as a string, for example, `collection="App.Collections.Posts"` or `schema="Schemas.Post"`. (Thanks @czeslaaw)
* You can now easily tell an update form to save (submit) whenever the value in one of its fields changes. Put `autosave=true` on the `autoForm` or `quickForm`.

### 0.15.4

* Fixes to submission validation logic for forms that have both `collection` and `schema`
* More useful `Error` instance is passed to `onError` hooks

### 0.15.3

Fix to code that gathers form values so that custom object prototypes are not lost.

### 0.15.2

When submitting, ensure that validation is always skipped when `validation="none"` for the form.

### 0.15.1

Fix submission logic so that validation happens before insert and update "before" hooks only when there's an override schema.

### 0.15.0

**BREAKING CHANGES TO FORM SUBMISSION AND HOOKS:**

* You can no longer call a `meteormethod` in addition to performing other types of submission. Your `meteormethod` will be called only if `type="method"`.
* `onSubmit` hooks can now perform async tasks if necessary. You must add a `this.done()` call to all of your `onSubmit` hooks. Refer to the hooks documentation in the readme.
* `onSubmit` hooks are now called *only if* your form has no `type` attribute. If you have an `onSubmit` hook for a form, remove the `type` attribute from that form and be sure that your `onSubmit` hook returns `false`. If you were using `onSubmit` to cancel submission for an insert, update, or method form, you can do that by returning `false` from a "before" hook instead.

Other non-breaking changes:

* "before" hooks for insert, update, and method forms can now perform async tasks if necessary. Existing synchronous hooks do not need any changes. Refer to the hooks documentation in the readme.
* Improved logic for form resetting, and `AutoForm.resetForm` method works better.

### 0.14.1

Fixed an issue where `afFieldValueIs` and `afFieldValueContains` helpers did not correctly recognize boolean values upon first form render.

### 0.14.0

* Added `afArrayFieldIsFirstVisible` and `afArrayFieldIsLastVisible` helpers. (Thanks @camelaissani!)
* Added `AutoForm.validateForm(formId)` for validating the current data in a form without submitting it.
* Added `AutoForm.getValidationContext(formId)`, which returns the form's SimpleSchema validation context. Use this to easily manually add validation errors, check current validity, etc.
* BREAK: String fields with a schema `max` value of 150 or greater are no longer automatically rendered as `textarea`. To force a textarea, add a `rows` attribute either on the field or in the `autoform` object in the schema.
* When you add `type` attribute to an `afQuickField` for an object or array field, the type is now correctly respected.
* When you override the `type` attribute to `hidden` for a boolean field, the extracted field value is now correctly converted back to a boolean.

### 0.13.5

Fix error that occurs when `denyInsert` or `denyUpdate` is in form schema and `quickForm` or `afObjectField` is used.

### 0.13.4

The ability to omit fields within objects and arrays from a quickForm is restored.

### 0.13.3

Properly set `checked` state on check box and radio groups

### 0.13.2

Fix add array item button when used not within an afArrayItem template

### 0.13.1

* The document `_id` is now passed as the third argument to your server method when you submit a form with `type="method"`. This, combined with the modifier in the second argument, allows you to do an `update` in your method.
* More internal changes to simplify the code and guard against edge cases.

### 0.13.0

* Many changes that simplify custom template creation. **If you have created custom templates, they will most likely need to be updated. Look at the revised built-in templates for guidance.**
* Fixed bootstrap-horizontal template to work with object and array fields.
* Added `AutoForm.validateField`. See the readme.
* Fixed schema validation upon submission when using both a `schema` attribute and a `collection` attribute.

### 0.12.0

* Added `AutoForm.inputValueHandlers` method. See [the readme](https://github.com/aldeed/meteor-autoform#making-autoform-ready-components).
* More array field fixes
* `placeholder="schemaLabel"` now reactively updates the placeholder along with the label.
* Added `beginSubmit` and `endSubmit` hooks, which allow you to override the default UI changes during submission. See [the readme](https://github.com/aldeed/meteor-autoform#callbackshooks).
* You can now define hooks for a form generated by `afDeleteButton`.
* You can now define default autoform field attributes in the schema. Add an `autoform` option to the schema for the field, and set it equal to an object that contains the default attributes you want. This makes it possible to use quickForms more often. For example:

```js
values: {
  type: [String],
  optional: true,
  minCount: 2,
  maxCount: 4,
  autoform: {
    options: [
      {label: "One", value: "One"},
      {label: "Two", value: "Two"},
      {label: "Three", value: "Three"}
    ],
    noselect: true,
    template: "myCustomTemplate"
  }
}
```

* Lots of internal code reorganization to make the other changes possible and make it easier for other contributors to understand.

Thanks to @Batistleman and @patrickleet for contributions.

### 0.11.0

* API Change: boolean attributes on inputs are now passed through to the generated HTML *only if* the value is `true` or `"true"` or `""`. This is different from HTML in which boolean attributes take effect simply by being present. This change allows you to reactively add or remove a boolean attribute in a simple way, for example, `{{> afQuickField name='status' disabled=canEditStatus}}`. You should review any boolean attributes you use on autoform fields to ensure that they have the correct value, or they may no longer show up in the HTML.
* Fixed an issue where reactive lists of check box inputs would have incorrect check boxes selected after the list changed
* Removed `for` attribute from radio labels in the bootstrap3 template, since it should not be there; makes the labels correctly clickable
* Completely rewrote behind-the-scenes array field tracking, fixing a number of issues with adding and removing array fields and correctly updating arrays

### 0.10.0

* Before hooks are now passed the template instance
* `formToDoc` and `docToForm` hooks are now passed the SimpleSchema instance and form `id`, which is useful if you define them globally (pass `null` for the first argument of `AutoForm.addHooks`)

### 0.9.0

* Support for limiting the number of items in an array field. See "afArrayField" section in the README.
* In the default templates, when you can't add or remove array items, the corresponding buttons are hidden.
* You can now specify fields that are in objects within arrays in the `omitFields` attribute on a `quickForm`. For example, `names.$.first`. (Thanks @picsoung!)
* Clearing all check boxes for an optional array field will now properly unset the field.
* Other bug fixes (Thanks @jfols and @BasilPH)

### 0.8.1

* Disabled fields are no longer submitted or included in the generated insert or update object.
* Changes that prevent global helpers from potentially interfering with correct autoform generation. (Thanks @mjgallag)
* Fix contenteditable field. (Thanks @chrisbutler)

### 0.8.0

* Ensure that `template` attribute is not added to the DOM element for all components
* Add `afFieldValueContains`, like `afFieldValueIs` but for checking whether an array field contains the value
* Add reactive `AutoForm.getFieldValue` method, useful for creating helpers to support more advanced field filtering based on combinations of current field values
* Add `bootstrap3-horizontal` built-in template
* Documentation improvements: `afObjectField` and `afArrayField` components are now documented, and added link to the autogenerated public API documentation

### 0.7.2

Remove unintentional console log

### 0.7.1

Minor fixes for `afFieldValueIs` helper

### 0.7.0

Add `afFieldValueIs` helper for dynamic show/hide of form sections based on the current value of any field.

### 0.6.2

Fix an issue where generated modifiers sometimes had the same field listed in both `$set` and `$unset`.

### 0.6.1

Improve some error messages

### 0.6.0

* Add `omitFields` attribute for `quickForm`. Similar to the `fields` attribute but for blacklisting instead of whitelisting.

Much thanks to @gdhuse for the following fixes and enhancements:

* Add option to replace hooks instead of extending the current list when calling `hooks` or `addHook`.
* Allow insert/update forms without a `collection` attribute if there is at least one `onSubmit` hook and at least one `onSubmit` hook returns `false`.
* Fix issue with array fields
* Fix issue with update modifiers created from autoform field values.

### 0.5.2

Fix issue with datetime fields

### 0.5.1

Minor fix

### 0.5.0

Blaze/0.8.0 support and lots more, including breaking changes. Refer to the transition notes at the top of the README. If you're still using Spark (pre-0.8.0), use the 0.4.x version. The old version of autoform can be found on the `spark` branch. It won't receive any more changes, except for critical fixes. Onward!

### 0.4.20

Better implementation of `defaultValue` support

### 0.4.19

* Use jQuery to fix issues related to maintaining selections in a cross-browser way. *(Thanks @mjgallag)*
* Use schema `defaultValue` as default value for boolean controls.

### 0.4.18

A couple more bug fixes related to cleaning objects.

### 0.4.17

Bug fix for validation of updates when auto values are involved. *(Thanks @mjgallag)*

### 0.4.16

Add support for `contenteditable` input type. *(Thanks @chrisbutler)*

### 0.4.15

* Labels are now generated with "for" attribute
* QuickForms work better with schemas containing objects now. The object is
treated as a `fieldset` with its child fields nested within. This only works
to one level deep.
* The `updateDoc` passed to an `onSubmit` handler is no longer validated before
being passed. The `insertDoc` is still validated.
* Changes to account for `autoValue` and `defaultValue` options now available
in the SimpleSchema package.

### 0.4.14

The execution flow for hooks has been improved. The `onError` hook is now
always called if there's an error at any point in the form submission process,
and it will never be called more than once. Also, any "before" hooks are now
executed before the `onSubmit` hook. *(Thanks @blazer82)*

### 0.4.13

Changes related to SimpleSchema package changes. No visible changes.

### 0.4.12

Add support for `fields` attribute on `quickForm`. Bind an array or specify
a comma-delimited string of field names to include. Only the listed fields
will be included, and they'll appear in the order you specify.

### 0.4.11

* Don't include fields in quickForms if their name contains "$"
* Use `textarea` instead of `input[type=text]` if the schema type is `String`,
no specific type attribute is specified, and the current value of the doc
contains line break characters.
* Within an `onSubmit` function, you can now access `this.event` and `this.template`.
* Specify `element="none"` or `element="span"` on afFieldLabel to get just
the text or to use a `<span>` element, respectively.
* `quickForm` and `afQuickField` now support a `template` attribute, allowing
you to define your own template to be used for the quick fields.
* Provide `resetOnSuccess` attribute to specify auto-reset behavior for a
specific autoform.

### 0.4.10

Add explicit cleaning since SimpleSchema validation does not do it anymore

### 0.4.9

Fix error when a source doc has null values

### 0.4.8

Minor internal change to adjust for changes made to the internal schema in the
SimpleSchema package.

### 0.4.7

* quickForm no longer displays fields for denyInsert or denyUpdate keys when
building an insert or update form, respectively.
* Fix an issue with being able to pass a Collection2 as the autoForm schema.
(This is not recommended anyway.)
* Automatically disable the submit button while submitting an autoform.

### 0.4.6

Ensure docToForm hook is called

### 0.4.5

Add onSuccess and onError hooks

### 0.4.4

* Fix issues, introduced by 0.4.3, where select, checkbox, and radio form values
were not always correct.
* Throw errors in afFieldMessage and afFieldIsInvalid helpers when the field
name used doesn't exist in the schema. (Other helpers already did this.)
* Add two new "type" options for quickForms: "readonly" and "disabled". See
README.
* When displaying a quickForm, use the allowedValues from the schema as the
options.

### 0.4.3

Update to use MongoObject to create flatDoc. Fixes an issue caused by recent
SimpleSchema API changes.

### 0.4.2

* New API. The old API is deprecated but continues to work for now with warning
messages logged. See the README and warning messages. The main difference is
that the various hooks/callbacks are centralized in a `hooks()` method, but this
is available only on `AutoForm` instances, so you need to wrap your `Collection2`
instance in an `AutoForm` on the client and then attach hooks to the autoform,
passing the autoform as the `schema` attribute for your `autoForm` helper. Also,
the server methods have all been removed, making this a purely client package.
This means you should now define a `SimpleSchema` in common code and use that
to create an `AutoForm` instance on the client only. This allows you to still
validate against the same `SimpleSchema` on both the client and the server. See
examples in the README.
* You can now set `options` to the string "allowed" for `afFieldInput` or
`afQuickField`. This causes the schema's `allowedValues` to be used as the
values (and labels) for the select element. If you want to capitalize the first
letter of the labels, set `capitalize="true"`. (Thanks @gdhuse!)
* SimpleSchema error messages with HTML will now display correctly when you use
an `afQuickField`. (Thanks @gdhuse!)

### 0.4.1

Improve handling of key names that use dot notation to indicate a property of
an object in an array, for example, `friends.0.name`.

### 0.4.0

Backwards-compatibility break! Handling of `Date` fields was limited and saved
`Date` objects were not correct. If you have previously saved `Date` objects
from an autoform `date` input, you will have to manually convert the saved values
to correct them after upgrading to this release. If it is only the date you care
about and not the time, all dates in your mongo collections must represent
midnight in the UTC time zone on the morning of the correct date. Refer to the
[Dates](https://github.com/aldeed/meteor-autoform#dates) section of the README
for details about how date inputs work now.

### 0.3.6

Support min/max functions

### 0.3.5

Add framework override support; current usage is only to specify "none" to skip the bootstrap3 classes

### 0.3.4

Fix object expansion

### 0.3.3

Improve object collapsing. Ensures that the values of keys with dot notation appear in the fields for edit forms.

### 0.3.2

Fix IE<10 errors

### 0.3.1

Fixes to date inputs

### 0.3.0

Updated to work with 0.2.0 versions of collection2 and simple-schema packages. The autoform features should be backwards-compatible, but the collection2 and simple-schema APIs have changed, so you may need to make changes. To make sure everything works as you expect, it's strongly recommended that you include a unique `id` attribute on every `autoForm` helper.

### 0.2.3

* Fix IE<10 issue

### 0.2.2

* Use `submit form` event handler instead of button click handlers
* Add support for binding an `onSubmit` handler to an autoForm using the `onSubmit` helper attribute.
* Don't include `form-control` class on radio buttons and check boxes
* Submit the form normally after validating if none of the special actions are used

### 0.2.1

Fix input helper to use value passed in `value` attribute if no doc is attached to the autoform.

### 0.2.0

* For autoforms that call a server method, server-side validation is no longer performed automatically. This had to be removed to fix a security issue. After updating to 0.2.0, you must call `check()` in the Meteor method.
* Add `formToDoc` and `docToForm` functions. See the readme.
* Improve keyup validation
* Allow direct binding of Collection2 or AutoForm object to autoForm helper through the schema attribute. Passing in the string name of a global object is still supported, but binding is the preferred method now.
