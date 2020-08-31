import { Random } from 'meteor/random';
import { expect } from 'chai';
import { overrideStub, restoreAll, stub } from './test-utils.tests'
import {
  afSelectOptionAtts,
  autoFormArrayFieldHasLessThanMaximum,
  autoFormArrayFieldHasMoreThanMinimum, autoFormArrayFieldIsFirstVisible, autoFormArrayFieldIsLastVisible,
  autoFormFieldIsInvalid, autoFormFieldLabelText,
  autoFormFieldMessage, autoFormFieldNames, autoFormFieldValue, autoFormFieldValueContains, autoFormFieldValueIs
} from '../autoform-helpers'
import { ArrayTracker } from '../autoform-arrays'
import { Utility } from '../utility'

describe('helpers', function () {
  let schema, options;

  beforeEach(function () {
    schema = {};
    options = {};
  });

  afterEach(function () {
    restoreAll();
  });

  describe('afFieldMessage', function () {
    it ("gets the current error messsage from schema", function () {
      // pseudo stubbing SimpleSchema functionality
      const message = {};
      const messageObj = { message: Random.id() };
      message.keyErrorMessage = () => messageObj;
      schema.namedContext = () => message;

      stub(AutoForm, 'getFormSchema', () => schema);
      stub(AutoForm, 'getFormId', () => Random.id());
      const msg = autoFormFieldMessage(options);
      expect(msg).to.deep.equal(messageObj);
    });
  });
  describe('afFieldIsInvalid', function () {
    it ("returns, whether the current field is invalid", function () {
      // pseudo stubbing SimpleSchema functionality
      const invalid = Random.id();
      const context = {};
      context.keyIsInvalid = () => invalid;
      schema.namedContext = () => context;

      stub(AutoForm, 'getFormSchema', () => schema);
      stub(AutoForm, 'getFormId', () => Random.id());
      const msg = autoFormFieldIsInvalid(options);
      expect(msg).to.equal(invalid);
    });
  });
  describe('afArrayFieldHasMoreThanMinimum', function () {
    it ("returns false is the current formType has hideArrayItemButtons as a truthy value", function () {
      const def = {
        formTypeDef: {
          hideArrayItemButtons: true
        }
      };

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getCurrentDataPlusExtrasForForm', () => def);

      const msg = autoFormArrayFieldHasMoreThanMinimum(options);
      expect(msg).to.equal(false);
    });
    it ("returns the relation between minCount and visibleCount", function () {
      // pseudo stubbing SimpleSchema functionality
      const def = { formTypeDef: {}};

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getCurrentDataPlusExtrasForForm', () => def);
      stub(ArrayTracker.prototype, 'getMinMax', () => ({ minCount: 2 }));

      stub(ArrayTracker.prototype, 'getVisibleCount', () => 1);
      expect(autoFormArrayFieldHasMoreThanMinimum(options)).to.equal(false);

      overrideStub(ArrayTracker.prototype, 'getVisibleCount', () => 2);
      expect(autoFormArrayFieldHasMoreThanMinimum(options)).to.equal(false);

      overrideStub(ArrayTracker.prototype, 'getVisibleCount', () => 3);
      expect(autoFormArrayFieldHasMoreThanMinimum(options)).to.equal(true);
    });
  });
  describe('afArrayFieldHasLessThanMaximum', function () {
    it ("returns false is the current formType has hideArrayItemButtons as a truthy value", function () {
      const def = {
        formTypeDef: {
          hideArrayItemButtons: true
        }
      };

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getCurrentDataPlusExtrasForForm', () => def);

      const msg = autoFormArrayFieldHasLessThanMaximum(options);
      expect(msg).to.equal(false);
    });
    it ("returns the relation between maxCount and visibleCount", function () {
      // pseudo stubbing SimpleSchema functionality
      const def = { formTypeDef: {}};

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getCurrentDataPlusExtrasForForm', () => def);
      stub(ArrayTracker.prototype, 'getMinMax', () => ({ maxCount: 2 }));

      stub(ArrayTracker.prototype, 'getVisibleCount', () => 3);
      expect(autoFormArrayFieldHasLessThanMaximum(options)).to.equal(false);

      overrideStub(ArrayTracker.prototype, 'getVisibleCount', () => 2);
      expect(autoFormArrayFieldHasLessThanMaximum(options)).to.equal(false);

      overrideStub(ArrayTracker.prototype, 'getVisibleCount', () => 1);
      expect(autoFormArrayFieldHasLessThanMaximum(options)).to.equal(true);
    });
  });
  describe('afFieldValueIs', function () {
    it ("returns whether the current value is explicitly the same as the field value", function () {
      const value = Random.id();

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getFieldValue', () => value);

      expect(autoFormFieldValueIs({})).to.equal(false);
      expect(autoFormFieldValueIs({ hash: { value: Random.id() } })).to.equal(false);
      expect(autoFormFieldValueIs({ hash: { value } })).to.equal(true);
    });
  });
  describe('afFieldValue', function () {
    it ("returns the current field value", function () {
      const value = Random.id();

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getFieldValue', () => value);
      stub(AutoForm, 'getFormId', () => {});

      expect(autoFormFieldValue({})).to.equal(value);
    });
  });
  describe('afArrayFieldIsFirstVisible', function () {
    it ("returns the result of ArrayTracker", function () {
      const value = Random.id();
      stub(ArrayTracker.prototype, 'isFirstFieldlVisible', () => value);
      expect(autoFormArrayFieldIsFirstVisible.call({})).to.equal(value);
    });
  });
  describe('afArrayFieldIsLastVisible', function () {
    it ("returns the result of ArrayTracker", function () {
      const value = Random.id();
      stub(ArrayTracker.prototype, 'isLastFieldlVisible', () => value);
      expect(autoFormArrayFieldIsLastVisible.call({})).to.equal(value);
    });
  });
  describe('afFieldValueContains', function () {
    it ("returns false if the current value is not an Array", function () {
      const value = Random.id();

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getFieldValue', () => value);
      stub(AutoForm, 'getFormId', () => {});

      expect(autoFormFieldValueContains({})).to.equal(false);
      expect(autoFormFieldValueContains({ hash: { value }})).to.equal(false);
    });
    it ("returns whether the current value is an array and the value is in it", function () {
      const value = Random.id();

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getFieldValue', () => []);
      stub(AutoForm, 'getFormId', () => {});

      //expect(autoFormFieldValueContains({})).to.equal(false);
      expect(autoFormFieldValueContains({ hash: { value }})).to.equal(false);

      overrideStub(AutoForm, 'getFieldValue',  () => [value])
      expect(autoFormFieldValueContains({ hash: { value }})).to.equal(true);
    });
    it ("returns whether the current value is an array and one of values is in it", function () {
      const value = Random.id();

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getFieldValue', () => [value]);
      stub(AutoForm, 'getFormId', () => {});

      //expect(autoFormFieldValueContains({})).to.equal(false);
      expect(autoFormFieldValueContains({ hash: { values: `${Random.id()},${Random.id()}` }})).to.deep.equal([]);
      expect(autoFormFieldValueContains({ hash: { values: `${Random.id()},${value},${Random.id()}` }})).to.deep.equal([value]);
    });
  });
  describe('afFieldLabelText', function () {
    it ("returns the current label for the field", function () {
      const label = Random.id();

      stub(AutoForm, 'getFormSchema', () => ({}));
      stub(AutoForm, 'getLabelForField', () => label);

      expect(autoFormFieldLabelText({})).to.equal(label)
    });
  });
  describe('afFieldNames', function () {
    // TODO needs more test coverage for all the options and branchings
    it ("returns all field names for a given form, defined by the schema", function () {
      const atts = { hash: {
          fields: 'foo,bar,baz.$'
        }
      };
      const form = {};
      const schema = {};
      const def = { type: String };

      stub(AutoForm, 'getFormSchema', () => schema);
      stub(AutoForm, 'getCurrentDataForForm', () => form);
      stub(Utility, 'makeKeyGeneric', name => name);
      stub(AutoForm, 'findAttribute', () => false);
      stub(Utility, 'getFieldDefinition', () => def);

      expect(autoFormFieldNames(atts)).to.deep.equal([{ name: 'foo' }, { name: 'bar' }])
    });
  });
  describe('afSelectOptionAtts', function () {
    it ("return the current select option HTML attributes", function () {
      expect(afSelectOptionAtts.call({})).to.deep.equal({});
      expect(afSelectOptionAtts.call({ value: 'foo' })).to.deep.equal({ value: 'foo' });
      expect(afSelectOptionAtts.call({ value: false })).to.deep.equal({ value: 'false' });
      expect(afSelectOptionAtts.call({ selected: true })).to.deep.equal({ selected: '' });
      expect(afSelectOptionAtts.call({ htmlAtts: { foo: 'bar', bar: 'baz' } })).to.deep.equal({ foo: 'bar', bar: 'baz' });
    });
  });
});
