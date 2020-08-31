import { Random } from 'meteor/random';
import { expect } from 'chai';
import MongoObject from 'mongo-object';
import { stub, restoreAll, overrideStub, UnexpectedCallError } from './test-utils.tests'
import { Validation } from '../autoform-validation'
import { Utility } from '../utility'
import { Hooks } from '../autoform-hooks'

describe('api', function () {
  afterEach(function () {
    restoreAll();
  });

  describe('addHooks', function () {
    it ("defines hooks to be used by one or more forms", function () {
      const formId = Random.id();
      const onSubmit = function () {};
      AutoForm.addHooks(formId, { onSubmit });
      expect(AutoForm._hooks[formId].onSubmit).to.deep.equal([onSubmit]);
      // add
      AutoForm.addHooks(formId, { onSubmit });
      expect(AutoForm._hooks[formId].onSubmit).to.deep.equal([onSubmit, onSubmit]);
      // replace
      AutoForm.addHooks(formId, { onSubmit }, true);
      expect(AutoForm._hooks[formId].onSubmit).to.deep.equal([onSubmit]);
    });
    it ("defines global hooks if formIds is null", function () {
      const onSubmit = function () {};
      AutoForm.addHooks(null, { onSubmit });
      expect(AutoForm._globalHooks.onSubmit).to.deep.equal([onSubmit]);
      // add
      AutoForm.addHooks(null, { onSubmit });
      expect(AutoForm._globalHooks.onSubmit).to.deep.equal([onSubmit, onSubmit]);
      // replace
      AutoForm.addHooks(null, { onSubmit }, true);
      expect(AutoForm._globalHooks.onSubmit).to.deep.equal([onSubmit]);
    });
  });
  describe('hooks', function () {
    it ("Defines hooks by form id", function () {
      const formId = Random.id();
      const beginSubmit = function () {};
      const hooks = {
        [formId]: { beginSubmit }
      };
      AutoForm.hooks(hooks)
      expect(AutoForm._hooks[formId].beginSubmit).to.deep.equal([beginSubmit]);
      // add
      AutoForm.hooks(hooks)
      expect(AutoForm._hooks[formId].beginSubmit).to.deep.equal([beginSubmit, beginSubmit]);
      // replace
      AutoForm.hooks(hooks, true)
      expect(AutoForm._hooks[formId].beginSubmit).to.deep.equal([beginSubmit]);
    });
  });
  describe('_forceResetFormValues', function () {
    it ("Forces an AutoForm's values to properly update", function (done) {
      const formId = Random.id()
      AutoForm._forceResetFormValues(formId)
      expect(AutoForm._destroyForm[formId].get()).to.equal(true)
      setTimeout(() => {
        expect(AutoForm._destroyForm[formId].get()).to.equal(false)
        done()
      }, 10)
    });
  });
  describe('resetForm', function () {
    it ("resets an AutoForm", function () {
      const formId = Random.id()
      const template = {
        isReset: false,
        $: function () {
          return [{
            reset: function () {
              template.isReset = true
            }
          }]
        }
      }
      stub(AutoForm, 'templateInstanceForForm', id => {
        if (id === formId) return template
      })
      stub(AutoForm.Utility, 'checkTemplate', () => true)
      expect(template.isReset).to.equal(false)
      AutoForm.resetForm(formId)
      expect(template.isReset).to.equal(true)
    });
  });
  describe('setDefaultTemplate', function () {
    it ("sets a default template reactively", function (done) {
      const defaultTemplate = Random.id()
      AutoForm.setDefaultTemplate(defaultTemplate)

      Tracker.autorun(() => {
        const currentTemplate = AutoForm.getDefaultTemplate()
        if (currentTemplate === defaultTemplate) {
          // reset for other tests
          AutoForm.setDefaultTemplate('bootstrap3')
          done()
        }
      })
    });
  });
  describe('getDefaultTemplate', function () {
    it ("returns the default gllobal template", function () {
      expect(AutoForm.getDefaultTemplate()).to.equal('bootstrap3')
    });
  });
  describe('setDefaultTemplateForType', function () {
    it ("sets a default global template for a certain type", function () {
      const defaultTemplate = Random.id()
      Template[`type_${defaultTemplate}`] = { foo: defaultTemplate }

      AutoForm.setDefaultTemplateForType('type', defaultTemplate)

      Tracker.autorun(() => {
        const currentTemplate = AutoForm.getDefaultTemplateForType()
        if (currentTemplate === defaultTemplate) {
          // cleanup and done
          delete Template[`type_${defaultTemplate}`]
          done()
        }
      })
    });
  });
  describe('getDefaultTemplateForType', function () {
    it ("gets default template for a given type", function () {
      // side effect from last unit
      expect(AutoForm.getDefaultTemplateForType('type')).to.be.a('string')
      expect(AutoForm.getDefaultTemplateForType(Random.id())).to.equal(undefined)
    });
  });
  describe('getTemplateName', function () {
    let templateType;
    let templateName;
    let fieldName;
    let template;

    beforeEach(function () {
      templateType= Random.id();
      templateName = Random.id();
      fieldName = Random.id();
      template = `${templateType}_${templateName}`;
    });

    afterEach(function () {
      delete Template[template];
    });

    it (" Default case: use the `template` attribute provided", function () {
      // with skipExistsCheck
      expect(AutoForm.getTemplateName(templateType, templateName, fieldName, true))
        .to.equal(template);

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, templateName, fieldName, false))
        .to.equal(template);
      delete Template[template];
    });
    it ("shows a warnring, if the attributes provided a templateName but that template didn't exist", function () {
      let warned = false;
      AutoForm._debug = true;
      stub(console, 'warn',  message => {
        expect(message).to.equal(`${templateType}: "${templateName}" is not a valid template name. Falling back to a different template.`);
        warned = true;
      })

      AutoForm.getTemplateName(templateType, templateName);
      expect(warned).to.equal(true);
      AutoForm._debug = false;
    });
    it ("Fallback #1: autoform.<componentType>.template from the schema", function () {
      let exec = false;
      const schema = {
        autoform: {
          [templateType]: {
            template: templateName
          }
        }
      };

      stub(AutoForm, 'getSchemaForField', () => {
        exec = true;
        return schema
      });

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, Random.id(), fieldName, false))
        .to.equal(template);
      expect(exec).to.equal(true);
    });
    it ("Fallback #2: autoform.template from the schema", function () {
      const schema = {
        autoform: {
          template: templateName
        }
      };

      let exec = false;

      stub(AutoForm, 'getSchemaForField', () => {
        exec = true;
        return schema
      });

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, Random.id(), fieldName, false))
        .to.equal(template);
      expect(exec).to.equal(true);
    });
    it ("Fallback #3: template-<componentType> attribute on an ancestor component within the same form", function () {
      const schema = {};
      let exec = false;

      stub(AutoForm, 'getSchemaForField', () => schema);
      stub(AutoForm, 'findAttribute', name => {
        if (name === `template-${templateType}`) {
          exec = true;
          return templateName
        }
      });

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, Random.id(), fieldName, false))
        .to.equal(template);
      expect(exec).to.equal(true);
    });
    it ("Fallback #4: template attribute on an ancestor component within the same form", function () {
      const schema = {};
      let exec = false;

      stub(AutoForm, 'getSchemaForField', () => schema);
      stub(AutoForm, 'findAttribute', name => {
        if (name === `template`) {
          exec = true;
          return templateName
        }
      });

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, Random.id(), fieldName, false))
        .to.equal(template);
      expect(exec).to.equal(true);
    });
    it ("Fallback #5: Default template for component type, as set by AutoForm.setDefaultTemplateForType", function () {
      const schema = {};
      let exec = false;

      stub(AutoForm, 'getSchemaForField', () => schema);
      stub(AutoForm, 'findAttribute', () => {});
      stub(AutoForm, 'getDefaultTemplateForType', type => {
        if (type === templateType) {
          exec = true;
          return templateName;
        }
      });

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, Random.id(), fieldName, false))
        .to.equal(template);
      expect(exec).to.equal(true);
    });
    it ("Fallback #6: Default template, as set by AutoForm.setDefaultTemplate", function () {
      const schema = {};
      let exec = false;

      stub(AutoForm, 'getSchemaForField', () => schema);
      stub(AutoForm, 'findAttribute', () => {});
      stub(AutoForm, 'getDefaultTemplateForType', type => {});
      stub(AutoForm, 'getDefaultTemplate', () => {
        exec = true;
        return templateName;
      });

      // no skipExistsCheck but in Template
      Template[template] = {};
      expect(AutoForm.getTemplateName(templateType, Random.id(), fieldName, false))
        .to.equal(template);
      expect(exec).to.equal(true);
    });
    it ("Found nothing. Return undefined", function () {
      const schema = {};
      let exec = false;

      stub(AutoForm, 'getSchemaForField', () => schema);
      stub(AutoForm, 'findAttribute', () => {});
      stub(AutoForm, 'getDefaultTemplateForType', type => {});
      stub(AutoForm, 'getDefaultTemplate', () => {
        exec = true;
        // just check that we ran through but return nothing
      });

      // no skipExistsCheck but in Template
      expect(AutoForm.getTemplateName(templateType,templateName, fieldName, false))
        .to.equal(undefined);
      expect(exec).to.equal(true);
    });
  });
  describe('getFormValues', function () {
    it ("returns null if template is not rendered or destroyed", function () {
      stub(AutoForm, 'templateInstanceForForm', () => ({}));
      expect(AutoForm.getFormValues()).to.equal(null);
    });
    it ("returns an object representing the current values of all schema-based fields in the form", function () {
      const formData = {
        doc: { foo: Random.id(), empty: "" }, // the form is not yet rendered, use the form.doc
        autoConvert: false,
        removeEmptyStrings: false
      };
      const template = {
        view: {}
      };

      const expectedDoc = {
        insertDoc: { ...formData.doc },
        updateDoc: { $set: { ...formData.doc }}
      };
      const formToDocValue = Random.id(); // should be added by hook
      const formToModifierValue = Random.id(); // should be added by hook
      expectedDoc.insertDoc.formToDocValue = formToDocValue;
      expectedDoc.updateDoc.$set.formToModifierValue = formToModifierValue;

      formData.doc.bar = Random.id(); // should be removed at schema.clean

      // schema
      let cleanCalled = false;
      const schema = {
        clean: (doc, options) => {
          if (doc.$set) {
            expect(doc.$set).to.deep.equal(formData.doc);
          } else {
            expect(doc).to.deep.equal(formData.doc);
          }
          expect(options).to.deep.equal({
            isModifier: !!doc.$set,
            getAutoValues: false,
            filter: true,
            autoConvert: false, // explicitly set in formData
            trimStrings: true,
            mutate: true
          });
          delete doc.bar
          if (doc.$set) {
            delete doc.$set.bar
          }
          cleanCalled = true;
          return doc;
        }
      };

      stub(AutoForm, 'getFormSchema', () => schema);
      stub(AutoForm, 'getCurrentDataForForm', () => formData);
      stub(Utility, 'compactArrays', () => {});
      stub(Hooks, 'getHooks', (id, name) => {
        if (name === 'formToDoc') {
          return [function (insertDoc) {
            insertDoc.formToDocValue = formToDocValue;
            return insertDoc
          }]
        }

        if (name === 'formToModifier') {
          return [function (updateDoc) {
            updateDoc.$set.formToModifierValue = formToModifierValue;
            return updateDoc
          }]
        }

        throw new UnexpectedCallError()
      });

      let cleanNullsCalled = false;
      stub(Utility, 'cleanNulls', (doc, isArray, keepEmptyStr) => {
        expect(doc).to.deep.equal(formData.doc);
        expect(isArray).to.equal(false, 'isArray');
        expect(keepEmptyStr).to.equal(true, 'keepEmptyStr');
        cleanNullsCalled = true;
        return { ...doc };
      });

      const formValues = AutoForm.getFormValues(Random.id(), template);
      expect(cleanCalled).to.equal(true, 'cleanCalled');
      expect(cleanNullsCalled).to.equal(true, 'cleanNullsCalled');
      expect(formValues).to.deep.equal(expectedDoc);
    });
  });
  describe('resetValueCache', function () {
    it ("resets the cache and marks all fields as changed for a given field", function () {
      const fieldName = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        }
      };

      stub(AutoForm, 'templateInstanceForForm', () => template);
      AutoForm.resetValueCache(Random.id(), fieldName);

      expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
      expect(Object.keys(template.formValues).length).to.equal(1); // no side effect on Obj
    });
    it ("marks the ancestors as changed, if they exist", function () {
      const fieldName = Random.id();
      const subField = `${fieldName}.$`;
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency(),
          [subField]: new Tracker.Dependency()
        }
      };

      stub(AutoForm, 'templateInstanceForForm', () => template);

      AutoForm.resetValueCache(Random.id(), subField);

      expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
      expect(template.formValues[subField].isMarkedChanged).to.equal(true);
      expect(Object.keys(template.formValues).length).to.equal(2); // no side effect on Obj
    });
    it ("marks all fields as changed if no fieldName is given", function () {
      const fieldName = Random.id();
      const subField = `${fieldName}.$`;
      const otherField = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency(),
          [subField]: new Tracker.Dependency(),
          [otherField]: new Tracker.Dependency()
        }
      };

      stub(AutoForm, 'templateInstanceForForm', () => template);

      AutoForm.resetValueCache(Random.id());

      expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
      expect(template.formValues[subField].isMarkedChanged).to.equal(true);
      expect(template.formValues[otherField].isMarkedChanged).to.equal(true);
      expect(Object.keys(template.formValues).length).to.equal(3); // no side effect on Obj
    });
  });
  describe('getFieldValue', function () {
    it ("returns undefined, if there is no template and no formId", function () {
      let exec = false;
      stub(AutoForm, 'templateInstanceForForm', () => {
        exec = true;
      });
      stub(AutoForm, 'rerunWhenFormRenderedOrDestroyed', () => {
        throw new UnexpectedCallError()
      });
      expect(AutoForm.getFieldValue()).to.equal(undefined);
      expect(exec).to.equal(true);
    });
    it ("marks form for rerun if there is no template but a formid", function () {
      let exec = false;
      stub(AutoForm, 'templateInstanceForForm', () => {});
      stub(AutoForm, 'rerunWhenFormRenderedOrDestroyed', () => {
        exec = true;
      });
      expect(AutoForm.getFieldValue(undefined, Random.id())).to.equal(undefined);
      expect(exec).to.equal(true);
    });
    it ("returns the cached value if the field is not markedChanged", function () {
      const fieldName = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        }
      };
      const value = Random.id();
      template.formValues[fieldName].isMarkedChanged = false;
      template.formValues[fieldName].cachedValue = value;

      stub(AutoForm, 'templateInstanceForForm', () => template);
      stub(AutoForm, 'getFormValues', () => {
        throw new UnexpectedCallError()
      });
      expect(AutoForm.getFieldValue(fieldName, formId)).to.eq(value);
    });
    it ("returns undefined if no doc is found for this form", function () {
      let exec = false;
      const fieldName = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        }
      };
      const value = Random.id();
      template.formValues[fieldName].isMarkedChanged = true;

      stub(AutoForm, 'templateInstanceForForm', () => template);
      stub(AutoForm, 'getFormValues', () => {
        exec = true;
      });
      expect(AutoForm.getFieldValue(fieldName, formId)).to.equal(undefined);
      expect(exec).to.equal(true);
    });
    it ("caches the current field value and returns it", function () {
      const fieldName = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        }
      };
      const value = Random.id();
      template.formValues[fieldName].isMarkedChanged = true;

      stub(AutoForm, 'templateInstanceForForm', () => template);
      stub(AutoForm, 'getFormValues', () => ({}));
      stub(MongoObject.prototype, 'getValueForKey', () => value);
      expect(AutoForm.getFieldValue(fieldName, formId)).to.equal(value);
      expect(template.formValues[fieldName].isMarkedChanged).to.equal(false);
      expect(template.formValues[fieldName].cachedValue).to.equal(value);
    });
    it ("runs reactively", function (done) {
      const fieldName = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        }
      };
      const value = Random.id();
      template.formValues[fieldName].isMarkedChanged = false;

      stub(AutoForm, 'templateInstanceForForm', () => template);
      stub(AutoForm, 'getFormValues', () => ({}));
      stub(MongoObject.prototype, 'getValueForKey', () => value);

      Tracker.autorun(() => {
        const currentValue = AutoForm.getFieldValue(fieldName, formId);
        if (currentValue === value) {
          expect(template.formValues[fieldName].isMarkedChanged).to.equal(false);
          expect(template.formValues[fieldName].cachedValue).to.equal(value);
          done();
        }
      });

      setTimeout(() => {
        template.formValues[fieldName].isMarkedChanged = true;
        template.formValues[fieldName].changed();
      }, 25);
    });
  });
  describe('setFieldValue', function () {
    it ("sets the value for a field and adds the key if not yet existent", function (done) {
      const fieldName = Random.id();
      const value = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        },
        view: {
          _domrange: {}
        }
      };

      let doc;
      stub(AutoForm.reactiveFormData, 'sourceDoc', (formId, mDoc) => {
        doc = mDoc;
      });
      stub(MongoObject.prototype, 'getInfoForKey', () => false);
      stub(MongoObject.prototype, 'setValueForKey', () => {
        throw new UnexpectedCallError()
      });
      stub(AutoForm, 'templateInstanceForForm', () => template);

      AutoForm.setFieldValue(fieldName, value, formId);

      setTimeout(() => {
        expect(doc._obj[fieldName]).to.equal(value);
        expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
        done();
      }, 160);
    });
    it ("sets the value for a field and updates the key if existent", function (done) {
      const fieldName = Random.id();
      const value = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        },
        view: {
          _domrange: {}
        }
      };

      let doc = new MongoObject({ [fieldName]: Random.id() });
      stub(AutoForm.reactiveFormData, 'sourceDoc', (formId, mDoc) => {
        if (mDoc) {
          doc = mDoc;
        }
        return doc;
      });
      stub(MongoObject.prototype, 'getInfoForKey', () => true);
      stub(MongoObject.prototype, 'addKey', () => {
        throw new UnexpectedCallError()
      });
      stub(AutoForm, 'templateInstanceForForm', () => template);

      AutoForm.setFieldValue(fieldName, value, formId);

      setTimeout(() => {
        expect(doc._obj[fieldName]).to.equal(value);
        expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
        done();
      }, 160);
    });
    it ("runs reactively", function (done) {
      const fieldName = Random.id();
      const value = Random.id();
      const formId = Random.id();
      const template = {
        formValues: {
          [fieldName]: new Tracker.Dependency()
        },
        view: {
          _domrange: {}
        }
      };

      let doc = new MongoObject({ [fieldName]: Random.id() });
      stub(AutoForm.reactiveFormData, 'sourceDoc', (formId, mDoc) => {
        if (mDoc) {
          doc = mDoc;
        }
        return doc;
      });
      stub(MongoObject.prototype, 'getInfoForKey', () => true);
      stub(MongoObject.prototype, 'addKey', () => {
        throw new UnexpectedCallError()
      });
      stub(AutoForm, 'templateInstanceForForm', () => template);

      const getValue = () => {
        template.formValues[fieldName].depend();
        return  doc._obj[fieldName];
      }

      Tracker.autorun(() => {
        const currentValue = getValue();
        if (currentValue === value) {
          expect(doc._obj[fieldName]).to.equal(value);
          expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
          done();
        }
      })

      setTimeout(() => {
        AutoForm.setFieldValue(fieldName, value, formId);
      }, 50);
    });
  });
  describe('setFormValues', function () {
    it ("forwards the value to FormData", function () {
      const value = Random.id();
      let expected;
      stub(AutoForm.reactiveFormData, 'sourceDoc', () => {
        expected = value;
      });
      AutoForm.setFormValues({})
      expect(expected).to.equal(value);
    });
  });
  describe('getInputTypeTemplateNameForElement', function () {
    it ("returns the name of the template used to render the element.", function () {
      const view = { name: 'Template.root' };
      const child1 = { name: 'child1', parentView: view };
      const child2 = { name: 'child2', parentView: child1 };
      const child3 = { name: 'child3', originalParentView: child2 };
      stub(Blaze, 'getView', () => child2);
      expect(AutoForm.getInputTypeTemplateNameForElement()).to.equal('root')
    });
  });
  describe('getInputValue', function () {
    it ("returns null, if field has a \"data-null-value\" attribute", function () {
      const dataContext = {};
      const fieldName = Random.id();
      const field = {
        attr: name => {
          if (name === "data-schema-key") return fieldName;
          if (name === "data-null-value") return "1";
          throw new UnexpectedCallError();
        }
      };

      stub(jQuery.fn, 'init', () => field);
      stub(Blaze, 'getData', () => dataContext);
      stub(AutoForm, 'getInputTypeTemplateNameForElement', () => 'Template.input');
      AutoForm._inputTypeDefinitions['Template.input'] = {};
      expect(AutoForm.getInputValue()).to.equal(null);
    });
    it ("otherwise  get the field's value using the input type's `valueOut` function if provided", function () {
      const value = Random.id();
      const fieldName = Random.id();
      const field = {
        attr: name => {
          if (name === "data-schema-key") return fieldName;
          if (name === "data-null-value") return undefined;
          throw new UnexpectedCallError();
        }
      };

      stub(jQuery.fn, 'init', () => field);
      stub(Blaze, 'getData', () => ({}));
      stub(AutoForm, 'getInputTypeTemplateNameForElement', () => 'Template.input');
      AutoForm._inputTypeDefinitions['Template.input'] = {
        template: 'Template.input',
        valueOut () {
          return value
        }
      };
      expect(AutoForm.getInputValue()).to.equal(value);
    });
    it ("otherwise  therwise get the field's value in a default way", function () {
      const value = Random.id();
      const fieldName = Random.id();
      const field = {
        attr: name => {
          if (name === "data-schema-key") return fieldName;
          if (name === "data-null-value") return undefined;
          throw new UnexpectedCallError();
        },
        val: () => value
      };

      stub(jQuery.fn, 'init', () => field);
      stub(Blaze, 'getData', () => ({}));
      stub(AutoForm, 'getInputTypeTemplateNameForElement', () => 'Template.input');
      AutoForm._inputTypeDefinitions['Template.input'] = {};
      expect(AutoForm.getInputValue()).to.equal(value);
    });
    it ("runs through input's type converter if provided", function () {
      const value = Random.id();
      const fieldType = Random.id();
      const fieldName = Random.id();
      const schema = {
        getQuickTypeForKey: () => fieldType
      };
      const field = {
        attr: name => {
          if (name === "data-schema-key") return fieldName;
          if (name === "data-null-value") return undefined;
          throw new UnexpectedCallError();
        },
        val: () => Random.id()
      };

      stub(jQuery.fn, 'init', () => field);
      stub(Blaze, 'getData', () => ({}));
      stub(AutoForm, 'getInputTypeTemplateNameForElement', () => 'Template.input');
      AutoForm._inputTypeDefinitions['Template.input'] = {
        template: 'Template.input',
        valueConverters: {
          [fieldType]: () => value
        }
      };
      expect(AutoForm.getInputValue(undefined, schema)).to.equal(value);
    });
  });
  describe('addInputType', function () {
    it ("add custom input components", function () {
      const name = Random.id()
      const def = { id: Random.id() }
      AutoForm.addInputType(name, def)
      expect(AutoForm._inputTypeDefinitions[name]).to.deep.equal(def)
    });
  });
  describe('addFormType', function () {
    it ("add custom form types", function () {
      const name = Random.id()
      const def = { id: Random.id() }
      AutoForm.addFormType(name, def)
      expect(AutoForm._formTypeDefinitions[name]).to.deep.equal(def)
    });
  });
  describe('validateField', function () {
    // it ("returns the result of validateField");
    // TODO how to test this without rwriting all the tests from validation.tests?
  });
  describe('validateForm', function () {
    it ("skips with true if form is currently not rendered", function () {
      let expectCalled = false;
      stub(AutoForm, 'getCurrentDataForForm', () => ({}));
      stub(Utility, 'getFormTypeDef', () => ({}));
      stub(AutoForm, 'getFormValues', () => {
        expectCalled = true;
        return null
      });
      expect(AutoForm.validateForm()).to.equal(true);
      expect(expectCalled).to.equal(true);
    });
    it ("returns a boolean that indicates whether the form is currently valid", function () {
      let expectCalled = false;
      const form = {
        validation: "none"
      };
      const formDef = {
        validateForm: function () {
          expectCalled = true;
          return false;
        }
      };

      stub(AutoForm, 'getCurrentDataForForm', () => form);
      stub(AutoForm, 'getFormValues', () => ({}));
      stub(Utility, 'getFormTypeDef', () => formDef);

      // no validation
      expect(AutoForm.validateForm()).to.equal(true);
      expect(expectCalled).to.equal(false);

      // with ftd validation
      delete form.validation
      expect(AutoForm.validateForm()).to.equal(false);
      expect(expectCalled).to.equal(true);
    });
  });
  describe('getValidationContext', function () {
    it ("returns the current simple schema namedContext if it exists by given formId", function () {
      const context = { id: Random.id() };
      stub(AutoForm, 'getCurrentDataForForm', () => ({
        _resolvedSchema: {
          namedContext: function () {
            return context
          }
        }
      }));
      expect(AutoForm.getValidationContext()).to.deep.equal(context)
    });
    it ("returns undefined if there is no schema for a given formId", function () {
      stub(AutoForm, 'getCurrentDataForForm', () => ({}));
      expect(AutoForm.getValidationContext()).to.equal(undefined)
    });
  });
  describe('findAttribute', function () {
    it ("Searches for the given attribute", function () {

    });
  });
  describe('findAttributesWithPrefix', function () {
    it ("returns an empty Object, if there is no AutoForm found", function () {
      const view = { name: 'Template.any'};

      stub(Blaze, 'currentView', view);
      stub(Blaze, 'getData', () => ({}));
      expect(AutoForm.findAttributesWithPrefix(Random.id())).to.deep.equal({});
    });
    it ("returns an empty Object, if there is no AutoForm with prefix found", function () {
      const view = { name: 'Template.autoForm'};
      const suffix = Random.id();
      const prefix = Random.id();
      const viewData = {
        atts: {
          [`${Random.id()}-${suffix}`]: { prefix: suffix }
        }
      };
      stub(Blaze, 'currentView', view);
      stub(Blaze, 'getData', () => viewData);
      expect(AutoForm.findAttributesWithPrefix(prefix)).to.deep.equal({});
    });
    it ("Searches for attributes that start with the given prefix", function () {
      const view = { name: 'Template.autoForm'};
      const prefix = Random.id();
      const suffix = Random.id();
      const viewData = {
        atts: {
          [`${prefix}-${suffix}`]: { prefix: suffix }
        }
      };
      stub(Blaze, 'currentView', view);
      stub(Blaze, 'getData', () => viewData);
      expect(AutoForm.findAttributesWithPrefix(prefix)).to.deep.equal({
        [`-${suffix}`]: { prefix: suffix }
      });
    });
    it ("is looking up the parent context tree until the closest autoform is reached", function () {
      const view = {
        name: 'Template.any',
        parentView: {
          name: 'with',
          parentView: {
            name: 'Template.autoForm'
          }
        }
      };
      let exec = false;
      const prefix = Random.id();
      const suffix = Random.id();
      const viewData = {
        atts: {
          [`${prefix}-${suffix}`]: { prefix: suffix }
        }
      };
      stub(Blaze, 'currentView', view);
      stub(Blaze, 'getData', ({ name }) => {
        if (name === 'Template.autoForm') {
          exec = true
        }
        return viewData
      });
      expect(AutoForm.findAttributesWithPrefix(prefix)).to.deep.equal({
        [`-${suffix}`]: { prefix: suffix }
      });
      expect(exec).to.equal(true);
    });
  });
  describe('debug', function () {
    it ("activates debugging", function () {
      AutoForm.debug();
      expect(AutoForm._debug).to.equal(true);
      expect(Hooks.global.onError[0]).to.be.a('function');
    });
  });
  describe('getInputType', function () {
    it ("returns type attribute, if found", function () {
      const atts = {
        type: Random.id()
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      expect(AutoForm.getInputType()).to.equal(atts.type);
    });
    it ("otherwise returns 'text' if not schema found", function () {
      const atts = {};
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => {});
      expect(AutoForm.getInputType()).to.equal('text');
    });
    it ("otherwise returns 'select-checkbox' if conditions apply", function () {
      const atts = {
        options: [],
        noselect: true,
        name: Random.id()
      };
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          return {
            endsWith: () => {
              exec = true;
              return true
            }
          }
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("select-checkbox");
    });
    it ("otherwise returns 'select-radio' if conditions apply", function () {
      const atts = {
        options: [],
        noselect: true,
        name: Random.id()
      };
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          return {
            endsWith: () => {
              exec = true;
              return false // !expectsArray
            }
          }
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("select-radio");
    });
    it ("otherwise returns 'select-multiple' if conditions apply", function () {
      const atts = {
        options: [],
        noselect: false,
        name: Random.id()
      };
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          return {
            endsWith: () => {
              exec = true;
              return true // expectsArray
            }
          }
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("select-multiple");
    });
    it ("otherwise returns 'select' if conditions apply", function () {
      const atts = {
        options: [],
        noselect: false,
        name: Random.id()
      };
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          return {
            endsWith: () => {
              exec = true;
              return false // !expectsArray
            }
          }
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("select");
    });
    it ("otherwise returns 'textarea' if conditions apply", function () {
      const atts = {
        noselect: false,
        name: Random.id(),
        rows: 8
      };
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          exec = true;
          return "string"
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("textarea");
    });
    it ("otherwise returns 'number' if conditions apply", function () {
      const atts = {};
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          exec = true;
          return "number"
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("number");
    });
    it ("otherwise returns 'date' if conditions apply", function () {
      const atts = {};
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          exec = true;
          return "date"
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("date");
    });
    it ("otherwise returns 'boolean-checkbox' if conditions apply", function () {
      const atts = {};
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          exec = true;
          return "boolean"
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("boolean-checkbox");
    });
    it ("otherwise returns 'text' if no other conditions apply", function () {
      const atts = {};
      let exec = false;
      const schema = {
        getQuickTypeForKey: name => {
          expect(name).to.equal(atts.name);
          exec = true;
          return Random.id()
        },
      };
      stub(Utility, 'getComponentContext', () => ({ atts }));
      stub(AutoForm, 'getFormSchema', () => schema);

      const type = AutoForm.getInputType();
      expect(exec).to.equal(true);
      expect(type).to.equal("text");
    });
  });
  describe('getSchemaForField', function () {
    it ("returns undefined if there is no schema for the form", function () {
      stub(AutoForm, 'getFormSchema', () => {});
      expect(AutoForm.getSchemaForField()).to.equal(undefined);
    });
    it ("returns the field definitions based on the schema used by the closest containing autoForm", function () {
      const value = Random.id();
      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(Utility, 'getFieldDefinition', () => value);
      expect(AutoForm.getSchemaForField()).to.equal(value);
    });
  });
  describe('_getOptionsForField', function () {
    it ("returns undefined if no schema is found",function () {
      stub(AutoForm, 'getFormSchema', () => undefined);
      stub(Utility, 'getFieldDefinition', () => {
        throw new UnexpectedCallError()
      });
      expect(AutoForm._getOptionsForField()).to.equal(undefined);
      expect(AutoForm._getOptionsForField(Random.id())).to.equal(undefined);
    });
    it ("returns undefined if there is no def for the schema found", function () {
      let exec = false;
      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(Utility, 'getFieldDefinition', () => {
        exec = true;
      });
      expect(AutoForm._getOptionsForField(Random.id())).to.equal(undefined);
      expect(exec).to.equal(true);
    });
    it ("returns undefined if the schema has no options and no allowedValues", function () {
      let exec = false;
      const schema = {
        getAllowedValuesForKey: function () {
          exec = true;
        }
      }
      stub(AutoForm, 'getFormSchema', () => schema);
      stub(Utility, 'getFieldDefinition', () => {
        return {};
      });

      expect(AutoForm._getOptionsForField(Random.id())).to.equal(undefined);
      expect(exec).to.equal(true);
    });
    it ("returns the select options for a field", function () {
      const options = [Random.id()];
      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(Utility, 'getFieldDefinition', () => {
        return {
          autoform: { options }
        };
      });
      expect(AutoForm._getOptionsForField(Random.id())).to.equal(options);

      // afFieldInput
      overrideStub(Utility, 'getFieldDefinition', () => {
        return {
          autoform: {
            afFieldInput: { options }
          }
        };
      });
      expect(AutoForm._getOptionsForField(Random.id())).to.equal(options);

      // afQuickField
      overrideStub(Utility, 'getFieldDefinition', () => {
        return {
          autoform: {
            afQuickField: { options }
          }
        };
      });
      expect(AutoForm._getOptionsForField(Random.id())).to.equal(options);
    });
    it ("returns the allowed values for a field if no options are given", function () {
      const options = [Random.id()];
      const schema = {
        getAllowedValuesForKey: () => options
      }
      stub(AutoForm, 'getFormSchema', () => schema);
      stub(Utility, 'getFieldDefinition', () => {
        return {};
      });

      expect(AutoForm._getOptionsForField(Random.id())).to.equal("allowed");
    });
  });
  describe('getLabelForField', function () {
    // TODO it ("returns undefined if there is no schema for the current form");
    it ("field definitions based on the schema used by the closest containing autoForm", function () {
      const value = Random.id();
      const schema = {
        label: () => value
      };
      stub(AutoForm, 'getFormSchema', () => schema)
      expect(AutoForm.getLabelForField()).to.equal(value);
    });
  });
  describe('templateInstanceForForm', function () {
    it ("returns undefined if there is no view for the current form", function () {
      stub(AutoForm, 'viewForForm', () => {});
      expect(AutoForm.templateInstanceForForm()).to.equal(undefined);
    });
    it ("returns the template instance for the form", function () {
      const value = Random.id();
      const view = {
        templateInstance: () => value
      };
      stub(AutoForm, 'viewForForm', () => view);
      expect(AutoForm.templateInstanceForForm()).to.equal(value);
    });
  });
  describe('viewForForm', function () {
    it ("returns undefined if there is no form found by formId", function () {
      stub(document, 'getElementById', () => undefined);
      expect(AutoForm.viewForForm()).to.equal(undefined);
      expect(AutoForm.viewForForm(Random.id())).to.equal(undefined);
    });
    it ("returns the view for the form", function () {
      const view = {
        name: 'Template.autoForm'
      }
      stub(document, 'getElementById', () => ({}));
      stub(Blaze, 'getView', () => view);

      expect(AutoForm.viewForForm()).to.equal(view);
    });
  });
  describe('getArrayCountFromDocForField', function () {
    it ("returns undefined if the doc does not exist", function () {
      stub(AutoForm.reactiveFormData, 'sourceDoc', () => {});
      expect(AutoForm.getArrayCountFromDocForField()).to.equal(undefined);
      expect(AutoForm.getArrayCountFromDocForField(Random.id())).to.equal(undefined);
    });
    it ("returns undefined if the field does not exist", function () {
      const mDoc = new MongoObject({});
      stub(AutoForm.reactiveFormData, 'sourceDoc', () => mDoc);
      expect(AutoForm.getArrayCountFromDocForField()).to.equal(undefined);
      expect(AutoForm.getArrayCountFromDocForField(Random.id())).to.equal(undefined);
    });
    it ("returns undefined if the field exist but is not an Array", function () {
      const fieldName = Random.id();
      const mDoc = new MongoObject({
        [fieldName]: Random.id() // is String, not Array
      });
      stub(AutoForm.reactiveFormData, 'sourceDoc', () => mDoc);
      expect(AutoForm.getArrayCountFromDocForField()).to.equal(undefined);
      expect(AutoForm.getArrayCountFromDocForField(Random.id())).to.equal(undefined);
    });
    it ("returns length of the Array field", function () {
      const fieldName = Random.id();
      const obj = {
        [fieldName]: []
      };
      const expectedCount = Math.floor(Math.random() * 100);
      obj[fieldName].length = expectedCount;
      obj[fieldName].fill(1);

      const mDoc = new MongoObject(obj);
      stub(AutoForm.reactiveFormData, 'sourceDoc', () => mDoc);
      expect(AutoForm.getArrayCountFromDocForField(Random.id(), fieldName)).to.equal(expectedCount);
    });
  });
  describe('parseData', function () {
    it ("keeps already set defaults", function () {
      const form = {
        type: "insert",
        validation: 'blur',
        _resolvedSchema: {}
      };
      const expectedForm = { ...form };
      expect(AutoForm.parseData(form)).to.equal(form);
      expect(AutoForm.parseData(form)).to.deep.equal(expectedForm);
    });
    it ("adds a default type", function () {
      const form = {
        validation: 'blur',
        _resolvedSchema: {}
      };
      const expectedForm = { ...form };
      expectedForm.type = "normal";

      expect(AutoForm.parseData(form)).to.equal(form);
      expect(AutoForm.parseData(form)).to.deep.equal(expectedForm);
    });
    it ("adds a default validation", function () {
      const form = {
        type: "insert",
        _resolvedSchema: {}
      };
      const expectedForm = { ...form };
      expectedForm.validation = "submitThenKeyup";

      expect(AutoForm.parseData(form)).to.equal(form);
      expect(AutoForm.parseData(form)).to.deep.equal(expectedForm);
    });
    it ("adds a resolved schema from schema lookup", function () {
      const form = {
        type: "insert",
        validation: 'blur',
        schema: {}
      };
      const schemaValue = Random.id();
      const expectedForm = { ...form };
      expectedForm._resolvedSchema = schemaValue;

      stub(Utility, 'lookup', () => schemaValue);
      stub(Utility, 'getFormTypeDef', () => ({}));

      expect(AutoForm.parseData(form)).to.equal(form);
      expect(AutoForm.parseData(form)).to.deep.equal(expectedForm);
    });
    it ("adds an adjusted schema from schema lookup", function () {
      const form = {
        type: "insert",
        validation: 'blur',
        schema: {}
      };
      const schemaValue = Random.id();
      const adjustedValue = Random.id();
      const expectedForm = { ...form };
      expectedForm._resolvedSchema = adjustedValue;

      stub(Utility, 'lookup', () => schemaValue);
      stub(Utility, 'getFormTypeDef', () => ({
        adjustSchema: () => adjustedValue
      }));

      expect(AutoForm.parseData(form)).to.equal(form);
      expect(AutoForm.parseData(form)).to.deep.equal(expectedForm);
    });
    it ("adds a schema from collection lookup", function () {
      const form = {
        type: "insert",
        validation: 'blur',
        collection: Random.id()
      };
      const schemaValue = Random.id();
      const collection = {
        simpleSchema: function () {
          return schemaValue
        }
      };
      const expectedForm = { ...form };
      expectedForm._resolvedSchema = schemaValue;

      stub(Utility, 'lookup', () => collection);
      stub(Utility, 'getFormTypeDef', () => ({}));

      expect(AutoForm.parseData(form)).to.equal(form);
      expect(AutoForm.parseData(form)).to.deep.equal(expectedForm);
    });
  });
  describe('getCurrentDataForForm', function () {
    it ("returns undefined if there is no view or data", function () {
      const view = {};
      const data = { _resolvedSchema: {} };

      stub(AutoForm, "viewForForm", () => undefined);
      stub(Blaze, "getData", () => {
        throw new UnexpectedCallError()
      });
      expect(AutoForm.getCurrentDataForForm()).to.equal(undefined);

      overrideStub(AutoForm, 'viewForForm', () => view);
      overrideStub(Blaze, 'getData', () => undefined);
      expect(AutoForm.getCurrentDataForForm()).to.equal(undefined);
    });
    it ("Returns the current data context for a form", function () {
      const view = {};
      const data = { _resolvedSchema: {} };

      stub(AutoForm, "viewForForm", () => view);
      stub(Blaze, "getData", () => data);

      expect(AutoForm.getCurrentDataForForm()).to.deep.equal({
        type: "normal",
        _resolvedSchema: {},
        validation: "submitThenKeyup"
      });
    });
  });
  describe('getCurrentDataPlusExtrasForForm', function () {
    it ("returns the current data context for a form plus some extra properties", function () {
      const data = {};
      const formTypeDef = Random.id();
      stub(Utility, 'getFormTypeDef', () => formTypeDef);
      stub(AutoForm, 'getCurrentDataForForm', () => data);
      expect(AutoForm.getCurrentDataPlusExtrasForForm()).to.deep.equal({
        formTypeDef: formTypeDef
      });
    });
  });
  describe('getFormCollection', function () {
    it ("returns the collection for a form from the `collection` attribute", function () {
      const value = Random.id();
      stub(AutoForm, 'getCurrentDataForForm', () => ({}));
      stub(Utility, 'lookup', () => value);
      expect(AutoForm.getFormCollection()).to.equal(value);
    });
  });
  describe('getFormSchema', function () {
    it ("gets the schema for a form, from the `schema` attribute", function () {
      const data = {
        _resolvedSchema: { foo: Random.id() }
      };
      stub(AutoForm, 'getCurrentDataForForm', () => data);
      expect(AutoForm.getFormSchema()).to.deep.equal(data._resolvedSchema);
    });
    it ("uses the data from the form, if not yet rendered", function () {
      const form = {
        _resolvedSchema: { foo: Random.id() }
      };
      stub(AutoForm, 'getCurrentDataForForm', () => {
        throw new UnexpectedCallError()
      });
      expect(AutoForm.getFormSchema(undefined, form)).to.deep.equal(form._resolvedSchema);
    })
  });
  describe('getFormId', function () {
    it ("returns the current formId", function () {
      const id = Random.id();
      stub(AutoForm, 'getCurrentDataForForm', () => ({ id }))
      expect(AutoForm.getFormId()).to.equal(id);
    });
  });
  describe('selectFirstInvalidField', function () {
    it ("skips if not invalid", function () {
      const ctx = {
        isValid: () => true,
        keyIsInvalid: () => false
      };
      const schema = {
        namedContext: () => ctx
      };
      const template = {
        data: {
          id: Random.id()
        },
        $: function () {
          return {
            filter: function () {
              return {
                not: function () {
                  return {
                    // TODO test internal logic, too
                    each: function () {
                      throw new UnexpectedCallError()
                    }
                  }
                }
              }
            },
          }
        }
      };

      stub(AutoForm, 'templateInstanceForForm', () => template);
      AutoForm.selectFirstInvalidField(Random.id(), schema);
    });
    it ("Selects the focus the first field (in DOM order) with an error", function () {
      const ctx = {
        isValid: () => false,
        keyIsInvalid: () => false
      };
      const schema = {
        namedContext: () => ctx
      };
      let exec = false;
      const template = {
        data: {
          id: Random.id()
        },
        $: function () {
          return {
            filter: function () {
              return {
                not: function () {
                  return {
                    // TODO test internal logic, too
                    each: function () {
                      exec = true;
                    }
                  }
                }
              }
            },
          }
        }
      };

      stub(AutoForm, 'templateInstanceForForm', () => template);
      AutoForm.selectFirstInvalidField(Random.id(), schema);
      expect(exec).to.equal(true);
    });
  });
  describe('addStickyValidationError', function () {
    it ("adds validation errors to their respective inputs", function () {
      const template = {
        _stickyErrors: {}
      };
      const key = Random.id();
      const type = Random.id();
      const value = Random.id();
      stub(AutoForm, 'templateInstanceForForm', () => template);
      stub(Utility, 'checkTemplate', () => false); // skip check

      AutoForm.addStickyValidationError(Random.id(), key, type, value);
      expect(template._stickyErrors).to.deep.equal({
        [key]: { type, value }
      });
    });
  });
  describe('removeStickyValidationError', function () {
    it ("removes validation errors from their respective inputs", function () {
      const key = Random.id();
      const type = Random.id();
      const value = Random.id();
      const template = {
        _stickyErrors: {
          [key]: {value, type }
        }
      };
      stub(AutoForm, 'templateInstanceForForm', () => template);
      stub(Utility, 'checkTemplate', () => false); // skip check

      AutoForm.removeStickyValidationError(Random.id(), key);
      expect(template._stickyErrors).to.deep.equal({});
    });
  });
  describe('_validateFormDoc', function () {
    it ("provides a generic validation for a given key", function () {
      const doc = { foo: Random.id() };
      const isModifier = false;
      const formId = Random.id();
      const form = {};
      const key = Random.id();
      const userId = Random.id();
      const schema = {
        clean: function () {},
        namedContext: () => ({
          validate: () => {
            exec = true;
            return true
          }
        })
      };
      const template = {
        _stickyErrors: {}
      };
      let exec = false;

      stub(AutoForm, 'templateInstanceForForm', () => template);
      // no key = not valid
      expect(AutoForm._validateFormDoc(doc, isModifier, formId, schema, form, key)).to.equal(true);
      expect(template._stickyErrors).to.deep.equal({});
      expect(exec).to.equal(true);
    });
    it ("provides a generic validation for a gven form", function () {
      const doc = { foo: Random.id() };
      const isModifier = false;
      const formId = Random.id();
      const form = {};
      const userId = Random.id();
      const schema = {
        clean: function () {},
        namedContext: () => ({
          validate: () => {
            exec = true;
            return true
          }
        })
      };
      const template = {
        _stickyErrors: {}
      };
      let exec = false;

      stub(AutoForm, 'templateInstanceForForm', () => template);
      // no key = not valid
      expect(AutoForm._validateFormDoc(doc, isModifier, formId, schema, form)).to.equal(true);
      expect(template._stickyErrors).to.deep.equal({});
      expect(exec).to.equal(true);
    });
  });
  describe('rerunWhenFormRenderedOrDestroyed/triggerFormRenderedDestroyedReruns', function () {
    it ("reactively triggers waiting forms", function (done) {
      const formId = Random.id();
      let count = 0;

      // register
      AutoForm.rerunWhenFormRenderedOrDestroyed(formId);
      Tracker.autorun(() => {
        AutoForm.rerunWhenFormRenderedOrDestroyed(formId);
        count++;
        if (count === 2) done();
      });

      AutoForm.triggerFormRenderedDestroyedReruns(formId);
    });
  });
});
