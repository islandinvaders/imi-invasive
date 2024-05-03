(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Collection2 = Package['aldeed:collection2'].Collection2;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"aldeed:schema-index":{"server.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/aldeed_schema-index/server.js                                                 //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
let Collection2;
module.link("meteor/aldeed:collection2", {
  default(v) {
    Collection2 = v;
  }
}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 1);
module.link("./common");
Collection2.on("schema.attached", (collection, ss) => {
  function ensureIndex(index, name, unique, sparse) {
    Meteor.startup(() => {
      if (collection._collection.createIndex) {
        collection._collection.createIndex(index, {
          background: true,
          name,
          unique,
          sparse
        });
      } else {
        collection._collection._ensureIndex(index, {
          background: true,
          name,
          unique,
          sparse
        });
      }
    });
  }
  function dropIndex(indexName) {
    Meteor.startup(() => {
      try {
        if (collection._collection.dropIndex) {
          collection._collection.dropIndex(indexName);
        } else {
          collection._collection._dropIndex(indexName);
        }
      } catch (err) {
        // no index with that name, which is what we want
      }
    });
  }
  const propName = ss.version === 2 ? "mergedSchema" : "schema";

  // Loop over fields definitions and ensure collection indexes (server side only)
  const schema = ss[propName]();
  Object.keys(schema).forEach(fieldName => {
    const definition = schema[fieldName];
    if ("index" in definition || definition.unique === true) {
      const index = {};
      // If they specified `unique: true` but not `index`,
      // we assume `index: 1` to set up the unique index in mongo
      let indexValue;
      if ("index" in definition) {
        indexValue = definition.index;
        if (indexValue === true) indexValue = 1;
      } else {
        indexValue = 1;
      }
      const indexName = "c2_".concat(fieldName);
      // In the index object, we want object array keys without the ".$" piece
      const idxFieldName = fieldName.replace(/\.\$\./g, ".");
      index[idxFieldName] = indexValue;
      const unique = !!definition.unique && (indexValue === 1 || indexValue === -1);
      let sparse = definition.sparse || false;

      // If unique and optional, force sparse to prevent errors
      if (!sparse && unique && definition.optional) sparse = true;
      if (indexValue === false) {
        dropIndex(indexName);
      } else {
        ensureIndex(index, indexName, unique, sparse);
      }
    }
  });
});
////////////////////////////////////////////////////////////////////////////////////////////

},"common.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                        //
// packages/aldeed_schema-index/common.js                                                 //
//                                                                                        //
////////////////////////////////////////////////////////////////////////////////////////////
                                                                                          //
let SimpleSchema;
module.link("simpl-schema", {
  default(v) {
    SimpleSchema = v;
  }
}, 0);
let Collection2;
module.link("meteor/aldeed:collection2", {
  default(v) {
    Collection2 = v;
  }
}, 1);
// Extend the schema options allowed by SimpleSchema
SimpleSchema.extendOptions(["index",
// one of Number, String, Boolean
"unique",
// Boolean
"sparse" // Boolean
]);
Collection2.on("schema.attached", (collection, ss) => {
  // Define validation error messages
  if (ss.version >= 2 && ss.messageBox && typeof ss.messageBox.messages === "function") {
    ss.messageBox.messages({
      en: {
        notUnique: "{{label}} must be unique"
      }
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/aldeed:schema-index/server.js");

/* Exports */
Package._define("aldeed:schema-index", exports);

})();

//# sourceURL=meteor://💻app/packages/aldeed_schema-index.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWxkZWVkOnNjaGVtYS1pbmRleC9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FsZGVlZDpzY2hlbWEtaW5kZXgvY29tbW9uLmpzIl0sIm5hbWVzIjpbIkNvbGxlY3Rpb24yIiwibW9kdWxlIiwibGluayIsImRlZmF1bHQiLCJ2IiwiTWV0ZW9yIiwib24iLCJjb2xsZWN0aW9uIiwic3MiLCJlbnN1cmVJbmRleCIsImluZGV4IiwibmFtZSIsInVuaXF1ZSIsInNwYXJzZSIsInN0YXJ0dXAiLCJfY29sbGVjdGlvbiIsImNyZWF0ZUluZGV4IiwiYmFja2dyb3VuZCIsIl9lbnN1cmVJbmRleCIsImRyb3BJbmRleCIsImluZGV4TmFtZSIsIl9kcm9wSW5kZXgiLCJlcnIiLCJwcm9wTmFtZSIsInZlcnNpb24iLCJzY2hlbWEiLCJPYmplY3QiLCJrZXlzIiwiZm9yRWFjaCIsImZpZWxkTmFtZSIsImRlZmluaXRpb24iLCJpbmRleFZhbHVlIiwiY29uY2F0IiwiaWR4RmllbGROYW1lIiwicmVwbGFjZSIsIm9wdGlvbmFsIiwiU2ltcGxlU2NoZW1hIiwiZXh0ZW5kT3B0aW9ucyIsIm1lc3NhZ2VCb3giLCJtZXNzYWdlcyIsImVuIiwibm90VW5pcXVlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJQSxXQUFXO0FBQUNDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLDJCQUEyQixFQUFDO0VBQUNDLE9BQU9BLENBQUNDLENBQUMsRUFBQztJQUFDSixXQUFXLEdBQUNJLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJQyxNQUFNO0FBQUNKLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLGVBQWUsRUFBQztFQUFDRyxNQUFNQSxDQUFDRCxDQUFDLEVBQUM7SUFBQ0MsTUFBTSxHQUFDRCxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUNI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Q0FBQyxNQUFNO1FBQ0xYLFdBQVcsQ0FBQ0MsS0FBSyxFQUFFVSxTQUFTLEVBQUVSLE1BQU0sRUFBRUMsTUFBTSxDQUFDO01BQy9DO0lBQ0Y7RUFDRixDQUFDLENBQUM7QUFDSixDQUFDLENBQUMsQzs7Ozs7Ozs7Ozs7QUM1RUYsSUFBSXVCLFlBQVk7QUFBQ25DLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLGNBQWMsRUFBQztFQUFDQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUM7SUFBQ2dDLFlBQVksR0FBQ2hDLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJSixXQUFXO0FBQUNDLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDLDJCQUEyQixFQUFDO0VBQUNDLE9BQU9BLENBQUNDLENBQUMsRUFBQztJQUFDSixXQUFXLEdBQUNJLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFJbEs7QUFDQWdDLFlBQVksQ0FBQ0MsYUFBYSxDQUFDLENBQ3pCLE9BQU87QUFBRTtBQUNULFFBQVE7QUFBRTtBQUNWLFFBQVEsQ0FBRTtBQUFBLENBQ1gsQ0FBQztBQUVGckMsV0FBVyxDQUFDTSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsQ0FBQ0MsVUFBVSxFQUFFQyxFQUFFLEtBQUs7RUFDcEQ7RUFDQSxJQUNFQSxFQUFFLENBQUNnQixPQUFPLElBQUksQ0FBQyxJQUNmaEIsRUFBRSxDQUFDOEIsVUFBVSxJQUNiLE9BQU85QixFQUFFLENBQUM4QixVQUFVLENBQUNDLFFBQVEsS0FBSyxVQUFVLEVBQzVDO0lBQ0EvQixFQUFFLENBQUM4QixVQUFVLENBQUNDLFFBQVEsQ0FBQztNQUNyQkMsRUFBRSxFQUFFO1FBQ0ZDLFNBQVMsRUFBRTtNQUNiO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7QUFDRixDQUFDLENBQUMsQyIsImZpbGUiOiIvcGFja2FnZXMvYWxkZWVkX3NjaGVtYS1pbmRleC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDb2xsZWN0aW9uMiBmcm9tIFwibWV0ZW9yL2FsZGVlZDpjb2xsZWN0aW9uMlwiO1xuaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSBcIm1ldGVvci9tZXRlb3JcIjtcblxuaW1wb3J0IFwiLi9jb21tb25cIjtcblxuQ29sbGVjdGlvbjIub24oXCJzY2hlbWEuYXR0YWNoZWRcIiwgKGNvbGxlY3Rpb24sIHNzKSA9PiB7XG4gIGZ1bmN0aW9uIGVuc3VyZUluZGV4KGluZGV4LCBuYW1lLCB1bmlxdWUsIHNwYXJzZSkge1xuICAgIE1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgICAgIGlmIChjb2xsZWN0aW9uLl9jb2xsZWN0aW9uLmNyZWF0ZUluZGV4KSB7XG4gICAgICAgIGNvbGxlY3Rpb24uX2NvbGxlY3Rpb24uY3JlYXRlSW5kZXgoaW5kZXgsIHtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiB0cnVlLFxuICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgdW5pcXVlLFxuICAgICAgICAgIHNwYXJzZSxcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb2xsZWN0aW9uLl9jb2xsZWN0aW9uLl9lbnN1cmVJbmRleChpbmRleCwge1xuICAgICAgICAgIGJhY2tncm91bmQ6IHRydWUsXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICB1bmlxdWUsXG4gICAgICAgICAgc3BhcnNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRyb3BJbmRleChpbmRleE5hbWUpIHtcbiAgICBNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoY29sbGVjdGlvbi5fY29sbGVjdGlvbi5kcm9wSW5kZXgpIHtcbiAgICAgICAgICBjb2xsZWN0aW9uLl9jb2xsZWN0aW9uLmRyb3BJbmRleChpbmRleE5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbGxlY3Rpb24uX2NvbGxlY3Rpb24uX2Ryb3BJbmRleChpbmRleE5hbWUpO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgLy8gbm8gaW5kZXggd2l0aCB0aGF0IG5hbWUsIHdoaWNoIGlzIHdoYXQgd2Ugd2FudFxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgY29uc3QgcHJvcE5hbWUgPSBzcy52ZXJzaW9uID09PSAyID8gXCJtZXJnZWRTY2hlbWFcIiA6IFwic2NoZW1hXCI7XG5cbiAgLy8gTG9vcCBvdmVyIGZpZWxkcyBkZWZpbml0aW9ucyBhbmQgZW5zdXJlIGNvbGxlY3Rpb24gaW5kZXhlcyAoc2VydmVyIHNpZGUgb25seSlcbiAgY29uc3Qgc2NoZW1hID0gc3NbcHJvcE5hbWVdKCk7XG4gIE9iamVjdC5rZXlzKHNjaGVtYSkuZm9yRWFjaCgoZmllbGROYW1lKSA9PiB7XG4gICAgY29uc3QgZGVmaW5pdGlvbiA9IHNjaGVtYVtmaWVsZE5hbWVdO1xuICAgIGlmIChcImluZGV4XCIgaW4gZGVmaW5pdGlvbiB8fCBkZWZpbml0aW9uLnVuaXF1ZSA9PT0gdHJ1ZSkge1xuICAgICAgY29uc3QgaW5kZXggPSB7fTtcbiAgICAgIC8vIElmIHRoZXkgc3BlY2lmaWVkIGB1bmlxdWU6IHRydWVgIGJ1dCBub3QgYGluZGV4YCxcbiAgICAgIC8vIHdlIGFzc3VtZSBgaW5kZXg6IDFgIHRvIHNldCB1cCB0aGUgdW5pcXVlIGluZGV4IGluIG1vbmdvXG4gICAgICBsZXQgaW5kZXhWYWx1ZTtcbiAgICAgIGlmIChcImluZGV4XCIgaW4gZGVmaW5pdGlvbikge1xuICAgICAgICBpbmRleFZhbHVlID0gZGVmaW5pdGlvbi5pbmRleDtcbiAgICAgICAgaWYgKGluZGV4VmFsdWUgPT09IHRydWUpIGluZGV4VmFsdWUgPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5kZXhWYWx1ZSA9IDE7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGluZGV4TmFtZSA9IGBjMl8ke2ZpZWxkTmFtZX1gO1xuICAgICAgLy8gSW4gdGhlIGluZGV4IG9iamVjdCwgd2Ugd2FudCBvYmplY3QgYXJyYXkga2V5cyB3aXRob3V0IHRoZSBcIi4kXCIgcGllY2VcbiAgICAgIGNvbnN0IGlkeEZpZWxkTmFtZSA9IGZpZWxkTmFtZS5yZXBsYWNlKC9cXC5cXCRcXC4vZywgXCIuXCIpO1xuICAgICAgaW5kZXhbaWR4RmllbGROYW1lXSA9IGluZGV4VmFsdWU7XG4gICAgICBjb25zdCB1bmlxdWUgPVxuICAgICAgICAhIWRlZmluaXRpb24udW5pcXVlICYmIChpbmRleFZhbHVlID09PSAxIHx8IGluZGV4VmFsdWUgPT09IC0xKTtcbiAgICAgIGxldCBzcGFyc2UgPSBkZWZpbml0aW9uLnNwYXJzZSB8fCBmYWxzZTtcblxuICAgICAgLy8gSWYgdW5pcXVlIGFuZCBvcHRpb25hbCwgZm9yY2Ugc3BhcnNlIHRvIHByZXZlbnQgZXJyb3JzXG4gICAgICBpZiAoIXNwYXJzZSAmJiB1bmlxdWUgJiYgZGVmaW5pdGlvbi5vcHRpb25hbCkgc3BhcnNlID0gdHJ1ZTtcblxuICAgICAgaWYgKGluZGV4VmFsdWUgPT09IGZhbHNlKSB7XG4gICAgICAgIGRyb3BJbmRleChpbmRleE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZW5zdXJlSW5kZXgoaW5kZXgsIGluZGV4TmFtZSwgdW5pcXVlLCBzcGFyc2UpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KTtcbiIsIi8vIGNvbGxlY3Rpb24yIGNoZWNrcyB0byBtYWtlIHN1cmUgdGhhdCBzaW1wbC1zY2hlbWEgcGFja2FnZSBpcyBhZGRlZFxuaW1wb3J0IFNpbXBsZVNjaGVtYSBmcm9tIFwic2ltcGwtc2NoZW1hXCI7XG5pbXBvcnQgQ29sbGVjdGlvbjIgZnJvbSBcIm1ldGVvci9hbGRlZWQ6Y29sbGVjdGlvbjJcIjtcblxuLy8gRXh0ZW5kIHRoZSBzY2hlbWEgb3B0aW9ucyBhbGxvd2VkIGJ5IFNpbXBsZVNjaGVtYVxuU2ltcGxlU2NoZW1hLmV4dGVuZE9wdGlvbnMoW1xuICBcImluZGV4XCIsIC8vIG9uZSBvZiBOdW1iZXIsIFN0cmluZywgQm9vbGVhblxuICBcInVuaXF1ZVwiLCAvLyBCb29sZWFuXG4gIFwic3BhcnNlXCIsIC8vIEJvb2xlYW5cbl0pO1xuXG5Db2xsZWN0aW9uMi5vbihcInNjaGVtYS5hdHRhY2hlZFwiLCAoY29sbGVjdGlvbiwgc3MpID0+IHtcbiAgLy8gRGVmaW5lIHZhbGlkYXRpb24gZXJyb3IgbWVzc2FnZXNcbiAgaWYgKFxuICAgIHNzLnZlcnNpb24gPj0gMiAmJlxuICAgIHNzLm1lc3NhZ2VCb3ggJiZcbiAgICB0eXBlb2Ygc3MubWVzc2FnZUJveC5tZXNzYWdlcyA9PT0gXCJmdW5jdGlvblwiXG4gICkge1xuICAgIHNzLm1lc3NhZ2VCb3gubWVzc2FnZXMoe1xuICAgICAgZW46IHtcbiAgICAgICAgbm90VW5pcXVlOiBcInt7bGFiZWx9fSBtdXN0IGJlIHVuaXF1ZVwiLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxufSk7XG4iXX0=
