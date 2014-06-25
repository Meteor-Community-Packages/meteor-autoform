ArrayTracker = function afArrayTracker() {
  var self = this;
  self.info = {};
};

ArrayTracker.prototype.getMinMax = function atGetMinMax(ss, field, overrideMinCount, overrideMaxCount) {
  var defs = Utility.getDefs(ss, field);

  // minCount is set by the schema, but can be set higher on the field attribute
  overrideMinCount = overrideMinCount || 0;
  var minCount = defs.minCount || 0;
  minCount = Math.max(overrideMinCount, minCount);

  // maxCount is set by the schema, but can be set lower on the field attribute
  overrideMaxCount = overrideMaxCount || Infinity;
  var maxCount = defs.maxCount || Infinity;
  maxCount = Math.min(overrideMaxCount, maxCount);

  return {minCount: minCount, maxCount: maxCount};
};

ArrayTracker.prototype.initForm = function atInitForm(formId) {
	var self = this;

	if (self.info[formId])
		return;

	self.info[formId] = {};
};

ArrayTracker.prototype.getForm = function atInitForm(formId) {
	var self = this;
	self.initForm(formId);
	return self.info[formId];
};

ArrayTracker.prototype.ensureField = function atEnsureField(formId, field) {
	var self = this;
	self.initForm(formId);

	if (!self.info[formId][field]) {
		self.resetField(formId, field);
	}
};

ArrayTracker.prototype.initField = function atInitField(formId, field, ss, docCount, overrideMinCount, overrideMaxCount) {
	var self = this;
	self.ensureField(formId, field);

	if (self.info[formId][field].array != null)
		return;

	// If we have a doc: The count should be the maximum of docCount or schema minCount or field minCount or 1.
	// If we don't have a doc: The count should be the maximum of schema minCount or field minCount or 1.
	var range = self.getMinMax(ss, field, overrideMinCount, overrideMaxCount);
	var arrayCount = Math.max(range.minCount, docCount || 1);

	// If this is an array of objects, collect names of object props
	var childKeys = [];
	if (ss.schema(field + '.$').type === Object) {
		childKeys = autoFormChildKeys(ss, field + '.$');
	}

	var loopArray = [];
	for (var i = 0; i < arrayCount; i++) {
		var loopCtx = {arrayFieldName: field, name: field + '.' + i, index: i, minCount: overrideMinCount, maxCount: overrideMaxCount};

		// If this is an array of objects, add child key names under loopCtx.current[childName] = fullKeyName
		if (childKeys.length) {
		  loopCtx.current = {};
		  _.each(childKeys, function (k) {
		    loopCtx.current[k] = field + '.' + i + '.' + k;
		  });
		}

		loopArray.push(loopCtx);
	};

	self.info[formId][field].array = loopArray;
	var count = loopArray.length;
	self.info[formId][field].count = count;
	self.info[formId][field].visibleCount = count;
	self.info[formId][field].deps.changed();
};

ArrayTracker.prototype.resetField = function atResetField(formId, field) {
	var self = this;
	self.initForm(formId);

	if (!self.info[formId][field]) {
		self.info[formId][field] = {
			deps: new Deps.Dependency
		};
	}

	self.info[formId][field].array = null;
	self.info[formId][field].count = 0;
	self.info[formId][field].visibleCount = 0;
	self.info[formId][field].deps.changed();
};

ArrayTracker.prototype.resetForm = function atResetForm(formId) {
	var self = this;
	_.each(self.info[formId], function (info, field) {
		self.resetField(formId, field);
	});
};

ArrayTracker.prototype.untrackForm = function atUntrackForm(formId) {
	var self = this;
	self.info[formId] = {};
};

ArrayTracker.prototype.tracksField = function atTracksField(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return !!self.info[formId][field].array;
};

ArrayTracker.prototype.getField = function atGetField(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return self.info[formId][field].array;
};

ArrayTracker.prototype.getCount = function atGetCount(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return self.info[formId][field].count;
};

ArrayTracker.prototype.getVisibleCount = function atGetVisibleCount(formId, field) {
	var self = this;
	self.ensureField(formId, field);
	self.info[formId][field].deps.depend();
	return self.info[formId][field].visibleCount;
};

ArrayTracker.prototype.addOneToField = function atAddOneToField(formId, field, ss, overrideMinCount, overrideMaxCount) {
  var self = this;
  self.ensureField(formId, field);

  if (!self.info[formId][field].array) {
  	return;
  }

  var currentCount = self.info[formId][field].visibleCount
  var maxCount = self.getMinMax(ss, field, overrideMinCount, overrideMaxCount).maxCount;

  if (currentCount < maxCount) {
	  var i = self.info[formId][field].array.length;

	  // If this is an array of objects, collect names of object props
	  var childKeys = [];
	  if (ss.schema(field + '.$').type === Object) {
	    childKeys = autoFormChildKeys(ss, field + '.$');
	  }

	  var loopCtx = {arrayFieldName: field, name: field + '.' + i, index: i, minCount: overrideMinCount, maxCount: overrideMaxCount};

	  // If this is an array of objects, add child key names under loopCtx.current[childName] = fullKeyName
	  if (childKeys.length) {
	    loopCtx.current = {};
	    _.each(childKeys, function (k) {
	      loopCtx.current[k] = field + '.' + i + '.' + k;
	    });
	  }

	  self.info[formId][field].array.push(loopCtx);
	  self.info[formId][field].count++;
	  self.info[formId][field].visibleCount++;
	  self.info[formId][field].deps.changed();
  }
};

ArrayTracker.prototype.removeFromFieldAtIndex = function atRemoveFromFieldAtIndex(formId, field, index, ss, overrideMinCount, overrideMaxCount) {
  var self = this;
  self.ensureField(formId, field);

  if (!self.info[formId][field].array) {
  	return;
  }

  var currentCount = self.info[formId][field].visibleCount
  var minCount = self.getMinMax(ss, field, overrideMinCount, overrideMaxCount).minCount;

  if (currentCount > minCount) {
    self.info[formId][field].array[index].removed = true;
    self.info[formId][field].count--;
    self.info[formId][field].visibleCount--;
    self.info[formId][field].deps.changed();
  }
}

// Returns schema keys that are direct children of the given schema key
// XXX this could be a method on ss
autoFormChildKeys = function autoFormChildKeys(ss, name) {
  name = SimpleSchema._makeGeneric(name);
  var prefix = name + ".";

  var childKeys = [];
  _.each(ss._schemaKeys, function (key) {
    // If it's a direct child, add it to the list
    if (key.indexOf(prefix) === 0) {
      var ending = key.slice(prefix.length);
      if (ending.indexOf('.') === -1) {
        childKeys.push(ending);
      }
    }
  });
  return childKeys;
};