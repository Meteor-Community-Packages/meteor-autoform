AutoForm
=========================

[![Build Status](https://travis-ci.org/aldeed/meteor-autoform.svg)](https://travis-ci.org/aldeed/meteor-autoform)

AutoForm is a smart package for Meteor that adds UI components and helpers to easily
create basic forms with automatic insert and update events, and automatic
reactive validation. This package requires and automatically installs the
[simple-schema](https://github.com/aldeed/meteor-simple-schema) package.
You can optionally use it with the
[collection2](https://github.com/aldeed/meteor-collection2) package, which you
have to add to your app yourself.

## Table of Contents
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Blaze Transition](#blaze-transition)
- [Installation](#installation)
- [Example](#example)
  - [A Basic Insert Form](#a-basic-insert-form)
  - [A Basic Update Form](#a-basic-update-form)
  - [A Basic Remove Form](#a-basic-remove-form)
  - [A Custom Insert Form](#a-custom-insert-form)
  - [Another Custom Insert Form](#another-custom-insert-form)
- [Component and Helper Reference](#component-and-helper-reference)
  - [autoForm](#autoform)
  - [quickForm](#quickform)
  - [afFieldInput](#affieldinput)
  - [afFieldSelect](#affieldselect)
  - [afFieldLabel](#affieldlabel)
  - [afFieldMessage](#affieldmessage)
  - [afFieldIsInvalid](#affieldisinvalid)
  - [afQuickField](#afquickfield)
    - [afQuickField Examples](#afquickfield-examples)
  - [afFieldValueIs](#affieldvalueis)
  - [afFieldValueContains](#affieldvaluecontains)
- [Objects and Arrays](#objects-and-arrays)
  - [afObjectField](#afobjectfield)
  - [afArrayField](#afarrayfield)
- [Public API](#public-api)
- [Non-Collection Forms](#non-collection-forms)
  - [An Example Contact Form](#an-example-contact-form)
- [Fine Tuning Validation](#fine-tuning-validation)
- [Manual Validation](#manual-validation)
- [Resetting Validation](#resetting-validation)
- [The Form Document](#the-form-document)
  - [Getting Current Field Values](#getting-current-field-values)
- [Callbacks/Hooks](#callbackshooks)
  - [onSubmit](#onsubmit)
  - [formToDoc and docToForm](#formtodoc-and-doctoform)
- [Complex Schemas](#complex-schemas)
- [Complex Controls](#complex-controls)
- [Using Block Helpers Within an AutoForm](#using-block-helpers-within-an-autoform)
- [Dates](#dates)
  - [type=date](#type=date)
  - [type=datetime](#type=datetime)
  - [type=datetime-local](#type=datetime-local)
- [Templates](#templates)
  - [Using a Different Template](#using-a-different-template)
  - [Creating a Custom Template](#creating-a-custom-template)
- [Making AutoForm-Ready Components](#making-autoform-ready-components)
- [Common Questions](#common-questions)
  - [Should the value of `schema` and `collection` have quotation marks around it?](#should-the-value-of-schema-and-collection-have-quotation-marks-around-it)
  - [Which components should I use?](#which-components-should-i-use)
  - [Can I reuse the same `quickForm` or `autoForm` for both inserts and updates?](#can-i-reuse-the-same-quickform-or-autoform-for-both-inserts-and-updates)
  - [Can I put HTML in my error messages?](#can-i-put-html-in-my-error-messages)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Blaze Transition

If you've been using AutoForm and are now switching to the Blaze rendering engine, here's what you need to know to transition your app:

* Add "> " before every afQuickField, afFieldInput, afFieldLabel, and quickForm.
* Use `..` whereever you formerly used `../this`.
* When specifying the field name for any component or helper, add `name=`. For example, `{{afFieldMessage name="name"}}` rather than `{{afFieldMessage "name"}}`.
* Instead of using a submit button class to determine form behavior, use a `type` attribute on the `autoForm` component.
* Instead of using a submit button `data-meteor-method` attribute to identify the method name, use a `meteormethod` attribute on the `autoForm` or `quickForm` component.
* The components (any that you use `>` before) no longer require an `autoform` attribute when used within an `#each` or `#with` block. The helpers *do* still require the `autoform` attribute that references the `autoForm` context.
* There is no `AutoForm` instance. [How to add hooks.](#callbackshooks) There is also now support for global hooks and multiple hooks of the same type per form. (Adding hooks multiple times will extend the list of hooks rather than overwriting the previous hook.)
* Again, there is no `AutoForm` instance. The `autoForm` component can take a `schema` attribute that supplies a `SimpleSchema` instance or a `collection` attribute that supplies a `Meteor.Collection` instance with an attached schema. You can also specify both attributes, in which case form generation and validation will be based on the schema, but insert/update (and final validation) will happen on the collection. In this way, you can use slightly different validation logic or add additional constraints to a form that are not actual constraints on the collection's schema.
* New `afFieldSelect` block component that supports optgroups. [Read about it.](#affieldselect)
* Read about [choosing and customizing templates](#templates).
* Experimental support for array fields, including arrays of objects with add/remove buttons. Documentation coming soon.
* You may find the new [Common Questions](#common-questions) section helpful. 

## Installation

Install using Meteorite. When in a Meteorite-managed app directory, enter:

```
$ mrt add autoform
```

## Example

Let's say you have the following Meteor.Collection instance, with schema support
provided by the collection2 package. (Adding `autoform` to your app does not add
`collection2` by default so you need to run `mrt add collection2` for this example
to work.)

```js
Books = new Meteor.Collection("books", {
    schema: {
        title: {
            type: String,
            label: "Title",
            max: 200
        },
        author: {
            type: String,
            label: "Author"
        },
        copies: {
            type: Number,
            label: "Number of copies",
            min: 0
        },
        lastCheckedOut: {
            type: Date,
            label: "Last date this book was checked out",
            optional: true
        },
        summary: {
            type: String,
            label: "Brief summary",
            optional: true,
            max: 1000
        }
    }
});
```

### A Basic Insert Form

```html
<template name="insertBookForm">
  {{> quickForm collection="Books" id="insertBookForm" type="insert"}}
</template>
```

That's it! This gives you:

* An autogenerated form that uses bootstrap3 classes.
* Appropriate HTML5 fields for all keys in the "Books" collection schema.
* A submit button that gathers the entered values and inserts them into
the "Books" collection.
* Form validation based on the "Books" collection schema. By default the form
is validated when the user submits. If anything is invalid, the form is
continually re-validated on keyup (throttled) as the user fixes the issues.
* Default validation error messages that appear under the fields, and can be
customized and translated.

### A Basic Update Form

An update form is similar to an insert form, except you need to provide the
document with the original values to be updated:

```html
<template name="updateBookForm">
  {{> quickForm collection="Books" doc=editingDoc id="updateBookForm" type="update"}}
</template>
```

And the helper:

```js
Template.updateBookForm.editingDoc = function () {
  return Books.findOne({_id: Session.get("selectedDocId")});
};
```

### A Basic Remove Form

It's possible to use a "remove" type, too, but usually you just want a single button
for removing, so there is a special template you can use to get that:

```html
{{> afDeleteButton collection="Books" doc=editingDoc}}
```

Where the `editingDoc` helper is the same as in the update form example.

When used this way, the content of the delete button will be the word "Delete". If you want to
get fancy, you can instead use `afDeleteButton` as a block helper and provide your own button
content:

```html
{{#afDeleteButton collection="Books" doc=editingDoc}}
<span style="color: yellow">DELETE ME!!</span>
{{/afDeleteButton}}
```

To show a confirmation dialog before deleting, add an `id` attribute to the `afDeleteButton` and define a "before remove" hook for that form ID.

### A Custom Insert Form

If you want to customize autogenerated forms for *all* forms, you can easily
do so by writing your own templates. Refer to the templates section. However,
sometimes a certain form has a complex schema or unique UI requirements, in
which case you can use `autoForm` rather than `quickForm`, allowing you to
define fields individually.

Here's an example:

```html
<template name="insertBookForm">
    {{#autoForm collection="Books" id="insertBookForm" type="insert"}}
    <fieldset>
        <legend>Add a Book</legend>
        {{> afQuickField name='title'}}
        {{> afQuickField name='author'}}
        {{> afQuickField name='summary' rows=6}}
        {{> afQuickField name='copies'}}
        {{> afQuickField name='lastCheckedOut'}}
    </fieldset>
    <button type="submit" class="btn btn-primary">Insert</button>
    {{/autoForm}}
</template>
```

In this example, we added `rows=6` to the "summary" field, which will cause it
to be rendered as a `textarea` instead of a normal text input field.

### Another Custom Insert Form

In the previous example of a custom insert form, we saw how `afQuickField` can
be used to render a field with simple customizations. Now let's say we need to
fully customize one of the fields. To do this, you can use the following more
specific templates and helpers:

* afFieldIsInvalid
* afFieldLabel
* afFieldInput
* afFieldSelect
* afFieldMessage

Here's an example:

```html
<template name="insertBookForm">
  {{#autoForm collection="Books" id="insertBookForm" type="insert"}}
  <fieldset>
    <legend>Add a Book</legend>
    {{> afQuickField name='title'}}
    {{> afQuickField name='author'}}
    {{> afQuickField name='summary' rows=6}}
    {{> afQuickField name='copies'}}
    {{> afQuickField name='lastCheckedOut'}}
    <div class="form-group {{#if afFieldIsInvalid name='cost'}}has-error{{/if}}">
      <div class="input-group">
        <span class="input-group-addon">$</span>
        {{> afFieldInput name='cost'}}
        <span class="input-group-addon">/each</span>
      </div>
      {{#if afFieldIsInvalid 'cost'}}
      <span class="help-block">{{afFieldMessage 'cost'}}</span>
      {{/if}}
    </div>
  </fieldset>
  <button type="submit" class="btn btn-primary">Insert</button>
  {{/autoForm}}
</template>
```

We added a `cost` field to our form and customized it to display as an input
group with add-ons.

## Component and Helper Reference

### autoForm

Use this component as a block instead of `<form>` elements to wrap your form and
gain all the advantages of the autoform package.

The following attributes are recognized:

* `collection`: Required if `schema` is not set. Set to one of the following:
    * The name of a helper function (no quotation marks) that returns an
instance of `Meteor.Collection` that has a schema defined.
    * The name (in quotation marks) of a `Meteor.Collection` instance that has
a schema defined and is in the `window` namespace.
* `schema`: Required if `collection` is not set. This schema will be used to generate
and validate the form prior to submission, so you can specify this along with a
`collection` if you want to use a slightly different schema for the form than
the one your collection uses. However, the final object will still have to pass
validation when `insert` or `update` is called on the collection. Set to one of the following:
    * The name of a helper function (no quotation marks) that returns an
instance of `SimpleSchema`.
    * The name (in quotation marks) of a `SimpleSchema` instance that is in
the `window` namespace.
* `doc`: Required for update and remove actions. Pass the current document
object, retrieved with a call to `findOne()` for example. For an insert form,
you can also use this attribute to pass an object that has default form values
set.
* `validation`: Optional. See the "Fine Tuning Validation" section.
* `template`: Optional. See the "Templates" section.
* `type`: Optional. One of "insert", "update", "remove", or "method". Anything
else will result in normal browser form submission after validation.
* `meteormethod`: Optional. When `type` is "method", indicate the name of the
Meteor method in this attribute.
* `resetOnSuccess`: Optional. The form is automatically reset
for you after a successful submission action. You can skip this by setting this
attribute to `false`.
* `id`: Required. This is used as the `id` attribute on the rendered `form`
element, so it must be unique within your entire application. It's required
because we use it to set up a form-specific validation context and to preserve
input values when a "hot code push" happens.
* Any additional attributes are passed along to the `<form>` element, meaning
that you can add classes, etc.

### quickForm

Use this component to generate an entire form in one line. It takes and requires
all the same attributes as `autoForm`. In addition, it recognizes the following
attributes:

* `type`: Two additional type values are supported: "readonly" and "disabled".
* `buttonClasses`: Added to the class attribute for the rendered submit button.
* `buttonContent`: The submit button content. If you don't set this, "Submit" is used.
* `fields`: Optional. Bind an array or specify a comma-delimited string of field
names to include. Only the listed fields (and their subfields, if any) will be
included, and they'll appear in the order you specify.
* `omitFields`: Optional. Bind an array or specify a comma-delimited string of field
names to omit from the generated form. All first-level schema fields *except* the
fields listed here (and their subfields, if any) will be included.

Any other attributes you specify will be output as attributes of the `<form>`
element, just like when using the `autoForm` component.

### afFieldInput

Renders an appropriate input for the field. This could be one of several different
input types, such a `input`, `textarea`, etc. Here's an overview of the logic
that is used to determine which type of input to use:

* If type is `String`, `<input type="text">`.
* If you include the `rows` attribute for a `String` type property or set a `max` value of greater than or equal to 150, a `<textarea>` is used instead of an `<input type="text">`.
* If type is `Number`, `<input type="number">`. You may specify the step, min, and max attributes to further restrict entry. The min and max values defined in your schema are automatically transferred to the DOM element, too.
* If type is `Date`, `<input type="date">`. If you want `datetime` or `datetime-local` instead, specify your own `type`
attribute when calling the helper.
* If type is `String` and regEx is `SimpleSchema.RegEx.Email`, `<input type="email">`.
* If type is `String` and regEx is `SimpleSchema.RegEx.Url`, `<input type="url">`.
* If type is `Boolean`, a checkbox is used by default. However, if you set the
`radio` or `select` attributes when calling the helper, then a radio or select
control will be used instead. Use the `trueLabel` and `falseLabel` attributes
to set the label used in the radio or select controls.
* If you supply the `options` attribute on the helper, a `<select>` control is used instead. If type is also an array, such as `[String]`, then
it is a multiple-select control. If you prefer radios or checkboxes (for example, if it is a short list of options),
then simply add the `noselect` attribute (set to anything).
* If optional is `false` or not set in the schema, the `required` attribute is added to the DOM element.
* Specifying `max` when type is `String` causes the `maxlength` attribute to be added to the DOM element.
* Specifying `min` or `max` dates when type is `Date` causes those dates to be added to the DOM element in
`min` and `max` attributes. For inputs of type `date` or `datetime-local`, which do not
have a time zone component, the date and time in the UTC time zone is used as the minimum
or maximum value. Pass an ISO-compliant string (e.g., "2013-12-12") into the `Date` constructor
when defining your min/max values in SimpleSchema and it should work correctly.

The following attributes are recognized:

* `name`: Required. The name of the schema key this field is for.
* `template` (default="bootstrap3"): Specify the name of a different built-in or
custom template to use.
* `autoform`: Optional. Refer to "Using Block Helpers Within an AutoForm".
* `options`: An array of objects, where each object has a `label` property
and a `value` property. By specifying options, you cause the generated DOM
element to be a `select` element with these options, unless you also use
`noselect`. To use the `allowedValues` from the schema as the options, set
`options="allowed"`. To specify a label to be displayed when there is no
option selected, set `firstOption="(My Select One Label)"`.
* `capitalize`: Used only when you've set `options="allowed"`. Set this to `true`
to capitalize the labels generated from `allowedValues`.
* `noselect`: Use in conjunction with `options` attribute. Set this attribute
to anything to render radios or checkboxes for the `options` instead of `select`.
* `radio`: Set to `true` to render two `radio` elements instead of a `checkbox`
for boolean fields.
* `select`: Set to `true` to render a `select` element with two options instead
of a `checkbox` for boolean fields.
* `trueLabel`: Set to the string that should be used as the label for the `true`
option for a boolean field. (See `radio` and `select` options.)
* `falseLabel`: Set to the string that should be used as the label for the `false`
option for a boolean field. (See `radio` and `select` options.)
*  Any additional attributes are passed along to the generated DOM element,
meaning that you can add `class`, etc. You can also use this feature to set
default values for inputs by supplying a `value` attribute.
* `placeholder`: As with other attributes, this will be passed along to the
generated DOM element, but you can also optionally do
`placeholder="schemaLabel"` to use the field label defined in the schema as
the input's placeholder value.

Here's an example of passing `options` to generate a `select` field:

*html:*

```html
{{> afFieldInput name="year" options=yearOptions}}
```

*client.js:*

```js
UI.registerHelper("yearOptions", function() {
    return [
        {label: "2013", value: 2013},
        {label: "2014", value: 2014},
        {label: "2015", value: 2015}
    ];
});
```

As an alternative to passing options, or if you need optgroups, you can use an `afFieldSelect`
block helper. Refer to the next section.

### afFieldSelect

Renders a `select` element with the given block content. This is basically the same as
using `afFieldInput` with `options` attribute, except that you can define your select options
in the HTML and optgroups are supported.

```html
{{#afFieldSelect name="year"}}
  <optgroup label="Fun Years">
    <option value="2013">2013</option>
    <option value="2012">2012</option>
  </optgroup>
  <optgroup label="Boring Years">
    <option value="2011">2011</option>
    <option value="2010">2010</option>
  </optgroup>
{{/afFieldSelect}}
```

The following attributes are recognized:

* `name`: Required. The name of the schema key this field is for.
* `template` (default="bootstrap3"): Specify the name of a different built-in or
custom template to use.
* `autoform`: Optional. Refer to "Using Block Helpers Within an AutoForm".

### afFieldLabel

Renders a label for the field. By default this is a `<label>` element with
the `label` defined in the schema, or the humanized property name if no label
is defined. You can specify a `template` attribute to generate something
different.

The following attributes are recognized:

* `name`: Required. The name of the schema key this label is for.
* `template` (default="bootstrap3"): Specify the name of a different built-in or
custom template to use.
* `autoform`: Optional. Refer to "Using Block Helpers Within an AutoForm".
* Any other attributes you add will be transferred to the rendered DOM element.

### afFieldMessage

Accepts and requires just one attribute, `name`, which is the name of the schema
key.

Outputs the user-friendly invalid reason message for the specified property, or
an empty string if the property is valid. This value updates reactively whenever
validation is performed. Refer to
[the SimpleSchema documentation](https://github.com/aldeed/meteor-simple-schema#customizing-validation-messages)
for information on customizing the messages.

### afFieldIsInvalid

Accepts and requires just one attribute, `name`, which is the name of the schema
key.

Returns true if the specified key is currently invalid. This value updates 
reactively whenever validation is performed.

### afQuickField

Just as `quickForm` renders a form in one line, `afQuickField` renders a form
group, that is, everything related to a single field -- the label, the input,
and the error message -- in one line.

This component accepts the same attributes as `afFieldInput` and `afFieldLabel`.
Attributes that are prefixed with `label-` are forwarded to `afFieldLabel` while
any remaining attributes are forwarded to `afFieldInput`.

When you use the `afQuickField` component for a field that is an `Object`, it is rendered using the `afObjectField` helper. When you use the `afQuickField` component for a field that is an `Array`, it is rendered using the `afArrayField` helper. Refer to the "Objects and Arrays" section for additional information.

#### afQuickField Examples

```html
{{> afQuickField name='firstField' autofocus=''}}
{{> afQuickField name='weirdColors' style="color: orange" label-style="color: green"}}
{{> afQuickField name="longString" rows="5"}}
{{> afQuickField name="radioBoolean" radio="true" trueLabel="Yes" falseLabel="No"}}
{{> afQuickField name="selectBoolean" select="true" trueLabel="Yes" falseLabel="No"}}
{{> afQuickField name="optionsButNoSelect" options=numSelectOptions noselect="true"}}
{{> afQuickField name="firstOptionSelect" firstOption="(Select Something)" options=numSelectOptions}}
{{> afQuickField name="decimal" step="0.01"}}
```

### afFieldValueIs

Use this helper with `#if` to dynamically show and hide sections of a form based on the current value of any non-array field on the form.

Here's an example where we want the user to select a type, and if he selects the "Other" type, we want to show an additional field where the other type can be entered as text.

```html
{{#autoForm id="itemEditForm" type="update" collection="Items" doc=itemEditFormDoc}}
    {{> afQuickField name="type" options="allowed"}}
    {{#if afFieldValueIs name="type" value="Other"}}
    {{> afQuickField name="customType"}}
    {{/if}}
    ...
{{/autoForm}}
```

In an example like this, you would probably also want "customType" to be required when type="Other". This can be done with a schema similar to this:

```js
{
    type: {
        type: String,
        allowedValues: ["A", "B", "Other"]
    },
    customType: {
        type: String,
        optional: true,
        // Required for "Other" type; otherwise should not be set
        custom: function () {
            var type = this.field('type');
            if (type.isSet) {
                if (type.value === "Other" && (!this.isSet || this.operator === "$unset")) {
                    return "required";
                } else if (type.value !== "Other" && this.isSet && this.operator !== "$unset") {
                    this.unset();
                }
            }
        }
    }
}
```

### afFieldValueContains

Use this helper with `#if` to dynamically show and hide sections of a form based on a value being present in the current value array of any array field on the form.

```html
<template name="containsForm">
  <p>A "B" field is displayed only when the current value of the "A" field contains "foo".</p>
  {{#autoForm collection="FieldValueContains" type="insert" id="FieldValueContainsForm"}}
  {{> afQuickField name="a" options="allowed" noselect=true}}
  {{#if afFieldValueContains name="a" value="foo"}}
  {{> afQuickField name="b"}}
  {{/if}}
  <button type="submit" class="btn btn-primary">Insert</button>
  {{/autoForm}}
</template>
```

With the collection:

```js
FieldValueContains = new Meteor.Collection("FieldValueContains", {
  schema: new SimpleSchema({
    a: {
      type: [String],
      allowedValues: ["foo", "bar"]
    },
    b: {
      type: String
    }
  })
});
```

## Objects and Arrays

Fields with type `Object` or `Array` are treated specially.

### afObjectField

When you use the `afQuickField` component for a field that is an `Object`, it is rendered using the `afObjectField` component. This happens by default when you use a `quickForm` for a schema that has a field of type `Object`.

The `afObjectField` component renders all of an object field's subfields together as one group. The group is labeled with the name of the object field. The actual visual representation of the group will vary based on which template you use. For the "bootstrap3" default template, the group appears in a panel with a heading.

### afArrayField

When you use the `afQuickField` component for a field that is an `Array`, it is rendered using the `afArrayField` component. This happens by default when you use a `quickForm` for a schema that has a field of type `Array`.

The `afArrayField` component renders all of an array field's array items together as one group. The group is labeled with the name of the array field. The actual visual representation of the group will vary based on which template you use. For the "bootstrap3" default template, the group appears in a panel with a heading.

Additionally, buttons for adding and removing array items are automatically added to the UI. This is also done by the template, which means that you can easily make your own "afArrayField" template if you don't like the default appearance of the add/remove buttons.

An `afArrayField` (or an `afQuickField` for an array) supports the additional attributes `minCount` and `maxCount`. Normally, by default, you cannot remove items below the schema-defined `minCount` and you cannot add items above the schema-defined `maxCount`. However, sometimes you don't want a minimum or maximum count defined in the schema, but you *do* want to limit the number of items on a certain form. To do this, use the `minCount` and `maxCount` attributes. Note, however, that you may *not* override the `minCount` to be less than the schema-defined `minCount`, and you may not override the `maxCount` to be more than the schema-defined `maxCount`.

At the moment, the add and remove buttons disappear when you can't use them. This could be changed to make them disabled. You can do this yourself with a custom template, but if you have thoughts about how it should work out of the box, submit an issue to discuss.

## Public API

Some public methods are exposed on the `AutoForm` object. Refer to the [API documentation](https://github.com/aldeed/meteor-autoform/blob/master/api.md).

## Non-Collection Forms

If you want to use an AutoForm for a form that does not relate to a collection
(like a simple contact form that sends an e-mail), or for a form that relates
to a collection that is schemaless (for example, Meteor.users()), you can do that.

1. In client+server code, create a `SimpleSchema` instance to define the form's schema.
2. Use the `SimpleSchema` instance as the `schema` attribute of `autoForm` or `quickForm`.
3. Set up the form to be submitted properly. There are three ways to handle this:
    * Define an `onSubmit` hook for the form. Put your logic in that function and have it return `false` to prevent normal form submission.
    * Add normal form attributes like `action` and let the form do a normal browser POST after being validated.
    * Define a server method that does something with the form data. On your `autoForm` or `quickForm` set `type="method"` and `meteormethod="yourServerMethodName"`.

When you use the third option, a server method, the form data will be gathered
into a single object when the user clicks the submit button. Then that object
will be cleaned and validated against the schema on the client and passed along
to your method on the server. **You must
validate it again in your method on the server, using `check()` in combination
with `myAutoFormSchema`. This is why we create the `SimpleSchema` instance
in client+server code.**

It's also generally best to call `myAutoFormSchema.clean` for the object again
in the server method. In particular, you will definitely want to do this if
the object's schema has auto or default values so that they can be added
securely and accurately on the server.

### An Example Contact Form

*common.js:*

```js
Schema = {};
Schema.contact = new SimpleSchema({
    name: {
        type: String,
        label: "Your name",
        max: 50
    },
    email: {
        type: String,
        regEx: SimpleSchema.RegEx.Email,
        label: "E-mail address"
    },
    message: {
        type: String,
        label: "Message",
        max: 1000
    }
});
```

Note that we've created an object `Schema` in which to store all of our app's schemas.

*html:*

```html
<template name="contactForm">
  {{#autoForm schema=contactFormSchema id="contactForm" type="method" meteormethod="sendEmail"}}
  <fieldset>
    <legend>Contact Us</legend>
    {{> afQuickField name="name"}}
    {{> afQuickField name="email"}}
    {{> afQuickField name="message" rows="10"}}
    <div>
      <button type="submit" class="btn btn-primary">Submit</button>
      <button type="reset" class="btn btn-default">Reset</button>
    </div>
  </fieldset>
  {{/autoForm}}
</template>
```

*client.js*

```js
Template.contactForm.helpers({
  contactFormSchema: function() {
    return Schema.contact;
  }
});
```

*server.js*

```js
Meteor.methods({
  sendEmail: function(doc) {
    // Important server-side check for security and data integrity
    check(doc, Schema.contact);

    // Build the e-mail text
    var text = "Name: " + doc.name + "\n\n"
            + "Email: " + doc.email + "\n\n\n\n"
            + doc.message;

    this.unblock();

    // Send the e-mail
    Email.send({
        to: "test@example.com",
        from: doc.email,
        subject: "Website Contact Form - Message From " + doc.name,
        text: text
    });
  }
});
```

Note the call to `check()`, which will throw an error if doc doesn't
match the schema. **To reiterate, you must call `check()` in the method or perform your
own validation since a user could bypass the client side validation.** You do
not have to do any of your own validation with collection inserts or updates,
but you do have to call `check()` on the server when submitting to a Meteor method.

## Fine Tuning Validation

To control when and how fields should be validated, use the `validation`
attribute on the `autoform` block helper. Supported values are:

* `none`: Do not validate any form fields at any time.
* `submit`: Validate all form fields only when the form is submitted.
* `keyup`: Validate each form field on every key press and when the user moves
the cursor off it (throttled to run at most once every 300 milliseconds). Also
validate all fields again when the form is submitted.
* `blur`: Validate each form field when the user moves the cursor off it
(throttled to run at most once every 300 milliseconds). Also validate all
fields again when the form is submitted.
* `submitThenKeyup`: __(Default)__ At first acts like the `submit` option, but after the
user attempts to submit the form and it fails validation, subsequently acts
like `keyup`.
* `submitThenBlur`: At first acts like the `submit` option, but after the
user attempts to submit the form and it fails validation, subsequently acts
like `blur`.
* `browser`: Let the browser handle validation, if supported.

__Notes:__

* For all values except "browser", the `novalidate="novalidate"` attribute
is automatically added to the rendered form.
* If you choose `keyup` validation, there is sometimes a bug in Safari where
the autofill mechanism will cause the text in the input to be selected after
each keypress.  This has the effect of making it near impossible to
actually type anything because you keep "overwriting" your input. To fix this,
simply add the `autocomplete="off"` attribute to your input fields.

## Manual Validation

In addition to telling your form to validate on certain events, sometimes you
need to manually validate a particular field. To do this, call `AutoForm.validateField(formId, fieldName, skipEmpty)`. It returns `true` or `false` depending on the validity
of the field's current value, and it also causes reactive display of any errors for that field in the UI.

## Resetting Validation

After a successful submission, validation is reset, ensuring that any error
messages disappear and form input values are correct. However, you may need
to reset validation for other reasons, such as when you reuse an edit form to
edit a different document. To do this, call `AutoForm.resetForm(formId)`.

## The Form Document

When the user submits an autoForm, an object that contains all of the form
data is automatically generated. If the submission action is insert or a
method call, this is a normal document object. If the submission action is
update, this is a mongo modifier with `$set` and potentially `$unset` objects.
In most cases, the object will be perfect for your needs. However, you might
find that you want to modify the object in some way. For example, you might
want to add the current user's ID to a document before it is inserted. You can
use "before" hooks or a `formToDoc` hook to do this.

### Getting Current Field Values

You can get the current values of all fields on a form at any time by passing the form `id`
to [AutoForm.getFormValues](https://github.com/aldeed/meteor-autoform/blob/master/api.md#autoformgetformvaluesformidclient). This method is *not* reactive. The form must be
currently rendered for this to work.

You can get the current value of a specific field on a specific form by passing the form
`id` and field name to [AutoForm.getFieldValue](https://github.com/aldeed/meteor-autoform/blob/master/api.md#autoformgetformvaluesformidclient). This method *is* reactive so it can be used in
place of the built-in `afFieldValueIs` helper to show pieces of a form based on
custom criteria about the values of other fields on the form.

## Callbacks/Hooks

To add client-side hooks and callbacks for a form, use the `AutoForm.hooks`
or `AutoForm.addHooks` method. Here's an example of `AutoForm.hooks` that shows
all the supported hooks:

```js
AutoForm.hooks({
  myFormId: {
    before: {
      insert: function(doc, template) {},
      update: function(docId, modifier, template) {},
      remove: function(docId, template) {},
      "methodName": function(doc, template) {}
    },
    after: {
      insert: function(error, result, template) {},
      update: function(error, result, template) {},
      remove: function(error, result, template) {},
      "methodName": function(error, result, template) {}
    },
    onSubmit: function(insertDoc, updateDoc, currentDoc) {},

    // Called when any operation succeeds, where operation will be
    // "insert", "update", "remove", or the method name.
    onSuccess: function(operation, result, template) {}, 

    // Called when any operation fails, where operation will be
    // "validation", "insert", "update", "remove", or the method name.
    onError: function(operation, error, template) {},
    formToDoc: function(doc, ss, formId) {},
    docToForm: function(doc, ss, formId) {},

    // Called at the beginning and end of submission, respectively.
    // This is the place to disable/enable buttons or the form,
    // show/hide a "Please wait" message, etc. If these hooks are
    // not defined, then by default the submit button is disabled
    // during submission.
    beginSubmit: function(formId, template) {},
    endSubmit: function(formId, template) {}
  }
});
```

If you want to add the same hook for multiple forms or for all forms, use the
`AutoForm.addHooks` method instead:

```js
  AutoForm.addHooks(['form1', 'form2', 'form3', 'form4'], {
    after: {
      insert: function(error, result) {
        if (error) {
          console.log("Insert Error:", error);
        } else {
          console.log("Insert Result:", result);
        }
      },
      update: function(error) {
        if (error) {
          console.log("Update Error:", error);
        } else {
          console.log("Updated!");
        }
      },
      remove: function(error) {
        console.log("Remove Error:", error);
      }
    }
  });

  AutoForm.addHooks(null, {
    onSubmit: function () {
      console.log("onSubmit ALL FORMS!");
    }
  });
```

Pass `true` as an optional third argument to `AutoForm.hooks` or `AutoForm.addHooks` to replace existing hooks.

```js
  AutoForm.addHooks('form1', {
    onSubmit: function () {
      console.log("Only this onSubmit");
    }
  }, true);
```

Notes:

* It's safe to call the hooks methods multiple times and even to call them for the same
form multiple times. The list of hooks is extended each time you call it, which
means that multiple hooks of the same type can run for the same form. Hooks
will run in the order in which they are added, but all form-specific hooks run
before all global hooks.
* Passing `null` as the first argument of `AutoForm.addHooks` adds global hooks, that is,
hooks that run for every form that has been created and every form that ever will be created
in the app.
* The before hooks are called just before the insert, update, remove, or method
call. The `insert`, `update`, and `"methodName"` functions are passed the document or
modifier as gathered from the form fields. They must return this same object,
optionally modifying it first. Remember that whatever modifications you make
must still pass SimpleSchema validation. *Also, this is run only on the client.
Therefore, you should not assume that this will always run since a devious user
could skip it.*
* The `remove` before function is passed the ID of the document to be removed, and
you can return `false` to cancel the removal.
* The after hooks are the same as those you would normally specify as the last
argument of the insert, update, or remove methods on a Meteor.Collection or the
Meteor.call method. Notice, though, that they are passed one additional final
argument, which is the template object. One use for the template object
might be so that you can call `find()` or `findAll()` to clean up certain form fields if the result was successful
or show additional error-related elements if not. This should be rarely needed unless
you have complex custom controls in your form.
* Refer to the next sections for details about the `onSubmit`, `formToDoc`,
and `docToForm` hooks.

### onSubmit

Submitting to a server method allows you to do anything you want with the form
data on the server, but what if you want to do something with the form data on
the client? For that, you can specify an `onSubmit` hook.

```js
AutoForm.hooks({
  contactForm: {
    onSubmit: function (insertDoc, updateDoc, currentDoc) {
      if (customHandler(insertDoc))
        this.resetForm();
      return false;
    }
  }
});
```

The arguments passed to your function are as follows:

* `insertDoc`: The form input values in a document, suitable for use with insert().
This object has been cleaned and validated, but auto values and default values
have not been added to it.
* `updateDoc`: The form input values in a modifier, suitable for use with update().
This object has *not* been validated.
* `currentDoc`: The object that's currently bound to the form through the `doc` attribute

And `this` provides the following:

* A `resetForm` method, which you can call to reset the corresponding autoform
if necessary
* The form submit event, in `event`
* The template, in `template`

If you return false, no further submission will happen, and it is equivalent
to calling `event.preventDefault()` and `event.stopPropagation()`.
This allows you to use an `onSubmit` hook in combination with other
submission methods to add pre-submit logic.

Otherwise the onSubmit function acts pretty much like any other onSubmit function, except
that insertDoc and updateDoc are validated before it is called. However, since
this is client code, you should never assume that insertDoc is valid
from a security perspective.

If you use `autoValue` or `defaultValue` options, be aware that `insertDoc` and
`updateDoc` will not yet have auto or default values added to them. If you're
passing them to `insert` or `update` on a Meteor.Collection with a schema, then
there's nothing to worry about. But if you're doing something else with the
object on the client, then you might want to call `clean` to add the auto and
default values:

```js
AutoForm.hooks({
  peopleForm: {
    onSubmit: function (doc) {
      PeopleSchema.clean(doc);
      console.log("People doc with auto values", doc);
      return false;
    }
  }
});
```

If you're sending the objects to the server in any way, it's always best to
wait to call `clean` until you're on the server so that the auto values can be
trusted.

### formToDoc and docToForm

Specify `formToDoc` and `docToForm` hooks if you need form values in a different
format in your form versus in the mongo document. They are mainly useful if you
decide to override an input type.

*Unlike document modifications made in "before hooks", modifications made in the
`formToDoc` hooks are made every time the form is validated, which could
happen a couple times per second on the client, depending on validation mode.
The other hooks are run only right before the corresponding submission actions,
as their names imply.*

Here is an example where this feature is used to allow comma-delimited entry in
a text field but store (and validate) the values as an array:

First specify `type: [String]` in the schema. The schema should reflect what you
are actually storing.

*For the `afFieldInput` helper, don't supply the `options` attribute:*

```html
{{> afFieldInput name="tags"}}
```

When there are no options, a `<select>` element will not be generated
even though we're expecting an array.

Then in client code, add the hooks:

```js
AutoForm.hooks({
  postsForm: {
    docToForm: function(doc) {
      if (_.isArray(doc.tags)) {
        doc.tags = doc.tags.join(", ");
      }
      return doc;
    },
    formToDoc: function(doc) {
      if (typeof doc.tags === "string") {
        doc.tags = doc.tags.split(",");
      }
      return doc;
    }
  }
});
```

## Complex Schemas

You can use mongo dot notation to map an input to a subdocument. For example:

* If you use `{{> afFieldInput 'address.street'}}`, whatever is entered in the field will be assigned to `doc.address.street`.
* If you use `{{> afFieldInput 'addresses.1.street'}}`, whatever is entered in the field will be assigned to the `street` property of the object at index 1 in the `doc.addresses` array.

## Complex Controls

If you need to have more complex form controls but still want to use an
`autoForm`, a good trick is to use change events to update a hidden form field
that is actually the one being validated and submitted.

Say that you want to submit a comma-delimited string of the best times to call someone
as part of your contact form. The relevant part of the schema would be:

```js
bestTimes: {
    type: String,
    label: "Best times to call"
}
```

Pretty simple. But now you want to give the user check boxes to select those times, and
derive the bestTimes string from her selections. The HTML would look like this:

```html
{{#autoForm schema="ContactFormSchema" id="contactForm" type="method" meteormethod="contact"}}
  <!-- other fields -->
  <div class="form-group {{#if afFieldIsInvalid name='bestTimes'}}has-error{{/if}}">
    {{> afFieldLabel name="bestTimes"}}
    {{> afFieldInput name="bestTimes" type="hidden"}}
    <div class="checkbox"><label><input type="checkbox" id="cfTimes1" name="cfTimes" value="Morning" /> Morning</label></div>
    <div class="checkbox"><label><input type="checkbox" id="cfTimes2" name="cfTimes" value="Afternoon" /> Afternoon</label></div>
    <div class="checkbox"><label><input type="checkbox" id="cfTimes3" name="cfTimes" value="Evening" /> Evening</label></div>
    {{#if afFieldIsInvalid name="bestTimes"}}
    <span class="help-block">{{afFieldMessage name="bestTimes"}}</span>
    {{/if}}
  </div>
{{/autoForm}}
```

Notice that the check boxes are normal HTML form elements, nothing special. We also have
an input field above that, though, and we've overridden the type to be hidden. Now
we can set up an event handler to update the hidden input whenever the check box
selections change:

```js
Template.contact.events({
    'change [name=cfTimes]': function(event, template) {
        var bestTimes = "";
        _.each(template.findAll("[name=cfTimes]:checked"), function(checkbox) {
            bestTimes += checkbox.value + ", ";
        });

        if (bestTimes.length) {
            bestTimes = bestTimes.slice(0, -2);
        }

        $(template.find('[data-schema-key=bestTimes]')).val(bestTimes);
    },
    'reset form': function(event, template) {
        $(template.find('[data-schema-key=bestTimes]')).val("");
    }
});
```

This is pretty straightforward code. Note that you can find an input element generated by
autoform by examining the "data-schema-key" attributes. The corresponding schema key
is stored in this attribute for all generated form elements.

Now the form will be successfully submitted when at least one check box is selected,
but it will be invalid if none are selected because the hidden bestTimes field's value
will be an empty string, and bestTimes is required.

NOTE: This is for illustration, but a case like this might be better accomplished
by simply changing the schema and then adjusting the value into a string once
the validated doc arrives on the server.

## Using Block Helpers Within an AutoForm

Because of the way the `{{#autoForm}}` block helper keeps track of data, if you use a block helper
within an autoForm and that block helper changes the context (`{{#each}}` and `{{#with}}`), the `afFieldMessage` and `afFieldIsInvalid` helpers won't work correctly.

To get around this issue, when you use `afFieldMessage` or `afFieldIsInvalid` within one of these "sub-blocks", you must
provide an `autoform` attribute that supplies the autoform context, which you can get by using
the Spacebars ".." syntax. The `autoform` attribute is *not* necessary for autoform components (anything you put a `>` before), only for the helpers.

An example will be clearer:

```html
{{#autoForm collection="Books" id="myBookForm" type="insert"}}
  {{#with objectContainingName}}
    {{afFieldMessage name=name autoform=..}}
  {{/with}}
{{/autoForm}}
```

## Dates

By default, a schema field with `type: Date` will generate an input element with
`type=date`. You can override the type on each `afFieldInput` or `afQuickField`
helper if you want to use a `datetime` or `datetime-local` input instead. Here
are some tips for using each input type.

*Consider using the [moment and moment-timezone](http://momentjs.com/) libraries to make this easy.*

### type=date

* **Saving:** The user-entered value must be of the format `YYYY-MM-DD`,
and it will be saved as a `Date` object representing that
exact datetime in the UTC time zone. (Chrome and some mobile browsers provide
date pickers that set the input value to a string in this format automatically,
but users of other browsers will have to manually enter the date in the correct
format.)
* **Loading:** If you are binding an object containing `Date` objects to an update autoform
and using them in an input with `type="date"`, the date that will be used as
the value of the input is the date represented by the `Date` object
in the UTC time zone, with the time portion ignored.
* **Displaying:** To make sure that the date format you use matches what the user
expects, you should construct your display strings based on the `Date` object
in the UTC time zone. Using the `moment` library, you might do something
like this: `moment.utc(myDate).format("LL")`
* **Min/Max:** When specifying min or max values in your schema, use a `Date`
object that represents midnight on the morning of the minimum or maximum date
in the UTC time zone.

### type=datetime

*Note: Using this type of input requires that the user do all the work to convert
from the applicable time zone to the UTC time zone since the entered time is
assumed to be UTC. It's generally better to use datetime-local.*

* **Saving:** The user-entered value must be of the format `date string + "T" + 
time string + "Z"`, and it will be saved as a `Date` object representing that
exact datetime in the UTC time zone.
* **Loading:** If you are binding an object containing `Date` objects to an update autoform
and using them in an input with `type="datetime"`, the date that will be used as
the value of the input is the date and time represented by the `Date` object
in the UTC time zone.
* **Displaying:** To make sure that the date format you use matches what the user
expects, you should construct your display strings based on the `Date` object
in the UTC time zone, or indicate on screen which time zone you are displaying.
Using the `moment` library, you might do something like this: `moment.utc(myDate).format("LLLL")`
* **Min/Max:** When specifying min or max values in your schema, use a `Date`
object that represents the exact minimum or maximum date and time
in the UTC time zone.

### type=datetime-local

* **Saving:** If you use an input with `type="datetime-local"`, you should also
specify an `offset` attribute on the `afFieldInput` or `afQuickField` helper.
Set this attribute to a UTC offset string such as "+05:00" or "-0300" or "Z". This
offset string will be appended to the user-entered date string to create the `Date`
object that will be saved. For example, if you use an input with `type="datetime-local"` in a form
in which a user is setting up a meeting, you would need to previously determine
the time zone in which the meeting will take place. When generating the autoform
field, set the `offset` attribute to the UTC offset for this time zone.
(Chrome and some mobile browsers provide
datetime pickers that set the input value to a string in the expected format automatically,
but users of other browsers will have to manually enter the datetime in the correct
format, which is `date string + "T" + time string`.)
* **Loading:** If you are binding an object containing `Date` objects to an update autoform
and using them in an input with `type="datetime-local"`, be sure to set the
`offset` attribute on the helper to the time zone offset that applies. This will
ensure that the date and time you expect are shown in the input element.
* **Displaying:** Before displaying the saved date, determine the equivalent
date and time in the corresponding time zone. The easiest way to do this is
using `var m = moment(myDate).zone(myDesiredTimeZoneOffset); var displayString = m.format();`
from the `moment` package/library. (`zone` setting is available starting with
version 2.1.0 of Moment.)
* **Min/Max:** When specifying min or max values in your schema, use a `Date`
object that represents the exact minimum or maximum date and time
in the corresponding time zone. This may mean returning the min or max value
from a function based on a time zone name or offset you are storing elsewhere.

## Templates

AutoForm has a robust and extendable template system. The following templates are built in:

* `bootstrap3`: Default. UI elements will be generated using Bootstrap 3 structure
and classes.
* `bootstrap3-horizontal`: Can be used with `afQuickField` or `quickForm` only. Generates markup and
classes necessary to make the form appear with labels aligned horizontally with the fields.
In additional to setting `template="bootstrap3-horizontal"` on your `afQuickField`, you must
also define the column classes to use, for example, `{{> afQuickField name="name" template="bootstrap3-horizontal" label-class="col-sm-3" input-col-class="col-sm-9"}}` or `{{> quickForm schema=Schemas.ContactForm id="contactForm" type="method" meteormethod="sendEmail" template="bootstrap3-horizontal" label-class="col-sm-3" input-col-class="col-sm-9"}}`.
* `plain`: UI elements will be generated with no particular UI framework in mind.
(You can of course add your own classes to customize.)
* `plain-fieldset`: Can be used with `quickForm` only. Wraps the form in a
`fieldset`. Additionally allows a `label` attribute that determines what the
fieldset label should be.
* `plain-span`: Can be used with `afFieldLabel` only. Uses a `span` element
for the label rather than `label`.
* `bootstrap3-span`: Can be used with `afFieldLabel` only. Uses a `span` element
for the label rather than `label`, and uses `bootstrap3`.

### Using a Different Template

The AutoForm components can be generated using a specific template by
providing a template name as the `template` option. In addition, you
can change the default template for all components or for a particular
component type at any time:

```js
AutoForm.setDefaultTemplate('plain');

//OR

AutoForm.setDefaultTemplateForType('afFieldLabel', 'plain-span');
```

These methods are reactive, meaning that as soon as you call them, you'll
instantly see all visible forms change, if they're using the defaults.

Here's the list of possible types you can use for the first argument of
`setDefaultTemplateForType`:

* quickForm
* afDeleteButton
* afQuickField
* afFieldLabel
* afFieldSelect
* afCheckbox
* afCheckboxGroup
* afRadio
* afRadioGroup
* afSelect
* afTextarea
* afContenteditable
* afInput
* afObjectField
* afArrayField

Note that there is not a single "afFieldInput" type but rather various types
corresponding to the different elements or element groups that `afFieldInput`
might render.

### Creating a Custom Template

To define a custom template that is recognized by the AutoForm
templates system, simply create a template with the name
`afType + "_" + templateName`. For example, if I want to define a template
named "nothing" that can be used by a `quickForm` to generate nothing:

```html
<template name="quickForm_nothing">
</template>
```

And then use it like this:

```html
{{> quickForm schema=mySchema id="nothingForm" template="nothing"}}
```

Or tell all quickForms to use it:

```js
AutoForm.setDefaultTemplateForType('quickForm', 'nothing');
```

Obviously a real example would be a bit more complex. Your template will have
access to certain built-in helpers and properties in the data context, and you can
use those to generate what you need in the format you need it. In practice,
it is easiest to start by duplicating one of the built-in templates and then
modify your copy as necessary.

If you create a good set of templates for a commonly used framework or a
common purpose, consider releasing it as a separate add-on package. The goal
is to keep the built-in templates minimal but to provide many others through
separate packages.

## Making AutoForm-Ready Components

Making a custom component for use with autoform is still a complicated task, but it will gradually become easier as the Blaze engine improves and work to make AutoForm more modular is completed. As of right now, you can put anything within an autoForm block and then tell AutoForm how to extract a value from it when the form is validated or submitted. The general steps are:

1. Add your custom input or other markup within the `autoForm` block.
2. Add the `data-schema-key` attribute to it, specifying the schema key for which the input provides a value.
3. Add a class or other unique attribute to the element, so that you can provide a selector for it in the next step.
4. Tell AutoForm how to extract a value from your input by providing a custom input value handler.

An example custom input value handler:

```js
AutoForm.inputValueHandlers({
  'input.myDoubledInput': function () {
    return parseFloat(this.val()) * 2;
  }
});
```

For more examples, see the built-in handlers [here](https://github.com/aldeed/meteor-autoform/blob/master/autoform-inputs.js#L4). Custom handlers are used before default handlers, and the first one with a matching selector is used.

## Common Questions

### Should the value of `schema` and `collection` have quotation marks around it?

It depends. If you use quotation marks, then you are telling the autoform to
"look for an object in the `window` scope with this name". So if you define
your collections at the top level of your client files and without the `var`
keyword, then you can use this trick to avoid writing helpers.

If you don't use quotation marks, then you must define a helper function with
that name and have it return the SimpleSchema or Meteor.Collection instance.

Probably the best technique for organizing your form schemas and making them
available as helpers is to add all SimpleSchema instances to a `Schemas` object
and register that object as a helper:

*common.js:*

```js
Schemas = {};

Schemas.ContactForm = new SimpleSchema({
  name: {
    type: String,
    label: "Your name",
    max: 50
  },
  email: {
    type: String,
    regEx: SimpleSchema.RegEx.Email,
    label: "E-mail address"
  },
  message: {
    type: String,
    label: "Message",
    max: 1000
  }
});

//... define all schemas

```

*client.js:*

```js
UI.registerHelper("Schemas", Schemas);
```

*html:*

```html
<template name="contactForm">
  {{#autoForm schema=Schemas.ContactForm id="contactForm" type="method" meteormethod="sendEmail"}}
  <!-- etc. -->
  {{/autoForm}}
</template>
```

### Which components should I use?

Generally you should start by using a `quickForm` for every form your app needs.
Then, if the generated form does not look correct, try the following in
this order:

1. If there is something you can change or fix about the form's schema that
will cause the `quickForm` to render correctly, change it. If the form is for
a collection, you can also try using a different schema (a subset, perhaps with
stricter rules) to render the form by supplying the `schema` attribute in
addition to the `collection`.
2. If many of your forms need the same change, try writing and using a
custom template for those forms if possible.
3. Switch to using an `autoForm` with `afQuickField`s. You can then set
attributes for both inputs and labels (using `label-` prefix), omit labels
if necessary (`label=false`), and specify field-specific template overrides.
These features are typically enough to get the appearance you want.
4. If you really need something truly custom for just one field in just one
form, you can then switch to using the `afFieldLabel` and `afFieldInput`
components directly.

### Can I reuse the same `quickForm` or `autoForm` for both inserts and updates?

Yes. Your code that flips between states should do the following in this order:

1. Change the `type` attribute's value to "insert" or "update" as appropriate,
probably by updating a reactive variable.
2. Change the `doc` attribute's value to the correct document for an update or
to `null` (or a document containing default values) for an insert, probably by
updating a reactive variable.
3. Call `AutoForm.resetForm(formId)`. This will clear any existing validation
errors for the form.

You will probably also have to remove the `preserve-inputs` package to avoid
issues with values from the previous form state refusing to disappear.

### Can I put HTML in my error messages?

Yes. Define your messages using one of the `SimpleSchema` methods, including
HTML elements such as `<strong>`. Then be sure to wrap your `afFieldMessage`
tags in triple stashes.

## Examples

A somewhat messy app used for testing is [here](https://github.com/aldeed/meteor-autoform-example).

I would like to link to examples of public sites using this in production. If you have one,
please add a link here. You can include a brief description of how you're using autoforms
on the site, too. If the code is publicly available, link to that, too.

## Troubleshooting

If nothing happens when you click the submit button for your form and there are
no errors, make sure the button's type is `submit`.

## Contributing

Anyone is welcome to contribute. Fork, make your changes, and then submit a pull request.

[![Support via Gittip](https://rawgithub.com/twolfson/gittip-badge/0.2.0/dist/gittip.png)](https://www.gittip.com/aldeed/)
