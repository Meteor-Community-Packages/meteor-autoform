/* global Utility */
import { expect } from 'chai'

describe('Utility', function () {
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
  })
})
