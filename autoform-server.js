Meteor.methods({
    _autoFormCheckFirst: function(method, objName, doc) {
        var obj = global[objName];
        if (!obj) {
            throw new Error("No object exists on the server with that name.");
        }
        checkSchema(doc, obj.simpleSchema());
        return Meteor.call(method, doc);
    }
});