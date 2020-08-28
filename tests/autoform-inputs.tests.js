import { Random } from 'meteor/random'
import { expect } from 'chai'
import { stub, restoreAll } from './test-utils.tests';
import {
  getAllFieldsInForm,
  getFlatDocOfFieldValues,
  getInputData,
  getInputValue,
  markChanged,
  updateAllTrackedFieldValues,
  updateTrackedFieldValue
} from '../autoform-inputs';
import { Utility } from '../utility'

describe('inputs', function () {
  afterEach(function () {
    restoreAll();
  });

  describe(getFlatDocOfFieldValues.name, function () {
    it ("returns a document with all fields and their respective values", function () {
      const fieldValue = Random.id();
      const fieldName = Random.id();

      stub(AutoForm, 'getInputValue', function () {
        return fieldValue
      });

      const fields = {
        each: function (cb) {
          [{ 'data-schema-key': fieldName }].forEach(entry => cb.call(entry))
        }
      };
      const doc = getFlatDocOfFieldValues(fields);
      expect(doc).to.deep.equal({ [fieldName]: fieldValue })
    });
  });

  describe(getInputValue.name, function () {
    let typeDefs;

    beforeEach(function () {
      typeDefs = {};
    });

    it ("Gets the value that should be shown/selected in the input", function () {
      const expected = Random.id();
      const value = getInputValue(undefined, expected, undefined, undefined, undefined, {});
      expect(value).to.equal(expected);
    });
    it ("Makes the value an array if it is expected to be an Array but is actually not", function () {
      const id = Random.id();
      const value = getInputValue(undefined, id, undefined, undefined, undefined, { valueIsArray: true });
      expect(value).to.deep.equal([id]);
    });
    it ("Uses the field default value if there is no current document", function () {
      const expected = Random.id()
      const mDoc = {
        getInfoForKey: function () {
          return undefined;
        }
      }

      // uses field default if mDoc returns nothing
      expect(getInputValue({}, undefined, mDoc, undefined, expected, {})).to.equal(expected);

      mDoc.getInfoForKey = () => ({ value: expected });

      // use mDOc value if defined
      expect(getInputValue({}, undefined, mDoc, undefined, undefined, {})).to.equal(expected);

      // no mdoc at all
      expect(getInputValue({}, undefined, undefined, undefined, expected, {})).to.equal(expected);
    });
    it ("Uses the schema default value if there is no current document and no field default", function () {
      const expected = Random.id();
      const value = getInputValue({}, undefined, undefined, expected, undefined, {});
      expect(value).to.equal(expected);
    });
    it ("Uses an empty string as default for undefined or null values", function () {
      const value = getInputValue({}, undefined, undefined, undefined, undefined, {});
      expect(value).to.equal("");
    });
    it ("Optionally transforms using valueIn", function () {
      const expected = Random.id();
      const value = getInputValue({}, undefined, undefined, undefined, undefined, {
        valueIn: () => expected
      });
      expect(value).to.equal(expected);
    });
  });
  describe(getInputData.name, function () {
    it ("Builds the data context that the input component will have for string values", function () {
      const defs = {
        type: String,
        optional: false,
        min: 10,
        max: 100
      };
      const atts = { name: Random.id() };
      const value = Random.id();
      const label = Random.id();
      const formType = Random.id();
      const selectOptions = Random.id();

      stub(Utility, 'getSelectOptions', () => selectOptions);
      stub(Utility, 'getFormTypeDef', () => ({}));

      expect(getInputData(defs, atts, value, label, formType)).to.deep.equal({
        name: atts.name,
        schemaType: defs.type,
        min: defs.min,
        max: defs.max,
        value: value,
        atts: {
          name: atts.name,
          'data-schema-key': atts.name,
          required: ""
        },
        selectOptions: selectOptions,
      });

      // with different / extra properties
      defs.optional = true;
      atts.placeholder = "schemaLabel";
      atts.data = { foo: Random.id() };

      expect(getInputData(defs, atts, value, label, formType)).to.deep.equal({
        name: atts.name,
        schemaType: defs.type,
        min: defs.min,
        max: defs.max,
        value: value,
        atts: {
          name: atts.name,
          'data-schema-key': atts.name,
          placeholder: label
        },
        foo: atts.data.foo,
        selectOptions: selectOptions,
      });
    });
    it ("handles boolean props in a standarized way", function () {
      const defs = {
        type: String,
        optional: false,
        min: 10,
        max: 100
      };
      const atts = {
        name: Random.id(),
        disabled: true,    // will be ""
        readonly: "true",  // will be ""
        checked: "",       // will be ""
        required: false,   // will be removed
        autofocus: null    // will be removed
      };
      const value = Random.id();
      const label = Random.id();
      const formType = Random.id();

      stub(Utility, 'getSelectOptions', () => undefined);
      stub(Utility, 'getFormTypeDef', () => ({}));

      expect(getInputData(defs, atts, value, label, formType)).to.deep.equal({
        name: atts.name,
        schemaType: defs.type,
        min: defs.min,
        max: defs.max,
        value: value,
        atts: {
          name: atts.name,
          'data-schema-key': atts.name,
          disabled: "",
          readonly: "",
          checked: ""
        },
        selectOptions: undefined,
      });
    });
    it ("can be transformend by the formType.adjustInputContext", function () {
      const defs = {
        type: String,
        optional: false,
        min: 10,
        max: 100
      };
      const atts = { name: Random.id() };
      const value = Random.id();
      const label = Random.id();
      const formType = Random.id();
      const selectOptions = Random.id();

      stub(Utility, 'getSelectOptions', () => selectOptions);
      stub(Utility, 'getFormTypeDef', () => ({
        adjustInputContext (ctx) {
          ctx.bar = 'baz';
          return ctx;
        }
      }));

      expect(getInputData(defs, atts, value, label, formType)).to.deep.equal({
        name: atts.name,
        schemaType: defs.type,
        min: defs.min,
        max: defs.max,
        value: value,
        atts: {
          name: atts.name,
          'data-schema-key': atts.name,
          required: ""
        },
        selectOptions: selectOptions,
        bar: 'baz'
      });
    });
  });
  describe('markChanged', function () {
    let template, fieldName, fieldValue;

    beforeEach(function () {
      fieldValue = Random.id();
      fieldName = Random.id();
      template = {
        view: {
          name: Random.id(),
          _domrange: {},
          isDestroyed: false
        },
        formValues: {}
      }
    });

    it ("skips if the fieldValue is already cached", function (done) {
      const { ...expectedTemplate } = template;
      template.formValues[fieldName] = { cachedValue: fieldValue };
      markChanged(template, fieldName, fieldValue);
      setTimeout(() => {
        // template remains untouched
        expect(template).to.deep.equal(expectedTemplate);
        done();
      }, 160);
    });
    it ("skips if the fieldValue is undefined", function (done) {
      const { ...expectedTemplate } = template;
      fieldValue = undefined;
      markChanged(template, fieldName, fieldValue);
      setTimeout(() => {
        // template remains untouched
        expect(template).to.deep.equal(expectedTemplate);
        done();
      }, 160);
    });
    it ("marks the current template.formValues by fieldName as changed", function (done) {
      markChanged(template, fieldName, fieldValue);
      setTimeout(() => {
        expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
        done();
      }, 160);
    });
    it ("adds a Tracker.Dependency to the template.formValues if yet undefined by given fieldName", function (done) {
      markChanged(template, fieldName, fieldValue);
      setTimeout(() => {
        expect(template.formValues[fieldName]._dependentsById).to.deep.equal({});
        done();
      }, 160);
    });
    it ("recursively re-runs until template is rendererd", function (done) {
      delete template.view._domrange;

      markChanged(template, fieldName, fieldValue);
      expect(template.formValues[fieldName]).to.equal(undefined);

      setTimeout(() => {
        expect(template.formValues[fieldName]).to.equal(undefined);
        template.view._domrange = {};

        setTimeout(() => {
          expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
          done();
        }, 160);
      }, 160);
    });
    it ("array fields: marks ancestors as changed, if any exist", function (done) {
      const partA = Random.id();
      const partB = Random.id();
      fieldName = `${partA}.${partB}`;

      markChanged(template, fieldName, fieldValue);
      setTimeout(() => {
        expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
        expect(template.formValues[partA].isMarkedChanged).to.equal(true);
        done();
      }, 160);
    });
    it ("runs reactively", function (done) {
      template.formValues[fieldName] = new Tracker.Dependency();
      const hasChanged = function () {
        template.formValues[fieldName].depend();
        return template.formValues[fieldName].isMarkedChanged;
      };

      Tracker.autorun(() => {
        if (hasChanged()) {
          done();
        }
      });

      markChanged(template, fieldName, fieldValue);
    });
  });
  describe(updateTrackedFieldValue.name, function () {
    let template, fieldName, fieldValue;

    beforeEach(function () {
      fieldValue = Random.id();
      fieldName = Random.id();
      template = {
        view: {
          name: Random.id(),
          _domrange: {},
          isDestroyed: false
        }
      }
    });
    it ("skips if no template is given", function (done) {
      const { ...expectedTemplate } = template;
      updateTrackedFieldValue();
      setTimeout(() => {
        // template remains untouched
        expect(template).to.deep.equal(expectedTemplate);
        done();
      }, 160);
    });
    it ("creates initial formValues entries for the given template", function (done) {
      updateTrackedFieldValue(template, fieldName, fieldValue);
      setTimeout(() => {
        expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
        done();
      }, 160);
    });
  });
  describe(updateAllTrackedFieldValues.name, function () {
    let template;

    beforeEach(function () {
      template = {
        view: {
          name: Random.id(),
          _domrange: {},
          isDestroyed: false
        }
      }
    });

    it ("updates all field values on a template\'s formValues Object", function (done) {
      const names = [Random.id(), Random.id(), Random.id()];
      template.formValues = {};
      names.forEach(fieldName => {
        template.formValues[fieldName] = new Tracker.Dependency();
        template.formValues[fieldName].isMarkedChanged = false;
      });

      updateAllTrackedFieldValues(template);
      setTimeout(() => {
        names.forEach(fieldName => {
          expect(template.formValues[fieldName].isMarkedChanged).to.equal(true);
        });
        done();
      }, 600);
    });
  });
  describe(getAllFieldsInForm.name, function () {
    it ("Get all elements with `data-schema-key` attribute, unless disabled", function () {
      const form = {
        id: Random.id(),
      };
      const template = {
        data: { id: form.id },
        $: function () {
          return {
            filter: function () {
              return {
                values: [{ id: form.id, disabled: true }],
                not: function () {
                  return []
                }
              }
            },
          }
        }
      };

      // we are only testing execution logic and avoid stubbing jQuery here as it's a real pain
      // if there are issues with this function we either need to write complex tests, that cover
      // the jQuery functionality, too or we completely rethink the getAllFieldsInForm method's approach
      expect(getAllFieldsInForm(template)).to.deep.equal([])
      expect(getAllFieldsInForm(template, true).values).to.deep.equal([{ id: form.id, disabled: true }])
    });
  });
});
