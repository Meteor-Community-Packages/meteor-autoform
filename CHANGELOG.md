AutoForm
=========================

AutoForm is a smart package for Meteor that adds handlebars helpers to easily create basic
forms with automatic insert and update events, and automatic reactive validation. 

## Change Log

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