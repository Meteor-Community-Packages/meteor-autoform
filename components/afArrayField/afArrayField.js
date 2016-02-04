/* global AutoForm, arrayTracker */

Template.afArrayField.helpers({
  getTemplateName: function () {
    return AutoForm.getTemplateName('afArrayField', this.template, this.name);
  },
  innerContext: function afArrayFieldContext() {
    var c = AutoForm.Utility.getComponentContext(this, "afArrayField");

    this.enableSorting = !! c.atts.enableSorting;

    var name = c.atts.name;
    var fieldMinCount = c.atts.minCount || 0;
    var fieldMaxCount = c.atts.maxCount || Infinity;
    var ss = AutoForm.getFormSchema();
    var formId = AutoForm.getFormId();

    // Init the array tracking for this field
    var docCount = AutoForm.getArrayCountFromDocForField(formId, name);
    if (docCount === undefined) {
      docCount = c.atts.initialCount;
    }
    arrayTracker.initField(formId, name, ss, docCount, fieldMinCount, fieldMaxCount);

    return {
      atts: c.atts
    };
  }
});

Template.afArrayField.rendered = function() {
  var self = this;

  function onSortUpdate() {
    var arrayItems = self.findAll(".autoform-array-item");
    _.each(arrayItems, function(arrayItem, i) {
      function fixPosition(el) {
        var dataSchemaKey = $(el).attr("data-schema-key");

        if (! dataSchemaKey) return;
        var schemaFields = dataSchemaKey.split('.');

        var mainField = schemaFields[0];
        var subField = schemaFields[2];

        dataSchemaKey = mainField + '.' + i + '.' + subField;

        $(el).attr("data-schema-key", dataSchemaKey);
        $(el).attr("name", dataSchemaKey);
      }

      _.each($(arrayItem).find("input"), fixPosition);
      _.each($(arrayItem).find("select"), fixPosition);
    });
  }

  if (!! this.data.enableSorting) {
    var listGroup = $(this.find(".list-group"));

    if (! listGroup.sortable) {
      throw new Error("Sortable arrays require jQuery UI");
    }

    listGroup.sortable({
      handle: ".autoform-drag-item",
      cancel: ".autoform-add-item-wrap",
      update: onSortUpdate
    });
  }
};
