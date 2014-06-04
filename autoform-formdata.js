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
			sourceDoc: new Deps.Dependency
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