Package.describe({
  name: "aldeed:autoform",
  summary:
    "Easily create forms with automatic insert and update, and automatic reactive validation.",
  git: "https://github.com/aldeed/meteor-autoform.git",
  version: "7.0.0",
});

Package.onUse(function (api) {
  api.versionsFrom("METEOR@1.3");

  // Dependencies
  api.use(
    [
      "livedata",
      "deps",
      "templating",
      "ui",
      "blaze",
      "ejson",
      "reactive-var",
      "reactive-dict",
      "random",
      "ecmascript",
      "mongo",
      "momentjs:moment@2.10.6",
    ],
    "client"
  );

  api.use("jquery@1.11.10 || 3.0.0", "client");

  api.use(
    [
      "mrt:moment-timezone@0.2.1",
      "aldeed:collection2-core@2.0.0",
      "aldeed:collection2@3.0.0",
      "aldeed:moment-timezone@0.4.0",
      "reload",
    ],
    "client",
    { weak: true }
  );

  // Exports
  api.export("AutoForm", "client");

  // we now support dynamic imports but we need to keep it backwards compatible
  // se we use them only if the respective environment flag is a truthy value
  if (process.env.AUTOFORM_DYNAMIC_IMPORTS) {
    api.addFiles('dynamic-main.js', 'client')
  } else {
    // Client Files
    api.addFiles(
      [
        // utilities and general init
        "utility.js",
        "form-preserve.js",
        "autoform-hooks.js",
        "autoform-formdata.js",
        "autoform-arrays.js",
        "autoform.js",
        // global helpers
        "autoform-helpers.js",
        // validation
        "autoform-validation.js",
        // inputs
        "autoform-inputs.js",
        // public API
        "autoform-api.js",
        // form types
        "formTypes/insert.js",
        "formTypes/update.js",
        "formTypes/update-pushArray.js",
        "formTypes/method.js",
        "formTypes/method-update.js",
        "formTypes/normal.js",
        "formTypes/readonly.js",
        "formTypes/disabled.js",
        // input types
        "inputTypes/value-converters.js",
        "inputTypes/boolean-checkbox/boolean-checkbox.html",
        "inputTypes/boolean-checkbox/boolean-checkbox.js",
        "inputTypes/boolean-radios/boolean-radios.html",
        "inputTypes/boolean-radios/boolean-radios.js",
        "inputTypes/boolean-select/boolean-select.html",
        "inputTypes/boolean-select/boolean-select.js",
        "inputTypes/button/button.html",
        "inputTypes/button/button.js",
        "inputTypes/color/color.html",
        "inputTypes/color/color.js",
        "inputTypes/contenteditable/contenteditable.html",
        "inputTypes/contenteditable/contenteditable.js",
        "inputTypes/date/date.html",
        "inputTypes/date/date.js",
        "inputTypes/datetime/datetime.html",
        "inputTypes/datetime/datetime.js",
        "inputTypes/datetime-local/datetime-local.html",
        "inputTypes/datetime-local/datetime-local.js",
        "inputTypes/email/email.html",
        "inputTypes/email/email.js",
        "inputTypes/file/file.html",
        "inputTypes/file/file.js",
        "inputTypes/hidden/hidden.html",
        "inputTypes/hidden/hidden.js",
        "inputTypes/image/image.html",
        "inputTypes/image/image.js",
        "inputTypes/month/month.html",
        "inputTypes/month/month.js",
        "inputTypes/number/number.html",
        "inputTypes/number/number.js",
        "inputTypes/password/password.html",
        "inputTypes/password/password.js",
        "inputTypes/radio/radio.html",
        "inputTypes/radio/radio.js",
        "inputTypes/range/range.html",
        "inputTypes/range/range.js",
        "inputTypes/reset/reset.html",
        "inputTypes/reset/reset.js",
        "inputTypes/search/search.html",
        "inputTypes/search/search.js",
        "inputTypes/select/select.html",
        "inputTypes/select/select.js",
        "inputTypes/select-checkbox/select-checkbox.html",
        "inputTypes/select-checkbox/select-checkbox.js",
        "inputTypes/select-checkbox-inline/select-checkbox-inline.html",
        "inputTypes/select-checkbox-inline/select-checkbox-inline.js",
        "inputTypes/select-multiple/select-multiple.html",
        "inputTypes/select-multiple/select-multiple.js",
        "inputTypes/select-radio/select-radio.html",
        "inputTypes/select-radio/select-radio.js",
        "inputTypes/select-radio-inline/select-radio-inline.html",
        "inputTypes/select-radio-inline/select-radio-inline.js",
        "inputTypes/submit/submit.html",
        "inputTypes/submit/submit.js",
        "inputTypes/tel/tel.html",
        "inputTypes/tel/tel.js",
        "inputTypes/text/text.html",
        "inputTypes/text/text.js",
        "inputTypes/textarea/textarea.html",
        "inputTypes/textarea/textarea.js",
        "inputTypes/time/time.html",
        "inputTypes/time/time.js",
        "inputTypes/url/url.html",
        "inputTypes/url/url.js",
        "inputTypes/week/week.html",
        "inputTypes/week/week.js",
        // components that render a form
        "components/autoForm/autoForm.html",
        "components/autoForm/autoForm.js",
        "components/quickForm/quickForm.html",
        "components/quickForm/quickForm.js",
        // components that render controls within a form
        "components/afArrayField/afArrayField.html",
        "components/afArrayField/afArrayField.js",
        "components/afEachArrayItem/afEachArrayItem.html",
        "components/afEachArrayItem/afEachArrayItem.js",
        "components/afFieldInput/afFieldInput.html",
        "components/afFieldInput/afFieldInput.js",
        "components/afFormGroup/afFormGroup.html",
        "components/afFormGroup/afFormGroup.js",
        "components/afObjectField/afObjectField.html",
        "components/afObjectField/afObjectField.js",
        "components/afQuickField/afQuickField.html",
        "components/afQuickField/afQuickField.js",
        "components/afQuickFields/afQuickFields.html",
        "components/afQuickFields/afQuickFields.js",
        // event handling
        "autoform-events.js",
      ],
      "client"
    );
  }
});

Package.onTest(function (api) {
  // Running the tests requires a dummy project in order to
  // resolve npm dependencies and the test env dependencies.
  // To setup local tests enter the following in your console:
  // $  meteor create --bare testdummy
  // $ cd testdummmy
  // $ meteor npm install --save-dev puppeteer simpl-schema chai sinon
  // $ METEOR_PACKAGE_DIRS="../" TEST_BROWSER_DRIVER=puppeteer TEST_WATCH=1 TEST_SERVER=0 meteor test-packages --raw-logs --driver-package meteortesting:mocha ../
  api.use(["meteortesting:browser-tests", "meteortesting:mocha"]);

  api.use(
    [
      "ecmascript",
      "tracker",
      "blaze",
      "templating",
      "mongo",
      "momentjs:moment",
      "aldeed:autoform",
    ],
    "client"
  );

  // api.addFiles(["tests/utility-tests.js", "tests/autoform-tests.js"]);
  api.mainModule("tests/testSuite.tests.js", "client");
});
