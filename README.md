AutoForm
=========================

AutoForm is a smart package for Meteor that adds handlebars helpers to easily create basic
forms with automatic insert and update events, and automatic reactive validation. 
This package requires and automatically installs the [simple-schema](https://github.com/aldeed/meteor-simple-schema) package.
You can optionally use it with the [collection2](https://github.com/aldeed/meteor-collection2) package, which you
have to add to your app yourself.

## Installation

Install using Meteorite. When in a Meteorite-managed app directory, enter:

```
$ mrt add autoform
```

## Example

Let's say you have the following definition of a Collection2 instance:

```js
Books = new Meteor.Collection2("books", {
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

### An Insert Form

Creating an insert form with automatic validation and submission is as simple as this:

```html
<template name="insertBookForm">
    {{#autoForm schema=booksCollection id="insertBookForm"}}
    <fieldset>
        <legend>Add a Book</legend>
        <div class="form-group{{#if afFieldIsInvalid 'title'}} has-error{{/if}}">
            {{afFieldLabel 'title'}}
            {{afFieldInput 'title'}}
            {{#if afFieldIsInvalid 'title'}}
            <span class="help-block">{{afFieldMessage 'title'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'author'}} has-error{{/if}}">
            {{afFieldLabel 'author'}}
            {{afFieldInput 'author'}}
            {{#if afFieldIsInvalid 'author'}}
            <span class="help-block">{{afFieldMessage 'author'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'summary'}} has-error{{/if}}">
            {{afFieldLabel 'summary'}}
            {{afFieldInput 'summary'}}
            {{#if afFieldIsInvalid 'summary'}}
            <span class="help-block">{{afFieldMessage 'summary'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'copies'}} has-error{{/if}}">
            {{afFieldLabel 'copies'}}
            {{afFieldInput 'copies'}}
            {{#if afFieldIsInvalid 'copies'}}
            <span class="help-block">{{afFieldMessage 'copies'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'lastCheckedOut'}} has-error{{/if}}">
            {{afFieldLabel 'lastCheckedOut'}}
            {{afFieldInput 'lastCheckedOut'}}
            {{#if afFieldIsInvalid 'lastCheckedOut'}}
            <span class="help-block">{{afFieldMessage 'lastCheckedOut'}}</span>
            {{/if}}
        </div>
    </fieldset>
    <button type="submit" class="btn btn-primary insert">Insert</button>
    {{/autoForm}}
</template>
```

And one client-side helper:

```js
Template.insertBookForm.booksCollection = function () {
    return Books;
};
```

(If `Books` is in the global/window scope, you could instead do `schema="Books"`
on the `autoForm` helper and skip the `booksCollection` helper.)

And that's it! You don't have to write any specific javascript functions to validate the data
or perform the insert.

Notice the following:
* `autoForm` is a block helper. `{{#autoForm}}` and `{{/autoForm}}` are replaced
with `<form>` and `</form>`, respectively. All of the helpers within expect to
be within an autoForm block.
* All of the helpers that generate HTML elements can take any attributes you want to supply,
and will add all of them to the generated HTML element. So you can add class, id, etc.
* As long as you use a button with `type="submit"` and the "insert" class, validation
and insertion will happen automatically, and the `afFieldIsInvalid` and `afFieldMessage`
helpers will reactively update.

### An Update Form

What about an update form? It's pretty much the same as an insert form:

```html
<template name="updateBookForm">
    {{#autoForm schema=booksCollection doc=selectedBook id="updateBookForm"}}
    <fieldset>
        <legend>Edit Book</legend>
        <div class="form-group{{#if afFieldIsInvalid 'title'}} has-error{{/if}}">
            {{afFieldLabel 'title'}}
            {{afFieldInput 'title'}}
            {{#if afFieldIsInvalid 'title'}}
            <span class="help-block">{{afFieldMessage 'title'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'author'}} has-error{{/if}}">
            {{afFieldLabel 'author'}}
            {{afFieldInput 'author'}}
            {{#if afFieldIsInvalid 'author'}}
            <span class="help-block">{{afFieldMessage 'author'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'summary'}} has-error{{/if}}">
            {{afFieldLabel 'summary'}}
            {{afFieldInput 'summary'}}
            {{#if afFieldIsInvalid 'summary'}}
            <span class="help-block">{{afFieldMessage 'summary'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'copies'}} has-error{{/if}}">
            {{afFieldLabel 'copies'}}
            {{afFieldInput 'copies'}}
            {{#if afFieldIsInvalid 'copies'}}
            <span class="help-block">{{afFieldMessage 'copies'}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'lastCheckedOut'}} has-error{{/if}}">
            {{afFieldLabel 'lastCheckedOut'}}
            {{afFieldInput 'lastCheckedOut'}}
            {{#if afFieldIsInvalid 'lastCheckedOut'}}
            <span class="help-block">{{afFieldMessage 'lastCheckedOut'}}</span>
            {{/if}}
        </div>
    </fieldset>
    <button type="submit" class="btn btn-primary update">Update</button>
    {{/autoForm}}
</template>
```

Notice the following:
* The form is identical to the insert form except that the `doc` attribute is
supplied on the `autoForm` helper, and the submit button has the "update" class
instead of the "insert" class.
* The form will function just like the insert form, too, except that the current
values of all the fields will be pulled from the document supplied in the `doc`
attribute, and that document will be updated when the user clicks the submit button.
* Since the forms are so similar, you can actually use the same form for both inserts
and updates if you want. Just swap the class on the submit button, and for inserts,
pass in null or undefined to the `doc` attribute.

### A Remove Form

And finally, how about an example of a remove form:

```html
{{#autoForm schema=booksCollection doc=this}}
  <button type="submit" class="btn btn-primary remove">Delete</button>
{{/autoForm}}
```

Pretty self explanatory by this point. Just use a submit button with the "remove" class. You might use this,
for example, within an `{{#each}}` block that lists the books.

## Available Helpers

### autoForm

Use this block helper instead of `<form>` elements to wrap your form and gain all the advantages of the autoform package. The rest of the
helpers must be used within an `autoForm` block.

Attributes:
* `schema`: Required. Pass either the name of a Collection2 instance or the name of an AutoForm instance.
* `doc`: Required for update and remove actions. Pass the current document object. It's usually easiest to pass
the name of a custom helper that returns the object by calling `findOne()`.
* `validation`: Optional. See the "Fine Tuning Validation" section.
* `framework`: Optional. See the "Frameworks" section.
* Any additional attributes are passed along to the `<form>` element, meaning that you can add classes, etc.

It's best to always include an `id` attribute on your `autoForm` helper. This helps
ensure input preservation and also sets up form-specific validation contexts. A form-specific
validation context means that you could have an insert and update form for the
same schema on the same page, and typing something invalid in, for example, the
"name" field in the insert form will turn that field red, but it won't turn the
"name" field in the update form red. By contrast, if you forget to specify an
`id` for the `autoForm`, both "name" fields would turn red even though the user
has only entered invalid text in one of them.

### afFieldMessage "propertyName"

Outputs the user-friendly invalid reason message for the specified property, or
an empty string if the property is valid. This value updates reactively whenever
validation is performed. Currently messages are in English and there is no way
to override them.

### afFieldIsInvalid "propertyName"

Returns true if the specified property is currently invalid. This value updates reactively whenever
validation is performed.

### afFieldInput "propertyName" [options]

Adds the form input control that is most appropriate for the given property's
data type, as defined in the schema.

* If type is `String`, `<input type="text">`.
* If you specify `rows` in the schema for a `String` type property, a `<textarea>` is used instead of an `<input type="text">`.
* If type is `Number`, `<input type="number">`. You may specify the step, min, and max attributes to further restrict entry. The min and max values defined in your schema are automatically transferred to the DOM element, too.
* If type is `Date`, `<input type="date">`. If you want `datetime` or `datetime-local` instead, specify your own `type`
attribute when calling the helper.
* If type is `String` and regEx is `SchemaRegEx.Email`, `<input type="email">`.
* If type is `String` and regEx is `SchemaRegEx.Url`, `<input type="url">`.
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

You can specify any additional attributes for the helper, and they will be transferred to the resulting DOM element. For example:

```html
{{afFieldInput "firstName" autofocus="" class="inputClass"}}
```

For boolean attributes, such as autofocus, you must specify an empty string after the
`=`.

To use the field label defined in the schema as the input's placeholder value,
add the attribute `placeholder="schemaLabel"`.

As mentioned, you must pass in `options` if you want a `<select>` control. The value of the
options attribute must be an array of objects, where each object has a `label` key and a `value` key. For example:

```html
{{afFieldInput "year" options=yearOptions}}
```

```js
Handlebars.registerHelper("yearOptions", function() {
    return [
        {label: "2013", value: 2013},
        {label: "2014", value: 2014},
        {label: "2015", value: 2015}
    ];
});
```

Or if you wanted those options to appear as checkboxes or radios instead, the
html would look like this:

```html
{{afFieldInput "year" options=yearOptions noselect="true"}}
```

The `framework` attribute can be used with this helper as well. See the "Frameworks" section.

### afFieldLabel "propertyName" [options]

Adds a `<label>` element with the `label` defined in the schema, or the property
name if no label is defined. You can specify any additional attributes for the helper,
and they will be transferred to the resulting `<label>` element.

The `framework` attribute can be used with this helper as well. See the "Frameworks" section.

## Non-Collection2 Forms

If you want to use an AutoForm for a form that does not relate to a collection (like a simple
contact form that sends an e-mail), or for a form that relates to a collection that is not a
collection2 collection (for example, Meteor.users()), you can do that.

1. Create an object that is an instance of AutoForm to define the schema.
2. Specify the AutoForm instance for the `schema` attribute of the `autoForm` helper.
3. Add one attribute, `data-meteor-method`, to the submit button of the form (must be `type="submit"`), and
set its value to the name of any 'Meteor.method()' you have defined.

If you do these three things, the form data will be gathered into a single object when
the user clicks the submit button. Then that object will be cleaned and validated against the
schema on the client and passed along to your method on the server. **You must
validate it again in your method on the server, using `check()` in combination
with `myAutoFormSchema`.**

### An Example Contact Form

The schema, defined on in common js:

```js
Schema.contact = new SimpleSchema({
    name: {
        type: String,
        label: "Your name",
        max: 50
    },
    email: {
        type: String,
        regEx: SchemaRegEx.Email,
        label: "E-mail address"
    },
    message: {
        type: String,
        label: "Message",
        max: 1000
    }
});
```

The HTML:

```html
<template name="contactForm">
    {{#autoForm schema=contactForm id="contactForm"}}
    <fieldset>
        <legend>Contact Us</legend>
        <div class="form-group{{#if afFieldIsInvalid 'name'}} has-error{{/if}}">
            {{afFieldLabel "name" class="control-label"}}
            {{afFieldInput "name"}}
            {{#if afFieldIsInvalid "name"}}
            <span class="help-block">{{afFieldMessage "name"}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'email'}} has-error{{/if}}">
            {{afFieldLabel "email" class="control-label"}}
            {{afFieldInput "email"}}
            {{#if afFieldIsInvalid "email"}}
            <span class="help-block">{{afFieldMessage "email"}}</span>
            {{/if}}
        </div>
        <div class="form-group{{#if afFieldIsInvalid 'message'}} has-error{{/if}}">
            {{afFieldLabel "message" class="control-label"}}
            {{afFieldInput "message" rows="10"}}
            {{#if afFieldIsInvalid "message"}}
            <span class="help-block">{{afFieldMessage "message"}}</span>
            {{/if}}
        </div>
        <div>
            <button type="submit" data-meteor-method="sendEmail" class="btn btn-primary">Submit</button>
            <button type="reset" class="btn btn-default">Reset</button>
        </div>
    </fieldset>
    {{/autoForm}}
</template>
```

The client-side helper:

```js
var cForm = new AutoForm(Schema.contact);
Template.contactForm.helpers({
  contactForm: function() {
    return cForm;
  }
});
```

The Meteor method:

```js
Meteor.methods({
    sendEmail: function(doc) {
        check(doc, Schema.contact);
        var text = "Name: " + doc.name + "\n\n"
                + "Email: " + doc.email + "\n\n\n\n"
                + doc.message;

        this.unblock();

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
not have to do any of your own validation with Collection2 inserts or updates,
but you do have to call `check()` on the server when submitting to a Meteor method.

## Callbacks

In the example contact form above, any validation error messages will display automatically,
but what if you wanted to display a message to the user telling him that his message was sent successfully.
For this, the autoform package adds a `callbacks()` method to Collection2 and AutoForm objects. This 
method is only available on the client, and allows you to specify callbacks for the inserts, updates, removes,
and method calls.

An example of callbacks for a Collection2 object:

```js
Documents.callbacks({
    insert: function(error, result) {
        if (error) {
            console.log("Insert Error:", error);
        } else {
            alert("Inserted!");
            console.log("Insert Result:", result);
        }
    },
    update: function(error) {
        if (error) {
            console.log("Update Error:", error);
        } else {
            alert("Updated!");
        }
    },
    remove: function(error) {
        if (error) {
            console.log("Remove Error:", error);
        }
    }
});
```

These callbacks are the same as those you would normally specify as the last
argument of the insert, update, and remove methods on a Meteor.Collection.

An example of callbacks for an AutoForm object, such as for the previous contact form example:

```js
ContactForm.callbacks({
    "sendEmail": function(error, result, template) {
        if (!error) {
            alert("Your message was sent.");
        } else {
            alert("There was a problem sending your message. Please verify your entries in all fields.");
        }
    }
});
```

In this case, the name of the callback is the name of the method. The callback is very similar
to the normal callback you supply when calling Meteor.call(), except that the AutoForm template
object is additionally passed as the third parameter. One use for the template object
might be so that you can call `find()` or `findAll()` to clean up certain form fields if the result was successful
or show additional error-related elements if not. This should be rarely needed unless
you have complex custom controls in your form.

## Modifying the Form Object

When the user submits an AutoForm, an object that contains all of the form data is automatically generated. If
the submission action is insert or a method call, this is a normal document object. If the submission action is
update, this is a mongo-style update object with `$set` and potentially `$unset` objects. In most cases,
the object will be perfect for your needs. However, you might find that you want to modify the object in some way.
For example, you might want to add the current user's ID to a document before it is inserted. To do this,
you can define a function to be called after the form data is gathered into an object, but before the
object is validated and submitted.

### MyCollection2.beforeInsert

You can set `MyCollection2.beforeInsert` equal to a function the takes the object to be inserted as its only argument
and returns a modified copy of the object. Remember that whatever modifications you make must still pass SimpleSchema
validation.

*This is run only on the client. Therefore, you should
not assume that this will always run since a devious user could skip it.*

### MyCollection2.beforeUpdate

You can set `MyCollection2.beforeUpdate` equal to a function the takes the ID of
the document to be updated as it's first argument and the update object as its second argument
and returns a modified copy of the update object. Remember that whatever modifications you make must still pass SimpleSchema
validation. Keep in mind that the object this function receives will have the `$set` and potentially `$unset` keys
at the first level.

*This is run only on the client. Therefore, you should
not assume that this will always run since a devious user could skip it.*

### MyCollection2.beforeRemove

You can set `MyCollection2.beforeRemove` equal to a function the takes the ID of
the document to be removed as its only argument and returns `false` to cancel the
removal.

*This is run only on the client. Therefore, you should
not assume that this will always run since a devious user could skip it.*

### MyAutoForm.beforeMethod or MyCollection2.beforeMethod

You can set `MyAutoForm.beforeMethod` or `MyCollection2.beforeMethod` equal to a function the takes the object that will be passed to a method
as its first argument and the name of the method as its second argument. This function must return a modified copy
of the object. Remember that whatever modifications you make must still pass SimpleSchema validation.

*This is run only on the client. Therefore, you should
not assume that this will always run since a devious user could skip it.*

### MyAutoForm.formToDoc, MyCollection2.formToDoc, MyAutoForm.docToForm, MyCollection2.docToForm

Specify `formToDoc` and `docToForm` functions if you need form values in a different
format in your form versus in the mongo document. They are mainly useful if you
decide to override an input type.

*Unlike document modifications made in `beforeInsert`,
`beforeUpdate`, or `beforeMethod` functions, modifications made in the
`formToDoc` and `docToForm` functions are made every time the form is validated, which could
happen very often on the client. The others are run only right before the
corresponding submission actions, as their names imply.*

Here is an example where this feature is used to allow comma-delimited entry in
a text field but store the values as an array:

First specify `type: [String]` in the schema.

*For the `afFieldInput` helper, don't supply options:*

```html
{{afFieldInput "tags"}}
```

When there are no options, a `<select>` element will not be generated.

Then in client code:

```js
Posts.docToForm = function (doc) {
  return doc.tags.join(', ');
};

Posts.formToDoc = function (doc) {
  if ('tags' in doc) {
    doc.tags = doc.tags.split(",");
    //loop through values and trim() or whatever else you want to do
  }
  return doc;
};
```

## Fine Tuning Validation

To control when fields should be validated, use the `validation` attribute on
the `{{autoform}}` helper. Supported values are:

* `none`: Do not validate any form fields at any time.
* `submit`: Validate all form fields only when the form is submitted.
* `keyup`: Validate each form field on every key press and when the user moves the cursor off it (throttled to run at most once every 300 milliseconds). Also validate all fields again when the form is submitted.
* `blur`: Validate each form field when the user moves the cursor off it (throttled to run at most once every 300 milliseconds). Also validate all fields again when the form is submitted.
* `submitThenKeyup`: At first acts like the `submit` option, but after the user attempts to submit the form and it fails validation, subsequently acts like `keyup`.
* `submitThenBlur`: At first acts like the `submit` option, but after the user attempts to submit the form and it fails validation, subsequently acts like `blur`.

If you do not include the validation attribute, `submitThenKeyup` is used as the default validation method.

__Note:__
If you choose `keyup` validation, there is sometimes a bug in Safari where
the autofill mechanism will cause the text in the input to be selected after
each keypress.  This has the effect of making it near impossible to
actually type anything because you keep "overwriting" your input. To fix this,
simply add the `autocomplete="off"` attribute to your input fields.

## Doing Your Own Thing On Submit

Submitting to a server method allows you to do anything you want with the form
data on the server, but what if you want to do something with the form data on
the client? For that, you can bind a submit event handler to the autoform using
the `autoForm` helper's `onSubmit` attribute.

```html
<template name="contactForm">
  {{#autoForm schema=ContactForm id="contactForm" onSubmit=onSubmit}}
  {{/autoForm}}
</template>
```

And define a helper that returns your function:

```js
Template.contactForm.onSubmit = function () {
    return function (insertDoc, updateDoc, currentDoc) {
        if (customHandler(insertDoc))
          this.resetForm();
        return false;
    };
};
```

The arguments passed to your function are as follows:

* `insertDoc`: The form input values in an object suitable for use with insert()
* `updateDoc`: The form input values in an object (modifier) suitable for use with update()
* `currentDoc`: The object that's currently bound to the form through the doc attribute

`this` provides a `resetForm` method, which you can call to reset the corresponding autoform if necessary.

If you return false, no further submission will happen. This might be useful if
you have, for example, the `insert` class on your submit button as well.

Otherwise the onSubmit function acts pretty much like any other onSubmit function, except
that insertDoc and updateDoc are validated before it is called. However, since
this is client code, you should never assume that insertDoc and updateDoc are valid.

## Complex Controls

If you need to have more complex form controls but still want to use an AutoForm, a good trick
is to use change events to update a hidden form field that is actually the one being validated
and submitted.

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
{{#autoForm schema="ContactForm" id="contactForm"}}
<!-- other fields -->
<div>
    {{afFieldLabel "bestTimes"}}
    {{afFieldInput "bestTimes" type="hidden"}}
    <div class="checkbox"><label><input type="checkbox" id="cfTimes1" name="cfTimes" value="Morning" /> Morning</label></div>
    <div class="checkbox"><label><input type="checkbox" id="cfTimes2" name="cfTimes" value="Afternoon" /> Afternoon</label></div>
    <div class="checkbox"><label><input type="checkbox" id="cfTimes3" name="cfTimes" value="Evening" /> Evening</label></div>
    {{#if afFieldIsInvalid "bestTimes"}}
    <span class="help-block">{{afFieldMessage "bestTimes"}}</span>
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

## Complex Schemas

If your schema contains any keys with basic object dot notation, they will work fine with
AutoForm. For example, you can do `{{afFieldInput 'address.street'}}` and everything
will work properly. Whatever is entered in the field would be assigned to `doc.address.street`
as you would expect.

Assigning to an object in an array might also work, but this has not been thoroughly tested yet. For example,
`{{afFieldInput 'addresses.1.street'}}` should correctly pull existing values from and save
new values to `doc.addresses[1].street`. This probably doesn't work 100% yet, though. (Pull request welcome.)

## QuickForm

If your goal is to quickly develop a form that allows you to insert, update, remove, or call a method with validation,
check out the included `{{quickForm}}` and `{{afQuickField}}` helpers. `{{quickForm}}` will create the whole form for you in one line,
with fields, labels, and error messages based on the corresponding SimpleSchema.

Syntax:

```html
{{quickForm schema="MyAutoFormOrCollection2ObjectName" type="typeOfForm" method="methodName" buttonClasses="class1 class2" buttonContent="Insert" anotherFormAttribute="value"}}
```

* `type`: Must be supplied and must be "insert", "update", "remove", or "method".
* `method`: If type="method", specify the name of the method to call (for the data-meteor-method attribute on the submit button).
* `buttonClasses`: class attribute for the submit button.
* `buttonContent`: The submit button content. If you don't set this, "Submit" is used.
* `framework`: Optional. See the "Frameworks" section.

Those are the only supported attributes at this time. Any other attributes you specify will be output as
attributes of the `<form>` element, just like when using the `{{autoForm}}` block helper.

### afQuickField "propertyName" [options]

Similar to the `{{quickForm}}` helper, you can use `{{afQuickField}}` to output everything for a single field
at once: the label, the input, and the error message. Currently the default HTML markup and classes
matches what you would expect when using Bootstrap 3.

Any attributes you add will be passed along to the `{{afFieldInput}}` helper, so you can, for example,
pass in options to create a select control.

But what if you want to pass additional attributes to the label element? Simply prepend any attribute with
"label-" and it will be passed along to `{{afFieldLabel}}` instead of `{{afFieldInput}}`.

To omit the label element, use `label=false`. You can combine this with `placeholder="My Label"`
to get a placeholder label instead of a label element. Use the special `placeholder="schemaLabel"`
attribute value to automatically use the label from the schema.

The `framework` attribute can be used with this helper as well. See the "Frameworks" section. To set the 
framework for the label, use `label-framework`.

### afQuickField Example

```html
{{#autoForm schema=docCollection doc=selectedDoc}}
    {{afQuickField 'firstField' autofocus=''}}
    {{afQuickField 'weirdColors' style="color: orange" label-style="color: green"}}
    {{afQuickField "longString" rows="5"}}
    {{afQuickField "radioBoolean" radio="true" trueLabel="Yes" falseLabel="No"}}
    {{afQuickField "selectBoolean" select="true" trueLabel="Yes" falseLabel="No"}}
    {{afQuickField "optionsButNoSelect" options=numSelectOptions noselect="true"}}
    {{afQuickField "firstOptionSelect" firstOption="(Select Something)" options=numSelectOptions}}
    {{afQuickField "decimal" step="0.01"}}
    {{> buttons}}
{{/autoForm}}
```

### Future QuickForm Features

Eventually the quickForm helper will have a few different built in styles you can choose from, like horizontal, vertical, and responsive.

## Using Block Helpers Within an AutoForm

Because of the way the `{{#autoForm}}` block helper keeps track of data, if you use a block helper
within an autoForm and that block helper changes the context, things won't work correctly. Examples of
problematic block helpers are `{{#each}}` and `{{#with}}`.

To get around this issue, every "af"-prefixed helper you call within one of these "sub-blocks" must
provide an "autoform" attribute that supplies the autoform context, which you can get by using
the Handlebars "../" syntax.

An example will be clearer:

```html
{{#autoForm schema=booksCollection id="myBookForm"}}
    {{#with "title"}}
        {{afQuickField this autoform=../this}}
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

## Form Submission Details

When the submit event fires, this initiates the insert, update, remove, or method call after form validation.
Typically the default browser submission is prevented automatically for you, although it will submit like
a normal form (to the `action` url) if you have not set up the submit button to do an insert, update,
remove, or method call. This may be useful in some cases because it allows normal form submission after
auto-validaiton.

## Frameworks

By default, Bootstrap 3 classes are added to any generated elements. You may use
the `framework` attribute to override this on any helper that generates elements.
Currently, there are no other supported frameworks, but you may set `framework="none"`
to prevent adding any Bootstrap 3 classes. Set this on `autoForm` or `quickForm`
to affect the whole form. Set it on helpers within an `autoForm` to affect only
the elements generated by that helper, or to override the parent `autoForm` framework.

Submit an issue if you'd like to see another popular framework supported.

## More Examples

A somewhat messy, work-in-progress example app is [here](https://github.com/aldeed/meteor-autoform-example).

## Troubleshooting

If nothing happens when you click the submit button for your form and there are
no errors, make sure the button's type is `submit`.

## Contributing

Anyone is welcome to contribute. Fork, make your changes, and then submit a pull request.
