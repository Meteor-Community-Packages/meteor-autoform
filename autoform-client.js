if (typeof Handlebars !== 'undefined') {
    Handlebars.registerHelper("autoForm", function(options) {
        if (!options) {
            return "";
        }
        var hash = options.hash || {};
        if (!window || !window[hash.schema]) {
            return options.fn(this);
        }

        var schemaObj = window[hash.schema];

        var flatDoc, schemaKeys;
        if (hash.doc) {
            schemaKeys = _.keys(schemaObj.simpleSchema().schema());
            flatDoc = collapseObj(hash.doc, schemaKeys);
        } else {
            flatDoc = {};
        }

        var context = {_ss: schemaObj, _doc: hash.doc, _flatDoc: flatDoc};
        var autoFormContext = {
            schema: hash.schema
        };
        delete hash.schema;
        if ("doc" in hash) {
            delete hash.doc;
        }
        autoFormContext.content = options.fn(context);
        autoFormContext.atts = hash.atts ? objToAttributes(hash.atts) : objToAttributes(hash);
        return new Handlebars.SafeString(Template._autoForm(autoFormContext));
    });
    Handlebars.registerHelper("quickForm", function(options) {
        if (!options) {
            return "";
        }
        var hash = options.hash || {};
        if (!window || !window[hash.schema]) {
            return "";
        }

        var schemaObj = window[hash.schema];

        var context = {
            schema: hash.schema,
            formFields: _.keys(schemaObj.simpleSchema().schema())
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
        delete hash.schema;
        context.atts = hash;
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

        //set up context for _afQuickField template
        var context = {name: name, autoform: autoform};

        //add label HTML to _afQuickField template context
        if (skipLabel) {
            context.labelHtml = "";
        } else {
            context.labelHtml = createLabelHtml(name, defs, labelHash);
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
        return obj.simpleSchema().keyErrorMessage(name);
    });
    Handlebars.registerHelper("afFieldIsInvalid", function(name, options) {
        var autoform = options.hash.autoform || this, obj = autoform._ss;
        if (!obj) {
            throw new Error("afFieldIsInvalid helper must be used within an autoForm block helper");
        }
        return obj.simpleSchema().keyIsInvalid(name);
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

        var html = createLabelHtml(name, defs, options.hash);
        return new Handlebars.SafeString(html);
    });
    Template._autoForm.events({
        'click .insert[type=submit]': function(event, template) {
            event.preventDefault();
            var doc = formValues(template);

            //for inserts, delete any properties that are null, undefined, or empty strings
            doc = cleanNulls(doc);
            doc = expandObj(doc); //inserts should not use dot notation but rather actual subdocuments

            var collection2Obj = window[template.data.schema];

            //call beforeInsert if present
            if (typeof collection2Obj.beforeInsert === "function") {
                doc = collection2Obj.beforeInsert(doc);
            }

            var cb = collection2Obj._callbacks && collection2Obj._callbacks.insert ? collection2Obj._callbacks.insert : null;
            collection2Obj.insert(doc, function(error, result) {
                if (!error) {
                    template.find("form").reset();
                }
                if (cb) {
                    cb(error, result, template);
                }
            });
        },
        'click .update[type=submit]': function(event, template) {
            event.preventDefault();
            var self = this, doc = formValues(template), nulls, updateObj = {}, docIsEmpty, nullsIsEmpty;

            //for updates, unset any properties that are null, undefined, or empty strings
            nulls = reportNulls(doc);
            doc = cleanNulls(doc);

            docIsEmpty = _.isEmpty(doc);
            nullsIsEmpty = _.isEmpty(nulls);
            if (docIsEmpty && nullsIsEmpty) {
                return;
            }
            if (!docIsEmpty) {
                updateObj.$set = doc;
            }
            if (!nullsIsEmpty) {
                updateObj.$unset = nulls;
            }

            var collection2Obj = window[template.data.schema];

            //call beforeUpdate if present
            if (typeof collection2Obj.beforeUpdate === "function") {
                updateObj = collection2Obj.beforeUpdate(self._doc._id, updateObj);
            }

            var cb = collection2Obj._callbacks && collection2Obj._callbacks.update ? collection2Obj._callbacks.update : null;
            collection2Obj.update(self._doc._id, updateObj, function(error) {
                if (cb) {
                    cb(error, template);
                }
            });
        },
        'click .remove[type=submit]': function(event, template) {
            event.preventDefault();
            var self = this;
            var collection2Obj = window[template.data.schema];

            //call beforeUpdate if present
            if (typeof collection2Obj.beforeRemove === "function") {
                if (!collection2Obj.beforeRemove(self._doc._id)) {
                    return;
                }
                ;
            }

            var cb = collection2Obj._callbacks && collection2Obj._callbacks.remove ? collection2Obj._callbacks.remove : null;
            collection2Obj.remove(self._doc._id, function(error) {
                if (cb) {
                    cb(error, template);
                }
            });
        },
        'click button[data-meteor-method]': function(event, template) {
            event.preventDefault();
            var doc = formValues(template);

            //delete any properties that are null, undefined, or empty strings
            doc = cleanNulls(doc);

            var autoFormObj = window[template.data.schema];
            var method = event.currentTarget.getAttribute("data-meteor-method");

            //call beforeMethod if present
            if (typeof autoFormObj.beforeMethod === "function") {
                doc = autoFormObj.beforeMethod(doc, method);
            }

            var cb = autoFormObj._callbacks && autoFormObj._callbacks[method] ? autoFormObj._callbacks[method] : function() {
            };

            if (autoFormObj.validate(doc)) {
                Meteor.call("_autoFormCheckFirst", method, template.data.schema, doc, function(error, result) {
                    if (!error) {
                        template.find("form").reset();
                    }
                    cb(error, result, template);
                });
            }
        },
        'click [type=reset]': function(event, template) {
            var autoFormObj = window[template.data.schema];
            if (autoFormObj) {
                autoFormObj.simpleSchema().resetValidation();
            }
        }
    });

    //This is a workaround for what seems to be a Meteor issue.
    //When Meteor updates an existing form, it selectively updates the attributes,
    //but attributes that are properties don't have the properties updated to match.
    //This means that selected is not updated properly even if the selected
    //attribute is on the element.
    Template._autoForm.rendered = function() {
        _.each(this.findAll("option"), function(optionElement) {
            if (optionElement.hasAttribute("selected")) {
                optionElement.selected = true;
            }
        });
    };
}

var formValues = function(template) {
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
//collapses object into one level, with dot notation following the mongo $set syntax
var collapseObj = function(doc, skip) {
    var res = {};
    (function recurse(obj, current) {
        if (_.isArray(obj)) {
            for (var i = 0, ln = obj.length; i < ln; i++) {
                var value = obj[i];
                var newKey = (current ? current + "." + i : i);  // joined index with dot
                if (value && (typeof value === "object" || _.isArray(value)) && !_.contains(skip, newKey)) {
                    recurse(value, newKey);  // it's a nested object or array, so do it again
                } else {
                    res[newKey] = value;  // it's not an object or array, so set the property
                }
            }
        } else {
            for (var key in obj) {
                var value = obj[key];
                var newKey = (current ? current + "." + key : key);  // joined key with dot
                if (value && (typeof value === "object" || _.isArray(value)) && !_.contains(skip, newKey)) {
                    recurse(value, newKey);  // it's a nested object or array, so do it again
                } else {
                    res[newKey] = value;  // it's not an object or array, so set the property
                }
            }
        }
    })(doc);
    return res;
};
//opposite of collapseObj
var expandObj = function(doc) {
    var newDoc = {}, subkeys, subkey, subkeylen, nextPiece, current;
    _.each(doc, function(val, key) {
        subkeys = key.split(".");
        subkeylen = subkeys.length;
        current = newDoc;
        for (var i = 0; i < subkeylen; i++) {
            subkey = subkeys[i];
            if (current[subkey] && !_.isObject(current[subkey])) {
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
                } else if (!_.isArray(current[subkey])) {
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
var dateToFieldDateString = function(date) {
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
    var html, expectsArray = _.isArray(defs.type);

    //get current value
    var value, arrayVal;
    if (expectsArray) {
        if (defs.type[0] === Date) {
            if (autoform._flatDoc && name in autoform._flatDoc) {
                arrayVal = autoform._flatDoc[name];
                value = [];
                _.each(arrayVal, function(v) {
                    value.push(dateToFieldDateString(v));
                });
            } else {
                value = [];
            }
        } else {
            if (autoform._flatDoc && name in autoform._flatDoc) {
                arrayVal = autoform._flatDoc[name];
                value = [];
                _.each(arrayVal, function(v) {
                    value.push(v.toString());
                });
            } else {
                value = [];
            }
        }
    } else {
        if (defs.type === Date) {
            if (autoform._flatDoc && name in autoform._flatDoc) {
                value = dateToFieldDateString(autoform._flatDoc[name]);
            } else {
                value = "";
            }
        } else if (defs.type === Boolean) {
            if (autoform._flatDoc && name in autoform._flatDoc) {
                value = autoform._flatDoc[name];
            } else {
                value = false;
            }
        } else {
            if (autoform._flatDoc && name in autoform._flatDoc) {
                value = autoform._flatDoc[name].toString();
            } else {
                value = "";
            }
        }
    }

    //required?
    var req = defs.optional ? "" : " required";

    //handle boolean values
    var checked = "", checkedOpposite = "";
    if (defs.type === Boolean && value) {
        checked = " checked";
    } else {
        checkedOpposite = " checked";
    }

    //get type
    var type = "text";
    if (hash.type) {
        type = hash.type;
    } else if (defs.type === String && defs.regEx === SchemaRegEx.Email) {
        type = "email";
    } else if (defs.type === String && defs.regEx === SchemaRegEx.Url) {
        type = "url";
    } else if (defs.type === Number) {
        type = "number";
    } else if (defs.type === Date) {
        type = "date";
    }

    var label = defs.label || name;

    //get correct max/min attributes
    var max = "", min = "";
    if (defs.type === String) {
        if (defs.max) {
            max = ' maxlength="' + defs.max + '"';
        }
    } else {
        //max
        if (hash.max) {
            max = ' max="' + hash.max + '"';
        } else if (defs.max) {
            if (defs.max instanceof Date) {
                max = ' max="' + dateToFieldDateString(defs.max) + '"';
            } else {
                max = ' max="' + defs.max + '"';
            }
        }
        //min
        if (hash.min) {
            min = ' min="' + hash.min + '"';
        } else if (defs.min) {
            if (defs.min instanceof Date) {
                min = ' min="' + defs.min.getUTCFullYear() + '-' + (defs.min.getUTCMonth() + 1) + '-' + defs.min.getUTCDate() + '"';
            } else {
                min = ' min="' + defs.min + '"';
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

    //clean hash; we're adding these explicitly, so we don't want to have two
    var firstOption, radio, select, trueLabel, falseLabel, selectOptions, noselect;
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
        firstOption = hash.firstOption;
        delete hash.firstOption;
    }
    if ("radio" in hash) {
        radio = hash.radio;
        delete hash.radio;
    }
    if ("select" in hash) {
        select = hash.select;
        delete hash.select;
    }
    if ("noselect" in hash) {
        noselect = hash.noselect;
        delete hash.noselect;
    }
    if ("trueLabel" in hash) {
        trueLabel = hash.trueLabel;
        delete hash.trueLabel;
    }
    if ("falseLabel" in hash) {
        falseLabel = hash.falseLabel;
        delete hash.falseLabel;
    }
    if ("options" in hash) {
        selectOptions = hash.options;
        delete hash.options;
    }

    //add bootstrap's control-label class to label element
    if ("class" in hash) {
        hash.class += " form-control";
    } else {
        hash.class = "form-control";
    }

    if (selectOptions) {
        //build anything that should be a select, which is anything with defs.options
        var multiple = "", isMultiple;
        if (expectsArray) {
            multiple = " multiple";
            isMultiple = true;
        }
        if (noselect) {
            html = "";
            _.each(selectOptions, function(opt) {
                var checked, inputType;
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
                html += '<div class="' + inputType + '"><label><input type="' + inputType + '" data-schema-key="' + name + '" name="' + name + '" value="' + opt.value + '"' + checked + objToAttributes(hash) + ' /> ' + opt.label + '</label></div>';
            });
        } else {
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
    } else if (defs.type === String && hash.rows) {
        html = '<textarea data-schema-key="' + name + '" name="' + name + '"' + objToAttributes(hash) + req + max + '>' + value + '</textarea>';
    } else if (defs.type === Boolean) {
        if (radio) {
            html = '<div class="radio"><label><input type="radio" data-schema-key="' + name + '" name="' + name + '" value="true"' + checked + objToAttributes(hash) + req + ' /> ' + trueLabel + '</label></div>';
            html += '<div class="radio"><label><input type="radio" data-schema-key="' + name + '" name="' + name + '" value="false"' + checkedOpposite + objToAttributes(hash) + req + ' /> ' + falseLabel + '</label></div>';
        } else if (select) {
            html = '<select data-schema-key="' + name + '" name="' + name + '"' + objToAttributes(hash) + req + '>';
            html += '<option value="false"' + (!value ? ' selected' : '') + '>' + falseLabel + '</option>';
            html += '<option value="true"' + (value ? ' selected' : '') + '>' + trueLabel + '</option>';
            html += '</select>';
        } else {
            html = '<div class="checkbox"><label for="' + name + '"><input type="checkbox" data-schema-key="' + name + '" name="' + name + '" value="true"' + checked + objToAttributes(hash) + req + ' /> ' + label + '</label></div>';
        }
    } else {
        html = '<input type="' + type + '" data-schema-key="' + name + '" name="' + name + '" value="' + value + '"' + objToAttributes(hash) + req + max + min + step + ' />';
    }
    return html;
};
var createLabelHtml = function(name, defs, hash) {
    if ("autoform" in hash) {
        delete hash.autoform;
    }

    //add bootstrap's control-label class to label element
    if ("class" in hash) {
        hash.class += " control-label";
    } else {
        hash.class = "control-label";
    }

    var label = defs.label || name;
    return '<label' + objToAttributes(hash) + '>' + label + '</label>';
};