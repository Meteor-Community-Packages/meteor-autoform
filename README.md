AutoForm
=========================

This is a maintained fork of Meteor AutoForm. You can find the original readme file [here](README.original.md).

What has been changed?
=========================

A lot. Here's a summary:

Performance
-------------------------

* **Mongo collections for arrayTracker**:
    Improves the performance greatly. Blaze cannot diff the original
    AutoForm arrayTracker items, so I replaced it with Mongo collections.

* **Wait for context**:
    Instead of reactively re-rendering the entire form, we wait for the
    context before we render it for the first time.

* **Cache field Ids**:
    This prevents regenerating the field Id and rerendering the field
    just because the Id is changed.

* **`clean` option for `getFieldValue` and `getFieldValues`**:
    By default AutoForm cleans all the values fetched from the form,
    however that's only necessary when we're putting the data into
    the database and/or validating, for rendering the value of a field
    in a view that isn't necessary. I added a `option` argument to these
    two functions, this defaults to true which is the normal AutoForm
    behavior. When set to false it won't clean the form data (clean
    function is really heavy and doesn't make much sense on our views).

* **`getFieldValue` is cached**:
    This function is reactive and recomputes its return value when
    there is a change in the value. Sometimes it's necessary to call
    this function several times and we do not want to recompute when
    the value hasn't been changed. This function now caches its results,
    then invalidates the cache when there's a change in the value.

* **`markChanged` function is throttled now**:
    This function gets called a million times when our form has too
    many reactive dependencies or too many fields. This isn't necessary,
    we don't need to mark a field value changed when it hasn't been changed.

Bugs Fixes
-------------------------

* **`disabled` in select options**: didn't work.

Features
-------------------------

* **`omit` can be a function now**
