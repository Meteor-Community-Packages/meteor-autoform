// Tracks form data; particularly needed to track the number of items in arrays in the doc

FormData = function afFormData() {
	var self = this;
	self.forms = {};
};

FormData.prototype.initForm = function fdInitForm(formId) {
	var self = this;

	if (self.forms[formId])
		return;

	self.forms[formId] = {
		sourceDoc: null,
		deps: {
			sourceDoc: new Tracker.Dependency()
		}
	};
};

FormData.prototype.sourceDoc = function fdSourceDoc(formId, sourceDoc) {
	var self = this;
	self.initForm(formId);

	if (sourceDoc) {
		//setter
		self.forms[formId].sourceDoc = sourceDoc;
		self.forms[formId].deps.sourceDoc.changed();
	} else {
		//getter
		self.forms[formId].deps.sourceDoc.depend();
		return self.forms[formId].sourceDoc;
	}
};

FormData.prototype.getDocCountForField = function fdGetDocCountForField(formId, field) {
	var self = this;
	var mDoc = self.sourceDoc(formId);
	var docCount;
	if (mDoc) {
		var keyInfo = mDoc.getInfoForKey(field);
		if (keyInfo && _.isArray(keyInfo.value)) {
			docCount = keyInfo.value.length
		}
	}
	return docCount;
};
