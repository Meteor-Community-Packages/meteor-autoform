if (Meteor.isClient) {

  Tinytest.add('AutoForm - Utility - cleanNulls', function(test) {
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
      }
    });
    test.equal(cleaned, {e: "keep me", f: {e: "keep me"}});
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
            d: {a: 1}
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
            d: {a: 1}
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

  Tinytest.add('AutoForm - Utility - maybeNum', function(test) {
    function testMaybeNum(val, expect) {
      var mod = Utility.maybeNum(val);
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
