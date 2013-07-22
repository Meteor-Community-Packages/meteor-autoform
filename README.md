AutoForm
=========================

A smart package for Meteor that adds handlebars helpers to easily create basic
forms with automatic insert and update events, and automatic reactive validation. 
Requires and automatically installs the collection2 package.

## Example

Let's say you have the following model definition:

```js

```

Creating insert, update, and delete forms with automatic validation and events
is now as simple as this:

```html
<body>

</body>
```

No javascript necessary!

## Available Helpers

### autoForm

Use this block helper instead of `<form>` elements to wrap your form and gain all the advantages of the autoform package. The rest of the
helpers must be used within an `autoForm` block.

### afFieldMessage "propertyName"

Returns the user-friendly invalid reason message for the specified property. An empty string if the property is not invalid.

### afFieldIsInvalid "propertyName"

Returns true if the specified property is currently invalid.

### afFieldInput "propertyName" [options]

Adds the form input control that is most appropriate for the given property's
data type, as defined in the schema.

* If type is `String`, `<input type="text">`.
* If you specify `rows` in the schema for a `String` type property, a `<textarea>` is used instead of an `<input type="text">`.
* If type is `Number`, `<input type="number">`. You may specify the step, min, and max attributes to further restrict entry.
* If type is `Date`, `<input type="date">`. If you want `datetime` or `datetime-local` instead, specify your own `type`
attribute when calling the helper.
* If type is `String` and regEx is `SchemaRegEx.Email`, `<input type="email">`.
* If type is `String` and regEx is `SchemaRegEx.Url`, `<input type="url">`.
* If type is `Boolean`, a checkbox is used by default. However, if you set the
`radio` or `select` attributes when calling the helper, then a radio or select
control will be used instead. Use the `trueLabel` and `falseLabel` attributes
to set the label used in the radio or select controls.
* If options is set, a `<select>` control is used instead. If type is also an array, such as `[String]`, then
it is a multiple-select control.
* If optional is `false` or not set in the schema, the `required` attribute is added to the DOM element.
* Specifying `max` when type is `String` causes the `maxlength` attribute to be added to the DOM element.
* Specifying `min` or `max` dates when type is `Date` causes those dates to be added to the DOM element in
`min` and `max` attributes.

You can specify any attributes for the helper, and they will be transferred to the resulting DOM element. For example:

```html
{{afFieldInput "firstName" autofocus="true" class="inputClass"}}
```

For boolean attributes, such as autofocus, you must specify some value after the
`=`, but the value makes no difference. The mere presence of the attribute will
cause it to be added to the DOM element.

### afFieldLabel

Adds a `<label>` element with the `label` defined in the schema, or the property
name if no label is defined.