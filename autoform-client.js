var defaultFramework = "bootstrap3";

AutoForm.prototype.resetForm = function(formID) {
  var self = this;

  if (typeof formID !== "string") {
    return;
  }

  self.namedContext(formID).resetValidation();
  clearSelections(formID);
};

//add callbacks() method to Meteor.Collection2
if (typeof Meteor.Collection2 !== 'undefined') {
  Meteor.Collection2.prototype.resetForm = function(formID) {
    var self = this;

    if (typeof formID !== "string") {
      return;
    }

    self.namedContext(formID).resetValidation();
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

    var flatDoc;
    if (hash.doc) {
      flatDoc = schemaObj.simpleSchema().collapseObj(hash.doc);
      if (typeof schemaObj.docToForm === "function") {
        flatDoc = schemaObj.docToForm(flatDoc);
      }
    } else {
      flatDoc = {};
    }

    var autoFormContext = {
      schema: schemaObj,
      _ss: schemaObj,
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

    autoFormContext.content = options.fn({_ss: autoFormContext._ss, _doc: autoFormContext._doc, _flatDoc: autoFormContext._flatDoc, _formID: autoFormContext.formID, _framework: autoFormContext._framework});

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
      formFields: _.keys(hash.schema.simpleSchema().schema())
    };

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
    var hash = options.hash, autoform = hash.autoform || this;
    var obj = autoform._ss;
    if (!obj) {
      throw new Error("afQuickField helper must be used within an autoForm block");
    }
    var defs = obj.simpleSchema().schema(name);
    if (!defs) {
      throw new Error("Invalid field name");
    }

    //boolean type renders a check box that already has a label, so don't generate another label
    var skipLabel = (defs.type === Boolean && !("select" in hash) && !("radio" in hash));

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
    var autoform = options.hash.autoform || this, obj = autoform._ss;
    if (!obj) {
      throw new Error("afFieldMessage helper must be used within an autoForm block helper");
    }
    return obj.namedContext(autoform._formID).keyErrorMessage(name);
  });
  Handlebars.registerHelper("afFieldIsInvalid", function(name, options) {
    var autoform = options.hash.autoform || this, obj = autoform._ss;
    if (!obj) {
      throw new Error("afFieldIsInvalid helper must be used within an autoForm block helper");
    }
    return obj.namedContext(autoform._formID).keyIsInvalid(name);
  });
  Handlebars.registerHelper("afFieldInput", function(name, options) {
    var autoform = options.hash.autoform || this, obj = autoform._ss;
    if (!obj) {
      throw new Error("afFieldInput helper must be used within an autoForm block helper");
    }
    var defs = obj.simpleSchema().schema(name);
    if (!defs) {
      throw new Error("Invalid field name");
    }
    var html = createInputHtml(name, autoform, defs, options.hash);
    return new Handlebars.SafeString(html);
  });
  Handlebars.registerHelper("afFieldLabel", function(name, options) {
    var autoform = options.hash.autoform || this, obj = autoform._ss;
    if (!obj) {
      throw new Error("afFieldLabel helper must be used within an autoForm block helper");
    }
    var defs = obj.simpleSchema().schema(name);
    if (!defs) {
      throw new Error("Invalid field name");
    }

    var html = createLabelHtml(name, autoform, defs, options.hash);
    return new Handlebars.SafeString(html);
  });
  Template._autoForm.events({
    'submit form': function(event, template) {
      var submitButton = template.find("button[type=submit]");
      if (!submitButton) {
        return;
      }

      //determine what we want to do
      var isInsert = hasClass(submitButton, "insert");
      var isUpdate = hasClass(submitButton, "update");
      var isRemove = hasClass(submitButton, "remove");
      var method = submitButton.getAttribute("data-meteor-method");
      var onSubmit = template.data.onSubmit;

      //init
      var self = this;
      var validationType = template.data.validationType;
      var afc2Obj = template.data.schema;
      var formId = template.data.formID;
      var currentDoc = self._doc || null;
      var docId = currentDoc ? currentDoc._id : null;
      var doc = formValues(template, afc2Obj.formToDoc);

      //for inserts, delete any properties that are null, undefined, or empty strings,
      //and expand to use subdocuments instead of dot notation keys
      var insertDoc = expandObj(cleanNulls(doc));
      //for updates, convert to modifier object with $set and $unset
      var updateDoc = docToModifier(doc);

      if (isInsert || isUpdate || isRemove || method) {
        event.preventDefault(); //prevent default here if we're planning to do our own thing
      }

      //pass both types of doc to onSubmit
      if (typeof onSubmit === "function") {
        if (validationType === 'none' || afc2Obj.validate(insertDoc, {validationContext: formId, modifier: false})) {
          var context = {
            resetForm: function() {
              template.find("form").reset();
            }
          };
          var shouldContinue = onSubmit.call(context, insertDoc, updateDoc, currentDoc);
          if (shouldContinue === false) {
            event.preventDefault();
            return;
          }
        }
      }

      //allow normal form submission
      if (!isInsert && !isUpdate && !isRemove && !method) {
        if (validationType !== 'none' && !afc2Obj.validate(insertDoc, {validationContext: formId, modifier: false})) {
          event.preventDefault(); //don't submit the form if invalid
        }
        return;
      }

      //do it
      if (isInsert) {
        //call beforeInsert if present
        if (typeof afc2Obj.beforeInsert === "function") {
          insertDoc = afc2Obj.beforeInsert(insertDoc);
          if (!_.isObject(insertDoc)) {
            throw new Error("beforeInsert must return an object");
          }
        }

        var cb = afc2Obj._callbacks && afc2Obj._callbacks.insert ? afc2Obj._callbacks.insert : null;
        afc2Obj.insert(insertDoc, {validationContext: formId}, function(error, result) {
          if (!error) {
            template.find("form").reset();
          }
          if (cb) {
            cb(error, result, template);
          }
        });
      } else if (isUpdate) {
        if (!_.isEmpty(updateDoc)) {
          //call beforeUpdate if present
          if (typeof afc2Obj.beforeUpdate === "function") {
            updateDoc = afc2Obj.beforeUpdate(docId, updateDoc);
            if (!_.isObject(updateDoc)) {
              throw new Error("beforeUpdate must return an object");
            }
          }

          var cb = afc2Obj._callbacks && afc2Obj._callbacks.update ? afc2Obj._callbacks.update : null;
          afc2Obj.update(docId, updateDoc, {validationContext: formId}, function(error) {
            //don't automatically reset the form for updates because we
            //often won't want that
            if (cb) {
              cb(error, template);
            }
          });
        }
      } else if (isRemove) {
        //call beforeRemove if present
        var stop = false;
        if (typeof afc2Obj.beforeRemove === "function") {
          if (afc2Obj.beforeRemove(docId) === false) {
            stop = true;
          }
        }
        if (!stop) {
          var cb = afc2Obj._callbacks && afc2Obj._callbacks.remove ? afc2Obj._callbacks.remove : null;
          afc2Obj.remove(docId, function(error) {
            if (cb) {
              cb(error, template);
            }
          });
        }
      }

      //we won't do an else here so that a method could be called in
      //addition to another action on the same submit
      if (method) {
        //call beforeMethod if present
        if (typeof afc2Obj.beforeMethod === "function") {
          insertDoc = afc2Obj.beforeMethod(insertDoc, method);
          if (!_.isObject(insertDoc)) {
            throw new Error("beforeMethod must return an object");
          }
        }

        var cb = afc2Obj._callbacks && afc2Obj._callbacks[method] ? afc2Obj._callbacks[method] : function() {
        };

        if (validationType === 'none' || afc2Obj.validate(insertDoc, {validationContext: formId, modifier: false})) {
          Meteor.call(method, insertDoc, function(error, result) {
            if (!error) {
              template.find("form").reset();
            }
            cb(error, result, template);
          });
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
        afc2Obj.resetForm(formId);
      }
    }
  });

  //This is a workaround for what seems to be a Meteor issue.
  //When Meteor updates an existing form, it selectively updates the attributes,
  //but attributes that are properties don't have the properties updated to match.
  //This means that selected is not updated properly even if the selected
  //attribute is on the element.
  Template._autoForm.rendered = function() {
    //using autoformSelections is only necessary when the form is invalid, and will
    //cause problems if done when the form is valid, but we still have
    //to transfer the selected attribute to the selected property when
    //the form is valid, to make sure current values show correctly for
    //an update form
    var self = this, formID = self.data.formID;
    var selections = getSelections(formID);
    if (!selections) {
      _.each(self.findAll("select"), function(selectElement) {
        _.each(selectElement.options, function(option) {
          option.selected = option.hasAttribute("selected"); //transfer att to prop
        });
        setSelections(selectElement, formID);
      });
      return;
    }
    if (!selections) {
      return;
    }
    _.each(self.findAll("select"), function(selectElement) {
      var key = selectElement.getAttribute('data-schema-key');
      var selectedValues = selections[key];
      if (selectedValues && selectedValues.length) {
        _.each(selectElement.options, function(option) {
          if (_.contains(selectedValues, option.value)) {
            option.selected = true;
          }
        });
      }
    });
  };

  Template._autoForm.destroyed = function() {
    this._notInDOM = true;
  };
}

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

    //handle checkbox
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

    //handle radio
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

    //handle select
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

    //handle number inputs
    if (type === "number") {
      var floatVal = parseFloat(val);
      if (!isNaN(floatVal)) {
        doc[name] = floatVal;
      } else {
        doc[name] = val; //set to string so will fail validation
      }
      return;
    }

    //handle date inputs
    if (type === "date") {
      if (typeof val === "string" && val.length) {
        var datePieces = val.split("-");
        var year = parseInt(datePieces[0], 10);
        var month = parseInt(datePieces[1], 10) - 1;
        var date = parseInt(datePieces[2], 10);
        doc[name] = new Date(Date.UTC(year, month, date));
      } else {
        doc[name] = null;
      }
      return;
    }

    //handle all other inputs
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
  var dateString = dateToDateStringUTC(date);

  var h = date.getUTCHours();
  if (h < 10) {
    h = "0" + h;
  }

  var m = date.getUTCMinutes();
  if (m < 10) {
    m = "0" + m;
  }

  var s = date.getUTCSeconds();
  if (s < 10) {
    s = "0" + s;
  }

  var ms = date.getUTCMilliseconds();

  var timeString = h + ":" + m;
  if (s !== "00" || ms !== 0) {
    timeString += ":" + s;
    if (ms !== 0) {
      timeString += "." + ms;
    }
  }

  return dateString + "T" + timeString + "Z";
};

//returns a "valid normalized local date and time string"
var dateToNormalizedLocalDateAndTimeString = function(date) {
  var dateString = dateToDateString(date);

  var h = date.getHours();
  if (h < 10) {
    h = "0" + h;
  }

  var m = date.getMinutes();
  if (m < 10) {
    m = "0" + m;
  }

  var s = date.getSeconds();
  if (s < 10) {
    s = "0" + s;
  }

  var ms = date.getMilliseconds();

  var timeString = h + ":" + m;
  if (s !== "00" || ms !== 0) {
    timeString += ":" + s;
    if (ms !== 0) {
      timeString += "." + ms;
    }
  }

  return dateString + "T" + timeString;
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
  var expectsArray = _.isArray(schemaType);
  if (expectsArray && hash.type) {
    //if the user overrides the type to anything,
    //then we won't be using a select box and
    //we won't be expecting an array for the current value
    schemaType = schemaType[0]; //this, for example, changes [String] to String
    expectsArray = false;
  }

  //get current value
  var value, arrayVal;
  if (expectsArray) {
    if (schemaType[0] === Date) {
      if (autoform._flatDoc && name in autoform._flatDoc) {
        arrayVal = autoform._flatDoc[name];
        value = [];
        _.each(arrayVal, function(v) {
          value.push(dateToDateStringUTC(v));
        });
      } else {
        value = hash.value || [];
      }
    } else {
      if (autoform._flatDoc && name in autoform._flatDoc) {
        arrayVal = autoform._flatDoc[name];
        value = [];
        _.each(arrayVal, function(v) {
          value.push(v.toString());
        });
      } else {
        value = hash.value || [];
      }
    }
  } else {
    if (schemaType === Boolean) {
      if (autoform._flatDoc && name in autoform._flatDoc) {
        value = autoform._flatDoc[name];
      } else {

      }
    } else {
      if (autoform._flatDoc && name in autoform._flatDoc) {
        value = autoform._flatDoc[name];
        if (!(value instanceof Date)) { //we will convert dates to a string later, after we know what the field type will be
          value = value.toString();
        }
      } else {
        value = hash.value || "";
      }
    }
  }

  //required?
  var req = defs.optional ? "" : " required";

  //get type
  var type = "text";
  if (hash.type) {
    type = hash.type;
  } else if (schemaType === String && hash.rows) {
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

  //convert Date value to required string value based on field type
  if (value instanceof Date) {
    if (type === "date") {
      value = dateToDateStringUTC(value);
    } else if (type === "datetime") {
      value = dateToNormalizedForcedUtcGlobalDateAndTimeString(value);
    } else if (type === "datetime-local") {
      value = dateToNormalizedLocalDateAndTimeString(value);
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

  var label = defs.label;

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

  if (schemaType === String) {
    if (resolvedMax) {
      max = ' maxlength="' + resolvedMax + '"';
    }
  } else {
    //max
    if (hash.max) {
      max = ' max="' + hash.max + '"';
    } else if (resolvedMax) {
      if (resolvedMax instanceof Date) {
        if (type === "date") {
          max = ' max="' + dateToDateStringUTC(resolvedMax) + '"';
        } else if (type === "datetime") {
          max = ' max="' + dateToNormalizedForcedUtcGlobalDateAndTimeString(resolvedMax) + '"';
        } else if (type === "datetime-local") {
          max = ' max="' + dateToNormalizedLocalDateAndTimeString(resolvedMax) + '"';
        }
      } else {
        max = ' max="' + resolvedMax + '"';
      }
    }
    //min
    if (hash.min) {
      min = ' min="' + hash.min + '"';
    } else if (resolvedMin) {
      if (resolvedMin instanceof Date) {
        if (type === "date") {
          min = ' min="' + dateToDateStringUTC(resolvedMin) + '"';
        } else if (type === "datetime") {
          min = ' min="' + dateToNormalizedForcedUtcGlobalDateAndTimeString(resolvedMin) + '"';
        } else if (type === "datetime-local") {
          min = ' min="' + dateToNormalizedLocalDateAndTimeString(resolvedMin) + '"';
        }
      } else {
        min = ' min="' + resolvedMin + '"';
      }
    }
  }

  //get step value
  var step = "";
  if (hash.step) {
    step = ' step="' + hash.step + '"';
  } else if (defs.decimal) {
    step = ' step="0.01"';
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

  //clean hash so that we can add anything remaining as attributes
  hash = cleanHash(hash);

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
          if (opt.value.toString() === value) {
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
          if (opt.value.toString() === value) {
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
  if ("name" in hash) {
    delete hash.name;
  }
  if ("autoform" in hash) {
    delete hash.autoform;
  }
  if ("type" in hash) {
    delete hash.type;
  }
  if ("value" in hash) {
    delete hash.value;
  }
  if ("step" in hash) {
    delete hash.step;
  }
  if ("data-schema-key" in hash) {
    delete hash["data-schema-key"];
  }
  if ("firstOption" in hash) {
    delete hash.firstOption;
  }
  if ("radio" in hash) {
    delete hash.radio;
  }
  if ("select" in hash) {
    delete hash.select;
  }
  if ("noselect" in hash) {
    delete hash.noselect;
  }
  if ("trueLabel" in hash) {
    delete hash.trueLabel;
  }
  if ("falseLabel" in hash) {
    delete hash.falseLabel;
  }
  if ("options" in hash) {
    delete hash.options;
  }
  if ("framework" in hash) {
    delete hash.framework;
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
  if (!template || template._notInDOM)
    return;

  var afc2Obj = template.data.schema;
  var formId = template.data.formID;
  var doc = formValues(template, afc2Obj.formToDoc);

  //delete any properties that are null, undefined, or empty strings
  doc = cleanNulls(doc);

  if (skipEmpty && !(key in doc)) {
    return; //skip validation
  }

  if (onlyIfAlreadyInvalid && afc2Obj.namedContext(formId).isValid()) {
    return;
  }

  //clean and validate doc
  afc2Obj.validateOne(doc, key, {validationContext: formId, modifier: false});
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
