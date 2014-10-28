if (Meteor.isClient) {

  Tinytest.add('AutoForm - Utility - cleanNulls', function(test) {
    var date = new Date, oid = new Mongo.Collection.ObjectID;

    var cleaned = Utility.cleanNulls({
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
    test.equal(cleaned, {e: "keep me", f: {e: "keep me"}, h: { a: date, b: oid }});
  });

  Tinytest.add('AutoForm - Utility - reportNulls', function(test) {
    var report = Utility.reportNulls({
      a: void 0,
      b: undefined,
      c: null,
      d: "",
      e: "keep me"
    });
    test.equal(report, {
      a: "",
      b: "",
      c: "",
      d: ""
    });
  });

  Tinytest.add('AutoForm - Utility - docToModifier', function(test) {
    var date = new Date;
    var mod = Utility.docToModifier({
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
    });
    test.equal(mod, {
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
  });

  Tinytest.add('AutoForm - Utility - stringToNumber', function(test) {
    function testMaybeNum(val, expect) {
      var mod = Utility.stringToNumber(val);
      test.equal(mod, expect);
    }

    testMaybeNum(1, 1);
    testMaybeNum(1.1, 1.1);
    testMaybeNum("1", 1);
    testMaybeNum("1.1", 1.1);
    testMaybeNum("foo", "foo");
    var d = new Date;
    testMaybeNum(d, d);
    testMaybeNum(true, true);
    testMaybeNum(false, false);
    testMaybeNum({}, {});
  });

  Tinytest.add('AutoForm - Utility - expandObj', function(test) {
    function testExpandObj(val, expect) {
      var mod = Utility.expandObj(val);
      test.equal(JSON.stringify(mod), JSON.stringify(expect));
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
  });

}

//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equalactual, expected, message, not
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)
