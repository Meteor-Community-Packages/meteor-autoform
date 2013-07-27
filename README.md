AutoForm
=========================

AutoForm is a smart package for Meteor that adds handlebars helpers to easily create basic
forms with automatic insert and update events, and automatic reactive validation. 
Requires and automatically installs the [collection2](https://github.com/aldeed/meteor-collection2) package, which in turn
requires the [simple-schema](https://github.com/aldeed/meteor-simple-schema) package.

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

Creating an insert form with automatic validation and submission is now as simple as this:

```html
{{#autoForm schema='Books'}}
<fieldset>
    <legend>Add a Book</legend>
    <div class="control-group{{#if afFieldIsInvalid 'title'}} error{{/if}}">
        {{afFieldLabel 'title'}}
        {{afFieldInput 'title'}}
        {{#if afFieldIsInvalid 'title'}}
        <span class="help-block">{{afFieldMessage 'title'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'author'}} error{{/if}}">
        {{afFieldLabel 'author'}}
        {{afFieldInput 'author'}}
        {{#if afFieldIsInvalid 'author'}}
        <span class="help-block">{{afFieldMessage 'author'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'summary'}} error{{/if}}">
        {{afFieldLabel 'summary'}}
        {{afFieldInput 'summary'}}
        {{#if afFieldIsInvalid 'summary'}}
        <span class="help-block">{{afFieldMessage 'summary'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'copies'}} error{{/if}}">
        {{afFieldLabel 'copies'}}
        {{afFieldInput 'copies'}}
        {{#if afFieldIsInvalid 'copies'}}
        <span class="help-block">{{afFieldMessage 'copies'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'lastCheckedOut'}} error{{/if}}">
        {{afFieldLabel 'lastCheckedOut'}}
        {{afFieldInput 'lastCheckedOut'}}
        {{#if afFieldIsInvalid 'lastCheckedOut'}}
        <span class="help-block">{{afFieldMessage 'lastCheckedOut'}}</span>
        {{/if}}
    </div>
</fieldset>
<button type="submit" class="btn btn-primary insert">Insert</button>
{{/autoForm}}
```

And that's it! You don't have to write any specific javascript functions to validate the data
or perform the insert.

Notice the following:
* `autoForm` is a block helper. `{{#autoForm}}` and `{{/autoForm}}` are replaced
with `<form>` and `</form>`, respectively. All of the helpers within expect to
be within an autoForm block.
* All of the helpers that generate HTML elements can take any attributes you want to supply,
and will add all of them to the generated HTML element. So you can add class, id, etc.
* As long as you use a button with type=submit and the "insert" class, validation
and insertion will happen automatically, and the `afFieldIsInvalid` and `afFieldMessage`
helpers will reactively update.

What about an update? It's pretty much the same:

```html
{{#autoForm schema='Books' doc=selectedBook}}
<fieldset>
    <legend>Edit Book</legend>
    <div class="control-group{{#if afFieldIsInvalid 'title'}} error{{/if}}">
        {{afFieldLabel 'title'}}
        {{afFieldInput 'title'}}
        {{#if afFieldIsInvalid 'title'}}
        <span class="help-block">{{afFieldMessage 'title'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'author'}} error{{/if}}">
        {{afFieldLabel 'author'}}
        {{afFieldInput 'author'}}
        {{#if afFieldIsInvalid 'author'}}
        <span class="help-block">{{afFieldMessage 'author'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'summary'}} error{{/if}}">
        {{afFieldLabel 'summary'}}
        {{afFieldInput 'summary'}}
        {{#if afFieldIsInvalid 'summary'}}
        <span class="help-block">{{afFieldMessage 'summary'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'copies'}} error{{/if}}">
        {{afFieldLabel 'copies'}}
        {{afFieldInput 'copies'}}
        {{#if afFieldIsInvalid 'copies'}}
        <span class="help-block">{{afFieldMessage 'copies'}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'lastCheckedOut'}} error{{/if}}">
        {{afFieldLabel 'lastCheckedOut'}}
        {{afFieldInput 'lastCheckedOut'}}
        {{#if afFieldIsInvalid 'lastCheckedOut'}}
        <span class="help-block">{{afFieldMessage 'lastCheckedOut'}}</span>
        {{/if}}
    </div>
</fieldset>
<button type="submit" class="btn btn-primary update">Update</button>
{{/autoForm}}
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

And finally, how about an example of a remove form:

```html
{{#autoForm schema='Books' doc=this}}
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
* Any additional attributes are passed along to the `<form>` element, meaning that you can add classes, etc. It's a
good idea to specify an `id` attribute if you want Meteor's input preservation to work.

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
* If options is set, a `<select>` control is used instead. If type is also an array, such as `[String]`, then
it is a multiple-select control.
* If optional is `false` or not set in the schema, the `required` attribute is added to the DOM element.
* Specifying `max` when type is `String` causes the `maxlength` attribute to be added to the DOM element.
* Specifying `min` or `max` dates when type is `Date` causes those dates to be added to the DOM element in
`min` and `max` attributes.

You can specify any additional attributes for the helper, and they will be transferred to the resulting DOM element. For example:

```html
{{afFieldInput "firstName" autofocus="true" class="inputClass"}}
```

For boolean attributes, such as autofocus, you must specify some value after the
`=`, but the value makes no difference. The mere presence of the attribute will
cause it to be added to the DOM element.

As mentioned, you must pass in `options` if you want a `<select>` control. The value of the
options attribute must be an array of objects, where each object has a `label` key and a `value` key. For example:

```html
{{afFieldInput 'year' options=yearOptions}}
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

### afFieldLabel "propertyName" [options]

Adds a `<label>` element with the `label` defined in the schema, or the property
name if no label is defined. You can specify any additional attributes for the helper,
and they will be transferred to the resulting `<label>` element.

## Non-Collection2 Forms

If you want to use an AutoForm for a form that does not relate to a collection (like a simple
contact form that sends an e-mail), or for a form that relates to a collection that is not a
collection2 collection (for example, Meteor.users()), you can do that.

1. Create an object that is an instance of AutoForm to define the schema.
2. Specify the AutoForm instance for the `schema` attribute of the `autoForm` helper.
3. Add one attribute, `data-meteor-method`, to the submit button of the form, and
set its value to the name of any 'Meteor.method()' you have defined.

If you do these three things, the form data will be gathered into a single object when
the user clicks the submit button. Then that object will be cleaned and validated against the
schema on both the client and the server before your method is ever called. This means
you don't have to write any validation code whatsoever in your method!

### An Example Contact Form

The AutoForm object:

```js
ContactForm = new AutoForm({
    name: {
        type: String,
        label: "Your name",
        max: 50
    },
    email: {
        type: String,
        regEx: SchemaRegEx.Email,
        regExMessage: "is not a valid e-mail address",
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
{{#autoForm schema="ContactForm" id="contactForm"}}
<fieldset>
    <legend>Contact Us</legend>
    <div class="control-group{{#if afFieldIsInvalid 'name'}} error{{/if}}">
        {{afFieldLabel "name" class="control-label"}}
        {{afFieldInput "name"}}
        {{#if afFieldIsInvalid "name"}}
        <span class="help-block">{{afFieldMessage "name"}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'email'}} error{{/if}}">
        {{afFieldLabel "email" class="control-label"}}
        {{afFieldInput "email"}}
        {{#if afFieldIsInvalid "email"}}
        <span class="help-block">{{afFieldMessage "email"}}</span>
        {{/if}}
    </div>
    <div class="control-group{{#if afFieldIsInvalid 'message'}} error{{/if}}">
        {{afFieldLabel "message" class="control-label"}}
        {{afFieldInput "message" rows="10"}}
        {{#if afFieldIsInvalid "message"}}
        <span class="help-block">{{afFieldMessage "message"}}</span>
        {{/if}}
    </div>
    <div>
        <button type="button" data-meteor-method="sendEmail" class="btn btn-primary">Submit</button>
        <button type="reset" class="btn btn-default">Reset</button>
    </div>
</fieldset>
{{/autoForm}}
```

The Meteor method:

```js
Meteor.methods({
    sendEmail: function(doc) {
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

To reiterate, you do not need to call `check()` in the method. The equivalent of this is done for you on
both the client and the server. You might need to do authorization checks, but not validation checks.

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

## More Examples

A somewhat messy, work-in-progress example app is [here](https://github.com/aldeed/meteor-autoform-example).

## Contributing

Anyone is welcome to contribute. Fork, make your changes, and then submit a pull request.
