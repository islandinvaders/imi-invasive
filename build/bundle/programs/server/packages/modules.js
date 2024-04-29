(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package['modules-runtime'].meteorInstall;
var verifyErrors = Package['modules-runtime'].verifyErrors;

var require = meteorInstall({"node_modules":{"meteor":{"modules":{"server.js":function module(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/server.js                                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
require("./install-packages.js");
require("./process.js");
require("./reify.js");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"install-packages.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/install-packages.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function install(name, mainModule) {
  var meteorDir = {};

  // Given a package name <name>, install a stub module in the
  // /node_modules/meteor directory called <name>.js, so that
  // require.resolve("meteor/<name>") will always return
  // /node_modules/meteor/<name>.js instead of something like
  // /node_modules/meteor/<name>/index.js, in the rare but possible event
  // that the package contains a file called index.js (#6590).

  if (typeof mainModule === "string") {
    // Set up an alias from /node_modules/meteor/<package>.js to the main
    // module, e.g. meteor/<package>/index.js.
    meteorDir[name + ".js"] = mainModule;
  } else {
    // back compat with old Meteor packages
    meteorDir[name + ".js"] = function (r, e, module) {
      module.exports = Package[name];
    };
  }

  meteorInstall({
    node_modules: {
      meteor: meteorDir
    }
  });
}

// This file will be modified during computeJsOutputFilesMap to include
// install(<name>) calls for every Meteor package.

install("meteor");
install("meteor-base");
install("mobile-experience");
install("npm-mongo");
install("ecmascript-runtime");
install("modules-runtime");
install("modules", "meteor/modules/server.js");
install("modern-browsers", "meteor/modern-browsers/modern.js");
install("es5-shim");
install("promise", "meteor/promise/server.js");
install("ecmascript-runtime-client", "meteor/ecmascript-runtime-client/versions.js");
install("ecmascript-runtime-server", "meteor/ecmascript-runtime-server/runtime.js");
install("babel-compiler");
install("react-fast-refresh");
install("ecmascript");
install("babel-runtime", "meteor/babel-runtime/babel-runtime.js");
install("fetch", "meteor/fetch/server.js");
install("inter-process-messaging", "meteor/inter-process-messaging/inter-process-messaging.js");
install("dynamic-import", "meteor/dynamic-import/server.js");
install("base64", "meteor/base64/base64.js");
install("ejson", "meteor/ejson/ejson.js");
install("diff-sequence", "meteor/diff-sequence/diff.js");
install("geojson-utils", "meteor/geojson-utils/main.js");
install("id-map", "meteor/id-map/id-map.js");
install("random", "meteor/random/main_server.js");
install("mongo-id", "meteor/mongo-id/id.js");
install("ordered-dict", "meteor/ordered-dict/ordered_dict.js");
install("tracker");
install("mongo-decimal", "meteor/mongo-decimal/decimal.js");
install("minimongo", "meteor/minimongo/minimongo_server.js");
install("check", "meteor/check/match.js");
install("retry", "meteor/retry/retry.js");
install("callback-hook", "meteor/callback-hook/hook.js");
install("ddp-common");
install("reload");
install("socket-stream-client", "meteor/socket-stream-client/node.js");
install("ddp-client", "meteor/ddp-client/server/server.js");
install("underscore");
install("rate-limit", "meteor/rate-limit/rate-limit.js");
install("ddp-rate-limiter", "meteor/ddp-rate-limiter/ddp-rate-limiter.js");
install("typescript");
install("logging", "meteor/logging/logging.js");
install("routepolicy", "meteor/routepolicy/main.js");
install("boilerplate-generator", "meteor/boilerplate-generator/generator.js");
install("webapp-hashing");
install("webapp", "meteor/webapp/webapp_server.js");
install("ddp-server");
install("ddp");
install("allow-deny");
install("binary-heap", "meteor/binary-heap/binary-heap.js");
install("insecure");
install("mongo");
install("reactive-var");
install("minifier-css", "meteor/minifier-css/minifier.js");
install("standard-minifier-css");
install("standard-minifier-js");
install("shell-server", "meteor/shell-server/main.js");
install("static-html");
install("react-meteor-data", "meteor/react-meteor-data/index.js");
install("url", "meteor/url/server.js");
install("accounts-base", "meteor/accounts-base/server_main.js");
install("sha");
install("email", "meteor/email/email.js");
install("accounts-password");
install("zodern:types");
install("alanning:roles");
install("raix:eventemitter");
install("tmeasday:check-npm-versions", "meteor/tmeasday:check-npm-versions/check-npm-versions.ts");
install("aldeed:collection2", "meteor/aldeed:collection2/collection2.js");
install("aldeed:schema-index", "meteor/aldeed:schema-index/server.js");
install("montiapm:meteorx");
install("zodern:meteor-package-versions");
install("montiapm:agent");
install("zodern:hide-production-sourcemaps");
install("dev-error-overlay");
install("hot-code-push");
install("launch-screen");
install("autoupdate", "meteor/autoupdate/autoupdate_server.js");

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"process.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/process.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
if (! global.process) {
  try {
    // The application can run `npm install process` to provide its own
    // process stub; otherwise this module will provide a partial stub.
    global.process = require("process");
  } catch (missing) {
    global.process = {};
  }
}

var proc = global.process;

if (Meteor.isServer) {
  // Make require("process") work on the server in all versions of Node.
  meteorInstall({
    node_modules: {
      "process.js": function (r, e, module) {
        module.exports = proc;
      }
    }
  });
} else {
  proc.platform = "browser";
  proc.nextTick = proc.nextTick || Meteor._setImmediate;
}

if (typeof proc.env !== "object") {
  proc.env = {};
}

var hasOwn = Object.prototype.hasOwnProperty;
for (var key in meteorEnv) {
  if (hasOwn.call(meteorEnv, key)) {
    proc.env[key] = meteorEnv[key];
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"reify.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/modules/reify.js                                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
require("@meteorjs/reify/lib/runtime").enable(
  module.constructor.prototype
);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"@meteorjs":{"reify":{"lib":{"runtime":{"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/modules/node_modules/@meteorjs/reify/lib/runtime/index.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});
meteorInstall({"node_modules":{"simpl-schema":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/package.json                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "simpl-schema",
  "version": "3.4.6",
  "main": "./dist/cjs/main.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"cjs":{"main.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/main.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationContext = exports.toJsonSchema = exports.schemaDefinitionOptions = void 0;
require("./clean.js");
const SimpleSchema_js_1 = require("./SimpleSchema.js");
Object.defineProperty(exports, "schemaDefinitionOptions", { enumerable: true, get: function () { return SimpleSchema_js_1.schemaDefinitionOptions; } });
Object.defineProperty(exports, "ValidationContext", { enumerable: true, get: function () { return SimpleSchema_js_1.ValidationContext; } });
const toJsonSchema_js_1 = require("./toJsonSchema.js");
Object.defineProperty(exports, "toJsonSchema", { enumerable: true, get: function () { return toJsonSchema_js_1.toJsonSchema; } });
SimpleSchema_js_1.SimpleSchema.ValidationContext = SimpleSchema_js_1.ValidationContext;
exports.default = SimpleSchema_js_1.SimpleSchema;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clean.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/clean.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const mongo_object_1 = __importDefault(require("mongo-object"));
const convertToProperType_js_1 = __importDefault(require("./clean/convertToProperType.js"));
const setAutoValues_js_1 = __importDefault(require("./clean/setAutoValues.js"));
const SimpleSchema_js_1 = require("./SimpleSchema.js");
const index_js_1 = require("./utility/index.js");
const index_js_2 = require("./validation/typeValidator/index.js");
const operatorsToIgnoreValue = ['$unset', '$currentDate'];
function log(message) {
    if (SimpleSchema_js_1.SimpleSchema.debug === true) {
        console.debug(message);
    }
}
/**
 * Cleans a document or modifier object. By default, will filter, automatically
 * type convert where possible, and inject automatic/default values. Use the options
 * to skip one or more of these.
 *
 * @param ss A SimpleSchema instance
 * @param doc Document or modifier to clean. Referenced object will be modified in place.
 * @param options Clean options
 * @returns The modified doc.
 */
function clean(ss, doc, options = {}) {
    var _a;
    // By default, doc will be filtered and auto-converted
    const cleanOptions = Object.assign(Object.assign({ isModifier: (0, index_js_1.looksLikeModifier)(doc), isUpsert: false }, ss._cleanOptions), options);
    Object.getOwnPropertyNames(cleanOptions).forEach((opt) => {
        if (!SimpleSchema_js_1.SimpleSchema.supportedCleanOptions.has(opt)) {
            console.warn(`Unsupported "${opt}" option passed to SimpleSchema clean`);
        }
    });
    // Clone so we do not mutate
    const cleanDoc = cleanOptions.mutate === true ? doc : (0, clone_1.default)(doc);
    const mongoObject = (_a = cleanOptions.mongoObject) !== null && _a !== void 0 ? _a : new mongo_object_1.default(cleanDoc, ss.blackboxKeys());
    // Clean loop
    if (cleanOptions.filter === true ||
        cleanOptions.autoConvert === true ||
        cleanOptions.removeEmptyStrings === true ||
        cleanOptions.trimStrings === true) {
        const removedPositions = []; // For removing now-empty objects after
        mongoObject.forEachNode(function eachNode() {
            // The value of a $unset is irrelevant, so no point in cleaning it.
            // Also we do not care if fields not in the schema are unset.
            // Other operators also have values that we wouldn't want to clean.
            if (operatorsToIgnoreValue.includes(this.operator))
                return;
            const gKey = this.genericKey;
            if (gKey == null)
                return;
            let val = this.value;
            if (val === undefined)
                return;
            let p;
            // Filter out props if necessary
            if ((cleanOptions.filter === true && !ss.allowsKey(gKey)) ||
                (cleanOptions.removeNullsFromArrays === true && this.isArrayItem && val === null)) {
                // XXX Special handling for $each; maybe this could be made nicer
                if (this.position.slice(-7) === '[$each]') {
                    mongoObject.removeValueForPosition(this.position.slice(0, -7));
                    removedPositions.push(this.position.slice(0, -7));
                }
                else {
                    this.remove();
                    removedPositions.push(this.position);
                }
                log(`SimpleSchema.clean: filtered out value that would have affected key "${gKey}", which is not allowed by the schema`);
                return; // no reason to do more
            }
            const outerDef = ss.schema(gKey);
            const defs = outerDef === null || outerDef === void 0 ? void 0 : outerDef.type.definitions;
            const def = defs === null || defs === void 0 ? void 0 : defs[0];
            // Auto-convert values if requested and if possible
            if (cleanOptions.autoConvert === true && defs !== undefined && def != null && !(0, index_js_2.isValueTypeValid)(defs, val, this.operator)) {
                const newVal = (0, convertToProperType_js_1.default)(val, def.type);
                if (newVal !== undefined && newVal !== val) {
                    log(`SimpleSchema.clean: auto-converted value ${String(val)} from ${typeof val} to ${typeof newVal} for ${gKey}`);
                    val = newVal;
                    this.updateValue(newVal);
                }
            }
            // Clean string values
            if (typeof val === 'string') {
                // Trim strings if
                // 1. The trimStrings option is `true` AND
                // 2. The field is not in the schema OR is in the schema with `trim` !== `false`
                if (cleanOptions.trimStrings === true &&
                    (def === null || def === void 0 ? void 0 : def.trim) !== false) {
                    val = val.trim();
                    this.updateValue(val);
                }
                // Remove empty strings if
                // 1. The removeEmptyStrings option is `true` AND
                // 2. The value is in a normal object or in the $set part of a modifier
                // 3. The value is an empty string.
                if (cleanOptions.removeEmptyStrings === true &&
                    (this.operator == null || this.operator === '$set') &&
                    val.length === 0) {
                    // For a document, we remove any fields that are being set to an empty string
                    this.remove();
                    // For a modifier, we $unset any fields that are being set to an empty string.
                    // But only if we're not already within an entire object that is being set.
                    if (this.operator === '$set') {
                        const matches = this.position.match(/\[/g);
                        if (matches !== null && matches.length < 2) {
                            p = this.position.replace('$set', '$unset');
                            mongoObject.setValueForPosition(p, '');
                        }
                    }
                }
            }
        }, { endPointsOnly: false });
        // Remove any objects that are now empty after filtering
        removedPositions.forEach((removedPosition) => {
            const lastBrace = removedPosition.lastIndexOf('[');
            if (lastBrace !== -1) {
                const removedPositionParent = removedPosition.slice(0, lastBrace);
                const value = mongoObject.getValueForPosition(removedPositionParent);
                if ((0, index_js_1.isEmptyObject)(value)) {
                    mongoObject.removeValueForPosition(removedPositionParent);
                }
            }
        });
        mongoObject.removeArrayItems();
    }
    // Set automatic values
    if (cleanOptions.getAutoValues === true) {
        (0, setAutoValues_js_1.default)(ss.autoValueFunctions(), mongoObject, cleanOptions.isModifier || false, cleanOptions.isUpsert || false, cleanOptions.extendAutoValueContext);
    }
    // Ensure we don't have any operators set to an empty object
    // since MongoDB 2.6+ will throw errors.
    if (cleanOptions.isModifier) {
        Object.keys(cleanDoc !== null && cleanDoc !== void 0 ? cleanDoc : {}).forEach((op) => {
            const operatorValue = cleanDoc[op];
            if (typeof operatorValue === 'object' &&
                operatorValue !== null &&
                (0, index_js_1.isEmptyObject)(operatorValue)) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete cleanDoc[op];
            }
        });
    }
    return cleanDoc;
}
exports.default = clean;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clean":{"convertToProperType.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/clean/convertToProperType.js                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../SimpleSchema.js");
/**
 * Converts value to proper type
 *
 * @param value Value to try to convert
 * @param type A type
 * @returns Value converted to type.
 */
function convertToProperType(value, type) {
    // Can't and shouldn't convert arrays or objects or null
    if (value === null)
        return value;
    if (value === undefined)
        return value;
    if (Array.isArray(value))
        return value;
    if (value !== undefined &&
        (typeof value === 'function' || typeof value === 'object') &&
        !(value instanceof Date))
        return value;
    // Convert to String type
    if (type === String)
        return value.toString();
    // Convert to Number type
    if (type === Number || type === SimpleSchema_js_1.SimpleSchema.Integer) {
        if (typeof value === 'string' && value.length > 0) {
            // Try to convert numeric strings to numbers
            const numberVal = Number(value);
            if (!isNaN(numberVal))
                return numberVal;
        }
        // Leave it; will fail validation
        return value;
    }
    // If target type is a Date we can safely convert from either a
    // number (Integer value representing the number of milliseconds
    // since 1 January 1970 00:00:00 UTC) or a string that can be parsed
    // by Date.
    if (type === Date) {
        if (typeof value === 'string') {
            const parsedDate = Date.parse(value);
            if (!isNaN(parsedDate))
                return new Date(parsedDate);
        }
        if (typeof value === 'number')
            return new Date(value);
    }
    // Convert to Boolean type
    if (type === Boolean) {
        if (typeof value === 'string') {
            // Convert exact string 'true' and 'false' to true and false respectively
            if (value.toLowerCase() === 'true')
                return true;
            if (value.toLowerCase() === 'false')
                return false;
        }
        else if (typeof value === 'number' && !isNaN(value)) {
            // NaN can be error, so skipping it
            return Boolean(value);
        }
    }
    // If an array is what you want, I'll give you an array
    if (type === Array)
        return [value];
    // Could not convert
    return value;
}
exports.default = convertToProperType;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"setAutoValues.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/clean/setAutoValues.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortAutoValueFunctions = void 0;
const AutoValueRunner_js_1 = __importDefault(require("./AutoValueRunner.js"));
const getPositionsForAutoValue_js_1 = __importDefault(require("./getPositionsForAutoValue.js"));
/**
 * @method sortAutoValueFunctions
 * @private
 * @param autoValueFunctions - Array of objects to be sorted
 * @returns Sorted array
 *
 * Stable sort of the autoValueFunctions (preserves order at the same field depth).
 */
function sortAutoValueFunctions(autoValueFunctions) {
    const defaultFieldOrder = autoValueFunctions.reduce((acc, { fieldName }, index) => {
        acc[fieldName] = index;
        return acc;
    }, {});
    // Sort by how many dots each field name has, asc, such that we can auto-create
    // objects and arrays before we run the autoValues for properties within them.
    // Fields of the same level (same number of dots) preserve should order from the original array.
    return autoValueFunctions.sort((a, b) => {
        const depthDiff = a.fieldName.split('.').length - b.fieldName.split('.').length;
        return depthDiff === 0
            ? defaultFieldOrder[a.fieldName] - defaultFieldOrder[b.fieldName]
            : depthDiff;
    });
}
exports.sortAutoValueFunctions = sortAutoValueFunctions;
/**
 * @method setAutoValues
 * @private
 * @param autoValueFunctions - An array of objects with func, fieldName, and closestSubschemaFieldName props
 * @param mongoObject
 * @param [isModifier=false] - Is it a modifier doc?
 * @param [extendedAutoValueContext] - Object that will be added to the context when calling each autoValue function
 *
 * Updates doc with automatic values from autoValue functions or default
 * values from defaultValue. Modifies the referenced object in place.
 */
function setAutoValues(autoValueFunctions, mongoObject, isModifier, isUpsert, extendedAutoValueContext) {
    const sortedAutoValueFunctions = sortAutoValueFunctions(autoValueFunctions);
    sortedAutoValueFunctions.forEach(({ func, fieldName, closestSubschemaFieldName }) => {
        const avRunner = new AutoValueRunner_js_1.default({
            closestSubschemaFieldName,
            extendedAutoValueContext,
            func,
            isModifier,
            isUpsert,
            mongoObject
        });
        const positions = (0, getPositionsForAutoValue_js_1.default)({
            fieldName,
            isModifier,
            isUpsert,
            mongoObject
        });
        // Run the autoValue function once for each place in the object that
        // has a value or that potentially should.
        // @ts-expect-error
        positions.forEach(avRunner.runForPosition.bind(avRunner));
    });
}
exports.default = setAutoValues;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"AutoValueRunner.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/clean/AutoValueRunner.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clone_1 = __importDefault(require("clone"));
const index_js_1 = require("../utility/index.js");
function getFieldInfo(mongoObject, key) {
    var _a;
    const keyInfo = (_a = mongoObject.getInfoForKey(key)) !== null && _a !== void 0 ? _a : {
        operator: null,
        value: undefined
    };
    return Object.assign(Object.assign({}, keyInfo), { isSet: keyInfo.value !== undefined });
}
class AutoValueRunner {
    constructor(options) {
        this.doneKeys = [];
        this.options = options;
    }
    runForPosition({ key: affectedKey, operator, position, value }) {
        const { closestSubschemaFieldName, extendedAutoValueContext, func, isModifier, isUpsert, mongoObject } = this.options;
        // If already called for this key, skip it
        if (this.doneKeys.includes(affectedKey))
            return;
        const fieldParentName = (0, index_js_1.getParentOfKey)(affectedKey, true);
        const parentFieldInfo = getFieldInfo(mongoObject, fieldParentName.slice(0, -1));
        let doUnset = false;
        if (Array.isArray(parentFieldInfo.value)) {
            const innerKey = affectedKey.split('.').slice(-1).pop();
            if (innerKey === undefined || isNaN(Number(innerKey))) {
                // parent is an array, but the key to be set is not an integer (see issue #80)
                return;
            }
        }
        const autoValueContext = Object.assign({ closestSubschemaFieldName: closestSubschemaFieldName.length > 0
                ? closestSubschemaFieldName
                : null, field(fName) {
                return getFieldInfo(mongoObject, closestSubschemaFieldName + fName);
            },
            isModifier,
            isUpsert, isSet: value !== undefined, key: affectedKey, operator,
            parentField() {
                return parentFieldInfo;
            },
            siblingField(fName) {
                return getFieldInfo(mongoObject, fieldParentName + fName);
            },
            unset() {
                doUnset = true;
            },
            value }, (extendedAutoValueContext !== null && extendedAutoValueContext !== void 0 ? extendedAutoValueContext : {}));
        const autoValue = func.call(autoValueContext, mongoObject.getObject());
        // Update tracking of which keys we've run autovalue for
        this.doneKeys.push(affectedKey);
        if (doUnset && position != null)
            mongoObject.removeValueForPosition(position);
        if (autoValue === undefined)
            return;
        // If the user's auto value is of the pseudo-modifier format, parse it
        // into operator and value.
        if (isModifier) {
            let op;
            let newValue;
            if (autoValue != null && typeof autoValue === 'object') {
                const avOperator = Object.keys(autoValue).find((avProp) => avProp.substring(0, 1) === '$');
                if (avOperator !== undefined) {
                    op = avOperator;
                    newValue = autoValue[avOperator];
                }
            }
            // Add $set for updates and upserts if necessary. Keep this
            // above the "if (op)" block below since we might change op
            // in this line.
            if (op == null && position.slice(0, 1) !== '$') {
                op = '$set';
                newValue = autoValue;
            }
            if (op != null) {
                // Update/change value
                mongoObject.removeValueForPosition(position);
                mongoObject.setValueForPosition(`${op}[${affectedKey}]`, (0, clone_1.default)(newValue));
                return;
            }
        }
        // Update/change value. Cloning is necessary in case it's an object, because
        // if we later set some keys within it, they'd be set on the original object, too.
        mongoObject.setValueForPosition(position, (0, clone_1.default)(autoValue));
    }
}
exports.default = AutoValueRunner;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"getPositionsForAutoValue.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/clean/getPositionsForAutoValue.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_object_1 = __importDefault(require("mongo-object"));
const index_js_1 = require("../utility/index.js");
/**
 * A position is a place in the object where this field exists.
 * If no arrays are involved, then every field/key has at most 1 position.
 * If arrays are involved, then a field could have potentially unlimited positions.
 *
 * For example, the key 'a.b.$.c` would have these positions:
 *   `a[b][0][c]`
 *   `a[b][1][c]`
 *   `a[b][2][c]`
 *
 * For this object:
 * {
 *   a: {
 *     b: [
 *       { c: 1 },
 *       { c: 1 },
 *       { c: 1 },
 *     ],
 *   },
 * }
 *
 * To make matters more complicated, we want to include not only the existing positions
 * but also the positions that might exist due to their parent object existing or their
 * parent object being auto-created by a MongoDB modifier that implies it.
 */
function getPositionsForAutoValue({ fieldName, isModifier, isUpsert, mongoObject }) {
    // Positions for this field
    const positions = mongoObject.getPositionsInfoForGenericKey(fieldName);
    // If the field is an object and will be created by MongoDB,
    // we don't need (and can't have) a value for it
    if (isModifier === true &&
        mongoObject.getPositionsThatCreateGenericKey(fieldName).length > 0) {
        return positions;
    }
    // For simple top-level fields, just add an undefined would-be position
    // if there isn't a real position.
    if (!fieldName.includes('.') && positions.length === 0) {
        positions.push({
            key: fieldName,
            // @ts-expect-error incorrect type in mongo-object package
            value: undefined,
            operator: isModifier === true ? '$set' : null,
            position: isModifier === true ? `$set[${fieldName}]` : fieldName
        });
        return positions;
    }
    const parentPath = (0, index_js_1.getParentOfKey)(fieldName);
    const lastPart = (0, index_js_1.getLastPartOfKey)(fieldName, parentPath);
    const lastPartWithBraces = lastPart.replace(/\./g, '][');
    const parentPositions = mongoObject.getPositionsInfoForGenericKey(parentPath);
    if (parentPositions.length > 0) {
        parentPositions.forEach((info) => {
            const childPosition = `${info.position}[${lastPartWithBraces}]`;
            if (positions.find((i) => i.position === childPosition) == null) {
                positions.push({
                    key: `${info.key}.${lastPart}`,
                    // @ts-expect-error incorrect type in mongo-object package
                    value: undefined,
                    operator: info.operator,
                    position: childPosition
                });
            }
        });
    }
    else if (parentPath.slice(-2) !== '.$') {
        // positions that will create parentPath
        mongoObject.getPositionsThatCreateGenericKey(parentPath).forEach((info) => {
            const { operator, position } = info;
            let wouldBePosition;
            if (operator != null) {
                const next = position.slice(position.indexOf('[') + 1, position.indexOf(']'));
                const nextPieces = next.split('.');
                const newPieces = [];
                let newKey = '';
                while ((nextPieces.length > 0) && newKey !== parentPath) {
                    newPieces.push(nextPieces.shift());
                    newKey = newPieces.join('.');
                }
                newKey = `${newKey}.${fieldName.slice(newKey.length + 1)}`;
                wouldBePosition = `$set[${newKey}]`;
            }
            else {
                const lastPart2 = (0, index_js_1.getLastPartOfKey)(fieldName, parentPath);
                const lastPartWithBraces2 = lastPart2.replace(/\./g, '][');
                wouldBePosition = `${position.slice(0, position.lastIndexOf('['))}[${lastPartWithBraces2}]`;
            }
            if (positions.find((item) => item.position === wouldBePosition) == null) {
                const key = mongo_object_1.default._positionToKey(wouldBePosition);
                if (key != null) {
                    positions.push({
                        key,
                        // @ts-expect-error incorrect type in mongo-object package
                        value: undefined,
                        operator: operator == null ? null : '$set',
                        position: wouldBePosition
                    });
                }
            }
        });
    }
    // If we made it this far, we still want to call the autoValue
    // function once for the field, so we'll add a would-be position for it.
    if (positions.length === 0 && isModifier === true && isUpsert !== true) {
        positions.push({
            key: fieldName,
            // @ts-expect-error incorrect type in mongo-object package
            value: undefined,
            operator: '$set',
            position: `$set[${fieldName}]`
        });
    }
    return positions;
}
exports.default = getPositionsForAutoValue;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"SimpleSchema.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/SimpleSchema.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationContext = exports.SimpleSchema = exports.schemaDefinitionOptions = void 0;
/* eslint-disable no-undef */
const mongo_object_1 = __importDefault(require("mongo-object"));
const clean_js_1 = __importDefault(require("./clean.js"));
const defaultMessages_js_1 = require("./defaultMessages.js");
const errors_js_1 = require("./errors.js");
const expandShorthand_js_1 = __importDefault(require("./expandShorthand.js"));
const SimpleSchemaGroup_js_1 = __importDefault(require("./SimpleSchemaGroup.js"));
const index_js_1 = require("./utility/index.js");
const ValidationContext_js_1 = __importDefault(require("./ValidationContext.js"));
exports.ValidationContext = ValidationContext_js_1.default;
exports.schemaDefinitionOptions = [
    'autoValue',
    'defaultValue',
    'label',
    'optional',
    'required',
    'type'
];
const oneOfProps = [
    'allowedValues',
    'blackbox',
    'custom',
    'exclusiveMax',
    'exclusiveMin',
    'max',
    'maxCount',
    'min',
    'minCount',
    'regEx',
    'skipRegExCheckForEmptyStrings',
    'trim',
    'type'
];
const propsThatCanBeFunction = [
    'allowedValues',
    'exclusiveMax',
    'exclusiveMin',
    'label',
    'max',
    'maxCount',
    'min',
    'minCount',
    'optional',
    'regEx',
    'skipRegExCheckForEmptyStrings'
];
class SimpleSchema {
    constructor(schema = {}, options = {}) {
        var _a;
        this._autoValues = [];
        this._blackboxKeys = new Set();
        this._cleanOptions = {};
        this._constructorOptions = {};
        this._docValidators = [];
        this._firstLevelSchemaKeys = [];
        this._rawDefinition = null;
        this._schema = {};
        this._schemaKeys = [];
        // Named validation contexts
        this._validationContexts = {};
        this._validators = [];
        /**
         * @method SimpleSchema#pick
         * @param {[fields]} The list of fields to pick to instantiate the subschema
         * @returns {SimpleSchema} The subschema
         */
        this.pick = getPickOrOmit('pick');
        /**
         * @method SimpleSchema#omit
         * @param {[fields]} The list of fields to omit to instantiate the subschema
         * @returns {SimpleSchema} The subschema
         */
        this.omit = getPickOrOmit('omit');
        // Stash the options object
        this._constructorOptions = Object.assign(Object.assign({}, SimpleSchema._constructorOptionDefaults), options);
        delete this._constructorOptions.clean; // stored separately below
        Object.getOwnPropertyNames(this._constructorOptions).forEach((opt) => {
            if (!SimpleSchema.supportedConstructorOptions.has(opt)) {
                console.warn(`Unsupported "${opt}" option passed to SimpleSchema constructor`);
            }
        });
        // Schema-level defaults for cleaning
        this._cleanOptions = Object.assign(Object.assign({}, SimpleSchema._constructorOptionDefaults.clean), ((_a = options.clean) !== null && _a !== void 0 ? _a : {}));
        // Custom validators for this instance
        this._docValidators = [];
        // Clone, expanding shorthand, and store the schema object in this._schema
        this.extend(schema);
        // Clone raw definition and save if keepRawDefinition is active
        if (this._constructorOptions.keepRawDefinition === true) {
            this._rawDefinition = schema;
        }
        this.version = SimpleSchema.version;
    }
    /**
    /* @returns The entire raw schema definition passed in the constructor
    */
    get rawDefinition() {
        return this._rawDefinition;
    }
    forEachAncestorSimpleSchema(key, func) {
        const genericKey = mongo_object_1.default.makeKeyGeneric(key);
        if (genericKey == null)
            return;
        (0, index_js_1.forEachKeyAncestor)(genericKey, (ancestor) => {
            const def = this._schema[ancestor];
            if (def == null)
                return;
            def.type.definitions.forEach((typeDef) => {
                if (SimpleSchema.isSimpleSchema(typeDef.type)) {
                    func(typeDef.type, ancestor, genericKey.slice(ancestor.length + 1));
                }
            });
        });
    }
    /**
     * Returns whether the obj is a SimpleSchema object.
     * @param [obj] An object to test
     * @returns True if the given object appears to be a SimpleSchema instance
     */
    static isSimpleSchema(obj) {
        if (obj == null)
            return false;
        return obj instanceof SimpleSchema || Object.prototype.hasOwnProperty.call(obj, '_schema');
    }
    /**
     * @param key One specific or generic key for which to get the schema.
     * @returns Returns a 2-tuple.
     *
     *   First item: The SimpleSchema instance that actually defines the given key.
     *
     *   For example, if you have several nested objects, each their own SimpleSchema
     *   instance, and you pass in 'outerObj.innerObj.innermostObj.name' as the key, you'll
     *   get back the SimpleSchema instance for `outerObj.innerObj.innermostObj` key.
     *
     *   But if you pass in 'outerObj.innerObj.innermostObj.name' as the key and that key is
     *   defined in the main schema without use of subschemas, then you'll get back the main schema.
     *
     *   Second item: The part of the key that is in the found schema.
     *
     *   Always returns a tuple (array) but the values may be `null`.
     */
    nearestSimpleSchemaInstance(key) {
        if (key == null)
            return [null, null];
        const genericKey = mongo_object_1.default.makeKeyGeneric(key);
        if (genericKey == null)
            return [null, null];
        if (this._schema[genericKey] !== undefined)
            return [this, genericKey];
        // If not defined in this schema, see if it's defined in a sub-schema
        let innerKey;
        let nearestSimpleSchemaInstance = null;
        this.forEachAncestorSimpleSchema(key, (simpleSchema, ancestor, subSchemaKey) => {
            if ((nearestSimpleSchemaInstance == null) &&
                // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
                simpleSchema._schema[subSchemaKey]) {
                nearestSimpleSchemaInstance = simpleSchema;
                innerKey = subSchemaKey;
            }
        });
        return innerKey != null ? [nearestSimpleSchemaInstance, innerKey] : [null, null];
    }
    schema(key) {
        if (key == null)
            return this._schema;
        const genericKey = mongo_object_1.default.makeKeyGeneric(key);
        let keySchema = genericKey == null ? null : this._schema[genericKey];
        // If not defined in this schema, see if it's defined in a subschema
        if (keySchema == null) {
            let found = false;
            this.forEachAncestorSimpleSchema(key, (simpleSchema, ancestor, subSchemaKey) => {
                if (!found)
                    keySchema = simpleSchema.schema(subSchemaKey);
                if (keySchema != null)
                    found = true;
            });
        }
        return keySchema;
    }
    /**
     * @param key One specific or generic key for which to get all possible schemas.
     * @returns An potentially empty array of possible definitions for one key
     *
     * Note that this returns the raw, unevaluated definition object. Use `getDefinition`
     * if you want the evaluated definition, where any properties that are functions
     * have been run to produce a result.
     */
    schemas(key) {
        const schemas = [];
        const genericKey = mongo_object_1.default.makeKeyGeneric(key);
        const keySchema = genericKey == null ? null : this._schema[genericKey];
        if (keySchema != null)
            schemas.push(keySchema);
        // See if it's defined in any subschema
        this.forEachAncestorSimpleSchema(key, (simpleSchema, ancestor, subSchemaKey) => {
            const keyDef = simpleSchema.schema(subSchemaKey);
            if (keyDef != null)
                schemas.push(keyDef);
        });
        return schemas;
    }
    /**
     * @returns {Object} The entire schema object with subschemas merged. This is the
     * equivalent of what schema() returned in SimpleSchema < 2.0
     *
     * Note that this returns the raw, unevaluated definition object. Use `getDefinition`
     * if you want the evaluated definition, where any properties that are functions
     * have been run to produce a result.
     */
    mergedSchema() {
        const mergedSchema = {};
        this._schemaKeys.forEach((key) => {
            const keySchema = this._schema[key];
            mergedSchema[key] = keySchema;
            keySchema.type.definitions.forEach((typeDef) => {
                if (!SimpleSchema.isSimpleSchema(typeDef.type))
                    return;
                const childSchema = typeDef.type.mergedSchema();
                Object.keys(childSchema).forEach((subKey) => {
                    mergedSchema[`${key}.${subKey}`] = childSchema[subKey];
                });
            });
        });
        return mergedSchema;
    }
    /**
     * Returns the evaluated definition for one key in the schema
     *
     * @param key Generic or specific schema key
     * @param [propList] Array of schema properties you need; performance optimization
     * @param [functionContext] The context to use when evaluating schema options that are functions
     * @returns The schema definition for the requested key
     */
    getDefinition(key, propList, functionContext = {}) {
        const schemaKeyDefinition = this.schema(key);
        if (schemaKeyDefinition == null)
            return;
        return this.resolveDefinitionForSchema(key, schemaKeyDefinition, propList, functionContext);
    }
    /**
     * Returns the evaluated definition for one key in the schema
     *
     * @param key Generic or specific schema key
     * @param [propList] Array of schema properties you need; performance optimization
     * @param [functionContext] The context to use when evaluating schema options that are functions
     * @returns The schema definition for the requested key
     */
    getDefinitions(key, propList, functionContext = {}) {
        const schemaKeyDefinitions = this.schemas(key);
        return schemaKeyDefinitions.map((def) => {
            return this.resolveDefinitionForSchema(key, def, propList, functionContext);
        });
    }
    /**
     * Resolves the definition for one key in the schema
     *
     * @param key Generic or specific schema key
     * @param schemaKeyDefinition Unresolved definition as returned from simpleSchema.schema()
     * @param [propList] Array of schema properties you need; performance optimization
     * @param [functionContext] The context to use when evaluating schema options that are functions
     * @returns The schema definition for the requested key
     */
    resolveDefinitionForSchema(key, schemaKeyDefinition, propList, functionContext = {}) {
        var _a;
        const getPropIterator = (obj, newObj) => {
            return (prop) => {
                if (Array.isArray(propList) && !propList.includes(prop))
                    return;
                const val = obj[prop];
                // For any options that support specifying a function, evaluate the functions
                if (propsThatCanBeFunction.includes(prop) &&
                    typeof val === 'function') {
                    newObj[prop] = val.call(Object.assign({ key }, functionContext));
                    // Inflect label if undefined
                    if (prop === 'label' && typeof newObj.label !== 'string') {
                        newObj.label = inflectedLabel(key, this._constructorOptions.humanizeAutoLabels);
                    }
                }
                else {
                    newObj[prop] = val;
                }
            };
        };
        const result = {
            type: []
        };
        Object.keys(schemaKeyDefinition).forEach(getPropIterator(schemaKeyDefinition, result));
        // Resolve all the types and convert to a normal array to make it easier to use.
        if (Array.isArray((_a = schemaKeyDefinition.type) === null || _a === void 0 ? void 0 : _a.definitions)) {
            result.type = schemaKeyDefinition.type.definitions.map((typeDef) => {
                const newTypeDef = {
                    type: String // will be overwritten
                };
                Object.keys(typeDef).forEach(getPropIterator(typeDef, newTypeDef));
                return newTypeDef;
            });
        }
        return result;
    }
    /**
     * Returns a string identifying the best guess data type for a key. For keys
     * that allow multiple types, the first type is used. This can be useful for
     * building forms.
     *
     * @param key Generic or specific schema key
     * @returns A type string. One of:
     *  string, number, boolean, date, object, stringArray, numberArray, booleanArray,
     *  dateArray, objectArray
     */
    getQuickTypeForKey(key) {
        let type;
        const fieldSchema = this.schema(key);
        if (fieldSchema == null)
            return;
        const fieldType = (fieldSchema.type).singleType;
        if (fieldType === String) {
            type = 'string';
        }
        else if (fieldType === Number || fieldType === SimpleSchema.Integer) {
            type = 'number';
        }
        else if (fieldType === Boolean) {
            type = 'boolean';
        }
        else if (fieldType === Date) {
            type = 'date';
        }
        else if (fieldType === Array) {
            const arrayItemFieldSchema = this.schema(`${key}.$`);
            if (arrayItemFieldSchema == null)
                return;
            const arrayItemFieldType = (arrayItemFieldSchema.type).singleType;
            if (arrayItemFieldType === String) {
                type = 'stringArray';
            }
            else if (arrayItemFieldType === Number ||
                arrayItemFieldType === SimpleSchema.Integer) {
                type = 'numberArray';
            }
            else if (arrayItemFieldType === Boolean) {
                type = 'booleanArray';
            }
            else if (arrayItemFieldType === Date) {
                type = 'dateArray';
            }
            else if (arrayItemFieldType === Object ||
                SimpleSchema.isSimpleSchema(arrayItemFieldType)) {
                type = 'objectArray';
            }
        }
        else if (fieldType === Object) {
            type = 'object';
        }
        return type;
    }
    /**
     * Given a key that is an Object, returns a new SimpleSchema instance scoped to that object.
     *
     * @param key Generic or specific schema key
     */
    getObjectSchema(key) {
        const newSchemaDef = {};
        const genericKey = mongo_object_1.default.makeKeyGeneric(key);
        if (genericKey == null)
            throw new Error(`Unable to make a generic key for ${key}`);
        const searchString = `${genericKey}.`;
        const mergedSchema = this.mergedSchema();
        Object.keys(mergedSchema).forEach((k) => {
            if (k.indexOf(searchString) === 0) {
                newSchemaDef[k.slice(searchString.length)] = mergedSchema[k];
            }
        });
        return this._copyWithSchema(newSchemaDef);
    }
    // Returns an array of all the autovalue functions, including those in subschemas all the
    // way down the schema tree
    autoValueFunctions() {
        const result = [...this._autoValues];
        this._schemaKeys.forEach((key) => {
            this._schema[key].type.definitions.forEach((typeDef) => {
                if (!SimpleSchema.isSimpleSchema(typeDef.type))
                    return;
                result.push(...typeDef.type
                    .autoValueFunctions()
                    .map(({ func, fieldName, closestSubschemaFieldName }) => {
                    return {
                        func,
                        fieldName: `${key}.${fieldName}`,
                        closestSubschemaFieldName: closestSubschemaFieldName.length > 0
                            ? `${key}.${closestSubschemaFieldName}`
                            : key
                    };
                }));
            });
        });
        return result;
    }
    // Returns an array of all the blackbox keys, including those in subschemas
    blackboxKeys() {
        const blackboxKeys = new Set(this._blackboxKeys);
        this._schemaKeys.forEach((key) => {
            this._schema[key].type.definitions.forEach((typeDef) => {
                if (!SimpleSchema.isSimpleSchema(typeDef.type))
                    return;
                typeDef.type.blackboxKeys().forEach((blackboxKey) => {
                    blackboxKeys.add(`${key}.${blackboxKey}`);
                });
            });
        });
        return Array.from(blackboxKeys);
    }
    /**
     * Check if the key is a nested dot-syntax key inside of a blackbox object
     * @param key Key to check
     * @returns True if key is in a black box object
     */
    keyIsInBlackBox(key) {
        const genericKey = mongo_object_1.default.makeKeyGeneric(key);
        if (genericKey == null)
            return false;
        let isInBlackBox = false;
        (0, index_js_1.forEachKeyAncestor)(genericKey, (ancestor, remainder) => {
            if (this._blackboxKeys.has(ancestor)) {
                isInBlackBox = true;
            }
            else {
                const testKeySchema = this.schema(ancestor);
                if (testKeySchema != null) {
                    testKeySchema.type.definitions.forEach((typeDef) => {
                        if (!SimpleSchema.isSimpleSchema(typeDef.type))
                            return;
                        if (typeDef.type.keyIsInBlackBox(remainder))
                            isInBlackBox = true;
                    });
                }
            }
        });
        return isInBlackBox;
    }
    // Returns true if key is explicitly allowed by the schema or implied
    // by other explicitly allowed keys.
    // The key string should have $ in place of any numeric array positions.
    allowsKey(key) {
        // Loop through all keys in the schema
        return this._schemaKeys.some((loopKey) => {
            var _a;
            // If the schema key is the test key, it's allowed.
            if (loopKey === key)
                return true;
            const compare1 = key.slice(0, loopKey.length + 2);
            const compare2 = compare1.slice(0, -1);
            // Blackbox and subschema checks are needed only if key starts with
            // loopKey + a dot
            if (compare2 !== `${loopKey}.`)
                return false;
            // Black box handling
            if (this._blackboxKeys.has(loopKey)) {
                // If the test key is the black box key + ".$", then the test
                // key is NOT allowed because black box keys are by definition
                // only for objects, and not for arrays.
                return compare1 !== `${loopKey}.$`;
            }
            // Subschemas
            let allowed = false;
            const subKey = key.slice(loopKey.length + 1);
            (_a = this.schema(loopKey)) === null || _a === void 0 ? void 0 : _a.type.definitions.forEach((typeDef) => {
                if (!SimpleSchema.isSimpleSchema(typeDef.type))
                    return;
                if (typeDef.type.allowsKey(subKey))
                    allowed = true;
            });
            return allowed;
        });
    }
    /**
     * Returns all the child keys for the object identified by the generic prefix,
     * or all the top level keys if no prefix is supplied.
     *
     * @param [keyPrefix] The Object-type generic key for which to get child keys. Omit for
     *   top-level Object-type keys
     * @returns Array of child keys for the given object key
     */
    objectKeys(keyPrefix) {
        var _a;
        if (keyPrefix == null)
            return this._firstLevelSchemaKeys;
        const objectKeys = {};
        const setObjectKeys = (curSchema, schemaParentKey) => {
            Object.keys(curSchema).forEach((fieldName) => {
                var _a;
                const definition = curSchema[fieldName];
                fieldName = schemaParentKey != null ? `${schemaParentKey}.${fieldName}` : fieldName;
                if (fieldName.includes('.') && fieldName.slice(-2) !== '.$') {
                    const parentKey = fieldName.slice(0, fieldName.lastIndexOf('.'));
                    const parentKeyWithDot = `${parentKey}.`;
                    objectKeys[parentKeyWithDot] = (_a = objectKeys[parentKeyWithDot]) !== null && _a !== void 0 ? _a : [];
                    objectKeys[parentKeyWithDot].push(fieldName.slice(fieldName.lastIndexOf('.') + 1));
                }
                // If the current field is a nested SimpleSchema,
                // iterate over the child fields and cache their properties as well
                definition.type.definitions.forEach(({ type }) => {
                    if (SimpleSchema.isSimpleSchema(type)) {
                        setObjectKeys(type._schema, fieldName);
                    }
                });
            });
        };
        setObjectKeys(this._schema);
        return (_a = objectKeys[`${keyPrefix}.`]) !== null && _a !== void 0 ? _a : [];
    }
    /**
     * Copies this schema into a new instance with the same validators, messages,
     * and options, but with different keys as defined in `schema` argument
     *
     * @param schema
     * @returns The new SimpleSchema instance (chainable)
     */
    _copyWithSchema(schema) {
        const cl = new SimpleSchema(schema, Object.assign({}, this._constructorOptions));
        cl._cleanOptions = this._cleanOptions;
        return cl;
    }
    /**
     * Clones this schema into a new instance with the same schema keys, validators,
     * and options.
     *
     * @returns The new SimpleSchema instance (chainable)
     */
    clone() {
        return this._copyWithSchema(this._schema);
    }
    /**
     * Extends (mutates) this schema with another schema, key by key.
     *
     * @param schema The schema or schema definition to extend onto this one
     * @returns The SimpleSchema instance (chainable)
     */
    extend(schema = {}) {
        if (Array.isArray(schema)) {
            throw new Error('You may not pass an array of schemas to the SimpleSchema constructor or to extend()');
        }
        let schemaObj;
        if (SimpleSchema.isSimpleSchema(schema)) {
            schemaObj = schema._schema;
            this._validators = this._validators.concat(schema._validators);
            this._docValidators = this._docValidators.concat(schema._docValidators);
            Object.assign(this._cleanOptions, schema._cleanOptions);
            Object.assign(this._constructorOptions, schema._constructorOptions);
        }
        else {
            schemaObj = (0, expandShorthand_js_1.default)(schema);
        }
        const schemaKeys = Object.keys(schemaObj);
        const combinedKeys = new Set([...Object.keys(this._schema), ...schemaKeys]);
        // Update all of the information cached on the instance
        schemaKeys.forEach((fieldName) => {
            const definition = standardizeDefinition(schemaObj[fieldName]);
            // Merge/extend with any existing definition
            if (this._schema[fieldName] != null) {
                if (!Object.prototype.hasOwnProperty.call(this._schema, fieldName)) {
                    // fieldName is actually a method from Object itself!
                    throw new Error(`${fieldName} key is actually the name of a method on Object, please rename it`);
                }
                const { type } = definition, definitionWithoutType = __rest(definition, ["type"]); // eslint-disable-line no-unused-vars
                this._schema[fieldName] = Object.assign(Object.assign({}, this._schema[fieldName]), definitionWithoutType);
                if (definition.type != null) {
                    this._schema[fieldName].type.extend(definition.type);
                }
            }
            else {
                this._schema[fieldName] = definition;
            }
            checkAndScrubDefinition(fieldName, this._schema[fieldName], this._constructorOptions, combinedKeys);
        });
        checkSchemaOverlap(this._schema);
        // Set/Reset all of these
        this._schemaKeys = Object.keys(this._schema);
        this._autoValues = [];
        this._blackboxKeys = new Set();
        this._firstLevelSchemaKeys = [];
        // Update all of the information cached on the instance
        this._schemaKeys.forEach((fieldName) => {
            // Make sure parent has a definition in the schema. No implied objects!
            if (fieldName.includes('.')) {
                const parentFieldName = fieldName.slice(0, fieldName.lastIndexOf('.'));
                if (!Object.prototype.hasOwnProperty.call(this._schema, parentFieldName)) {
                    throw new Error(`"${fieldName}" is in the schema but "${parentFieldName}" is not`);
                }
            }
            const definition = this._schema[fieldName];
            // Keep list of all top level keys
            if (!fieldName.includes('.')) {
                this._firstLevelSchemaKeys.push(fieldName);
            }
            // Keep list of all blackbox keys for passing to MongoObject constructor
            // XXX For now if any oneOf type is blackbox, then the whole field is.
            /* eslint-disable no-restricted-syntax */
            for (const oneOfDef of definition.type.definitions) {
                // XXX If the type is SS.Any, also consider it a blackbox
                if (oneOfDef.blackbox === true || oneOfDef.type === SimpleSchema.Any) {
                    this._blackboxKeys.add(fieldName);
                    break;
                }
            }
            /* eslint-enable no-restricted-syntax */
            // Keep list of autoValue functions
            if (typeof definition.autoValue === 'function') {
                this._autoValues.push({
                    closestSubschemaFieldName: '',
                    fieldName,
                    func: definition.autoValue
                });
            }
        });
        return this;
    }
    getAllowedValuesForKey(key) {
        // For array fields, `allowedValues` is on the array item definition
        if (this.allowsKey(`${key}.$`)) {
            key = `${key}.$`;
        }
        const allowedValues = this.get(key, 'allowedValues');
        if (Array.isArray(allowedValues) || allowedValues instanceof Set) {
            return [...allowedValues];
        }
        return null;
    }
    newContext() {
        return new ValidationContext_js_1.default(this);
    }
    namedContext(name) {
        if (typeof name !== 'string')
            name = 'default';
        if (this._validationContexts[name] == null) {
            this._validationContexts[name] = new ValidationContext_js_1.default(this, name);
        }
        return this._validationContexts[name];
    }
    addValidator(func) {
        this._validators.push(func);
    }
    addDocValidator(func) {
        this._docValidators.push(func);
    }
    /**
     * @param obj Object or array of objects to validate.
     * @param options Same options object that ValidationContext#validate takes
     *
     * Throws an Error with name `ClientError` and `details` property containing the errors.
     */
    validate(obj, options = {}) {
        // obj can be an array, in which case we validate each object in it and
        // throw as soon as one has an error
        const objects = Array.isArray(obj) ? obj : [obj];
        objects.forEach((oneObj) => {
            const validationContext = this.newContext();
            const isValid = validationContext.validate(oneObj, options);
            if (isValid)
                return;
            const errors = validationContext.validationErrors();
            // In order for the message at the top of the stack trace to be useful,
            // we set it to the first validation error message.
            const message = this.messageForError(errors[0]);
            const error = new errors_js_1.ClientError(message, 'validation-error');
            // Add meaningful error messages for each validation error.
            // Useful for display messages when using 'mdg:validated-method'.
            error.details = errors.map((errorDetail) => (Object.assign(Object.assign({}, errorDetail), { message: this.messageForError(errorDetail) })));
            // The primary use for the validationErrorTransform is to convert the
            // vanilla Error into a Meteor.Error until DDP is able to pass
            // vanilla errors back to the client.
            if (typeof SimpleSchema.validationErrorTransform === 'function') {
                throw SimpleSchema.validationErrorTransform(error);
            }
            else {
                throw error;
            }
        });
    }
    /**
     * @param obj Object to validate.
     * @param options Same options object that ValidationContext#validate takes
     *
     * Returns a Promise that resolves with the errors
     */
    validateAndReturnErrorsPromise(obj, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const validationContext = this.newContext();
            const isValid = validationContext.validate(obj, options);
            if (isValid)
                return [];
            // Add the `message` prop
            return validationContext.validationErrors().map((errorDetail) => {
                return Object.assign(Object.assign({}, errorDetail), { message: this.messageForError(errorDetail) });
            });
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    validator(options = {}) {
        return (obj) => {
            const { clean, returnErrorsPromise } = options, validationOptions = __rest(options
            // Do this here and pass into both functions for better performance
            , ["clean", "returnErrorsPromise"]);
            // Do this here and pass into both functions for better performance
            const mongoObject = new mongo_object_1.default(obj, this.blackboxKeys());
            if (clean === true) {
                this.clean(obj, { mongoObject });
            }
            return returnErrorsPromise === true ? this.validateAndReturnErrorsPromise(obj, Object.assign(Object.assign({}, validationOptions), { mongoObject })) : this.validate(obj, Object.assign(Object.assign({}, validationOptions), { mongoObject }));
        };
    }
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    getFormValidator(options = {}) {
        return this.validator(Object.assign(Object.assign({}, options), { returnErrorsPromise: true }));
    }
    clean(doc, options = {}) {
        return (0, clean_js_1.default)(this, doc, options);
    }
    /**
     * Change schema labels on the fly. Useful when the user changes the language.
     *
     * @param labels A dictionary of all the new label values, by schema key.
     */
    labels(labels) {
        for (const [key, label] of Object.entries(labels)) {
            if (typeof label !== 'string' && typeof label !== 'function')
                continue;
            // Support setting labels that were actually originally defined in a sub-schema
            const [schemaInstance, innerKey] = this.nearestSimpleSchemaInstance(key);
            if (schemaInstance == null || innerKey == null)
                continue;
            schemaInstance._schema[innerKey].label = label;
        }
    }
    label(key) {
        // Get all labels
        if (key === null || key === undefined) {
            const result = {};
            this._schemaKeys.forEach((schemaKey) => {
                result[schemaKey] = this.label(schemaKey);
            });
            return result;
        }
        // Get label for one field
        const label = this.get(key, 'label');
        return label !== null && label !== void 0 ? label : null;
    }
    /**
     * Gets a field's property
     *
     * @param key The schema key, specific or generic.
     * @param prop Name of the property to get for that schema key
     * @param functionContext The `this` context to use if prop is a function
     * @returns The property value
     */
    get(key, prop, functionContext) {
        const def = this.getDefinition(key, ['type', prop], functionContext);
        if (def == null)
            return undefined;
        if (exports.schemaDefinitionOptions.includes(prop)) {
            return def[prop];
        }
        const oneType = def.type[0];
        if (oneType === SimpleSchema.Any)
            return undefined;
        return oneType === null || oneType === void 0 ? void 0 : oneType[prop];
    }
    // shorthand for getting defaultValue
    defaultValue(key) {
        return this.get(key, 'defaultValue');
    }
    // Returns a string message for the given error type and key.
    // Defers to a user-provided getErrorMessage function, which
    // can do custom messages and translations, or falls back to
    // built-in English defaults.
    messageForError(errorInfo) {
        var _a, _b;
        const { name } = errorInfo;
        const label = this.label(name);
        let message;
        if (this._constructorOptions.getErrorMessage !== undefined) {
            message = this._constructorOptions.getErrorMessage(errorInfo, label);
            if (message !== undefined)
                return message;
        }
        if (((_a = globalThis.simpleSchemaGlobalConfig) === null || _a === void 0 ? void 0 : _a.getErrorMessage) !== undefined) {
            message = (_b = globalThis.simpleSchemaGlobalConfig) === null || _b === void 0 ? void 0 : _b.getErrorMessage(errorInfo, label);
            if (message !== undefined)
                return message;
        }
        return (0, defaultMessages_js_1.getDefaultErrorMessage)(errorInfo, label);
    }
    /**
     * If you need to allow properties other than those listed above, call this from your app or package
     * @param options Additional allowed options
     */
    static extendOptions(options) {
        exports.schemaDefinitionOptions.push(...options);
    }
    static defineValidationErrorTransform(transform) {
        if (typeof transform !== 'function') {
            throw new Error('SimpleSchema.defineValidationErrorTransform must be passed a function that accepts an Error and returns an Error');
        }
        SimpleSchema.validationErrorTransform = transform;
    }
    static validate(obj, schema, options) {
        // Allow passing just the schema object
        if (!SimpleSchema.isSimpleSchema(schema)) {
            schema = new SimpleSchema(schema);
        }
        return schema.validate(obj, options);
    }
    static oneOf(...definitions) {
        return new SimpleSchemaGroup_js_1.default(...definitions);
    }
    static addValidator(func) {
        SimpleSchema._validators.push(func);
    }
    static addDocValidator(func) {
        SimpleSchema._docValidators.push(func);
    }
    /**
     * @summary Get/set default values for SimpleSchema constructor options
     */
    static constructorOptionDefaults(options) {
        var _a;
        if (options == null)
            return SimpleSchema._constructorOptionDefaults;
        SimpleSchema._constructorOptionDefaults = Object.assign(Object.assign(Object.assign({}, SimpleSchema._constructorOptionDefaults), options), { clean: Object.assign(Object.assign({}, SimpleSchema._constructorOptionDefaults.clean), ((_a = options.clean) !== null && _a !== void 0 ? _a : {})) });
    }
}
exports.SimpleSchema = SimpleSchema;
/**
 * Packages that want to allow and check additional options
 * should add the option names to this set.
 */
SimpleSchema.supportedConstructorOptions = new Set([
    'clean',
    'getErrorMessage',
    'humanizeAutoLabels',
    'keepRawDefinition',
    'requiredByDefault',
    'defaultLabel'
]);
/**
 * Packages that want to allow and check additional options
 * should add the option names to this set.
 */
SimpleSchema.supportedCleanOptions = new Set([
    'autoConvert',
    'extendAutoValueContext',
    'filter',
    'getAutoValues',
    'isModifier',
    'isUpsert',
    'mongoObject',
    'mutate',
    'removeEmptyStrings',
    'removeNullsFromArrays',
    'trimStrings'
]);
SimpleSchema.version = 2;
// Global constructor options
SimpleSchema._constructorOptionDefaults = {
    clean: {
        autoConvert: true,
        extendAutoValueContext: {},
        filter: true,
        getAutoValues: true,
        removeEmptyStrings: true,
        removeNullsFromArrays: false,
        trimStrings: true
    },
    humanizeAutoLabels: true,
    requiredByDefault: true
};
SimpleSchema._docValidators = [];
SimpleSchema._validators = [];
SimpleSchema.Any = '___Any___';
SimpleSchema.ErrorTypes = {
    REQUIRED: 'required',
    MIN_STRING: 'minString',
    MAX_STRING: 'maxString',
    MIN_NUMBER: 'minNumber',
    MAX_NUMBER: 'maxNumber',
    MIN_NUMBER_EXCLUSIVE: 'minNumberExclusive',
    MAX_NUMBER_EXCLUSIVE: 'maxNumberExclusive',
    MIN_DATE: 'minDate',
    MAX_DATE: 'maxDate',
    BAD_DATE: 'badDate',
    MIN_COUNT: 'minCount',
    MAX_COUNT: 'maxCount',
    MUST_BE_INTEGER: 'noDecimal',
    VALUE_NOT_ALLOWED: 'notAllowed',
    EXPECTED_TYPE: 'expectedType',
    FAILED_REGULAR_EXPRESSION: 'regEx',
    KEY_NOT_IN_SCHEMA: 'keyNotInSchema'
};
SimpleSchema.Integer = 'SimpleSchema.Integer';
SimpleSchema.ValidationContext = ValidationContext_js_1.default;
/*
 * PRIVATE
 */
// Throws an error if any fields are `type` SimpleSchema but then also
// have subfields defined outside of that.
function checkSchemaOverlap(schema) {
    Object.keys(schema).forEach((key) => {
        const val = schema[key];
        if (val.type == null)
            throw new Error(`${key} key is missing "type"`);
        val.type.definitions.forEach((def) => {
            if (!SimpleSchema.isSimpleSchema(def.type))
                return;
            // @ts-expect-error
            Object.keys(def.type._schema).forEach((subKey) => {
                const newKey = `${key}.${subKey}`;
                if (Object.prototype.hasOwnProperty.call(schema, newKey)) {
                    throw new Error(`The type for "${key}" is set to a SimpleSchema instance that defines "${key}.${subKey}", but the parent SimpleSchema instance also tries to define "${key}.${subKey}"`);
                }
            });
        });
    });
}
/**
 * @param fieldName The full generic schema key
 * @param shouldHumanize Humanize it
 * @returns A label based on the key
 */
function inflectedLabel(fieldName, shouldHumanize = false) {
    const pieces = fieldName.split('.');
    let label;
    do {
        label = pieces.pop();
    } while (label === '$' && (pieces.length > 0));
    return (label != null && shouldHumanize) ? (0, index_js_1.humanize)(label) : (label !== null && label !== void 0 ? label : '');
}
function getDefaultAutoValueFunction(defaultValue) {
    return function defaultAutoValueFunction() {
        if (this.isSet)
            return;
        if (this.operator === null)
            return defaultValue;
        // Handle the case when pulling an object from an array the object contains a field
        // which has a defaultValue. We don't want the default value to be returned in this case
        if (this.operator === '$pull')
            return;
        // Handle the case where we are $pushing an object into an array of objects and we
        // want any fields missing from that object to be added if they have default values
        if (this.operator === '$push')
            return defaultValue;
        // If parent is set, we should update this position instead of $setOnInsert
        if (this.parentField().isSet)
            return defaultValue;
        // Make sure the default value is added on upsert insert
        if (this.isUpsert)
            return { $setOnInsert: defaultValue };
    };
}
// Mutates def into standardized object with SimpleSchemaGroup type
function standardizeDefinition(def) {
    const standardizedDef = {};
    for (const prop of Object.keys(def)) {
        if (!oneOfProps.includes(prop)) {
            // @ts-expect-error Copying properties
            standardizedDef[prop] = def[prop];
        }
    }
    // Internally, all definition types are stored as groups for simplicity of access.
    // If we are extending, there may not actually be def.type, but it's okay because
    // it will be added later when the two SimpleSchemaGroups are merged.
    if (def.type instanceof SimpleSchemaGroup_js_1.default) {
        standardizedDef.type = def.type.clone();
    }
    else {
        const groupProps = {};
        for (const prop of Object.keys(def)) {
            if (oneOfProps.includes(prop)) {
                // @ts-expect-error Copying properties
                groupProps[prop] = def[prop];
            }
        }
        standardizedDef.type = new SimpleSchemaGroup_js_1.default(groupProps);
    }
    return standardizedDef;
}
/**
 * @summary Checks and mutates definition. Clone it first.
 *   Throws errors if any problems are found.
 * @param fieldName Name of field / key
 * @param definition Field definition
 * @param options Options
 * @param allKeys Set of all field names / keys in entire schema
 */
function checkAndScrubDefinition(fieldName, definition, options, allKeys) {
    var _a;
    if (definition.type == null)
        throw new Error(`${fieldName} key is missing "type"`);
    // Validate the field definition
    Object.keys(definition).forEach((key) => {
        if (!exports.schemaDefinitionOptions.includes(key)) {
            throw new Error(`Invalid definition for ${fieldName} field: "${key}" is not a supported property`);
        }
    });
    // Make sure the `type`s are OK
    let couldBeArray = false;
    definition.type.definitions.forEach(({ type }) => {
        if (type == null) {
            throw new Error(`Invalid definition for ${fieldName} field: "type" option is required`);
        }
        if (Array.isArray(type)) {
            throw new Error(`Invalid definition for ${fieldName} field: "type" may not be an array. Change it to Array.`);
        }
        if (type.constructor === Object && (0, index_js_1.isEmptyObject)(type)) {
            throw new Error(`Invalid definition for ${fieldName} field: "type" may not be an object. Change it to Object`);
        }
        if (type === Array)
            couldBeArray = true;
        if (SimpleSchema.isSimpleSchema(type)) {
            // @ts-expect-error
            Object.keys(type._schema).forEach((subKey) => {
                const newKey = `${fieldName}.${subKey}`;
                if (allKeys.has(newKey)) {
                    throw new Error(`The type for "${fieldName}" is set to a SimpleSchema instance that defines "${newKey}", but the parent SimpleSchema instance also tries to define "${newKey}"`);
                }
            });
        }
    });
    // If at least one of the possible types is Array, then make sure we have a
    // definition for the array items, too.
    if (couldBeArray && !allKeys.has(`${fieldName}.$`)) {
        throw new Error(`"${fieldName}" is Array type but the schema does not include a "${fieldName}.$" definition for the array items"`);
    }
    // defaultValue -> autoValue
    // We support defaultValue shortcut by converting it immediately into an
    // autoValue.
    if ('defaultValue' in definition) {
        if ('autoValue' in definition && ((_a = definition.autoValue) === null || _a === void 0 ? void 0 : _a.isDefault) !== true) {
            console.warn(`SimpleSchema: Found both autoValue and defaultValue options for "${fieldName}". Ignoring defaultValue.`);
        }
        else {
            if (fieldName.endsWith('.$')) {
                throw new Error('An array item field (one that ends with ".$") cannot have defaultValue.');
            }
            definition.autoValue = getDefaultAutoValueFunction(definition.defaultValue);
            definition.autoValue.isDefault = true;
        }
    }
    // REQUIREDNESS
    if (fieldName.endsWith('.$')) {
        definition.optional = true;
    }
    else if (!Object.prototype.hasOwnProperty.call(definition, 'optional')) {
        if (Object.prototype.hasOwnProperty.call(definition, 'required')) {
            if (typeof definition.required === 'function') {
                // Save a reference to the `required` fn because
                // we are going to delete it from `definition` below
                const requiredFn = definition.required;
                definition.optional = function optional(...args) {
                    return !requiredFn.apply(this, args);
                };
            }
            else {
                definition.optional = definition.required !== true;
            }
        }
        else {
            definition.optional = options.requiredByDefault === false;
        }
    }
    delete definition.required;
    // LABELS
    if (!Object.prototype.hasOwnProperty.call(definition, 'label')) {
        if (options.defaultLabel != null) {
            definition.label = options.defaultLabel;
        }
        else if (SimpleSchema.defaultLabel != null) {
            definition.label = SimpleSchema.defaultLabel;
        }
        else {
            definition.label = inflectedLabel(fieldName, options.humanizeAutoLabels);
        }
    }
}
function getPickOrOmit(type) {
    return function pickOrOmit(...args) {
        // If they are picking/omitting an object or array field, we need to also include everything under it
        const newSchema = {};
        // @ts-expect-error
        this._schemaKeys.forEach((key) => {
            // Pick/omit it if it IS in the array of keys they want OR if it
            // STARTS WITH something that is in the array plus a period
            const includeIt = args.some((wantedField) => key === wantedField || key.indexOf(`${wantedField}.`) === 0);
            if ((includeIt && type === 'pick') || (!includeIt && type === 'omit')) {
                // @ts-expect-error
                newSchema[key] = this._schema[key];
            }
        });
        return this._copyWithSchema(newSchema);
    };
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"defaultMessages.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/defaultMessages.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultErrorMessage = void 0;
const defaultMessages = {
    badDate: (_, label) => `${String(label)} is not a valid date`,
    expectedType: ({ dataType }, label) => `${String(label)} must be of type ${String(dataType)}`,
    keyNotInSchema: ({ name }) => `${name} is not allowed by the schema`,
    maxCount: ({ maxCount }) => `You cannot specify more than ${String(maxCount)} values`,
    maxDate: ({ max }, label) => `${String(label)} cannot be after ${String(max)}`,
    maxNumber: ({ max }, label) => `${String(label)} cannot exceed ${String(max)}`,
    maxNumberExclusive: ({ max }, label) => `${String(label)} must be less than ${String(max)}`,
    maxString: ({ max }, label) => `${String(label)} cannot exceed ${String(max)} characters`,
    minCount: ({ minCount }) => `You must specify at least ${String(minCount)} values`,
    minDate: ({ min }, label) => `${String(label)} must be on or after ${String(min)}`,
    minNumber: ({ min }, label) => `${String(label)} must be at least ${String(min)}`,
    minNumberExclusive: ({ min }, label) => `${String(label)} must be greater than ${String(min)}`,
    minString: ({ min }, label) => `${String(label)} must be at least ${String(min)} characters`,
    noDecimal: (_, label) => `${String(label)} must be an integer`,
    notAllowed: ({ value }) => `${String(value)} is not an allowed value`,
    regEx: (_, label) => `${String(label)} failed regular expression validation`,
    required: (_, label) => `${String(label)} is required`
};
function getDefaultErrorMessage(errorInfo, label) {
    const msgFn = defaultMessages[errorInfo.type];
    return typeof msgFn === 'function' ? msgFn(errorInfo, label) : `${errorInfo.type} ${errorInfo.name}`;
}
exports.getDefaultErrorMessage = getDefaultErrorMessage;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"errors.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/errors.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientError = void 0;
class ClientError extends Error {
    constructor(message, error) {
        super(message);
        this.errorType = 'ClientError';
        this.name = 'ClientError';
        this.error = error;
    }
}
exports.ClientError = ClientError;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"expandShorthand.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/expandShorthand.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_object_1 = __importDefault(require("mongo-object"));
/**
 * Clones a schema object, expanding shorthand as it does it.
 */
function expandShorthand(schema) {
    const schemaClone = {};
    Object.keys(schema).forEach((key) => {
        const definition = schema[key];
        // CASE 1: Not shorthand. Just clone
        if (mongo_object_1.default.isBasicObject(definition)) {
            // @ts-expect-error We're pretty sure it's correct
            schemaClone[key] = Object.assign({}, definition);
            return;
        }
        // CASE 2: The definition is an array of some type
        if (Array.isArray(definition)) {
            if (Array.isArray(definition[0])) {
                throw new Error(`Array shorthand may only be used to one level of depth (${key})`);
            }
            const type = definition[0];
            schemaClone[key] = { type: Array };
            // Also add the item key definition
            const itemKey = `${key}.$`;
            if (schema[itemKey] !== undefined) {
                throw new Error(`Array shorthand used for ${key} field but ${key}.$ key is already in the schema`);
            }
            if (type instanceof RegExp) {
                schemaClone[itemKey] = { type: String, regEx: type };
            }
            else {
                schemaClone[itemKey] = { type };
            }
            return;
        }
        // CASE 3: The definition is a regular expression
        if (definition instanceof RegExp) {
            schemaClone[key] = {
                type: String,
                regEx: definition
            };
            return;
        }
        // CASE 4: The definition is something, a type
        schemaClone[key] = { type: definition };
    });
    return schemaClone;
}
exports.default = expandShorthand;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"SimpleSchemaGroup.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/SimpleSchemaGroup.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_object_1 = __importDefault(require("mongo-object"));
class SimpleSchemaGroup {
    constructor(...definitions) {
        this.definitions = [];
        this.definitions = definitions.map((definition) => {
            if (mongo_object_1.default.isBasicObject(definition)) {
                return Object.assign({}, definition);
            }
            if (definition instanceof RegExp) {
                return {
                    type: String,
                    regEx: definition
                };
            }
            return { type: definition };
        });
    }
    get singleType() {
        return this.definitions[0].type;
    }
    clone() {
        return new SimpleSchemaGroup(...this.definitions);
    }
    extend(otherGroup) {
        // We extend based on index being the same. No better way I can think of at the moment.
        this.definitions = this.definitions.map((def, index) => {
            const otherDef = otherGroup.definitions[index];
            if (otherDef === undefined)
                return def;
            return Object.assign(Object.assign({}, def), otherDef);
        });
    }
}
exports.default = SimpleSchemaGroup;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utility":{"index.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/utility/index.js                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanize = exports.looksLikeModifier = exports.isObjectWeShouldTraverse = exports.isEmptyObject = exports.getParentOfKey = exports.getLastPartOfKey = exports.getKeysWithValueInObj = exports.forEachKeyAncestor = exports.dateToDateString = exports.appendAffectedKey = void 0;
function appendAffectedKey(affectedKey, key) {
    if (key === '$each')
        return affectedKey;
    return affectedKey == null ? key : `${affectedKey}.${key}`;
}
exports.appendAffectedKey = appendAffectedKey;
/**
 * Given a Date instance, returns a date string of the format YYYY-MM-DD
 */
function dateToDateString(date) {
    let month = date.getUTCMonth() + 1;
    if (month < 10)
        month = `0${month}`;
    let day = date.getUTCDate();
    if (day < 10)
        day = `0${day}`;
    return `${date.getUTCFullYear()}-${month}-${day}`;
}
exports.dateToDateString = dateToDateString;
/**
 * Run loopFunc for each ancestor key in a dot-delimited key. For example,
 * if key is "a.b.c", loopFunc will be called first with ('a.b', 'c') and then with ('a', 'b.c')
 */
function forEachKeyAncestor(key, loopFunc) {
    let lastDot;
    // Iterate the dot-syntax hierarchy
    let ancestor = key;
    do {
        lastDot = ancestor.lastIndexOf('.');
        if (lastDot !== -1) {
            ancestor = ancestor.slice(0, lastDot);
            const remainder = key.slice(ancestor.length + 1);
            loopFunc(ancestor, remainder); // Remove last path component
        }
    } while (lastDot !== -1);
}
exports.forEachKeyAncestor = forEachKeyAncestor;
/**
 * Returns an array of keys that are in obj, have a value
 * other than null or undefined, and start with matchKey
 * plus a dot.
 */
function getKeysWithValueInObj(obj, matchKey) {
    const keysWithValue = [];
    const keyAdjust = (key) => key.slice(0, matchKey.length + 1);
    const matchKeyPlusDot = `${matchKey}.`;
    Object.keys(obj !== null && obj !== void 0 ? obj : {}).forEach((key) => {
        const val = obj[key];
        if (val === undefined || val === null)
            return;
        if (keyAdjust(key) === matchKeyPlusDot) {
            keysWithValue.push(key);
        }
    });
    return keysWithValue;
}
exports.getKeysWithValueInObj = getKeysWithValueInObj;
/**
 * Returns the ending of key, after stripping out the beginning
 * ancestorKey and any array placeholders
 *
 * getLastPartOfKey('a.b.c', 'a') returns 'b.c'
 * getLastPartOfKey('a.b.$.c', 'a.b') returns 'c'
 */
function getLastPartOfKey(key, ancestorKey) {
    let lastPart = '';
    const startString = `${ancestorKey}.`;
    if (key.indexOf(startString) === 0) {
        lastPart = key.replace(startString, '');
        if (lastPart.startsWith('$.'))
            lastPart = lastPart.slice(2);
    }
    return lastPart;
}
exports.getLastPartOfKey = getLastPartOfKey;
/**
 * Returns the parent of a key. For example, returns 'a.b' when passed 'a.b.c'.
 * If no parent, returns an empty string. If withEndDot is true, the return
 * value will have a dot appended when it isn't an empty string.
 */
function getParentOfKey(key, withEndDot = false) {
    const lastDot = key.lastIndexOf('.');
    return lastDot === -1 ? '' : key.slice(0, lastDot + Number(withEndDot));
}
exports.getParentOfKey = getParentOfKey;
/**
 * @summary Determines whether the object has any "own" properties
 * @param {Object} obj Object to test
 * @return {Boolean} True if it has no "own" properties
 */
function isEmptyObject(obj) {
    /* eslint-disable no-restricted-syntax */
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            return false;
        }
    }
    /* eslint-enable no-restricted-syntax */
    return true;
}
exports.isEmptyObject = isEmptyObject;
function isObjectWeShouldTraverse(val) {
    // Some of these types don't exist in old browsers so we'll catch and return false in those cases
    try {
        if (val !== Object(val))
            return false;
        // There are some object types that we know we shouldn't traverse because
        // they will often result in overflows and it makes no sense to validate them.
        if (val instanceof Date)
            return false;
        if (val instanceof Int8Array)
            return false;
        if (val instanceof Uint8Array)
            return false;
        if (val instanceof Uint8ClampedArray)
            return false;
        if (val instanceof Int16Array)
            return false;
        if (val instanceof Uint16Array)
            return false;
        if (val instanceof Int32Array)
            return false;
        if (val instanceof Uint32Array)
            return false;
        if (val instanceof Float32Array)
            return false;
        if (val instanceof Float64Array)
            return false;
    }
    catch (e) {
        return false;
    }
    return true;
}
exports.isObjectWeShouldTraverse = isObjectWeShouldTraverse;
/**
 * Returns true if any of the keys of obj start with a $
 */
function looksLikeModifier(obj) {
    return Object.keys(obj !== null && obj !== void 0 ? obj : {}).some((key) => key.substring(0, 1) === '$');
}
exports.looksLikeModifier = looksLikeModifier;
var humanize_js_1 = require("./humanize.js");
Object.defineProperty(exports, "humanize", { enumerable: true, get: function () { return humanize_js_1.humanize; } });

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"humanize.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/utility/humanize.js                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
/*
  Code source:
    https://github.com/jxson/string-humanize
    https://github.com/jxson/string-capitalize
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanize = exports.extname = exports.underscore = exports.capitalize = void 0;
function capitalize(text) {
    text = text !== null && text !== void 0 ? text : '';
    text = text.trim();
    if (text[0] !== undefined) {
        text = text[0].toUpperCase() + text.substr(1).toLowerCase();
    }
    // Do "ID" instead of "id" or "Id"
    text = text.replace(/\bid\b/g, 'ID');
    text = text.replace(/\bId\b/g, 'ID');
    return text;
}
exports.capitalize = capitalize;
function underscore(text) {
    text = text !== null && text !== void 0 ? text : '';
    text = text.toString(); // might be a number
    text = text.trim();
    text = text.replace(/([a-z\d])([A-Z]+)/g, '$1_$2');
    text = text.replace(/[-\s]+/g, '_').toLowerCase();
    return text;
}
exports.underscore = underscore;
function extname(text) {
    const index = text.lastIndexOf('.');
    const ext = text.substring(index, text.length);
    return (index === -1) ? '' : ext;
}
exports.extname = extname;
function humanize(text) {
    text = text !== null && text !== void 0 ? text : '';
    text = text.toString(); // might be a number
    text = text.trim();
    text = text.replace(extname(text), '');
    text = underscore(text);
    text = text.replace(/[\W_]+/g, ' ');
    return capitalize(text);
}
exports.humanize = humanize;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"ValidationContext.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/ValidationContext.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_object_1 = __importDefault(require("mongo-object"));
const doValidation_js_1 = __importDefault(require("./doValidation.js"));
const index_js_1 = require("./utility/index.js");
class ValidationContext {
    /**
     * @param schema SimpleSchema instance to use for validation
     * @param name Optional context name, accessible on context.name.
     */
    constructor(schema, name) {
        this._validationErrors = [];
        this.name = name;
        this._simpleSchema = schema;
        this._schema = schema.schema();
        this._schemaKeys = Object.keys(this._schema);
    }
    setValidationErrors(errors) {
        this._validationErrors = errors;
    }
    addValidationErrors(errors) {
        errors.forEach((error) => this._validationErrors.push(error));
    }
    /**
     * Reset the validationErrors array
     */
    reset() {
        this.setValidationErrors([]);
    }
    /**
     * @param key The key to get an error for
     * @param genericKey The generic version of this key, if already known
     * @returns The first validation error for this key, if any
     */
    getErrorForKey(key, genericKey = mongo_object_1.default.makeKeyGeneric(key)) {
        const errors = this._validationErrors;
        const errorForKey = errors.find((error) => error.name === key);
        if (errorForKey != null)
            return errorForKey;
        return errors.find((error) => error.name === genericKey);
    }
    /**
     * @param key The key to check validity for
     * @param genericKey The generic version of this key, if already known
     * @returns True if this key is currently invalid; otherwise false.
     */
    keyIsInvalid(key, genericKey = mongo_object_1.default.makeKeyGeneric(key)) {
        return this.getErrorForKey(key, genericKey) != null;
    }
    /**
     * @param key The key get the first error message for
     * @param genericKey The generic version of this key, if already known
     * @returns The message for the first error for this key, or an empty string
     */
    keyErrorMessage(key, genericKey = mongo_object_1.default.makeKeyGeneric(key)) {
        const errorObj = this.getErrorForKey(key, genericKey);
        if (errorObj == null)
            return '';
        return this._simpleSchema.messageForError(errorObj);
    }
    /**
     * Validates the object against the SimpleSchema and sets an array of error objects
     * @param obj Object to be validated
     * @param options Validation options
     * @returns True if valid; otherwise false
     */
    validate(obj, { extendedCustomContext = {}, ignore: ignoreTypes = [], keys: keysToValidate, modifier: isModifier = false, mongoObject, upsert: isUpsert = false } = {}) {
        // First do some basic checks of the object, and throw errors if necessary
        if (obj == null || (typeof obj !== 'object' && typeof obj !== 'function')) {
            throw new Error('The first argument of validate() must be an object');
        }
        if (!isModifier && (0, index_js_1.looksLikeModifier)(obj)) {
            throw new Error('When the validation object contains mongo operators, you must set the modifier option to true');
        }
        const validationErrors = (0, doValidation_js_1.default)({
            extendedCustomContext,
            ignoreTypes,
            isModifier,
            isUpsert,
            keysToValidate,
            mongoObject,
            obj,
            schema: this._simpleSchema,
            validationContext: this
        });
        if (keysToValidate != null) {
            // We have only revalidated the listed keys, so if there
            // are any other existing errors that are NOT in the keys list,
            // we should keep these errors.
            for (const error of this._validationErrors) {
                const wasValidated = keysToValidate.some((key) => key === error.name || error.name.startsWith(`${key}.`));
                if (!wasValidated)
                    validationErrors.push(error);
            }
        }
        this.setValidationErrors(validationErrors);
        // Return true if it was valid; otherwise, return false
        return validationErrors.length === 0;
    }
    isValid() {
        return this._validationErrors.length === 0;
    }
    validationErrors() {
        return this._validationErrors;
    }
    clean(doc, options = {}) {
        return this._simpleSchema.clean(doc, options);
    }
}
exports.default = ValidationContext;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"doValidation.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/doValidation.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validateDocument_js_1 = __importDefault(require("./validation/validateDocument.js"));
const validateField_js_1 = __importDefault(require("./validation/validateField.js"));
function shouldCheck(operator) {
    if (operator === '$pushAll') {
        throw new Error('$pushAll is not supported; use $push + $each');
    }
    return !['$pull', '$pullAll', '$pop', '$slice'].includes(operator);
}
function doValidation({ extendedCustomContext, ignoreTypes, isModifier, isUpsert, keysToValidate, mongoObject, obj, schema, validationContext }) {
    const validationErrors = [];
    // Kick off the validation
    if (isModifier) {
        // Loop through operators
        for (const [op, opObj] of Object.entries(obj)) {
            // If non-operators are mixed in, throw error
            if (op.slice(0, 1) !== '$') {
                throw new Error(`Expected '${op}' to be a modifier operator like '$set'`);
            }
            if (!shouldCheck(op))
                continue;
            const presentKeys = Object.keys(opObj);
            const fields = presentKeys.map((opKey) => {
                let value = opObj[opKey];
                if (op === '$push' || op === '$addToSet') {
                    if (typeof value === 'object' && '$each' in value) {
                        value = value.$each;
                    }
                    else {
                        opKey = `${opKey}.0`;
                    }
                }
                return { key: opKey, value };
            });
            // For an upsert, missing props would not be set if an insert is performed,
            // so we check them all with undefined value to force any 'required' checks to fail
            if (isUpsert && (op === '$set' || op === '$setOnInsert')) {
                for (const key of schema.objectKeys()) {
                    if (!presentKeys.includes(key)) {
                        fields.push({ key, value: undefined });
                    }
                }
            }
            for (const field of fields) {
                const fieldErrors = (0, validateField_js_1.default)({
                    affectedKey: field.key,
                    keysToValidate,
                    obj,
                    op,
                    schema,
                    val: field.value,
                    validationContext
                });
                if (fieldErrors.length > 0) {
                    validationErrors.push(...fieldErrors);
                }
            }
        }
    }
    else {
        const fieldErrors = (0, validateField_js_1.default)({
            keysToValidate,
            obj,
            schema,
            val: obj,
            validationContext
        });
        if (fieldErrors.length > 0) {
            validationErrors.push(...fieldErrors);
        }
    }
    const wholeDocumentErrors = (0, validateDocument_js_1.default)({
        extendedCustomContext,
        ignoreTypes,
        isModifier,
        isUpsert,
        keysToValidate,
        mongoObject,
        obj,
        schema,
        validationContext
    });
    if (wholeDocumentErrors.length > 0) {
        validationErrors.push(...wholeDocumentErrors);
    }
    const addedFieldNames = new Set();
    return validationErrors.filter((errObj) => {
        // Remove error types the user doesn't care about
        if ((ignoreTypes === null || ignoreTypes === void 0 ? void 0 : ignoreTypes.includes(errObj.type)) === true)
            return false;
        // Make sure there is only one error per fieldName
        if (addedFieldNames.has(errObj.name))
            return false;
        addedFieldNames.add(errObj.name);
        return true;
    });
}
exports.default = doValidation;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validation":{"validateDocument.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/validateDocument.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../SimpleSchema.js");
function validateDocument({ extendedCustomContext, ignoreTypes, isModifier, isUpsert, keysToValidate, mongoObject, obj, schema, validationContext }) {
    // @ts-expect-error
    const docValidators = schema._docValidators.concat(
    // @ts-expect-error
    SimpleSchema_js_1.SimpleSchema._docValidators);
    const docValidatorContext = Object.assign({ ignoreTypes,
        isModifier,
        isUpsert,
        keysToValidate,
        mongoObject,
        obj,
        schema,
        validationContext }, (extendedCustomContext !== null && extendedCustomContext !== void 0 ? extendedCustomContext : {}));
    const validationErrors = [];
    for (const docValidator of docValidators) {
        const errors = docValidator.call(docValidatorContext, obj);
        if (!Array.isArray(errors)) {
            throw new Error('Custom doc validator must return an array of error objects');
        }
        if (errors.length > 0) {
            validationErrors.push(...errors);
        }
    }
    return validationErrors;
}
exports.default = validateDocument;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"validateField.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/validateField.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_object_1 = __importDefault(require("mongo-object"));
const SimpleSchema_js_1 = require("../SimpleSchema.js");
const index_js_1 = require("../utility/index.js");
const allowedValuesValidator_js_1 = __importDefault(require("./allowedValuesValidator.js"));
const requiredValidator_js_1 = __importDefault(require("./requiredValidator.js"));
const index_js_2 = __importDefault(require("./typeValidator/index.js"));
function shouldValidateKey({ affectedKey, affectedKeyGeneric, keysToValidate }) {
    if (keysToValidate == null)
        return true;
    return keysToValidate.some((keyToValidate) => {
        var _a, _b;
        return keyToValidate === affectedKey ||
            keyToValidate === affectedKeyGeneric ||
            ((_a = affectedKey === null || affectedKey === void 0 ? void 0 : affectedKey.startsWith(`${keyToValidate}.`)) !== null && _a !== void 0 ? _a : false) ||
            ((_b = affectedKeyGeneric === null || affectedKeyGeneric === void 0 ? void 0 : affectedKeyGeneric.startsWith(`${keyToValidate}.`)) !== null && _b !== void 0 ? _b : false);
    });
}
function shouldCheckValue({ affectedKeyGeneric, isOptional, op, val }) {
    if (op === '$unset')
        return false;
    if (op === '$rename')
        return false;
    if (val === undefined || val === null) {
        return (affectedKeyGeneric === null || affectedKeyGeneric === void 0 ? void 0 : affectedKeyGeneric.slice(-2)) === '.$' &&
            val === null &&
            isOptional !== true;
    }
    return true;
}
function makeGenericKeyOrThrow(key) {
    const genericKey = mongo_object_1.default.makeKeyGeneric(key);
    if (genericKey == null)
        throw new Error(`Failed to get generic key for key "${key}"`);
    return genericKey;
}
/**
 * Validate a single field within an object being validated
 * @returns Array of all validation errors
 */
function validateField(props) {
    const { affectedKey, extendedCustomContext, isInArrayItemObject = false, isInSubObject = false, keysToValidate, obj, op = null, schema, validationContext } = props;
    let { val } = props;
    let affectedKeyGeneric;
    let def;
    const fieldValidationErrors = [];
    let mongoObject;
    function getFieldInfo(key) {
        var _a;
        // Create mongoObject if necessary, cache for speed
        if (mongoObject === undefined)
            mongoObject = new mongo_object_1.default(obj, schema.blackboxKeys());
        const keyInfo = (_a = mongoObject.getInfoForKey(key)) !== null && _a !== void 0 ? _a : {
            operator: null,
            value: undefined
        };
        return Object.assign(Object.assign({}, keyInfo), { isSet: keyInfo.value !== undefined });
    }
    if (affectedKey !== undefined) {
        // When we hit a blackbox key, we don't progress any further
        if (schema.keyIsInBlackBox(affectedKey))
            return [];
        affectedKeyGeneric = makeGenericKeyOrThrow(affectedKey);
        // Prepare the context object for the rule functions
        const fieldParentNameWithEndDot = (0, index_js_1.getParentOfKey)(affectedKey, true);
        const fieldParentName = fieldParentNameWithEndDot.slice(0, -1);
        const functionsContext = Object.assign({ field(fName) {
                return getFieldInfo(fName);
            }, genericKey: affectedKeyGeneric, isInArrayItemObject,
            isInSubObject, isModifier: op != null, isSet: val !== undefined, key: affectedKey, obj, operator: op, parentField() {
                return getFieldInfo(fieldParentName);
            },
            siblingField(fName) {
                return getFieldInfo(fieldParentNameWithEndDot + fName);
            },
            validationContext, value: val }, (extendedCustomContext !== null && extendedCustomContext !== void 0 ? extendedCustomContext : {}));
        if (shouldValidateKey({
            affectedKey,
            affectedKeyGeneric: affectedKeyGeneric !== null && affectedKeyGeneric !== void 0 ? affectedKeyGeneric : undefined,
            keysToValidate
        })) {
            // Perform validation for this key
            for (const currentDef of schema.getDefinitions(affectedKey, null, functionsContext)) {
                def = currentDef;
                // Whenever we try a new possible schema, clear any field errors from the previous tried schema
                fieldValidationErrors.length = 0;
                const validatorContext = Object.assign(Object.assign({}, functionsContext), { addValidationErrors(errors) {
                        errors.forEach((error) => fieldValidationErrors.push(error));
                    }, 
                    // Value checks are not necessary for null or undefined values, except
                    // for non-optional null array items, or for $unset or $rename values
                    valueShouldBeChecked: shouldCheckValue({
                        affectedKeyGeneric: affectedKeyGeneric !== null && affectedKeyGeneric !== void 0 ? affectedKeyGeneric : undefined,
                        isOptional: currentDef.optional,
                        op,
                        val
                    }) });
                // Loop through each of the definitions in the SimpleSchemaGroup.
                // If the value matches any, we are valid and can stop checking the rest.
                for (const [typeIndex, typeDef] of currentDef.type.entries()) {
                    // If the type is SimpleSchema.Any, then it is valid
                    if (typeDef === SimpleSchema_js_1.SimpleSchema.Any)
                        break;
                    const nonAnyTypeDefinition = typeDef;
                    const { type } = currentDef, definitionWithoutType = __rest(currentDef
                    // @ts-expect-error
                    , ["type"]);
                    // @ts-expect-error
                    const finalValidatorContext = Object.assign(Object.assign({}, validatorContext), { 
                        // Take outer definition props like "optional" and "label"
                        // and add them to inner props like "type" and "min"
                        definition: Object.assign(Object.assign({}, definitionWithoutType), nonAnyTypeDefinition) });
                    // Order of these validators is important
                    const customFieldValidator = nonAnyTypeDefinition.custom;
                    const fieldValidators = [
                        requiredValidator_js_1.default,
                        index_js_2.default,
                        allowedValuesValidator_js_1.default,
                        ...(customFieldValidator == null ? [] : [customFieldValidator]),
                        // @ts-expect-error It's fine to access private method from here
                        ...schema._validators,
                        // @ts-expect-error It's fine to access private method from here
                        ...SimpleSchema_js_1.SimpleSchema._validators
                    ];
                    const fieldValidationErrorsForThisType = [];
                    for (const fieldValidator of fieldValidators) {
                        const result = fieldValidator.call(finalValidatorContext);
                        // If the validator returns a string, assume it is the error type.
                        if (typeof result === 'string') {
                            fieldValidationErrorsForThisType.push({
                                name: affectedKey,
                                type: result,
                                value: val
                            });
                        }
                        // If the validator returns an object, assume it is an error object.
                        if (typeof result === 'object' && result !== null) {
                            fieldValidationErrorsForThisType.push(Object.assign({ name: affectedKey, value: val }, result));
                        }
                    }
                    if (val !== undefined && SimpleSchema_js_1.SimpleSchema.isSimpleSchema(nonAnyTypeDefinition.type)) {
                        const itemErrors = validateField({
                            extendedCustomContext,
                            keysToValidate,
                            obj: val,
                            op,
                            schema: nonAnyTypeDefinition.type,
                            val,
                            validationContext
                        });
                        if (itemErrors.length > 0) {
                            fieldValidationErrorsForThisType.push(...itemErrors.map((error) => (Object.assign(Object.assign({}, error), { name: `${affectedKey}.${error.name}` }))));
                        }
                    }
                    // As soon as we find a type for which the value is valid, stop checking more
                    if (fieldValidationErrorsForThisType.length === 0) {
                        // One we have chosen a valid schema, there is no need to validate the
                        // properties of this object because we validated all the way down
                        if (SimpleSchema_js_1.SimpleSchema.isSimpleSchema(nonAnyTypeDefinition.type)) {
                            return fieldValidationErrors;
                        }
                        break;
                    }
                    if (typeIndex === currentDef.type.length - 1) {
                        fieldValidationErrors.push(...fieldValidationErrorsForThisType);
                    }
                }
                // If it's valid with this schema, we don't need to try any more
                if (fieldValidationErrors.length === 0)
                    break;
            }
            // Mark invalid if not found in schema
            if (def == null) {
                // We don't need KEY_NOT_IN_SCHEMA error for $unset and we also don't need to continue
                if (op === '$unset' ||
                    (op === '$currentDate' && affectedKey.endsWith('.$type'))) {
                    return [];
                }
                return [
                    {
                        name: affectedKey,
                        type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
                        value: val
                    }
                ];
            }
            // For $rename, make sure that the new name is allowed by the schema
            if (op === '$rename' && !schema.allowsKey(val)) {
                return [
                    {
                        name: val,
                        type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.KEY_NOT_IN_SCHEMA,
                        value: null
                    }
                ];
            }
        }
        // Loop through arrays
        if (Array.isArray(val)) {
            for (const [index, itemValue] of val.entries()) {
                const itemErrors = validateField(Object.assign(Object.assign({}, props), { affectedKey: `${affectedKey}.${index}`, val: itemValue }));
                if (itemErrors.length > 0) {
                    fieldValidationErrors.push(...itemErrors);
                }
            }
            return fieldValidationErrors;
        }
    }
    // If affectedKeyGeneric is undefined due to this being the first run of this
    // function, objectKeys will return the top-level keys.
    const childKeys = schema.objectKeys(affectedKeyGeneric !== null && affectedKeyGeneric !== void 0 ? affectedKeyGeneric : undefined);
    // Temporarily convert missing objects to empty objects
    // so that the looping code will be called and required
    // descendent keys can be validated.
    if ((val === undefined || val === null) &&
        ((def == null) || (def.optional !== true && childKeys.length > 0))) {
        val = {};
    }
    // Loop through object keys
    if ((0, index_js_1.isObjectWeShouldTraverse)(val) &&
        // @ts-expect-error
        ((def == null) || !schema._blackboxKeys.has(affectedKey !== null && affectedKey !== void 0 ? affectedKey : ''))) {
        // Check all present keys plus all keys defined by the schema.
        // This allows us to detect extra keys not allowed by the schema plus
        // any missing required keys, and to run any custom functions for other keys.
        for (const key of new Set([...Object.keys(val), ...childKeys])) {
            const childFieldErrors = validateField(Object.assign(Object.assign({}, props), { affectedKey: (0, index_js_1.appendAffectedKey)(affectedKey, key), 
                // If this object is within an array, make sure we check for required as if it's not a modifier
                isInArrayItemObject: (affectedKeyGeneric === null || affectedKeyGeneric === void 0 ? void 0 : affectedKeyGeneric.slice(-2)) === '.$', isInSubObject: true, val: val[key] }));
            if (childFieldErrors.length > 0) {
                fieldValidationErrors.push(...childFieldErrors);
            }
        }
    }
    return fieldValidationErrors;
}
exports.default = validateField;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"allowedValuesValidator.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/allowedValuesValidator.js                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../SimpleSchema.js");
function allowedValuesValidator() {
    if (!this.valueShouldBeChecked)
        return;
    const { allowedValues } = this.definition;
    if (allowedValues == null)
        return;
    let isAllowed;
    // set defined in scope and allowedValues is its instance
    if (typeof Set === 'function' && allowedValues instanceof Set) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        isAllowed = allowedValues.has(this.value);
    }
    else {
        isAllowed = allowedValues.includes(this.value);
    }
    return isAllowed ? true : SimpleSchema_js_1.SimpleSchema.ErrorTypes.VALUE_NOT_ALLOWED;
}
exports.default = allowedValuesValidator;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"requiredValidator.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/requiredValidator.js                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../SimpleSchema.js");
const index_js_1 = require("../utility/index.js");
// Check for missing required values. The general logic is this:
// * If the operator is $unset or $rename, it's invalid.
// * If the value is null, it's invalid.
// * If the value is undefined and one of the following are true, it's invalid:
//     * We're validating a key of a sub-object.
//     * We're validating a key of an object that is an array item.
//     * We're validating a document (as opposed to a modifier).
//     * We're validating a key under the $set operator in a modifier, and it's an upsert.
function requiredValidator() {
    const { definition, isInArrayItemObject, isInSubObject, key, obj, operator, value } = this;
    const { optional } = definition;
    if (optional === true)
        return;
    // If value is null, no matter what, we add required
    if (value === null)
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    // If operator would remove, we add required
    if (operator === '$unset' || operator === '$rename') {
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    }
    // The rest of these apply only if the value is undefined
    if (value !== undefined)
        return;
    // At this point, if it's a normal, non-modifier object, then a missing value is an error
    if (operator == null)
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    // Everything beyond this point deals with modifier objects only
    // We can skip the required check for keys that are ancestors of those in $set or
    // $setOnInsert because they will be created by MongoDB while setting.
    const keysWithValueInSet = (0, index_js_1.getKeysWithValueInObj)(obj.$set, key);
    if (keysWithValueInSet.length > 0)
        return;
    const keysWithValueInSetOnInsert = (0, index_js_1.getKeysWithValueInObj)(obj.$setOnInsert, key);
    if (keysWithValueInSetOnInsert.length > 0)
        return;
    // In the case of $set and $setOnInsert, the value may be undefined here
    // but it is set in another operator. So check that first.
    const fieldInfo = this.field(key);
    if (fieldInfo.isSet && fieldInfo.value !== null)
        return;
    // Required if in an array or sub object
    if (isInArrayItemObject || isInSubObject) {
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    }
    // If we've got this far with an undefined $set or $setOnInsert value, it's a required error.
    if (operator === '$set' || operator === '$setOnInsert') {
        return SimpleSchema_js_1.SimpleSchema.ErrorTypes.REQUIRED;
    }
}
exports.default = requiredValidator;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"typeValidator":{"index.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/typeValidator/index.js                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValueTypeValid = exports.checkValueType = void 0;
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
const checkArrayValue_js_1 = __importDefault(require("./checkArrayValue.js"));
const checkDateValue_js_1 = __importDefault(require("./checkDateValue.js"));
const checkNumberValue_js_1 = __importDefault(require("./checkNumberValue.js"));
const checkStringValue_js_1 = __importDefault(require("./checkStringValue.js"));
function checkValueType(info) {
    const { definition: def, operator: op, value, valueShouldBeChecked } = info;
    if (!valueShouldBeChecked)
        return;
    const expectedType = def.type;
    if (expectedType === String)
        return (0, checkStringValue_js_1.default)(def, value);
    if (expectedType === Number)
        return (0, checkNumberValue_js_1.default)(def, value, op, false);
    if (expectedType === SimpleSchema_js_1.SimpleSchema.Integer)
        return (0, checkNumberValue_js_1.default)(def, value, op, true);
    if (expectedType === Boolean) {
        // Is it a boolean?
        if (typeof value === 'boolean')
            return;
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Boolean' };
    }
    if (expectedType === Object || SimpleSchema_js_1.SimpleSchema.isSimpleSchema(expectedType)) {
        // Is it an object?
        if (value === Object(value) &&
            typeof value[Symbol.iterator] !== 'function' &&
            !(value instanceof Date)) {
            return;
        }
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Object' };
    }
    if (expectedType === Array)
        return (0, checkArrayValue_js_1.default)(def, value);
    if (expectedType instanceof Function) {
        // Generic constructor checks
        if (!(value instanceof expectedType)) {
            // https://docs.mongodb.com/manual/reference/operator/update/currentDate/
            const dateTypeIsOkay = expectedType === Date &&
                op === '$currentDate' &&
                (value === true || JSON.stringify(value) === '{"$type":"date"}');
            if (expectedType !== Date || !dateTypeIsOkay) {
                return {
                    type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE,
                    dataType: expectedType.name
                };
            }
        }
        // Date checks
        if (expectedType === Date) {
            // https://docs.mongodb.com/manual/reference/operator/update/currentDate/
            if (op === '$currentDate') {
                return (0, checkDateValue_js_1.default)(def, new Date());
            }
            return (0, checkDateValue_js_1.default)(def, value);
        }
    }
}
exports.checkValueType = checkValueType;
function isValueTypeValid(typeDefinitions, value, operator) {
    return typeDefinitions.some((definition) => {
        const typeValidationError = checkValueType({
            valueShouldBeChecked: true,
            definition,
            value,
            operator
        });
        return typeValidationError === undefined;
    });
}
exports.isValueTypeValid = isValueTypeValid;
function typeValidator() {
    return checkValueType(this);
}
exports.default = typeValidator;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkArrayValue.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/typeValidator/checkArrayValue.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
function checkArrayValue(def, value) {
    // Is it an array?
    if (!Array.isArray(value)) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'Array' };
    }
    // Are there fewer than the minimum number of items in the array?
    if (def.minCount != null && value.length < def.minCount) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_COUNT, minCount: def.minCount };
    }
    // Are there more than the maximum number of items in the array?
    if (def.maxCount != null && value.length > def.maxCount) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_COUNT, maxCount: def.maxCount };
    }
}
exports.default = checkArrayValue;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkDateValue.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/typeValidator/checkDateValue.js                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
const index_js_1 = require("../../utility/index.js");
function checkDateValue(def, value) {
    // Is it an invalid date?
    if (isNaN(value.getTime())) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.BAD_DATE };
    }
    // Is it earlier than the minimum date?
    if (def.min !== undefined &&
        typeof def.min.getTime === 'function' &&
        def.min.getTime() > value.getTime()) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_DATE,
            min: (0, index_js_1.dateToDateString)(def.min)
        };
    }
    // Is it later than the maximum date?
    if (def.max !== undefined &&
        typeof def.max.getTime === 'function' &&
        def.max.getTime() < value.getTime()) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_DATE,
            max: (0, index_js_1.dateToDateString)(def.max)
        };
    }
}
exports.default = checkDateValue;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkNumberValue.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/typeValidator/checkNumberValue.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
function checkNumberValue(def, value, op, expectsInteger) {
    // Is it a valid number?
    if (typeof value !== 'number' || isNaN(value)) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE,
            dataType: expectsInteger ? 'Integer' : 'Number'
        };
    }
    // Assuming we are not incrementing, is the value less than the maximum value?
    if (op !== '$inc' &&
        def.max !== null &&
        (def.exclusiveMax === true
            ? def.max <= value
            : def.max < value)) {
        return {
            type: def.exclusiveMax === true
                ? SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_NUMBER_EXCLUSIVE
                : SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_NUMBER,
            max: def.max
        };
    }
    // Assuming we are not incrementing, is the value more than the minimum value?
    if (op !== '$inc' &&
        def.min !== null &&
        (def.exclusiveMin === true
            ? def.min >= value
            : def.min > value)) {
        return {
            type: def.exclusiveMin === true
                ? SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_NUMBER_EXCLUSIVE
                : SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_NUMBER,
            min: def.min
        };
    }
    // Is it an integer if we expect an integer?
    if (expectsInteger && !Number.isInteger(value)) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MUST_BE_INTEGER };
    }
}
exports.default = checkNumberValue;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"checkStringValue.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/validation/typeValidator/checkStringValue.js                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SimpleSchema_js_1 = require("../../SimpleSchema.js");
function checkStringValue(def, value) {
    // Is it a String?
    if (typeof value !== 'string') {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.EXPECTED_TYPE, dataType: 'String' };
    }
    // Is the string too long?
    if (def.max !== null && def.max < value.length) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MAX_STRING, max: def.max };
    }
    // Is the string too short?
    if (def.min !== null && def.min > value.length) {
        return { type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.MIN_STRING, min: def.min };
    }
    // Does the string match the regular expression?
    if ((def.skipRegExCheckForEmptyStrings !== true || value !== '') &&
        def.regEx instanceof RegExp &&
        !def.regEx.test(value)) {
        return {
            type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION,
            regExp: def.regEx.toString()
        };
    }
    // If regEx is an array of regular expressions, does the string match all of them?
    if (Array.isArray(def.regEx)) {
        let regExError;
        def.regEx.every((re) => {
            if (!re.test(value)) {
                regExError = {
                    type: SimpleSchema_js_1.SimpleSchema.ErrorTypes.FAILED_REGULAR_EXPRESSION,
                    regExp: re.toString()
                };
                return false;
            }
            return true;
        });
        if (regExError !== undefined)
            return regExError;
    }
}
exports.default = checkStringValue;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"toJsonSchema.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/simpl-schema/dist/cjs/toJsonSchema.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJsonSchema = void 0;
const SimpleSchema_js_1 = require("./SimpleSchema.js");
const jsonSchemaVersion = 'https://json-schema.org/draft/2020-12/schema';
function toJSArray(ss, key, fieldDef) {
    const itemSchema = fieldDefToJsonSchema(ss, `${key}.$`);
    if (itemSchema == null)
        return null;
    const arrayDef = {
        type: 'array',
        items: [itemSchema],
        additionalItems: false
    };
    if (fieldDef.minCount !== undefined) {
        arrayDef.minItems = fieldDef.minCount;
    }
    if (fieldDef.maxCount !== undefined) {
        arrayDef.maxItems = fieldDef.maxCount;
    }
    return arrayDef;
}
function toJsProperties(ss) {
    const properties = {};
    const required = [];
    for (const key of ss.objectKeys()) {
        const fieldDef = ss.schema(key);
        if (fieldDef == null)
            continue;
        if (fieldDef.optional !== true)
            required.push(key);
        const schema = fieldDefToJsonSchema(ss, key);
        if (schema != null)
            properties[key] = schema;
    }
    return { properties, required };
}
function toJSObj(simpleSchema, additionalProperties = false) {
    return Object.assign(Object.assign({ type: 'object' }, toJsProperties(simpleSchema)), { additionalProperties });
}
function fieldDefToJsonSchema(ss, key) {
    var _a;
    const fieldDef = ss.schema(key);
    if (fieldDef == null)
        return null;
    const itemSchemas = [];
    for (const fieldTypeDef of fieldDef.type.definitions) {
        let itemSchema = null;
        switch (fieldTypeDef.type) {
            case String:
                itemSchema = { type: 'string' };
                if (fieldTypeDef.allowedValues !== undefined && typeof fieldTypeDef.allowedValues !== 'function') {
                    itemSchema.enum = [...fieldTypeDef.allowedValues];
                }
                if (fieldTypeDef.max !== undefined && typeof fieldTypeDef.max !== 'function') {
                    itemSchema.maxLength = fieldTypeDef.max;
                }
                if (fieldTypeDef.min !== undefined && typeof fieldTypeDef.min !== 'function') {
                    itemSchema.minLength = fieldTypeDef.min;
                }
                if (fieldTypeDef.regEx instanceof RegExp) {
                    itemSchema.pattern = String(fieldTypeDef.regEx);
                }
                break;
            case Number:
            case SimpleSchema_js_1.SimpleSchema.Integer:
                itemSchema = { type: fieldTypeDef.type === Number ? 'number' : 'integer' };
                if (fieldTypeDef.max !== undefined && typeof fieldTypeDef.max !== 'function') {
                    if (fieldTypeDef.exclusiveMax === true) {
                        itemSchema.exclusiveMaximum = fieldTypeDef.max;
                    }
                    else {
                        itemSchema.maximum = fieldTypeDef.max;
                    }
                }
                if (fieldTypeDef.min !== undefined && typeof fieldTypeDef.min !== 'function') {
                    if (fieldTypeDef.exclusiveMin === true) {
                        itemSchema.exclusiveMinimum = fieldTypeDef.min;
                    }
                    else {
                        itemSchema.minimum = fieldTypeDef.min;
                    }
                }
                break;
            case Boolean:
                itemSchema = { type: 'boolean' };
                break;
            case Date:
                itemSchema = {
                    type: 'string',
                    format: 'date-time'
                };
                break;
            case Array:
                itemSchema = toJSArray(ss, key, fieldDef);
                break;
            case Object:
                itemSchema = toJSObj(ss.getObjectSchema(key), fieldTypeDef.blackbox);
                break;
            case SimpleSchema_js_1.SimpleSchema.Any:
                // In JSONSchema an empty object means any type
                itemSchema = {};
                break;
            default:
                if (SimpleSchema_js_1.SimpleSchema.isSimpleSchema(fieldTypeDef.type)) {
                    itemSchema = toJSObj(fieldTypeDef.type, fieldTypeDef.blackbox);
                }
                else if (
                // support custom objects
                fieldTypeDef.type instanceof Function) {
                    itemSchema = toJSObj(ss.getObjectSchema(key), fieldTypeDef.blackbox);
                }
                break;
        }
        if (itemSchema != null && fieldTypeDef.defaultValue !== undefined) {
            itemSchema.default = fieldTypeDef.defaultValue;
        }
        if (itemSchema != null)
            itemSchemas.push(itemSchema);
    }
    if (itemSchemas.length > 1) {
        return { anyOf: itemSchemas };
    }
    return (_a = itemSchemas[0]) !== null && _a !== void 0 ? _a : null;
}
/**
 * Convert a SimpleSchema to a JSONSchema Document.
 *
 * Notes:
 * - Date fields will become string fields with built-in 'date-time' format.
 * - JSONSchema does not support minimum or maximum values for date fields
 * - Custom validators are ignored
 * - Field definition properties that are a function are ignored
 * - Custom objects are treated as regular objects
 *
 * @param simpleSchema SimpleSchema instance to convert
 * @param id Optional ID to use for the `$id` field
 * @returns JSONSchema Document
 */
function toJsonSchema(simpleSchema, id) {
    return Object.assign(Object.assign(Object.assign({}, (id != null ? { $id: id } : {})), { $schema: jsonSchemaVersion }), toJSObj(simpleSchema));
}
exports.toJsonSchema = toJsonSchema;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"clone":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/clone/package.json                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "clone",
  "version": "2.1.2",
  "main": "clone.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"clone.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/clone/clone.js                                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"mongo-object":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/mongo-object/package.json                                                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "mongo-object",
  "version": "3.0.1",
  "main": "./dist/cjs/main.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"dist":{"cjs":{"main.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/mongo-object/dist/cjs/main.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoObject = exports.reportNulls = exports.makeKeyGeneric = exports.keyToPosition = exports.isBasicObject = exports.genericKeyAffectsOtherGenericKey = exports.extractOp = exports.expandKey = exports.cleanNulls = exports.appendAffectedKey = void 0;
const mongo_object_js_1 = __importDefault(require("./mongo-object.js"));
exports.MongoObject = mongo_object_js_1.default;
var util_js_1 = require("./util.js");
Object.defineProperty(exports, "appendAffectedKey", { enumerable: true, get: function () { return util_js_1.appendAffectedKey; } });
Object.defineProperty(exports, "cleanNulls", { enumerable: true, get: function () { return util_js_1.cleanNulls; } });
Object.defineProperty(exports, "expandKey", { enumerable: true, get: function () { return util_js_1.expandKey; } });
Object.defineProperty(exports, "extractOp", { enumerable: true, get: function () { return util_js_1.extractOp; } });
Object.defineProperty(exports, "genericKeyAffectsOtherGenericKey", { enumerable: true, get: function () { return util_js_1.genericKeyAffectsOtherGenericKey; } });
Object.defineProperty(exports, "isBasicObject", { enumerable: true, get: function () { return util_js_1.isBasicObject; } });
Object.defineProperty(exports, "keyToPosition", { enumerable: true, get: function () { return util_js_1.keyToPosition; } });
Object.defineProperty(exports, "makeKeyGeneric", { enumerable: true, get: function () { return util_js_1.makeKeyGeneric; } });
Object.defineProperty(exports, "reportNulls", { enumerable: true, get: function () { return util_js_1.reportNulls; } });
exports.default = mongo_object_js_1.default;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo-object.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/mongo-object/dist/cjs/mongo-object.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_js_1 = require("./util.js");
const REMOVED_MARKER = '______MONGO_OBJECT_REMOVED______';
class MongoObject {
    /*
     * @constructor
     * @param obj
     * @param blackboxKeys A list of the names of keys that shouldn't be traversed
     * @returns {undefined}
     *
     * Creates a new MongoObject instance. The object passed as the first argument
     * will be modified in place by calls to instance methods. Also, immediately
     * upon creation of the instance, the object will have any `undefined` keys
     * removed recursively.
     */
    constructor(obj, blackboxKeys = []) {
        this._affectedKeys = {};
        this._arrayItemPositions = [];
        this._blackboxKeys = [];
        this._genericAffectedKeys = {};
        this._objectPositions = [];
        this._parentPositions = [];
        this._positionsByGenericKey = {};
        this._positionsInsideArrays = [];
        this._positionsThatCreateGenericKey = {};
        this._obj = obj;
        this._blackboxKeys = blackboxKeys;
        this._reParseObj();
    }
    _reParseObj() {
        const blackboxKeys = this._blackboxKeys;
        this._affectedKeys = {};
        this._genericAffectedKeys = {};
        this._positionsByGenericKey = {};
        this._positionsThatCreateGenericKey = {};
        this._parentPositions = [];
        this._positionsInsideArrays = [];
        this._objectPositions = [];
        this._arrayItemPositions = [];
        function parseObj(self, val, currentPosition, affectedKey, operator, adjusted, isWithinArray) {
            // Adjust for first-level modifier operators
            if (operator == null && (affectedKey === null || affectedKey === void 0 ? void 0 : affectedKey.substring(0, 1)) === '$') {
                operator = affectedKey;
                affectedKey = null;
            }
            let affectedKeyIsBlackBox = false;
            let stop = false;
            if (affectedKey != null) {
                // Adjust for $push and $addToSet and $pull and $pop
                if (adjusted !== true) {
                    if (operator === '$push' ||
                        operator === '$addToSet' ||
                        operator === '$pop') {
                        // Adjust for $each
                        // We can simply jump forward and pretend like the $each array
                        // is the array for the field. This has the added benefit of
                        // skipping past any $slice, which we also don't care about.
                        if ((0, util_js_1.isBasicObject)(val) && '$each' in val) {
                            val = val.$each;
                            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                            currentPosition = `${currentPosition}[$each]`;
                        }
                        else {
                            affectedKey = `${affectedKey}.0`;
                        }
                        adjusted = true;
                    }
                    else if (operator === '$pull') {
                        affectedKey = `${affectedKey}.0`;
                        if ((0, util_js_1.isBasicObject)(val)) {
                            stop = true;
                        }
                        adjusted = true;
                    }
                }
                // Make generic key
                const affectedKeyGeneric = (0, util_js_1.makeKeyGeneric)(affectedKey);
                if (affectedKeyGeneric === null)
                    throw new Error(`Failed to get generic key for key "${affectedKey}"`);
                // Determine whether affected key should be treated as a black box
                affectedKeyIsBlackBox = affectedKeyGeneric !== null &&
                    blackboxKeys.includes(affectedKeyGeneric);
                // Mark that this position affects this generic and non-generic key
                if (currentPosition != null) {
                    self._affectedKeys[currentPosition] = affectedKey;
                    self._genericAffectedKeys[currentPosition] = affectedKeyGeneric;
                    const positionInfo = {
                        key: affectedKey,
                        operator: operator !== null && operator !== void 0 ? operator : null,
                        position: currentPosition
                    };
                    if (self._positionsByGenericKey[affectedKeyGeneric] == null)
                        self._positionsByGenericKey[affectedKeyGeneric] = [];
                    self._positionsByGenericKey[affectedKeyGeneric].push(positionInfo);
                    // Operators other than $unset will cause ancestor object keys to
                    // be auto-created.
                    if (operator != null && operator !== '$unset') {
                        MongoObject.objectsThatGenericKeyWillCreate(affectedKeyGeneric).forEach((objGenericKey) => {
                            if (self._positionsThatCreateGenericKey[objGenericKey] === undefined) {
                                self._positionsThatCreateGenericKey[objGenericKey] = [];
                            }
                            self._positionsThatCreateGenericKey[objGenericKey].push(positionInfo);
                        });
                    }
                    // If we're within an array, mark this position so we can omit it from flat docs
                    if (isWithinArray === true)
                        self._positionsInsideArrays.push(currentPosition);
                }
            }
            if (stop)
                return;
            // Loop through arrays
            if (Array.isArray(val) && val.length > 0) {
                if (currentPosition != null) {
                    // Mark positions with arrays that should be ignored when we want endpoints only
                    self._parentPositions.push(currentPosition);
                }
                // Loop
                val.forEach((v, i) => {
                    if (currentPosition != null)
                        self._arrayItemPositions.push(`${currentPosition}[${i}]`);
                    parseObj(self, v, currentPosition != null ? `${currentPosition}[${i}]` : String(i), 
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    `${affectedKey}.${i}`, operator, adjusted, true);
                });
            }
            else if (((0, util_js_1.isBasicObject)(val) && !affectedKeyIsBlackBox) ||
                currentPosition == null) {
                // Loop through object keys, only for basic objects,
                // but always for the passed-in object, even if it
                // is a custom object.
                if (currentPosition != null && !(0, util_js_1.isEmpty)(val)) {
                    // Mark positions with objects that should be ignored when we want endpoints only
                    self._parentPositions.push(currentPosition);
                    // Mark positions with objects that should be left out of flat docs.
                    self._objectPositions.push(currentPosition);
                }
                // Loop
                Object.keys(val).forEach((k) => {
                    const v = val[k];
                    if (v === undefined) {
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete val[k];
                    }
                    else if (k !== '$slice') {
                        parseObj(self, v, currentPosition != null ? `${currentPosition}[${k}]` : k, (0, util_js_1.appendAffectedKey)(affectedKey, k), operator, adjusted, isWithinArray);
                    }
                });
            }
        }
        parseObj(this, this._obj);
    }
    /**
     * @param func
     * @param [options]
     * @param [options.endPointsOnly=true] - Only call function for endpoints and not for nodes that contain other nodes
     * @returns
     *
     * Runs a function for each endpoint node in the object tree, including all items in every array.
     * The function arguments are
     * (1) the value at this node
     * (2) a string representing the node position
     * (3) the representation of what would be changed in mongo, using mongo dot notation
     * (4) the generic equivalent of argument 3, with '$' instead of numeric pieces
     */
    forEachNode(func, { endPointsOnly = true } = {}) {
        if (typeof func !== 'function')
            throw new Error('filter requires a loop function');
        const updatedValues = {};
        Object.keys(this._affectedKeys).forEach((position) => {
            if (endPointsOnly && this._parentPositions.includes(position))
                return; // Only endpoints
            func.call({
                value: this.getValueForPosition(position),
                isArrayItem: this._arrayItemPositions.includes(position),
                operator: (0, util_js_1.extractOp)(position),
                position,
                key: this._affectedKeys[position],
                genericKey: this._genericAffectedKeys[position],
                updateValue: (newVal) => {
                    updatedValues[position] = newVal;
                },
                remove: () => {
                    updatedValues[position] = undefined;
                }
            });
        });
        // Actually update/remove values as instructed
        Object.keys(updatedValues).forEach((position) => {
            this.setValueForPosition(position, updatedValues[position]);
        });
    }
    getValueForPosition(position) {
        const subkeys = position.split('[');
        let current = this._obj;
        const ln = subkeys.length;
        for (let i = 0; i < ln; i++) {
            let subkey = subkeys[i];
            // If the subkey ends in ']', remove the ending
            if (subkey.slice(-1) === ']')
                subkey = subkey.slice(0, -1);
            current = current[subkey];
            if (!Array.isArray(current) && !(0, util_js_1.isBasicObject)(current) && i < ln - 1)
                return;
        }
        if (current === REMOVED_MARKER)
            return;
        return current;
    }
    /**
     * @param position
     * @param value
     */
    setValueForPosition(position, value) {
        const subkeys = position.split('[');
        let current = this._obj;
        const ln = subkeys.length;
        let createdObjectsOrArrays = false;
        let affectedKey = '';
        for (let i = 0; i < ln; i++) {
            let subkey = subkeys[i];
            // If the subkey ends in "]", remove the ending
            if (subkey.slice(-1) === ']')
                subkey = subkey.slice(0, -1);
            // We don't store modifiers
            if (subkey.length > 0 && subkey.substring(0, 1) !== '$') {
                affectedKey = (0, util_js_1.appendAffectedKey)(affectedKey, subkey);
            }
            // If we've reached the key in the object tree that needs setting or
            // deleting, do it.
            if (i === ln - 1) {
                // If value is undefined, delete the property
                if (value === undefined) {
                    if (Array.isArray(current)) {
                        // We can't just delete it because indexes in the position strings will be off
                        // We will mark it uniquely and then parse this elsewhere
                        current[Number(subkey)] = REMOVED_MARKER;
                    }
                    else {
                        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                        delete current[subkey];
                    }
                }
                else {
                    current[subkey] = value;
                }
                this._affectedKeys[position] = affectedKey;
            }
            else {
                // Otherwise attempt to keep moving deeper into the object.
                // If we're setting (as opposed to deleting) a key and we hit a place
                // in the ancestor chain where the keys are not yet created, create them.
                if (current[subkey] === undefined && value !== undefined) {
                    // See if the next piece is a number
                    const nextPiece = subkeys[i + 1];
                    current[subkey] = Number.isNaN(parseInt(nextPiece, 10)) ? {} : [];
                    createdObjectsOrArrays = true;
                }
                // Move deeper into the object
                current = current[subkey];
                // If we can go no further, then quit
                if (!Array.isArray(current) && !(0, util_js_1.isBasicObject)(current) && i < ln - 1)
                    return;
            }
        }
        // If there are now new arrays or objects in the main object, we need to reparse it
        if (createdObjectsOrArrays ||
            Array.isArray(value) ||
            (0, util_js_1.isBasicObject)(value)) {
            this._reParseObj();
        }
    }
    removeValueForPosition(position) {
        this.setValueForPosition(position, undefined);
    }
    getKeyForPosition(position) {
        return this._affectedKeys[position];
    }
    getGenericKeyForPosition(position) {
        return this._genericAffectedKeys[position];
    }
    /**
     * @param key Non-generic key
     * @returns The value and operator of the requested non-generic key.
     *   Example: {value: 1, operator: "$pull"}
     */
    getInfoForKey(key) {
        // Get the info
        const position = this.getPositionForKey(key);
        if (position !== undefined) {
            return {
                value: this.getValueForPosition(position),
                operator: (0, util_js_1.extractOp)(position)
            };
        }
        // If we haven't returned yet, check to see if there is an array value
        // corresponding to this key
        // We find the first item within the array, strip the last piece off the
        // position string, and then return whatever is at that new position in
        // the original object.
        const positions = this.getPositionsForGenericKey(`${key}.$`);
        for (let index = 0; index < positions.length; index++) {
            const pos = positions[index];
            let value = this.getValueForPosition(pos);
            if (value === undefined) {
                const parentPosition = pos.slice(0, pos.lastIndexOf('['));
                value = this.getValueForPosition(parentPosition);
            }
            if (value !== undefined) {
                return {
                    value,
                    operator: (0, util_js_1.extractOp)(pos)
                };
            }
        }
    }
    /**
     * @method MongoObject.getPositionForKey
     * @param {String} key - Non-generic key
     * @returns The position string for the place in the object that
     *   affects the requested non-generic key.
     *   Example: 'foo[bar][0]'
     */
    getPositionForKey(key) {
        const positions = Object.getOwnPropertyNames(this._affectedKeys);
        for (let index = 0; index < positions.length; index++) {
            const position = positions[index];
            // We return the first one we find. While it's
            // possible that multiple update operators could
            // affect the same non-generic key, we'll assume that's not the case.
            if (this._affectedKeys[position] === key)
                return position;
        }
    }
    /**
     * @param genericKey Generic key
     * @returns An array of position strings for the places in the object that
     *   affect the requested generic key.
     *   Example: ['foo[bar][0]']
     */
    getPositionsForGenericKey(genericKey) {
        return this.getPositionsInfoForGenericKey(genericKey).map((p) => p.position);
    }
    /**
     * @param genericKey Generic key
     * @returns An array of position info for the places in the object that
     *   affect the requested generic key.
     */
    getPositionsInfoForGenericKey(genericKey) {
        let positions = this._positionsByGenericKey[genericKey];
        if (positions == null || positions.length === 0)
            positions = this._positionsByGenericKey[`${genericKey}.$`];
        if (positions == null || positions.length === 0)
            positions = [];
        return positions.map((info) => (Object.assign({ value: this.getValueForPosition(info.position) }, info)));
    }
    getPositionsThatCreateGenericKey(genericKey) {
        var _a;
        return (_a = this._positionsThatCreateGenericKey[genericKey]) !== null && _a !== void 0 ? _a : [];
    }
    /**
     * @deprecated Use getInfoForKey
     * @param {String} key - Non-generic key
     * @returns The value of the requested non-generic key
     */
    getValueForKey(key) {
        const position = this.getPositionForKey(key);
        if (position != null)
            return this.getValueForPosition(position);
    }
    /**
     * Adds `key` with value `val` under operator `op` to the source object.
     *
     * @param key Key to set
     * @param val Value to give this key
     * @param op Operator under which to set it, or `null` for a non-modifier object
     * @returns
     */
    addKey(key, val, op) {
        const position = op != null ? `${op}[${key}]` : (0, util_js_1.keyToPosition)(key);
        this.setValueForPosition(position, val);
    }
    /**
     * Removes anything that affects any of the generic keys in the list
     */
    removeGenericKeys(keys) {
        Object.getOwnPropertyNames(this._genericAffectedKeys).forEach((position) => {
            const genericKey = this._genericAffectedKeys[position];
            if (genericKey !== null && keys.includes(genericKey)) {
                this.removeValueForPosition(position);
            }
        });
    }
    /**
     * Removes anything that affects the requested generic key
     */
    removeGenericKey(key) {
        Object.getOwnPropertyNames(this._genericAffectedKeys).forEach((position) => {
            if (this._genericAffectedKeys[position] === key) {
                this.removeValueForPosition(position);
            }
        });
    }
    /**
     * Removes anything that affects the requested non-generic key
     */
    removeKey(key) {
        // We don't use getPositionForKey here because we want to be sure to
        // remove for all positions if there are multiple.
        Object.getOwnPropertyNames(this._affectedKeys).forEach((position) => {
            if (this._affectedKeys[position] === key) {
                this.removeValueForPosition(position);
            }
        });
    }
    /**
     * Removes anything that affects any of the non-generic keys in the list
     */
    removeKeys(keys) {
        keys.forEach((key) => this.removeKey(key));
    }
    /**
     * Passes all affected keys to a test function, which
     * should return false to remove whatever is affecting that key
     */
    filterGenericKeys(test) {
        const checkedKeys = [];
        const keysToRemove = [];
        Object.getOwnPropertyNames(this._genericAffectedKeys).forEach((position) => {
            const genericKey = this._genericAffectedKeys[position];
            if (genericKey !== null && !checkedKeys.includes(genericKey)) {
                checkedKeys.push(genericKey);
                if (genericKey != null && !test(genericKey)) {
                    keysToRemove.push(genericKey);
                }
            }
        });
        keysToRemove.forEach((key) => this.removeGenericKey(key));
    }
    /**
     * Sets the value for every place in the object that affects
     * the requested non-generic key
     */
    setValueForKey(key, val) {
        // We don't use getPositionForKey here because we want to be sure to
        // set the value for all positions if there are multiple.
        Object.getOwnPropertyNames(this._affectedKeys).forEach((position) => {
            if (this._affectedKeys[position] === key) {
                this.setValueForPosition(position, val);
            }
        });
    }
    /**
     * Sets the value for every place in the object that affects
     * the requested generic key
     */
    setValueForGenericKey(key, val) {
        // We don't use getPositionForKey here because we want to be sure to
        // set the value for all positions if there are multiple.
        Object.getOwnPropertyNames(this._genericAffectedKeys).forEach((position) => {
            if (this._genericAffectedKeys[position] === key) {
                this.setValueForPosition(position, val);
            }
        });
    }
    removeArrayItems() {
        // Traverse and pull out removed array items at this point
        function traverse(obj) {
            (0, util_js_1.each)(obj, (val, indexOrProp) => {
                // Move deeper into the object
                const next = obj[indexOrProp];
                // If we can go no further, then quit
                if ((0, util_js_1.isBasicObject)(next)) {
                    traverse(next);
                }
                else if (Array.isArray(next)) {
                    obj[indexOrProp] = next.filter((item) => item !== REMOVED_MARKER);
                    traverse(obj[indexOrProp]);
                }
                return undefined;
            });
        }
        traverse(this._obj);
    }
    /**
     * Get the source object, potentially modified by other method calls on this
     * MongoObject instance.
     */
    getObject() {
        return this._obj;
    }
    /**
     * Gets a flat object based on the MongoObject instance.
     * In a flat object, the key is the name of the non-generic affectedKey,
     * with mongo dot notation if necessary, and the value is the value for
     * that key.
     *
     * With `keepArrays: true`, we don't flatten within arrays. Currently
     * MongoDB does not see a key such as `a.0.b` and automatically assume
     * an array. Instead it would create an object with key '0' if there
     * wasn't already an array saved as the value of `a`, which is rarely
     * if ever what we actually want. To avoid this confusion, we
     * set entire arrays.
     */
    getFlatObject({ keepArrays = false } = {}) {
        const newObj = {};
        Object.keys(this._affectedKeys).forEach((position) => {
            const affectedKey = this._affectedKeys[position];
            if (typeof affectedKey === 'string' &&
                ((keepArrays &&
                    !this._positionsInsideArrays.includes(position) &&
                    !this._objectPositions.includes(position)) ||
                    (!keepArrays &&
                        !this._parentPositions.includes(position)))) {
                newObj[affectedKey] = this.getValueForPosition(position);
            }
        });
        return newObj;
    }
    /**
     * @method MongoObject.affectsKey
     * @param key Key to test
     * @returns True if the non-generic key is affected by this object
     */
    affectsKey(key) {
        return this.getPositionForKey(key) !== undefined;
    }
    /**
     * @method MongoObject.affectsGenericKey
     * @param key Key to test
     * @returns True if the generic key is affected by this object
     */
    affectsGenericKey(key) {
        const positions = Object.getOwnPropertyNames(this._genericAffectedKeys);
        for (let index = 0; index < positions.length; index++) {
            const position = positions[index];
            if (this._genericAffectedKeys[position] === key)
                return true;
        }
        return false;
    }
    /**
     * @method MongoObject.affectsGenericKeyImplicit
     * @param key Key to test
     * @returns Like affectsGenericKey, but will return true if a child key is affected
     */
    affectsGenericKeyImplicit(key) {
        const positions = Object.getOwnPropertyNames(this._genericAffectedKeys);
        for (let index = 0; index < positions.length; index++) {
            const position = positions[index];
            const affectedKey = this._genericAffectedKeys[position];
            if (affectedKey !== null &&
                (0, util_js_1.genericKeyAffectsOtherGenericKey)(key, affectedKey))
                return true;
        }
        return false;
    }
    /**
     * This is different from MongoObject.prototype.getKeyForPosition in that
     * this method does not depend on the requested position actually being
     * present in any particular MongoObject.
     *
     * @method MongoObject._positionToKey
     * @param position
     * @returns The key that this position in an object would affect.
     */
    static _positionToKey(position) {
        // XXX Probably a better way to do this, but this is
        // foolproof for now.
        const mDoc = new MongoObject({});
        mDoc.setValueForPosition(position, 1); // Value doesn't matter
        return mDoc.getKeyForPosition(position);
    }
    /**
     * @method MongoObject.docToModifier
     * @public
     * @param doc - An object to be converted into a MongoDB modifier
     * @param [options] Options
     * @returns A MongoDB modifier.
     *
     * Converts an object into a modifier by flattening it, putting keys with
     * null, undefined, and empty string values into `modifier.$unset`, and
     * putting the rest of the keys into `modifier.$set`.
     */
    static docToModifier(doc, { keepArrays = false, keepEmptyStrings = false } = {}) {
        // Flatten doc
        const mDoc = new MongoObject(doc);
        let flatDoc = mDoc.getFlatObject({ keepArrays });
        // Get a list of null, undefined, and empty string values so we can unset them instead
        const nulls = (0, util_js_1.reportNulls)(flatDoc, keepEmptyStrings);
        flatDoc = (0, util_js_1.cleanNulls)(flatDoc, false, keepEmptyStrings);
        const modifier = {};
        if (!(0, util_js_1.isEmpty)(flatDoc))
            modifier.$set = flatDoc;
        if (!(0, util_js_1.isEmpty)(nulls))
            modifier.$unset = nulls;
        return modifier;
    }
    static objAffectsKey(obj, key) {
        const mDoc = new MongoObject(obj);
        return mDoc.affectsKey(key);
    }
    /**
     * @param genericKey Generic key
     * @return Array of other generic keys that would be created by this generic key
     */
    static objectsThatGenericKeyWillCreate(genericKey) {
        const objs = [];
        do {
            const lastDotPosition = genericKey.lastIndexOf('.');
            genericKey = lastDotPosition === -1 ? '' : genericKey.slice(0, lastDotPosition);
            if (genericKey.length > 0 && !genericKey.endsWith('.$'))
                objs.push(genericKey);
        } while (genericKey.length > 0);
        return objs;
    }
    /**
     * Takes a flat object and returns an expanded version of it.
     */
    static expandObj(doc) {
        const newDoc = {};
        Object.keys(doc).forEach((key) => {
            const val = doc[key];
            const subkeys = key.split('.');
            const subkeylen = subkeys.length;
            let current = newDoc;
            for (let i = 0; i < subkeylen; i++) {
                const subkey = subkeys[i];
                if (typeof current[subkey] !== 'undefined' &&
                    !(0, util_js_1.isObject)(current[subkey])) {
                    break; // Already set for some reason; leave it alone
                }
                if (i === subkeylen - 1) {
                    // Last iteration; time to set the value
                    current[subkey] = val;
                }
                else {
                    // See if the next piece is a number
                    const nextPiece = subkeys[i + 1];
                    const nextPieceInt = parseInt(nextPiece, 10);
                    if (Number.isNaN(nextPieceInt) && !(0, util_js_1.isObject)(current[subkey])) {
                        current[subkey] = {};
                    }
                    else if (!Number.isNaN(nextPieceInt) &&
                        !Array.isArray(current[subkey])) {
                        current[subkey] = [];
                    }
                }
                current = current[subkey];
            }
        });
        return newDoc;
    }
}
exports.default = MongoObject;
/* STATIC */
MongoObject._keyToPosition = util_js_1.keyToPosition;
MongoObject.cleanNulls = util_js_1.cleanNulls;
MongoObject.expandKey = util_js_1.expandKey;
MongoObject.isBasicObject = util_js_1.isBasicObject;
MongoObject.makeKeyGeneric = util_js_1.makeKeyGeneric;
MongoObject.reportNulls = util_js_1.reportNulls;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"util.js":function module(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/mongo-object/dist/cjs/util.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expandKey = exports.keyToPosition = exports.makeKeyGeneric = exports.isObject = exports.isEmpty = exports.isPrototype = exports.each = exports.isArrayLike = exports.isLength = exports.isNullUndefinedOrEmptyString = exports.genericKeyAffectsOtherGenericKey = exports.extractOp = exports.appendAffectedKey = exports.reportNulls = exports.isBasicObject = exports.cleanNulls = void 0;
/** Used as references for various `Number` constants. */
const MAX_SAFE_INTEGER = 9007199254740991;
/**
 * @param doc Source object or array
 * @param isArray True if `doc` is an array
 * @param keepEmptyStrings Whether to keep empty strings
 * @returns An object in which all properties with null, undefined, or empty
 *   string values have been removed, recursively.
 */
function cleanNulls(doc, isArray = false, keepEmptyStrings = false) {
    const newDoc = isArray ? [] : {};
    Object.keys(doc).forEach((key) => {
        let val = doc[key];
        if (!Array.isArray(val) && isBasicObject(val)) {
            val = cleanNulls(val, false, keepEmptyStrings); // Recurse into plain objects
            if (!isEmpty(val))
                newDoc[key] = val;
        }
        else if (Array.isArray(val)) {
            val = cleanNulls(val, true, keepEmptyStrings); // Recurse into non-typed arrays
            if (!isEmpty(val))
                newDoc[key] = val;
        }
        else if (!isNullUndefinedOrEmptyString(val)) {
            newDoc[key] = val;
        }
        else if (keepEmptyStrings &&
            typeof val === 'string' &&
            val.length === 0) {
            newDoc[key] = val;
        }
    });
    return newDoc;
}
exports.cleanNulls = cleanNulls;
/**
 * @param obj Any reference to check
 * @returns True if obj is an Object as opposed to
 *   something that inherits from Object
 */
function isBasicObject(obj) {
    return obj === Object(obj) && Object.getPrototypeOf(obj) === Object.prototype;
}
exports.isBasicObject = isBasicObject;
/**
 * @method MongoObject.reportNulls
 * @public
 * @param flatDoc An object with no properties that are also objects.
 * @returns An object in which the keys represent the keys in the
 *   original object that were null, undefined, or empty strings, and the value
 *   of each key is "".
 */
function reportNulls(flatDoc, keepEmptyStrings = false) {
    const nulls = {};
    // Loop through the flat doc
    Object.keys(flatDoc).forEach((key) => {
        const val = flatDoc[key];
        if (val === null ||
            val === undefined ||
            (!keepEmptyStrings && typeof val === 'string' && val.length === 0) ||
            // If value is an array in which all the values recursively are undefined, null,
            // or an empty string
            (Array.isArray(val) &&
                cleanNulls(val, true, keepEmptyStrings).length === 0)) {
            nulls[key] = '';
        }
    });
    return nulls;
}
exports.reportNulls = reportNulls;
function appendAffectedKey(affectedKey, key) {
    if (key === '$each')
        return affectedKey;
    return (affectedKey != null && affectedKey.length > 0) ? `${affectedKey}.${key}` : key;
}
exports.appendAffectedKey = appendAffectedKey;
// Extracts operator piece, if present, from position string
function extractOp(position) {
    const firstPositionPiece = position.slice(0, position.indexOf('['));
    return firstPositionPiece.substring(0, 1) === '$' ? firstPositionPiece : null;
}
exports.extractOp = extractOp;
function genericKeyAffectsOtherGenericKey(key, affectedKey) {
    // If the affected key is the test key
    if (affectedKey === key)
        return true;
    // If the affected key implies the test key because the affected key
    // starts with the test key followed by a period
    if (affectedKey.substring(0, key.length + 1) === `${key}.`)
        return true;
    // If the affected key implies the test key because the affected key
    // starts with the test key and the test key ends with ".$"
    const lastTwo = key.slice(-2);
    if (lastTwo === '.$' && key.slice(0, -2) === affectedKey)
        return true;
    return false;
}
exports.genericKeyAffectsOtherGenericKey = genericKeyAffectsOtherGenericKey;
function isNullUndefinedOrEmptyString(val) {
    return (val === undefined ||
        val === null ||
        (typeof val === 'string' && val.length === 0));
}
exports.isNullUndefinedOrEmptyString = isNullUndefinedOrEmptyString;
function isLength(value) {
    return (typeof value === 'number' &&
        value > -1 &&
        value % 1 === 0 &&
        value <= MAX_SAFE_INTEGER);
}
exports.isLength = isLength;
function isArrayLike(value) {
    return value != null && typeof value !== 'function' && isLength(value.length);
}
exports.isArrayLike = isArrayLike;
function each(collection, iteratee) {
    if (collection == null) {
        return;
    }
    if (Array.isArray(collection)) {
        collection.forEach(iteratee);
        return;
    }
    const iterable = Object(collection);
    if (!isArrayLike(collection)) {
        Object.keys(iterable).forEach((key) => iteratee(iterable[key], key, iterable));
        return;
    }
    let index = -1;
    while (++index < collection.length) {
        if (iteratee(iterable[index], index, iterable) === false) {
            break;
        }
    }
}
exports.each = each;
function isPrototype(value) {
    const Ctor = value === null || value === void 0 ? void 0 : value.constructor;
    if (typeof Ctor !== 'function' || Ctor.prototype === undefined) {
        return value === Object.prototype;
    }
    return value === Ctor.prototype;
}
exports.isPrototype = isPrototype;
function isEmpty(value) {
    if (value === null || value === undefined) {
        return true;
    }
    if (Array.isArray(value) || typeof value === 'string') {
        return value.length === 0;
    }
    const tag = Object.prototype.toString.call(value);
    if (tag === '[object Map]' || tag === '[object Set]') {
        return value.size === 0;
    }
    if (isPrototype(value)) {
        return Object.keys(value).length === 0;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const key in value) {
        if (Object.hasOwnProperty.call(value, key)) {
            return false;
        }
    }
    return true;
}
exports.isEmpty = isEmpty;
function isObject(value) {
    const type = typeof value;
    return value != null && (type === 'object' || type === 'function');
}
exports.isObject = isObject;
/* Takes a specific string that uses any mongo-style positional update
 * dot notation and returns a generic string equivalent. Replaces all numeric
 * positional "pieces" (e.g. '.1') or any other positional operator
 * (e.g. '$[<identifier>]')  with a dollar sign ($).
 *
 * @param key A specific or generic key
 * @returns Generic name.
 */
function makeKeyGeneric(key) {
    if (typeof key !== 'string')
        return null;
    return key.replace(/\.([0-9]+|\$\[[^\]]*\])(?=\.|$)/g, '.$');
}
exports.makeKeyGeneric = makeKeyGeneric;
function keyToPosition(key, wrapAll = false) {
    let position = '';
    key.split('.').forEach((piece, i) => {
        if (i === 0 && !wrapAll) {
            position += piece;
        }
        else {
            position += `[${piece}]`;
        }
    });
    return position;
}
exports.keyToPosition = keyToPosition;
/**
 *  Takes a string representation of an object key and its value
 *  and updates "obj" to contain that key with that value.
 *
 *  Example keys and results if val is 1:
 *    "a" -> {a: 1}
 *    "a[b]" -> {a: {b: 1}}
 *    "a[b][0]" -> {a: {b: [1]}}
 *    'a[b.0.c]' -> {a: {'b.0.c': 1}}
 * @param val Value
 * @param key Key
 * @param obj Object
 */
function expandKey(val, key, obj) {
    const subkeys = key.split('[');
    let current = obj;
    for (let i = 0, ln = subkeys.length; i < ln; i++) {
        let subkey = subkeys[i];
        if (subkey.slice(-1) === ']') {
            subkey = subkey.slice(0, -1);
        }
        if (i === ln - 1) {
            // Last iteration; time to set the value; always overwrite
            current[subkey] = val;
            // If val is undefined, delete the property
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            if (val === undefined)
                delete current[subkey];
        }
        else {
            // See if the next piece is a number
            const nextPiece = subkeys[i + 1];
            if (current[subkey] === undefined) {
                current[subkey] = Number.isNaN(parseInt(nextPiece, 10)) ? {} : [];
            }
        }
        current = current[subkey];
    }
}
exports.expandKey = expandKey;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"react":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/react/package.json                                                                                     //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "browserify": {
    "transform": [
      "loose-envify"
    ]
  },
  "bugs": {
    "url": "https://github.com/facebook/react/issues"
  },
  "dependencies": {
    "loose-envify": "^1.1.0"
  },
  "description": "React is a JavaScript library for building user interfaces.",
  "engines": {
    "node": ">=0.10.0"
  },
  "exports": {
    ".": {
      "react-server": "./react.shared-subset.js",
      "default": "./index.js"
    },
    "./package.json": "./package.json",
    "./jsx-runtime": "./jsx-runtime.js",
    "./jsx-dev-runtime": "./jsx-dev-runtime.js"
  },
  "files": [
    "LICENSE",
    "README.md",
    "index.js",
    "cjs/",
    "umd/",
    "jsx-runtime.js",
    "jsx-dev-runtime.js",
    "react.shared-subset.js"
  ],
  "homepage": "https://reactjs.org/",
  "keywords": [
    "react"
  ],
  "license": "MIT",
  "main": "index.js",
  "name": "react",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/facebook/react.git",
    "directory": "packages/react"
  },
  "version": "18.2.0"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"@babel":{"runtime":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/package.json                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "author": {
    "name": "The Babel Team",
    "url": "https://babel.dev/team"
  },
  "bugs": {
    "url": "https://github.com/babel/babel/issues"
  },
  "dependencies": {
    "regenerator-runtime": "^0.14.0"
  },
  "description": "babel's modular runtime helpers",
  "engines": {
    "node": ">=6.9.0"
  },
  "exports": {
    "./helpers/AsyncGenerator": [
      {
        "node": "./helpers/AsyncGenerator.js",
        "import": "./helpers/esm/AsyncGenerator.js",
        "default": "./helpers/AsyncGenerator.js"
      },
      "./helpers/AsyncGenerator.js"
    ],
    "./helpers/esm/AsyncGenerator": "./helpers/esm/AsyncGenerator.js",
    "./helpers/OverloadYield": [
      {
        "node": "./helpers/OverloadYield.js",
        "import": "./helpers/esm/OverloadYield.js",
        "default": "./helpers/OverloadYield.js"
      },
      "./helpers/OverloadYield.js"
    ],
    "./helpers/esm/OverloadYield": "./helpers/esm/OverloadYield.js",
    "./helpers/applyDecs": [
      {
        "node": "./helpers/applyDecs.js",
        "import": "./helpers/esm/applyDecs.js",
        "default": "./helpers/applyDecs.js"
      },
      "./helpers/applyDecs.js"
    ],
    "./helpers/esm/applyDecs": "./helpers/esm/applyDecs.js",
    "./helpers/applyDecs2203": [
      {
        "node": "./helpers/applyDecs2203.js",
        "import": "./helpers/esm/applyDecs2203.js",
        "default": "./helpers/applyDecs2203.js"
      },
      "./helpers/applyDecs2203.js"
    ],
    "./helpers/esm/applyDecs2203": "./helpers/esm/applyDecs2203.js",
    "./helpers/applyDecs2203R": [
      {
        "node": "./helpers/applyDecs2203R.js",
        "import": "./helpers/esm/applyDecs2203R.js",
        "default": "./helpers/applyDecs2203R.js"
      },
      "./helpers/applyDecs2203R.js"
    ],
    "./helpers/esm/applyDecs2203R": "./helpers/esm/applyDecs2203R.js",
    "./helpers/applyDecs2301": [
      {
        "node": "./helpers/applyDecs2301.js",
        "import": "./helpers/esm/applyDecs2301.js",
        "default": "./helpers/applyDecs2301.js"
      },
      "./helpers/applyDecs2301.js"
    ],
    "./helpers/esm/applyDecs2301": "./helpers/esm/applyDecs2301.js",
    "./helpers/applyDecs2305": [
      {
        "node": "./helpers/applyDecs2305.js",
        "import": "./helpers/esm/applyDecs2305.js",
        "default": "./helpers/applyDecs2305.js"
      },
      "./helpers/applyDecs2305.js"
    ],
    "./helpers/esm/applyDecs2305": "./helpers/esm/applyDecs2305.js",
    "./helpers/applyDecs2311": [
      {
        "node": "./helpers/applyDecs2311.js",
        "import": "./helpers/esm/applyDecs2311.js",
        "default": "./helpers/applyDecs2311.js"
      },
      "./helpers/applyDecs2311.js"
    ],
    "./helpers/esm/applyDecs2311": "./helpers/esm/applyDecs2311.js",
    "./helpers/assertClassBrand": [
      {
        "node": "./helpers/assertClassBrand.js",
        "import": "./helpers/esm/assertClassBrand.js",
        "default": "./helpers/assertClassBrand.js"
      },
      "./helpers/assertClassBrand.js"
    ],
    "./helpers/esm/assertClassBrand": "./helpers/esm/assertClassBrand.js",
    "./helpers/asyncGeneratorDelegate": [
      {
        "node": "./helpers/asyncGeneratorDelegate.js",
        "import": "./helpers/esm/asyncGeneratorDelegate.js",
        "default": "./helpers/asyncGeneratorDelegate.js"
      },
      "./helpers/asyncGeneratorDelegate.js"
    ],
    "./helpers/esm/asyncGeneratorDelegate": "./helpers/esm/asyncGeneratorDelegate.js",
    "./helpers/asyncIterator": [
      {
        "node": "./helpers/asyncIterator.js",
        "import": "./helpers/esm/asyncIterator.js",
        "default": "./helpers/asyncIterator.js"
      },
      "./helpers/asyncIterator.js"
    ],
    "./helpers/esm/asyncIterator": "./helpers/esm/asyncIterator.js",
    "./helpers/awaitAsyncGenerator": [
      {
        "node": "./helpers/awaitAsyncGenerator.js",
        "import": "./helpers/esm/awaitAsyncGenerator.js",
        "default": "./helpers/awaitAsyncGenerator.js"
      },
      "./helpers/awaitAsyncGenerator.js"
    ],
    "./helpers/esm/awaitAsyncGenerator": "./helpers/esm/awaitAsyncGenerator.js",
    "./helpers/callSuper": [
      {
        "node": "./helpers/callSuper.js",
        "import": "./helpers/esm/callSuper.js",
        "default": "./helpers/callSuper.js"
      },
      "./helpers/callSuper.js"
    ],
    "./helpers/esm/callSuper": "./helpers/esm/callSuper.js",
    "./helpers/checkInRHS": [
      {
        "node": "./helpers/checkInRHS.js",
        "import": "./helpers/esm/checkInRHS.js",
        "default": "./helpers/checkInRHS.js"
      },
      "./helpers/checkInRHS.js"
    ],
    "./helpers/esm/checkInRHS": "./helpers/esm/checkInRHS.js",
    "./helpers/classPrivateFieldGet2": [
      {
        "node": "./helpers/classPrivateFieldGet2.js",
        "import": "./helpers/esm/classPrivateFieldGet2.js",
        "default": "./helpers/classPrivateFieldGet2.js"
      },
      "./helpers/classPrivateFieldGet2.js"
    ],
    "./helpers/esm/classPrivateFieldGet2": "./helpers/esm/classPrivateFieldGet2.js",
    "./helpers/classPrivateFieldSet2": [
      {
        "node": "./helpers/classPrivateFieldSet2.js",
        "import": "./helpers/esm/classPrivateFieldSet2.js",
        "default": "./helpers/classPrivateFieldSet2.js"
      },
      "./helpers/classPrivateFieldSet2.js"
    ],
    "./helpers/esm/classPrivateFieldSet2": "./helpers/esm/classPrivateFieldSet2.js",
    "./helpers/classPrivateGetter": [
      {
        "node": "./helpers/classPrivateGetter.js",
        "import": "./helpers/esm/classPrivateGetter.js",
        "default": "./helpers/classPrivateGetter.js"
      },
      "./helpers/classPrivateGetter.js"
    ],
    "./helpers/esm/classPrivateGetter": "./helpers/esm/classPrivateGetter.js",
    "./helpers/classPrivateSetter": [
      {
        "node": "./helpers/classPrivateSetter.js",
        "import": "./helpers/esm/classPrivateSetter.js",
        "default": "./helpers/classPrivateSetter.js"
      },
      "./helpers/classPrivateSetter.js"
    ],
    "./helpers/esm/classPrivateSetter": "./helpers/esm/classPrivateSetter.js",
    "./helpers/construct": [
      {
        "node": "./helpers/construct.js",
        "import": "./helpers/esm/construct.js",
        "default": "./helpers/construct.js"
      },
      "./helpers/construct.js"
    ],
    "./helpers/esm/construct": "./helpers/esm/construct.js",
    "./helpers/defineAccessor": [
      {
        "node": "./helpers/defineAccessor.js",
        "import": "./helpers/esm/defineAccessor.js",
        "default": "./helpers/defineAccessor.js"
      },
      "./helpers/defineAccessor.js"
    ],
    "./helpers/esm/defineAccessor": "./helpers/esm/defineAccessor.js",
    "./helpers/dispose": [
      {
        "node": "./helpers/dispose.js",
        "import": "./helpers/esm/dispose.js",
        "default": "./helpers/dispose.js"
      },
      "./helpers/dispose.js"
    ],
    "./helpers/esm/dispose": "./helpers/esm/dispose.js",
    "./helpers/importDeferProxy": [
      {
        "node": "./helpers/importDeferProxy.js",
        "import": "./helpers/esm/importDeferProxy.js",
        "default": "./helpers/importDeferProxy.js"
      },
      "./helpers/importDeferProxy.js"
    ],
    "./helpers/esm/importDeferProxy": "./helpers/esm/importDeferProxy.js",
    "./helpers/interopRequireWildcard": [
      {
        "node": "./helpers/interopRequireWildcard.js",
        "import": "./helpers/esm/interopRequireWildcard.js",
        "default": "./helpers/interopRequireWildcard.js"
      },
      "./helpers/interopRequireWildcard.js"
    ],
    "./helpers/esm/interopRequireWildcard": "./helpers/esm/interopRequireWildcard.js",
    "./helpers/isNativeReflectConstruct": [
      {
        "node": "./helpers/isNativeReflectConstruct.js",
        "import": "./helpers/esm/isNativeReflectConstruct.js",
        "default": "./helpers/isNativeReflectConstruct.js"
      },
      "./helpers/isNativeReflectConstruct.js"
    ],
    "./helpers/esm/isNativeReflectConstruct": "./helpers/esm/isNativeReflectConstruct.js",
    "./helpers/iterableToArrayLimit": [
      {
        "node": "./helpers/iterableToArrayLimit.js",
        "import": "./helpers/esm/iterableToArrayLimit.js",
        "default": "./helpers/iterableToArrayLimit.js"
      },
      "./helpers/iterableToArrayLimit.js"
    ],
    "./helpers/esm/iterableToArrayLimit": "./helpers/esm/iterableToArrayLimit.js",
    "./helpers/iterableToArrayLimitLoose": [
      {
        "node": "./helpers/iterableToArrayLimitLoose.js",
        "import": "./helpers/esm/iterableToArrayLimitLoose.js",
        "default": "./helpers/iterableToArrayLimitLoose.js"
      },
      "./helpers/iterableToArrayLimitLoose.js"
    ],
    "./helpers/esm/iterableToArrayLimitLoose": "./helpers/esm/iterableToArrayLimitLoose.js",
    "./helpers/jsx": [
      {
        "node": "./helpers/jsx.js",
        "import": "./helpers/esm/jsx.js",
        "default": "./helpers/jsx.js"
      },
      "./helpers/jsx.js"
    ],
    "./helpers/esm/jsx": "./helpers/esm/jsx.js",
    "./helpers/objectSpread2": [
      {
        "node": "./helpers/objectSpread2.js",
        "import": "./helpers/esm/objectSpread2.js",
        "default": "./helpers/objectSpread2.js"
      },
      "./helpers/objectSpread2.js"
    ],
    "./helpers/esm/objectSpread2": "./helpers/esm/objectSpread2.js",
    "./helpers/regeneratorRuntime": [
      {
        "node": "./helpers/regeneratorRuntime.js",
        "import": "./helpers/esm/regeneratorRuntime.js",
        "default": "./helpers/regeneratorRuntime.js"
      },
      "./helpers/regeneratorRuntime.js"
    ],
    "./helpers/esm/regeneratorRuntime": "./helpers/esm/regeneratorRuntime.js",
    "./helpers/setFunctionName": [
      {
        "node": "./helpers/setFunctionName.js",
        "import": "./helpers/esm/setFunctionName.js",
        "default": "./helpers/setFunctionName.js"
      },
      "./helpers/setFunctionName.js"
    ],
    "./helpers/esm/setFunctionName": "./helpers/esm/setFunctionName.js",
    "./helpers/toPrimitive": [
      {
        "node": "./helpers/toPrimitive.js",
        "import": "./helpers/esm/toPrimitive.js",
        "default": "./helpers/toPrimitive.js"
      },
      "./helpers/toPrimitive.js"
    ],
    "./helpers/esm/toPrimitive": "./helpers/esm/toPrimitive.js",
    "./helpers/toPropertyKey": [
      {
        "node": "./helpers/toPropertyKey.js",
        "import": "./helpers/esm/toPropertyKey.js",
        "default": "./helpers/toPropertyKey.js"
      },
      "./helpers/toPropertyKey.js"
    ],
    "./helpers/esm/toPropertyKey": "./helpers/esm/toPropertyKey.js",
    "./helpers/toSetter": [
      {
        "node": "./helpers/toSetter.js",
        "import": "./helpers/esm/toSetter.js",
        "default": "./helpers/toSetter.js"
      },
      "./helpers/toSetter.js"
    ],
    "./helpers/esm/toSetter": "./helpers/esm/toSetter.js",
    "./helpers/typeof": [
      {
        "node": "./helpers/typeof.js",
        "import": "./helpers/esm/typeof.js",
        "default": "./helpers/typeof.js"
      },
      "./helpers/typeof.js"
    ],
    "./helpers/esm/typeof": "./helpers/esm/typeof.js",
    "./helpers/using": [
      {
        "node": "./helpers/using.js",
        "import": "./helpers/esm/using.js",
        "default": "./helpers/using.js"
      },
      "./helpers/using.js"
    ],
    "./helpers/esm/using": "./helpers/esm/using.js",
    "./helpers/usingCtx": [
      {
        "node": "./helpers/usingCtx.js",
        "import": "./helpers/esm/usingCtx.js",
        "default": "./helpers/usingCtx.js"
      },
      "./helpers/usingCtx.js"
    ],
    "./helpers/esm/usingCtx": "./helpers/esm/usingCtx.js",
    "./helpers/wrapRegExp": [
      {
        "node": "./helpers/wrapRegExp.js",
        "import": "./helpers/esm/wrapRegExp.js",
        "default": "./helpers/wrapRegExp.js"
      },
      "./helpers/wrapRegExp.js"
    ],
    "./helpers/esm/wrapRegExp": "./helpers/esm/wrapRegExp.js",
    "./helpers/AwaitValue": [
      {
        "node": "./helpers/AwaitValue.js",
        "import": "./helpers/esm/AwaitValue.js",
        "default": "./helpers/AwaitValue.js"
      },
      "./helpers/AwaitValue.js"
    ],
    "./helpers/esm/AwaitValue": "./helpers/esm/AwaitValue.js",
    "./helpers/wrapAsyncGenerator": [
      {
        "node": "./helpers/wrapAsyncGenerator.js",
        "import": "./helpers/esm/wrapAsyncGenerator.js",
        "default": "./helpers/wrapAsyncGenerator.js"
      },
      "./helpers/wrapAsyncGenerator.js"
    ],
    "./helpers/esm/wrapAsyncGenerator": "./helpers/esm/wrapAsyncGenerator.js",
    "./helpers/asyncToGenerator": [
      {
        "node": "./helpers/asyncToGenerator.js",
        "import": "./helpers/esm/asyncToGenerator.js",
        "default": "./helpers/asyncToGenerator.js"
      },
      "./helpers/asyncToGenerator.js"
    ],
    "./helpers/esm/asyncToGenerator": "./helpers/esm/asyncToGenerator.js",
    "./helpers/classCallCheck": [
      {
        "node": "./helpers/classCallCheck.js",
        "import": "./helpers/esm/classCallCheck.js",
        "default": "./helpers/classCallCheck.js"
      },
      "./helpers/classCallCheck.js"
    ],
    "./helpers/esm/classCallCheck": "./helpers/esm/classCallCheck.js",
    "./helpers/createClass": [
      {
        "node": "./helpers/createClass.js",
        "import": "./helpers/esm/createClass.js",
        "default": "./helpers/createClass.js"
      },
      "./helpers/createClass.js"
    ],
    "./helpers/esm/createClass": "./helpers/esm/createClass.js",
    "./helpers/defineEnumerableProperties": [
      {
        "node": "./helpers/defineEnumerableProperties.js",
        "import": "./helpers/esm/defineEnumerableProperties.js",
        "default": "./helpers/defineEnumerableProperties.js"
      },
      "./helpers/defineEnumerableProperties.js"
    ],
    "./helpers/esm/defineEnumerableProperties": "./helpers/esm/defineEnumerableProperties.js",
    "./helpers/defaults": [
      {
        "node": "./helpers/defaults.js",
        "import": "./helpers/esm/defaults.js",
        "default": "./helpers/defaults.js"
      },
      "./helpers/defaults.js"
    ],
    "./helpers/esm/defaults": "./helpers/esm/defaults.js",
    "./helpers/defineProperty": [
      {
        "node": "./helpers/defineProperty.js",
        "import": "./helpers/esm/defineProperty.js",
        "default": "./helpers/defineProperty.js"
      },
      "./helpers/defineProperty.js"
    ],
    "./helpers/esm/defineProperty": "./helpers/esm/defineProperty.js",
    "./helpers/extends": [
      {
        "node": "./helpers/extends.js",
        "import": "./helpers/esm/extends.js",
        "default": "./helpers/extends.js"
      },
      "./helpers/extends.js"
    ],
    "./helpers/esm/extends": "./helpers/esm/extends.js",
    "./helpers/objectSpread": [
      {
        "node": "./helpers/objectSpread.js",
        "import": "./helpers/esm/objectSpread.js",
        "default": "./helpers/objectSpread.js"
      },
      "./helpers/objectSpread.js"
    ],
    "./helpers/esm/objectSpread": "./helpers/esm/objectSpread.js",
    "./helpers/inherits": [
      {
        "node": "./helpers/inherits.js",
        "import": "./helpers/esm/inherits.js",
        "default": "./helpers/inherits.js"
      },
      "./helpers/inherits.js"
    ],
    "./helpers/esm/inherits": "./helpers/esm/inherits.js",
    "./helpers/inheritsLoose": [
      {
        "node": "./helpers/inheritsLoose.js",
        "import": "./helpers/esm/inheritsLoose.js",
        "default": "./helpers/inheritsLoose.js"
      },
      "./helpers/inheritsLoose.js"
    ],
    "./helpers/esm/inheritsLoose": "./helpers/esm/inheritsLoose.js",
    "./helpers/getPrototypeOf": [
      {
        "node": "./helpers/getPrototypeOf.js",
        "import": "./helpers/esm/getPrototypeOf.js",
        "default": "./helpers/getPrototypeOf.js"
      },
      "./helpers/getPrototypeOf.js"
    ],
    "./helpers/esm/getPrototypeOf": "./helpers/esm/getPrototypeOf.js",
    "./helpers/setPrototypeOf": [
      {
        "node": "./helpers/setPrototypeOf.js",
        "import": "./helpers/esm/setPrototypeOf.js",
        "default": "./helpers/setPrototypeOf.js"
      },
      "./helpers/setPrototypeOf.js"
    ],
    "./helpers/esm/setPrototypeOf": "./helpers/esm/setPrototypeOf.js",
    "./helpers/isNativeFunction": [
      {
        "node": "./helpers/isNativeFunction.js",
        "import": "./helpers/esm/isNativeFunction.js",
        "default": "./helpers/isNativeFunction.js"
      },
      "./helpers/isNativeFunction.js"
    ],
    "./helpers/esm/isNativeFunction": "./helpers/esm/isNativeFunction.js",
    "./helpers/wrapNativeSuper": [
      {
        "node": "./helpers/wrapNativeSuper.js",
        "import": "./helpers/esm/wrapNativeSuper.js",
        "default": "./helpers/wrapNativeSuper.js"
      },
      "./helpers/wrapNativeSuper.js"
    ],
    "./helpers/esm/wrapNativeSuper": "./helpers/esm/wrapNativeSuper.js",
    "./helpers/instanceof": [
      {
        "node": "./helpers/instanceof.js",
        "import": "./helpers/esm/instanceof.js",
        "default": "./helpers/instanceof.js"
      },
      "./helpers/instanceof.js"
    ],
    "./helpers/esm/instanceof": "./helpers/esm/instanceof.js",
    "./helpers/interopRequireDefault": [
      {
        "node": "./helpers/interopRequireDefault.js",
        "import": "./helpers/esm/interopRequireDefault.js",
        "default": "./helpers/interopRequireDefault.js"
      },
      "./helpers/interopRequireDefault.js"
    ],
    "./helpers/esm/interopRequireDefault": "./helpers/esm/interopRequireDefault.js",
    "./helpers/newArrowCheck": [
      {
        "node": "./helpers/newArrowCheck.js",
        "import": "./helpers/esm/newArrowCheck.js",
        "default": "./helpers/newArrowCheck.js"
      },
      "./helpers/newArrowCheck.js"
    ],
    "./helpers/esm/newArrowCheck": "./helpers/esm/newArrowCheck.js",
    "./helpers/objectDestructuringEmpty": [
      {
        "node": "./helpers/objectDestructuringEmpty.js",
        "import": "./helpers/esm/objectDestructuringEmpty.js",
        "default": "./helpers/objectDestructuringEmpty.js"
      },
      "./helpers/objectDestructuringEmpty.js"
    ],
    "./helpers/esm/objectDestructuringEmpty": "./helpers/esm/objectDestructuringEmpty.js",
    "./helpers/objectWithoutPropertiesLoose": [
      {
        "node": "./helpers/objectWithoutPropertiesLoose.js",
        "import": "./helpers/esm/objectWithoutPropertiesLoose.js",
        "default": "./helpers/objectWithoutPropertiesLoose.js"
      },
      "./helpers/objectWithoutPropertiesLoose.js"
    ],
    "./helpers/esm/objectWithoutPropertiesLoose": "./helpers/esm/objectWithoutPropertiesLoose.js",
    "./helpers/objectWithoutProperties": [
      {
        "node": "./helpers/objectWithoutProperties.js",
        "import": "./helpers/esm/objectWithoutProperties.js",
        "default": "./helpers/objectWithoutProperties.js"
      },
      "./helpers/objectWithoutProperties.js"
    ],
    "./helpers/esm/objectWithoutProperties": "./helpers/esm/objectWithoutProperties.js",
    "./helpers/assertThisInitialized": [
      {
        "node": "./helpers/assertThisInitialized.js",
        "import": "./helpers/esm/assertThisInitialized.js",
        "default": "./helpers/assertThisInitialized.js"
      },
      "./helpers/assertThisInitialized.js"
    ],
    "./helpers/esm/assertThisInitialized": "./helpers/esm/assertThisInitialized.js",
    "./helpers/possibleConstructorReturn": [
      {
        "node": "./helpers/possibleConstructorReturn.js",
        "import": "./helpers/esm/possibleConstructorReturn.js",
        "default": "./helpers/possibleConstructorReturn.js"
      },
      "./helpers/possibleConstructorReturn.js"
    ],
    "./helpers/esm/possibleConstructorReturn": "./helpers/esm/possibleConstructorReturn.js",
    "./helpers/createSuper": [
      {
        "node": "./helpers/createSuper.js",
        "import": "./helpers/esm/createSuper.js",
        "default": "./helpers/createSuper.js"
      },
      "./helpers/createSuper.js"
    ],
    "./helpers/esm/createSuper": "./helpers/esm/createSuper.js",
    "./helpers/superPropBase": [
      {
        "node": "./helpers/superPropBase.js",
        "import": "./helpers/esm/superPropBase.js",
        "default": "./helpers/superPropBase.js"
      },
      "./helpers/superPropBase.js"
    ],
    "./helpers/esm/superPropBase": "./helpers/esm/superPropBase.js",
    "./helpers/get": [
      {
        "node": "./helpers/get.js",
        "import": "./helpers/esm/get.js",
        "default": "./helpers/get.js"
      },
      "./helpers/get.js"
    ],
    "./helpers/esm/get": "./helpers/esm/get.js",
    "./helpers/set": [
      {
        "node": "./helpers/set.js",
        "import": "./helpers/esm/set.js",
        "default": "./helpers/set.js"
      },
      "./helpers/set.js"
    ],
    "./helpers/esm/set": "./helpers/esm/set.js",
    "./helpers/taggedTemplateLiteral": [
      {
        "node": "./helpers/taggedTemplateLiteral.js",
        "import": "./helpers/esm/taggedTemplateLiteral.js",
        "default": "./helpers/taggedTemplateLiteral.js"
      },
      "./helpers/taggedTemplateLiteral.js"
    ],
    "./helpers/esm/taggedTemplateLiteral": "./helpers/esm/taggedTemplateLiteral.js",
    "./helpers/taggedTemplateLiteralLoose": [
      {
        "node": "./helpers/taggedTemplateLiteralLoose.js",
        "import": "./helpers/esm/taggedTemplateLiteralLoose.js",
        "default": "./helpers/taggedTemplateLiteralLoose.js"
      },
      "./helpers/taggedTemplateLiteralLoose.js"
    ],
    "./helpers/esm/taggedTemplateLiteralLoose": "./helpers/esm/taggedTemplateLiteralLoose.js",
    "./helpers/readOnlyError": [
      {
        "node": "./helpers/readOnlyError.js",
        "import": "./helpers/esm/readOnlyError.js",
        "default": "./helpers/readOnlyError.js"
      },
      "./helpers/readOnlyError.js"
    ],
    "./helpers/esm/readOnlyError": "./helpers/esm/readOnlyError.js",
    "./helpers/writeOnlyError": [
      {
        "node": "./helpers/writeOnlyError.js",
        "import": "./helpers/esm/writeOnlyError.js",
        "default": "./helpers/writeOnlyError.js"
      },
      "./helpers/writeOnlyError.js"
    ],
    "./helpers/esm/writeOnlyError": "./helpers/esm/writeOnlyError.js",
    "./helpers/classNameTDZError": [
      {
        "node": "./helpers/classNameTDZError.js",
        "import": "./helpers/esm/classNameTDZError.js",
        "default": "./helpers/classNameTDZError.js"
      },
      "./helpers/classNameTDZError.js"
    ],
    "./helpers/esm/classNameTDZError": "./helpers/esm/classNameTDZError.js",
    "./helpers/temporalUndefined": [
      {
        "node": "./helpers/temporalUndefined.js",
        "import": "./helpers/esm/temporalUndefined.js",
        "default": "./helpers/temporalUndefined.js"
      },
      "./helpers/temporalUndefined.js"
    ],
    "./helpers/esm/temporalUndefined": "./helpers/esm/temporalUndefined.js",
    "./helpers/tdz": [
      {
        "node": "./helpers/tdz.js",
        "import": "./helpers/esm/tdz.js",
        "default": "./helpers/tdz.js"
      },
      "./helpers/tdz.js"
    ],
    "./helpers/esm/tdz": "./helpers/esm/tdz.js",
    "./helpers/temporalRef": [
      {
        "node": "./helpers/temporalRef.js",
        "import": "./helpers/esm/temporalRef.js",
        "default": "./helpers/temporalRef.js"
      },
      "./helpers/temporalRef.js"
    ],
    "./helpers/esm/temporalRef": "./helpers/esm/temporalRef.js",
    "./helpers/slicedToArray": [
      {
        "node": "./helpers/slicedToArray.js",
        "import": "./helpers/esm/slicedToArray.js",
        "default": "./helpers/slicedToArray.js"
      },
      "./helpers/slicedToArray.js"
    ],
    "./helpers/esm/slicedToArray": "./helpers/esm/slicedToArray.js",
    "./helpers/slicedToArrayLoose": [
      {
        "node": "./helpers/slicedToArrayLoose.js",
        "import": "./helpers/esm/slicedToArrayLoose.js",
        "default": "./helpers/slicedToArrayLoose.js"
      },
      "./helpers/slicedToArrayLoose.js"
    ],
    "./helpers/esm/slicedToArrayLoose": "./helpers/esm/slicedToArrayLoose.js",
    "./helpers/toArray": [
      {
        "node": "./helpers/toArray.js",
        "import": "./helpers/esm/toArray.js",
        "default": "./helpers/toArray.js"
      },
      "./helpers/toArray.js"
    ],
    "./helpers/esm/toArray": "./helpers/esm/toArray.js",
    "./helpers/toConsumableArray": [
      {
        "node": "./helpers/toConsumableArray.js",
        "import": "./helpers/esm/toConsumableArray.js",
        "default": "./helpers/toConsumableArray.js"
      },
      "./helpers/toConsumableArray.js"
    ],
    "./helpers/esm/toConsumableArray": "./helpers/esm/toConsumableArray.js",
    "./helpers/arrayWithoutHoles": [
      {
        "node": "./helpers/arrayWithoutHoles.js",
        "import": "./helpers/esm/arrayWithoutHoles.js",
        "default": "./helpers/arrayWithoutHoles.js"
      },
      "./helpers/arrayWithoutHoles.js"
    ],
    "./helpers/esm/arrayWithoutHoles": "./helpers/esm/arrayWithoutHoles.js",
    "./helpers/arrayWithHoles": [
      {
        "node": "./helpers/arrayWithHoles.js",
        "import": "./helpers/esm/arrayWithHoles.js",
        "default": "./helpers/arrayWithHoles.js"
      },
      "./helpers/arrayWithHoles.js"
    ],
    "./helpers/esm/arrayWithHoles": "./helpers/esm/arrayWithHoles.js",
    "./helpers/maybeArrayLike": [
      {
        "node": "./helpers/maybeArrayLike.js",
        "import": "./helpers/esm/maybeArrayLike.js",
        "default": "./helpers/maybeArrayLike.js"
      },
      "./helpers/maybeArrayLike.js"
    ],
    "./helpers/esm/maybeArrayLike": "./helpers/esm/maybeArrayLike.js",
    "./helpers/iterableToArray": [
      {
        "node": "./helpers/iterableToArray.js",
        "import": "./helpers/esm/iterableToArray.js",
        "default": "./helpers/iterableToArray.js"
      },
      "./helpers/iterableToArray.js"
    ],
    "./helpers/esm/iterableToArray": "./helpers/esm/iterableToArray.js",
    "./helpers/unsupportedIterableToArray": [
      {
        "node": "./helpers/unsupportedIterableToArray.js",
        "import": "./helpers/esm/unsupportedIterableToArray.js",
        "default": "./helpers/unsupportedIterableToArray.js"
      },
      "./helpers/unsupportedIterableToArray.js"
    ],
    "./helpers/esm/unsupportedIterableToArray": "./helpers/esm/unsupportedIterableToArray.js",
    "./helpers/arrayLikeToArray": [
      {
        "node": "./helpers/arrayLikeToArray.js",
        "import": "./helpers/esm/arrayLikeToArray.js",
        "default": "./helpers/arrayLikeToArray.js"
      },
      "./helpers/arrayLikeToArray.js"
    ],
    "./helpers/esm/arrayLikeToArray": "./helpers/esm/arrayLikeToArray.js",
    "./helpers/nonIterableSpread": [
      {
        "node": "./helpers/nonIterableSpread.js",
        "import": "./helpers/esm/nonIterableSpread.js",
        "default": "./helpers/nonIterableSpread.js"
      },
      "./helpers/nonIterableSpread.js"
    ],
    "./helpers/esm/nonIterableSpread": "./helpers/esm/nonIterableSpread.js",
    "./helpers/nonIterableRest": [
      {
        "node": "./helpers/nonIterableRest.js",
        "import": "./helpers/esm/nonIterableRest.js",
        "default": "./helpers/nonIterableRest.js"
      },
      "./helpers/nonIterableRest.js"
    ],
    "./helpers/esm/nonIterableRest": "./helpers/esm/nonIterableRest.js",
    "./helpers/createForOfIteratorHelper": [
      {
        "node": "./helpers/createForOfIteratorHelper.js",
        "import": "./helpers/esm/createForOfIteratorHelper.js",
        "default": "./helpers/createForOfIteratorHelper.js"
      },
      "./helpers/createForOfIteratorHelper.js"
    ],
    "./helpers/esm/createForOfIteratorHelper": "./helpers/esm/createForOfIteratorHelper.js",
    "./helpers/createForOfIteratorHelperLoose": [
      {
        "node": "./helpers/createForOfIteratorHelperLoose.js",
        "import": "./helpers/esm/createForOfIteratorHelperLoose.js",
        "default": "./helpers/createForOfIteratorHelperLoose.js"
      },
      "./helpers/createForOfIteratorHelperLoose.js"
    ],
    "./helpers/esm/createForOfIteratorHelperLoose": "./helpers/esm/createForOfIteratorHelperLoose.js",
    "./helpers/skipFirstGeneratorNext": [
      {
        "node": "./helpers/skipFirstGeneratorNext.js",
        "import": "./helpers/esm/skipFirstGeneratorNext.js",
        "default": "./helpers/skipFirstGeneratorNext.js"
      },
      "./helpers/skipFirstGeneratorNext.js"
    ],
    "./helpers/esm/skipFirstGeneratorNext": "./helpers/esm/skipFirstGeneratorNext.js",
    "./helpers/initializerWarningHelper": [
      {
        "node": "./helpers/initializerWarningHelper.js",
        "import": "./helpers/esm/initializerWarningHelper.js",
        "default": "./helpers/initializerWarningHelper.js"
      },
      "./helpers/initializerWarningHelper.js"
    ],
    "./helpers/esm/initializerWarningHelper": "./helpers/esm/initializerWarningHelper.js",
    "./helpers/initializerDefineProperty": [
      {
        "node": "./helpers/initializerDefineProperty.js",
        "import": "./helpers/esm/initializerDefineProperty.js",
        "default": "./helpers/initializerDefineProperty.js"
      },
      "./helpers/initializerDefineProperty.js"
    ],
    "./helpers/esm/initializerDefineProperty": "./helpers/esm/initializerDefineProperty.js",
    "./helpers/applyDecoratedDescriptor": [
      {
        "node": "./helpers/applyDecoratedDescriptor.js",
        "import": "./helpers/esm/applyDecoratedDescriptor.js",
        "default": "./helpers/applyDecoratedDescriptor.js"
      },
      "./helpers/applyDecoratedDescriptor.js"
    ],
    "./helpers/esm/applyDecoratedDescriptor": "./helpers/esm/applyDecoratedDescriptor.js",
    "./helpers/classPrivateFieldLooseKey": [
      {
        "node": "./helpers/classPrivateFieldLooseKey.js",
        "import": "./helpers/esm/classPrivateFieldLooseKey.js",
        "default": "./helpers/classPrivateFieldLooseKey.js"
      },
      "./helpers/classPrivateFieldLooseKey.js"
    ],
    "./helpers/esm/classPrivateFieldLooseKey": "./helpers/esm/classPrivateFieldLooseKey.js",
    "./helpers/classPrivateFieldLooseBase": [
      {
        "node": "./helpers/classPrivateFieldLooseBase.js",
        "import": "./helpers/esm/classPrivateFieldLooseBase.js",
        "default": "./helpers/classPrivateFieldLooseBase.js"
      },
      "./helpers/classPrivateFieldLooseBase.js"
    ],
    "./helpers/esm/classPrivateFieldLooseBase": "./helpers/esm/classPrivateFieldLooseBase.js",
    "./helpers/classPrivateFieldGet": [
      {
        "node": "./helpers/classPrivateFieldGet.js",
        "import": "./helpers/esm/classPrivateFieldGet.js",
        "default": "./helpers/classPrivateFieldGet.js"
      },
      "./helpers/classPrivateFieldGet.js"
    ],
    "./helpers/esm/classPrivateFieldGet": "./helpers/esm/classPrivateFieldGet.js",
    "./helpers/classPrivateFieldSet": [
      {
        "node": "./helpers/classPrivateFieldSet.js",
        "import": "./helpers/esm/classPrivateFieldSet.js",
        "default": "./helpers/classPrivateFieldSet.js"
      },
      "./helpers/classPrivateFieldSet.js"
    ],
    "./helpers/esm/classPrivateFieldSet": "./helpers/esm/classPrivateFieldSet.js",
    "./helpers/classPrivateFieldDestructureSet": [
      {
        "node": "./helpers/classPrivateFieldDestructureSet.js",
        "import": "./helpers/esm/classPrivateFieldDestructureSet.js",
        "default": "./helpers/classPrivateFieldDestructureSet.js"
      },
      "./helpers/classPrivateFieldDestructureSet.js"
    ],
    "./helpers/esm/classPrivateFieldDestructureSet": "./helpers/esm/classPrivateFieldDestructureSet.js",
    "./helpers/classExtractFieldDescriptor": [
      {
        "node": "./helpers/classExtractFieldDescriptor.js",
        "import": "./helpers/esm/classExtractFieldDescriptor.js",
        "default": "./helpers/classExtractFieldDescriptor.js"
      },
      "./helpers/classExtractFieldDescriptor.js"
    ],
    "./helpers/esm/classExtractFieldDescriptor": "./helpers/esm/classExtractFieldDescriptor.js",
    "./helpers/classStaticPrivateFieldSpecGet": [
      {
        "node": "./helpers/classStaticPrivateFieldSpecGet.js",
        "import": "./helpers/esm/classStaticPrivateFieldSpecGet.js",
        "default": "./helpers/classStaticPrivateFieldSpecGet.js"
      },
      "./helpers/classStaticPrivateFieldSpecGet.js"
    ],
    "./helpers/esm/classStaticPrivateFieldSpecGet": "./helpers/esm/classStaticPrivateFieldSpecGet.js",
    "./helpers/classStaticPrivateFieldSpecSet": [
      {
        "node": "./helpers/classStaticPrivateFieldSpecSet.js",
        "import": "./helpers/esm/classStaticPrivateFieldSpecSet.js",
        "default": "./helpers/classStaticPrivateFieldSpecSet.js"
      },
      "./helpers/classStaticPrivateFieldSpecSet.js"
    ],
    "./helpers/esm/classStaticPrivateFieldSpecSet": "./helpers/esm/classStaticPrivateFieldSpecSet.js",
    "./helpers/classStaticPrivateMethodGet": [
      {
        "node": "./helpers/classStaticPrivateMethodGet.js",
        "import": "./helpers/esm/classStaticPrivateMethodGet.js",
        "default": "./helpers/classStaticPrivateMethodGet.js"
      },
      "./helpers/classStaticPrivateMethodGet.js"
    ],
    "./helpers/esm/classStaticPrivateMethodGet": "./helpers/esm/classStaticPrivateMethodGet.js",
    "./helpers/classStaticPrivateMethodSet": [
      {
        "node": "./helpers/classStaticPrivateMethodSet.js",
        "import": "./helpers/esm/classStaticPrivateMethodSet.js",
        "default": "./helpers/classStaticPrivateMethodSet.js"
      },
      "./helpers/classStaticPrivateMethodSet.js"
    ],
    "./helpers/esm/classStaticPrivateMethodSet": "./helpers/esm/classStaticPrivateMethodSet.js",
    "./helpers/classApplyDescriptorGet": [
      {
        "node": "./helpers/classApplyDescriptorGet.js",
        "import": "./helpers/esm/classApplyDescriptorGet.js",
        "default": "./helpers/classApplyDescriptorGet.js"
      },
      "./helpers/classApplyDescriptorGet.js"
    ],
    "./helpers/esm/classApplyDescriptorGet": "./helpers/esm/classApplyDescriptorGet.js",
    "./helpers/classApplyDescriptorSet": [
      {
        "node": "./helpers/classApplyDescriptorSet.js",
        "import": "./helpers/esm/classApplyDescriptorSet.js",
        "default": "./helpers/classApplyDescriptorSet.js"
      },
      "./helpers/classApplyDescriptorSet.js"
    ],
    "./helpers/esm/classApplyDescriptorSet": "./helpers/esm/classApplyDescriptorSet.js",
    "./helpers/classApplyDescriptorDestructureSet": [
      {
        "node": "./helpers/classApplyDescriptorDestructureSet.js",
        "import": "./helpers/esm/classApplyDescriptorDestructureSet.js",
        "default": "./helpers/classApplyDescriptorDestructureSet.js"
      },
      "./helpers/classApplyDescriptorDestructureSet.js"
    ],
    "./helpers/esm/classApplyDescriptorDestructureSet": "./helpers/esm/classApplyDescriptorDestructureSet.js",
    "./helpers/classStaticPrivateFieldDestructureSet": [
      {
        "node": "./helpers/classStaticPrivateFieldDestructureSet.js",
        "import": "./helpers/esm/classStaticPrivateFieldDestructureSet.js",
        "default": "./helpers/classStaticPrivateFieldDestructureSet.js"
      },
      "./helpers/classStaticPrivateFieldDestructureSet.js"
    ],
    "./helpers/esm/classStaticPrivateFieldDestructureSet": "./helpers/esm/classStaticPrivateFieldDestructureSet.js",
    "./helpers/classCheckPrivateStaticAccess": [
      {
        "node": "./helpers/classCheckPrivateStaticAccess.js",
        "import": "./helpers/esm/classCheckPrivateStaticAccess.js",
        "default": "./helpers/classCheckPrivateStaticAccess.js"
      },
      "./helpers/classCheckPrivateStaticAccess.js"
    ],
    "./helpers/esm/classCheckPrivateStaticAccess": "./helpers/esm/classCheckPrivateStaticAccess.js",
    "./helpers/classCheckPrivateStaticFieldDescriptor": [
      {
        "node": "./helpers/classCheckPrivateStaticFieldDescriptor.js",
        "import": "./helpers/esm/classCheckPrivateStaticFieldDescriptor.js",
        "default": "./helpers/classCheckPrivateStaticFieldDescriptor.js"
      },
      "./helpers/classCheckPrivateStaticFieldDescriptor.js"
    ],
    "./helpers/esm/classCheckPrivateStaticFieldDescriptor": "./helpers/esm/classCheckPrivateStaticFieldDescriptor.js",
    "./helpers/decorate": [
      {
        "node": "./helpers/decorate.js",
        "import": "./helpers/esm/decorate.js",
        "default": "./helpers/decorate.js"
      },
      "./helpers/decorate.js"
    ],
    "./helpers/esm/decorate": "./helpers/esm/decorate.js",
    "./helpers/classPrivateMethodGet": [
      {
        "node": "./helpers/classPrivateMethodGet.js",
        "import": "./helpers/esm/classPrivateMethodGet.js",
        "default": "./helpers/classPrivateMethodGet.js"
      },
      "./helpers/classPrivateMethodGet.js"
    ],
    "./helpers/esm/classPrivateMethodGet": "./helpers/esm/classPrivateMethodGet.js",
    "./helpers/checkPrivateRedeclaration": [
      {
        "node": "./helpers/checkPrivateRedeclaration.js",
        "import": "./helpers/esm/checkPrivateRedeclaration.js",
        "default": "./helpers/checkPrivateRedeclaration.js"
      },
      "./helpers/checkPrivateRedeclaration.js"
    ],
    "./helpers/esm/checkPrivateRedeclaration": "./helpers/esm/checkPrivateRedeclaration.js",
    "./helpers/classPrivateFieldInitSpec": [
      {
        "node": "./helpers/classPrivateFieldInitSpec.js",
        "import": "./helpers/esm/classPrivateFieldInitSpec.js",
        "default": "./helpers/classPrivateFieldInitSpec.js"
      },
      "./helpers/classPrivateFieldInitSpec.js"
    ],
    "./helpers/esm/classPrivateFieldInitSpec": "./helpers/esm/classPrivateFieldInitSpec.js",
    "./helpers/classPrivateMethodInitSpec": [
      {
        "node": "./helpers/classPrivateMethodInitSpec.js",
        "import": "./helpers/esm/classPrivateMethodInitSpec.js",
        "default": "./helpers/classPrivateMethodInitSpec.js"
      },
      "./helpers/classPrivateMethodInitSpec.js"
    ],
    "./helpers/esm/classPrivateMethodInitSpec": "./helpers/esm/classPrivateMethodInitSpec.js",
    "./helpers/classPrivateMethodSet": [
      {
        "node": "./helpers/classPrivateMethodSet.js",
        "import": "./helpers/esm/classPrivateMethodSet.js",
        "default": "./helpers/classPrivateMethodSet.js"
      },
      "./helpers/classPrivateMethodSet.js"
    ],
    "./helpers/esm/classPrivateMethodSet": "./helpers/esm/classPrivateMethodSet.js",
    "./helpers/identity": [
      {
        "node": "./helpers/identity.js",
        "import": "./helpers/esm/identity.js",
        "default": "./helpers/identity.js"
      },
      "./helpers/identity.js"
    ],
    "./helpers/esm/identity": "./helpers/esm/identity.js",
    "./helpers/nullishReceiverError": [
      {
        "node": "./helpers/nullishReceiverError.js",
        "import": "./helpers/esm/nullishReceiverError.js",
        "default": "./helpers/nullishReceiverError.js"
      },
      "./helpers/nullishReceiverError.js"
    ],
    "./helpers/esm/nullishReceiverError": "./helpers/esm/nullishReceiverError.js",
    "./package": "./package.json",
    "./package.json": "./package.json",
    "./regenerator": "./regenerator/index.js",
    "./regenerator/*.js": "./regenerator/*.js",
    "./regenerator/": "./regenerator/"
  },
  "homepage": "https://babel.dev/docs/en/next/babel-runtime",
  "license": "MIT",
  "name": "@babel/runtime",
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/babel/babel.git",
    "directory": "packages/babel-runtime"
  },
  "type": "commonjs",
  "version": "7.24.0"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"helpers":{"objectSpread2.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/objectSpread2.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"objectWithoutProperties.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/@babel/runtime/helpers/objectWithoutProperties.js                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".mjs",
    ".jsx"
  ]
});

var exports = require("/node_modules/meteor/modules/server.js");

/* Exports */
Package._define("modules", exports, {
  meteorInstall: meteorInstall
});

})();
