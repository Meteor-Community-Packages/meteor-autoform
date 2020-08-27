/* global Utility */
import { Random } from 'meteor/random';
import { expect } from 'chai';
import MongoObject from 'mongo-object';
import { stub, restoreAll, restore, overrideStub } from './test-utils.tests'
import  { Utility } from '../utility'

describe('Utility', function () {
  afterEach(function () {
    restoreAll();
  });

  it('cleanNulls', function () {
    const date = new Date();
    const oid = new Mongo.Collection.ObjectID();
    const cleaned = Utility.cleanNulls({
      a: void 0,
      b: undefined,
      c: null,
      d: "",
      e: "keep me",
      f: {
        a: void 0,
        b: undefined,
        c: null,
        d: "",
        e: "keep me"
      },
      g: {
        a: null
      },
      h: {
        a: date,
        b: oid
      }
    });

    expect(cleaned).to.deep.equal({e: "keep me", f: {e: "keep me"}, h: { a: date, b: oid }})
  })
  it('reportNulls', function () {
    const report = Utility.reportNulls({
      a: void 0,
      b: undefined,
      c: null,
      d: "",
      e: "keep me"
    });
    expect(report).to.deep.equal({
      a: "",
      b: "",
      c: "",
      d: ""
    });
  })
  it('docToModifier', function () {
    const date = new Date();
    let testObj;
    let mod;

    testObj = {
      a: 1,
      b: "foo",
      c: date,
      d: {
        a: 1,
        b: "foo",
        c: date,
        d: [
          {
            a: 1,
            b: "foo",
            c: date,
            d: {
              a: 1,
              b: "foo",
              c: date,
              d: null // make sure that null, empty, etc. don't end up in $unset when under an array
            }
          }
        ],
        e: [1, 2]
      },
      e: null,
      f: "",
      g: void 0 //undefined props are removed
    };

    // Test 1 w/ keepArrays, w/ keepEmptyStrings
    mod = Utility.docToModifier(testObj, {keepArrays: true, keepEmptyStrings: true});
    expect(mod).to.deep.equal({
      $set: {
        a: 1,
        b: "foo",
        c: date,
        'd.a': 1,
        'd.b': "foo",
        'd.c': date,
        'd.d': [ //array of objects should remain array
          {
            a: 1,
            b: "foo",
            c: date,
            d: {
              a: 1,
              b: "foo",
              c: date
              // null should have been removed, too
            }
          }
        ],
        'd.e': [1, 2], //array of non-objects should remain array
        f: "" // empty string should be set rather than unset
      },
      $unset: {
        e: ""
      }
    });

    // Test 2 w/ keepArrays, w/o keepEmptyStrings
    mod = Utility.docToModifier(testObj, {keepArrays: true, keepEmptyStrings: false});
    expect(mod).to.deep.equal({
      $set: {
        a: 1,
        b: "foo",
        c: date,
        'd.a': 1,
        'd.b': "foo",
        'd.c': date,
        'd.d': [ //array of objects should remain array
          {
            a: 1,
            b: "foo",
            c: date,
            d: {
              a: 1,
              b: "foo",
              c: date
              // null should have been removed, too
            }
          }
        ],
        'd.e': [1, 2] //array of non-objects should remain array
      },
      $unset: {
        e: "",
        f: ""
      }
    });

    // Test 3 w/o keepArrays, w/ keepEmptyStrings
    mod = Utility.docToModifier(testObj, {keepArrays: false, keepEmptyStrings: true});
    expect(mod).to.deep.equal({
      $set: {
        a: 1,
        b: "foo",
        c: date,
        'd.a': 1,
        'd.b': "foo",
        'd.c': date,
        'd.d.0.a': 1,
        'd.d.0.b': "foo",
        'd.d.0.c': date,
        'd.d.0.d.a': 1,
        'd.d.0.d.b': "foo",
        'd.d.0.d.c': date,
        'd.e.0': 1,
        'd.e.1': 2,
        f: ""
      },
      $unset: {
        'd.d.0.d.d': "",
        e: ""
      }
    });

    // Test 4 w/o keepArrays, w/o keepEmptyStrings
    mod = Utility.docToModifier(testObj, {keepArrays: false, keepEmptyStrings: false});
    expect(mod).to.deep.equal({
      $set: {
        a: 1,
        b: "foo",
        c: date,
        'd.a': 1,
        'd.b': "foo",
        'd.c': date,
        'd.d.0.a': 1,
        'd.d.0.b': "foo",
        'd.d.0.c': date,
        'd.d.0.d.a': 1,
        'd.d.0.d.b': "foo",
        'd.d.0.d.c': date,
        'd.e.0': 1,
        'd.e.1': 2
      },
      $unset: {
        'd.d.0.d.d': "",
        e: "",
        f: ""
      }
    });
  })
  it('stringToNumber', function () {
    function testMaybeNum(val, expected) {
      const mod = AutoForm.valueConverters.stringToNumber(val);
      expect(mod).to.deep.equal(expected);
    }

    testMaybeNum(1, 1);
    testMaybeNum(1.1, 1.1);
    testMaybeNum("1", 1);
    testMaybeNum("1.1", 1.1);
    testMaybeNum("foo", "foo");

    const d = new Date();
    testMaybeNum(d, d);
    testMaybeNum(true, true);
    testMaybeNum(false, false);
    testMaybeNum({}, {});
  })
  it('expandObj', function () {
    function testExpandObj(val, expected) {
      const mod = Utility.expandObj(val);
      expect(JSON.stringify(mod)).to.equal(JSON.stringify(expected));
    }

    testExpandObj({}, {});
    testExpandObj({foo: "bar"}, {foo: "bar"});
    testExpandObj({foo: "bar", baz: 1}, {foo: "bar", baz: 1});
    testExpandObj({
      'foo.bar': "baz",
      baz: 1
    }, {
      foo: {bar: "baz"},
      baz: 1
    });
    testExpandObj({
      'foo.bar.0': "foo",
      'foo.bar.1': "baz",
      baz: 1
    }, {
      foo: {bar: ["foo", "baz"]},
      baz: 1
    });
    testExpandObj({
      'foo.bar.1': "baz",
      baz: 1
    }, {
      foo: {bar: [null, "baz"]},
      baz: 1
    });
    testExpandObj({
      'foo.bar.1.bam': "baz",
      baz: 1
    }, {
      foo: {bar: [null, {bam: "baz"}]},
      baz: 1
    });
    testExpandObj({
      'foo.bar.0': null,
      'foo.bar.1.bam': "baz",
      baz: 1
    }, {
      foo: {bar: [null, {bam: "baz"}]},
      baz: 1
    });
    testExpandObj({
      'foo.bar.0': "baz",
      'foo.bar.1.bam': "baz",
      baz: 1
    }, {
      foo: {bar: ["baz", {bam: "baz"}]},
      baz: 1
    });
    testExpandObj({
      'foo.bar.0': "baz",
      'foo.bar.1.bam': "baz",
      'foo.bar.1.boo': "foo",
      baz: 1
    }, {
      foo: {bar: ["baz", {bam: "baz", boo: "foo"}]},
      baz: 1
    });
    testExpandObj({
      'foo.0': null,
      'foo.1.bar': "baz",
      baz: 1
    }, {
      foo: [null, {bar: "baz"}],
      baz: 1
    });
    testExpandObj({
      'foo.0': null,
      'foo.1.bar': null,
      baz: 1
    }, {
      foo: [null, {bar: null}],
      baz: 1
    });
  })

  const startOfDayUTC = moment.utc("0001-3-14", "YYYY-MM-DD").toDate();
  const endOfDayUTC = moment.utc("0001-3-14 23:59:59", "YYYY-MM-DD HH:mm:ss").toDate();

  it('dateToDateString', function () {
    // There's no way to set the timezone for Javascript's Date object, so
    // we check what the current timezone is.
    const tzOffset = new Date().getTimezoneOffset();
    if(tzOffset > 0) {
      expect(AutoForm.valueConverters.dateToDateString(startOfDayUTC)).to.equal("0001-03-13");
    } else if(tzOffset < 0) {
      expect(AutoForm.valueConverters.dateToDateString(endOfDayUTC)).to.equal("0001-03-15");
    } else {
      expect(AutoForm.valueConverters.dateToDateString(startOfDayUTC)).to.equal("0001-03-14");
      expect(AutoForm.valueConverters.dateToDateString(endOfDayUTC)).to.equal("0001-03-14");
    }
  })
  it('dateToDateStringUTC', function () {
    expect(AutoForm.valueConverters.dateToDateStringUTC(startOfDayUTC)).to.equal("0001-03-14");
    expect(AutoForm.valueConverters.dateToDateStringUTC(endOfDayUTC)).to.equal("0001-03-14");
  });
  it ("getSelectValues", function () {
    const select = {
      options: [{
        selected: true,
        value: Random.id()
      }, {
        value: Random.id()
      }, {
        selected: true,
        text: Random.id()
      }]
    };
    expect(Utility.getSelectValues(select)).to.deep.equal([
      select.options[0].value,
      select.options[2].text
    ]);
  });
  it ("getSelectOptions", function () {
    const defs = {
      type: String
    };

    const hash = {
      options: {
        foo: Random.id(),
        bar: Random.id()
      }
    };

    const selectOptions = Utility.getSelectOptions(defs, hash);
    expect(selectOptions).to.deep.equal([
      { value: 'foo', label: hash.options.foo },
      { value: 'bar', label: hash.options.bar },
    ]);

    // using allowed values
    defs.allowedValues = ['foo', 'baz'];
    hash.options = 'allowed';
    expect(Utility.getSelectOptions(defs, hash)).to.deep.equal([
      { value: 'foo', label: 'foo' },
      { value: 'baz', label: 'baz' },
    ]);
  });
  it ("lookup", function () {
    expect(Utility.lookup()).to.equal(undefined);
    expect(Utility.lookup(null)).to.equal(null);

    const o = {};
    expect(Utility.lookup(o)).to.equal(o);

    const id = Random.id();
    expect(() => Utility.lookup(id)).to.throw(`${id} is not in the window scope`);
    expect(Utility.lookup('Package')).to.equal(Package);
  });
  it ("getFieldDefinition", function () {
    const schema = {};
    const name = Random.id();
    const field = {
      type: String,
      optional: true,
      min: 1,
      max: -1
    };
    schema[name] = field;
    schema.getDefinition = name => schema[name];

    expect(Utility.getFieldDefinition(schema)).to.equal(undefined);
    expect(Utility.getFieldDefinition(schema, null)).to.equal(undefined);
    expect(Utility.getFieldDefinition(schema, Random.id())).to.equal(undefined);
    expect(Utility.getFieldDefinition(schema, name)).to.deep.equal(field);
  });
  it ("objAffectsKey", function () {
    const id = Random.id();
    stub(MongoObject.prototype, 'affectsKey', () => id);
    expect(Utility.objAffectsKey({})).to.equal(id);
  });
  it ("expandObj", function () {
    const id = Random.id();
    const flatDoc = { 'foo.bar.baz': id, other: id };
    expect(Utility.expandObj(flatDoc)).to.deep.equal({
      foo: {
        bar: {
          baz: id
        }
      },
      other: id
    });

    const flatDocWithArray = { 'foo.0.bar.0.baz': id, other: id };
    expect(Utility.expandObj(flatDocWithArray)).to.deep.equal({
      foo: [{
        bar: [{
          baz: id
        }]
      }],
      other: id
    });
  });
  it ("compactArrays", function () {
    const id = Random.id();
    const obj = { foo: [{ bar: id, some: [null] }, { baz: [{id, some: [undefined] }]}, undefined], id  };
    Utility.compactArrays(obj);
    expect(obj).to.deep.equal({
      foo: [{ bar: id, some: [] }, { baz: [{id, some: [] }]}], id
    });
  });
  it ("bubbleEmpty", function () {
    const obj = {
      foo: {
        bar: null,
        baz: undefined,
        some: ''
      }
    };
    Utility.bubbleEmpty(obj);
    expect(obj).to.deep.equal({
      foo: null
    });
  });
  it ("isNullUndefinedOrEmptyString", function () {
    expect(Utility.isNullUndefinedOrEmptyString()).to.equal(true);
    expect(Utility.isNullUndefinedOrEmptyString(null)).to.equal(true);
    expect(Utility.isNullUndefinedOrEmptyString(void 0)).to.equal(true);
    expect(Utility.isNullUndefinedOrEmptyString('')).to.equal(true);

    expect(Utility.isNullUndefinedOrEmptyString(' ')).to.equal(false);
    expect(Utility.isNullUndefinedOrEmptyString({})).to.equal(false);
    expect(Utility.isNullUndefinedOrEmptyString([])).to.equal(false);
    expect(Utility.isNullUndefinedOrEmptyString(false)).to.equal(false);
  });
  it ("isValidDateString", function () {
    expect(Utility.isValidDateString("2020-08-27")).to.equal(true, "dateString");
    expect(Utility.isValidDateString("12345-1231-123")).to.equal(false);
    expect(Utility.isValidDateString("")).to.equal(false);
  });
  it ("isValidTimeString", function () {
    expect(Utility.isValidTimeString("00:00")).to.equal(true);
    expect(Utility.isValidTimeString("12:12")).to.equal(true);
    expect(Utility.isValidTimeString("12:12:12")).to.equal(true);
    expect(Utility.isValidTimeString("23:59:59")).to.equal(true);
    expect(Utility.isValidTimeString("23:59:59.999")).to.equal(true);

    expect(Utility.isValidTimeString("00")).to.equal(false);
    expect(Utility.isValidTimeString("")).to.equal(false);
    expect(Utility.isValidTimeString("31:00")).to.equal(false);
    expect(Utility.isValidTimeString("23:60")).to.equal(false);
  });
  it ("isValidNormalizedForcedUtcGlobalDateAndTimeString", function () {
    const d = new Date();
    const dstr = "2020-08-27T12:12:12.999Z";
    expect(Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(d.toUTCString())).to.equal(false);
    expect(Utility.isValidNormalizedForcedUtcGlobalDateAndTimeString(dstr)).to.equal(true);
  });
  it ("isValidNormalizedLocalDateAndTimeString", function () {
    const d = new Date();
    const dstr = "2020-08-27T12:12:12.999";
    expect(Utility.isValidNormalizedLocalDateAndTimeString(d.toLocaleString())).to.equal(false);
    expect(Utility.isValidNormalizedLocalDateAndTimeString(dstr)).to.equal(true);
  });
  it ("getComponentContext", function () {
    const atts = {
      name: Random.id()
    };
    const name = "afFieldInput";
    let hidden = true

    // stubs undefined field def
    const schema = {}
    const def = {
      type: String,
      label: () => 'foo',
      autoform: {
        afFieldInput: {
          type: () => hidden ? 'hidden' : 'text'
        }
      }
    }
    stub(AutoForm, 'getFormSchema', () => schema)
    stub(Utility, 'getFieldDefinition', () => null)
    expect(Utility.getComponentContext(atts, name)).to.equal(undefined)

    // stub existing field def
    overrideStub(Utility, 'getFieldDefinition', () => def)
    stub(AutoForm, 'findAttributesWithPrefix', () => ({ id: atts.name }))

    // hidden flag is true
    expect( Utility.getComponentContext(atts, name)).to.deep.equal({
      atts: {
        name: atts.name,   // ...atts
        id: atts.name,     // ...formComponentAttributes
        type: 'hidden'    // ...fieldAttributes
      },
      defs: def
    });

    // hidden flag is flase
    hidden = false;
    expect( Utility.getComponentContext(atts, name)).to.deep.equal({
      atts: {
        name: atts.name,   // ...atts
        id: atts.name,     // ...formComponentAttributes
        type: 'text'    // ...fieldAttributes
      },
      defs: def
    });
  });
  it ("stringToArray", function () {
    const source = [Random.id()];
    expect(Utility.stringToArray(source)).to.equal(source);

    const id1 = Random.id();
    const id2 = Random.id();
    expect(Utility.stringToArray(`${id1} , ${id2}`)).to.deep.equal([id1, id2]);

    const message = Random.id();
    expect(() => Utility.stringToArray(1, message)).to.throw(message);
  });
  it ("addClass", function () {
    const atts = {};
    Utility.addClass(atts, 'foo');
    expect(atts).to.deep.equal({ class: 'foo' });
    Utility.addClass(atts, 'bar');
    expect(atts).to.deep.equal({ class: 'foo bar' });
  });
  it ("getFormTypeDef", function () {
    const formType = Random.id();
    expect(() => Utility.getFormTypeDef(formType)).to
      .throw(`AutoForm: Form type "${formType}" has not been defined`);

    AutoForm._formTypeDefinitions[formType] = { formType };
    expect(Utility.getFormTypeDef(formType)).to.deep.equal({ formType });
  });
  it ("checkTemplate", function () {
    const template = {
      view: {
        _domrange: {},
        isDestroyed: false
      }
    };
    expect(Utility.checkTemplate()).to.equal(false);
    expect(Utility.checkTemplate({})).to.equal(false);
    expect(Utility.checkTemplate({ view: {}})).to.equal(false);
    expect(Utility.checkTemplate({ view: {
      _domrange: {},
      isDestroyed: true
    }})).to.equal(false);
    expect(Utility.checkTemplate(template)).to.equal(true);
  });
  it ("makeKeyGeneric", function () {
    for (let i = 0; i < 100; i++) {
      const number = Math.floor(Math.random()*i * 100);
      const key = `.${number}`;
      expect(Utility.makeKeyGeneric(key)).to.equal('.$');
    }
  });
  it ("componentTypeList", function () {
    expect(Utility.componentTypeList).to.deep.equal([
      'afArrayField',
      'afEachArrayItem',
      'afFieldInput',
      'afFormGroup',
      'afObjectField',
      'afQuickField',
      'afQuickFields',
      'autoForm',
      'quickForm'
    ]);
  });
})
