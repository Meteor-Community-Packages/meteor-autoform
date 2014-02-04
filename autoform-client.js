var defaultFramework = "bootstrap3";

AutoForm = function(schema) {
  var self = this;
  if (schema instanceof SimpleSchema) {
    self._simpleSchema = schema;
  } else if ("Collection2" in Meteor && schema instanceof Meteor.Collection2) {
    self._collection = schema;
  } else {
    self._simpleSchema = new SimpleSchema(schema);
  }

  self._hooks = {
    before: {
      //insert, update, remove, "methodName"
    },
    after: {
      //insert, update, remove, "methodName"
    },
    formToDoc: null,
    docToForm: null,
    onSubmit: null,
    onSuccess: null,
    onError: null
  };

  // DEPRECATED TODO: remove everything after this point
  self._callbacks = {};
  if (self._collection) {
    self._callbacks = self._collection._callbacks || {};
    self.beforeInsert = self._collection.beforeInsert;
    self.beforeUpdate = self._collection.beforeUpdate;
    self.beforeRemove = self._collection.beforeRemove;
    self.beforeMethod = self._collection.beforeMethod;
    self.formToDoc = self._collection.formToDoc;
    self.docToForm = self._collection.docToForm;
  }
};

//DEPRECATED; Use myAutoForm.simpleSchema().namedContext() instead
AutoForm.prototype.namedContext = function(name) {
  console.warn("myAutoForm.namedContext() is deprecated; use myAutoForm.simpleSchema().namedContext() instead");
  if (this._collection) {
    return this._collection.simpleSchema().namedContext(name);
  }
  return this._simpleSchema.namedContext(name);
};

//DEPRECATED; Use myAutoForm.simpleSchema().namedContext().validate() instead
AutoForm.prototype.validate = function(doc, options) {
  options = options || {};
  console.warn("myAutoForm.validate() is deprecated; use myAutoForm.simpleSchema().namedContext().validate() instead");
  if (this._collection) {
    // Validate doc and return validity
    return this._collection.simpleSchema().namedContext(options.validationContext).validate(doc, options);
  }
  // Validate doc and return validity
  return this._simpleSchema.namedContext(options.validationContext).validate(doc, options);
};

//DEPRECATED; Use myAutoForm.simpleSchema().namedContext().validateOne() instead
AutoForm.prototype.validateOne = function(doc, keyName, options) {
  options = options || {};
  console.warn("myAutoForm.validateOne() is deprecated; use myAutoForm.simpleSchema().namedContext().validateOne() instead");
  if (this._collection) {
    // Validate doc and return validity
    return this._collection.simpleSchema().namedContext(options.validationContext).validateOne(doc, keyName, options);
  }
  // Validate doc and return validity
  return this._simpleSchema.namedContext(options.validationContext).validateOne(doc, keyName, options);
};

AutoForm.prototype.simpleSchema = function() {
  var self = this;
  return (typeof self._collection === "undefined") ? self._simpleSchema : self._collection.simpleSchema();
};

// The hooks() method should be used in place of callbacks, before___, and
// formToDoc/docToForm going forward.
AutoForm.prototype.hooks = function(hooks) {
  _.extend(this._hooks, hooks);
};

AutoForm.prototype.callbacks = function(cb) {
  console.warn("myAutoForm.callbacks is deprecated; use myAutoForm.hooks");
  this._callbacks = cb;
};

if (typeof Meteor.Collection2 !== 'undefined') {
  Meteor.Collection2.prototype.callbacks = function(cb) {
    console.warn("myCollection2.callbacks is deprecated; use myCollection2.hooks");
    this._callbacks = cb;
  };
}

AutoForm.resetForm = function(formID, simpleSchema) {
  if (typeof formID !== "string") {
    return;
  }

  _.each(nestedFields[formID], function(row, key){
    nestedFields[formID][key]._values = -1;
    nestedFields[formID][key]._deps.changed();
  });

  simpleSchema && simpleSchema.namedContext(formID).resetValidation();
  clearSelections(formID);
};

// DEPRECATED
AutoForm.prototype.resetForm = function(formID) {
  var self = this;

  console.warn("myAutoForm.resetForm(formID) is deprecated; use AutoForm.resetForm(formID, simpleSchema)");

  if (typeof formID !== "string") {
    return;
  }

  self.simpleSchema().namedContext(formID).resetValidation();
  clearSelections(formID);
};

// DEPRECATED
if (typeof Meteor.Collection2 !== 'undefined') {
  Meteor.Collection2.prototype.resetForm = function(formID) {
    var self = this;

    console.warn("myCollection2.resetForm(formID) is deprecated; use AutoForm.resetForm(formID, simpleSchema)");

    if (typeof formID !== "string") {
      return;
    }

    self.simpleSchema().namedContext(formID).resetValidation();
    clearSelections(formID);
  };
}

if (typeof Handlebars !== 'undefined') {
  Handlebars.registerHelper("autoForm", function(options) {
    if (!options) {
      return "";
    }
    var hash = options.hash || {};

    //copy hash from quickForm if this is an autoForm created by the quickForm helper
    if (hash.qfHash) {
      hash = hash.qfHash;
    }

    var schemaObj;
    if (typeof hash.schema === "string") {
      if (!window || !window[hash.schema]) {
        return options.fn(this);
      }
      schemaObj = window[hash.schema];
    } else {
      schemaObj = hash.schema;
    }
    delete hash.schema;

    // Allow passing a Collection2 as the schema, but wrap in AutoForm
    if ("Collection2" in Meteor && schemaObj instanceof Meteor.Collection2) {
      schemaObj = new AutoForm(schemaObj);
    }

    var flatDoc;
    if (hash.doc) {
      var mDoc = new MongoObject(hash.doc);
      flatDoc = mDoc.getFlatObject();
      mDoc = null;
      var docToForm = schemaObj._hooks.docToForm || schemaObj.docToForm;

      if (typeof docToForm === "function") {
        flatDoc = docToForm(flatDoc);
      }
    } else {
      flatDoc = {};
    }

    var autoFormContext = {
      schema: schemaObj,
      _doc: hash.doc,
      _flatDoc: flatDoc
    };

    if ("doc" in hash) {
      delete hash.doc;
    }

    autoFormContext._framework = hash.framework || defaultFramework;
    if ("framework" in hash) {
      delete hash.framework;
    }

    autoFormContext.validationType = hash.validation || "submitThenKeyup";
    if ("validation" in hash) {
      delete hash.validation;
    }

    if ("onSubmit" in hash) {
      if (typeof hash.onSubmit === "function") {
        autoFormContext.onSubmit = hash.onSubmit;
        console.warn("The onSubmit helper attribute is deprecated; use myAutoForm.hooks");
      }
      delete hash.onSubmit;
    }

    var atts = hash.atts || hash;
    //formID is used to track input selections so that they are retained
    //when the form is rerendered. If the id attribute is not provided,
    //we use a generic ID, which will usually still result in retension
    //of values, but might not work properly if any forms have input
    //elements (schema keys) with the same name
    autoFormContext.formID = atts.id || "_afGenericID";

    autoFormContext.content = options.fn({_ss: autoFormContext.schema.simpleSchema(), _doc: autoFormContext._doc, _flatDoc: autoFormContext._flatDoc, _formID: autoFormContext.formID, _framework: autoFormContext._framework, _templateData: this});

    autoFormContext.atts = objToAttributes(atts);
    return new Handlebars.SafeString(Template._autoForm(autoFormContext));
  });

  Handlebars.registerHelper("quickForm", function(options) {
    if (!options) {
      return "";
    }
    var hash = options.hash || {};
    if (typeof hash.schema === "string") {
      if (!window || !window[hash.schema]) {
        return options.fn(this);
      }
      hash.schema = window[hash.schema];
    }

    var context = {
      formFields: []
    };

    _.each(hash.schema.simpleSchema().schema(), function(fieldDefs, field) {
      var info = {name: field};

      if ((fieldDefs.denyInsert && hash.type === "insert") ||
          (fieldDefs.denyUpdate && hash.type === "update")) {
        return;
      }
      if (_.isArray(fieldDefs.allowedValues)) {
        info.options = "allowed";
      }
      context.formFields.push(info);
    });

    if ("type" in hash) {
      if (hash.type === "insert") {
        context.doInsert = true;
      } else if (hash.type === "update") {
        context.doUpdate = true;
      } else if (hash.type === "remove") {
        context.doRemove = true;
      } else if (hash.type === "method") {
        context.doMethod = true;
        context.method = hash.method;
      } else if (hash.type === "readonly") {
        context.isReadOnly = true;
      } else if (hash.type === "disabled") {
        context.isDisabled = true;
      }
      delete hash.type;
    }

    if ("method" in hash) {
      delete hash.method;
    }

    if ("buttonClasses" in hash) {
      context.buttonClasses = hash.buttonClasses;
      delete hash.buttonClasses;
    }

    context.buttonContent = hash.buttonContent || "Submit";
    if ("buttonContent" in hash) {
      delete hash.buttonContent;
    }

    context.qfHash = hash;

    return new Handlebars.SafeString(Template._quickForm(context));
  });

  Handlebars.registerHelper("afQuickField", function(name, options) {
    var hash = options.hash,
            autoform = hash.autoform || this,
            ss = autoform._ss;

    if (!ss)
      throw new Error("afQuickField helper must be used within an autoForm block");

    var defs = getDefs(ss, name); //defs will not be undefined

    //boolean type renders a check box that already has a label, so don't generate another label
    var skipLabel = hash.label === false || (defs.type === Boolean && !("select" in hash) && !("radio" in hash));

    //separate label hash from input hash; label items begin with "label-"
    var labelHash = {};
    var inputHash = {};
    _.each(hash, function(val, key) {
      if (key.indexOf("label-") === 0) {
        key = key.substring(6);
        labelHash[key] = val;
      } else {
        inputHash[key] = val;
      }
    });

    var framework = inputHash["framework"] || autoform._framework || defaultFramework;

    //set up context for _afQuickField template
    var context = {
      name: name,
      autoform: autoform,
      useFrameworkBootstrap3: (framework === "bootstrap3")
    };

    //add label HTML to _afQuickField template context
    if (skipLabel) {
      context.labelHtml = "";
    } else {
      context.labelHtml = createLabelHtml(name, autoform, defs, labelHash);
    }

    //add input HTML to _afQuickField template context
    context.inputHtml = createInputHtml(name, autoform, defs, inputHash);

    return new Handlebars.SafeString(Template._afQuickField(context));
  });

  Handlebars.registerHelper("afFieldMessage", function(name, options) {
    var autoform = options.hash.autoform || this, ss = autoform._ss;
    if (!ss)
      throw new Error("afFieldMessage helper must be used within an autoForm block");
    getDefs(ss, name); //for side effect of throwing errors when name is not in schema
    return ss.namedContext(autoform._formID).keyErrorMessage(name);
  });

  Handlebars.registerHelper("afFieldIsInvalid", function(name, options) {
    var autoform = options.hash.autoform || this, ss = autoform._ss;
    if (!ss)
      throw new Error("afFieldIsInvalid helper must be used within an autoForm block");

    if(name.indexOf('.$.') !== -1 && _.isNumber(this._index)){
      name = name.replace('$', this._index);
    }

    getDefs(ss, name); //for side effect of throwing errors when name is not in schema
    return ss.namedContext(autoform._formID).keyIsInvalid(name);
  });

  Handlebars.registerHelper("afFieldInput", function(name, options) {
    var autoform = options.hash.autoform || this, ss = autoform._ss;

    if (!ss)
      throw new Error("afFieldInput helper must be used within an autoForm block");

    //@todo: do this recursively.
    if(name.indexOf('.$.') !== -1)
      name = name.replace('$', this._index);

    if(this._values && this._values[name])
      options.hash.value = this._values[name];

    var defs = getDefs(ss, name); //defs will not be undefined
    var html = createInputHtml(name, autoform, defs, options.hash);
    return new Handlebars.SafeString(html);
  });

  Handlebars.registerHelper("afFieldLabel", function(name, options) {
    var autoform = options.hash.autoform || this, ss = autoform._ss;

    if (!ss)
      throw new Error("afFieldInput helper must be used within an autoForm block");

    var defs = getDefs(ss, name); //defs will not be undefined
    var html = createLabelHtml(name, autoform, defs, options.hash);
    return new Handlebars.SafeString(html);
  });


  Handlebars.registerHelper("eachNestedField", function(name, options) {
    var autoform = options.hash.autoform || this, ss = autoform._ss;
    var fn =  options.fn, inverse = options.inverse;
    var defs, ret = "", rows = [], field = {}, data = {};

    if (!ss)
      throw new Error("eachNestedField helper must be used within an autoForm block");

    if(!nestedFields[autoform._formID])
      nestedFields[autoform._formID] = {};

    if(!nestedFields[autoform._formID][name])
      nestedFields[autoform._formID][name] = {};

    if(!nestedFields[autoform._formID][name]._deps){
      nestedFields[autoform._formID][name]._deps = new Deps.Dependency();
    }

    Deps.depend(nestedFields[autoform._formID][name]._deps);

    if(!nestedFields[autoform._formID][name]._values)
       nestedFields[autoform._formID][name]._values = [];

    if(nestedFields[autoform._formID][name]._values.length === 0)
      nestedFields[autoform._formID][name]._values = (autoform._doc && autoform._doc[name]) ? autoform._doc[name] : [];

    if(autoform._doc && nestedFields[autoform._formID][name]){
      autoform._doc[name] = _.isArray(nestedFields[autoform._formID][name]._values) ? nestedFields[autoform._formID][name]._values : [];

      mDoc = new MongoObject(autoform._doc);
      autoform._flatDoc = mDoc.getFlatObject();
    }

    if(_.isArray(nestedFields[autoform._formID][name]._values)){
      _.each(nestedFields[autoform._formID][name]._values, function(value, i){

        rows[i] = _.extend(_.omit(autoform, '_templateData'), {
          _index: i,
          _target: name,
          _values: {},
        });

        for (var idx in nestedFields[autoform._formID][name]._values[i]){
          var key = name + "." + i + "." + idx;
          rows[i]._values[key] = nestedFields[autoform._formID][name]._values[i][idx];
        }

        ret = ret + fn(rows[i]);
      });
    }

    return ret;
  });

  Template._autoForm.events({
    'click button.nf-remove': function(event, template) {
      event.preventDefault();
      removeNestedField(this, template, event);
    },
    'click button.nf-add': function(event, template) {
      event.preventDefault();
      addNestedField(this, template, event);
    },
    'submit form': function(event, template) {
      var submitButton = template.find("button[type=submit]");
      if (!submitButton) {
        return;
      }

      submitButton.disabled = true;

      //determine what we want to do
      var isInsert = hasClass(submitButton, "insert");
      var isUpdate = hasClass(submitButton, "update");
      var isRemove = hasClass(submitButton, "remove");
      var method = submitButton.getAttribute("data-meteor-method");

      //init
      var self = this;
      var validationType = template.data.validationType;
      var afObj = template.data.schema;
      var hooks = afObj._hooks;
      var formId = template.data.formID;
      var currentDoc = self._doc || null;
      var docId = currentDoc ? currentDoc._id : null;
      var doc = formValues(template, hooks.formToDoc || afObj.formToDoc);
      var onSubmit = hooks.onSubmit || template.data.onSubmit;
      var ss = afObj.simpleSchema();

      //for inserts, delete any properties that are null, undefined, or empty strings,
      //and expand to use subdocuments instead of dot notation keys
      var insertDoc = expandObj(cleanNulls(doc));
      //for updates, convert to modifier object with $set and $unset
      var updateDoc = expandObj(doc);

      if(nestedFields[self._formID]){
        _.each(nestedFields[self._formID], function(v, k){
          if(!_.isArray(v._values) || v._values.length === 0)
            updateDoc[k] = [];
        });
      }
      updateDoc = docToModifier(updateDoc);

      if (isInsert || isUpdate || isRemove || method) {
        event.preventDefault(); //prevent default here if we're planning to do our own thing
      }

      //pass both types of doc to onSubmit
      if (typeof onSubmit === "function") {
        if (validationType === 'none' || ss.namedContext(formId).validate(insertDoc, {modifier: false})) {
          var context = {
            resetForm: function() {
              template.find("form").reset();
            }
          };
          var shouldContinue = onSubmit.call(context, insertDoc, updateDoc, currentDoc);
          if (shouldContinue === false) {
            event.preventDefault();
            submitButton.disabled = false;
            return;
          }
        }
      }

      //allow normal form submission
      if (!isInsert && !isUpdate && !isRemove && !method) {
        if (validationType !== 'none' && !ss.namedContext(formId).validate(insertDoc, {modifier: false})) {
          event.preventDefault(); //don't submit the form if invalid
        }
        submitButton.disabled = false;
        return;
      }

      // Gather hooks, falling back to the deprecated API
      // TODO eventually remove support for old API
      var beforeInsert = hooks.before.insert || afObj.beforeInsert;
      var beforeUpdate = hooks.before.update || afObj.beforeUpdate;
      var beforeRemove = hooks.before.remove || afObj.beforeRemove;
      var beforeMethod = method && (hooks.before[method] || afObj.beforeMethod);
      var afterInsert = hooks.after.insert || afObj._callbacks.insert;
      var afterUpdate = hooks.after.update || afObj._callbacks.update;
      var afterRemove = hooks.after.remove || afObj._callbacks.remove;
      var afterMethod = method && (hooks.after[method] || afObj._callbacks[method]);
      var onSuccess = hooks.onSuccess;
      var onError = hooks.onError;

      //do it
      if (isInsert) {
        if (beforeInsert) {
          insertDoc = beforeInsert(insertDoc);
          if (!_.isObject(insertDoc)) {
            throw new Error("beforeInsert must return an object");
          }
        }
        afObj._collection && afObj._collection.insert(insertDoc, {validationContext: formId}, function(error, result) {
          if (error) {
            onError && onError('insert', error, template);
          } else {
            template.find("form").reset();
            onSuccess && onSuccess('insert', result, template);
          }
          afterInsert && afterInsert(error, result, template);
          submitButton.disabled = false;
        });
      } else if (isUpdate) {
        if (!_.isEmpty(updateDoc)) {
          if (beforeUpdate) {
            updateDoc = beforeUpdate(docId, updateDoc);
            if (!_.isObject(updateDoc)) {
              throw new Error("beforeUpdate must return an object");
            }
          }
          afObj._collection && afObj._collection.update(docId, updateDoc, {validationContext: formId}, function(error, result) {
            //don't automatically reset the form for updates because we
            //often won't want that
            if (error) {
              onError && onError('update', error, template);
            } else {
              onSuccess && onSuccess('update', result, template);
            }
            afterUpdate && afterUpdate(error, result, template);
            submitButton.disabled = false;
          });
        }
      } else if (isRemove) {
        //call beforeRemove if present, and stop if it's false
        if (beforeRemove && beforeRemove(docId) === false) {
          //stopped
          submitButton.disabled = false;
        } else {
          afObj._collection && afObj._collection.remove(docId, function(error, result) {
            if (error) {
              onError && onError('remove', error, template);
            } else {
              onSuccess && onSuccess('remove', result, template);
            }
            afterRemove && afterRemove(error, result, template);
            submitButton.disabled = false;
          });
        }
      }

      //we won't do an else here so that a method could be called in
      //addition to another action on the same submit
      if (method) {
        // TODO: passing the method name as second argument was necessary for
        // the old API only. Eventually can stop doing that.
        if (beforeMethod) {
          insertDoc = beforeMethod(insertDoc, method);
          if (!_.isObject(insertDoc)) {
            throw new Error("beforeMethod must return an object");
          }
        }

        if (validationType === 'none' || ss.namedContext(formId).validate(insertDoc, {modifier: false})) {
          Meteor.call(method, insertDoc, function(error, result) {
            if (error) {
              onError && onError(method, error, template);
            } else {
              template.find("form").reset();
              onSuccess && onSuccess(method, result, template);
            }
            afterMethod && afterMethod(error, result, template);
            submitButton.disabled = false;
          });
        } else {
          submitButton.disabled = false;
        }
      }
    },
    'keyup [data-schema-key]': function(event, template) {
      var validationType = template.data.validationType;
      var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup');
      var skipEmpty = !(event.keyCode === 8 || event.keyCode === 46); //if deleting or backspacing, don't skip empty
      if ((validationType === 'keyup' || validationType === 'submitThenKeyup')) {
        validateField(event.currentTarget.getAttribute("data-schema-key"), template, skipEmpty, onlyIfAlreadyInvalid);
      }
    },
    'blur [data-schema-key]': function(event, template) {
      var validationType = template.data.validationType;
      var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
      if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
        validateField(event.currentTarget.getAttribute("data-schema-key"), template, false, onlyIfAlreadyInvalid);
      }
    },
    'change [data-schema-key]': function(event, template) {
      if (event.currentTarget.nodeName.toLowerCase() === "select") {
        //workaround for selection being lost on rerender
        //store the selections in memory and reset in rendered
        setSelections(event.currentTarget, template.data.formID);
      }
      var validationType = template.data.validationType;
      var onlyIfAlreadyInvalid = (validationType === 'submitThenKeyup' || validationType === 'submitThenBlur');
      if (validationType === 'keyup' || validationType === 'blur' || validationType === 'submitThenKeyup' || validationType === 'submitThenBlur') {
        validateField(event.currentTarget.getAttribute("data-schema-key"), template, false, onlyIfAlreadyInvalid);
      }
    },
    'reset form': function(event, template) {
      var afc2Obj = template.data.schema;
      var formId = template.data.formID;
      if (afc2Obj && formId) {
        AutoForm.resetForm(formId, afc2Obj.simpleSchema());
      }
    }
  });

  //This is a workaround for what seems to be a Meteor issue.
  //When Meteor updates an existing form, it selectively updates the attributes,
  //but attributes that are properties don't have the properties updated to match.
  //This means that selected is not updated properly even if the selected
  //attribute is on the element.
  Template._autoForm.rendered = function() {
    setSelected(this);
  };

  Template._autoForm.destroyed = function() {
    nestedFields[this.data.formID] = {};
    autoformSelections = {};
    this._notInDOM = true;
  };
}

var maybeNum = function(val) {
  // Convert val to a number if possible; otherwise, just use the value
  var floatVal = parseFloat(val);
  if (!isNaN(floatVal)) {
    return floatVal;
  } else {
    return val;
  }
};

var formValues = function(template, transform) {
  var fields = template.findAll("[data-schema-key]");
  var doc = {};
  _.each(fields, function(field) {
    var name = field.getAttribute("data-schema-key");
    var val = field.value;
    var type = field.getAttribute("type") || "";
    type = type.toLowerCase();
    var tagName = field.tagName || "";
    tagName = tagName.toLowerCase();

    // Handle select
    if (tagName === "select") {
      if (val === "true") { //boolean select
        doc[name] = true;
      } else if (val === "false") { //boolean select
        doc[name] = false;
      } else if (field.hasAttribute("multiple")) {
        //multiple select, so we want an array value
        doc[name] = getSelectValues(field);
      } else {
        doc[name] = val;
      }
      return;
    }

    // Handle checkbox
    if (type === "checkbox") {
      if (val === "true") { //boolean checkbox
        doc[name] = field.checked;
      } else if (field.checked) { //array checkbox
        if (!_.isArray(doc[name])) {
          doc[name] = [];
        }
        doc[name].push(val);
      }
      return;
    }

    // Handle radio
    if (type === "radio") {
      if (field.checked) {
        if (val === "true") { //boolean radio
          doc[name] = true;
        } else if (val === "false") { //boolean radio
          doc[name] = false;
        } else {
          doc[name] = val;
        }
      }
      return;
    }

    // Handle number
    if (type === "select") {
      doc[name] = maybeNum(val);
      return;
    }

    // Handle date inputs
    if (type === "date") {
      if (isValidDateString(val)) {
        //Date constructor will interpret val as UTC and create
        //date at mignight in the morning of val date in UTC time zone
        doc[name] = new Date(val);
      } else {
        doc[name] = null;
      }
      return;
    }

    // Handle date inputs
    if (type === "datetime") {
      val = val.replace(/ /g, "T");
      if (isValidNormalizedForcedUtcGlobalDateAndTimeString(val)) {
        //Date constructor will interpret val as UTC due to ending "Z"
        doc[name] = new Date(val);
      } else {
        doc[name] = null;
      }
      return;
    }

    // Handle date inputs
    if (type === "datetime-local") {
      val = val.replace(/ /g, "T");
      var offset = field.getAttribute("data-offset") || "Z";
      if (isValidNormalizedLocalDateAndTimeString(val)) {
        doc[name] = new Date(val + offset);
      } else {
        doc[name] = null;
      }
      return;
    }

    // Handle all other inputs
    doc[name] = val;
  });
  if (typeof transform === "function") {
    doc = transform(doc);
  }
  return doc;
};
var objToAttributes = function(obj) {
  if (!obj) {
    return "";
  }
  var a = "";
  _.each(obj, function(value, key) {
    a += ' ' + key + '="' + value + '"';
  });
  return a;
};
var expandObj = function(doc) {
  var newDoc = {}, subkeys, subkey, subkeylen, nextPiece, current;
  _.each(doc, function(val, key) {
    subkeys = key.split(".");
    subkeylen = subkeys.length;
    current = newDoc;
    for (var i = 0; i < subkeylen; i++) {
      subkey = subkeys[i];
      if (typeof current[subkey] !== "undefined" && !_.isObject(current[subkey])) {
        break; //already set for some reason; leave it alone
      }
      if (i === subkeylen - 1) {
        //last iteration; time to set the value
        current[subkey] = val;
      } else {
        //see if the next piece is a number
        nextPiece = subkeys[i + 1];
        nextPiece = parseInt(nextPiece, 10);
        if (isNaN(nextPiece) && !_.isObject(current[subkey])) {
          current[subkey] = {};
        } else if (!isNaN(nextPiece) && !_.isArray(current[subkey])) {
          current[subkey] = [];
        }
      }
      current = current[subkey];
    }
  });
  return newDoc;
};
var cleanNulls = function(doc) {
  var newDoc = {};
  _.each(doc, function(val, key) {
    if (val !== void 0 && val !== null && !(typeof val === "string" && val.length === 0)) {
      newDoc[key] = val;
    }
  });
  return newDoc;
};
var reportNulls = function(doc) {
  var nulls = {};
  _.each(doc, function(val, key) {
    if (val === void 0 || val === null || (typeof val === "string" && val.length === 0)) {
      nulls[key] = "";
    }
  });
  return nulls;
};

//returns true if dateString is a "valid date string"
var isValidDateString = function(dateString) {
  var m = moment(dateString, 'YYYY-MM-DD', true);
  return m && m.isValid();
};

//returns true if timeString is a "valid time string"
var isValidTimeString = function(timeString) {
  if (typeof timeString !== "string")
    return false;

  //this reg ex actually allows a few invalid hours/minutes/seconds, but
  //we can catch that when parsing
  var regEx = /^[0-2][0-9]:[0-5][0-9](:[0-5][0-9](\.[0-9]{1,3})?)?$/;
  return regEx.test(timeString);
};

//returns a "valid date string" representing the local date
var dateToDateString = function(date) {
  var m = (date.getMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getFullYear() + '-' + m + '-' + d;
};

//returns a "valid date string" representing the date converted to the UTC time zone
var dateToDateStringUTC = function(date) {
  var m = (date.getUTCMonth() + 1);
  if (m < 10) {
    m = "0" + m;
  }
  var d = date.getUTCDate();
  if (d < 10) {
    d = "0" + d;
  }
  return date.getUTCFullYear() + '-' + m + '-' + d;
};

//returns a "valid normalized forced-UTC global date and time string" representing the time converted to the UTC time zone and expressed as the shortest possible string for the given time (e.g. omitting the seconds component entirely if the given time is zero seconds past the minute)
//http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#date-and-time-state-(type=datetime)
//http://www.whatwg.org/specs/web-apps/current-work/multipage/common-microsyntaxes.html#valid-normalized-forced-utc-global-date-and-time-string
var dateToNormalizedForcedUtcGlobalDateAndTimeString = function(date) {
  return moment(date).utc().format("YYYY-MM-DD[T]HH:mm:ss.SSS[Z]");
};

//returns true if dateString is a "valid normalized forced-UTC global date and time string"
var isValidNormalizedForcedUtcGlobalDateAndTimeString = function(dateString) {
  if (typeof dateString !== "string")
    return false;

  var datePart = dateString.substring(0, 10);
  var tPart = dateString.substring(10, 11);
  var timePart = dateString.substring(11, dateString.length - 1);
  var zPart = dateString.substring(dateString.length - 1);
  return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart) && zPart === "Z";
};

//returns a "valid normalized local date and time string"
var dateToNormalizedLocalDateAndTimeString = function(date, offset) {
  var m = moment(date);
  m.zone(offset);
  return m.format("YYYY-MM-DD[T]hh:mm:ss.SSS");
};

var isValidNormalizedLocalDateAndTimeString = function(dtString) {
  if (typeof dtString !== "string")
    return false;

  var datePart = dtString.substring(0, 10);
  var tPart = dtString.substring(10, 11);
  var timePart = dtString.substring(11, dtString.length);
  return isValidDateString(datePart) && tPart === "T" && isValidTimeString(timePart);
};

var getSelectValues = function(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i = 0, iLen = options.length; i < iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
};

var createInputHtml = function(name, autoform, defs, hash) {
  var html;

  //adjust expected type when type is overridden
  var schemaType = defs.type;
  var expectsArray = false;
  if (schemaType === Array) {
    defs = autoform._ss.schema(name + ".$");
    schemaType = defs.type;

    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    expectsArray = !hash.type;
  }

  var flatDoc = autoform._flatDoc;

  //get current value
  var value, arrayVal;
  if (expectsArray) {

    // For arrays, we need the flatDoc value as an array
    // rather than as separate array values, so we'll do
    // that adjustment here.
    // For example, if we have "numbers.0" = 1 and "numbers.1" = 2,
    // we will create "numbers" = [1,2]
    _.each(flatDoc, function(flatVal, flatKey) {
      var l = name.length;
      if (flatKey.slice(0, l + 1) === name + ".") {
        var end = flatKey.slice(l + 1);
        var intEnd = parseInt(end, 10);
        if (!isNaN(intEnd)) {
          flatDoc[name] = flatDoc[name] || [];
          flatDoc[name][intEnd] = flatVal;
        }
      }
    });

    if (schemaType === Date) {
      if (flatDoc && name in flatDoc) {
        arrayVal = flatDoc[name] || [];
        value = [];
        _.each(arrayVal, function(v) {
          value.push(dateToDateStringUTC(v));
        });
      } else {
        value = hash.value || [];
      }
    } else {
      if (flatDoc && name in flatDoc) {
        arrayVal = flatDoc[name] || [];
        value = [];
        _.each(arrayVal, function(v) {
          value.push(v.toString());
        });
      } else {
        value = hash.value || [];
      }
    }
  } else {
    if (flatDoc && name in flatDoc) {
      value = flatDoc[name] || "";
      if (!(value instanceof Date)) { //we will convert dates to a string later, after we know what the field type will be
        value = value.toString();
      }
    } else {
      value = hash.value || "";
    }
  }

  var valHasLineBreaks = typeof value === "string" ? (value.indexOf("\n") !== -1) : false;

  //required?
  var req = defs.optional ? "" : " required";

  //get type
  var type = "text";
  if (hash.type) {
    type = hash.type;
  } else if (schemaType === String && (hash.rows || valHasLineBreaks)) {
    type = "textarea";
  } else if (schemaType === String && defs.regEx === SchemaRegEx.Email) {
    type = "email";
  } else if (schemaType === String && defs.regEx === SchemaRegEx.Url) {
    type = "url";
  } else if (schemaType === Number) {
    type = "number";
  } else if (schemaType === Date) {
    type = "date";
  } else if (schemaType === Boolean) {
    type = "boolean";
  }

  if (type === "datetime-local" && hash.offset) {
    hash["data-offset"] = hash.offset || "Z";
    delete hash.offset;
  }

  //convert Date value to required string value based on field type
  if (value instanceof Date) {
    if (type === "date") {
      value = dateToDateStringUTC(value);
    } else if (type === "datetime") {
      value = dateToNormalizedForcedUtcGlobalDateAndTimeString(value);
    } else if (type === "datetime-local") {
      value = dateToNormalizedLocalDateAndTimeString(value, hash["data-offset"]);
    }
  }

  //adjust some variables for booleans
  var checked = "", checkedOpposite = "";
  if (type === "boolean") {
    value = (value === "true") ? true : false;
    if (value) {
      checked = " checked";
    } else {
      checkedOpposite = " checked";
    }
  }

  var label = autoform._ss.label(name);

  //get correct max/min attributes
  var max = "", min = "";

  //If min/max are functions, call them
  var resolvedMin = defs.min;
  var resolvedMax = defs.max;
  if (typeof resolvedMin === "function") {
    resolvedMin = resolvedMin();
  }
  if (typeof resolvedMax === "function") {
    resolvedMax = resolvedMax();
  }

  // Max text entry length
  if (resolvedMax && _.contains(["text", "textarea", "email", "url"], type)) {
    max = ' maxlength="' + resolvedMax + '"';
  }

  // Number or Date minimums
  if (hash.max && _.contains(["number", "date", "datetime", "datetime-local"], type)) {
    max = ' max="' + hash.max + '"';
  } else if (resolvedMax instanceof Date) {
    if (type === "date") {
      max = ' max="' + dateToDateStringUTC(resolvedMax) + '"';
    } else if (type === "datetime") {
      max = ' max="' + dateToNormalizedForcedUtcGlobalDateAndTimeString(resolvedMax) + '"';
    } else if (type === "datetime-local") {
      max = ' max="' + dateToNormalizedLocalDateAndTimeString(resolvedMax, hash["data-offset"]) + '"';
    }
  } else if (typeof resolvedMax === "number" && type === "number") {
    max = ' max="' + resolvedMax + '"';
  }

  // Number or Date maximums
  if (hash.min && _.contains(["number", "date", "datetime", "datetime-local"], type)) {
    min = ' min="' + hash.min + '"';
  } else if (resolvedMin instanceof Date) {
    if (type === "date") {
      min = ' min="' + dateToDateStringUTC(resolvedMin) + '"';
    } else if (type === "datetime") {
      min = ' min="' + dateToNormalizedForcedUtcGlobalDateAndTimeString(resolvedMin) + '"';
    } else if (type === "datetime-local") {
      min = ' min="' + dateToNormalizedLocalDateAndTimeString(resolvedMin, hash["data-offset"]) + '"';
    }
  } else if (typeof resolvedMin === "number" && type === "number") {
    min = ' min="' + resolvedMin + '"';
  }

  // Step value
  var step = "";
  if (type === "number") {
    if (hash.step) {
      step = ' step="' + hash.step + '"';
    } else if (defs.decimal) {
      step = ' step="0.01"';
    }
  }

  //extract settings from hash
  var firstOption = hash.firstOption;
  var radio = hash.radio;
  var select = hash.select;
  var noselect = hash.noselect;
  var trueLabel = hash.trueLabel;
  var falseLabel = hash.falseLabel;
  var selectOptions = hash.options;
  var framework = hash.framework || autoform._framework || defaultFramework;

  //handle options="allowed"
  if (selectOptions === "allowed") {
    selectOptions = _.map(defs.allowedValues, function(v) {
      var label = v;
      if (hash.capitalize && v.length > 0 && schemaType === String) {
        label = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      }

      return {label: label, value: v};
    });
  }

  //clean hash so that we can add anything remaining as attributes
  hash = cleanHash(hash);

  //set placeholder to label from schema if requested
  if (hash.placeholder === "schemaLabel")
    hash.placeholder = label;

  if (selectOptions) {
    //build anything that should be a select, which is anything with options
    var multiple = "", isMultiple;
    if (expectsArray) {
      multiple = " multiple";
      isMultiple = true;
    }
    if (noselect) {
      html = "";
      _.each(selectOptions, function(opt) {
        var checked, inputType, cl = "";
        if (isMultiple) {
          inputType = "checkbox";
          if (_.contains(value, opt.value.toString())) {
            checked = ' checked';
          } else {
            checked = '';
          }
        } else {
          inputType = "radio";
          if (opt.value.toString() === value.toString()) {
            checked = ' checked';
          } else {
            checked = '';
          }
        }
        if (framework === "bootstrap3")
          cl = inputType;
        html += '<div class="' + cl + '"><label><input type="' + inputType + '" data-schema-key="' + name + '" name="' + name + '" value="' + opt.value + '"' + checked + objToAttributes(hash) + ' /> ' + opt.label + '</label></div>';
      });
    } else {
      if (framework === "bootstrap3") {
        //add bootstrap's form-control class to input elements
        hash["class"] = hash["class"] ? hash["class"] + " form-control" : "form-control"; //IE<10 throws error if hash.class syntax is used
      }
      hash.autocomplete = "off"; //can fix issues with some browsers selecting the firstOption instead of the selected option
      html = '<select data-schema-key="' + name + '" name="' + name + '"' + objToAttributes(hash) + req + multiple + '>';
      if (firstOption && !isMultiple) {
        html += '<option value="">' + firstOption + '</option>';
      }
      _.each(selectOptions, function(opt) {
        var selected;
        if (isMultiple) {
          if (_.contains(value, opt.value.toString())) {
            selected = ' selected';
          } else {
            selected = '';
          }
        } else {
          if (opt.value.toString() === value.toString()) {
            selected = ' selected';
          } else {
            selected = '';
          }
        }
        html += '<option value="' + opt.value + '"' + selected + '>' + opt.label + '</option>';
      });
      html += '</select>';
    }
  } else if (type === "textarea") {
    if (framework === "bootstrap3") {
      //add bootstrap's form-control class to input elements
      hash["class"] = hash["class"] ? hash["class"] + " form-control" : "form-control"; //IE<10 throws error if hash.class syntax is used
    }
    html = '<textarea data-schema-key="' + name + '" name="' + name + '"' + objToAttributes(hash) + req + max + '>' + value + '</textarea>';
  } else if (type === "boolean") {
    if (radio) {
      html = '<div class="radio"><label><input type="radio" data-schema-key="' + name + '" name="' + name + '" value="true"' + checked + objToAttributes(hash) + req + ' /> ' + trueLabel + '</label></div>';
      html += '<div class="radio"><label><input type="radio" data-schema-key="' + name + '" name="' + name + '" value="false"' + checkedOpposite + objToAttributes(hash) + req + ' /> ' + falseLabel + '</label></div>';
    } else if (select) {
      if (framework === "bootstrap3") {
        //add bootstrap's form-control class to input elements
        hash["class"] = hash["class"] ? hash["class"] + " form-control" : "form-control"; //IE<10 throws error if hash.class syntax is used
      }
      html = '<select data-schema-key="' + name + '" name="' + name + '"' + objToAttributes(hash) + req + '>';
      html += '<option value="false"' + (!value ? ' selected' : '') + '>' + falseLabel + '</option>';
      html += '<option value="true"' + (value ? ' selected' : '') + '>' + trueLabel + '</option>';
      html += '</select>';
    } else {
      //don't add required attribute to this one because some browsers assume that to mean that it must be checked, which is not what we mean by "required"
      html = '<div class="checkbox"><label for="' + name + '"><input type="checkbox" data-schema-key="' + name + '" name="' + name + '" value="true"' + checked + objToAttributes(hash) + ' /> ' + label + '</label></div>';
    }
  } else {
    if (framework === "bootstrap3") {
      //add bootstrap's form-control class to input elements
      hash["class"] = hash["class"] ? hash["class"] + " form-control" : "form-control"; //IE<10 throws error if hash.class syntax is used
    }
    html = '<input type="' + type + '" data-schema-key="' + name + '" name="' + name + '" value="' + value + '"' + objToAttributes(hash) + req + max + min + step + ' />';
  }
  return html;
};

var cleanHash = function(hash) {
  var props = [
    "name",
    "autoform",
    "type",
    "value",
    "step",
    "data-schema-key",
    "firstOption",
    "radio",
    "select",
    "noselect",
    "trueLabel",
    "falseLabel",
    "options",
    "framework"
  ], prop;
  for (var i = 0, ln = props.length; i < ln; i++) {
    prop = props[i];
    if (prop in hash)
      delete hash[prop];
  }
  return hash;
};

var createLabelHtml = function(name, autoform, defs, hash) {
  if ("autoform" in hash) {
    delete hash.autoform;
  }

  var framework;
  if ("framework" in hash) {
    framework = hash.framework;
    delete hash.framework;
  } else {
    framework = autoform._framework || defaultFramework;
  }

  if (framework === "bootstrap3") {
    //add bootstrap's control-label class to label element
    hash["class"] = hash["class"] ? hash["class"] + " control-label" : "control-label"; //IE<10 throws error if hash.class syntax is used
  }

  var label = defs.label;
  return '<label' + objToAttributes(hash) + '>' + label + '</label>';
};
var _validateField = function(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (!template || template._notInDOM) {
    return;
  }

  var formId = template.data.formID;
  var afObj = template.data.schema;

  //XXX for speed, should get rid of this transformation eventually
  if ("Collection2" in Meteor && afObj instanceof Meteor.Collection2) {
    afObj = new AutoForm(afObj);
  }

  if (onlyIfAlreadyInvalid &&
          afObj.simpleSchema().namedContext(formId).isValid()) {
    return;
  }

  // Create a document based on all the values of all the inputs on the form
  var doc = formValues(template, afObj._hooks.formToDoc || afObj.formToDoc);

  // Determine whether we're validating for an insert or an update
  var isUpdate = !!template.find("button.update");

  // If validating for an insert, delete any properties that are
  // null, undefined, or empty strings
  if (!isUpdate) {
    doc = cleanNulls(doc);
  }

  // Skip validation if skipEmpty is true and the field we're validating
  // has no value.
  if (skipEmpty && !(key in doc)) {
    return; //skip validation
  }

  // Clean and validate doc
  if (isUpdate) {
    afObj.simpleSchema().namedContext(formId).validateOne(docToModifier(doc), key, {modifier: true});
  } else {
    afObj.simpleSchema().namedContext(formId).validateOne(expandObj(doc), key, {modifier: false});
  }
};
//throttling function that calls out to _validateField
var vok = {}, tm = {};
var validateField = function(key, template, skipEmpty, onlyIfAlreadyInvalid) {
  if (vok[key] === false) {
    Meteor.clearTimeout(tm[key]);
    tm[key] = Meteor.setTimeout(function() {
      vok[key] = true;
      _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid);
    }, 300);
    return;
  }
  vok[key] = false;
  _validateField(key, template, skipEmpty, onlyIfAlreadyInvalid);
};

var autoformSelections = {};

//using autoformSelections is only necessary when the form is invalid, and will
//cause problems if done when the form is valid, but we still have
//to transfer the selected attribute to the selected property when
//the form is valid, to make sure current values show correctly for
//an update form
// var self = this, formID = self.data.formID;
// var selections = getSelections(formID);
var setSelected = function(template){
    var self = template, formID = self.data.formID;
    var selections = getSelections(formID);

  _.each(self.findAll("select"), function(selectElement) {
    var key = selectElement.getAttribute('data-schema-key');

    if(selectElement.getAttribute('multiple') !== null){
      _.each(selectElement.options, function(option, i) {
        option.selected = option.hasAttribute("selected");
        if(selections){
          if (selections[key] && selections[key].length) {
            option.selected = _.contains(selections[key], option.value) ? true : false;
          }
        }
      });
      setSelections(selectElement, formID);
    }
  });
};

var setSelections = function(select, formID) {
  var key = select.getAttribute('data-schema-key');
  if (!key) {
    return;
  }
  var selections = [];
  for (var i = 0, ln = select.length, opt; i < ln; i++) {
    opt = select.options[i];
    if (opt.selected) {
      selections.push(opt.value);
    }
  }
  if (!(formID in autoformSelections)) {
    autoformSelections[formID] = {};
  }
  autoformSelections[formID][key] = selections;
};
var clearSelections = function(formID) {
  if (formID in autoformSelections) {
    delete autoformSelections[formID];
  }
};
var hasSelections = function(formID) {
  return (formID in autoformSelections);
};
var getSelections = function(formID) {
  return autoformSelections[formID];
};

var hasClass = function(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
};

var docToModifier = function(doc) {
  var updateObj = {};
  var nulls = reportNulls(doc);
  doc = cleanNulls(doc);

  if (!_.isEmpty(doc)) {
    updateObj.$set = doc;
  }
  if (!_.isEmpty(nulls)) {
    updateObj.$unset = nulls;
  }
  return updateObj;
};

var makeGeneric = function(name) {
  if (typeof name !== "string")
    return null;

  return name.replace(/\.[0-9]+\./g, '.$.').replace(/\.[0-9]+/g, '.$');
};

var getDefs = function(ss, name) {
  if (typeof name !== "string") {
    throw new Error("Invalid field name: (not a string)");
  }

  var defs = ss.schema(makeGeneric(name));
  if (!defs)
    throw new Error("Invalid field name: " + name);
  return defs;
};

var getEmptyObject = function(name, schemaKeys){
    var result = {};
    _.each(schemaKeys, function(key, i){
      if(key.indexOf(name+'.$.') !== -1){
        var segments = key.split('.$.');
        if(segments.length === 2){
          result[segments[1]] = '';
        }
      }
    });
    return result;
};

var nestedFields = {};

var removeNestedField = function(self, template, event){

  var name = self._target;
  var afObj = template.data.schema;
  var hooks = afObj._hooks;
  var doc = formValues(template, hooks.formToDoc || afObj.formToDoc);
  var deletedKey = '';

  doc = expandObj(doc);

  if(!doc[name])
    doc[name] = [];

  doc[name].splice(self._index, 1);

  if(autoformSelections[template.data.formID]){
    var selectKeys = _.keys(autoformSelections[template.data.formID]);
    var selectKeysFiltered = _.filter(selectKeys, function(selectKey){ return selectKey.indexOf(self._target) !== -1; });
    var removeSelected = _.difference(selectKeys, selectKeysFiltered);
    var selectNestedFields = {};

    _.each(doc[name], function(field, i){
      _.each(field, function(v, k){
        var key = name+'.'+i+'.'+k;
        if(_.indexOf(selectKeysFiltered, key) !== -1)
          selectNestedFields[key] = field[k];
      });
    });
    autoformSelections[template.data.formID] = _.pick(autoformSelections[template.data.formID], removeSelected);
    autoformSelections[template.data.formID] = _.extend(autoformSelections[template.data.formID], selectNestedFields);
  }

  if(nestedFields[self._formID][name]){
    nestedFields[self._formID][name]._values = (doc[name].length) ? doc[name] : -1;
    nestedFields[self._formID][name]._deps.changed();
  }

};

var addNestedField = function(self, template, event){

  var name = event.target.getAttribute('data-nf');
  var afObj = template.data.schema;
  var hooks = afObj._hooks;
  var doc = formValues(template, hooks.formToDoc || afObj.formToDoc);

  doc = expandObj(doc);

  if(!doc[name])
    doc[name] = [];

  doc[name].push(getEmptyObject(name, self._ss._schemaKeys));

  if(nestedFields[self._formID][name]){
    nestedFields[self._formID][name]._values = doc[name];
    nestedFields[self._formID][name]._deps.changed();
  }

};
