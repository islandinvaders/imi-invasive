(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MeteorX = Package['montiapm:meteorx'].MeteorX;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var EJSON = Package.ejson.EJSON;
var DDPCommon = Package['ddp-common'].DDPCommon;
var _ = Package.underscore._;
var Random = Package.random.Random;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Kadira, Monti;

var require = meteorInstall({"node_modules":{"meteor":{"montiapm:agent":{"lib":{"common":{"utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/common/utils.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  getClientArchVersion: () => getClientArchVersion,
  getErrorParameters: () => getErrorParameters,
  objectHasData: () => objectHasData,
  millisToHuman: () => millisToHuman
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
function getClientArchVersion(arch) {
  const autoupdate = __meteor_runtime_config__.autoupdate;
  if (autoupdate) {
    return autoupdate.versions[arch] ? autoupdate.versions[arch].version : 'none';
  }

  // Meteor 1.7 and older did not have an `autoupdate` object.
  switch (arch) {
    case 'cordova.web':
      return __meteor_runtime_config__.autoupdateVersionCordova;
    case 'web.browser':
    case 'web.browser.legacy':
      // Meteor 1.7 always used the web.browser.legacy version
      return __meteor_runtime_config__.autoupdateVersion;
    default:
      return 'none';
  }
}
const createStackTrace = () => {
  if (Error.captureStackTrace) {
    let err = {};
    Error.captureStackTrace(err, Kadira.trackError);
    return err.stack;
  }
  const stack = new Error().stack.split('\n');
  let toRemove = 0;

  // Remove frames starting from when trackError was called
  for (; toRemove < stack.length; toRemove++) {
    if (stack[toRemove].indexOf('trackError') > -1) {
      toRemove += 1;
      break;
    }
  }

  // In safari, there isn't a frame that has trackError
  if (toRemove === stack.length) {
    return stack.join('\n');
  }
  return stack.slice(toRemove).join('\n');
};
const getErrorParameters = function (args) {
  let type = null;
  let message = null;
  let subType = null;
  let stack = null;
  let kadiraInfo = null;
  if (!(args[0] instanceof Error) && typeof args[0] === 'string' && typeof args[1] === 'string') {
    // Old usage:
    // Monti.trackError(
    //   'type', 'error message', { stacks: 'error stack', subType: 'sub type }
    // );

    const options = args[2] || {};
    type = args[0];
    subType = Meteor.isClient ? args[0] : options.subType;
    message = args[1];
    stack = options.stacks || createStackTrace();
    kadiraInfo = options.kadiraInfo;
  } else {
    // New usage:
    // Monti.trackError(error, { type: 'type', subType: 'subType' });
    const error = args[0];
    const options = args[1] || {};
    const isErrorObject = typeof error === 'object' && error !== null;
    message = isErrorObject ? error.message : error;
    stack = isErrorObject && error.stack || createStackTrace();
    type = options.type;
    subType = options.subType;
    kadiraInfo = options.kadiraInfo;
  }
  return {
    type,
    message,
    subType,
    stack,
    kadiraInfo
  };
};
const objectHasData = function (obj) {
  return Object.values(obj).some(val => ![null, undefined, ''].includes(val));
};
const millisToHuman = function (milliseconds) {
  const millis = milliseconds % 1000;
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const builder = [];
  if (days > 0) {
    builder.push("".concat(days, "d"));
  }
  if (hours > 0) {
    builder.push("".concat(hours % 24, "h"));
  }
  if (minutes > 0) {
    builder.push("".concat(minutes % 60, "m"));
  }
  if (seconds > 0) {
    builder.push("".concat(seconds % 60, "s"));
  }
  if (millis > 0) {
    builder.push("".concat(millis, "ms"));
  }
  return builder.join(' ');
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"unify.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/common/unify.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
Kadira = {};
Kadira.options = {};
Monti = Kadira;
if (Meteor.wrapAsync) {
  Kadira._wrapAsync = Meteor.wrapAsync;
} else {
  Kadira._wrapAsync = Meteor._wrapAsync;
}
if (Meteor.isServer) {
  const EventEmitter = Npm.require('events').EventEmitter;
  const eventBus = new EventEmitter();
  eventBus.setMaxListeners(0);
  const buildArgs = function (args) {
    let eventName = "".concat(args[0], "-").concat(args[1]);
    args = args.slice(2);
    args.unshift(eventName);
    return args;
  };
  Kadira.EventBus = {};
  ['on', 'emit', 'removeListener', 'removeAllListeners', 'once'].forEach(function (m) {
    Kadira.EventBus[m] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      const _args = buildArgs(args);
      return eventBus[m](..._args);
    };
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"default_error_filters.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/common/default_error_filters.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
const commonErrRegExps = [/connection timeout\. no (\w*) heartbeat received/i, /INVALID_STATE_ERR/i];
Kadira.errorFilters = {
  filterValidationErrors(type, message, err) {
    if (err && err instanceof Meteor.Error) {
      return false;
    }
    return true;
  },
  filterCommonMeteorErrors(type, message) {
    for (let lc = 0; lc < commonErrRegExps.length; lc++) {
      const regExp = commonErrRegExps[lc];
      if (regExp.test(message)) {
        return false;
      }
    }
    return true;
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"send.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/common/send.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Retry;
module.link("../retry", {
  Retry(v) {
    Retry = v;
  }
}, 1);
Kadira.send = function (payload, path, callback) {
  if (!Kadira.connected) {
    throw new Error('You need to connect with Kadira first, before sending messages!');
  }
  path = path.substr(0, 1) !== '/' ? "/".concat(path) : path;
  let endpoint = Kadira.options.endpoint + path;
  let retryCount = 0;
  let retry = new Retry({
    minCount: 1,
    minTimeout: 0,
    baseTimeout: 1000 * 5,
    maxTimeout: 1000 * 60
  });
  let sendFunction = Kadira._getSendFunction();
  tryToSend();
  function tryToSend(err) {
    if (retryCount < 5) {
      retry.retryLater(retryCount++, send);
    } else {
      console.warn('Error sending error traces to Monti APM server');
      if (callback) {
        callback(err);
      }
    }
  }
  function send() {
    sendFunction(endpoint, payload, function (err, res) {
      if (err && !res) {
        tryToSend(err);
      } else if (res.statusCode === 200) {
        if (callback) {
          callback(null, res.data);
        }
      } else if (callback) {
        callback(new Meteor.Error(res.statusCode, res.content));
      }
    });
  }
};
Kadira._getSendFunction = function () {
  return Meteor.isServer ? Kadira._serverSend : Kadira._clientSend;
};
Kadira._clientSend = function (endpoint, payload, callback) {
  Kadira._makeHttpRequest('POST', endpoint, {
    headers: {
      'Content-Type': 'application/json'
    },
    content: JSON.stringify(payload)
  }, callback);
};
Kadira._serverSend = function () {
  throw new Error('Kadira._serverSend is not supported. Use coreApi instead.');
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"base_error.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/base_error.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  BaseErrorModel: () => BaseErrorModel
});
function BaseErrorModel() {
  this._filters = [];
}
BaseErrorModel.prototype.addFilter = function (filter) {
  if (typeof filter === 'function') {
    this._filters.push(filter);
  } else {
    throw new Error('Error filter must be a function');
  }
};
BaseErrorModel.prototype.removeFilter = function (filter) {
  const index = this._filters.indexOf(filter);
  if (index >= 0) {
    this._filters.splice(index, 1);
  }
};
BaseErrorModel.prototype.applyFilters = function (type, message, error, subType) {
  for (let lc = 0; lc < this._filters.length; lc++) {
    let filter = this._filters[lc];
    try {
      let validated = filter(type, message, error, subType);
      if (!validated) {
        return false;
      }
    } catch (ex) {
      // we need to remove this filter
      // we may ended up in an error cycle
      this._filters.splice(lc, 1);
      throw new Error("an error thrown from a filter you've suplied", ex.message);
    }
  }
  return true;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"0model.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/0model.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  KadiraModel: () => KadiraModel
});
function KadiraModel() {}
KadiraModel.prototype._getDateId = function (timestamp) {
  const remainder = timestamp % (1000 * 60);
  const dateId = timestamp - remainder;
  return dateId;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"methods.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/methods.js                                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  MethodsModel: () => MethodsModel
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let KadiraModel;
module.link("./0model", {
  KadiraModel(v) {
    KadiraModel = v;
  }
}, 1);
let TracerStore;
module.link("../tracer/tracer_store", {
  TracerStore(v) {
    TracerStore = v;
  }
}, 2);
let Ntp;
module.link("../ntp", {
  Ntp(v) {
    Ntp = v;
  }
}, 3);
const {
  DDSketch
} = require('monti-apm-sketches-js');
const METHOD_METRICS_FIELDS = ['wait', 'db', 'http', 'email', 'async', 'compute', 'total'];
function MethodsModel(metricsThreshold) {
  this.methodMetricsByMinute = Object.create(null);
  this.errorMap = Object.create(null);
  this._metricsThreshold = _.extend({
    wait: 100,
    db: 100,
    http: 1000,
    email: 100,
    async: 100,
    compute: 100,
    total: 200
  }, metricsThreshold || Object.create(null));

  // store max time elapsed methods for each method, event(metrics-field)
  this.maxEventTimesForMethods = Object.create(null);
  this.tracerStore = new TracerStore({
    // process traces every minute
    interval: 1000 * 60,
    // for 30 minutes
    maxTotalPoints: 30,
    // always trace for every 5 minutes
    archiveEvery: 5
  });
  this.tracerStore.start();
}
_.extend(MethodsModel.prototype, KadiraModel.prototype);
MethodsModel.prototype._getMetrics = function (timestamp, method) {
  const dateId = this._getDateId(timestamp);
  if (!this.methodMetricsByMinute[dateId]) {
    this.methodMetricsByMinute[dateId] = {
      methods: Object.create(null)
    };
  }
  let methods = this.methodMetricsByMinute[dateId].methods;

  // initialize method
  if (!methods[method]) {
    methods[method] = {
      count: 0,
      errors: 0,
      fetchedDocSize: 0,
      sentMsgSize: 0,
      histogram: new DDSketch({
        alpha: 0.02
      })
    };
    METHOD_METRICS_FIELDS.forEach(function (field) {
      methods[method][field] = 0;
    });
  }
  return this.methodMetricsByMinute[dateId].methods[method];
};
MethodsModel.prototype.processMethod = function (methodTrace) {
  const dateId = this._getDateId(methodTrace.at);

  // append metrics to previous values
  this._appendMetrics(dateId, methodTrace);
  if (methodTrace.errored) {
    this.methodMetricsByMinute[dateId].methods[methodTrace.name].errors++;
  }
  this.tracerStore.addTrace(methodTrace);
};
MethodsModel.prototype._appendMetrics = function (id, methodTrace) {
  const methodMetrics = this._getMetrics(id, methodTrace.name);

  // startTime needs to be converted into serverTime before sending
  if (!this.methodMetricsByMinute[id].startTime) {
    this.methodMetricsByMinute[id].startTime = methodTrace.at;
  }

  // merge
  METHOD_METRICS_FIELDS.forEach(function (field) {
    let value = methodTrace.metrics[field];
    if (value > 0) {
      methodMetrics[field] += value;
    }
  });
  methodMetrics.count++;
  methodMetrics.histogram.add(methodTrace.metrics.total);
  this.methodMetricsByMinute[id].endTime = methodTrace.metrics.at;
};
MethodsModel.prototype.trackDocSize = function (method, size) {
  const timestamp = Ntp._now();
  const dateId = this._getDateId(timestamp);
  let methodMetrics = this._getMetrics(dateId, method);
  methodMetrics.fetchedDocSize += size;
};
MethodsModel.prototype.trackMsgSize = function (method, size) {
  const timestamp = Ntp._now();
  const dateId = this._getDateId(timestamp);
  let methodMetrics = this._getMetrics(dateId, method);
  methodMetrics.sentMsgSize += size;
};

/*
  There are two types of data

  1. methodMetrics - metrics about the methods (for every 10 secs)
  2. methodRequests - raw method request. normally max, min for every 1 min and errors always
*/
MethodsModel.prototype.buildPayload = function () {
  const payload = {
    methodMetrics: [],
    methodRequests: []
  };

  // handling metrics
  let methodMetricsByMinute = this.methodMetricsByMinute;
  this.methodMetricsByMinute = Object.create(null);

  // create final payload for methodMetrics
  for (let key in methodMetricsByMinute) {
    const methodMetrics = methodMetricsByMinute[key];
    // converting startTime into the actual serverTime
    let startTime = methodMetrics.startTime;
    methodMetrics.startTime = Kadira.syncedDate.syncTime(startTime);
    for (let methodName in methodMetrics.methods) {
      METHOD_METRICS_FIELDS.forEach(function (field) {
        methodMetrics.methods[methodName][field] /= methodMetrics.methods[methodName].count;
      });
    }
    payload.methodMetrics.push(methodMetricsByMinute[key]);
  }

  // collect traces and send them with the payload
  payload.methodRequests = this.tracerStore.collectTraces();
  return payload;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pubsub.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/pubsub.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  PubsubModel: () => PubsubModel
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 1);
let KadiraModel;
module.link("./0model", {
  KadiraModel(v) {
    KadiraModel = v;
  }
}, 2);
let TracerStore;
module.link("../tracer/tracer_store", {
  TracerStore(v) {
    TracerStore = v;
  }
}, 3);
let Ntp;
module.link("../ntp", {
  Ntp(v) {
    Ntp = v;
  }
}, 4);
let countKeys, getProperty, iterate;
module.link("../utils", {
  countKeys(v) {
    countKeys = v;
  },
  getProperty(v) {
    getProperty = v;
  },
  iterate(v) {
    iterate = v;
  }
}, 5);
const logger = Npm.require('debug')('kadira:pubsub');
const {
  DDSketch
} = require('monti-apm-sketches-js');
function PubsubModel() {
  this.metricsByMinute = Object.create(null);
  this.subscriptions = Object.create(null);
  this.tracerStore = new TracerStore({
    // process traces every minute
    interval: 1000 * 60,
    // for 30 minutes
    maxTotalPoints: 30,
    // always trace for every 5 minutes
    archiveEvery: 5
  });
  this.tracerStore.start();
}
PubsubModel.prototype._trackSub = function (session, msg) {
  logger('SUB:', session.id, msg.id, msg.name, msg.params);
  let publication = this._getPublicationName(msg.name);
  let timestamp = Ntp._now();
  let metrics = this._getMetrics(timestamp, publication);
  metrics.subs++;
  this.subscriptions[msg.id] = {
    // We use localTime here, because when we used synedTime we might get
    // minus or more than we've expected
    //   (before serverTime diff changed overtime)
    startTime: timestamp,
    publication,
    params: msg.params,
    id: msg.id
  };

  // set session startedTime
  session._startTime = session._startTime || timestamp;
};
_.extend(PubsubModel.prototype, KadiraModel.prototype);
PubsubModel.prototype._trackUnsub = function (session, sub) {
  logger('UNSUB:', session.id, sub._subscriptionId);
  let publication = this._getPublicationName(sub._name);
  let subscriptionId = sub._subscriptionId;
  let subscriptionState = this.subscriptions[subscriptionId];
  let startTime = null;
  // sometime, we don't have these states
  if (subscriptionState) {
    startTime = subscriptionState.startTime;
  } else {
    // if this is null subscription, which is started automatically
    // hence, we don't have a state
    startTime = session._startTime;
  }

  // in case, we can't get the startTime
  if (startTime) {
    let timestamp = Ntp._now();
    let metrics = this._getMetrics(timestamp, publication);
    // track the count
    if (sub._name !== null) {
      // we can't track subs for `null` publications.
      // so we should not track unsubs too
      metrics.unsubs++;
    }
    // use the current date to get the lifeTime of the subscription
    metrics.lifeTime += timestamp - startTime;
    // this is place we can clean the subscriptionState if exists
    delete this.subscriptions[subscriptionId];
  }
};
PubsubModel.prototype._trackReady = function (session, sub, trace) {
  logger('READY:', session.id, sub._subscriptionId);
  // use the current time to track the response time
  let publication = this._getPublicationName(sub._name);
  let subscriptionId = sub._subscriptionId;
  let timestamp = Ntp._now();
  let metrics = this._getMetrics(timestamp, publication);
  let subscriptionState = this.subscriptions[subscriptionId];
  if (subscriptionState && !subscriptionState.readyTracked) {
    let resTime = timestamp - subscriptionState.startTime;
    metrics.resTime += resTime;
    subscriptionState.readyTracked = true;
    metrics.histogram.add(resTime);
  }
  if (trace) {
    this.tracerStore.addTrace(trace);
  }
};
PubsubModel.prototype._trackError = function (session, sub, trace) {
  logger('ERROR:', session.id, sub._subscriptionId);
  // use the current time to track the response time
  let publication = this._getPublicationName(sub._name);
  let timestamp = Ntp._now();
  let metrics = this._getMetrics(timestamp, publication);
  metrics.errors++;
  if (trace) {
    this.tracerStore.addTrace(trace);
  }
};
PubsubModel.prototype._getMetrics = function (timestamp, publication) {
  let dateId = this._getDateId(timestamp);
  if (!this.metricsByMinute[dateId]) {
    this.metricsByMinute[dateId] = {
      // startTime needs to be convert to serverTime before sending to the server
      startTime: timestamp,
      pubs: Object.create(null)
    };
  }
  if (!this.metricsByMinute[dateId].pubs[publication]) {
    this.metricsByMinute[dateId].pubs[publication] = {
      subs: 0,
      unsubs: 0,
      resTime: 0,
      activeSubs: 0,
      activeDocs: 0,
      lifeTime: 0,
      totalObservers: 0,
      cachedObservers: 0,
      createdObservers: 0,
      deletedObservers: 0,
      errors: 0,
      observerLifetime: 0,
      polledDocuments: 0,
      oplogUpdatedDocuments: 0,
      oplogInsertedDocuments: 0,
      oplogDeletedDocuments: 0,
      initiallyAddedDocuments: 0,
      liveAddedDocuments: 0,
      liveChangedDocuments: 0,
      liveRemovedDocuments: 0,
      polledDocSize: 0,
      fetchedDocSize: 0,
      initiallyFetchedDocSize: 0,
      liveFetchedDocSize: 0,
      initiallySentMsgSize: 0,
      liveSentMsgSize: 0,
      histogram: new DDSketch({
        alpha: 0.02
      })
    };
  }
  return this.metricsByMinute[dateId].pubs[publication];
};
PubsubModel.prototype._getPublicationName = function (name) {
  return name || 'null(autopublish)';
};
PubsubModel.prototype._getSubscriptionInfo = function () {
  let self = this;
  let activeSubs = Object.create(null);
  let activeDocs = Object.create(null);
  let totalObservers = Object.create(null);
  let cachedObservers = Object.create(null);
  iterate(Meteor.server.sessions, session => {
    iterate(session._namedSubs, countSubData);
    iterate(session._universalSubs, countSubData);
  });
  let avgObserverReuse = Object.create(null);
  _.each(totalObservers, function (value, publication) {
    avgObserverReuse[publication] = cachedObservers[publication] / totalObservers[publication];
  });
  return {
    activeSubs,
    activeDocs,
    avgObserverReuse
  };
  function countSubData(sub) {
    let publication = self._getPublicationName(sub._name);
    countSubscriptions(sub, publication);
    countDocuments(sub, publication);
    countObservers(sub, publication);
  }
  function countSubscriptions(sub, publication) {
    activeSubs[publication] = activeSubs[publication] || 0;
    activeSubs[publication]++;
  }
  function countDocuments(sub, publication) {
    activeDocs[publication] = activeDocs[publication] || 0;
    iterate(sub._documents, collection => {
      activeDocs[publication] += countKeys(collection);
    });
  }
  function countObservers(sub, publication) {
    totalObservers[publication] = totalObservers[publication] || 0;
    cachedObservers[publication] = cachedObservers[publication] || 0;
    totalObservers[publication] += sub._totalObservers;
    cachedObservers[publication] += sub._cachedObservers;
  }
};
PubsubModel.prototype.buildPayload = function () {
  let metricsByMinute = this.metricsByMinute;
  this.metricsByMinute = Object.create(null);
  let payload = {
    pubMetrics: []
  };
  let subscriptionData = this._getSubscriptionInfo();
  let activeSubs = subscriptionData.activeSubs;
  let activeDocs = subscriptionData.activeDocs;
  let avgObserverReuse = subscriptionData.avgObserverReuse;

  // to the averaging
  for (let dateId in metricsByMinute) {
    let dateMetrics = metricsByMinute[dateId];
    // We need to convert startTime into actual serverTime
    dateMetrics.startTime = Kadira.syncedDate.syncTime(dateMetrics.startTime);
    for (let publication in metricsByMinute[dateId].pubs) {
      let singlePubMetrics = metricsByMinute[dateId].pubs[publication];
      // We only calculate resTime for new subscriptions
      singlePubMetrics.resTime /= singlePubMetrics.subs;
      singlePubMetrics.resTime = singlePubMetrics.resTime || 0;
      // We only track lifeTime in the unsubs
      singlePubMetrics.lifeTime /= singlePubMetrics.unsubs;
      singlePubMetrics.lifeTime = singlePubMetrics.lifeTime || 0;

      // Count the average for observer lifetime
      if (singlePubMetrics.deletedObservers > 0) {
        singlePubMetrics.observerLifetime /= singlePubMetrics.deletedObservers;
      }

      // If there are two or more dateIds, we will be using the currentCount for all of them.
      // We can come up with a better solution later on.
      singlePubMetrics.activeSubs = activeSubs[publication] || 0;
      singlePubMetrics.activeDocs = activeDocs[publication] || 0;
      singlePubMetrics.avgObserverReuse = avgObserverReuse[publication] || 0;
    }
    payload.pubMetrics.push(metricsByMinute[dateId]);
  }

  // collect traces and send them with the payload
  payload.pubRequests = this.tracerStore.collectTraces();
  return payload;
};
PubsubModel.prototype.incrementHandleCount = function (trace, isCached) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(trace.name);
  let publication = this._getMetrics(timestamp, publicationName);
  let session = getProperty(Meteor.server.sessions, trace.session);
  let sub;
  if (session) {
    sub = getProperty(session._namedSubs, trace.id);
    if (sub) {
      sub._totalObservers = sub._totalObservers || 0;
      sub._cachedObservers = sub._cachedObservers || 0;
    }
  }
  // not sure, we need to do this? But I don't need to break the however
  sub = sub || {
    _totalObservers: 0,
    _cachedObservers: 0
  };
  publication.totalObservers++;
  sub._totalObservers++;
  if (isCached) {
    publication.cachedObservers++;
    sub._cachedObservers++;
  }
};
PubsubModel.prototype.trackCreatedObserver = function (info) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(info.name);
  let publication = this._getMetrics(timestamp, publicationName);
  publication.createdObservers++;
};
PubsubModel.prototype.trackDeletedObserver = function (info) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(info.name);
  let publication = this._getMetrics(timestamp, publicationName);
  publication.deletedObservers++;
  publication.observerLifetime += new Date().getTime() - info.startTime;
};
PubsubModel.prototype.trackDocumentChanges = function (info, op) {
  // It's possibel that info to be null
  // Specially when getting changes at the very begining.
  // This may be false, but nice to have a check
  if (!info) {
    return;
  }
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(info.name);
  let publication = this._getMetrics(timestamp, publicationName);
  if (op.op === 'd') {
    publication.oplogDeletedDocuments++;
  } else if (op.op === 'i') {
    publication.oplogInsertedDocuments++;
  } else if (op.op === 'u') {
    publication.oplogUpdatedDocuments++;
  }
};
PubsubModel.prototype.trackPolledDocuments = function (info, count) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(info.name);
  let publication = this._getMetrics(timestamp, publicationName);
  publication.polledDocuments += count;
};
PubsubModel.prototype.trackLiveUpdates = function (info, type, count) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(info.name);
  let publication = this._getMetrics(timestamp, publicationName);
  if (type === '_addPublished') {
    publication.liveAddedDocuments += count;
  } else if (type === '_removePublished') {
    publication.liveRemovedDocuments += count;
  } else if (type === '_changePublished') {
    publication.liveChangedDocuments += count;
  } else if (type === '_initialAdds') {
    publication.initiallyAddedDocuments += count;
  } else {
    throw new Error('Kadira: Unknown live update type');
  }
};
PubsubModel.prototype.trackDocSize = function (name, type, size) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(name);
  let publication = this._getMetrics(timestamp, publicationName);
  if (type === 'polledFetches') {
    publication.polledDocSize += size;
  } else if (type === 'liveFetches') {
    publication.liveFetchedDocSize += size;
  } else if (type === 'cursorFetches') {
    publication.fetchedDocSize += size;
  } else if (type === 'initialFetches') {
    publication.initiallyFetchedDocSize += size;
  } else {
    throw new Error('Kadira: Unknown docs fetched type');
  }
};
PubsubModel.prototype.trackMsgSize = function (name, type, size) {
  let timestamp = Ntp._now();
  let publicationName = this._getPublicationName(name);
  let publication = this._getMetrics(timestamp, publicationName);
  if (type === 'liveSent') {
    publication.liveSentMsgSize += size;
  } else if (type === 'initialSent') {
    publication.initiallySentMsgSize += size;
  } else {
    throw new Error('Kadira: Unknown docs fetched type');
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"system.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/system.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  SystemModel: () => SystemModel
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 1);
let countKeys, createHistogram;
module.link("../utils.js", {
  countKeys(v) {
    countKeys = v;
  },
  createHistogram(v) {
    createHistogram = v;
  }
}, 2);
let GCMetrics;
module.link("../hijack/gc.js", {
  default(v) {
    GCMetrics = v;
  }
}, 3);
let getFiberMetrics, resetFiberMetrics;
module.link("../hijack/async.js", {
  getFiberMetrics(v) {
    getFiberMetrics = v;
  },
  resetFiberMetrics(v) {
    resetFiberMetrics = v;
  }
}, 4);
let getMongoDriverStats, resetMongoDriverStats;
module.link("../hijack/mongo_driver_events.js", {
  getMongoDriverStats(v) {
    getMongoDriverStats = v;
  },
  resetMongoDriverStats(v) {
    resetMongoDriverStats = v;
  }
}, 5);
let KadiraModel;
module.link("./0model", {
  KadiraModel(v) {
    KadiraModel = v;
  }
}, 6);
let EventLoopMonitor;
module.link("../event_loop_monitor.js", {
  EventLoopMonitor(v) {
    EventLoopMonitor = v;
  }
}, 7);
let Ntp;
module.link("../ntp", {
  Ntp(v) {
    Ntp = v;
  }
}, 8);
function SystemModel() {
  this.startTime = Ntp._now();
  this.newSessions = 0;
  // 30 min
  this.sessionTimeout = 1000 * 60 * 30;
  this.evloopHistogram = createHistogram();
  this.evloopMonitor = new EventLoopMonitor(200);
  this.evloopMonitor.start();
  this.evloopMonitor.on('lag', lag => {
    // store as microsecond
    this.evloopHistogram.add(lag * 1000);
  });
  this.gcMetrics = new GCMetrics();
  this.gcMetrics.start();
  this.cpuTime = process.hrtime();
  this.previousCpuUsage = process.cpuUsage();
  this.cpuHistory = [];
  this.currentCpuUsage = 0;
  setInterval(() => {
    this.cpuUsage();
  }, 2000);
}
_.extend(SystemModel.prototype, KadiraModel.prototype);
SystemModel.prototype.buildPayload = function () {
  let metrics = {};
  let now = Ntp._now();
  metrics.startTime = Kadira.syncedDate.syncTime(this.startTime);
  metrics.endTime = Kadira.syncedDate.syncTime(now);
  metrics.sessions = countKeys(Meteor.server.sessions);
  let memoryUsage = process.memoryUsage();
  metrics.memory = memoryUsage.rss / (1024 * 1024);
  metrics.memoryArrayBuffers = (memoryUsage.arrayBuffers || 0) / (1024 * 1024);
  metrics.memoryExternal = memoryUsage.external / (1024 * 1024);
  metrics.memoryHeapUsed = memoryUsage.heapUsed / (1024 * 1024);
  metrics.memoryHeapTotal = memoryUsage.heapTotal / (1024 * 1024);
  metrics.newSessions = this.newSessions;
  this.newSessions = 0;
  metrics.activeRequests = process._getActiveRequests().length;
  metrics.activeHandles = process._getActiveHandles().length;

  // track eventloop metrics
  metrics.pctEvloopBlock = this.evloopMonitor.status().pctBlock;
  metrics.evloopHistogram = this.evloopHistogram;
  this.evloopHistogram = createHistogram();
  metrics.gcMajorDuration = this.gcMetrics.metrics.gcMajor;
  metrics.gcMinorDuration = this.gcMetrics.metrics.gcMinor;
  metrics.gcIncrementalDuration = this.gcMetrics.metrics.gcIncremental;
  metrics.gcWeakCBDuration = this.gcMetrics.metrics.gcWeakCB;
  this.gcMetrics.reset();
  const driverMetrics = getMongoDriverStats();
  resetMongoDriverStats();
  metrics.mongoPoolSize = driverMetrics.poolSize;
  metrics.mongoPoolPrimaryCheckouts = driverMetrics.primaryCheckouts;
  metrics.mongoPoolOtherCheckouts = driverMetrics.otherCheckouts;
  metrics.mongoPoolCheckoutTime = driverMetrics.checkoutTime;
  metrics.mongoPoolMaxCheckoutTime = driverMetrics.maxCheckoutTime;
  metrics.mongoPoolPending = driverMetrics.pending;
  metrics.mongoPoolCheckedOutConnections = driverMetrics.checkedOut;
  metrics.mongoPoolCreatedConnections = driverMetrics.created;
  const fiberMetrics = getFiberMetrics();
  resetFiberMetrics();
  metrics.createdFibers = fiberMetrics.created;
  metrics.activeFibers = fiberMetrics.active;
  metrics.fiberPoolSize = fiberMetrics.poolSize;
  metrics.pcpu = 0;
  metrics.pcpuUser = 0;
  metrics.pcpuSystem = 0;
  if (this.cpuHistory.length > 0) {
    let lastCpuUsage = this.cpuHistory[this.cpuHistory.length - 1];
    metrics.pcpu = lastCpuUsage.usage * 100;
    metrics.pcpuUser = lastCpuUsage.user * 100;
    metrics.pcpuSystem = lastCpuUsage.sys * 100;
  }
  metrics.cpuHistory = this.cpuHistory.map(entry => ({
    time: Kadira.syncedDate.syncTime(entry.time),
    usage: entry.usage,
    sys: entry.sys,
    user: entry.user
  }));
  this.cpuHistory = [];
  this.startTime = now;
  return {
    systemMetrics: [metrics]
  };
};
function hrtimeToMS(hrtime) {
  return hrtime[0] * 1000 + hrtime[1] / 1000000;
}
SystemModel.prototype.cpuUsage = function () {
  let elapTimeMS = hrtimeToMS(process.hrtime(this.cpuTime));
  let elapUsage = process.cpuUsage(this.previousCpuUsage);
  let elapUserMS = elapUsage.user / 1000;
  let elapSystMS = elapUsage.system / 1000;
  let totalUsageMS = elapUserMS + elapSystMS;
  let totalUsagePercent = totalUsageMS / elapTimeMS;
  this.cpuHistory.push({
    time: Ntp._now(),
    usage: totalUsagePercent,
    user: elapUserMS / elapTimeMS,
    sys: elapSystMS / elapUsage.system
  });
  this.currentCpuUsage = totalUsagePercent * 100;
  Kadira.docSzCache.setPcpu(this.currentCpuUsage);
  this.cpuTime = process.hrtime();
  this.previousCpuUsage = process.cpuUsage();
};
SystemModel.prototype.handleSessionActivity = function (msg, session) {
  if (msg.msg === 'connect' && !msg.session) {
    this.countNewSession(session);
  } else if (['sub', 'method'].indexOf(msg.msg) !== -1) {
    if (!this.isSessionActive(session)) {
      this.countNewSession(session);
    }
  }
  session._activeAt = Date.now();
};
SystemModel.prototype.countNewSession = function (session) {
  if (!isLocalAddress(session.socket)) {
    this.newSessions++;
  }
};
SystemModel.prototype.isSessionActive = function (session) {
  let inactiveTime = Date.now() - session._activeAt;
  return inactiveTime < this.sessionTimeout;
};

// ------------------------------------------------------------------------- //

// http://regex101.com/r/iF3yR3/2
// eslint-disable-next-line no-useless-escape
let isLocalHostRegex = /^(?:.*\.local|localhost)(?:\:\d+)?|127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/;

// http://regex101.com/r/hM5gD8/1
let isLocalAddressRegex = /^127(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}$/;
function isLocalAddress(socket) {
  let host = socket.headers['host'];
  if (host) {
    return isLocalHostRegex.test(host);
  }
  let address = socket.headers['x-forwarded-for'] || socket.remoteAddress;
  if (address) {
    return isLocalAddressRegex.test(address);
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"errors.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/errors.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  ErrorModel: () => ErrorModel
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let KadiraModel;
module.link("./0model", {
  KadiraModel(v) {
    KadiraModel = v;
  }
}, 1);
let BaseErrorModel;
module.link("./base_error", {
  BaseErrorModel(v) {
    BaseErrorModel = v;
  }
}, 2);
let Ntp;
module.link("../ntp", {
  Ntp(v) {
    Ntp = v;
  }
}, 3);
function ErrorModel(appId) {
  BaseErrorModel.call(this);
  this.appId = appId;
  this.errors = {};
  this.startTime = Date.now();
  this.maxErrors = 10;
}
Object.assign(ErrorModel.prototype, KadiraModel.prototype);
Object.assign(ErrorModel.prototype, BaseErrorModel.prototype);
ErrorModel.prototype.buildPayload = function () {
  const metrics = _.values(this.errors);
  this.startTime = Ntp._now();
  metrics.forEach(function (metric) {
    metric.startTime = Kadira.syncedDate.syncTime(metric.startTime);
  });
  this.errors = {};
  return {
    errors: metrics
  };
};
ErrorModel.prototype.errorCount = function () {
  return _.values(this.errors).length;
};
ErrorModel.prototype.trackError = function (ex, trace) {
  const key = "".concat(trace.type, ":").concat(ex.message);
  if (this.errors[key]) {
    this.errors[key].count++;
  } else if (this.errorCount() < this.maxErrors) {
    const errorDef = this._formatError(ex, trace);
    if (this.applyFilters(errorDef.type, errorDef.name, ex, errorDef.subType)) {
      this.errors[key] = this._formatError(ex, trace);
    }
  }
};
ErrorModel.prototype._formatError = function (ex, trace) {
  const time = Date.now();
  let stack = ex.stack;

  // to get Meteor's Error details
  if (ex.details) {
    stack = "Details: ".concat(ex.details, "\r\n").concat(stack);
  }

  // Update trace's error event with the next stack
  const errorEvent = trace.events && trace.events[trace.events.length - 1];
  const errorObject = errorEvent && errorEvent[2] && errorEvent[2].error;
  if (errorObject) {
    errorObject.stack = stack;
  }
  return {
    appId: this.appId,
    name: ex.message,
    type: trace.type,
    startTime: time,
    subType: trace.subType || trace.name,
    trace,
    stacks: [{
      stack
    }],
    count: 1
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"http.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/models/http.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  HttpModel: () => HttpModel
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let KadiraModel;
module.link("./0model", {
  KadiraModel(v) {
    KadiraModel = v;
  }
}, 1);
let TracerStore;
module.link("../tracer/tracer_store", {
  TracerStore(v) {
    TracerStore = v;
  }
}, 2);
const {
  DDSketch
} = require('monti-apm-sketches-js');
const METHOD_METRICS_FIELDS = ['db', 'http', 'email', 'async', 'compute', 'total', 'fs'];
function HttpModel() {
  this.metricsByMinute = Object.create(null);
  this.tracerStore = new TracerStore({
    interval: 1000 * 10,
    maxTotalPoints: 30,
    archiveEvery: 10
  });
  this.tracerStore.start();
}
_.extend(HttpModel.prototype, KadiraModel.prototype);
HttpModel.prototype.processRequest = function (trace, req, res) {
  const dateId = this._getDateId(trace.at);
  this._appendMetrics(dateId, trace, res);
  this.tracerStore.addTrace(trace);
};
HttpModel.prototype._getMetrics = function (timestamp, routeId) {
  const dateId = this._getDateId(timestamp);
  if (!this.metricsByMinute[dateId]) {
    this.metricsByMinute[dateId] = {
      routes: Object.create(null)
    };
  }
  const routes = this.metricsByMinute[dateId].routes;
  if (!routes[routeId]) {
    routes[routeId] = {
      histogram: new DDSketch({
        alpha: 0.02
      }),
      count: 0,
      errors: 0,
      statusCodes: Object.create(null)
    };
    METHOD_METRICS_FIELDS.forEach(function (field) {
      routes[routeId][field] = 0;
    });
  }
  return this.metricsByMinute[dateId].routes[routeId];
};
HttpModel.prototype._appendMetrics = function (dateId, trace, res) {
  let requestMetrics = this._getMetrics(dateId, trace.name);
  if (!this.metricsByMinute[dateId].startTime) {
    this.metricsByMinute[dateId].startTime = trace.at;
  }

  // merge
  METHOD_METRICS_FIELDS.forEach(field => {
    let value = trace.metrics[field];
    if (value > 0) {
      requestMetrics[field] += value;
    }
  });
  const statusCode = res.statusCode;
  let statusMetric;
  if (statusCode < 200) {
    statusMetric = '1xx';
  } else if (statusCode < 300) {
    statusMetric = '2xx';
  } else if (statusCode < 400) {
    statusMetric = '3xx';
  } else if (statusCode < 500) {
    statusMetric = '4xx';
  } else if (statusCode < 600) {
    statusMetric = '5xx';
  }
  requestMetrics.statusCodes[statusMetric] = requestMetrics.statusCodes[statusMetric] || 0;
  requestMetrics.statusCodes[statusMetric] += 1;
  requestMetrics.count += 1;
  requestMetrics.histogram.add(trace.metrics.total);
  this.metricsByMinute[dateId].endTime = trace.metrics.at;
};
HttpModel.prototype.buildPayload = function () {
  let payload = {
    httpMetrics: [],
    httpRequests: []
  };
  let metricsByMinute = this.metricsByMinute;
  this.metricsByMinute = Object.create(null);
  for (let key in metricsByMinute) {
    const metrics = metricsByMinute[key];
    // convert startTime into the actual serverTime
    let startTime = metrics.startTime;
    metrics.startTime = Kadira.syncedDate.syncTime(startTime);
    for (let requestName in metrics.routes) {
      METHOD_METRICS_FIELDS.forEach(function (field) {
        metrics.routes[requestName][field] /= metrics.routes[requestName].count;
      });
    }
    payload.httpMetrics.push(metricsByMinute[key]);
  }
  payload.httpRequests = this.tracerStore.collectTraces();
  return payload;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"jobs.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/jobs.js                                                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Jobs = Kadira.Jobs = {};
Jobs.getAsync = function (id, callback) {
  Kadira.coreApi.getJob(id).then(function (data) {
    callback(null, data);
  }).catch(function (err) {
    callback(err);
  });
};
Jobs.setAsync = function (id, changes, callback) {
  Kadira.coreApi.updateJob(id, changes).then(function (data) {
    callback(null, data);
  }).catch(function (err) {
    callback(err);
  });
};
Jobs.set = Kadira._wrapAsync(Jobs.setAsync);
Jobs.get = Kadira._wrapAsync(Jobs.getAsync);
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"retry.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/retry.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Retry: () => Retry
});
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }
}, 0);
class Retry {
  constructor() {
    let {
      // 1 second
      baseTimeout = 1000,
      exponent = 2.2,
      // The default is high-ish to ensure a server can recover from a
      // failure caused by load.
      // 5 minutes
      maxTimeout = 5 * 60000,
      minTimeout = 10,
      minCount = 2,
      // +- 25%
      fuzz = 0.5
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.baseTimeout = baseTimeout;
    this.exponent = exponent;
    this.maxTimeout = maxTimeout;
    this.minTimeout = minTimeout;
    this.minCount = minCount;
    this.fuzz = fuzz;
    this.retryTimer = null;
  }

  // Reset a pending retry, if any.
  clear() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.retryTimer = null;
  }

  // Calculate how long to wait in milliseconds to retry, based on the
  // `count` of which retry this is.
  _timeout(count) {
    if (count < this.minCount) {
      return this.minTimeout;
    }
    let timeout = Math.min(this.maxTimeout, this.baseTimeout * Math.pow(this.exponent, count));
    // fuzz the timeout randomly, to avoid reconnect storms when a
    // server goes down.
    timeout *= Random.fraction() * this.fuzz + (1 - this.fuzz / 2);
    return Math.ceil(timeout);
  }

  // Call `fn` after a delay, based on the `count` of which retry this is.
  retryLater(count, fn) {
    const timeout = this._timeout(count);
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.retryTimer = setTimeout(fn, timeout);
    return timeout;
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/utils.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  haveAsyncCallback: () => haveAsyncCallback,
  UniqueId: () => UniqueId,
  DefaultUniqueId: () => DefaultUniqueId,
  CreateUserStack: () => CreateUserStack,
  OptimizedApply: () => OptimizedApply,
  getClientVersions: () => getClientVersions,
  countKeys: () => countKeys,
  iterate: () => iterate,
  getProperty: () => getProperty,
  createHistogram: () => createHistogram,
  pick: () => pick
});
let getClientArchVersion;
module.link("./common/utils", {
  getClientArchVersion(v) {
    getClientArchVersion = v;
  }
}, 0);
const {
  DDSketch
} = require('monti-apm-sketches-js');
function haveAsyncCallback(args) {
  const lastArg = args[args.length - 1];
  return typeof lastArg === 'function';
}
class UniqueId {
  constructor() {
    this.id = 0;
  }
  get() {
    return "".concat(this.id++);
  }
}
const DefaultUniqueId = new UniqueId();
function CreateUserStack(error) {
  const stack = (error || new Error()).stack.split('\n');
  let toRemove = 1;

  // Find how many frames need to be removed
  // to make the user's code the first frame
  for (; toRemove < stack.length; toRemove++) {
    if (stack[toRemove].indexOf('montiapm:agent') === -1) {
      break;
    }
  }
  return stack.slice(toRemove).join('\n');
}
function OptimizedApply(context, fn, args) {
  let a = args;
  switch (a.length) {
    case 0:
      return fn.call(context);
    case 1:
      return fn.call(context, a[0]);
    case 2:
      return fn.call(context, a[0], a[1]);
    case 3:
      return fn.call(context, a[0], a[1], a[2]);
    case 4:
      return fn.call(context, a[0], a[1], a[2], a[3]);
    case 5:
      return fn.call(context, a[0], a[1], a[2], a[3], a[4]);
    default:
      return fn.apply(context, a);
  }
}
function getClientVersions() {
  return {
    'web.cordova': getClientArchVersion('web.cordova'),
    'web.browser': getClientArchVersion('web.browser'),
    'web.browser.legacy': getClientArchVersion('web.browser.legacy')
  };
}
function countKeys(obj) {
  if (obj instanceof Map || obj instanceof Set) {
    return obj.size;
  }
  return Object.keys(obj).length;
}
function iterate(obj, callback) {
  if (obj instanceof Map) {
    return obj.forEach(callback);
  }

  // eslint-disable-next-line guard-for-in
  for (let key in obj) {
    let value = obj[key];
    callback(value, key);
  }
}
function getProperty(obj, key) {
  if (obj instanceof Map) {
    return obj.get(key);
  }
  return obj[key];
}
function createHistogram() {
  return new DDSketch({
    alpha: 0.02
  });
}
function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"ntp.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/ntp.js                                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Ntp: () => Ntp
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Retry;
module.link("./retry", {
  Retry(v) {
    Retry = v;
  }
}, 1);
const logger = getLogger();
class Ntp {
  constructor(options) {
    const {
      endpoint,
      disableNtp
    } = options || {};
    this.isDisabled = disableNtp;
    this.path = '/simplentp/sync';
    this.setEndpoint(endpoint);
    this.diff = 0;
    this.synced = false;
    this.reSyncCount = 0;
    this.reSync = new Retry({
      baseTimeout: 1000 * 60,
      maxTimeout: 1000 * 60 * 10,
      minCount: 0
    });
  }
  static _now() {
    const now = Date.now();
    if (typeof now === 'number') {
      return now;
    } else if (now instanceof Date) {
      // some extenal JS libraries override Date.now and returns a Date object
      // which directly affect us. So we need to prepare for that
      return now.getTime();
    }
    // trust me. I've seen now === undefined
    return new Date().getTime();
  }
  setEndpoint(endpoint) {
    this.endpoint = endpoint ? endpoint + this.path : null;
  }
  getTime() {
    return Ntp._now() + Math.round(this.diff);
  }
  syncTime(localTime) {
    return localTime + Math.ceil(this.diff);
  }
  sync() {
    if (this.endpoint === null || this.isDisabled) {
      return;
    }
    logger('init sync');
    let self = this;
    let retryCount = 0;
    let retry = new Retry({
      baseTimeout: 1000 * 20,
      maxTimeout: 1000 * 60,
      minCount: 1,
      minTimeout: 0
    });
    syncTime();
    function syncTime() {
      if (retryCount < 5) {
        logger('attempt time sync with server', retryCount);
        // if we send 0 to the retryLater, cacheDns will run immediately
        retry.retryLater(retryCount++, cacheDns);
      } else {
        logger('maximum retries reached');
        self.reSync.retryLater(self.reSyncCount++, function () {
          let args = [].slice.call(arguments);
          self.sync(...args);
        });
      }
    }

    // first attempt is to cache dns. So, calculation does not
    // include DNS resolution time
    function cacheDns() {
      self.getServerTime(function (err) {
        if (!err) {
          calculateTimeDiff();
        } else {
          syncTime();
        }
      });
    }
    function calculateTimeDiff() {
      let clientStartTime = new Date().getTime();
      self.getServerTime(function (err, serverTime) {
        if (!err && serverTime) {
          // (Date.now() + clientStartTime)/2 : Midpoint between req and res
          let networkTime = (new Date().getTime() - clientStartTime) / 2;
          let serverStartTime = serverTime - networkTime;
          self.diff = serverStartTime - clientStartTime;
          self.synced = true;
          // we need to send 1 into retryLater.
          self.reSync.retryLater(self.reSyncCount++, function () {
            let args = [].slice.call(arguments);
            self.sync(...args);
          });
          logger('successfully updated diff value', self.diff);
        } else {
          syncTime();
        }
      });
    }
  }
  getServerTime(callback) {
    let self = this;
    if (self.endpoint === null) {
      throw new Error('getServerTime requires the endpoint to be set');
    }
    if (self.isDisabled) {
      throw new Error('getServerTime requires NTP to be enabled');
    }
    if (Meteor.isServer) {
      Kadira.coreApi.get(self.path, {
        noRetries: true
      }).then(content => {
        let serverTime = parseInt(content, 10);
        callback(null, serverTime);
      }).catch(err => {
        callback(err);
      });
    } else {
      Kadira._makeHttpRequest('GET', "".concat(self.endpoint, "?noCache=").concat(new Date().getTime(), "-").concat(Math.random()), function (err, res) {
        if (err) {
          callback(err);
        } else {
          let serverTime = parseInt(res.content, 10);
          callback(null, serverTime);
        }
      });
    }
  }
}
function getLogger() {
  if (Meteor.isServer) {
    return Npm.require('debug')('kadira:ntp');
  }
  return function (message) {
    let canLog = false;
    try {
      canLog = global.localStorage.getItem('LOG_KADIRA') !== null && typeof console !== 'undefined';
      // eslint-disable-next-line no-empty
    } catch (e) {} // older browsers can sometimes throw because of getItem

    if (!canLog) {
      return;
    }
    if (message) {
      message = "kadira:ntp ".concat(message);
      arguments[0] = message;
    }
    console.log(...arguments);
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"sourcemaps.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/sourcemaps.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  handleApiResponse: () => handleApiResponse
});
let WebApp;
module.link("meteor/webapp", {
  WebApp(v) {
    WebApp = v;
  }
}, 0);
let path = Npm.require('path');
let fs = Npm.require('fs');
let logger = Npm.require('debug')('kadira:apm:sourcemaps');

// Meteor 1.7 and older used clientPaths
let clientPaths = __meteor_bootstrap__.configJson.clientPaths;
let clientArchs = __meteor_bootstrap__.configJson.clientArchs;
let serverDir = __meteor_bootstrap__.serverDir;
let absClientPaths;
if (clientArchs) {
  absClientPaths = clientArchs.reduce((result, arch) => {
    result[arch] = path.resolve(path.dirname(serverDir), arch);
    return result;
  }, {});
} else {
  absClientPaths = Object.keys(clientPaths).reduce((result, key) => {
    result[key] = path.resolve(serverDir, path.dirname(clientPaths[key]));
    return result;
  }, {});
}
function handleApiResponse() {
  let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  let unavailable = [];
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      logger('failed parsing body', e, body);
      return;
    }
  }
  let neededSourcemaps = body.neededSourcemaps || [];
  logger('body', neededSourcemaps);
  let promises = neededSourcemaps.map(sourcemap => {
    if (!Kadira.options.uploadSourceMaps) {
      return unavailable.push(sourcemap);
    }
    return getSourcemapPath(sourcemap.arch, sourcemap.file.path).then(function (sourceMapPath) {
      if (sourceMapPath === null) {
        unavailable.push(sourcemap);
      } else {
        sendSourcemap(sourcemap, sourceMapPath);
      }
    });
  });
  Promise.all(promises).then(function () {
    if (unavailable.length > 0) {
      logger('sending unavailable sourcemaps', unavailable);
      Kadira.coreApi.sendData({
        unavailableSourcemaps: unavailable
      }).then(function (_body) {
        handleApiResponse(_body);
      }).catch(function (err) {
        console.log('Monti APM: unable to send data', err);
      });
    }
  });
}
function sendSourcemap(sourcemap, sourcemapPath) {
  logger('Sending sourcemap', sourcemap, sourcemapPath);
  let stream = fs.createReadStream(sourcemapPath);
  stream.on('error', err => {
    console.log('Monti APM: error while uploading sourcemap', err);
  });
  let arch = sourcemap.arch;
  let archVersion = sourcemap.archVersion;
  let file = encodeURIComponent(sourcemap.file.path);
  Kadira.coreApi.sendStream("/sourcemap?arch=".concat(arch, "&archVersion=").concat(archVersion, "&file=").concat(file), stream).catch(function (err) {
    console.log('Monti APM: error uploading sourcemap', err);
  });
}
function preparePath(urlPath) {
  urlPath = path.posix.normalize(urlPath);
  if (urlPath[0] === '/') {
    urlPath = urlPath.slice(1);
  }
  return urlPath;
}
function checkForDynamicImport(arch, urlPath) {
  const filePath = preparePath(urlPath);
  return new Promise(function (resolve) {
    const archPath = absClientPaths[arch];
    const dynamicPath = "".concat(path.join(archPath, 'dynamic', filePath), ".map");
    fs.stat(dynamicPath, function (err) {
      resolve(err ? null : dynamicPath);
    });
  });
}
function getSourcemapPath(arch, urlPath) {
  return new Promise((resolve, reject) => {
    let clientProgram = WebApp.clientPrograms[arch];
    if (!clientProgram || !clientProgram.manifest) {
      return resolve(null);
    }
    let fileInfo = clientProgram.manifest.find(file => file.url && file.url.startsWith(urlPath));
    if (fileInfo && fileInfo.sourceMap) {
      return resolve(path.join(absClientPaths[arch], fileInfo.sourceMap));
    }
    checkForDynamicImport(arch, urlPath).then(resolve).catch(reject);
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wait_time_builder.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/wait_time_builder.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  WaitTimeBuilder: () => WaitTimeBuilder
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let TimeoutManager;
module.link("./hijack/timeout_manager", {
  TimeoutManager(v) {
    TimeoutManager = v;
  }
}, 1);
const WAITON_MESSAGE_FIELDS = ['msg', 'id', 'method', 'name', 'waitTime'];

// This is way how we can build waitTime and it's breakdown
class WaitTimeBuilder {
  constructor() {
    this._waitListStore = {};
    this._currentProcessingMessages = {};
    this._messageCache = {};
  }
  register(session, msgId) {
    const mainKey = this._getMessageKey(session.id, msgId);
    let inQueue = session.inQueue || [];
    if (typeof inQueue.toArray === 'function') {
      // latest version of Meteor uses a double-ended-queue for the inQueue
      // info: https://www.npmjs.com/package/double-ended-queue
      inQueue = inQueue.toArray();
    }
    const waitList = inQueue.map(msg => {
      const key = this._getMessageKey(session.id, msg.id);
      return this._getCacheMessage(key, msg);
    }) || [];

    // add currently processing ddp message if exists
    const currentlyProcessingMessage = this._currentProcessingMessages[session.id];
    if (currentlyProcessingMessage) {
      const key = this._getMessageKey(session.id, currentlyProcessingMessage.id);
      waitList.unshift(this._getCacheMessage(key, currentlyProcessingMessage));
    }
    this._waitListStore[mainKey] = waitList;
  }
  build(session, msgId) {
    const mainKey = this._getMessageKey(session.id, msgId);
    const waitList = this._waitListStore[mainKey] || [];
    delete this._waitListStore[mainKey];
    const filteredWaitList = waitList.map(this._cleanCacheMessage.bind(this));
    return filteredWaitList;
  }
  _getMessageKey(sessionId, msgId) {
    return "".concat(sessionId, "::").concat(msgId);
  }
  _getCacheMessage(key, msg) {
    let cachedMessage = this._messageCache[key];
    if (!cachedMessage) {
      this._messageCache[key] = cachedMessage = _.pick(msg, WAITON_MESSAGE_FIELDS);
      cachedMessage._key = key;
      cachedMessage._registered = 1;
    } else {
      cachedMessage._registered++;
    }
    return cachedMessage;
  }
  _cleanCacheMessage(msg) {
    msg._registered--;
    if (msg._registered === 0) {
      delete this._messageCache[msg._key];
    }

    // need to send a clean set of objects
    // otherwise register can go with this
    return _.pick(msg, WAITON_MESSAGE_FIELDS);
  }
  trackWaitTime(session, msg, unblock) {
    const started = Date.now();
    this._currentProcessingMessages[session.id] = msg;
    let unblocked = false;
    const self = this;
    const wrappedUnblock = function () {
      if (!unblocked) {
        const waitTime = Date.now() - started;
        const key = self._getMessageKey(session.id, msg.id);
        const cachedMessage = self._messageCache[key];
        if (cachedMessage) {
          cachedMessage.waitTime = waitTime;
        }
        delete self._currentProcessingMessages[session.id];
        unblocked = true;
        unblock();
        TimeoutManager.clearTimeout();
      }
    };
    return wrappedUnblock;
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"check_for_oplog.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/check_for_oplog.js                                                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  OplogCheck: () => OplogCheck
});
let Tracker;
module.link("meteor/tracker", {
  Tracker(v) {
    Tracker = v;
  }
}, 0);
const OplogCheck = {};
OplogCheck.env = function () {
  if (!process.env.MONGO_OPLOG_URL) {
    return {
      code: 'NO_ENV',
      reason: "You haven't added oplog support for your the Meteor app.",
      solution: 'Add oplog support for your Meteor app. see: http://goo.gl/Co1jJc'
    };
  }
  return true;
};
OplogCheck.disableOplog = function (cursorDescription) {
  const {
    options
  } = cursorDescription;

  // Underscored version for Meteor pre 1.2
  if (options._disableOplog || options.disableOplog) {
    return {
      code: 'DISABLE_OPLOG',
      reason: "You've disabled oplog for this cursor explicitly with _disableOplog option."
    };
  }
  return true;
};

// when creating Minimongo.Matcher object, if that's throws an exception
// meteor won't do the oplog support
OplogCheck.miniMongoMatcher = function (cursorDescription) {
  if (Minimongo.Matcher) {
    try {
      // eslint-disable-next-line no-new
      new Minimongo.Matcher(cursorDescription.selector);
      return true;
    } catch (ex) {
      return {
        code: 'MINIMONGO_MATCHER_ERROR',
        reason: "There's something wrong in your mongo query: ".concat(ex.message),
        solution: 'Check your selector and change it accordingly.'
      };
    }
  } else {
    // If there is no Minimongo.Matcher, we don't need to check this
    return true;
  }
};
OplogCheck.miniMongoSorter = function (cursorDescription) {
  let matcher = new Minimongo.Matcher(cursorDescription.selector);
  if (Minimongo.Sorter && cursorDescription.options.sort) {
    try {
      // eslint-disable-next-line no-new
      new Minimongo.Sorter(cursorDescription.options.sort, {
        matcher
      });
      return true;
    } catch (ex) {
      return {
        code: 'MINIMONGO_SORTER_ERROR',
        reason: "Some of your sort specifiers are not supported: ".concat(ex.message),
        solution: 'Check your sort specifiers and chage them accordingly.'
      };
    }
  } else {
    return true;
  }
};
OplogCheck.fields = function (cursorDescription) {
  let options = cursorDescription.options;

  // Checking `projection` for Meteor 2.6+
  const fields = options.fields || options.projection;
  if (fields) {
    try {
      LocalCollection._checkSupportedProjection(fields);
      return true;
    } catch (e) {
      if (e.name === 'MinimongoError') {
        return {
          code: 'NOT_SUPPORTED_FIELDS',
          reason: "Some of the field filters are not supported: ".concat(e.message),
          solution: 'Try removing those field filters.'
        };
      }
      throw e;
    }
  }
  return true;
};
OplogCheck.skip = function (cursorDescription) {
  if (cursorDescription.options.skip) {
    return {
      code: 'SKIP_NOT_SUPPORTED',
      reason: 'Skip does not support with oplog.',
      solution: 'Try to avoid using skip. Use range queries instead: http://goo.gl/b522Av'
    };
  }
  return true;
};
OplogCheck.where = function (cursorDescription) {
  let matcher = new Minimongo.Matcher(cursorDescription.selector);
  if (matcher.hasWhere()) {
    return {
      code: 'WHERE_NOT_SUPPORTED',
      reason: 'Meteor does not support queries with $where.',
      solution: 'Try to remove $where from your query. Use some alternative.'
    };
  }
  return true;
};
OplogCheck.geo = function (cursorDescription) {
  let matcher = new Minimongo.Matcher(cursorDescription.selector);
  if (matcher.hasGeoQuery()) {
    return {
      code: 'GEO_NOT_SUPPORTED',
      reason: 'Meteor does not support queries with geo partial operators.',
      solution: 'Try to remove geo partial operators from your query if possible.'
    };
  }
  return true;
};
OplogCheck.limitButNoSort = function (cursorDescription) {
  let options = cursorDescription.options;
  if (options.limit && !options.sort) {
    return {
      code: 'LIMIT_NO_SORT',
      reason: 'Meteor oplog implementation does not support limit without a sort specifier.',
      solution: 'Try adding a sort specifier.'
    };
  }
  return true;
};
OplogCheck.thirdParty = function (cursorDescription, observerDriver) {
  if (Tracker.active && observerDriver.constructor.name !== 'OplogObserveDriver') {
    return {
      code: 'TRACKER_ACTIVE',
      reason: 'Observe driver detected inside an active tracker, you might be using a third party library (e.g "reactive-mongo").',
      solution: 'Check the library documentation, perhaps an option is missing.'
    };
  }
  return true;
};
OplogCheck.unknownReason = function (cursorDescription, driver) {
  if (driver && driver.constructor.name !== 'OplogObserveDriver') {
    return {
      code: 'UNKNOWN_REASON',
      reason: "Not using the Oplog Observe Driver for unknown reason. Driver: ".concat(driver.constructor.name),
      solution: 'Check your third-party libraries.'
    };
  }
  return true;
};
let preRunningMatchers = [OplogCheck.env, OplogCheck.disableOplog, OplogCheck.miniMongoMatcher];
let globalMatchers = [OplogCheck.fields, OplogCheck.skip, OplogCheck.where, OplogCheck.geo, OplogCheck.limitButNoSort, OplogCheck.miniMongoSorter, OplogCheck.thirdParty, OplogCheck.unknownReason];
Kadira.checkWhyNoOplog = function (cursorDescription, observerDriver) {
  if (typeof Minimongo === 'undefined') {
    return {
      code: 'CANNOT_DETECT',
      reason: "You are running an older Meteor version and Monti APM can't check oplog state.",
      solution: 'Try updating your Meteor app'
    };
  }
  let result = runMatchers(preRunningMatchers, cursorDescription, observerDriver);
  if (result !== true) {
    return result;
  }
  result = runMatchers(globalMatchers, cursorDescription, observerDriver);
  if (result !== true) {
    return result;
  }
  return {
    code: 'OPLOG_SUPPORTED',
    reason: "This query should support oplog. It's weird if it's not.",
    solution: "Please contact Kadira support and let's discuss."
  };
};
function runMatchers(matcherList, cursorDescription, observerDriver) {
  for (const matcher of matcherList) {
    const matched = matcher(cursorDescription, observerDriver);
    if (matched !== true) {
      return matched;
    }
  }
  return true;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"tracer":{"tracer.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/tracer/tracer.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  Tracer: () => Tracer
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let objectHasData;
module.link("../common/utils", {
  objectHasData(v) {
    objectHasData = v;
  }
}, 1);
let CreateUserStack, DefaultUniqueId;
module.link("../utils", {
  CreateUserStack(v) {
    CreateUserStack = v;
  },
  DefaultUniqueId(v) {
    DefaultUniqueId = v;
  }
}, 2);
let Ntp;
module.link("../ntp", {
  Ntp(v) {
    Ntp = v;
  }
}, 3);
let eventLogger = Npm.require('debug')('kadira:tracer');
let REPETITIVE_EVENTS = {
  db: true,
  http: true,
  email: true,
  wait: true,
  async: true,
  custom: true,
  fs: true
};
let TRACE_TYPES = ['sub', 'method', 'http'];
let MAX_TRACE_EVENTS = 1500;
const Tracer = function () {
  this._filters = [];
  this._filterFields = ['password'];
  this.maxArrayItemsToFilter = 20;
};
// In the future, we might wan't to track inner fiber events too.
// Then we can't serialize the object with methods
// That's why we use this method of returning the data
Tracer.prototype.start = function (name, type) {
  let {
    sessionId,
    msgId,
    userId
  } = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  // for backward compatibility
  if (typeof name === 'object' && typeof type === 'object') {
    let session = name;
    let msg = type;
    sessionId = session.id;
    msgId = msg.id;
    userId = session.userId;
    if (msg.msg === 'method') {
      type = 'method';
      name = msg.method;
    } else if (msg.msg === 'sub') {
      type = 'sub';
      name = msg.name;
    } else {
      return null;
    }
  }
  if (TRACE_TYPES.indexOf(type) === -1) {
    console.warn("Monti APM: unknown trace type \"".concat(type, "\""));
    return null;
  }
  const traceInfo = {
    _id: "".concat(sessionId, "::").concat(msgId || DefaultUniqueId.get()),
    type,
    name,
    session: sessionId,
    id: msgId,
    events: [],
    userId
  };
  return traceInfo;
};
Tracer.prototype.event = function (traceInfo, type, data, metaData) {
  // do not allow to proceed, if already completed or errored
  let lastEvent = this.getLastEvent(traceInfo);
  if (
  // trace completed but has not been processed
  lastEvent && ['complete', 'error'].indexOf(lastEvent.type) >= 0 ||
  // trace completed and processed.
  traceInfo.isEventsProcessed) {
    return false;
  }
  let event = {
    type,
    at: Ntp._now(),
    endAt: null,
    nested: []
  };

  // special handling for events that are not repetitive
  if (!REPETITIVE_EVENTS[type]) {
    event.endAt = event.at;
  }
  if (data) {
    let info = _.pick(traceInfo, 'type', 'name');
    event.data = this._applyFilters(type, data, info, 'start');
  }
  if (metaData && metaData.name) {
    event.name = metaData.name;
  }
  if (Kadira.options.eventStackTrace) {
    event.stack = CreateUserStack();
  }
  eventLogger('%s %s', type, traceInfo._id);
  if (lastEvent && !lastEvent.endAt) {
    if (!lastEvent.nested) {
      console.error('Monti: invalid trace. Please share the trace below at');
      console.error('Monti: https://github.com/monti-apm/monti-apm-agent/issues/14');
      console.dir(traceInfo, {
        depth: 10
      });
    }
    let lastNested = lastEvent.nested[lastEvent.nested.length - 1];

    // Only nest one level
    if (!lastNested || lastNested.endAt) {
      lastEvent.nested.push(event);
      return event;
    }
    return false;
  }
  traceInfo.events.push(event);
  return event;
};
Tracer.prototype.eventEnd = function (traceInfo, event, data) {
  if (event.endAt) {
    // Event already ended or is not a repititive event
    return false;
  }
  event.endAt = Ntp._now();
  if (data) {
    let info = _.pick(traceInfo, 'type', 'name');
    event.data = Object.assign(event.data || {}, this._applyFilters("".concat(event.type, "end"), data, info, 'end'));
  }
  eventLogger('%s %s', "".concat(event.type, "end"), traceInfo._id);
  return true;
};
Tracer.prototype.getLastEvent = function (traceInfo) {
  return traceInfo.events[traceInfo.events.length - 1];
};
Tracer.prototype.endLastEvent = function (traceInfo) {
  let lastEvent = this.getLastEvent(traceInfo);
  if (!lastEvent.endAt) {
    this.eventEnd(traceInfo, lastEvent);
    lastEvent.forcedEnd = true;
    return true;
  }
  return false;
};

// Most of the time, all the nested events are async
// which is not helpful. This returns true if
// there are nested events other than async.
Tracer.prototype._hasUsefulNested = function (event) {
  return event.nested && event.nested.length && !event.nested.every(e => e.type === 'async');
};
Tracer.prototype.buildEvent = function (event) {
  let depth = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  let trace = arguments.length > 2 ? arguments[2] : undefined;
  let elapsedTimeForEvent = event.endAt - event.at;
  let builtEvent = [event.type];
  let nested = [];
  builtEvent.push(elapsedTimeForEvent);
  builtEvent.push(event.data || {});
  if (this._hasUsefulNested(event)) {
    let prevEnd = event.at;
    for (let i = 0; i < event.nested.length; i++) {
      let nestedEvent = event.nested[i];
      if (!nestedEvent.endAt) {
        this.eventEnd(trace, nestedEvent);
        nestedEvent.forcedEnd = true;
      }
      let computeTime = nestedEvent.at - prevEnd;
      if (computeTime > 0) {
        nested.push(['compute', computeTime]);
      }
      nested.push(this.buildEvent(nestedEvent, depth + 1, trace));
      prevEnd = nestedEvent.endAt;
    }
  }
  if (nested.length || event.stack || event.forcedEnd || event.name) {
    builtEvent.push({
      stack: event.stack,
      nested: nested.length ? nested : undefined,
      forcedEnd: event.forcedEnd,
      name: event.name
    });
  }
  return builtEvent;
};
Tracer.prototype.buildTrace = function (traceInfo) {
  let firstEvent = traceInfo.events[0];
  let lastEvent = traceInfo.events[traceInfo.events.length - 1];
  let processedEvents = [];
  if (firstEvent.type !== 'start') {
    console.warn('Monti APM: trace has not started yet');
    return null;
  } else if (lastEvent.type !== 'complete' && lastEvent.type !== 'error') {
    // trace is not completed or errored yet
    console.warn('Monti APM: trace has not completed or errored yet');
    return null;
  }
  // build the metrics
  traceInfo.errored = lastEvent.type === 'error';
  traceInfo.at = firstEvent.at;
  let metrics = {
    total: lastEvent.at - firstEvent.at
  };
  let totalNonCompute = 0;
  firstEvent = ['start', 0];
  if (traceInfo.events[0].data) {
    firstEvent.push(traceInfo.events[0].data);
  }
  processedEvents.push(firstEvent);
  let computeTime;
  for (let lc = 1; lc < traceInfo.events.length - 1; lc += 1) {
    let prevEvent = traceInfo.events[lc - 1];
    let event = traceInfo.events[lc];
    if (!event.endAt) {
      console.error('Monti APM: no end event for type: ', event.type);
      return null;
    }
    computeTime = event.at - prevEvent.endAt;
    if (computeTime > 0) {
      processedEvents.push(['compute', computeTime]);
    }
    let builtEvent = this.buildEvent(event, 0, traceInfo);
    processedEvents.push(builtEvent);
    metrics[event.type] = metrics[event.type] || 0;
    metrics[event.type] += builtEvent[1];
    totalNonCompute += builtEvent[1];
  }
  computeTime = lastEvent.at - traceInfo.events[traceInfo.events.length - 2].endAt;
  if (computeTime > 0) {
    processedEvents.push(['compute', computeTime]);
  }
  let lastEventData = [lastEvent.type, 0];
  if (lastEvent.data) {
    lastEventData.push(lastEvent.data);
  }
  processedEvents.push(lastEventData);
  if (processedEvents.length > MAX_TRACE_EVENTS) {
    const removeCount = processedEvents.length - MAX_TRACE_EVENTS;
    processedEvents.splice(MAX_TRACE_EVENTS, removeCount);
  }
  metrics.compute = metrics.total - totalNonCompute;
  traceInfo.metrics = metrics;
  traceInfo.events = processedEvents;
  traceInfo.isEventsProcessed = true;
  return traceInfo;
};

/**
 * There are two formats for traces. While the method/publication is running, the trace is in the object format.
 * This is easier to work with, but takes more space to store. After the trace is complete (either finished or errored),
 * it is built which among other things converts the events to the array format.
 *
 * The key difference of `optimizeEvent` and `optimizeEvents` is that they do not mutate the original events.
 *
 * @param {Object} objectEvent Expanded object event.
 *
 * @returns {Array} Array notation of the event optimized for transport
 */
Tracer.prototype.optimizeEvent = function (objectEvent) {
  let {
    at,
    endAt,
    stack,
    nested = [],
    forcedEnd,
    name,
    type,
    data
  } = objectEvent;
  if (!endAt) {
    endAt = Ntp._now();
    forcedEnd = true;
  }
  let duration = at && endAt ? endAt - at : 0;
  const optimizedNestedEvents = this._hasUsefulNested(objectEvent) ? this.optimizeEvents(nested) : undefined;
  const optimizedEvent = [type, duration, data || {}];
  const extraInfo = {
    stack,
    forcedEnd,
    name,
    nested: optimizedNestedEvents
  };
  if (objectHasData(extraInfo)) {
    optimizedEvent.push(extraInfo);
  }
  return optimizedEvent;
};
Tracer.prototype.optimizeEvents = function (events) {
  if (!events) {
    return [];
  }
  const optimizedEvents = [];
  let prevEvent = {};
  events.forEach(event => {
    if (prevEvent.endAt && event.at) {
      const computeTime = event.at - prevEvent.endAt;
      if (computeTime > 0) {
        optimizedEvents.push(['compute', computeTime]);
      }
    }
    optimizedEvents.push(this.optimizeEvent(event));
    prevEvent = event;
  });
  return optimizedEvents;
};
Tracer.prototype.addFilter = function (filterFn) {
  this._filters.push(filterFn);
};
Tracer.prototype.redactField = function (field) {
  this._filterFields.push(field);
};
Tracer.prototype._applyFilters = function (eventType, data, info) {
  this._filters.forEach(function (filterFn) {
    data = filterFn(eventType, _.clone(data), info);
  });
  return data;
};
Tracer.prototype._applyObjectFilters = function (toFilter) {
  const filterObject = obj => {
    let cloned;
    this._filterFields.forEach(function (field) {
      if (field in obj) {
        cloned = cloned || Object.assign({}, obj);
        cloned[field] = 'Monti: redacted';
      }
    });
    return cloned;
  };
  if (Array.isArray(toFilter)) {
    let cloned;
    // There could be thousands or more items in the array, and this usually runs
    // before the data is validated. For performance reasons we limit how
    // many to check
    let length = Math.min(toFilter.length, this.maxArrayItemsToFilter);
    for (let i = 0; i < length; i++) {
      if (typeof toFilter[i] === 'object' && toFilter[i] !== null) {
        let result = filterObject(toFilter[i]);
        if (result) {
          cloned = cloned || [...toFilter];
          cloned[i] = result;
        }
      }
    }
    return cloned || toFilter;
  }
  return filterObject(toFilter) || toFilter;
};
Kadira.tracer = new Tracer();
// need to expose Tracer to provide default set of filters
Kadira.Tracer = Tracer;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"default_filters.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/tracer/default_filters.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Tracer;
module.link("./tracer", {
  Tracer(v) {
    Tracer = v;
  }
}, 0);
// strip sensitive data sent to Monti APM engine.
// possible to limit types by providing an array of types to strip
// possible types are: "start", "db", "http", "email"
Tracer.stripSensitive = function stripSensitive(typesToStrip, receiverType, name) {
  typesToStrip = typesToStrip || [];
  let strippedTypes = {};
  typesToStrip.forEach(function (type) {
    strippedTypes[type] = true;
  });
  return function (type, data, info) {
    if (typesToStrip.length > 0 && !strippedTypes[type]) {
      return data;
    }
    if (receiverType && receiverType !== info.type) {
      return data;
    }
    if (name && name !== info.name) {
      return data;
    }
    if (type === 'start') {
      if (data.params) {
        data.params = '[stripped]';
      }
      if (data.headers) {
        data.headers = '[stripped]';
      }
      if (data.body) {
        data.body = '[stripped]';
      }
    } else if (type === 'db') {
      data.selector = '[stripped]';
    } else if (type === 'http') {
      data.url = '[stripped]';
    } else if (type === 'email') {
      ['from', 'to', 'cc', 'bcc', 'replyTo'].forEach(function (item) {
        if (data[item]) {
          data[item] = '[stripped]';
        }
      });
    }
    return data;
  };
};

// Strip sensitive data sent to Monti APM engine.
// In contrast to stripSensitive, this one has an allow list of what to keep
// to guard against forgetting to strip new fields
// In the future this one might replace Tracer.stripSensitive
// options
Tracer.stripSensitiveThorough = function stripSensitive() {
  return function (type, data) {
    let fieldsToKeep = [];
    if (type === 'start') {
      fieldsToKeep = ['userId'];
    } else if (type === 'waitend') {
      fieldsToKeep = ['waitOn'];
    } else if (type === 'db') {
      fieldsToKeep = ['coll', 'func', 'cursor', 'limit', 'docsFetched', 'docSize', 'oplog', 'fields', 'projection', 'wasMultiplexerReady', 'queueLength', 'elapsedPollingTime', 'noOfCachedDocs'];
    } else if (type === 'http') {
      fieldsToKeep = ['method', 'statusCode'];
    } else if (type === 'email') {
      fieldsToKeep = [];
    } else if (type === 'custom') {
      // This is supplied by the user so we assume they are only giving data that can be sent
      fieldsToKeep = Object.keys(data);
    } else if (type === 'error') {
      fieldsToKeep = ['error'];
    }
    Object.keys(data).forEach(key => {
      if (fieldsToKeep.indexOf(key) === -1) {
        data[key] = '[stripped]';
      }
    });
    return data;
  };
};

// strip selectors only from the given list of collection names
Tracer.stripSelectors = function stripSelectors(collectionList, receiverType, name) {
  collectionList = collectionList || [];
  let collMap = {};
  collectionList.forEach(function (collName) {
    collMap[collName] = true;
  });
  return function (type, data, info) {
    if (type !== 'db' || data && !collMap[data.coll]) {
      return data;
    }
    if (receiverType && receiverType !== info.type) {
      return data;
    }
    if (name && name !== info.name) {
      return data;
    }
    data.selector = '[stripped]';
    return data;
  };
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"tracer_store.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/tracer/tracer_store.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  TracerStore: () => TracerStore
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
let EJSON;
module.link("meteor/ejson", {
  EJSON(v) {
    EJSON = v;
  }
}, 1);
let logger = Npm.require('debug')('kadira:ts');
function TracerStore(options) {
  options = options || {};
  this.maxTotalPoints = options.maxTotalPoints || 30;
  this.interval = options.interval || 1000 * 60;
  this.archiveEvery = options.archiveEvery || this.maxTotalPoints / 6;

  // store max total on the past 30 minutes (or past 30 items)
  this.maxTotals = Object.create(null);
  // store the max trace of the current interval
  this.currentMaxTrace = Object.create(null);
  // archive for the traces
  this.traceArchive = [];
  this.processedCnt = Object.create(null);

  // group errors by messages between an interval
  this.errorMap = Object.create(null);
}
TracerStore.prototype.addTrace = function (trace) {
  let kind = [trace.type, trace.name].join('::');
  if (!this.currentMaxTrace[kind]) {
    this.currentMaxTrace[kind] = EJSON.clone(trace);
  } else if (this.currentMaxTrace[kind].metrics.total < trace.metrics.total) {
    this.currentMaxTrace[kind] = EJSON.clone(trace);
  } else if (trace.errored) {
    this._handleErrors(trace);
  }
};
TracerStore.prototype.collectTraces = function () {
  let traces = this.traceArchive;
  this.traceArchive = [];

  // convert at(timestamp) into the actual serverTime
  traces.forEach(function (trace) {
    trace.at = Kadira.syncedDate.syncTime(trace.at);
  });
  return traces;
};
TracerStore.prototype.start = function () {
  this._timeoutHandler = setInterval(this.processTraces.bind(this), this.interval);
};
TracerStore.prototype.stop = function () {
  if (this._timeoutHandler) {
    clearInterval(this._timeoutHandler);
  }
};
TracerStore.prototype._handleErrors = function (trace) {
  // sending error requests as it is
  let lastEvent = trace.events[trace.events.length - 1];
  if (lastEvent && lastEvent[2]) {
    let error = lastEvent[2].error;

    // grouping errors occured (reset after processTraces)
    let errorKey = [trace.type, trace.name, error.message].join('::');
    if (!this.errorMap[errorKey]) {
      let erroredTrace = EJSON.clone(trace);
      this.errorMap[errorKey] = erroredTrace;
      this.traceArchive.push(erroredTrace);
    }
  } else {
    logger('last events is not an error: ', JSON.stringify(trace.events));
  }
};
TracerStore.prototype.processTraces = function () {
  let self = this;
  let kinds = new Set();
  Object.keys(this.maxTotals).forEach(key => {
    kinds.add(key);
  });
  Object.keys(this.currentMaxTrace).forEach(key => {
    kinds.add(key);
  });
  for (const kind of kinds) {
    self.processedCnt[kind] = self.processedCnt[kind] || 0;
    let currentMaxTrace = self.currentMaxTrace[kind];
    let currentMaxTotal = currentMaxTrace ? currentMaxTrace.metrics.total : 0;
    self.maxTotals[kind] = self.maxTotals[kind] || [];
    // add the current maxPoint
    self.maxTotals[kind].push(currentMaxTotal);
    let exceedingPoints = self.maxTotals[kind].length - self.maxTotalPoints;
    if (exceedingPoints > 0) {
      self.maxTotals[kind].splice(0, exceedingPoints);
    }
    let archiveDefault = self.processedCnt[kind] % self.archiveEvery === 0;
    self.processedCnt[kind]++;
    let canArchive = archiveDefault || self._isTraceOutlier(kind, currentMaxTrace);
    if (canArchive && currentMaxTrace) {
      self.traceArchive.push(currentMaxTrace);
    }

    // reset currentMaxTrace
    self.currentMaxTrace[kind] = null;
  }

  // reset the errorMap
  self.errorMap = Object.create(null);
};
TracerStore.prototype._isTraceOutlier = function (kind, trace) {
  if (trace) {
    let dataSet = this.maxTotals[kind];
    return this._isOutlier(dataSet, trace.metrics.total, 3);
  }
  return false;
};

/*
  Data point must exists in the dataSet
*/
TracerStore.prototype._isOutlier = function (dataSet, dataPoint, maxMadZ) {
  let median = this._getMedian(dataSet);
  let mad = this._calculateMad(dataSet, median);
  let madZ = this._funcMedianDeviation(median)(dataPoint) / mad;
  return madZ > maxMadZ;
};
TracerStore.prototype._getMedian = function (dataSet) {
  let sortedDataSet = _.clone(dataSet).sort(function (a, b) {
    return a - b;
  });
  return this._pickQuartile(sortedDataSet, 2);
};
TracerStore.prototype._pickQuartile = function (dataSet, num) {
  let pos = (dataSet.length + 1) * num / 4;
  if (pos % 1 === 0) {
    return dataSet[pos - 1];
  }
  pos -= pos % 1;
  return (dataSet[pos - 1] + dataSet[pos]) / 2;
};
TracerStore.prototype._calculateMad = function (dataSet, median) {
  let medianDeviations = _.map(dataSet, this._funcMedianDeviation(median));
  let mad = this._getMedian(medianDeviations);
  return mad;
};
TracerStore.prototype._funcMedianDeviation = function (median) {
  return function (x) {
    return Math.abs(median - x);
  };
};
TracerStore.prototype._getMean = function (dataPoints) {
  if (dataPoints.length > 0) {
    let total = 0;
    dataPoints.forEach(function (point) {
      total += point;
    });
    return total / dataPoints.length;
  }
  return 0;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"docsize_cache.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/docsize_cache.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  DocSzCache: () => DocSzCache,
  DocSzCacheItem: () => DocSzCacheItem
});
let LRU = Npm.require('lru-cache');
let jsonStringify = Npm.require('json-stringify-safe');
const DocSzCache = function (maxItems, maxValues) {
  this.items = new LRU({
    max: maxItems
  });
  this.maxValues = maxValues;
  this.cpuUsage = 0;
};
// This is called from SystemModel.prototype.cpuUsage and saves cpu usage.
DocSzCache.prototype.setPcpu = function (pcpu) {
  this.cpuUsage = pcpu;
};
DocSzCache.prototype.getSize = function (coll, query, opts, data) {
  // If the dataset is null or empty we can't calculate the size
  // Do not process this data and return 0 as the document size.
  if (!(data && (data.length || typeof data.size === 'function' && data.size()))) {
    return 0;
  }
  let key = this.getKey(coll, query, opts);
  let item = this.items.get(key);
  if (!item) {
    item = new DocSzCacheItem(this.maxValues);
    this.items.set(key, item);
  }
  if (this.needsUpdate(item)) {
    let doc = {};
    if (typeof data.get === 'function') {
      // This is an IdMap
      data.forEach(function (element) {
        doc = element;
        return false; // return false to stop loop. We only need one doc.
      });
    } else {
      doc = data[0];
    }
    let size = Buffer.byteLength(jsonStringify(doc), 'utf8');
    item.addData(size);
  }
  return item.getValue();
};
DocSzCache.prototype.getKey = function (coll, query, opts) {
  return jsonStringify([coll, query, opts]);
};

// returns a score between 0 and 1 for a cache item
// this score is determined by:
//  * available cache item slots
//  * time since last updated
//  * cpu usage of the application
DocSzCache.prototype.getItemScore = function (item) {
  return [(item.maxValues - item.values.length) / item.maxValues, (Date.now() - item.updated) / 60000, (100 - this.cpuUsage) / 100].map(function (score) {
    return score > 1 ? 1 : score;
  }).reduce(function (total, score) {
    return (total || 0) + score;
  }) / 3;
};
DocSzCache.prototype.needsUpdate = function (item) {
  // handle newly made items
  if (!item.values.length) {
    return true;
  }
  let currentTime = Date.now();
  let timeSinceUpdate = currentTime - item.updated;
  if (timeSinceUpdate > 1000 * 60) {
    return true;
  }
  return this.getItemScore(item) > 0.5;
};
const DocSzCacheItem = function (maxValues) {
  this.maxValues = maxValues;
  this.updated = 0;
  this.values = [];
};
DocSzCacheItem.prototype.addData = function (value) {
  this.values.push(value);
  this.updated = Date.now();
  if (this.values.length > this.maxValues) {
    this.values.shift();
  }
};
DocSzCacheItem.prototype.getValue = function () {
  function sortNumber(a, b) {
    return a - b;
  }
  let sorted = this.values.sort(sortNumber);
  let median = 0;
  let idx;
  if (sorted.length % 2 === 0) {
    idx = sorted.length / 2;
    median = (sorted[idx] + sorted[idx - 1]) / 2;
  } else {
    idx = Math.floor(sorted.length / 2);
    median = sorted[idx];
  }
  return median;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"kadira.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/kadira.js                                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }
}, 1);
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 2);
let ErrorModel;
module.link("./models/errors", {
  ErrorModel(v) {
    ErrorModel = v;
  }
}, 3);
let HttpModel;
module.link("./models/http", {
  HttpModel(v) {
    HttpModel = v;
  }
}, 4);
let MethodsModel;
module.link("./models/methods", {
  MethodsModel(v) {
    MethodsModel = v;
  }
}, 5);
let PubsubModel;
module.link("./models/pubsub", {
  PubsubModel(v) {
    PubsubModel = v;
  }
}, 6);
let SystemModel;
module.link("./models/system", {
  SystemModel(v) {
    SystemModel = v;
  }
}, 7);
let packageMap;
module.link("./.meteor-package-versions", {
  default(v) {
    packageMap = v;
  }
}, 8);
let getErrorParameters;
module.link("./common/utils", {
  getErrorParameters(v) {
    getErrorParameters = v;
  }
}, 9);
let WaitTimeBuilder;
module.link("./wait_time_builder", {
  WaitTimeBuilder(v) {
    WaitTimeBuilder = v;
  }
}, 10);
let DocSzCache;
module.link("./docsize_cache", {
  DocSzCache(v) {
    DocSzCache = v;
  }
}, 11);
let Ntp;
module.link("./ntp", {
  Ntp(v) {
    Ntp = v;
  }
}, 12);
let getClientVersions;
module.link("./utils", {
  getClientVersions(v) {
    getClientVersions = v;
  }
}, 13);
let handleApiResponse;
module.link("./sourcemaps", {
  handleApiResponse(v) {
    handleApiResponse = v;
  }
}, 14);
let TrackMeteorDebug, TrackUncaughtExceptions, TrackUnhandledRejections;
module.link("./hijack/error", {
  TrackMeteorDebug(v) {
    TrackMeteorDebug = v;
  },
  TrackUncaughtExceptions(v) {
    TrackUncaughtExceptions = v;
  },
  TrackUnhandledRejections(v) {
    TrackUnhandledRejections = v;
  }
}, 15);
const hostname = Npm.require('os').hostname();
const logger = Npm.require('debug')('kadira:apm');
const Fibers = Npm.require('fibers');
const KadiraCore = Npm.require('monti-apm-core').Kadira;
const DEBUG_PAYLOAD_SIZE = process.env.MONTI_DEBUG_PAYLOAD_SIZE === 'true';
Kadira.models = {};
Kadira.options = {};
Kadira.env = {
  currentSub: null,
  // keep current subscription inside ddp
  kadiraInfo: new Meteor.EnvironmentVariable()
};
Kadira.waitTimeBuilder = new WaitTimeBuilder();
Kadira.errors = [];
Kadira.errors.addFilter = Kadira.errors.push.bind(Kadira.errors);
Kadira.models.methods = new MethodsModel();
Kadira.models.pubsub = new PubsubModel();
Kadira.models.system = new SystemModel();
Kadira.models.http = new HttpModel();
Kadira.docSzCache = new DocSzCache(100000, 10);
Kadira.syncedDate = new Ntp();

// If the agent is not connected, we still want to build the payload occasionally
// since building the payload does some cleanup to prevent memory leaks
// Once connected, this interval is cleared
let buildInterval = Meteor.setInterval(() => {
  Kadira._buildPayload();
}, 1000 * 60);
Kadira.connect = function (appId, appSecret, options) {
  if (Kadira.connected) {
    console.log('Monti APM: Already Connected');
    return;
  }
  options = options || {};
  options.appId = appId;
  options.appSecret = appSecret;
  options.payloadTimeout = options.payloadTimeout || 1000 * 20;
  options.endpoint = options.endpoint || 'https://engine.montiapm.com';
  options.clientEngineSyncDelay = options.clientEngineSyncDelay || 10000;
  options.thresholds = options.thresholds || {};
  options.isHostNameSet = !!options.hostname;
  options.hostname = options.hostname || hostname;
  options.proxy = options.proxy || null;
  options.recordIPAddress = options.recordIPAddress || 'full';
  options.eventStackTrace = options.eventStackTrace || false;
  options.stalledTimeout = options.stalledTimeout || 1000 * 60 * 30;
  options.disableClientErrorTracking = options.disableClientErrorTracking || false;
  if (options.documentSizeCacheSize) {
    Kadira.docSzCache = new DocSzCache(options.documentSizeCacheSize, 10);
  }

  // remove trailing slash from endpoint url (if any)
  if (_.last(options.endpoint) === '/') {
    options.endpoint = options.endpoint.substr(0, options.endpoint.length - 1);
  }

  // error tracking is enabled by default
  if (options.enableErrorTracking === undefined) {
    options.enableErrorTracking = true;
  }

  // uploading sourcemaps is enabled by default in production
  if (options.uploadSourceMaps === undefined && Meteor.isProduction) {
    options.uploadSourceMaps = true;
  }
  Kadira.options = options;
  Kadira.options.authHeaders = {
    'KADIRA-APP-ID': Kadira.options.appId,
    'KADIRA-APP-SECRET': Kadira.options.appSecret
  };
  if (appId && appSecret) {
    options.appId = options.appId.trim();
    options.appSecret = options.appSecret.trim();
    Kadira.coreApi = new KadiraCore({
      appId: options.appId,
      appSecret: options.appSecret,
      endpoint: options.endpoint,
      hostname: options.hostname,
      agentVersion: packageMap['montiapm:agent'] || '<unknown>'
    });
    Kadira.coreApi._headers['METEOR-RELEASE'] = Meteor.release.replace('METEOR@', '');
    Kadira.coreApi._checkAuth().then(function () {
      logger('connected to app: ', appId);
      console.log('Monti APM: Connected');
      Kadira._sendAppStats();
      Kadira._schedulePayloadSend();
    }).catch(function (err) {
      if (err.message === 'Unauthorized') {
        console.log('Monti APM: Authentication failed, check your "appId" & "appSecret"');
      } else {
        console.log("Monti APM: Unable to connect. ".concat(err.message));
      }
    });
  } else {
    throw new Error('Monti APM: required appId and appSecret');
  }
  Kadira.syncedDate = new Ntp(options);
  Kadira.syncedDate.sync();
  Kadira.models.error = new ErrorModel(appId);

  // handle pre-added filters
  let addFilterFn = Kadira.models.error.addFilter.bind(Kadira.models.error);
  Kadira.errors.forEach(addFilterFn);
  Kadira.errors = Kadira.models.error;

  // setting runtime info, which will be sent to kadira
  __meteor_runtime_config__.kadira = {
    appId,
    endpoint: options.endpoint,
    clientEngineSyncDelay: options.clientEngineSyncDelay,
    recordIPAddress: options.recordIPAddress,
    disableNtp: options.disableNtp,
    disableClientErrorTracking: options.disableClientErrorTracking
  };
  if (options.enableErrorTracking) {
    Kadira.enableErrorTracking();
  } else {
    Kadira.disableErrorTracking();
  }

  // start tracking errors
  Meteor.startup(function () {
    TrackUncaughtExceptions();
    TrackUnhandledRejections();
    TrackMeteorDebug();
  });
  Meteor.publish(null, function () {
    let _options = __meteor_runtime_config__.kadira;
    this.added('kadira_settings', Random.id(), _options);
    this.ready();
  });

  // notify we've connected
  Kadira.connected = true;
};

// track how many times we've sent the data (once per minute)
Kadira._buildPayload = function () {
  let payload = {
    host: Kadira.options.hostname,
    clientVersions: getClientVersions()
  };
  let buildDetailedInfo = Kadira._isDetailedInfo();
  _.extend(payload, Kadira.models.methods.buildPayload(buildDetailedInfo));
  _.extend(payload, Kadira.models.pubsub.buildPayload(buildDetailedInfo));
  _.extend(payload, Kadira.models.system.buildPayload());
  _.extend(payload, Kadira.models.http.buildPayload());
  if (Kadira.options.enableErrorTracking) {
    _.extend(payload, Kadira.models.error.buildPayload());
  }
  return payload;
};
Kadira._countDataSent = 0;
Kadira._detailInfoSentInterval = Math.ceil(1000 * 60 / Kadira.options.payloadTimeout);
Kadira._isDetailedInfo = function () {
  return Kadira._countDataSent++ % Kadira._detailInfoSentInterval === 0;
};
Kadira._sendAppStats = function () {
  let appStats = {};
  appStats.release = Meteor.release;
  appStats.protocolVersion = '1.0.0';
  appStats.packageVersions = [];
  appStats.clientVersions = getClientVersions();
  _.each(Package, function (v, name) {
    appStats.packageVersions.push({
      name,
      version: packageMap[name] || null
    });
  });
  Kadira.coreApi.sendData({
    startTime: new Date(),
    appStats
  }).then(function (body) {
    handleApiResponse(body);
  }).catch(function (err) {
    console.error('Monti APM Error on sending appStats:', err.message);
  });
};
Kadira._schedulePayloadSend = function () {
  clearInterval(buildInterval);
  setTimeout(function () {
    Kadira._schedulePayloadSend();
    Kadira._sendPayload();
  }, Kadira.options.payloadTimeout);
};
function logPayload(payload) {
  let traceCount = payload.methodRequests.length + payload.pubRequests.length + payload.httpRequests.length + payload.errors.length;
  let largestTrace = {
    size: 0,
    content: ''
  };

  // eslint-disable-next-line no-inner-declarations
  function countBreakdowns(breakdowns, field) {
    let result = 0;
    breakdowns.forEach(entry => {
      result += Object.keys(entry[field]).length;
    });
    return result;
  }

  // eslint-disable-next-line no-inner-declarations
  function sizeTraces(traces) {
    let histogram = Object.create(null);
    let total = 0;
    traces.forEach(trace => {
      const stringified = JSON.stringify(trace);
      let length = stringified.length;
      total += length;
      if (length > largestTrace.size) {
        largestTrace = {
          size: length,
          content: stringified
        };
      }
      let normalized = length - length % 500;
      histogram[normalized] = histogram[normalized] || 0;
      histogram[normalized] += 1;
    });
    histogram.total = total;
    return Object.entries(histogram).map(_ref => {
      let [k, v] = _ref;
      return "".concat(k, ": ").concat(v);
    }).join(', ');
  }
  console.log('------- APM Payload Metrics -------');
  console.log("methods: ".concat(countBreakdowns(payload.methodMetrics, 'methods')));
  console.log("pubs: ".concat(countBreakdowns(payload.pubMetrics, 'pubs')));
  console.log("routes: ".concat(countBreakdowns(payload.httpMetrics, 'routes')));
  console.log("errors: ".concat(payload.errors.length));
  console.log("traces: ".concat(traceCount));
  console.log('Method trace sizes:', sizeTraces(payload.methodRequests));
  console.log('Pub trace sizes:', sizeTraces(payload.pubRequests));
  console.log('HTTP trace sizes:', sizeTraces(payload.httpRequests));
  console.log('Error trace sizes:', sizeTraces(payload.errors));
  console.log('Largest trace:', largestTrace);
  console.log('------- ------------------- -------');
}
Kadira._sendPayload = function () {
  new Fibers(function () {
    let payload = Kadira._buildPayload();
    if (DEBUG_PAYLOAD_SIZE) {
      logPayload(payload);
    }
    function send() {
      return Kadira.coreApi.sendData(payload).then(function (body) {
        handleApiResponse(body);
      });
    }
    function logErr(err) {
      console.log('Monti APM Error:', 'while sending payload to Monti APM:', err.message);
    }
    send().catch(function (err) {
      // Likely is RangeError: Invalid string length
      // This probably means we are close to running out of memory.
      if (err instanceof RangeError) {
        console.log('Monti APM: payload was too large to send to Monti APM. Resending without traces');
        payload.methodRequests = undefined;
        payload.httpRequests = undefined;
        payload.pubRequests = undefined;
        send().catch(logErr);
      } else {
        logErr(err);
      }
    });
  }).run();
};

// this return the __kadiraInfo from the current Fiber by default
// if called with 2nd argument as true, it will get the kadira info from
// Meteor.EnvironmentVariable
//
// WARNNING: returned info object is the reference object.
//  Changing it might cause issues when building traces. So use with care
Kadira._getInfo = function (currentFiber, useEnvironmentVariable) {
  currentFiber = currentFiber || Fibers.current;
  if (currentFiber) {
    if (useEnvironmentVariable) {
      return Kadira.env.kadiraInfo.get();
    }
    return currentFiber.__kadiraInfo;
  }
};

// this does not clone the info object. So, use with care
Kadira._setInfo = function (info) {
  Fibers.current.__kadiraInfo = info;
};
Kadira.startContinuousProfiling = function () {
  MontiProfiler.startContinuous(function onProfile(_ref2) {
    let {
      profile,
      startTime,
      endTime
    } = _ref2;
    if (!Kadira.connected) {
      return;
    }
    Kadira.coreApi.sendData({
      profiles: [{
        profile,
        startTime,
        endTime
      }]
    }).catch(e => console.log('Monti: err sending cpu profile', e));
  });
};

/**
 * @warning Mutating the `__meteor_runtime_config__` object does not propagate in real-time to the client, only if the
 * version changes and the client refreshes it seems. In the future we might want to change that into a reactive approach.
 */

Kadira.enableErrorTracking = function () {
  __meteor_runtime_config__.kadira.enableErrorTracking = true;
  Kadira.options.enableErrorTracking = true;
};
Kadira.disableErrorTracking = function () {
  __meteor_runtime_config__.kadira.enableErrorTracking = false;
  Kadira.options.enableErrorTracking = false;
};
Kadira.disableClientErrorTracking = function () {
  __meteor_runtime_config__.kadira.disableClientErrorTracking = Kadira.options.disableClientErrorTracking = true;
};
Kadira.enableClientErrorTracking = function () {
  __meteor_runtime_config__.kadira.disableClientErrorTracking = Kadira.options.disableClientErrorTracking = false;
};
Kadira.trackError = function () {
  if (!Kadira.options.enableErrorTracking) {
    return;
  }
  const {
    message,
    subType,
    stack,
    type,
    kadiraInfo = Kadira._getInfo()
  } = getErrorParameters(arguments);
  const now = Ntp._now();
  const previousEvents = kadiraInfo && kadiraInfo.trace ? kadiraInfo.trace.events : [{
    type: 'start',
    at: now,
    endAt: now
  }];
  const events = Kadira.tracer.optimizeEvents(previousEvents).concat([['error', 0, {
    error: {
      message,
      stack
    }
  }]]);
  if (message) {
    let trace = {
      type: type || 'server-internal',
      subType: subType || 'server',
      name: message,
      errored: true,
      at: Kadira.syncedDate.getTime(),
      events,
      metrics: {
        total: 0
      }
    };
    Kadira.models.error.trackError({
      message,
      stack
    }, trace);
  }
};
Kadira.ignoreErrorTracking = function (err) {
  err._skipKadira = true;
};
Kadira.startEvent = function (name) {
  let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  let kadiraInfo = Kadira._getInfo();
  if (kadiraInfo) {
    return Kadira.tracer.event(kadiraInfo.trace, 'custom', data, {
      name
    });
  }
  return false;
};
Kadira.endEvent = function (event, data) {
  let kadiraInfo = Kadira._getInfo();

  // The event could be false if it could not be started.
  // Handle it here instead of requiring the app to.
  if (kadiraInfo && event) {
    Kadira.tracer.eventEnd(kadiraInfo.trace, event, data);
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"hijack":{"wrap_server.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_server.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapServer: () => wrapServer
});
function wrapServer(serverProto) {
  let originalHandleConnect = serverProto._handleConnect;
  serverProto._handleConnect = function (socket, msg) {
    originalHandleConnect.call(this, socket, msg);
    let session = socket._meteorSession;
    // sometimes it is possible for _meteorSession to be undefined
    // one such reason would be if DDP versions are not matching
    // if then, we should not process it
    if (!session) {
      return;
    }
    Kadira.EventBus.emit('system', 'createSession', msg, socket._meteorSession);
    if (Kadira.connected) {
      Kadira.models.system.handleSessionActivity(msg, socket._meteorSession);
    }
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wrap_session.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_session.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapSession: () => wrapSession
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 1);
let MeteorDebugIgnore;
module.link("./error", {
  MeteorDebugIgnore(v) {
    MeteorDebugIgnore = v;
  }
}, 2);
let TimeoutManager;
module.link("./timeout_manager", {
  TimeoutManager(v) {
    TimeoutManager = v;
  }
}, 3);
const MAX_PARAMS_LENGTH = 4000;
function wrapSession(sessionProto) {
  let originalProcessMessage = sessionProto.processMessage;
  sessionProto.processMessage = function (msg) {
    let kadiraInfo = {
      session: this.id,
      userId: this.userId
    };
    if (msg.msg === 'method' || msg.msg === 'sub') {
      kadiraInfo.trace = Kadira.tracer.start(this, msg);
      Kadira.waitTimeBuilder.register(this, msg.id);
      let params = Kadira.tracer._applyObjectFilters(msg.params || []);
      // use JSON instead of EJSON to save the CPU
      let stringifiedParams = JSON.stringify(params);

      // The params could be several mb or larger.
      // Truncate if it is large
      if (stringifiedParams.length > MAX_PARAMS_LENGTH) {
        stringifiedParams = "Monti APM: params are too big. First ".concat(MAX_PARAMS_LENGTH, " characters: ").concat(stringifiedParams.slice(0, MAX_PARAMS_LENGTH));
      }
      let startData = {
        userId: this.userId,
        params: stringifiedParams
      };
      Kadira.tracer.event(kadiraInfo.trace, 'start', startData);
      msg._waitEventId = Kadira.tracer.event(kadiraInfo.trace, 'wait', {}, kadiraInfo);
      msg.__kadiraInfo = kadiraInfo;
      if (msg.msg === 'sub') {
        // start tracking inside processMessage allows us to indicate
        // wait time as well
        Kadira.EventBus.emit('pubsub', 'subReceived', this, msg);
        Kadira.models.pubsub._trackSub(this, msg);
      }
    }
    Kadira.EventBus.emit('system', 'ddpMessageReceived', this, msg);
    Kadira.models.system.handleSessionActivity(msg, this);
    return originalProcessMessage.call(this, msg);
  };

  // adding the method context to the current fiber
  let originalMethodHandler = sessionProto.protocol_handlers.method;
  sessionProto.protocol_handlers.method = function (msg, unblock) {
    let self = this;
    // add context
    let kadiraInfo = msg.__kadiraInfo;
    let response;
    if (kadiraInfo) {
      Kadira._setInfo(kadiraInfo);
      TimeoutManager.trackTimeout({
        kadiraInfo,
        msg
      });

      // end wait event
      let waitList = Kadira.waitTimeBuilder.build(this, msg.id);
      Kadira.tracer.eventEnd(kadiraInfo.trace, msg._waitEventId, {
        waitOn: waitList
      });
      unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);
      response = Kadira.env.kadiraInfo.withValue(kadiraInfo, function () {
        return originalMethodHandler.call(self, msg, unblock);
      });
      unblock();
    } else {
      response = originalMethodHandler.call(self, msg, unblock);
    }
    return response;
  };

  // to capture the currently processing message
  let orginalSubHandler = sessionProto.protocol_handlers.sub;
  sessionProto.protocol_handlers.sub = function (msg, unblock) {
    let self = this;
    // add context
    let kadiraInfo = msg.__kadiraInfo;
    let response;
    if (kadiraInfo) {
      Kadira._setInfo(kadiraInfo);
      TimeoutManager.trackTimeout({
        kadiraInfo,
        msg
      });

      // end wait event
      let waitList = Kadira.waitTimeBuilder.build(this, msg.id);
      Kadira.tracer.eventEnd(kadiraInfo.trace, msg._waitEventId, {
        waitOn: waitList
      });
      unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);
      response = Kadira.env.kadiraInfo.withValue(kadiraInfo, function () {
        return orginalSubHandler.call(self, msg, unblock);
      });
      unblock();
    } else {
      response = orginalSubHandler.call(self, msg, unblock);
    }
    return response;
  };

  // to capture the currently processing message
  let orginalUnSubHandler = sessionProto.protocol_handlers.unsub;
  sessionProto.protocol_handlers.unsub = function (msg, unblock) {
    unblock = Kadira.waitTimeBuilder.trackWaitTime(this, msg, unblock);
    let response = orginalUnSubHandler.call(this, msg, unblock);
    unblock();
    return response;
  };

  // track method ending (to get the result of error)
  let originalSend = sessionProto.send;
  sessionProto.send = function (msg) {
    if (msg.msg === 'result') {
      let kadiraInfo = Kadira._getInfo();
      if (kadiraInfo) {
        TimeoutManager.clearTimeout({
          kadiraInfo
        });
        let error;
        if (msg.error) {
          error = _.pick(msg.error, ['message', 'stack', 'details']);

          // pick the error from the wrapped method handler
          if (kadiraInfo && kadiraInfo.currentError) {
            // the error stack is wrapped so Meteor._debug can identify
            // this as a method error.
            error = _.pick(kadiraInfo.currentError, ['message', 'stack', 'details']);
            // see wrapMethodHanderForErrors() method def for more info
            if (error.stack && error.stack.stack) {
              error.stack = error.stack.stack;
            }
          }
          Kadira.tracer.endLastEvent(kadiraInfo.trace);
          Kadira.tracer.event(kadiraInfo.trace, 'error', {
            error
          });
        } else {
          Kadira.tracer.endLastEvent(kadiraInfo.trace);
          Kadira.tracer.event(kadiraInfo.trace, 'complete');
        }

        // processing the message
        let trace = Kadira.tracer.buildTrace(kadiraInfo.trace);
        Kadira.EventBus.emit('method', 'methodCompleted', trace, this);
        Kadira.models.methods.processMethod(trace);

        // error may or may not exist and error tracking can be disabled
        if (error && Kadira.options.enableErrorTracking) {
          Kadira.models.error.trackError(error, trace);
        }

        // clean and make sure, fiber is clean
        // not sure we need to do this, but a preventive measure
        Kadira._setInfo(null);
      }
    }
    return originalSend.call(this, msg);
  };
}
// wrap existing method handlers for capturing errors
_.each(Meteor.server.method_handlers, function (handler, name) {
  wrapMethodHanderForErrors(name, handler, Meteor.server.method_handlers);
});

// wrap future method handlers for capturing errors
let originalMeteorMethods = Meteor.methods;
Meteor.methods = function (methodMap) {
  _.each(methodMap, function (handler, name) {
    wrapMethodHanderForErrors(name, handler, methodMap);
  });
  originalMeteorMethods(methodMap);
};
function wrapMethodHanderForErrors(name, originalHandler, methodMap) {
  methodMap[name] = function () {
    try {
      return originalHandler.apply(this, arguments);
    } catch (ex) {
      if (ex && Kadira._getInfo()) {
        // sometimes error may be just a string or a primitive
        // in that case, we need to make it a psuedo error
        if (typeof ex !== 'object') {
          // eslint-disable-next-line no-ex-assign
          ex = {
            message: ex,
            stack: ex
          };
        }
        // Now we are marking this error to get tracked via methods
        // But, this also triggers a Meteor.debug call, and
        // it only gets the stack
        // We also track Meteor.debug errors and want to stop
        // tracking this error. That's why we do this
        // See Meteor.debug error tracking code for more
        // If error tracking is disabled, we do not modify the stack since
        // it would be shown as an object in the logs
        if (Kadira.options.enableErrorTracking) {
          ex.stack = {
            stack: ex.stack,
            source: 'method',
            [MeteorDebugIgnore]: true
          };
          Kadira._getInfo().currentError = ex;
        }
      }
      throw ex;
    }
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wrap_subscription.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_subscription.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapSubscription: () => wrapSubscription
});
let MeteorDebugIgnore;
module.link("./error", {
  MeteorDebugIgnore(v) {
    MeteorDebugIgnore = v;
  }
}, 0);
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 1);
function wrapSubscription(subscriptionProto) {
  // If the ready event runs outside the Fiber, Kadira._getInfo() doesn't work.
  // we need some other way to store kadiraInfo so we can use it at ready hijack.
  let originalRunHandler = subscriptionProto._runHandler;
  subscriptionProto._runHandler = function () {
    let kadiraInfo = Kadira._getInfo();
    if (kadiraInfo) {
      this.__kadiraInfo = kadiraInfo;
    }
    originalRunHandler.call(this);
  };
  let originalReady = subscriptionProto.ready;
  subscriptionProto.ready = function () {
    // meteor has a field called `_ready` which tracks this,
    // but we need to make it future-proof
    if (!this._apmReadyTracked) {
      let kadiraInfo = Kadira._getInfo() || this.__kadiraInfo;
      delete this.__kadiraInfo;
      let trace;

      // sometime .ready can be called in the context of the method
      // then we have some problems, that's why we are checking this
      // eg:- Accounts.createUser
      // Also, when the subscription is created by fast render, _subscriptionId and
      // the trace.id are both undefined, but we don't want to complete the HTTP trace here
      if (kadiraInfo && this._subscriptionId && this._subscriptionId === kadiraInfo.trace.id) {
        Kadira.tracer.endLastEvent(kadiraInfo.trace);
        Kadira.tracer.event(kadiraInfo.trace, 'complete');
        trace = Kadira.tracer.buildTrace(kadiraInfo.trace);
      }
      Kadira.EventBus.emit('pubsub', 'subCompleted', trace, this._session, this);
      Kadira.models.pubsub._trackReady(this._session, this, trace);
      this._apmReadyTracked = true;
    }

    // we still pass the control to the original implementation
    // since multiple ready calls are handled by itself
    originalReady.call(this);
  };
  let originalError = subscriptionProto.error;
  subscriptionProto.error = function (err) {
    if (typeof err === 'string') {
      err = {
        message: err
      };
    }
    let kadiraInfo = Kadira._getInfo();
    if (kadiraInfo && this._subscriptionId && this._subscriptionId === kadiraInfo.trace.id) {
      Kadira.tracer.endLastEvent(kadiraInfo.trace);
      let errorForApm = _.pick(err, 'message', 'stack');
      Kadira.tracer.event(kadiraInfo.trace, 'error', {
        error: errorForApm
      });
      let trace = Kadira.tracer.buildTrace(kadiraInfo.trace);
      Kadira.models.pubsub._trackError(this._session, this, trace);

      // error tracking can be disabled and if there is a trace
      // should be available all the time, but it won't
      // if something wrong happened on the trace building
      if (Kadira.options.enableErrorTracking && trace) {
        Kadira.models.error.trackError(err, trace);
      }
    }

    // wrap error stack so Meteor._debug can identify and ignore it
    // it is not wrapped when error tracking is disabled since it
    // would be shown as an object in the logs
    if (Kadira.options.enableErrorTracking) {
      err.stack = {
        stack: err.stack,
        source: 'subscription',
        [MeteorDebugIgnore]: true
      };
    }
    originalError.call(this, err);
  };
  let originalDeactivate = subscriptionProto._deactivate;
  subscriptionProto._deactivate = function () {
    Kadira.EventBus.emit('pubsub', 'subDeactivated', this._session, this);
    Kadira.models.pubsub._trackUnsub(this._session, this);
    originalDeactivate.call(this);
  };

  // adding the currenSub env variable
  ['added', 'changed', 'removed'].forEach(function (funcName) {
    let originalFunc = subscriptionProto[funcName];
    subscriptionProto[funcName] = function (collectionName, id, fields) {
      let self = this;

      // we need to run this code in a fiber and that's how we track
      // subscription info. Maybe we can figure out, some other way to do this
      // We use this currently to get the publication info when tracking message
      // sizes at wrap_ddp_stringify.js
      Kadira.env.currentSub = self;
      let res = originalFunc.call(self, collectionName, id, fields);
      Kadira.env.currentSub = null;
      return res;
    };
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wrap_observers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_observers.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapOplogObserveDriver: () => wrapOplogObserveDriver,
  wrapPollingObserveDriver: () => wrapPollingObserveDriver,
  wrapMultiplexer: () => wrapMultiplexer,
  wrapForCountingObservers: () => wrapForCountingObservers
});
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 0);
function wrapOplogObserveDriver(proto) {
  // Track the polled documents. This is reflected to the RAM size and
  // for the CPU usage directly
  let originalPublishNewResults = proto._publishNewResults;
  proto._publishNewResults = function (newResults, newBuffer) {
    let coll = this._cursorDescription.collectionName;
    let query = this._cursorDescription.selector;
    let opts = this._cursorDescription.options;
    const docSize = Kadira.docSzCache.getSize(coll, query, opts, newBuffer);
    let count = newResults.size() + newBuffer.size();
    if (this._ownerInfo) {
      Kadira.models.pubsub.trackPolledDocuments(this._ownerInfo, count);
      Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, 'polledFetches', docSize * count);
    } else {
      this._polledDocuments = count;
      this._docSize = {
        polledFetches: docSize * count
      };
    }
    return originalPublishNewResults.call(this, newResults, newBuffer);
  };
  let originalHandleOplogEntryQuerying = proto._handleOplogEntryQuerying;
  proto._handleOplogEntryQuerying = function (op) {
    Kadira.models.pubsub.trackDocumentChanges(this._ownerInfo, op);
    return originalHandleOplogEntryQuerying.call(this, op);
  };
  let originalHandleOplogEntrySteadyOrFetching = proto._handleOplogEntrySteadyOrFetching;
  proto._handleOplogEntrySteadyOrFetching = function (op) {
    Kadira.models.pubsub.trackDocumentChanges(this._ownerInfo, op);
    return originalHandleOplogEntrySteadyOrFetching.call(this, op);
  };

  // track live updates
  ['_addPublished', '_removePublished', '_changePublished'].forEach(function (fnName) {
    let originalFn = proto[fnName];
    proto[fnName] = function (a, b, c) {
      if (this._ownerInfo) {
        Kadira.models.pubsub.trackLiveUpdates(this._ownerInfo, fnName, 1);
        if (fnName === '_addPublished') {
          const coll = this._cursorDescription.collectionName;
          const query = this._cursorDescription.selector;
          const opts = this._cursorDescription.options;
          const docSize = Kadira.docSzCache.getSize(coll, query, opts, [b]);
          Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, 'liveFetches', docSize);
        }
      } else {
        // If there is no ownerInfo, that means this is the initial adds
        if (!this._liveUpdatesCounts) {
          this._liveUpdatesCounts = {
            _initialAdds: 0
          };
        }
        this._liveUpdatesCounts._initialAdds++;
        if (fnName === '_addPublished') {
          if (!this._docSize) {
            this._docSize = {
              initialFetches: 0
            };
          }
          if (!this._docSize.initialFetches) {
            this._docSize.initialFetches = 0;
          }
          const coll = this._cursorDescription.collectionName;
          const query = this._cursorDescription.selector;
          const opts = this._cursorDescription.options;
          const docSize = Kadira.docSzCache.getSize(coll, query, opts, [b]);
          this._docSize.initialFetches += docSize;
        }
      }
      return originalFn.call(this, a, b, c);
    };
  });
  let originalStop = proto.stop;
  proto.stop = function () {
    if (this._ownerInfo && this._ownerInfo.type === 'sub') {
      Kadira.EventBus.emit('pubsub', 'observerDeleted', this._ownerInfo);
      Kadira.models.pubsub.trackDeletedObserver(this._ownerInfo);
    }
    return originalStop.call(this);
  };
}
function wrapPollingObserveDriver(proto) {
  let originalPollMongo = proto._pollMongo;
  proto._pollMongo = function () {
    originalPollMongo.call(this);

    // Current result is stored in the following variable.
    // So, we can use that
    // Sometimes, it's possible to get size as undefined.
    // May be something with different version. We don't need to worry about
    // this now
    let count = 0;
    let docSize = 0;
    if (this._results && this._results.size) {
      count = this._results.size() || 0;
      let coll = this._cursorDescription.collectionName;
      let query = this._cursorDescription.selector;
      let opts = this._cursorDescription.options;
      docSize = Kadira.docSzCache.getSize(coll, query, opts, this._results._map) * count;
    }
    if (this._ownerInfo) {
      Kadira.models.pubsub.trackPolledDocuments(this._ownerInfo, count);
      Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, 'polledFetches', docSize);
    } else {
      this._polledDocuments = count;
      this._polledDocSize = docSize;
    }
  };
  let originalStop = proto.stop;
  proto.stop = function () {
    if (this._ownerInfo && this._ownerInfo.type === 'sub') {
      Kadira.EventBus.emit('pubsub', 'observerDeleted', this._ownerInfo);
      Kadira.models.pubsub.trackDeletedObserver(this._ownerInfo);
    }
    return originalStop.call(this);
  };
}
function wrapMultiplexer(proto) {
  let originalInitalAdd = proto.addHandleAndSendInitialAdds;
  proto.addHandleAndSendInitialAdds = function (handle) {
    if (!this._firstInitialAddTime) {
      this._firstInitialAddTime = Date.now();
    }
    handle._wasMultiplexerReady = this._ready();
    handle._queueLength = this._queue._taskHandles.length;
    if (!handle._wasMultiplexerReady) {
      handle._elapsedPollingTime = Date.now() - this._firstInitialAddTime;
    }
    return originalInitalAdd.call(this, handle);
  };
}
function wrapForCountingObservers() {
  // to count observers
  let mongoConnectionProto = MeteorX.MongoConnection.prototype;
  let originalObserveChanges = mongoConnectionProto._observeChanges;
  mongoConnectionProto._observeChanges = function (cursorDescription, ordered, callbacks) {
    let ret = originalObserveChanges.call(this, cursorDescription, ordered, callbacks);
    // get the Kadira Info via the Meteor.EnvironmentalVariable
    let kadiraInfo = Kadira._getInfo(null, true);
    if (kadiraInfo && ret._multiplexer) {
      if (!ret._multiplexer.__kadiraTracked) {
        // new multiplexer
        ret._multiplexer.__kadiraTracked = true;
        Kadira.EventBus.emit('pubsub', 'newSubHandleCreated', kadiraInfo.trace);
        Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, false);
        if (kadiraInfo.trace.type === 'sub') {
          let ownerInfo = {
            type: kadiraInfo.trace.type,
            name: kadiraInfo.trace.name,
            startTime: new Date().getTime()
          };
          let observerDriver = ret._multiplexer._observeDriver;
          observerDriver._ownerInfo = ownerInfo;
          Kadira.EventBus.emit('pubsub', 'observerCreated', ownerInfo);
          Kadira.models.pubsub.trackCreatedObserver(ownerInfo);

          // We need to send initially polled documents if there are
          if (observerDriver._polledDocuments) {
            Kadira.models.pubsub.trackPolledDocuments(ownerInfo, observerDriver._polledDocuments);
            observerDriver._polledDocuments = 0;
          }

          // We need to send initially polled documents if there are
          if (observerDriver._polledDocSize) {
            Kadira.models.pubsub.trackDocSize(ownerInfo.name, 'polledFetches', observerDriver._polledDocSize);
            observerDriver._polledDocSize = 0;
          }

          // Process _liveUpdatesCounts
          _.each(observerDriver._liveUpdatesCounts, function (count, key) {
            Kadira.models.pubsub.trackLiveUpdates(ownerInfo, key, count);
          });

          // Process docSize
          _.each(observerDriver._docSize, function (count, key) {
            Kadira.models.pubsub.trackDocSize(ownerInfo.name, key, count);
          });
        }
      } else {
        Kadira.EventBus.emit('pubsub', 'cachedSubHandleCreated', kadiraInfo.trace);
        Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, true);
      }
    }
    return ret;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wrap_ddp_stringify.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_ddp_stringify.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapStringifyDDP: () => wrapStringifyDDP
});
let DDPCommon;
module.link("meteor/ddp-common", {
  DDPCommon(v) {
    DDPCommon = v;
  }
}, 0);
function wrapStringifyDDP() {
  let originalStringifyDDP = DDPCommon.stringifyDDP;
  DDPCommon.stringifyDDP = function (msg) {
    let msgString = originalStringifyDDP(msg);
    let msgSize = Buffer.byteLength(msgString, 'utf8');
    let kadiraInfo = Kadira._getInfo(null, true);
    if (kadiraInfo && !Kadira.env.currentSub) {
      if (kadiraInfo.trace.type === 'method') {
        Kadira.models.methods.trackMsgSize(kadiraInfo.trace.name, msgSize);
      }
      return msgString;
    }

    // 'currentSub' is set when we wrap Subscription object and override
    // handlers for 'added', 'changed', 'removed' events. (see lib/hijack/wrap_subscription.js)
    if (Kadira.env.currentSub) {
      if (Kadira.env.currentSub.__kadiraInfo) {
        Kadira.models.pubsub.trackMsgSize(Kadira.env.currentSub._name, 'initialSent', msgSize);
        return msgString;
      }
      Kadira.models.pubsub.trackMsgSize(Kadira.env.currentSub._name, 'liveSent', msgSize);
      return msgString;
    }
    Kadira.models.methods.trackMsgSize('<not-a-method-or-a-pub>', msgSize);
    return msgString;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"instrument.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/instrument.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let wrapWebApp;
module.link("./wrap_webapp.js", {
  wrapWebApp(v) {
    wrapWebApp = v;
  }
}, 0);
let wrapFastRender;
module.link("./fast_render.js", {
  wrapFastRender(v) {
    wrapFastRender = v;
  }
}, 1);
let wrapFs;
module.link("./fs.js", {
  wrapFs(v) {
    wrapFs = v;
  }
}, 2);
let wrapPicker;
module.link("./picker.js", {
  wrapPicker(v) {
    wrapPicker = v;
  }
}, 3);
let wrapRouters;
module.link("./wrap_routers.js", {
  wrapRouters(v) {
    wrapRouters = v;
  }
}, 4);
let wrapFibers;
module.link("./async.js", {
  wrapFibers(v) {
    wrapFibers = v;
  }
}, 5);
let wrapSubscription;
module.link("./wrap_subscription", {
  wrapSubscription(v) {
    wrapSubscription = v;
  }
}, 6);
let wrapServer;
module.link("./wrap_server", {
  wrapServer(v) {
    wrapServer = v;
  }
}, 7);
let wrapSession;
module.link("./wrap_session", {
  wrapSession(v) {
    wrapSession = v;
  }
}, 8);
let wrapForCountingObservers, wrapMultiplexer, wrapOplogObserveDriver, wrapPollingObserveDriver;
module.link("./wrap_observers", {
  wrapForCountingObservers(v) {
    wrapForCountingObservers = v;
  },
  wrapMultiplexer(v) {
    wrapMultiplexer = v;
  },
  wrapOplogObserveDriver(v) {
    wrapOplogObserveDriver = v;
  },
  wrapPollingObserveDriver(v) {
    wrapPollingObserveDriver = v;
  }
}, 9);
let wrapStringifyDDP;
module.link("./wrap_ddp_stringify", {
  wrapStringifyDDP(v) {
    wrapStringifyDDP = v;
  }
}, 10);
let setLabels;
module.link("./set_labels", {
  setLabels(v) {
    setLabels = v;
  }
}, 11);
let hijackDBOps;
module.link("./db", {
  hijackDBOps(v) {
    hijackDBOps = v;
  }
}, 12);
let instrumented = false;
Kadira._startInstrumenting = function (callback) {
  if (instrumented) {
    callback();
    return;
  }
  instrumented = true;
  wrapFibers();
  wrapStringifyDDP();
  wrapWebApp();
  wrapFastRender();
  wrapPicker();
  wrapFs();
  wrapRouters();
  MeteorX.onReady(function () {
    // instrumenting session
    wrapServer(MeteorX.Server.prototype);
    wrapSession(MeteorX.Session.prototype);
    wrapSubscription(MeteorX.Subscription.prototype);
    if (MeteorX.MongoOplogDriver) {
      wrapOplogObserveDriver(MeteorX.MongoOplogDriver.prototype);
    }
    if (MeteorX.MongoPollingDriver) {
      wrapPollingObserveDriver(MeteorX.MongoPollingDriver.prototype);
    }
    if (MeteorX.Multiplexer) {
      wrapMultiplexer(MeteorX.Multiplexer.prototype);
    }
    wrapForCountingObservers();
    hijackDBOps();
    setLabels();
    callback();
  });
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"db.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/db.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  hijackDBOps: () => hijackDBOps
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Random;
module.link("meteor/random", {
  Random(v) {
    Random = v;
  }
}, 1);
let Mongo, MongoInternals;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  },
  MongoInternals(v) {
    MongoInternals = v;
  }
}, 2);
let _;
module.link("meteor/underscore", {
  _(v) {
    _ = v;
  }
}, 3);
let haveAsyncCallback, OptimizedApply;
module.link("../utils", {
  haveAsyncCallback(v) {
    haveAsyncCallback = v;
  },
  OptimizedApply(v) {
    OptimizedApply = v;
  }
}, 4);
// This hijack is important to make sure, collections created before
// we hijack dbOps, even gets tracked.
//  Meteor does not simply expose MongoConnection object to the client
//  It picks methods which are necessary and make a binded object and
//  assigned to the Mongo.Collection
//  so, even we updated prototype, we can't track those collections
//  but, this will fix it.

let originalOpen = MongoInternals.RemoteCollectionDriver.prototype.open;
MongoInternals.RemoteCollectionDriver.prototype.open = function open(name) {
  let self = this;
  let ret = originalOpen.call(self, name);
  _.each(ret, function (fn, m) {
    // make sure, it's in the actual mongo connection object
    // meteorhacks:mongo-collection-utils package add some arbitary methods
    // which does not exist in the mongo connection
    if (self.mongo[m]) {
      ret[m] = function () {
        Array.prototype.unshift.call(arguments, name);
        return OptimizedApply(self.mongo, self.mongo[m], arguments);
      };
    }
  });
  return ret;
};

// TODO: this should be added to Meteorx
function getSyncronousCursor() {
  const MongoColl = typeof Mongo !== 'undefined' ? Mongo.Collection : Meteor.Collection;
  const coll = new MongoColl("__dummy_coll_".concat(Random.id()));
  // we need to wait until the db is connected with meteor. findOne does that
  coll.findOne();
  const cursor = coll.find();
  cursor.fetch();
  return cursor._synchronousCursor.constructor;
}
function hijackDBOps() {
  let mongoConnectionProto = MeteorX.MongoConnection.prototype;
  // findOne is handled by find - so no need to track it
  // upsert is handles by update
  // 2.4 replaced _ensureIndex with createIndex
  ['find', 'update', 'remove', 'insert', '_ensureIndex', '_dropIndex', 'createIndex'].forEach(function (func) {
    let originalFunc = mongoConnectionProto[func];
    if (!originalFunc) {
      return;
    }
    mongoConnectionProto[func] = function (collName, selector, mod, options) {
      let payload = {
        coll: collName,
        func
      };
      if (func === 'insert') {
        // add nothing more to the payload
      } else if (func === '_ensureIndex' || func === '_dropIndex' || func === 'createIndex') {
        // add index
        payload.index = JSON.stringify(selector);
      } else if (func === 'update' && options && options.upsert) {
        payload.func = 'upsert';
        payload.selector = JSON.stringify(selector);
      } else {
        // all the other functions have selectors
        payload.selector = JSON.stringify(selector);
      }
      let kadiraInfo = Kadira._getInfo();
      let eventId;
      if (kadiraInfo) {
        eventId = Kadira.tracer.event(kadiraInfo.trace, 'db', payload);
      }

      // this cause V8 to avoid any performance optimizations, but this is must use
      // otherwise, if the error adds try catch block our logs get messy and didn't work
      // see: issue #6

      let ret;
      try {
        ret = originalFunc.apply(this, arguments);
        // handling functions which can be triggered with an asyncCallback
        let endOptions = {};
        if (haveAsyncCallback(arguments)) {
          endOptions.async = true;
        }
        if (func === 'update') {
          // upsert only returns an object when called `upsert` directly
          // otherwise it only act an update command
          if (options && options.upsert && typeof ret === 'object') {
            endOptions.updatedDocs = ret.numberAffected;
            endOptions.insertedId = ret.insertedId;
          } else {
            endOptions.updatedDocs = ret;
          }
        } else if (func === 'remove') {
          endOptions.removedDocs = ret;
        }
        if (eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endOptions);
        }
      } catch (ex) {
        if (eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {
            err: ex.message
          });
        }
        throw ex;
      }
      return ret;
    };
  });
  let cursorProto = MeteorX.MongoCursor.prototype;
  ['forEach', 'map', 'fetch', 'count', 'observeChanges', 'observe'].forEach(function (type) {
    let originalFunc = cursorProto[type];
    cursorProto[type] = function () {
      let cursorDescription = this._cursorDescription;
      let payload = Object.assign(Object.create(null), {
        coll: cursorDescription.collectionName,
        selector: JSON.stringify(cursorDescription.selector),
        func: type,
        cursor: true
      });
      if (cursorDescription.options) {
        let cursorOptions = _.pick(cursorDescription.options, ['fields', 'projection', 'sort', 'limit']);
        for (let field in cursorOptions) {
          let value = cursorOptions[field];
          if (typeof value === 'object') {
            value = JSON.stringify(value);
          }
          payload[field] = value;
        }
      }
      let kadiraInfo = Kadira._getInfo();
      let previousTrackNextObject;
      let eventId;
      if (kadiraInfo) {
        eventId = Kadira.tracer.event(kadiraInfo.trace, 'db', payload);
        previousTrackNextObject = kadiraInfo.trackNextObject;
        if (type === 'forEach' || type === 'map') {
          kadiraInfo.trackNextObject = true;
        }
      }
      try {
        let ret = originalFunc.apply(this, arguments);
        let endData = {};
        if (type === 'observeChanges' || type === 'observe') {
          let observerDriver;
          endData.oplog = false;
          // get data written by the multiplexer
          endData.wasMultiplexerReady = ret._wasMultiplexerReady;
          endData.queueLength = ret._queueLength;
          endData.elapsedPollingTime = ret._elapsedPollingTime;
          if (ret._multiplexer) {
            // older meteor versions done not have an _multiplexer value
            observerDriver = ret._multiplexer._observeDriver;
            if (observerDriver) {
              observerDriver = ret._multiplexer._observeDriver;
              let observerDriverClass = observerDriver.constructor;
              endData.oplog = typeof observerDriverClass.cursorSupported === 'function';
              let size = 0;
              ret._multiplexer._cache.docs.forEach(function () {
                size++;
              });
              endData.noOfCachedDocs = size;

              // if multiplexerWasNotReady, we need to get the time spend for the polling
              if (!ret._wasMultiplexerReady) {
                endData.initialPollingTime = observerDriver._lastPollTime;
              }
            }
          }
          if (!endData.oplog) {
            // let's try to find the reason
            let reasonInfo = Kadira.checkWhyNoOplog(cursorDescription, observerDriver);
            endData.noOplogCode = reasonInfo.code;
            endData.noOplogReason = reasonInfo.reason;
            endData.noOplogSolution = reasonInfo.solution;
          }
        } else if (type === 'fetch' || type === 'map') {
          // for other cursor operation

          endData.docsFetched = ret.length;
          if (type === 'fetch') {
            let coll = cursorDescription.collectionName;
            let query = cursorDescription.selector;
            let opts = cursorDescription.options;
            let docSize = Kadira.docSzCache.getSize(coll, query, opts, ret) * ret.length;
            endData.docSize = docSize;
            if (kadiraInfo) {
              if (kadiraInfo.trace.type === 'method') {
                Kadira.models.methods.trackDocSize(kadiraInfo.trace.name, docSize);
              } else if (kadiraInfo.trace.type === 'sub') {
                Kadira.models.pubsub.trackDocSize(kadiraInfo.trace.name, 'cursorFetches', docSize);
              }
              kadiraInfo.trackNextObject = previousTrackNextObject;
            } else {
              // Fetch with no kadira info are tracked as from a null method
              Kadira.models.methods.trackDocSize('<not-a-method-or-a-pub>', docSize);
            }

            // TODO: Add doc size tracking to `map` as well.
          }
        }
        if (eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endData);
        }
        return ret;
      } catch (ex) {
        if (eventId) {
          Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {
            err: ex.message
          });
        }
        throw ex;
      }
    };
  });
  const SyncronousCursor = getSyncronousCursor();
  let origNextObject = SyncronousCursor.prototype._nextObject;
  SyncronousCursor.prototype._nextObject = function () {
    let kadiraInfo = Kadira._getInfo();
    let shouldTrack = kadiraInfo && kadiraInfo.trackNextObject;
    let event;
    if (shouldTrack) {
      event = Kadira.tracer.event(kadiraInfo.trace, 'db', {
        func: '_nextObject',
        coll: this._cursorDescription.collectionName
      });
    }
    let result = origNextObject.call(this);
    if (shouldTrack) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, event);
    }
    return result;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"http.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/http.js                                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let haveAsyncCallback;
module.link("../utils", {
  haveAsyncCallback(v) {
    haveAsyncCallback = v;
  }
}, 0);
if (Package['http']) {
  const HTTP = Package['http'].HTTP;
  const library = 'meteor/http';
  const originalCall = HTTP.call;
  HTTP.call = function (method, url) {
    const tracer = Kadira.tracer;
    const kadiraInfo = Kadira._getInfo();
    const event = kadiraInfo ? tracer.event(kadiraInfo.trace, 'http', {
      method,
      url,
      library
    }) : null;
    if (!event) {
      return originalCall.apply(this, arguments);
    }
    try {
      const response = originalCall.apply(this, arguments);

      // If the user supplied an asyncCallback,
      // we don't have a response object and it handled asynchronously.
      // We need to track it down to prevent issues like: #3
      const endOptions = haveAsyncCallback(arguments) ? {
        async: true
      } : {
        statusCode: response.statusCode
      };
      tracer.eventEnd(kadiraInfo.trace, event, endOptions);
      return response;
    } catch (ex) {
      tracer.eventEnd(kadiraInfo.trace, event, {
        err: ex.message
      });
      throw ex;
    }
  };
}
if (Package['fetch']) {
  const library = 'meteor/fetch';
  const originalCall = Package['fetch'].fetch;
  const Request = Package['fetch'].Request;
  Package['fetch'].fetch = function (url, opts) {
    const request = new Request(url, opts);
    const tracer = Kadira.tracer;
    const kadiraInfo = Kadira._getInfo();
    const event = kadiraInfo ? tracer.event(kadiraInfo.trace, 'http', {
      method: request.method,
      url: request.url,
      library
    }) : null;
    if (!event) {
      return originalCall.apply(this, arguments);
    }
    try {
      const response = originalCall.apply(this, arguments);
      response.then(() => {
        tracer.eventEnd(kadiraInfo.trace, event, {});
      }).catch(ex => {
        tracer.eventEnd(kadiraInfo.trace, event, {
          err: ex.message
        });
      });
      return response;
    } catch (ex) {
      tracer.eventEnd(kadiraInfo.trace, event, {
        err: ex.message
      });
      throw ex;
    }
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"email.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/email.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let pick;
module.link("../utils", {
  pick(v) {
    pick = v;
  }
}, 0);
const CAPTURED_OPTIONS = ['from', 'to', 'cc', 'bcc', 'replyTo', 'messageId'];
const getWrapper = (originalSend, func) => function wrapper(options) {
  let eventId;
  const kadiraInfo = Kadira._getInfo();
  if (kadiraInfo) {
    const data = pick(options, CAPTURED_OPTIONS);
    data.func = func;
    eventId = Kadira.tracer.event(kadiraInfo.trace, 'email', data);
  }
  try {
    const ret = originalSend.call(this, options);
    if (eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId);
    }
    return ret;
  } catch (ex) {
    if (eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {
        err: ex.message
      });
    }
    throw ex;
  }
};
if (Package['email']) {
  const {
    Email
  } = Package['email'];
  Email.send = getWrapper(Email.send, 'email');
  if (Email.sendAsync) {
    Email.sendAsync = getWrapper(Email.sendAsync, 'emailAsync');
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"async.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/async.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapFibers: () => wrapFibers,
  getFiberMetrics: () => getFiberMetrics,
  resetFiberMetrics: () => resetFiberMetrics
});
let Fibers = Npm.require('fibers');
let EventSymbol = Symbol('MontiEventSymbol');
let StartTracked = Symbol('MontiStartTracked');
let activeFibers = 0;
let wrapped = false;
function endAsyncEvent(fiber) {
  if (!fiber[EventSymbol]) return;
  const kadiraInfo = Kadira._getInfo(fiber);
  if (!kadiraInfo) return;
  Kadira.tracer.eventEnd(kadiraInfo.trace, fiber[EventSymbol]);
  fiber[EventSymbol] = null;
}
function wrapFibers() {
  if (wrapped) {
    return;
  }
  wrapped = true;
  let originalYield = Fibers.yield;
  Fibers.yield = function () {
    let kadiraInfo = Kadira._getInfo();
    if (kadiraInfo) {
      let eventId = Kadira.tracer.event(kadiraInfo.trace, 'async');
      if (eventId) {
        // The event unique to this fiber
        // Using a symbol since Meteor doesn't copy symbols to new fibers created
        // for promises. This is needed so the correct event is ended when a fiber runs after being yielded.
        Fibers.current[EventSymbol] = eventId;
      }
    }
    return originalYield();
  };
  let originalRun = Fibers.prototype.run;
  let originalThrowInto = Fibers.prototype.throwInto;
  function ensureFiberCounted(fiber) {
    // If fiber.started is true, and StartTracked is false
    // then the fiber was probably initially ran before we wrapped Fibers.run
    if (!fiber.started || !fiber[StartTracked]) {
      activeFibers += 1;
      fiber[StartTracked] = true;
    }
  }
  Fibers.prototype.run = function (val) {
    ensureFiberCounted(this);
    if (this[EventSymbol]) {
      endAsyncEvent(this);
    } else if (!this.__kadiraInfo && Fibers.current && Fibers.current.__kadiraInfo) {
      // Copy kadiraInfo when packages or user code creates a new fiber
      // Done by many apps and packages in connect middleware since older
      // versions of Meteor did not do it automatically
      this.__kadiraInfo = Fibers.current.__kadiraInfo;
    }
    let result;
    try {
      result = originalRun.call(this, val);
    } finally {
      if (!this.started) {
        activeFibers -= 1;
        this[StartTracked] = false;
      }
    }
    return result;
  };
  Fibers.prototype.throwInto = function (val) {
    ensureFiberCounted(this);
    endAsyncEvent(this);
    let result;
    try {
      result = originalThrowInto.call(this, val);
    } finally {
      if (!this.started) {
        activeFibers -= 1;
        this[StartTracked] = false;
      }
    }
    return result;
  };
}
let activeFiberTotal = 0;
let activeFiberCount = 0;
let previousTotalCreated = 0;
setInterval(() => {
  activeFiberTotal += activeFibers;
  activeFiberCount += 1;
}, 1000);
function getFiberMetrics() {
  return {
    created: Fibers.fibersCreated - previousTotalCreated,
    active: activeFiberTotal / activeFiberCount,
    poolSize: Fibers.poolSize
  };
}
function resetFiberMetrics() {
  activeFiberTotal = 0;
  activeFiberCount = 0;
  previousTotalCreated = Fibers.fibersCreated;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"error.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/error.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  MeteorDebugIgnore: () => MeteorDebugIgnore,
  TrackUncaughtExceptions: () => TrackUncaughtExceptions,
  TrackUnhandledRejections: () => TrackUnhandledRejections,
  TrackMeteorDebug: () => TrackMeteorDebug
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let CreateUserStack;
module.link("../utils", {
  CreateUserStack(v) {
    CreateUserStack = v;
  }
}, 1);
const MeteorDebugIgnore = Symbol('MontiMeteorDebugIgnore');
function TrackUncaughtExceptions() {
  process.on('uncaughtException', function (err) {
    if (err === undefined || err === null) {
      let type = err === null ? 'null' : 'undefined';
      err = new Error("uncaught exception: ".concat(type));
    }
    const timer = setTimeout(function () {
      throwError(err);
    }, 1000 * 10);

    // skip errors with `_skipKadira` flag
    if (err._skipKadira) {
      return;
    }

    // let the server crash normally if error tracking is disabled
    if (!Kadira.options.enableErrorTracking) {
      printErrorAndKill(err);
    }

    // looking for already tracked errors and throw them immediately
    // throw error immediately if kadira is not ready
    if (err._tracked || !Kadira.connected) {
      printErrorAndKill(err);
    }
    let trace = getTrace(err, 'server-crash', 'uncaughtException');
    Kadira.models.error.trackError(err, trace);
    Kadira._sendPayload(function () {
      clearTimeout(timer);
      throwError(err);
    });
    function throwError(_err) {
      // sometimes error came back from a fiber.
      // But we don't fibers to track that error for us
      // That's why we throw the error on the nextTick
      process.nextTick(function () {
        // we need to mark this error where we really need to throw
        _err._tracked = true;
        printErrorAndKill(_err);
      });
    }
  });
  function printErrorAndKill(err) {
    // since we are capturing error, we are also on the error message.
    // so developers think we are also reponsible for the error.
    // But we are not. This will fix that.
    console.error(err.stack);
    process.exit(7);
  }
}
function TrackUnhandledRejections() {
  process.on('unhandledRejection', function (reason) {
    // skip errors with `_skipKadira` flag
    if (reason && reason._skipKadira || !Kadira.options.enableErrorTracking) {
      return;
    }
    if (reason === undefined) {
      reason = new Error('unhandledRejection: undefined');
    }
    let trace = getTrace(reason, 'server-internal', 'unhandledRejection');
    Kadira.models.error.trackError(reason, trace);

    // TODO: we should respect the --unhandled-rejections option
    // message taken from
    // https://github.com/nodejs/node/blob/f4797ff1ef7304659d747d181ec1e7afac408d50/lib/internal/process/promises.js#L243-L248
    const message = 'This error originated either by ' + 'throwing inside of an async function without a catch block, ' + 'or by rejecting a promise which was not handled with .catch().' + ' The promise rejected with the reason: ';

    // We could emit a warning instead like Node does internally
    // but it requires Node 8 or newer
    console.warn(message);
    console.error(reason && reason.stack ? reason.stack : reason);
  });
}
function TrackMeteorDebug() {
  let originalMeteorDebug = Meteor._debug;
  Meteor._debug = function (message, stack) {
    // Sometimes Meteor calls Meteor._debug with no arguments
    // to log an empty line
    const isArgs = message !== undefined || stack !== undefined;

    // We've changed `stack` into an object at method and sub handlers so we can
    // detect the error here. These errors are already tracked so don't track them again.
    let alreadyTracked = false;

    // Some Meteor versions pass the error, and other versions pass the error stack
    // Restore so origionalMeteorDebug shows the stack as a string instead as an object
    if (stack && stack[MeteorDebugIgnore]) {
      alreadyTracked = true;
      arguments[1] = stack.stack;
    } else if (stack && stack.stack && stack.stack[MeteorDebugIgnore]) {
      alreadyTracked = true;
      arguments[1] = stack.stack.stack;
    }

    // only send to the server if connected to kadira
    if (Kadira.options.enableErrorTracking && isArgs && !alreadyTracked && Kadira.connected) {
      let errorMessage = message;
      if (typeof message === 'string' && stack instanceof Error) {
        const separator = message.endsWith(':') ? '' : ':';
        errorMessage = "".concat(message).concat(separator, " ").concat(stack.message);
      }
      let error = new Error(errorMessage);
      if (stack instanceof Error) {
        error.stack = stack.stack;
      } else if (stack) {
        error.stack = stack;
      } else {
        error.stack = CreateUserStack(error);
      }
      let trace = getTrace(error, 'server-internal', 'Meteor._debug');
      Kadira.models.error.trackError(error, trace);
    }
    return originalMeteorDebug.apply(this, arguments);
  };
}
function getTrace(err, type, subType) {
  return {
    type,
    subType,
    name: err.message,
    errored: true,
    at: Kadira.syncedDate.getTime(),
    events: [['start', 0, {}], ['error', 0, {
      error: {
        message: err.message,
        stack: err.stack
      }
    }]],
    metrics: {
      total: 0
    }
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"set_labels.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/set_labels.js                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  setLabels: () => setLabels
});
let DDPServer;
module.link("meteor/ddp-server", {
  DDPServer(v) {
    DDPServer = v;
  }
}, 0);
function setLabels() {
  // name Session.prototype.send
  let originalSend = MeteorX.Session.prototype.send;
  MeteorX.Session.prototype.send = function kadira_Session_send(msg) {
    return originalSend.call(this, msg);
  };

  // name Multiplexer initial adds
  // Multiplexer is undefined in rocket chat
  if (MeteorX.Multiplexer) {
    let originalSendAdds = MeteorX.Multiplexer.prototype._sendAdds;
    MeteorX.Multiplexer.prototype._sendAdds = function kadira_Multiplexer_sendAdds(handle) {
      return originalSendAdds.call(this, handle);
    };
  }

  // name MongoConnection insert
  let originalMongoInsert = MeteorX.MongoConnection.prototype._insert;
  MeteorX.MongoConnection.prototype._insert = function kadira_MongoConnection_insert(coll, doc, cb) {
    return originalMongoInsert.call(this, coll, doc, cb);
  };

  // name MongoConnection update
  let originalMongoUpdate = MeteorX.MongoConnection.prototype._update;
  MeteorX.MongoConnection.prototype._update = function kadira_MongoConnection_update(coll, selector, mod, options, cb) {
    return originalMongoUpdate.call(this, coll, selector, mod, options, cb);
  };

  // name MongoConnection remove
  let originalMongoRemove = MeteorX.MongoConnection.prototype._remove;
  MeteorX.MongoConnection.prototype._remove = function kadira_MongoConnection_remove(coll, selector, cb) {
    return originalMongoRemove.call(this, coll, selector, cb);
  };

  // name Pubsub added
  let originalPubsubAdded = MeteorX.Session.prototype.sendAdded;
  MeteorX.Session.prototype.sendAdded = function kadira_Session_sendAdded(coll, id, fields) {
    return originalPubsubAdded.call(this, coll, id, fields);
  };

  // name Pubsub changed
  let originalPubsubChanged = MeteorX.Session.prototype.sendChanged;
  MeteorX.Session.prototype.sendChanged = function kadira_Session_sendChanged(coll, id, fields) {
    return originalPubsubChanged.call(this, coll, id, fields);
  };

  // name Pubsub removed
  let originalPubsubRemoved = MeteorX.Session.prototype.sendRemoved;
  MeteorX.Session.prototype.sendRemoved = function kadira_Session_sendRemoved(coll, id) {
    return originalPubsubRemoved.call(this, coll, id);
  };

  // name MongoCursor forEach
  let originalCursorForEach = MeteorX.MongoCursor.prototype.forEach;
  MeteorX.MongoCursor.prototype.forEach = function kadira_Cursor_forEach() {
    return originalCursorForEach.apply(this, arguments);
  };

  // name MongoCursor map
  let originalCursorMap = MeteorX.MongoCursor.prototype.map;
  MeteorX.MongoCursor.prototype.map = function kadira_Cursor_map() {
    return originalCursorMap.apply(this, arguments);
  };

  // name MongoCursor fetch
  let originalCursorFetch = MeteorX.MongoCursor.prototype.fetch;
  MeteorX.MongoCursor.prototype.fetch = function kadira_Cursor_fetch() {
    return originalCursorFetch.apply(this, arguments);
  };

  // name MongoCursor count
  let originalCursorCount = MeteorX.MongoCursor.prototype.count;
  MeteorX.MongoCursor.prototype.count = function kadira_Cursor_count() {
    return originalCursorCount.apply(this, arguments);
  };

  // name MongoCursor observeChanges
  let originalCursorObserveChanges = MeteorX.MongoCursor.prototype.observeChanges;
  MeteorX.MongoCursor.prototype.observeChanges = function kadira_Cursor_observeChanges() {
    return originalCursorObserveChanges.apply(this, arguments);
  };

  // name MongoCursor observe
  let originalCursorObserve = MeteorX.MongoCursor.prototype.observe;
  MeteorX.MongoCursor.prototype.observe = function kadira_Cursor_observe() {
    return originalCursorObserve.apply(this, arguments);
  };

  // name CrossBar listen
  let originalCrossbarListen = DDPServer._Crossbar.prototype.listen;
  DDPServer._Crossbar.prototype.listen = function kadira_Crossbar_listen(trigger, callback) {
    return originalCrossbarListen.call(this, trigger, callback);
  };

  // name CrossBar fire
  let originalCrossbarFire = DDPServer._Crossbar.prototype.fire;
  DDPServer._Crossbar.prototype.fire = function kadira_Crossbar_fire(notification) {
    return originalCrossbarFire.call(this, notification);
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fast_render.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/fast_render.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapFastRender: () => wrapFastRender
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
function wrapFastRender() {
  Meteor.startup(() => {
    if (Package['staringatlights:fast-render']) {
      const FastRender = Package['staringatlights:fast-render'].FastRender;

      // Flow Router doesn't call FastRender.route until after all
      // Meteor.startup callbacks finish
      let origRoute = FastRender.route;
      FastRender.route = function (path, _callback) {
        let callback = function () {
          const info = Kadira._getInfo();
          if (info) {
            info.suggestedRouteName = path;
          }
          return _callback.apply(this, arguments);
        };
        return origRoute.call(FastRender, path, callback);
      };
    }
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fs.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/fs.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  handleErrorEvent: () => handleErrorEvent,
  wrapFs: () => wrapFs
});
let fs;
module.link("fs", {
  default(v) {
    fs = v;
  }
}, 0);
const Fibers = require('fibers');
function wrapCallback(args, createWrapper) {
  if (typeof args[args.length - 1] === 'function') {
    args[args.length - 1] = createWrapper(args[args.length - 1]);
  }
}
function handleErrorEvent(eventEmitter, trace, event) {
  function handler(error) {
    if (trace && event) {
      Kadira.tracer.eventEnd(trace, event, {
        error
      });
    }

    // Node throws the error if there are no listeners
    // We want it to behave as if we are not listening to it
    if (eventEmitter.listenerCount('error') === 1) {
      eventEmitter.removeListener('error', handler);
      eventEmitter.emit('error', error);
    }
  }
  eventEmitter.on('error', handler);
}
function wrapFs() {
  // Some npm packages will do fs calls in the
  // callback of another fs call.
  // This variable is set with the kadiraInfo while
  // a callback is run so we can track other fs calls
  let fsKadiraInfo = null;
  let originalStat = fs.stat;
  fs.stat = function () {
    const kadiraInfo = Kadira._getInfo() || fsKadiraInfo;
    if (kadiraInfo) {
      let event = Kadira.tracer.event(kadiraInfo.trace, 'fs', {
        func: 'stat',
        path: arguments[0],
        options: typeof arguments[1] === 'object' ? arguments[1] : undefined
      });
      wrapCallback(arguments, cb => function () {
        Kadira.tracer.eventEnd(kadiraInfo.trace, event);
        if (!Fibers.current) {
          fsKadiraInfo = kadiraInfo;
        }
        try {
          cb(...arguments);
        } finally {
          fsKadiraInfo = null;
        }
      });
    }
    return originalStat.apply(fs, arguments);
  };
  let originalCreateReadStream = fs.createReadStream;
  fs.createReadStream = function () {
    const kadiraInfo = Kadira._getInfo() || fsKadiraInfo;
    let stream = originalCreateReadStream.apply(this, arguments);
    if (kadiraInfo) {
      const event = Kadira.tracer.event(kadiraInfo.trace, 'fs', {
        func: 'createReadStream',
        path: arguments[0],
        options: JSON.stringify(arguments[1])
      });
      stream.on('end', () => {
        Kadira.tracer.eventEnd(kadiraInfo.trace, event);
      });
      handleErrorEvent(stream, kadiraInfo.trace, event);
    }
    return stream;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"gc.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/gc.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  default: () => GCMetrics
});
let PerformanceObserver;
let constants;
let performance;
try {
  // Only available in Node 8.5 and newer
  ({
    PerformanceObserver,
    constants,
    performance
    // eslint-disable-next-line global-require
  } = require('perf_hooks'));
} catch (e) {/* empty */}
class GCMetrics {
  constructor() {
    this._observer = null;
    this.started = false;
    this.metrics = {};
    this.reset();
  }
  start() {
    if (this.started) {
      return false;
    }
    if (!PerformanceObserver || !constants) {
      // The node version is too old to have PerformanceObserver
      return false;
    }
    this.started = true;
    this.observer = new PerformanceObserver(list => {
      list.getEntries().forEach(entry => {
        let metric = this._mapKindToMetric(entry.kind);
        this.metrics[metric] += entry.duration;
      });

      // The function was removed in Node 10 since it stopped storing old
      // entries
      if (typeof performance.clearGC === 'function') {
        performance.clearGC();
      }
    });
    this.observer.observe({
      entryTypes: ['gc'],
      buffered: false
    });
  }
  _mapKindToMetric(gcKind) {
    switch (gcKind) {
      case constants.NODE_PERFORMANCE_GC_MAJOR:
        return 'gcMajor';
      case constants.NODE_PERFORMANCE_GC_MINOR:
        return 'gcMinor';
      case constants.NODE_PERFORMANCE_GC_INCREMENTAL:
        return 'gcIncremental';
      case constants.NODE_PERFORMANCE_GC_WEAKCB:
        return 'gcWeakCB';
      default:
        console.log("Monti APM: Unrecognized GC Kind: ".concat(gcKind));
    }
  }
  reset() {
    this.metrics = {
      gcMajor: 0,
      gcMinor: 0,
      gcIncremental: 0,
      gcWeakCB: 0
    };
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo_driver_events.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/mongo_driver_events.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  getMongoDriverStats: () => getMongoDriverStats,
  resetMongoDriverStats: () => resetMongoDriverStats
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let MongoInternals;
module.link("meteor/mongo", {
  MongoInternals(v) {
    MongoInternals = v;
  }
}, 1);
let client;
let serverStatus = Object.create(null);
let otherCheckouts = 0;

// These metrics are only for the mongo pool for the primary Mongo server
let primaryCheckouts = 0;
let totalCheckoutTime = 0;
let maxCheckoutTime = 0;
let created = 0;
let measurementCount = 0;
let pendingTotal = 0;
let checkedOutTotal = 0;
setInterval(() => {
  let status = getServerStatus(getPrimary(), true);
  if (status) {
    pendingTotal += status.pending.length;
    checkedOutTotal += status.checkedOut.size;
    measurementCount += 1;
  }
}, 1000);

// Version 4 of the driver defaults to 100. Older versions used 10.
let DEFAULT_MAX_POOL_SIZE = 100;
function getPoolSize() {
  if (client && client.topology && client.topology.s && client.topology.s.options) {
    return client.topology.s.options.maxPoolSize || DEFAULT_MAX_POOL_SIZE;
  }
  return 0;
}
function getMongoDriverStats() {
  return {
    poolSize: getPoolSize(),
    primaryCheckouts,
    otherCheckouts,
    checkoutTime: totalCheckoutTime,
    maxCheckoutTime,
    pending: pendingTotal ? pendingTotal / measurementCount : 0,
    checkedOut: checkedOutTotal ? checkedOutTotal / measurementCount : 0,
    created
  };
}
function resetMongoDriverStats() {
  primaryCheckouts = 0;
  otherCheckouts = 0;
  totalCheckoutTime = 0;
  maxCheckoutTime = 0;
  pendingTotal = 0;
  checkedOutTotal = 0;
  measurementCount = 0;
  primaryCheckouts = 0;
  created = 0;
}
Meteor.startup(() => {
  let _client = MongoInternals.defaultRemoteCollectionDriver().mongo.client;
  if (!_client || !_client.s) {
    // Old version of agent
    return;
  }
  let options = _client.s.options || {};
  let versionParts = MongoInternals.NpmModules.mongodb.version.split('.').map(part => parseInt(part, 10));

  // Version 4 of the driver removed the option and enabled it by default
  if (!options.useUnifiedTopology && versionParts[0] < 4) {
    // CMAP and topology monitoring requires useUnifiedTopology
    return;
  }

  // Meteor 1.9 enabled useUnifiedTopology, but CMAP events were only added
  // in version 3.5 of the driver.
  if (versionParts[0] === 3 && versionParts[1] < 5) {
    return;
  }
  client = _client;

  // Get the number of connections already created
  let primaryDescription = getServerDescription(getPrimary());
  if (primaryDescription && primaryDescription.s && primaryDescription.s.pool) {
    let pool = primaryDescription.s.pool;
    let totalConnections = pool.totalConnectionCount;
    let availableConnections = pool.availableConnectionCount;

    // totalConnectionCount counts available connections twice
    created += totalConnections - availableConnections;
  }
  client.on('connectionCreated', event => {
    let primary = getPrimary();
    if (primary === event.address) {
      created += 1;
    }
  });
  client.on('connectionClosed', event => {
    let status = getServerStatus(event.address, true);
    if (status) {
      status.checkedOut.delete(event.connectionId);
    }
  });
  client.on('connectionCheckOutStarted', event => {
    let status = getServerStatus(event.address);
    status.pending.push(event.time);
  });
  client.on('connectionCheckOutFailed', event => {
    let status = getServerStatus(event.address, true);
    if (status) {
      status.pending.shift();
    }
  });
  client.on('connectionCheckedOut', event => {
    let status = getServerStatus(event.address);
    let start = status.pending.shift();
    let primary = getPrimary();
    if (start && primary === event.address) {
      let checkoutDuration = event.time.getTime() - start.getTime();
      primaryCheckouts += 1;
      totalCheckoutTime += checkoutDuration;
      if (checkoutDuration > maxCheckoutTime) {
        maxCheckoutTime = checkoutDuration;
      }
    } else {
      otherCheckouts += 1;
    }
    status.checkedOut.add(event.connectionId);
  });
  client.on('connectionCheckedIn', event => {
    let status = getServerStatus(event.address, true);
    if (status) {
      status.checkedOut.delete(event.connectionId);
    }
  });
  client.on('serverClosed', function (event) {
    delete serverStatus[event.address];
  });
});
function getServerStatus(address, disableCreate) {
  if (typeof address !== 'string') {
    return null;
  }
  if (address in serverStatus) {
    return serverStatus[address];
  }
  if (disableCreate) {
    return null;
  }
  serverStatus[address] = {
    pending: [],
    checkedOut: new Set()
  };
  return serverStatus[address];
}
function getPrimary() {
  if (!client || !client.topology) {
    return null;
  }
  // The driver renamed lastIsMaster in version 4.3.1 to lastHello
  let server = client.topology.lastIsMaster ? client.topology.lastIsMaster() : client.topology.lastHello();
  if (server.type === 'Standalone') {
    return server.address;
  }
  if (!server || !server.primary) {
    return null;
  }
  return server.primary;
}
function getServerDescription(address) {
  if (!client || !client.topology || !client.topology.s || !client.topology.s.servers) {
    return null;
  }
  let description = client.topology.s.servers.get(address);
  return description || null;
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"picker.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/picker.js                                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapPicker: () => wrapPicker
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Fiber;
module.link("fibers", {
  default(v) {
    Fiber = v;
  }
}, 1);
function wrapPicker() {
  Meteor.startup(() => {
    if (!Package['meteorhacks:picker']) {
      return;
    }
    const Picker = Package['meteorhacks:picker'].Picker;

    // Wrap Picker._processRoute to make sure it runs the
    // handler in a Fiber with __kadiraInfo set
    // Needed if any previous middleware called `next` outside of a fiber.
    const origProcessRoute = Picker.constructor.prototype._processRoute;
    Picker.constructor.prototype._processRoute = function (callback, params, req) {
      const args = arguments;
      if (!Fiber.current) {
        return new Fiber(() => {
          Kadira._setInfo(req.__kadiraInfo);
          return origProcessRoute.apply(this, args);
        }).run();
      }
      if (req.__kadiraInfo) {
        Kadira._setInfo(req.__kadiraInfo);
      }
      return origProcessRoute.apply(this, args);
    };
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"timeout_manager.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/timeout_manager.js                                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  TimeoutManager: () => TimeoutManager
});
let millisToHuman;
module.link("../common/utils", {
  millisToHuman(v) {
    millisToHuman = v;
  }
}, 0);
const TimeoutManager = {
  id: 0,
  map: new Map(),
  prettyMessage: {
    method: method => "Method \"".concat(method, "\" still running after"),
    sub: sub => "Subscription \"".concat(sub, "\" still not ready after")
  },
  addTimeout(fn, timeout) {
    if (!fn) {
      throw new Error('TimeoutManager.addTimeout: fn is required');
    }
    const id = ++this.id;
    this.map.set(id, setTimeout(Meteor.bindEnvironment(() => {
      fn();
      this.map.delete(id);
    }), timeout));
    return id;
  },
  trackTimeout(_ref) {
    let {
      kadiraInfo,
      msg,
      timeout = Kadira.options.stalledTimeout
    } = _ref;
    if (!timeout) {
      return;
    }
    const type = msg.msg;
    const method = msg.method || msg.name;
    const error = new Error("".concat(this.prettyMessage[type](method) || 'Unknown Timeout', " ").concat(millisToHuman(timeout)));
    kadiraInfo.timeoutId = this.addTimeout(() => {
      Kadira.EventBus.emit('method', 'timeout', kadiraInfo, error);
      Monti.trackError(error, {
        type,
        subType: 'server',
        kadiraInfo
      });
      console.warn("[Monti APM] ".concat(error.message));
    }, timeout);
  },
  clearTimeout() {
    let {
      kadiraInfo = Kadira._getInfo()
    } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    if (!kadiraInfo) return;
    const {
      timeoutId
    } = kadiraInfo;
    if (timeoutId && this.map.has(timeoutId)) {
      clearTimeout(this.map.get(timeoutId));
      this.map.delete(timeoutId);
      delete kadiraInfo.timeoutId;
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wrap_routers.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_routers.js                                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  wrapRouters: () => wrapRouters
});
function wrapRouters() {
  let connectRoutes = [];
  try {
    // eslint-disable-next-line global-require
    connectRoutes.push(require('connect-route'));
  } catch (e) {
    // We can ignore errors
  }
  try {
    if (Package['simple:json-routes']) {
      // Relative from .npm/node_modules/meteor/montiapm_agent/node_modules
      // Npm.require is less strict on what paths you use than require
      connectRoutes.push(Npm.require('../../simple_json-routes/node_modules/connect-route'));
    }
  } catch (e) {
    // we can ignore errors
  }
  connectRoutes.forEach(connectRoute => {
    if (typeof connectRoute !== 'function') {
      return;
    }
    connectRoute(router => {
      const oldAdd = router.constructor.prototype.add;
      router.constructor.prototype.add = function (method, route, handler) {
        // Unlike most routers, connect-route doesn't look at the arguments length
        oldAdd.call(this, method, route, function () {
          if (arguments[0] && arguments[0].__kadiraInfo) {
            arguments[0].__kadiraInfo.suggestedRouteName = route;
          }
          handler(...arguments);
        });
      };
    });
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"wrap_webapp.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/hijack/wrap_webapp.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  checkHandlersInFiber: () => checkHandlersInFiber,
  wrapWebApp: () => wrapWebApp
});
let WebAppInternals, WebApp;
module.link("meteor/webapp", {
  WebAppInternals(v) {
    WebAppInternals = v;
  },
  WebApp(v) {
    WebApp = v;
  }
}, 0);
let Fibers;
module.link("fibers", {
  default(v) {
    Fibers = v;
  }
}, 1);
// Maximum content-length size
const MAX_BODY_SIZE = 8000;
// Maximum characters for stringified body
const MAX_STRINGIFIED_BODY_SIZE = 4000;
const canWrapStaticHandler = !!WebAppInternals.staticFilesByArch;

// This checks if running on a version of Meteor that
// wraps connect handlers in a fiber.
// This check is dependant on Meteor's implementation of `use`,
// which wraps every handler in a new fiber.
// This will need to be updated if Meteor starts reusing
// fibers when they exist.
function checkHandlersInFiber() {
  const handlersLength = WebApp.rawConnectHandlers.stack.length;
  let inFiber = false;
  let outsideFiber = Fibers.current;
  WebApp.rawConnectHandlers.use((_req, _res, next) => {
    inFiber = Fibers.current && Fibers.current !== outsideFiber;

    // in case we didn't successfully remove this handler
    // and it is a real request
    next();
  });
  if (WebApp.rawConnectHandlers.stack[handlersLength]) {
    let handler = WebApp.rawConnectHandlers.stack[handlersLength].handle;

    // remove the newly added handler
    // We remove it immediately so there is no opportunity for
    // other code to add handlers first if the current fiber is yielded
    // while running the handler
    while (WebApp.rawConnectHandlers.stack.length > handlersLength) {
      WebApp.rawConnectHandlers.stack.pop();
    }
    handler({}, {}, () => {});
  }
  return inFiber;
}
const InfoSymbol = Symbol('MontiInfoSymbol');
function wrapWebApp() {
  return Promise.asyncApply(() => {
    if (!checkHandlersInFiber() || !canWrapStaticHandler) {
      return;
    }
    const parseUrl = require('parseurl');
    WebAppInternals.registerBoilerplateDataCallback('__montiApmRouteName', function (request) {
      // TODO: record in trace which arch is used

      if (request[InfoSymbol]) {
        request[InfoSymbol].isAppRoute = true;
      }

      // Let WebApp know we didn't make changes
      // so it can use a cache
      return false;
    });

    // We want the request object returned by categorizeRequest to have
    // __kadiraInfo
    let origCategorizeRequest = WebApp.categorizeRequest;
    WebApp.categorizeRequest = function (req) {
      let result = origCategorizeRequest.apply(this, arguments);
      if (result && req.__kadiraInfo) {
        result[InfoSymbol] = req.__kadiraInfo;
      }
      return result;
    };

    // Adding the handler directly to the stack
    // to force it to be the first one to run
    WebApp.rawConnectHandlers.stack.unshift({
      route: '',
      handle: (req, res, next) => {
        const name = parseUrl(req).pathname;
        const trace = Kadira.tracer.start("".concat(req.method, "-").concat(name), 'http');
        const headers = Kadira.tracer._applyObjectFilters(req.headers);
        Kadira.tracer.event(trace, 'start', {
          url: req.url,
          method: req.method,
          headers: JSON.stringify(headers)
        });
        req.__kadiraInfo = {
          trace
        };
        res.on('finish', () => {
          if (req.__kadiraInfo.asyncEvent) {
            Kadira.tracer.eventEnd(trace, req.__kadiraInfo.asyncEvent);
          }
          Kadira.tracer.endLastEvent(trace);
          if (req.__kadiraInfo.isStatic) {
            trace.name = "".concat(req.method, "-<static file>");
          } else if (req.__kadiraInfo.suggestedRouteName) {
            trace.name = "".concat(req.method, "-").concat(req.__kadiraInfo.suggestedRouteName);
          } else if (req.__kadiraInfo.isAppRoute) {
            trace.name = "".concat(req.method, "-<app>");
          }
          const isJson = req.headers['content-type'] === 'application/json';
          const hasSmallBody = req.headers['content-length'] > 0 && req.headers['content-length'] < MAX_BODY_SIZE;

          // Check after all middleware have run to see if any of them
          // set req.body
          // Technically bodies can be used with any method, but since many load balancers and
          // other software only support bodies for POST requests, we are
          // not recording the body for other methods.
          if (req.method === 'POST' && req.body && isJson && hasSmallBody) {
            try {
              let body = JSON.stringify(req.body);

              // Check the body size again in case it is much
              // larger than what was in the content-length header
              if (body.length < MAX_STRINGIFIED_BODY_SIZE) {
                trace.events[0].data.body = body;
              }
            } catch (e) {
              // It is okay if this fails
            }
          }

          // TODO: record status code
          Kadira.tracer.event(trace, 'complete');
          let built = Kadira.tracer.buildTrace(trace);
          Kadira.models.http.processRequest(built, req, res);
        });
        next();
      }
    });
    function wrapHandler(handler) {
      // connect identifies error handles by them accepting
      // four arguments
      let errorHandler = handler.length === 4;
      function wrapper(req, res, next) {
        let error;
        if (errorHandler) {
          error = req;
          req = res;
          res = next;
          next = arguments[3];
        }
        const kadiraInfo = req.__kadiraInfo;
        Kadira._setInfo(kadiraInfo);
        let nextCalled = false;
        // TODO: track errors passed to next or thrown
        function wrappedNext() {
          if (kadiraInfo && kadiraInfo.asyncEvent) {
            Kadira.tracer.eventEnd(req.__kadiraInfo.trace, req.__kadiraInfo.asyncEvent);
            req.__kadiraInfo.asyncEvent = null;
          }
          nextCalled = true;
          next(...arguments);
        }
        let potentialPromise;
        if (errorHandler) {
          potentialPromise = handler.call(this, error, req, res, wrappedNext);
        } else {
          potentialPromise = handler.call(this, req, res, wrappedNext);
        }
        if (potentialPromise && typeof potentialPromise.then === 'function') {
          potentialPromise.then(() => {
            // res.finished is depreciated in Node 13, but it is the only option
            // for Node 12.9 and older.
            if (kadiraInfo && !res.finished && !nextCalled) {
              const lastEvent = Kadira.tracer.getLastEvent(kadiraInfo.trace);
              if (lastEvent.endAt) {
                // req is not done, and next has not been called
                // create an async event that will end when either of those happens
                kadiraInfo.asyncEvent = Kadira.tracer.event(kadiraInfo.trace, 'async');
              }
            }
          });
        }
        return potentialPromise;
      }
      if (errorHandler) {
        return function (error, req, res, next) {
          return wrapper(error, req, res, next);
        };
      }
      return function (req, res, next) {
        return wrapper(req, res, next);
      };
    }
    function wrapConnect(app, wrapStack) {
      let oldUse = app.use;
      if (wrapStack) {
        // We need to set kadiraInfo on the Fiber the handler will run in.
        // Meteor has already wrapped the handler to run it in a new Fiber
        // by using Promise.asyncApply so we are not able to directly set it
        // on that Fiber.
        // Meteor's promise library copies properties from the current fiber to
        // the new fiber, so we can wrap it in another Fiber with kadiraInfo set
        // and Meteor will copy kadiraInfo to the new Fiber.
        // It will only create the additional Fiber if it isn't already running in a Fiber
        app.stack.forEach(entry => {
          let wrappedHandler = wrapHandler(entry.handle);
          if (entry.handle.length >= 4) {
            // eslint-disable-next-line no-unused-vars,handle-callback-err
            entry.handle = function (error, req, res, next) {
              return Promise.asyncApply(wrappedHandler, this, arguments, true);
            };
          } else {
            // eslint-disable-next-line no-unused-vars
            entry.handle = function (req, res, next) {
              return Promise.asyncApply(wrappedHandler, this, arguments, true);
            };
          }
        });
      }
      app.use = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        args[args.length - 1] = wrapHandler(args[args.length - 1]);
        return oldUse.apply(app, args);
      };
    }
    wrapConnect(WebApp.rawConnectHandlers, false);
    wrapConnect(WebAppInternals.meteorInternalHandlers, false);

    // The oauth package and other core packages might have already added their middleware,
    // so we need to wrap the existing middleware
    wrapConnect(WebApp.connectHandlers, true);
    wrapConnect(WebApp.connectApp, false);
    let oldStaticFilesMiddleware = WebAppInternals.staticFilesMiddleware;
    const staticHandler = wrapHandler(oldStaticFilesMiddleware.bind(WebAppInternals, WebAppInternals.staticFilesByArch));
    WebAppInternals.staticFilesMiddleware = function (_staticFiles, req, res, next) {
      if (req.__kadiraInfo) {
        req.__kadiraInfo.isStatic = true;
      }
      return staticHandler(req, res, function () {
        // if the request is for a static file, the static handler will end the response
        // instead of calling next
        req.__kadiraInfo.isStatic = false;
        return next.apply(this, arguments);
      });
    };
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"environment_variables.js":function module(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/environment_variables.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
function normalizedPrefix(name) {
  return name.replace('KADIRA_', 'MONTI_');
}
Kadira._parseEnv = function (env) {
  let options = {};
  for (let name in env) {
    let value = env[name];
    let normalizedName = normalizedPrefix(name);
    let info = Kadira._parseEnv._options[normalizedName];
    if (info && value) {
      options[info.name] = info.parser(value);
    }
  }
  return options;
};
Kadira._parseEnv.parseInt = function (str) {
  let num = parseInt(str, 10);
  if (num || num === 0) {
    return num;
  }
  throw new Error("Kadira: Match Error: \"".concat(num, "\" is not a number"));
};
Kadira._parseEnv.parseBool = function (str) {
  str = str.toLowerCase();
  if (str === 'true') {
    return true;
  }
  if (str === 'false') {
    return false;
  }
  throw new Error("Kadira: Match Error: ".concat(str, " is not a boolean"));
};
Kadira._parseEnv.parseUrl = function (str) {
  return str;
};
Kadira._parseEnv.parseString = function (str) {
  return str;
};
Kadira._parseEnv._options = {
  // auth
  MONTI_APP_ID: {
    name: 'appId',
    parser: Kadira._parseEnv.parseString
  },
  MONTI_APP_SECRET: {
    name: 'appSecret',
    parser: Kadira._parseEnv.parseString
  },
  MONTI_OPTIONS_STALLED_TIMEOUT: {
    name: 'stalledTimeout',
    parser: Kadira._parseEnv.parseInt
  },
  // delay to send the initial ping to the kadira engine after page loads
  MONTI_OPTIONS_CLIENT_ENGINE_SYNC_DELAY: {
    name: 'clientEngineSyncDelay',
    parser: Kadira._parseEnv.parseInt
  },
  // time between sending errors to the engine
  MONTI_OPTIONS_ERROR_DUMP_INTERVAL: {
    name: 'errorDumpInterval',
    parser: Kadira._parseEnv.parseInt
  },
  // no of errors allowed in a given interval
  MONTI_OPTIONS_MAX_ERRORS_PER_INTERVAL: {
    name: 'maxErrorsPerInterval',
    parser: Kadira._parseEnv.parseInt
  },
  // a zone.js specific option to collect the full stack trace(which is not much useful)
  MONTI_OPTIONS_COLLECT_ALL_STACKS: {
    name: 'collectAllStacks',
    parser: Kadira._parseEnv.parseBool
  },
  // enable error tracking (which is turned on by default)
  MONTI_OPTIONS_ENABLE_ERROR_TRACKING: {
    name: 'enableErrorTracking',
    parser: Kadira._parseEnv.parseBool
  },
  MONTI_OPTIONS_DISABLE_CLIENT_ERROR_TRACKING: {
    name: 'disableClientErrorTracking',
    parser: Kadira._parseEnv.parseBool
  },
  // kadira engine endpoint
  MONTI_OPTIONS_ENDPOINT: {
    name: 'endpoint',
    parser: Kadira._parseEnv.parseUrl
  },
  // define the hostname of the current running process
  MONTI_OPTIONS_HOSTNAME: {
    name: 'hostname',
    parser: Kadira._parseEnv.parseString
  },
  // interval between sending data to the kadira engine from the server
  MONTI_OPTIONS_PAYLOAD_TIMEOUT: {
    name: 'payloadTimeout',
    parser: Kadira._parseEnv.parseInt
  },
  // set HTTP/HTTPS proxy
  MONTI_OPTIONS_PROXY: {
    name: 'proxy',
    parser: Kadira._parseEnv.parseUrl
  },
  // number of items cached for tracking document size
  MONTI_OPTIONS_DOCUMENT_SIZE_CACHE_SIZE: {
    name: 'documentSizeCacheSize',
    parser: Kadira._parseEnv.parseInt
  },
  // enable uploading sourcemaps
  MONTI_UPLOAD_SOURCE_MAPS: {
    name: 'uploadSourceMaps',
    parser: Kadira._parseEnv.parseBool
  },
  MONTI_RECORD_IP_ADDRESS: {
    name: 'recordIPAddress',
    parser: Kadira._parseEnv.parseString
  },
  MONTI_EVENT_STACK_TRACE: {
    name: 'eventStackTrace',
    parser: Kadira._parseEnv.parseBool
  },
  MONTI_OPTIONS_DISABLE_NTP: {
    name: 'disableNtp',
    parser: Kadira._parseEnv.parseBool
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"auto_connect.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/auto_connect.js                                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
Kadira._connectWithEnv = function () {
  const options = Kadira._parseEnv(process.env);
  if (options.appId && options.appSecret) {
    Kadira.connect(options.appId, options.appSecret, options);
    Kadira.connect = function () {
      throw new Error('Kadira has been already connected using credentials from Environment Variables');
    };
  }
};
Kadira._connectWithSettings = function () {
  const montiSettings = Meteor.settings.monti || Meteor.settings.kadira;
  if (montiSettings && montiSettings.appId && montiSettings.appSecret) {
    Kadira.connect(montiSettings.appId, montiSettings.appSecret, montiSettings.options || {});
    Kadira.connect = function () {
      throw new Error('Kadira has been already connected using credentials from Meteor.settings');
    };
  }
};

/**
 * We need to instrument this right away, and it's okay
 * One reason for this is to call `setLabels()` function
 * Otherwise, CPU profile can't see all our custom labeling
 *
 * Previously there was two log messages (one for instrumentation,
 * and another for connection), this way we merged both of them.
 */
Kadira._startInstrumenting(function () {
  Kadira._connectWithEnv();
  Kadira._connectWithSettings();
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"conflicting_agents.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/conflicting_agents.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
const conflictingPackages = ['mdg:meteor-apm-agent', 'lmachens:kadira', 'meteorhacks:kadira'];
Meteor.startup(() => {
  conflictingPackages.forEach(name => {
    if (name in Package) {
      console.log("Monti APM: your app is using the ".concat(name, " package. Using more than one APM agent in an app can cause unexpected problems."));
    }
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},".meteor-package-versions":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/.meteor-package-versions                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {"accounts-base":"2.2.10","accounts-password":"2.4.0","alanning:roles":"3.6.2","aldeed:collection2":"3.5.0","aldeed:schema-index":"3.1.0","allow-deny":"1.1.1","autoupdate":"1.8.0","babel-compiler":"7.10.5","babel-runtime":"1.5.1","base64":"1.0.12","binary-heap":"1.0.11","blaze-tools":"1.1.4","boilerplate-generator":"1.7.2","caching-compiler":"1.2.2","caching-html-compiler":"1.2.2","callback-hook":"1.5.1","check":"1.3.2","ddp":"1.4.1","ddp-client":"2.6.1","ddp-common":"1.4.0","ddp-rate-limiter":"1.2.1","ddp-server":"2.7.0","dev-error-overlay":"0.1.2","diff-sequence":"1.1.2","dynamic-import":"0.7.3","ecmascript":"0.16.8","ecmascript-runtime":"0.8.1","ecmascript-runtime-client":"0.12.1","ecmascript-runtime-server":"0.11.0","ejson":"1.1.3","email":"2.2.5","es5-shim":"4.8.0","fetch":"0.1.4","geojson-utils":"1.0.11","hot-code-push":"1.0.4","hot-module-replacement":"0.5.3","html-tools":"1.1.4","htmljs":"1.2.0","id-map":"1.1.1","insecure":"1.0.7","inter-process-messaging":"0.1.1","launch-screen":"2.0.0","localstorage":"1.2.0","logging":"1.3.3","meteor":"1.11.5","meteor-base":"1.5.1","minifier-css":"1.6.4","minifier-js":"2.7.5","minimongo":"1.9.3","mobile-experience":"1.1.1","mobile-status-bar":"1.1.0","modern-browsers":"0.1.10","modules":"0.20.0","modules-runtime":"0.13.1","modules-runtime-hot":"0.14.2","mongo":"1.16.8","mongo-decimal":"0.1.3","mongo-dev-server":"1.1.0","mongo-id":"1.0.8","montiapm:agent":"2.47.4","montiapm:meteorx":"2.3.1","npm-mongo":"4.17.2","ordered-dict":"1.1.0","promise":"0.12.2","raix:eventemitter":"1.0.0","random":"1.2.1","rate-limit":"1.1.1","react-fast-refresh":"0.2.8","react-meteor-data":"2.7.2","reactive-var":"1.0.12","reload":"1.3.1","retry":"1.1.0","routepolicy":"1.1.1","sha":"1.0.9","shell-server":"0.5.0","socket-stream-client":"0.5.2","spacebars-compiler":"1.3.2","standard-minifier-css":"1.9.2","standard-minifier-js":"2.8.1","static-html":"1.3.2","templating-tools":"1.2.3","tmeasday:check-npm-versions":"1.0.2","tracker":"1.3.3","typescript":"4.9.5","underscore":"1.6.1","url":"1.3.2","webapp":"1.13.8","webapp-hashing":"1.1.1","zodern:hide-production-sourcemaps":"1.2.0","zodern:meteor-package-versions":"0.2.2","zodern:types":"1.0.11"}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"event_loop_monitor.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/montiapm_agent/lib/event_loop_monitor.js                                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.export({
  EventLoopMonitor: () => EventLoopMonitor
});
let EventEmitter;
module.link("events", {
  EventEmitter(v) {
    EventEmitter = v;
  }
}, 0);
function isNode() {
  return typeof process !== 'undefined' && process.versions && process.versions.node;
}
function polyfillNow() {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + nanoseconds / 1000000;
}
class EventLoopMonitor extends EventEmitter {
  constructor(timeoutMillis) {
    super();
    this.timeoutMillis = timeoutMillis;
    this._watchLag = this._watchLag.bind(this);
    this._stopped = true;
    this._startTime = null;
    this._totalLag = 0;
    this._registerNowFunc();
  }
  start() {
    this._stopped = false;
    this._lastWatchTime = null;
    this._startTime = Date.now();
    this._totalLag = 0;
    this.on('lag', this._watchLag);
    this._detectLag();
  }
  stop() {
    this._stopped = true;
    this.removeAllListeners('lag');
  }
  status() {
    let pctBlock = 0;
    let elapsedTime = 0;
    if (!this._stopped && this._lastWatchTime) {
      elapsedTime = this._lastWatchTime - this._startTime;
      pctBlock = this._totalLag / elapsedTime * 100;
    }
    let statusObject = {
      pctBlock,
      elapsedTime,
      totalLag: this._totalLag
    };
    this._startTime = this._lastWatchTime;
    this._totalLag = 0;
    return statusObject;
  }
  _watchLag(lag) {
    this._lastWatchTime = Date.now();
    this._totalLag += lag;
  }
  _detectLag() {
    let self = this;
    let start = self._now();
    setTimeout(function () {
      let end = self._now();
      let elapsedTime = end - start;
      let realDiff = elapsedTime - self.timeoutMillis;
      let lag = Math.max(0, realDiff);
      if (!self._stopped) {
        self.emit('lag', lag);
        self._detectLag();
      }
    }, self.timeoutMillis);
  }
  _registerNowFunc() {
    if (isNode()) {
      const [major] = process.versions.node.split('.').map(Number);
      if (major < 8) {
        this._now = polyfillNow;
        return;
      }
      const {
        performance
        // eslint-disable-next-line global-require
      } = require('perf_hooks');
      this._now = performance.now;
      return;
    }
    if (typeof window !== 'undefined' && window.performance && window.performance.now) {
      this._now = window.performance.now;
      return;
    }
    this._now = Date.now;
  }
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"monti-apm-sketches-js":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/montiapm_agent/node_modules/monti-apm-sketches-js/package.json                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "monti-apm-sketches-js",
  "version": "0.0.3",
  "main": "index.js"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/montiapm_agent/node_modules/monti-apm-sketches-js/index.js                                      //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"parseurl":{"package.json":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/montiapm_agent/node_modules/parseurl/package.json                                               //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.exports = {
  "name": "parseurl",
  "version": "1.3.3"
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"index.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// node_modules/meteor/montiapm_agent/node_modules/parseurl/index.js                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
module.useNode();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".d.ts"
  ]
});

require("/node_modules/meteor/montiapm:agent/lib/common/utils.js");
require("/node_modules/meteor/montiapm:agent/lib/common/unify.js");
require("/node_modules/meteor/montiapm:agent/lib/models/base_error.js");
require("/node_modules/meteor/montiapm:agent/lib/jobs.js");
require("/node_modules/meteor/montiapm:agent/lib/retry.js");
require("/node_modules/meteor/montiapm:agent/lib/utils.js");
require("/node_modules/meteor/montiapm:agent/lib/ntp.js");
require("/node_modules/meteor/montiapm:agent/lib/sourcemaps.js");
require("/node_modules/meteor/montiapm:agent/lib/wait_time_builder.js");
require("/node_modules/meteor/montiapm:agent/lib/check_for_oplog.js");
require("/node_modules/meteor/montiapm:agent/lib/tracer/tracer.js");
require("/node_modules/meteor/montiapm:agent/lib/tracer/default_filters.js");
require("/node_modules/meteor/montiapm:agent/lib/tracer/tracer_store.js");
require("/node_modules/meteor/montiapm:agent/lib/models/0model.js");
require("/node_modules/meteor/montiapm:agent/lib/models/methods.js");
require("/node_modules/meteor/montiapm:agent/lib/models/pubsub.js");
require("/node_modules/meteor/montiapm:agent/lib/models/system.js");
require("/node_modules/meteor/montiapm:agent/lib/models/errors.js");
require("/node_modules/meteor/montiapm:agent/lib/docsize_cache.js");
require("/node_modules/meteor/montiapm:agent/lib/kadira.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/wrap_server.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/wrap_session.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/wrap_subscription.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/wrap_observers.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/wrap_ddp_stringify.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/instrument.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/db.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/http.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/email.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/async.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/error.js");
require("/node_modules/meteor/montiapm:agent/lib/hijack/set_labels.js");
require("/node_modules/meteor/montiapm:agent/lib/environment_variables.js");
require("/node_modules/meteor/montiapm:agent/lib/auto_connect.js");
require("/node_modules/meteor/montiapm:agent/lib/conflicting_agents.js");
require("/node_modules/meteor/montiapm:agent/lib/common/default_error_filters.js");
require("/node_modules/meteor/montiapm:agent/lib/common/send.js");

/* Exports */
Package._define("montiapm:agent", {
  Kadira: Kadira,
  Monti: Monti
});

})();

//# sourceURL=meteor://💻app/packages/montiapm_agent.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2NvbW1vbi91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2NvbW1vbi91bmlmeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2NvbW1vbi9kZWZhdWx0X2Vycm9yX2ZpbHRlcnMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9jb21tb24vc2VuZC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL21vZGVscy9iYXNlX2Vycm9yLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvbW9kZWxzLzBtb2RlbC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL21vZGVscy9tZXRob2RzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvbW9kZWxzL3B1YnN1Yi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL21vZGVscy9zeXN0ZW0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9tb2RlbHMvZXJyb3JzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvbW9kZWxzL2h0dHAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9qb2JzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvcmV0cnkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi91dGlscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL250cC5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL3NvdXJjZW1hcHMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi93YWl0X3RpbWVfYnVpbGRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2NoZWNrX2Zvcl9vcGxvZy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL3RyYWNlci90cmFjZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi90cmFjZXIvZGVmYXVsdF9maWx0ZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvdHJhY2VyL3RyYWNlcl9zdG9yZS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2RvY3NpemVfY2FjaGUuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9rYWRpcmEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svd3JhcF9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svd3JhcF9zZXNzaW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL3dyYXBfc3Vic2NyaXB0aW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL3dyYXBfb2JzZXJ2ZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL3dyYXBfZGRwX3N0cmluZ2lmeS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2hpamFjay9pbnN0cnVtZW50LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL2RiLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL2h0dHAuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svZW1haWwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svYXN5bmMuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svZXJyb3IuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svc2V0X2xhYmVscy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2hpamFjay9mYXN0X3JlbmRlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2hpamFjay9mcy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2hpamFjay9nYy5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2hpamFjay9tb25nb19kcml2ZXJfZXZlbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL3BpY2tlci5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06YWdlbnQvbGliL2hpamFjay90aW1lb3V0X21hbmFnZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOmFnZW50L2xpYi9oaWphY2svd3JhcF9yb3V0ZXJzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvaGlqYWNrL3dyYXBfd2ViYXBwLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvZW52aXJvbm1lbnRfdmFyaWFibGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvYXV0b19jb25uZWN0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvY29uZmxpY3RpbmdfYWdlbnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTphZ2VudC9saWIvZXZlbnRfbG9vcF9tb25pdG9yLmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydCIsImdldENsaWVudEFyY2hWZXJzaW9uIiwiZ2V0RXJyb3JQYXJhbWV0ZXJzIiwib2JqZWN0SGFzRGF0YSIsIm1pbGxpc1RvSHVtYW4iLCJNZXRlb3IiLCJsaW5rIiwidiIsImFyY2giLCJhdXRvdXBkYXRlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsInZlcnNpb25zIiwidmVyc2lvbiIsImF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSIsImF1dG91cGRhdGVWZXJzaW9uIiwiY3JlYXRlU3RhY2tUcmFjZSIsIkVycm9yIiwiY2FwdHVyZVN0YWNrVHJhY2UiLCJlcnIiLCJLYWRpcmEiLCJ0cmFja0Vycm9yIiwic3RhY2siLCJzcGxpdCIsInRvUmVtb3ZlIiwibGVuZ3RoIiwiaW5kZXhPZiIsImpvaW4iLCJzbGljZSIsImFyZ3MiLCJ0eXBlIiwibWVzc2FnZSIsInN1YlR5cGUiLCJrYWRpcmFJbmZvIiwib3B0aW9ucyIsImlzQ2xpZW50Iiwic3RhY2tzIiwiZXJyb3IiLCJpc0Vycm9yT2JqZWN0Iiwib2JqIiwiT2JqZWN0IiwidmFsdWVzIiwic29tZSIsInZhbCIsInVuZGVmaW5lZCIsImluY2x1ZGVzIiwibWlsbGlzZWNvbmRzIiwibWlsbGlzIiwic2Vjb25kcyIsIk1hdGgiLCJmbG9vciIsIm1pbnV0ZXMiLCJob3VycyIsImRheXMiLCJidWlsZGVyIiwicHVzaCIsImNvbmNhdCIsIk1vbnRpIiwid3JhcEFzeW5jIiwiX3dyYXBBc3luYyIsImlzU2VydmVyIiwiRXZlbnRFbWl0dGVyIiwiTnBtIiwicmVxdWlyZSIsImV2ZW50QnVzIiwic2V0TWF4TGlzdGVuZXJzIiwiYnVpbGRBcmdzIiwiZXZlbnROYW1lIiwidW5zaGlmdCIsIkV2ZW50QnVzIiwiZm9yRWFjaCIsIm0iLCJfbGVuIiwiYXJndW1lbnRzIiwiQXJyYXkiLCJfa2V5IiwiX2FyZ3MiLCJjb21tb25FcnJSZWdFeHBzIiwiZXJyb3JGaWx0ZXJzIiwiZmlsdGVyVmFsaWRhdGlvbkVycm9ycyIsImZpbHRlckNvbW1vbk1ldGVvckVycm9ycyIsImxjIiwicmVnRXhwIiwidGVzdCIsIlJldHJ5Iiwic2VuZCIsInBheWxvYWQiLCJwYXRoIiwiY2FsbGJhY2siLCJjb25uZWN0ZWQiLCJzdWJzdHIiLCJlbmRwb2ludCIsInJldHJ5Q291bnQiLCJyZXRyeSIsIm1pbkNvdW50IiwibWluVGltZW91dCIsImJhc2VUaW1lb3V0IiwibWF4VGltZW91dCIsInNlbmRGdW5jdGlvbiIsIl9nZXRTZW5kRnVuY3Rpb24iLCJ0cnlUb1NlbmQiLCJyZXRyeUxhdGVyIiwiY29uc29sZSIsIndhcm4iLCJyZXMiLCJzdGF0dXNDb2RlIiwiZGF0YSIsImNvbnRlbnQiLCJfc2VydmVyU2VuZCIsIl9jbGllbnRTZW5kIiwiX21ha2VIdHRwUmVxdWVzdCIsImhlYWRlcnMiLCJKU09OIiwic3RyaW5naWZ5IiwiQmFzZUVycm9yTW9kZWwiLCJfZmlsdGVycyIsInByb3RvdHlwZSIsImFkZEZpbHRlciIsImZpbHRlciIsInJlbW92ZUZpbHRlciIsImluZGV4Iiwic3BsaWNlIiwiYXBwbHlGaWx0ZXJzIiwidmFsaWRhdGVkIiwiZXgiLCJLYWRpcmFNb2RlbCIsIl9nZXREYXRlSWQiLCJ0aW1lc3RhbXAiLCJyZW1haW5kZXIiLCJkYXRlSWQiLCJNZXRob2RzTW9kZWwiLCJfIiwiVHJhY2VyU3RvcmUiLCJOdHAiLCJERFNrZXRjaCIsIk1FVEhPRF9NRVRSSUNTX0ZJRUxEUyIsIm1ldHJpY3NUaHJlc2hvbGQiLCJtZXRob2RNZXRyaWNzQnlNaW51dGUiLCJjcmVhdGUiLCJlcnJvck1hcCIsIl9tZXRyaWNzVGhyZXNob2xkIiwiZXh0ZW5kIiwid2FpdCIsImRiIiwiaHR0cCIsImVtYWlsIiwiYXN5bmMiLCJjb21wdXRlIiwidG90YWwiLCJtYXhFdmVudFRpbWVzRm9yTWV0aG9kcyIsInRyYWNlclN0b3JlIiwiaW50ZXJ2YWwiLCJtYXhUb3RhbFBvaW50cyIsImFyY2hpdmVFdmVyeSIsInN0YXJ0IiwiX2dldE1ldHJpY3MiLCJtZXRob2QiLCJtZXRob2RzIiwiY291bnQiLCJlcnJvcnMiLCJmZXRjaGVkRG9jU2l6ZSIsInNlbnRNc2dTaXplIiwiaGlzdG9ncmFtIiwiYWxwaGEiLCJmaWVsZCIsInByb2Nlc3NNZXRob2QiLCJtZXRob2RUcmFjZSIsImF0IiwiX2FwcGVuZE1ldHJpY3MiLCJlcnJvcmVkIiwibmFtZSIsImFkZFRyYWNlIiwiaWQiLCJtZXRob2RNZXRyaWNzIiwic3RhcnRUaW1lIiwidmFsdWUiLCJtZXRyaWNzIiwiYWRkIiwiZW5kVGltZSIsInRyYWNrRG9jU2l6ZSIsInNpemUiLCJfbm93IiwidHJhY2tNc2dTaXplIiwiYnVpbGRQYXlsb2FkIiwibWV0aG9kUmVxdWVzdHMiLCJrZXkiLCJzeW5jZWREYXRlIiwic3luY1RpbWUiLCJtZXRob2ROYW1lIiwiY29sbGVjdFRyYWNlcyIsIlB1YnN1Yk1vZGVsIiwiY291bnRLZXlzIiwiZ2V0UHJvcGVydHkiLCJpdGVyYXRlIiwibG9nZ2VyIiwibWV0cmljc0J5TWludXRlIiwic3Vic2NyaXB0aW9ucyIsIl90cmFja1N1YiIsInNlc3Npb24iLCJtc2ciLCJwYXJhbXMiLCJwdWJsaWNhdGlvbiIsIl9nZXRQdWJsaWNhdGlvbk5hbWUiLCJzdWJzIiwiX3N0YXJ0VGltZSIsIl90cmFja1Vuc3ViIiwic3ViIiwiX3N1YnNjcmlwdGlvbklkIiwiX25hbWUiLCJzdWJzY3JpcHRpb25JZCIsInN1YnNjcmlwdGlvblN0YXRlIiwidW5zdWJzIiwibGlmZVRpbWUiLCJfdHJhY2tSZWFkeSIsInRyYWNlIiwicmVhZHlUcmFja2VkIiwicmVzVGltZSIsIl90cmFja0Vycm9yIiwicHVicyIsImFjdGl2ZVN1YnMiLCJhY3RpdmVEb2NzIiwidG90YWxPYnNlcnZlcnMiLCJjYWNoZWRPYnNlcnZlcnMiLCJjcmVhdGVkT2JzZXJ2ZXJzIiwiZGVsZXRlZE9ic2VydmVycyIsIm9ic2VydmVyTGlmZXRpbWUiLCJwb2xsZWREb2N1bWVudHMiLCJvcGxvZ1VwZGF0ZWREb2N1bWVudHMiLCJvcGxvZ0luc2VydGVkRG9jdW1lbnRzIiwib3Bsb2dEZWxldGVkRG9jdW1lbnRzIiwiaW5pdGlhbGx5QWRkZWREb2N1bWVudHMiLCJsaXZlQWRkZWREb2N1bWVudHMiLCJsaXZlQ2hhbmdlZERvY3VtZW50cyIsImxpdmVSZW1vdmVkRG9jdW1lbnRzIiwicG9sbGVkRG9jU2l6ZSIsImluaXRpYWxseUZldGNoZWREb2NTaXplIiwibGl2ZUZldGNoZWREb2NTaXplIiwiaW5pdGlhbGx5U2VudE1zZ1NpemUiLCJsaXZlU2VudE1zZ1NpemUiLCJfZ2V0U3Vic2NyaXB0aW9uSW5mbyIsInNlbGYiLCJzZXJ2ZXIiLCJzZXNzaW9ucyIsIl9uYW1lZFN1YnMiLCJjb3VudFN1YkRhdGEiLCJfdW5pdmVyc2FsU3VicyIsImF2Z09ic2VydmVyUmV1c2UiLCJlYWNoIiwiY291bnRTdWJzY3JpcHRpb25zIiwiY291bnREb2N1bWVudHMiLCJjb3VudE9ic2VydmVycyIsIl9kb2N1bWVudHMiLCJjb2xsZWN0aW9uIiwiX3RvdGFsT2JzZXJ2ZXJzIiwiX2NhY2hlZE9ic2VydmVycyIsInB1Yk1ldHJpY3MiLCJzdWJzY3JpcHRpb25EYXRhIiwiZGF0ZU1ldHJpY3MiLCJzaW5nbGVQdWJNZXRyaWNzIiwicHViUmVxdWVzdHMiLCJpbmNyZW1lbnRIYW5kbGVDb3VudCIsImlzQ2FjaGVkIiwicHVibGljYXRpb25OYW1lIiwidHJhY2tDcmVhdGVkT2JzZXJ2ZXIiLCJpbmZvIiwidHJhY2tEZWxldGVkT2JzZXJ2ZXIiLCJEYXRlIiwiZ2V0VGltZSIsInRyYWNrRG9jdW1lbnRDaGFuZ2VzIiwib3AiLCJ0cmFja1BvbGxlZERvY3VtZW50cyIsInRyYWNrTGl2ZVVwZGF0ZXMiLCJTeXN0ZW1Nb2RlbCIsImNyZWF0ZUhpc3RvZ3JhbSIsIkdDTWV0cmljcyIsImRlZmF1bHQiLCJnZXRGaWJlck1ldHJpY3MiLCJyZXNldEZpYmVyTWV0cmljcyIsImdldE1vbmdvRHJpdmVyU3RhdHMiLCJyZXNldE1vbmdvRHJpdmVyU3RhdHMiLCJFdmVudExvb3BNb25pdG9yIiwibmV3U2Vzc2lvbnMiLCJzZXNzaW9uVGltZW91dCIsImV2bG9vcEhpc3RvZ3JhbSIsImV2bG9vcE1vbml0b3IiLCJvbiIsImxhZyIsImdjTWV0cmljcyIsImNwdVRpbWUiLCJwcm9jZXNzIiwiaHJ0aW1lIiwicHJldmlvdXNDcHVVc2FnZSIsImNwdVVzYWdlIiwiY3B1SGlzdG9yeSIsImN1cnJlbnRDcHVVc2FnZSIsInNldEludGVydmFsIiwibm93IiwibWVtb3J5VXNhZ2UiLCJtZW1vcnkiLCJyc3MiLCJtZW1vcnlBcnJheUJ1ZmZlcnMiLCJhcnJheUJ1ZmZlcnMiLCJtZW1vcnlFeHRlcm5hbCIsImV4dGVybmFsIiwibWVtb3J5SGVhcFVzZWQiLCJoZWFwVXNlZCIsIm1lbW9yeUhlYXBUb3RhbCIsImhlYXBUb3RhbCIsImFjdGl2ZVJlcXVlc3RzIiwiX2dldEFjdGl2ZVJlcXVlc3RzIiwiYWN0aXZlSGFuZGxlcyIsIl9nZXRBY3RpdmVIYW5kbGVzIiwicGN0RXZsb29wQmxvY2siLCJzdGF0dXMiLCJwY3RCbG9jayIsImdjTWFqb3JEdXJhdGlvbiIsImdjTWFqb3IiLCJnY01pbm9yRHVyYXRpb24iLCJnY01pbm9yIiwiZ2NJbmNyZW1lbnRhbER1cmF0aW9uIiwiZ2NJbmNyZW1lbnRhbCIsImdjV2Vha0NCRHVyYXRpb24iLCJnY1dlYWtDQiIsInJlc2V0IiwiZHJpdmVyTWV0cmljcyIsIm1vbmdvUG9vbFNpemUiLCJwb29sU2l6ZSIsIm1vbmdvUG9vbFByaW1hcnlDaGVja291dHMiLCJwcmltYXJ5Q2hlY2tvdXRzIiwibW9uZ29Qb29sT3RoZXJDaGVja291dHMiLCJvdGhlckNoZWNrb3V0cyIsIm1vbmdvUG9vbENoZWNrb3V0VGltZSIsImNoZWNrb3V0VGltZSIsIm1vbmdvUG9vbE1heENoZWNrb3V0VGltZSIsIm1heENoZWNrb3V0VGltZSIsIm1vbmdvUG9vbFBlbmRpbmciLCJwZW5kaW5nIiwibW9uZ29Qb29sQ2hlY2tlZE91dENvbm5lY3Rpb25zIiwiY2hlY2tlZE91dCIsIm1vbmdvUG9vbENyZWF0ZWRDb25uZWN0aW9ucyIsImNyZWF0ZWQiLCJmaWJlck1ldHJpY3MiLCJjcmVhdGVkRmliZXJzIiwiYWN0aXZlRmliZXJzIiwiYWN0aXZlIiwiZmliZXJQb29sU2l6ZSIsInBjcHUiLCJwY3B1VXNlciIsInBjcHVTeXN0ZW0iLCJsYXN0Q3B1VXNhZ2UiLCJ1c2FnZSIsInVzZXIiLCJzeXMiLCJtYXAiLCJlbnRyeSIsInRpbWUiLCJzeXN0ZW1NZXRyaWNzIiwiaHJ0aW1lVG9NUyIsImVsYXBUaW1lTVMiLCJlbGFwVXNhZ2UiLCJlbGFwVXNlck1TIiwiZWxhcFN5c3RNUyIsInN5c3RlbSIsInRvdGFsVXNhZ2VNUyIsInRvdGFsVXNhZ2VQZXJjZW50IiwiZG9jU3pDYWNoZSIsInNldFBjcHUiLCJoYW5kbGVTZXNzaW9uQWN0aXZpdHkiLCJjb3VudE5ld1Nlc3Npb24iLCJpc1Nlc3Npb25BY3RpdmUiLCJfYWN0aXZlQXQiLCJpc0xvY2FsQWRkcmVzcyIsInNvY2tldCIsImluYWN0aXZlVGltZSIsImlzTG9jYWxIb3N0UmVnZXgiLCJpc0xvY2FsQWRkcmVzc1JlZ2V4IiwiaG9zdCIsImFkZHJlc3MiLCJyZW1vdGVBZGRyZXNzIiwiRXJyb3JNb2RlbCIsImFwcElkIiwiY2FsbCIsIm1heEVycm9ycyIsImFzc2lnbiIsIm1ldHJpYyIsImVycm9yQ291bnQiLCJlcnJvckRlZiIsIl9mb3JtYXRFcnJvciIsImRldGFpbHMiLCJlcnJvckV2ZW50IiwiZXZlbnRzIiwiZXJyb3JPYmplY3QiLCJIdHRwTW9kZWwiLCJwcm9jZXNzUmVxdWVzdCIsInJlcSIsInJvdXRlSWQiLCJyb3V0ZXMiLCJzdGF0dXNDb2RlcyIsInJlcXVlc3RNZXRyaWNzIiwic3RhdHVzTWV0cmljIiwiaHR0cE1ldHJpY3MiLCJodHRwUmVxdWVzdHMiLCJyZXF1ZXN0TmFtZSIsIkpvYnMiLCJnZXRBc3luYyIsImNvcmVBcGkiLCJnZXRKb2IiLCJ0aGVuIiwiY2F0Y2giLCJzZXRBc3luYyIsImNoYW5nZXMiLCJ1cGRhdGVKb2IiLCJzZXQiLCJnZXQiLCJSYW5kb20iLCJjb25zdHJ1Y3RvciIsImV4cG9uZW50IiwiZnV6eiIsInJldHJ5VGltZXIiLCJjbGVhciIsImNsZWFyVGltZW91dCIsIl90aW1lb3V0IiwidGltZW91dCIsIm1pbiIsInBvdyIsImZyYWN0aW9uIiwiY2VpbCIsImZuIiwic2V0VGltZW91dCIsImhhdmVBc3luY0NhbGxiYWNrIiwiVW5pcXVlSWQiLCJEZWZhdWx0VW5pcXVlSWQiLCJDcmVhdGVVc2VyU3RhY2siLCJPcHRpbWl6ZWRBcHBseSIsImdldENsaWVudFZlcnNpb25zIiwicGljayIsImxhc3RBcmciLCJjb250ZXh0IiwiYSIsImFwcGx5IiwiTWFwIiwiU2V0Iiwia2V5cyIsInJlZHVjZSIsInJlc3VsdCIsImdldExvZ2dlciIsImRpc2FibGVOdHAiLCJpc0Rpc2FibGVkIiwic2V0RW5kcG9pbnQiLCJkaWZmIiwic3luY2VkIiwicmVTeW5jQ291bnQiLCJyZVN5bmMiLCJyb3VuZCIsImxvY2FsVGltZSIsInN5bmMiLCJjYWNoZURucyIsImdldFNlcnZlclRpbWUiLCJjYWxjdWxhdGVUaW1lRGlmZiIsImNsaWVudFN0YXJ0VGltZSIsInNlcnZlclRpbWUiLCJuZXR3b3JrVGltZSIsInNlcnZlclN0YXJ0VGltZSIsIm5vUmV0cmllcyIsInBhcnNlSW50IiwicmFuZG9tIiwiY2FuTG9nIiwiZ2xvYmFsIiwibG9jYWxTdG9yYWdlIiwiZ2V0SXRlbSIsImUiLCJsb2ciLCJoYW5kbGVBcGlSZXNwb25zZSIsIldlYkFwcCIsImZzIiwiY2xpZW50UGF0aHMiLCJfX21ldGVvcl9ib290c3RyYXBfXyIsImNvbmZpZ0pzb24iLCJjbGllbnRBcmNocyIsInNlcnZlckRpciIsImFic0NsaWVudFBhdGhzIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJib2R5IiwidW5hdmFpbGFibGUiLCJwYXJzZSIsIm5lZWRlZFNvdXJjZW1hcHMiLCJwcm9taXNlcyIsInNvdXJjZW1hcCIsInVwbG9hZFNvdXJjZU1hcHMiLCJnZXRTb3VyY2VtYXBQYXRoIiwiZmlsZSIsInNvdXJjZU1hcFBhdGgiLCJzZW5kU291cmNlbWFwIiwiUHJvbWlzZSIsImFsbCIsInNlbmREYXRhIiwidW5hdmFpbGFibGVTb3VyY2VtYXBzIiwiX2JvZHkiLCJzb3VyY2VtYXBQYXRoIiwic3RyZWFtIiwiY3JlYXRlUmVhZFN0cmVhbSIsImFyY2hWZXJzaW9uIiwiZW5jb2RlVVJJQ29tcG9uZW50Iiwic2VuZFN0cmVhbSIsInByZXBhcmVQYXRoIiwidXJsUGF0aCIsInBvc2l4Iiwibm9ybWFsaXplIiwiY2hlY2tGb3JEeW5hbWljSW1wb3J0IiwiZmlsZVBhdGgiLCJhcmNoUGF0aCIsImR5bmFtaWNQYXRoIiwic3RhdCIsInJlamVjdCIsImNsaWVudFByb2dyYW0iLCJjbGllbnRQcm9ncmFtcyIsIm1hbmlmZXN0IiwiZmlsZUluZm8iLCJmaW5kIiwidXJsIiwic3RhcnRzV2l0aCIsInNvdXJjZU1hcCIsIldhaXRUaW1lQnVpbGRlciIsIlRpbWVvdXRNYW5hZ2VyIiwiV0FJVE9OX01FU1NBR0VfRklFTERTIiwiX3dhaXRMaXN0U3RvcmUiLCJfY3VycmVudFByb2Nlc3NpbmdNZXNzYWdlcyIsIl9tZXNzYWdlQ2FjaGUiLCJyZWdpc3RlciIsIm1zZ0lkIiwibWFpbktleSIsIl9nZXRNZXNzYWdlS2V5IiwiaW5RdWV1ZSIsInRvQXJyYXkiLCJ3YWl0TGlzdCIsIl9nZXRDYWNoZU1lc3NhZ2UiLCJjdXJyZW50bHlQcm9jZXNzaW5nTWVzc2FnZSIsImJ1aWxkIiwiZmlsdGVyZWRXYWl0TGlzdCIsIl9jbGVhbkNhY2hlTWVzc2FnZSIsImJpbmQiLCJzZXNzaW9uSWQiLCJjYWNoZWRNZXNzYWdlIiwiX3JlZ2lzdGVyZWQiLCJ0cmFja1dhaXRUaW1lIiwidW5ibG9jayIsInN0YXJ0ZWQiLCJ1bmJsb2NrZWQiLCJ3cmFwcGVkVW5ibG9jayIsIndhaXRUaW1lIiwiT3Bsb2dDaGVjayIsIlRyYWNrZXIiLCJlbnYiLCJNT05HT19PUExPR19VUkwiLCJjb2RlIiwicmVhc29uIiwic29sdXRpb24iLCJkaXNhYmxlT3Bsb2ciLCJjdXJzb3JEZXNjcmlwdGlvbiIsIl9kaXNhYmxlT3Bsb2ciLCJtaW5pTW9uZ29NYXRjaGVyIiwiTWluaW1vbmdvIiwiTWF0Y2hlciIsInNlbGVjdG9yIiwibWluaU1vbmdvU29ydGVyIiwibWF0Y2hlciIsIlNvcnRlciIsInNvcnQiLCJmaWVsZHMiLCJwcm9qZWN0aW9uIiwiTG9jYWxDb2xsZWN0aW9uIiwiX2NoZWNrU3VwcG9ydGVkUHJvamVjdGlvbiIsInNraXAiLCJ3aGVyZSIsImhhc1doZXJlIiwiZ2VvIiwiaGFzR2VvUXVlcnkiLCJsaW1pdEJ1dE5vU29ydCIsImxpbWl0IiwidGhpcmRQYXJ0eSIsIm9ic2VydmVyRHJpdmVyIiwidW5rbm93blJlYXNvbiIsImRyaXZlciIsInByZVJ1bm5pbmdNYXRjaGVycyIsImdsb2JhbE1hdGNoZXJzIiwiY2hlY2tXaHlOb09wbG9nIiwicnVuTWF0Y2hlcnMiLCJtYXRjaGVyTGlzdCIsIm1hdGNoZWQiLCJUcmFjZXIiLCJldmVudExvZ2dlciIsIlJFUEVUSVRJVkVfRVZFTlRTIiwiY3VzdG9tIiwiVFJBQ0VfVFlQRVMiLCJNQVhfVFJBQ0VfRVZFTlRTIiwiX2ZpbHRlckZpZWxkcyIsIm1heEFycmF5SXRlbXNUb0ZpbHRlciIsInVzZXJJZCIsInRyYWNlSW5mbyIsIl9pZCIsImV2ZW50IiwibWV0YURhdGEiLCJsYXN0RXZlbnQiLCJnZXRMYXN0RXZlbnQiLCJpc0V2ZW50c1Byb2Nlc3NlZCIsImVuZEF0IiwibmVzdGVkIiwiX2FwcGx5RmlsdGVycyIsImV2ZW50U3RhY2tUcmFjZSIsImRpciIsImRlcHRoIiwibGFzdE5lc3RlZCIsImV2ZW50RW5kIiwiZW5kTGFzdEV2ZW50IiwiZm9yY2VkRW5kIiwiX2hhc1VzZWZ1bE5lc3RlZCIsImV2ZXJ5IiwiYnVpbGRFdmVudCIsImVsYXBzZWRUaW1lRm9yRXZlbnQiLCJidWlsdEV2ZW50IiwicHJldkVuZCIsImkiLCJuZXN0ZWRFdmVudCIsImNvbXB1dGVUaW1lIiwiYnVpbGRUcmFjZSIsImZpcnN0RXZlbnQiLCJwcm9jZXNzZWRFdmVudHMiLCJ0b3RhbE5vbkNvbXB1dGUiLCJwcmV2RXZlbnQiLCJsYXN0RXZlbnREYXRhIiwicmVtb3ZlQ291bnQiLCJvcHRpbWl6ZUV2ZW50Iiwib2JqZWN0RXZlbnQiLCJkdXJhdGlvbiIsIm9wdGltaXplZE5lc3RlZEV2ZW50cyIsIm9wdGltaXplRXZlbnRzIiwib3B0aW1pemVkRXZlbnQiLCJleHRyYUluZm8iLCJvcHRpbWl6ZWRFdmVudHMiLCJmaWx0ZXJGbiIsInJlZGFjdEZpZWxkIiwiZXZlbnRUeXBlIiwiY2xvbmUiLCJfYXBwbHlPYmplY3RGaWx0ZXJzIiwidG9GaWx0ZXIiLCJmaWx0ZXJPYmplY3QiLCJjbG9uZWQiLCJpc0FycmF5IiwidHJhY2VyIiwic3RyaXBTZW5zaXRpdmUiLCJ0eXBlc1RvU3RyaXAiLCJyZWNlaXZlclR5cGUiLCJzdHJpcHBlZFR5cGVzIiwiaXRlbSIsInN0cmlwU2Vuc2l0aXZlVGhvcm91Z2giLCJmaWVsZHNUb0tlZXAiLCJzdHJpcFNlbGVjdG9ycyIsImNvbGxlY3Rpb25MaXN0IiwiY29sbE1hcCIsImNvbGxOYW1lIiwiY29sbCIsIkVKU09OIiwibWF4VG90YWxzIiwiY3VycmVudE1heFRyYWNlIiwidHJhY2VBcmNoaXZlIiwicHJvY2Vzc2VkQ250Iiwia2luZCIsIl9oYW5kbGVFcnJvcnMiLCJ0cmFjZXMiLCJfdGltZW91dEhhbmRsZXIiLCJwcm9jZXNzVHJhY2VzIiwic3RvcCIsImNsZWFySW50ZXJ2YWwiLCJlcnJvcktleSIsImVycm9yZWRUcmFjZSIsImtpbmRzIiwiY3VycmVudE1heFRvdGFsIiwiZXhjZWVkaW5nUG9pbnRzIiwiYXJjaGl2ZURlZmF1bHQiLCJjYW5BcmNoaXZlIiwiX2lzVHJhY2VPdXRsaWVyIiwiZGF0YVNldCIsIl9pc091dGxpZXIiLCJkYXRhUG9pbnQiLCJtYXhNYWRaIiwibWVkaWFuIiwiX2dldE1lZGlhbiIsIm1hZCIsIl9jYWxjdWxhdGVNYWQiLCJtYWRaIiwiX2Z1bmNNZWRpYW5EZXZpYXRpb24iLCJzb3J0ZWREYXRhU2V0IiwiYiIsIl9waWNrUXVhcnRpbGUiLCJudW0iLCJwb3MiLCJtZWRpYW5EZXZpYXRpb25zIiwieCIsImFicyIsIl9nZXRNZWFuIiwiZGF0YVBvaW50cyIsInBvaW50IiwiRG9jU3pDYWNoZSIsIkRvY1N6Q2FjaGVJdGVtIiwiTFJVIiwianNvblN0cmluZ2lmeSIsIm1heEl0ZW1zIiwibWF4VmFsdWVzIiwiaXRlbXMiLCJtYXgiLCJnZXRTaXplIiwicXVlcnkiLCJvcHRzIiwiZ2V0S2V5IiwibmVlZHNVcGRhdGUiLCJkb2MiLCJlbGVtZW50IiwiQnVmZmVyIiwiYnl0ZUxlbmd0aCIsImFkZERhdGEiLCJnZXRWYWx1ZSIsImdldEl0ZW1TY29yZSIsInVwZGF0ZWQiLCJzY29yZSIsImN1cnJlbnRUaW1lIiwidGltZVNpbmNlVXBkYXRlIiwic2hpZnQiLCJzb3J0TnVtYmVyIiwic29ydGVkIiwiaWR4IiwicGFja2FnZU1hcCIsIlRyYWNrTWV0ZW9yRGVidWciLCJUcmFja1VuY2F1Z2h0RXhjZXB0aW9ucyIsIlRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyIsImhvc3RuYW1lIiwiRmliZXJzIiwiS2FkaXJhQ29yZSIsIkRFQlVHX1BBWUxPQURfU0laRSIsIk1PTlRJX0RFQlVHX1BBWUxPQURfU0laRSIsIm1vZGVscyIsImN1cnJlbnRTdWIiLCJFbnZpcm9ubWVudFZhcmlhYmxlIiwid2FpdFRpbWVCdWlsZGVyIiwicHVic3ViIiwiYnVpbGRJbnRlcnZhbCIsIl9idWlsZFBheWxvYWQiLCJjb25uZWN0IiwiYXBwU2VjcmV0IiwicGF5bG9hZFRpbWVvdXQiLCJjbGllbnRFbmdpbmVTeW5jRGVsYXkiLCJ0aHJlc2hvbGRzIiwiaXNIb3N0TmFtZVNldCIsInByb3h5IiwicmVjb3JkSVBBZGRyZXNzIiwic3RhbGxlZFRpbWVvdXQiLCJkaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZyIsImRvY3VtZW50U2l6ZUNhY2hlU2l6ZSIsImxhc3QiLCJlbmFibGVFcnJvclRyYWNraW5nIiwiaXNQcm9kdWN0aW9uIiwiYXV0aEhlYWRlcnMiLCJ0cmltIiwiYWdlbnRWZXJzaW9uIiwiX2hlYWRlcnMiLCJyZWxlYXNlIiwicmVwbGFjZSIsIl9jaGVja0F1dGgiLCJfc2VuZEFwcFN0YXRzIiwiX3NjaGVkdWxlUGF5bG9hZFNlbmQiLCJhZGRGaWx0ZXJGbiIsImthZGlyYSIsImRpc2FibGVFcnJvclRyYWNraW5nIiwic3RhcnR1cCIsInB1Ymxpc2giLCJfb3B0aW9ucyIsImFkZGVkIiwicmVhZHkiLCJjbGllbnRWZXJzaW9ucyIsImJ1aWxkRGV0YWlsZWRJbmZvIiwiX2lzRGV0YWlsZWRJbmZvIiwiX2NvdW50RGF0YVNlbnQiLCJfZGV0YWlsSW5mb1NlbnRJbnRlcnZhbCIsImFwcFN0YXRzIiwicHJvdG9jb2xWZXJzaW9uIiwicGFja2FnZVZlcnNpb25zIiwiUGFja2FnZSIsIl9zZW5kUGF5bG9hZCIsImxvZ1BheWxvYWQiLCJ0cmFjZUNvdW50IiwibGFyZ2VzdFRyYWNlIiwiY291bnRCcmVha2Rvd25zIiwiYnJlYWtkb3ducyIsInNpemVUcmFjZXMiLCJzdHJpbmdpZmllZCIsIm5vcm1hbGl6ZWQiLCJlbnRyaWVzIiwiX3JlZiIsImsiLCJsb2dFcnIiLCJSYW5nZUVycm9yIiwicnVuIiwiX2dldEluZm8iLCJjdXJyZW50RmliZXIiLCJ1c2VFbnZpcm9ubWVudFZhcmlhYmxlIiwiY3VycmVudCIsIl9fa2FkaXJhSW5mbyIsIl9zZXRJbmZvIiwic3RhcnRDb250aW51b3VzUHJvZmlsaW5nIiwiTW9udGlQcm9maWxlciIsInN0YXJ0Q29udGludW91cyIsIm9uUHJvZmlsZSIsIl9yZWYyIiwicHJvZmlsZSIsInByb2ZpbGVzIiwiZW5hYmxlQ2xpZW50RXJyb3JUcmFja2luZyIsInByZXZpb3VzRXZlbnRzIiwiaWdub3JlRXJyb3JUcmFja2luZyIsIl9za2lwS2FkaXJhIiwic3RhcnRFdmVudCIsImVuZEV2ZW50Iiwid3JhcFNlcnZlciIsInNlcnZlclByb3RvIiwib3JpZ2luYWxIYW5kbGVDb25uZWN0IiwiX2hhbmRsZUNvbm5lY3QiLCJfbWV0ZW9yU2Vzc2lvbiIsImVtaXQiLCJ3cmFwU2Vzc2lvbiIsIk1ldGVvckRlYnVnSWdub3JlIiwiTUFYX1BBUkFNU19MRU5HVEgiLCJzZXNzaW9uUHJvdG8iLCJvcmlnaW5hbFByb2Nlc3NNZXNzYWdlIiwicHJvY2Vzc01lc3NhZ2UiLCJzdHJpbmdpZmllZFBhcmFtcyIsInN0YXJ0RGF0YSIsIl93YWl0RXZlbnRJZCIsIm9yaWdpbmFsTWV0aG9kSGFuZGxlciIsInByb3RvY29sX2hhbmRsZXJzIiwicmVzcG9uc2UiLCJ0cmFja1RpbWVvdXQiLCJ3YWl0T24iLCJ3aXRoVmFsdWUiLCJvcmdpbmFsU3ViSGFuZGxlciIsIm9yZ2luYWxVblN1YkhhbmRsZXIiLCJ1bnN1YiIsIm9yaWdpbmFsU2VuZCIsImN1cnJlbnRFcnJvciIsIm1ldGhvZF9oYW5kbGVycyIsImhhbmRsZXIiLCJ3cmFwTWV0aG9kSGFuZGVyRm9yRXJyb3JzIiwib3JpZ2luYWxNZXRlb3JNZXRob2RzIiwibWV0aG9kTWFwIiwib3JpZ2luYWxIYW5kbGVyIiwic291cmNlIiwid3JhcFN1YnNjcmlwdGlvbiIsInN1YnNjcmlwdGlvblByb3RvIiwib3JpZ2luYWxSdW5IYW5kbGVyIiwiX3J1bkhhbmRsZXIiLCJvcmlnaW5hbFJlYWR5IiwiX2FwbVJlYWR5VHJhY2tlZCIsIl9zZXNzaW9uIiwib3JpZ2luYWxFcnJvciIsImVycm9yRm9yQXBtIiwib3JpZ2luYWxEZWFjdGl2YXRlIiwiX2RlYWN0aXZhdGUiLCJmdW5jTmFtZSIsIm9yaWdpbmFsRnVuYyIsImNvbGxlY3Rpb25OYW1lIiwid3JhcE9wbG9nT2JzZXJ2ZURyaXZlciIsIndyYXBQb2xsaW5nT2JzZXJ2ZURyaXZlciIsIndyYXBNdWx0aXBsZXhlciIsIndyYXBGb3JDb3VudGluZ09ic2VydmVycyIsInByb3RvIiwib3JpZ2luYWxQdWJsaXNoTmV3UmVzdWx0cyIsIl9wdWJsaXNoTmV3UmVzdWx0cyIsIm5ld1Jlc3VsdHMiLCJuZXdCdWZmZXIiLCJfY3Vyc29yRGVzY3JpcHRpb24iLCJkb2NTaXplIiwiX293bmVySW5mbyIsIl9wb2xsZWREb2N1bWVudHMiLCJfZG9jU2l6ZSIsInBvbGxlZEZldGNoZXMiLCJvcmlnaW5hbEhhbmRsZU9wbG9nRW50cnlRdWVyeWluZyIsIl9oYW5kbGVPcGxvZ0VudHJ5UXVlcnlpbmciLCJvcmlnaW5hbEhhbmRsZU9wbG9nRW50cnlTdGVhZHlPckZldGNoaW5nIiwiX2hhbmRsZU9wbG9nRW50cnlTdGVhZHlPckZldGNoaW5nIiwiZm5OYW1lIiwib3JpZ2luYWxGbiIsImMiLCJfbGl2ZVVwZGF0ZXNDb3VudHMiLCJfaW5pdGlhbEFkZHMiLCJpbml0aWFsRmV0Y2hlcyIsIm9yaWdpbmFsU3RvcCIsIm9yaWdpbmFsUG9sbE1vbmdvIiwiX3BvbGxNb25nbyIsIl9yZXN1bHRzIiwiX21hcCIsIl9wb2xsZWREb2NTaXplIiwib3JpZ2luYWxJbml0YWxBZGQiLCJhZGRIYW5kbGVBbmRTZW5kSW5pdGlhbEFkZHMiLCJoYW5kbGUiLCJfZmlyc3RJbml0aWFsQWRkVGltZSIsIl93YXNNdWx0aXBsZXhlclJlYWR5IiwiX3JlYWR5IiwiX3F1ZXVlTGVuZ3RoIiwiX3F1ZXVlIiwiX3Rhc2tIYW5kbGVzIiwiX2VsYXBzZWRQb2xsaW5nVGltZSIsIm1vbmdvQ29ubmVjdGlvblByb3RvIiwiTWV0ZW9yWCIsIk1vbmdvQ29ubmVjdGlvbiIsIm9yaWdpbmFsT2JzZXJ2ZUNoYW5nZXMiLCJfb2JzZXJ2ZUNoYW5nZXMiLCJvcmRlcmVkIiwiY2FsbGJhY2tzIiwicmV0IiwiX211bHRpcGxleGVyIiwiX19rYWRpcmFUcmFja2VkIiwib3duZXJJbmZvIiwiX29ic2VydmVEcml2ZXIiLCJ3cmFwU3RyaW5naWZ5RERQIiwiRERQQ29tbW9uIiwib3JpZ2luYWxTdHJpbmdpZnlERFAiLCJzdHJpbmdpZnlERFAiLCJtc2dTdHJpbmciLCJtc2dTaXplIiwid3JhcFdlYkFwcCIsIndyYXBGYXN0UmVuZGVyIiwid3JhcEZzIiwid3JhcFBpY2tlciIsIndyYXBSb3V0ZXJzIiwid3JhcEZpYmVycyIsInNldExhYmVscyIsImhpamFja0RCT3BzIiwiaW5zdHJ1bWVudGVkIiwiX3N0YXJ0SW5zdHJ1bWVudGluZyIsIm9uUmVhZHkiLCJTZXJ2ZXIiLCJTZXNzaW9uIiwiU3Vic2NyaXB0aW9uIiwiTW9uZ29PcGxvZ0RyaXZlciIsIk1vbmdvUG9sbGluZ0RyaXZlciIsIk11bHRpcGxleGVyIiwiTW9uZ28iLCJNb25nb0ludGVybmFscyIsIm9yaWdpbmFsT3BlbiIsIlJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIiLCJvcGVuIiwibW9uZ28iLCJnZXRTeW5jcm9ub3VzQ3Vyc29yIiwiTW9uZ29Db2xsIiwiQ29sbGVjdGlvbiIsImZpbmRPbmUiLCJjdXJzb3IiLCJmZXRjaCIsIl9zeW5jaHJvbm91c0N1cnNvciIsImZ1bmMiLCJtb2QiLCJ1cHNlcnQiLCJldmVudElkIiwiZW5kT3B0aW9ucyIsInVwZGF0ZWREb2NzIiwibnVtYmVyQWZmZWN0ZWQiLCJpbnNlcnRlZElkIiwicmVtb3ZlZERvY3MiLCJjdXJzb3JQcm90byIsIk1vbmdvQ3Vyc29yIiwiY3Vyc29yT3B0aW9ucyIsInByZXZpb3VzVHJhY2tOZXh0T2JqZWN0IiwidHJhY2tOZXh0T2JqZWN0IiwiZW5kRGF0YSIsIm9wbG9nIiwid2FzTXVsdGlwbGV4ZXJSZWFkeSIsInF1ZXVlTGVuZ3RoIiwiZWxhcHNlZFBvbGxpbmdUaW1lIiwib2JzZXJ2ZXJEcml2ZXJDbGFzcyIsImN1cnNvclN1cHBvcnRlZCIsIl9jYWNoZSIsImRvY3MiLCJub09mQ2FjaGVkRG9jcyIsImluaXRpYWxQb2xsaW5nVGltZSIsIl9sYXN0UG9sbFRpbWUiLCJyZWFzb25JbmZvIiwibm9PcGxvZ0NvZGUiLCJub09wbG9nUmVhc29uIiwibm9PcGxvZ1NvbHV0aW9uIiwiZG9jc0ZldGNoZWQiLCJTeW5jcm9ub3VzQ3Vyc29yIiwib3JpZ05leHRPYmplY3QiLCJfbmV4dE9iamVjdCIsInNob3VsZFRyYWNrIiwiSFRUUCIsImxpYnJhcnkiLCJvcmlnaW5hbENhbGwiLCJSZXF1ZXN0IiwicmVxdWVzdCIsIkNBUFRVUkVEX09QVElPTlMiLCJnZXRXcmFwcGVyIiwid3JhcHBlciIsIkVtYWlsIiwic2VuZEFzeW5jIiwiRXZlbnRTeW1ib2wiLCJTeW1ib2wiLCJTdGFydFRyYWNrZWQiLCJ3cmFwcGVkIiwiZW5kQXN5bmNFdmVudCIsImZpYmVyIiwib3JpZ2luYWxZaWVsZCIsInlpZWxkIiwib3JpZ2luYWxSdW4iLCJvcmlnaW5hbFRocm93SW50byIsInRocm93SW50byIsImVuc3VyZUZpYmVyQ291bnRlZCIsImFjdGl2ZUZpYmVyVG90YWwiLCJhY3RpdmVGaWJlckNvdW50IiwicHJldmlvdXNUb3RhbENyZWF0ZWQiLCJmaWJlcnNDcmVhdGVkIiwidGltZXIiLCJ0aHJvd0Vycm9yIiwicHJpbnRFcnJvckFuZEtpbGwiLCJfdHJhY2tlZCIsImdldFRyYWNlIiwiX2VyciIsIm5leHRUaWNrIiwiZXhpdCIsIm9yaWdpbmFsTWV0ZW9yRGVidWciLCJfZGVidWciLCJpc0FyZ3MiLCJhbHJlYWR5VHJhY2tlZCIsImVycm9yTWVzc2FnZSIsInNlcGFyYXRvciIsImVuZHNXaXRoIiwiRERQU2VydmVyIiwia2FkaXJhX1Nlc3Npb25fc2VuZCIsIm9yaWdpbmFsU2VuZEFkZHMiLCJfc2VuZEFkZHMiLCJrYWRpcmFfTXVsdGlwbGV4ZXJfc2VuZEFkZHMiLCJvcmlnaW5hbE1vbmdvSW5zZXJ0IiwiX2luc2VydCIsImthZGlyYV9Nb25nb0Nvbm5lY3Rpb25faW5zZXJ0IiwiY2IiLCJvcmlnaW5hbE1vbmdvVXBkYXRlIiwiX3VwZGF0ZSIsImthZGlyYV9Nb25nb0Nvbm5lY3Rpb25fdXBkYXRlIiwib3JpZ2luYWxNb25nb1JlbW92ZSIsIl9yZW1vdmUiLCJrYWRpcmFfTW9uZ29Db25uZWN0aW9uX3JlbW92ZSIsIm9yaWdpbmFsUHVic3ViQWRkZWQiLCJzZW5kQWRkZWQiLCJrYWRpcmFfU2Vzc2lvbl9zZW5kQWRkZWQiLCJvcmlnaW5hbFB1YnN1YkNoYW5nZWQiLCJzZW5kQ2hhbmdlZCIsImthZGlyYV9TZXNzaW9uX3NlbmRDaGFuZ2VkIiwib3JpZ2luYWxQdWJzdWJSZW1vdmVkIiwic2VuZFJlbW92ZWQiLCJrYWRpcmFfU2Vzc2lvbl9zZW5kUmVtb3ZlZCIsIm9yaWdpbmFsQ3Vyc29yRm9yRWFjaCIsImthZGlyYV9DdXJzb3JfZm9yRWFjaCIsIm9yaWdpbmFsQ3Vyc29yTWFwIiwia2FkaXJhX0N1cnNvcl9tYXAiLCJvcmlnaW5hbEN1cnNvckZldGNoIiwia2FkaXJhX0N1cnNvcl9mZXRjaCIsIm9yaWdpbmFsQ3Vyc29yQ291bnQiLCJrYWRpcmFfQ3Vyc29yX2NvdW50Iiwib3JpZ2luYWxDdXJzb3JPYnNlcnZlQ2hhbmdlcyIsIm9ic2VydmVDaGFuZ2VzIiwia2FkaXJhX0N1cnNvcl9vYnNlcnZlQ2hhbmdlcyIsIm9yaWdpbmFsQ3Vyc29yT2JzZXJ2ZSIsIm9ic2VydmUiLCJrYWRpcmFfQ3Vyc29yX29ic2VydmUiLCJvcmlnaW5hbENyb3NzYmFyTGlzdGVuIiwiX0Nyb3NzYmFyIiwibGlzdGVuIiwia2FkaXJhX0Nyb3NzYmFyX2xpc3RlbiIsInRyaWdnZXIiLCJvcmlnaW5hbENyb3NzYmFyRmlyZSIsImZpcmUiLCJrYWRpcmFfQ3Jvc3NiYXJfZmlyZSIsIm5vdGlmaWNhdGlvbiIsIkZhc3RSZW5kZXIiLCJvcmlnUm91dGUiLCJyb3V0ZSIsIl9jYWxsYmFjayIsInN1Z2dlc3RlZFJvdXRlTmFtZSIsImhhbmRsZUVycm9yRXZlbnQiLCJ3cmFwQ2FsbGJhY2siLCJjcmVhdGVXcmFwcGVyIiwiZXZlbnRFbWl0dGVyIiwibGlzdGVuZXJDb3VudCIsInJlbW92ZUxpc3RlbmVyIiwiZnNLYWRpcmFJbmZvIiwib3JpZ2luYWxTdGF0Iiwib3JpZ2luYWxDcmVhdGVSZWFkU3RyZWFtIiwiUGVyZm9ybWFuY2VPYnNlcnZlciIsImNvbnN0YW50cyIsInBlcmZvcm1hbmNlIiwiX29ic2VydmVyIiwib2JzZXJ2ZXIiLCJsaXN0IiwiZ2V0RW50cmllcyIsIl9tYXBLaW5kVG9NZXRyaWMiLCJjbGVhckdDIiwiZW50cnlUeXBlcyIsImJ1ZmZlcmVkIiwiZ2NLaW5kIiwiTk9ERV9QRVJGT1JNQU5DRV9HQ19NQUpPUiIsIk5PREVfUEVSRk9STUFOQ0VfR0NfTUlOT1IiLCJOT0RFX1BFUkZPUk1BTkNFX0dDX0lOQ1JFTUVOVEFMIiwiTk9ERV9QRVJGT1JNQU5DRV9HQ19XRUFLQ0IiLCJjbGllbnQiLCJzZXJ2ZXJTdGF0dXMiLCJ0b3RhbENoZWNrb3V0VGltZSIsIm1lYXN1cmVtZW50Q291bnQiLCJwZW5kaW5nVG90YWwiLCJjaGVja2VkT3V0VG90YWwiLCJnZXRTZXJ2ZXJTdGF0dXMiLCJnZXRQcmltYXJ5IiwiREVGQVVMVF9NQVhfUE9PTF9TSVpFIiwiZ2V0UG9vbFNpemUiLCJ0b3BvbG9neSIsInMiLCJtYXhQb29sU2l6ZSIsIl9jbGllbnQiLCJkZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlciIsInZlcnNpb25QYXJ0cyIsIk5wbU1vZHVsZXMiLCJtb25nb2RiIiwicGFydCIsInVzZVVuaWZpZWRUb3BvbG9neSIsInByaW1hcnlEZXNjcmlwdGlvbiIsImdldFNlcnZlckRlc2NyaXB0aW9uIiwicG9vbCIsInRvdGFsQ29ubmVjdGlvbnMiLCJ0b3RhbENvbm5lY3Rpb25Db3VudCIsImF2YWlsYWJsZUNvbm5lY3Rpb25zIiwiYXZhaWxhYmxlQ29ubmVjdGlvbkNvdW50IiwicHJpbWFyeSIsImRlbGV0ZSIsImNvbm5lY3Rpb25JZCIsImNoZWNrb3V0RHVyYXRpb24iLCJkaXNhYmxlQ3JlYXRlIiwibGFzdElzTWFzdGVyIiwibGFzdEhlbGxvIiwic2VydmVycyIsImRlc2NyaXB0aW9uIiwiRmliZXIiLCJQaWNrZXIiLCJvcmlnUHJvY2Vzc1JvdXRlIiwiX3Byb2Nlc3NSb3V0ZSIsInByZXR0eU1lc3NhZ2UiLCJhZGRUaW1lb3V0IiwiYmluZEVudmlyb25tZW50IiwidGltZW91dElkIiwiaGFzIiwiY29ubmVjdFJvdXRlcyIsImNvbm5lY3RSb3V0ZSIsInJvdXRlciIsIm9sZEFkZCIsImNoZWNrSGFuZGxlcnNJbkZpYmVyIiwiV2ViQXBwSW50ZXJuYWxzIiwiTUFYX0JPRFlfU0laRSIsIk1BWF9TVFJJTkdJRklFRF9CT0RZX1NJWkUiLCJjYW5XcmFwU3RhdGljSGFuZGxlciIsInN0YXRpY0ZpbGVzQnlBcmNoIiwiaGFuZGxlcnNMZW5ndGgiLCJyYXdDb25uZWN0SGFuZGxlcnMiLCJpbkZpYmVyIiwib3V0c2lkZUZpYmVyIiwidXNlIiwiX3JlcSIsIl9yZXMiLCJuZXh0IiwicG9wIiwiSW5mb1N5bWJvbCIsImFzeW5jQXBwbHkiLCJwYXJzZVVybCIsInJlZ2lzdGVyQm9pbGVycGxhdGVEYXRhQ2FsbGJhY2siLCJpc0FwcFJvdXRlIiwib3JpZ0NhdGVnb3JpemVSZXF1ZXN0IiwiY2F0ZWdvcml6ZVJlcXVlc3QiLCJwYXRobmFtZSIsImFzeW5jRXZlbnQiLCJpc1N0YXRpYyIsImlzSnNvbiIsImhhc1NtYWxsQm9keSIsImJ1aWx0Iiwid3JhcEhhbmRsZXIiLCJlcnJvckhhbmRsZXIiLCJuZXh0Q2FsbGVkIiwid3JhcHBlZE5leHQiLCJwb3RlbnRpYWxQcm9taXNlIiwiZmluaXNoZWQiLCJ3cmFwQ29ubmVjdCIsImFwcCIsIndyYXBTdGFjayIsIm9sZFVzZSIsIndyYXBwZWRIYW5kbGVyIiwibWV0ZW9ySW50ZXJuYWxIYW5kbGVycyIsImNvbm5lY3RIYW5kbGVycyIsImNvbm5lY3RBcHAiLCJvbGRTdGF0aWNGaWxlc01pZGRsZXdhcmUiLCJzdGF0aWNGaWxlc01pZGRsZXdhcmUiLCJzdGF0aWNIYW5kbGVyIiwiX3N0YXRpY0ZpbGVzIiwibm9ybWFsaXplZFByZWZpeCIsIl9wYXJzZUVudiIsIm5vcm1hbGl6ZWROYW1lIiwicGFyc2VyIiwic3RyIiwicGFyc2VCb29sIiwidG9Mb3dlckNhc2UiLCJwYXJzZVN0cmluZyIsIk1PTlRJX0FQUF9JRCIsIk1PTlRJX0FQUF9TRUNSRVQiLCJNT05USV9PUFRJT05TX1NUQUxMRURfVElNRU9VVCIsIk1PTlRJX09QVElPTlNfQ0xJRU5UX0VOR0lORV9TWU5DX0RFTEFZIiwiTU9OVElfT1BUSU9OU19FUlJPUl9EVU1QX0lOVEVSVkFMIiwiTU9OVElfT1BUSU9OU19NQVhfRVJST1JTX1BFUl9JTlRFUlZBTCIsIk1PTlRJX09QVElPTlNfQ09MTEVDVF9BTExfU1RBQ0tTIiwiTU9OVElfT1BUSU9OU19FTkFCTEVfRVJST1JfVFJBQ0tJTkciLCJNT05USV9PUFRJT05TX0RJU0FCTEVfQ0xJRU5UX0VSUk9SX1RSQUNLSU5HIiwiTU9OVElfT1BUSU9OU19FTkRQT0lOVCIsIk1PTlRJX09QVElPTlNfSE9TVE5BTUUiLCJNT05USV9PUFRJT05TX1BBWUxPQURfVElNRU9VVCIsIk1PTlRJX09QVElPTlNfUFJPWFkiLCJNT05USV9PUFRJT05TX0RPQ1VNRU5UX1NJWkVfQ0FDSEVfU0laRSIsIk1PTlRJX1VQTE9BRF9TT1VSQ0VfTUFQUyIsIk1PTlRJX1JFQ09SRF9JUF9BRERSRVNTIiwiTU9OVElfRVZFTlRfU1RBQ0tfVFJBQ0UiLCJNT05USV9PUFRJT05TX0RJU0FCTEVfTlRQIiwiX2Nvbm5lY3RXaXRoRW52IiwiX2Nvbm5lY3RXaXRoU2V0dGluZ3MiLCJtb250aVNldHRpbmdzIiwic2V0dGluZ3MiLCJtb250aSIsImNvbmZsaWN0aW5nUGFja2FnZXMiLCJpc05vZGUiLCJub2RlIiwicG9seWZpbGxOb3ciLCJuYW5vc2Vjb25kcyIsInRpbWVvdXRNaWxsaXMiLCJfd2F0Y2hMYWciLCJfc3RvcHBlZCIsIl90b3RhbExhZyIsIl9yZWdpc3Rlck5vd0Z1bmMiLCJfbGFzdFdhdGNoVGltZSIsIl9kZXRlY3RMYWciLCJyZW1vdmVBbGxMaXN0ZW5lcnMiLCJlbGFwc2VkVGltZSIsInN0YXR1c09iamVjdCIsInRvdGFsTGFnIiwiZW5kIiwicmVhbERpZmYiLCJtYWpvciIsIk51bWJlciIsIndpbmRvdyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFNLENBQUM7RUFBQ0Msb0JBQW9CLEVBQUNBLENBQUEsS0FBSUEsb0JBQW9CO0VBQUNDLGtCQUFrQixFQUFDQSxDQUFBLEtBQUlBLGtCQUFrQjtFQUFDQyxhQUFhLEVBQUNBLENBQUEsS0FBSUEsYUFBYTtFQUFDQyxhQUFhLEVBQUNBLENBQUEsS0FBSUE7QUFBYSxDQUFDLENBQUM7QUFBQyxJQUFJQyxNQUFNO0FBQUNOLE1BQU0sQ0FBQ08sSUFBSSxDQUFDLGVBQWUsRUFBQztFQUFDRCxNQUFNQSxDQUFDRSxDQUFDLEVBQUM7SUFBQ0YsTUFBTSxHQUFDRSxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBRWpPLFNBQVNOLG9CQUFvQkEsQ0FBRU8sSUFBSSxFQUFFO0VBQzFDLE1BQU1DLFVBQVUsR0FBR0MseUJBQXlCLENBQUNELFVBQVU7RUFFdkQsSUFBSUEsVUFBVSxFQUFFO0lBQ2QsT0FBT0EsVUFBVSxDQUFDRSxRQUFRLENBQUNILElBQUksQ0FBQyxHQUFHQyxVQUFVLENBQUNFLFFBQVEsQ0FBQ0gsSUFBSSxDQUFDLENBQUNJLE9BQU8sR0FBRyxNQUFNO0VBQy9FOztFQUVBO0VBQ0EsUUFBUUosSUFBSTtJQUNWLEtBQUssYUFBYTtNQUNoQixPQUFP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TUFBTSxDQUFDLENBQUMsRUFBRTtNQUNaLE1BQU0sQ0FBQ2lCLEtBQUssQ0FBQyxHQUFHcjhCLE9BQU8sQ0FBQ3JSLFFBQVEsQ0FBQzBzQyxJQUFJLENBQUMvckMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDMFUsR0FBRyxDQUFDczRCLE1BQU0sQ0FBQztNQUU1RCxJQUFJRCxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQ2IsSUFBSSxDQUFDampDLElBQUksR0FBR2tpQyxXQUFXO1FBQ3ZCO01BQ0Y7TUFFQSxNQUFNO1FBQ0ovSTtRQUNBO01BQ0YsQ0FBQyxHQUFHemdDLE9BQU8sQ0FBQyxZQUFZLENBQUM7TUFDekIsSUFBSSxDQUFDc0gsSUFBSSxHQUFHbTVCLFdBQVcsQ0FBQ2h5QixHQUFHO01BQzNCO0lBQ0Y7SUFFQSxJQUFJLE9BQU9nOEIsTUFBTSxLQUFLLFdBQVcsSUFBSUEsTUFBTSxDQUFDaEssV0FBVyxJQUFJZ0ssTUFBTSxDQUFDaEssV0FBVyxDQUFDaHlCLEdBQUcsRUFBRTtNQUNqRixJQUFJLENBQUNuSCxJQUFJLEdBQUdtakMsTUFBTSxDQUFDaEssV0FBVyxDQUFDaHlCLEdBQUc7TUFDbEM7SUFDRjtJQUVBLElBQUksQ0FBQ25ILElBQUksR0FBR3FGLElBQUksQ0FBQzhCLEdBQUc7RUFDdEI7QUFDRixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9tb250aWFwbV9hZ2VudC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xpZW50QXJjaFZlcnNpb24gKGFyY2gpIHtcbiAgY29uc3QgYXV0b3VwZGF0ZSA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZTtcblxuICBpZiAoYXV0b3VwZGF0ZSkge1xuICAgIHJldHVybiBhdXRvdXBkYXRlLnZlcnNpb25zW2FyY2hdID8gYXV0b3VwZGF0ZS52ZXJzaW9uc1thcmNoXS52ZXJzaW9uIDogJ25vbmUnO1xuICB9XG5cbiAgLy8gTWV0ZW9yIDEuNyBhbmQgb2xkZXIgZGlkIG5vdCBoYXZlIGFuIGBhdXRvdXBkYXRlYCBvYmplY3QuXG4gIHN3aXRjaCAoYXJjaCkge1xuICAgIGNhc2UgJ2NvcmRvdmEud2ViJzpcbiAgICAgIHJldHVybiBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmF1dG91cGRhdGVWZXJzaW9uQ29yZG92YTtcbiAgICBjYXNlICd3ZWIuYnJvd3Nlcic6XG4gICAgY2FzZSAnd2ViLmJyb3dzZXIubGVnYWN5JzpcbiAgICAgIC8vIE1ldGVvciAxLjcgYWx3YXlzIHVzZWQgdGhlIHdlYi5icm93c2VyLmxlZ2FjeSB2ZXJzaW9uXG4gICAgICByZXR1cm4gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hdXRvdXBkYXRlVmVyc2lvbjtcblxuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJ25vbmUnO1xuICB9XG59XG5cbmNvbnN0IGNyZWF0ZVN0YWNrVHJhY2UgPSAoKSA9PiB7XG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIGxldCBlcnIgPSB7fTtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZShlcnIsIEthZGlyYS50cmFja0Vycm9yKTtcbiAgICByZXR1cm4gZXJyLnN0YWNrO1xuICB9XG5cbiAgY29uc3Qgc3RhY2sgPSBuZXcgRXJyb3IoKS5zdGFjay5zcGxpdCgnXFxuJyk7XG4gIGxldCB0b1JlbW92ZSA9IDA7XG5cbiAgLy8gUmVtb3ZlIGZyYW1lcyBzdGFydGluZyBmcm9tIHdoZW4gdHJhY2tFcnJvciB3YXMgY2FsbGVkXG4gIGZvciAoOyB0b1JlbW92ZSA8IHN0YWNrLmxlbmd0aDsgdG9SZW1vdmUrKykge1xuICAgIGlmIChzdGFja1t0b1JlbW92ZV0uaW5kZXhPZigndHJhY2tFcnJvcicpID4gLTEpIHtcbiAgICAgIHRvUmVtb3ZlICs9IDE7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICAvLyBJbiBzYWZhcmksIHRoZXJlIGlzbid0IGEgZnJhbWUgdGhhdCBoYXMgdHJhY2tFcnJvclxuICBpZiAodG9SZW1vdmUgPT09IHN0YWNrLmxlbmd0aCkge1xuICAgIHJldHVybiBzdGFjay5qb2luKCdcXG4nKTtcbiAgfVxuXG4gIHJldHVybiBzdGFjay5zbGljZSh0b1JlbW92ZSkuam9pbignXFxuJyk7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0RXJyb3JQYXJhbWV0ZXJzID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgbGV0IHR5cGUgPSBudWxsO1xuICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gIGxldCBzdWJUeXBlID0gbnVsbDtcbiAgbGV0IHN0YWNrID0gbnVsbDtcbiAgbGV0IGthZGlyYUluZm8gPSBudWxsO1xuXG4gIGlmIChcbiAgICAhKGFyZ3NbMF0gaW5zdGFuY2VvZiBFcnJvcikgJiZcbiAgICB0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycgJiZcbiAgICB0eXBlb2YgYXJnc1sxXSA9PT0gJ3N0cmluZydcbiAgKSB7XG4gICAgLy8gT2xkIHVzYWdlOlxuICAgIC8vIE1vbnRpLnRyYWNrRXJyb3IoXG4gICAgLy8gICAndHlwZScsICdlcnJvciBtZXNzYWdlJywgeyBzdGFja3M6ICdlcnJvciBzdGFjaycsIHN1YlR5cGU6ICdzdWIgdHlwZSB9XG4gICAgLy8gKTtcblxuICAgIGNvbnN0IG9wdGlvbnMgPSBhcmdzWzJdIHx8IHt9O1xuXG4gICAgdHlwZSA9IGFyZ3NbMF07XG4gICAgc3ViVHlwZSA9IE1ldGVvci5pc0NsaWVudCA/IGFyZ3NbMF0gOiBvcHRpb25zLnN1YlR5cGU7XG4gICAgbWVzc2FnZSA9IGFyZ3NbMV07XG4gICAgc3RhY2sgPSBvcHRpb25zLnN0YWNrcyB8fCBjcmVhdGVTdGFja1RyYWNlKCk7XG4gICAga2FkaXJhSW5mbyA9IG9wdGlvbnMua2FkaXJhSW5mbztcbiAgfSBlbHNlIHtcbiAgICAvLyBOZXcgdXNhZ2U6XG4gICAgLy8gTW9udGkudHJhY2tFcnJvcihlcnJvciwgeyB0eXBlOiAndHlwZScsIHN1YlR5cGU6ICdzdWJUeXBlJyB9KTtcbiAgICBjb25zdCBlcnJvciA9IGFyZ3NbMF07XG4gICAgY29uc3Qgb3B0aW9ucyA9IGFyZ3NbMV0gfHwge307XG4gICAgY29uc3QgaXNFcnJvck9iamVjdCA9IHR5cGVvZiBlcnJvciA9PT0gJ29iamVjdCcgJiYgZXJyb3IgIT09IG51bGw7XG5cbiAgICBtZXNzYWdlID0gaXNFcnJvck9iamVjdCA/IGVycm9yLm1lc3NhZ2UgOiBlcnJvcjtcbiAgICBzdGFjayA9IGlzRXJyb3JPYmplY3QgJiYgZXJyb3Iuc3RhY2sgfHwgY3JlYXRlU3RhY2tUcmFjZSgpO1xuICAgIHR5cGUgPSBvcHRpb25zLnR5cGU7XG4gICAgc3ViVHlwZSA9IG9wdGlvbnMuc3ViVHlwZTtcbiAgICBrYWRpcmFJbmZvID0gb3B0aW9ucy5rYWRpcmFJbmZvO1xuICB9XG5cbiAgcmV0dXJuIHsgdHlwZSwgbWVzc2FnZSwgc3ViVHlwZSwgc3RhY2ssIGthZGlyYUluZm8gfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIGNoZWNrLlxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIG9iamVjdCBoYXMgc2V0IGFueSBkYXRhIHdoaWNoIGlzIG5vdCBgbnVsbGAsIGB1bmRlZmluZWRgIG9yIGFuIGVtcHR5IHN0cmluZy5cbiAqL1xuZXhwb3J0IGNvbnN0IG9iamVjdEhhc0RhdGEgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHJldHVybiBPYmplY3QudmFsdWVzKG9iaikuc29tZSh2YWwgPT4gIVtudWxsLCB1bmRlZmluZWQsICcnXS5pbmNsdWRlcyh2YWwpKTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyBUaGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IEEgaHVtYW4tcmVhZGFibGUgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIG1pbGxpc2Vjb25kcy5cbiAqL1xuZXhwb3J0IGNvbnN0IG1pbGxpc1RvSHVtYW4gPSBmdW5jdGlvbiAobWlsbGlzZWNvbmRzKSB7XG4gIGNvbnN0IG1pbGxpcyA9IG1pbGxpc2Vjb25kcyAlIDEwMDA7XG4gIGNvbnN0IHNlY29uZHMgPSBNYXRoLmZsb29yKG1pbGxpc2Vjb25kcyAvIDEwMDApO1xuICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gNjApO1xuICBjb25zdCBob3VycyA9IE1hdGguZmxvb3IobWludXRlcyAvIDYwKTtcbiAgY29uc3QgZGF5cyA9IE1hdGguZmxvb3IoaG91cnMgLyAyNCk7XG5cbiAgY29uc3QgYnVpbGRlciA9IFtdO1xuXG4gIGlmIChkYXlzID4gMCkge1xuICAgIGJ1aWxkZXIucHVzaChgJHtkYXlzfWRgKTtcbiAgfVxuXG4gIGlmIChob3VycyA+IDApIHtcbiAgICBidWlsZGVyLnB1c2goYCR7aG91cnMgJSAyNH1oYCk7XG4gIH1cblxuICBpZiAobWludXRlcyA+IDApIHtcbiAgICBidWlsZGVyLnB1c2goYCR7bWludXRlcyAlIDYwfW1gKTtcbiAgfVxuXG4gIGlmIChzZWNvbmRzID4gMCkge1xuICAgIGJ1aWxkZXIucHVzaChgJHtzZWNvbmRzICUgNjB9c2ApO1xuICB9XG5cbiAgaWYgKG1pbGxpcyA+IDApIHtcbiAgICBidWlsZGVyLnB1c2goYCR7bWlsbGlzfW1zYCk7XG4gIH1cblxuICByZXR1cm4gYnVpbGRlci5qb2luKCcgJyk7XG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbkthZGlyYSA9IHt9O1xuS2FkaXJhLm9wdGlvbnMgPSB7fTtcblxuTW9udGkgPSBLYWRpcmE7XG5cbmlmIChNZXRlb3Iud3JhcEFzeW5jKSB7XG4gIEthZGlyYS5fd3JhcEFzeW5jID0gTWV0ZW9yLndyYXBBc3luYztcbn0gZWxzZSB7XG4gIEthZGlyYS5fd3JhcEFzeW5jID0gTWV0ZW9yLl93cmFwQXN5bmM7XG59XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgY29uc3QgRXZlbnRFbWl0dGVyID0gTnBtLnJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcbiAgY29uc3QgZXZlbnRCdXMgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIGV2ZW50QnVzLnNldE1heExpc3RlbmVycygwKTtcblxuICBjb25zdCBidWlsZEFyZ3MgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIGxldCBldmVudE5hbWUgPSBgJHthcmdzWzBdfS0ke2FyZ3NbMV19YDtcbiAgICBhcmdzID0gYXJncy5zbGljZSgyKTtcbiAgICBhcmdzLnVuc2hpZnQoZXZlbnROYW1lKTtcbiAgICByZXR1cm4gYXJncztcbiAgfTtcblxuICBLYWRpcmEuRXZlbnRCdXMgPSB7fTtcblxuICBbJ29uJywgJ2VtaXQnLCAncmVtb3ZlTGlzdGVuZXInLCAncmVtb3ZlQWxsTGlzdGVuZXJzJywgJ29uY2UnXS5mb3JFYWNoKGZ1bmN0aW9uIChtKSB7XG4gICAgS2FkaXJhLkV2ZW50QnVzW21dID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgIGNvbnN0IF9hcmdzID0gYnVpbGRBcmdzKGFyZ3MpO1xuICAgICAgcmV0dXJuIGV2ZW50QnVzW21dKC4uLl9hcmdzKTtcbiAgICB9O1xuICB9KTtcbn1cbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuXG5jb25zdCBjb21tb25FcnJSZWdFeHBzID0gW1xuICAvY29ubmVjdGlvbiB0aW1lb3V0XFwuIG5vIChcXHcqKSBoZWFydGJlYXQgcmVjZWl2ZWQvaSxcbiAgL0lOVkFMSURfU1RBVEVfRVJSL2ksXG5dO1xuXG5LYWRpcmEuZXJyb3JGaWx0ZXJzID0ge1xuICBmaWx0ZXJWYWxpZGF0aW9uRXJyb3JzICh0eXBlLCBtZXNzYWdlLCBlcnIpIHtcbiAgICBpZiAoZXJyICYmIGVyciBpbnN0YW5jZW9mIE1ldGVvci5FcnJvcikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICBmaWx0ZXJDb21tb25NZXRlb3JFcnJvcnMgKHR5cGUsIG1lc3NhZ2UpIHtcbiAgICBmb3IgKGxldCBsYyA9IDA7IGxjIDwgY29tbW9uRXJyUmVnRXhwcy5sZW5ndGg7IGxjKyspIHtcbiAgICAgIGNvbnN0IHJlZ0V4cCA9IGNvbW1vbkVyclJlZ0V4cHNbbGNdO1xuICAgICAgaWYgKHJlZ0V4cC50ZXN0KG1lc3NhZ2UpKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJldHJ5IH0gZnJvbSAnLi4vcmV0cnknO1xuXG5LYWRpcmEuc2VuZCA9IGZ1bmN0aW9uIChwYXlsb2FkLCBwYXRoLCBjYWxsYmFjaykge1xuICBpZiAoIUthZGlyYS5jb25uZWN0ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1lvdSBuZWVkIHRvIGNvbm5lY3Qgd2l0aCBLYWRpcmEgZmlyc3QsIGJlZm9yZSBzZW5kaW5nIG1lc3NhZ2VzIScpO1xuICB9XG5cbiAgcGF0aCA9IHBhdGguc3Vic3RyKDAsIDEpICE9PSAnLycgPyBgLyR7cGF0aH1gIDogcGF0aDtcbiAgbGV0IGVuZHBvaW50ID0gS2FkaXJhLm9wdGlvbnMuZW5kcG9pbnQgKyBwYXRoO1xuICBsZXQgcmV0cnlDb3VudCA9IDA7XG4gIGxldCByZXRyeSA9IG5ldyBSZXRyeSh7XG4gICAgbWluQ291bnQ6IDEsXG4gICAgbWluVGltZW91dDogMCxcbiAgICBiYXNlVGltZW91dDogMTAwMCAqIDUsXG4gICAgbWF4VGltZW91dDogMTAwMCAqIDYwLFxuICB9KTtcblxuICBsZXQgc2VuZEZ1bmN0aW9uID0gS2FkaXJhLl9nZXRTZW5kRnVuY3Rpb24oKTtcbiAgdHJ5VG9TZW5kKCk7XG5cbiAgZnVuY3Rpb24gdHJ5VG9TZW5kIChlcnIpIHtcbiAgICBpZiAocmV0cnlDb3VudCA8IDUpIHtcbiAgICAgIHJldHJ5LnJldHJ5TGF0ZXIocmV0cnlDb3VudCsrLCBzZW5kKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdFcnJvciBzZW5kaW5nIGVycm9yIHRyYWNlcyB0byBNb250aSBBUE0gc2VydmVyJyk7XG4gICAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzZW5kICgpIHtcbiAgICBzZW5kRnVuY3Rpb24oZW5kcG9pbnQsIHBheWxvYWQsIGZ1bmN0aW9uIChlcnIsIHJlcykge1xuICAgICAgaWYgKGVyciAmJiAhcmVzKSB7XG4gICAgICAgIHRyeVRvU2VuZChlcnIpO1xuICAgICAgfSBlbHNlIGlmIChyZXMuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcy5kYXRhKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjYWxsYmFjaykge1xuICAgICAgICBjYWxsYmFjayhuZXcgTWV0ZW9yLkVycm9yKHJlcy5zdGF0dXNDb2RlLCByZXMuY29udGVudCkpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59O1xuXG5LYWRpcmEuX2dldFNlbmRGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIE1ldGVvci5pc1NlcnZlciA/IEthZGlyYS5fc2VydmVyU2VuZCA6IEthZGlyYS5fY2xpZW50U2VuZDtcbn07XG5cbkthZGlyYS5fY2xpZW50U2VuZCA9IGZ1bmN0aW9uIChlbmRwb2ludCwgcGF5bG9hZCwgY2FsbGJhY2spIHtcbiAgS2FkaXJhLl9tYWtlSHR0cFJlcXVlc3QoJ1BPU1QnLCBlbmRwb2ludCwge1xuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICB9LFxuICAgIGNvbnRlbnQ6IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXG4gIH0sIGNhbGxiYWNrKTtcbn07XG5cbkthZGlyYS5fc2VydmVyU2VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdLYWRpcmEuX3NlcnZlclNlbmQgaXMgbm90IHN1cHBvcnRlZC4gVXNlIGNvcmVBcGkgaW5zdGVhZC4nKTtcbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gQmFzZUVycm9yTW9kZWwgKCkge1xuICB0aGlzLl9maWx0ZXJzID0gW107XG59XG5cbkJhc2VFcnJvck1vZGVsLnByb3RvdHlwZS5hZGRGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gIGlmICh0eXBlb2YgZmlsdGVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5fZmlsdGVycy5wdXNoKGZpbHRlcik7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdFcnJvciBmaWx0ZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cbn07XG5cbkJhc2VFcnJvck1vZGVsLnByb3RvdHlwZS5yZW1vdmVGaWx0ZXIgPSBmdW5jdGlvbiAoZmlsdGVyKSB7XG4gIGNvbnN0IGluZGV4ID0gdGhpcy5fZmlsdGVycy5pbmRleE9mKGZpbHRlcik7XG4gIGlmIChpbmRleCA+PSAwKSB7XG4gICAgdGhpcy5fZmlsdGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG59O1xuXG5CYXNlRXJyb3JNb2RlbC5wcm90b3R5cGUuYXBwbHlGaWx0ZXJzID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UsIGVycm9yLCBzdWJUeXBlKSB7XG4gIGZvciAobGV0IGxjID0gMDsgbGMgPCB0aGlzLl9maWx0ZXJzLmxlbmd0aDsgbGMrKykge1xuICAgIGxldCBmaWx0ZXIgPSB0aGlzLl9maWx0ZXJzW2xjXTtcbiAgICB0cnkge1xuICAgICAgbGV0IHZhbGlkYXRlZCA9IGZpbHRlcih0eXBlLCBtZXNzYWdlLCBlcnJvciwgc3ViVHlwZSk7XG4gICAgICBpZiAoIXZhbGlkYXRlZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIC8vIHdlIG5lZWQgdG8gcmVtb3ZlIHRoaXMgZmlsdGVyXG4gICAgICAvLyB3ZSBtYXkgZW5kZWQgdXAgaW4gYW4gZXJyb3IgY3ljbGVcbiAgICAgIHRoaXMuX2ZpbHRlcnMuc3BsaWNlKGxjLCAxKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcImFuIGVycm9yIHRocm93biBmcm9tIGEgZmlsdGVyIHlvdSd2ZSBzdXBsaWVkXCIsIGV4Lm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcbiIsImV4cG9ydCBmdW5jdGlvbiBLYWRpcmFNb2RlbCAoKSB7fVxuXG5LYWRpcmFNb2RlbC5wcm90b3R5cGUuX2dldERhdGVJZCA9IGZ1bmN0aW9uICh0aW1lc3RhbXApIHtcbiAgY29uc3QgcmVtYWluZGVyID0gdGltZXN0YW1wICUgKDEwMDAgKiA2MCk7XG4gIGNvbnN0IGRhdGVJZCA9IHRpbWVzdGFtcCAtIHJlbWFpbmRlcjtcbiAgcmV0dXJuIGRhdGVJZDtcbn07XG4iLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuY29uc3QgeyBERFNrZXRjaCB9ID0gcmVxdWlyZSgnbW9udGktYXBtLXNrZXRjaGVzLWpzJyk7XG5pbXBvcnQgeyBLYWRpcmFNb2RlbCB9IGZyb20gJy4vMG1vZGVsJztcbmltcG9ydCB7IFRyYWNlclN0b3JlIH0gZnJvbSAnLi4vdHJhY2VyL3RyYWNlcl9zdG9yZSc7XG5pbXBvcnQgeyBOdHAgfSBmcm9tICcuLi9udHAnO1xuXG5jb25zdCBNRVRIT0RfTUVUUklDU19GSUVMRFMgPSBbJ3dhaXQnLCAnZGInLCAnaHR0cCcsICdlbWFpbCcsICdhc3luYycsICdjb21wdXRlJywgJ3RvdGFsJ107XG5cbmV4cG9ydCBmdW5jdGlvbiBNZXRob2RzTW9kZWwgKG1ldHJpY3NUaHJlc2hvbGQpIHtcbiAgdGhpcy5tZXRob2RNZXRyaWNzQnlNaW51dGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICB0aGlzLmVycm9yTWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICB0aGlzLl9tZXRyaWNzVGhyZXNob2xkID0gXy5leHRlbmQoe1xuICAgIHdhaXQ6IDEwMCxcbiAgICBkYjogMTAwLFxuICAgIGh0dHA6IDEwMDAsXG4gICAgZW1haWw6IDEwMCxcbiAgICBhc3luYzogMTAwLFxuICAgIGNvbXB1dGU6IDEwMCxcbiAgICB0b3RhbDogMjAwXG4gIH0sIG1ldHJpY3NUaHJlc2hvbGQgfHwgT2JqZWN0LmNyZWF0ZShudWxsKSk7XG5cbiAgLy8gc3RvcmUgbWF4IHRpbWUgZWxhcHNlZCBtZXRob2RzIGZvciBlYWNoIG1ldGhvZCwgZXZlbnQobWV0cmljcy1maWVsZClcbiAgdGhpcy5tYXhFdmVudFRpbWVzRm9yTWV0aG9kcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgdGhpcy50cmFjZXJTdG9yZSA9IG5ldyBUcmFjZXJTdG9yZSh7XG4gICAgLy8gcHJvY2VzcyB0cmFjZXMgZXZlcnkgbWludXRlXG4gICAgaW50ZXJ2YWw6IDEwMDAgKiA2MCxcbiAgICAvLyBmb3IgMzAgbWludXRlc1xuICAgIG1heFRvdGFsUG9pbnRzOiAzMCxcbiAgICAvLyBhbHdheXMgdHJhY2UgZm9yIGV2ZXJ5IDUgbWludXRlc1xuICAgIGFyY2hpdmVFdmVyeTogNVxuICB9KTtcblxuICB0aGlzLnRyYWNlclN0b3JlLnN0YXJ0KCk7XG59XG5cbl8uZXh0ZW5kKE1ldGhvZHNNb2RlbC5wcm90b3R5cGUsIEthZGlyYU1vZGVsLnByb3RvdHlwZSk7XG5cbk1ldGhvZHNNb2RlbC5wcm90b3R5cGUuX2dldE1ldHJpY3MgPSBmdW5jdGlvbiAodGltZXN0YW1wLCBtZXRob2QpIHtcbiAgY29uc3QgZGF0ZUlkID0gdGhpcy5fZ2V0RGF0ZUlkKHRpbWVzdGFtcCk7XG5cbiAgaWYgKCF0aGlzLm1ldGhvZE1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdKSB7XG4gICAgdGhpcy5tZXRob2RNZXRyaWNzQnlNaW51dGVbZGF0ZUlkXSA9IHtcbiAgICAgIG1ldGhvZHM6IE9iamVjdC5jcmVhdGUobnVsbCksXG4gICAgfTtcbiAgfVxuXG4gIGxldCBtZXRob2RzID0gdGhpcy5tZXRob2RNZXRyaWNzQnlNaW51dGVbZGF0ZUlkXS5tZXRob2RzO1xuXG4gIC8vIGluaXRpYWxpemUgbWV0aG9kXG4gIGlmICghbWV0aG9kc1ttZXRob2RdKSB7XG4gICAgbWV0aG9kc1ttZXRob2RdID0ge1xuICAgICAgY291bnQ6IDAsXG4gICAgICBlcnJvcnM6IDAsXG4gICAgICBmZXRjaGVkRG9jU2l6ZTogMCxcbiAgICAgIHNlbnRNc2dTaXplOiAwLFxuICAgICAgaGlzdG9ncmFtOiBuZXcgRERTa2V0Y2goe1xuICAgICAgICBhbHBoYTogMC4wMlxuICAgICAgfSlcbiAgICB9O1xuXG4gICAgTUVUSE9EX01FVFJJQ1NfRklFTERTLmZvckVhY2goZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICBtZXRob2RzW21ldGhvZF1bZmllbGRdID0gMDtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLm1ldGhvZE1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdLm1ldGhvZHNbbWV0aG9kXTtcbn07XG5cbk1ldGhvZHNNb2RlbC5wcm90b3R5cGUucHJvY2Vzc01ldGhvZCA9IGZ1bmN0aW9uIChtZXRob2RUcmFjZSkge1xuICBjb25zdCBkYXRlSWQgPSB0aGlzLl9nZXREYXRlSWQobWV0aG9kVHJhY2UuYXQpO1xuXG4gIC8vIGFwcGVuZCBtZXRyaWNzIHRvIHByZXZpb3VzIHZhbHVlc1xuICB0aGlzLl9hcHBlbmRNZXRyaWNzKGRhdGVJZCwgbWV0aG9kVHJhY2UpO1xuICBpZiAobWV0aG9kVHJhY2UuZXJyb3JlZCkge1xuICAgIHRoaXMubWV0aG9kTWV0cmljc0J5TWludXRlW2RhdGVJZF0ubWV0aG9kc1ttZXRob2RUcmFjZS5uYW1lXS5lcnJvcnMrKztcbiAgfVxuXG4gIHRoaXMudHJhY2VyU3RvcmUuYWRkVHJhY2UobWV0aG9kVHJhY2UpO1xufTtcblxuTWV0aG9kc01vZGVsLnByb3RvdHlwZS5fYXBwZW5kTWV0cmljcyA9IGZ1bmN0aW9uIChpZCwgbWV0aG9kVHJhY2UpIHtcbiAgY29uc3QgbWV0aG9kTWV0cmljcyA9IHRoaXMuX2dldE1ldHJpY3MoaWQsIG1ldGhvZFRyYWNlLm5hbWUpO1xuXG4gIC8vIHN0YXJ0VGltZSBuZWVkcyB0byBiZSBjb252ZXJ0ZWQgaW50byBzZXJ2ZXJUaW1lIGJlZm9yZSBzZW5kaW5nXG4gIGlmICghdGhpcy5tZXRob2RNZXRyaWNzQnlNaW51dGVbaWRdLnN0YXJ0VGltZSkge1xuICAgIHRoaXMubWV0aG9kTWV0cmljc0J5TWludXRlW2lkXS5zdGFydFRpbWUgPSBtZXRob2RUcmFjZS5hdDtcbiAgfVxuXG4gIC8vIG1lcmdlXG4gIE1FVEhPRF9NRVRSSUNTX0ZJRUxEUy5mb3JFYWNoKGZ1bmN0aW9uIChmaWVsZCkge1xuICAgIGxldCB2YWx1ZSA9IG1ldGhvZFRyYWNlLm1ldHJpY3NbZmllbGRdO1xuICAgIGlmICh2YWx1ZSA+IDApIHtcbiAgICAgIG1ldGhvZE1ldHJpY3NbZmllbGRdICs9IHZhbHVlO1xuICAgIH1cbiAgfSk7XG5cbiAgbWV0aG9kTWV0cmljcy5jb3VudCsrO1xuICBtZXRob2RNZXRyaWNzLmhpc3RvZ3JhbS5hZGQobWV0aG9kVHJhY2UubWV0cmljcy50b3RhbCk7XG4gIHRoaXMubWV0aG9kTWV0cmljc0J5TWludXRlW2lkXS5lbmRUaW1lID0gbWV0aG9kVHJhY2UubWV0cmljcy5hdDtcbn07XG5cbk1ldGhvZHNNb2RlbC5wcm90b3R5cGUudHJhY2tEb2NTaXplID0gZnVuY3Rpb24gKG1ldGhvZCwgc2l6ZSkge1xuICBjb25zdCB0aW1lc3RhbXAgPSBOdHAuX25vdygpO1xuICBjb25zdCBkYXRlSWQgPSB0aGlzLl9nZXREYXRlSWQodGltZXN0YW1wKTtcblxuICBsZXQgbWV0aG9kTWV0cmljcyA9IHRoaXMuX2dldE1ldHJpY3MoZGF0ZUlkLCBtZXRob2QpO1xuICBtZXRob2RNZXRyaWNzLmZldGNoZWREb2NTaXplICs9IHNpemU7XG59O1xuXG5NZXRob2RzTW9kZWwucHJvdG90eXBlLnRyYWNrTXNnU2l6ZSA9IGZ1bmN0aW9uIChtZXRob2QsIHNpemUpIHtcbiAgY29uc3QgdGltZXN0YW1wID0gTnRwLl9ub3coKTtcbiAgY29uc3QgZGF0ZUlkID0gdGhpcy5fZ2V0RGF0ZUlkKHRpbWVzdGFtcCk7XG5cbiAgbGV0IG1ldGhvZE1ldHJpY3MgPSB0aGlzLl9nZXRNZXRyaWNzKGRhdGVJZCwgbWV0aG9kKTtcbiAgbWV0aG9kTWV0cmljcy5zZW50TXNnU2l6ZSArPSBzaXplO1xufTtcblxuLypcbiAgVGhlcmUgYXJlIHR3byB0eXBlcyBvZiBkYXRhXG5cbiAgMS4gbWV0aG9kTWV0cmljcyAtIG1ldHJpY3MgYWJvdXQgdGhlIG1ldGhvZHMgKGZvciBldmVyeSAxMCBzZWNzKVxuICAyLiBtZXRob2RSZXF1ZXN0cyAtIHJhdyBtZXRob2QgcmVxdWVzdC4gbm9ybWFsbHkgbWF4LCBtaW4gZm9yIGV2ZXJ5IDEgbWluIGFuZCBlcnJvcnMgYWx3YXlzXG4qL1xuTWV0aG9kc01vZGVsLnByb3RvdHlwZS5idWlsZFBheWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgbWV0aG9kTWV0cmljczogW10sXG4gICAgbWV0aG9kUmVxdWVzdHM6IFtdXG4gIH07XG5cbiAgLy8gaGFuZGxpbmcgbWV0cmljc1xuICBsZXQgbWV0aG9kTWV0cmljc0J5TWludXRlID0gdGhpcy5tZXRob2RNZXRyaWNzQnlNaW51dGU7XG4gIHRoaXMubWV0aG9kTWV0cmljc0J5TWludXRlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvLyBjcmVhdGUgZmluYWwgcGF5bG9hZCBmb3IgbWV0aG9kTWV0cmljc1xuICBmb3IgKGxldCBrZXkgaW4gbWV0aG9kTWV0cmljc0J5TWludXRlKSB7XG4gICAgY29uc3QgbWV0aG9kTWV0cmljcyA9IG1ldGhvZE1ldHJpY3NCeU1pbnV0ZVtrZXldO1xuICAgIC8vIGNvbnZlcnRpbmcgc3RhcnRUaW1lIGludG8gdGhlIGFjdHVhbCBzZXJ2ZXJUaW1lXG4gICAgbGV0IHN0YXJ0VGltZSA9IG1ldGhvZE1ldHJpY3Muc3RhcnRUaW1lO1xuICAgIG1ldGhvZE1ldHJpY3Muc3RhcnRUaW1lID0gS2FkaXJhLnN5bmNlZERhdGUuc3luY1RpbWUoc3RhcnRUaW1lKTtcblxuICAgIGZvciAobGV0IG1ldGhvZE5hbWUgaW4gbWV0aG9kTWV0cmljcy5tZXRob2RzKSB7XG4gICAgICBNRVRIT0RfTUVUUklDU19GSUVMRFMuZm9yRWFjaChmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgICAgbWV0aG9kTWV0cmljcy5tZXRob2RzW21ldGhvZE5hbWVdW2ZpZWxkXSAvPVxuICAgICAgICAgIG1ldGhvZE1ldHJpY3MubWV0aG9kc1ttZXRob2ROYW1lXS5jb3VudDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHBheWxvYWQubWV0aG9kTWV0cmljcy5wdXNoKG1ldGhvZE1ldHJpY3NCeU1pbnV0ZVtrZXldKTtcbiAgfVxuXG4gIC8vIGNvbGxlY3QgdHJhY2VzIGFuZCBzZW5kIHRoZW0gd2l0aCB0aGUgcGF5bG9hZFxuICBwYXlsb2FkLm1ldGhvZFJlcXVlc3RzID0gdGhpcy50cmFjZXJTdG9yZS5jb2xsZWN0VHJhY2VzKCk7XG5cbiAgcmV0dXJuIHBheWxvYWQ7XG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuY29uc3QgbG9nZ2VyID0gTnBtLnJlcXVpcmUoJ2RlYnVnJykoJ2thZGlyYTpwdWJzdWInKTtcbmNvbnN0IHsgRERTa2V0Y2ggfSA9IHJlcXVpcmUoJ21vbnRpLWFwbS1za2V0Y2hlcy1qcycpO1xuaW1wb3J0IHsgS2FkaXJhTW9kZWwgfSBmcm9tICcuLzBtb2RlbCc7XG5pbXBvcnQgeyBUcmFjZXJTdG9yZSB9IGZyb20gJy4uL3RyYWNlci90cmFjZXJfc3RvcmUnO1xuaW1wb3J0IHsgTnRwIH0gZnJvbSAnLi4vbnRwJztcbmltcG9ydCB7Y291bnRLZXlzLCBnZXRQcm9wZXJ0eSwgaXRlcmF0ZX0gZnJvbSAnLi4vdXRpbHMnO1xuXG5leHBvcnQgZnVuY3Rpb24gUHVic3ViTW9kZWwgKCkge1xuICB0aGlzLm1ldHJpY3NCeU1pbnV0ZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHRoaXMuc3Vic2NyaXB0aW9ucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgdGhpcy50cmFjZXJTdG9yZSA9IG5ldyBUcmFjZXJTdG9yZSh7XG4gICAgLy8gcHJvY2VzcyB0cmFjZXMgZXZlcnkgbWludXRlXG4gICAgaW50ZXJ2YWw6IDEwMDAgKiA2MCxcbiAgICAvLyBmb3IgMzAgbWludXRlc1xuICAgIG1heFRvdGFsUG9pbnRzOiAzMCxcbiAgICAvLyBhbHdheXMgdHJhY2UgZm9yIGV2ZXJ5IDUgbWludXRlc1xuICAgIGFyY2hpdmVFdmVyeTogNVxuICB9KTtcblxuICB0aGlzLnRyYWNlclN0b3JlLnN0YXJ0KCk7XG59XG5cblB1YnN1Yk1vZGVsLnByb3RvdHlwZS5fdHJhY2tTdWIgPSBmdW5jdGlvbiAoc2Vzc2lvbiwgbXNnKSB7XG4gIGxvZ2dlcignU1VCOicsIHNlc3Npb24uaWQsIG1zZy5pZCwgbXNnLm5hbWUsIG1zZy5wYXJhbXMpO1xuICBsZXQgcHVibGljYXRpb24gPSB0aGlzLl9nZXRQdWJsaWNhdGlvbk5hbWUobXNnLm5hbWUpO1xuICBsZXQgdGltZXN0YW1wID0gTnRwLl9ub3coKTtcbiAgbGV0IG1ldHJpY3MgPSB0aGlzLl9nZXRNZXRyaWNzKHRpbWVzdGFtcCwgcHVibGljYXRpb24pO1xuXG4gIG1ldHJpY3Muc3VicysrO1xuICB0aGlzLnN1YnNjcmlwdGlvbnNbbXNnLmlkXSA9IHtcbiAgICAvLyBXZSB1c2UgbG9jYWxUaW1lIGhlcmUsIGJlY2F1c2Ugd2hlbiB3ZSB1c2VkIHN5bmVkVGltZSB3ZSBtaWdodCBnZXRcbiAgICAvLyBtaW51cyBvciBtb3JlIHRoYW4gd2UndmUgZXhwZWN0ZWRcbiAgICAvLyAgIChiZWZvcmUgc2VydmVyVGltZSBkaWZmIGNoYW5nZWQgb3ZlcnRpbWUpXG4gICAgc3RhcnRUaW1lOiB0aW1lc3RhbXAsXG4gICAgcHVibGljYXRpb24sXG4gICAgcGFyYW1zOiBtc2cucGFyYW1zLFxuICAgIGlkOiBtc2cuaWRcbiAgfTtcblxuICAvLyBzZXQgc2Vzc2lvbiBzdGFydGVkVGltZVxuICBzZXNzaW9uLl9zdGFydFRpbWUgPSBzZXNzaW9uLl9zdGFydFRpbWUgfHwgdGltZXN0YW1wO1xufTtcblxuXy5leHRlbmQoUHVic3ViTW9kZWwucHJvdG90eXBlLCBLYWRpcmFNb2RlbC5wcm90b3R5cGUpO1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUuX3RyYWNrVW5zdWIgPSBmdW5jdGlvbiAoc2Vzc2lvbiwgc3ViKSB7XG4gIGxvZ2dlcignVU5TVUI6Jywgc2Vzc2lvbi5pZCwgc3ViLl9zdWJzY3JpcHRpb25JZCk7XG4gIGxldCBwdWJsaWNhdGlvbiA9IHRoaXMuX2dldFB1YmxpY2F0aW9uTmFtZShzdWIuX25hbWUpO1xuICBsZXQgc3Vic2NyaXB0aW9uSWQgPSBzdWIuX3N1YnNjcmlwdGlvbklkO1xuICBsZXQgc3Vic2NyaXB0aW9uU3RhdGUgPSB0aGlzLnN1YnNjcmlwdGlvbnNbc3Vic2NyaXB0aW9uSWRdO1xuXG4gIGxldCBzdGFydFRpbWUgPSBudWxsO1xuICAvLyBzb21ldGltZSwgd2UgZG9uJ3QgaGF2ZSB0aGVzZSBzdGF0ZXNcbiAgaWYgKHN1YnNjcmlwdGlvblN0YXRlKSB7XG4gICAgc3RhcnRUaW1lID0gc3Vic2NyaXB0aW9uU3RhdGUuc3RhcnRUaW1lO1xuICB9IGVsc2Uge1xuICAgIC8vIGlmIHRoaXMgaXMgbnVsbCBzdWJzY3JpcHRpb24sIHdoaWNoIGlzIHN0YXJ0ZWQgYXV0b21hdGljYWxseVxuICAgIC8vIGhlbmNlLCB3ZSBkb24ndCBoYXZlIGEgc3RhdGVcbiAgICBzdGFydFRpbWUgPSBzZXNzaW9uLl9zdGFydFRpbWU7XG4gIH1cblxuICAvLyBpbiBjYXNlLCB3ZSBjYW4ndCBnZXQgdGhlIHN0YXJ0VGltZVxuICBpZiAoc3RhcnRUaW1lKSB7XG4gICAgbGV0IHRpbWVzdGFtcCA9IE50cC5fbm93KCk7XG4gICAgbGV0IG1ldHJpY3MgPSB0aGlzLl9nZXRNZXRyaWNzKHRpbWVzdGFtcCwgcHVibGljYXRpb24pO1xuICAgIC8vIHRyYWNrIHRoZSBjb3VudFxuICAgIGlmIChzdWIuX25hbWUgIT09IG51bGwpIHtcbiAgICAgIC8vIHdlIGNhbid0IHRyYWNrIHN1YnMgZm9yIGBudWxsYCBwdWJsaWNhdGlvbnMuXG4gICAgICAvLyBzbyB3ZSBzaG91bGQgbm90IHRyYWNrIHVuc3VicyB0b29cbiAgICAgIG1ldHJpY3MudW5zdWJzKys7XG4gICAgfVxuICAgIC8vIHVzZSB0aGUgY3VycmVudCBkYXRlIHRvIGdldCB0aGUgbGlmZVRpbWUgb2YgdGhlIHN1YnNjcmlwdGlvblxuICAgIG1ldHJpY3MubGlmZVRpbWUgKz0gdGltZXN0YW1wIC0gc3RhcnRUaW1lO1xuICAgIC8vIHRoaXMgaXMgcGxhY2Ugd2UgY2FuIGNsZWFuIHRoZSBzdWJzY3JpcHRpb25TdGF0ZSBpZiBleGlzdHNcbiAgICBkZWxldGUgdGhpcy5zdWJzY3JpcHRpb25zW3N1YnNjcmlwdGlvbklkXTtcbiAgfVxufTtcblxuUHVic3ViTW9kZWwucHJvdG90eXBlLl90cmFja1JlYWR5ID0gZnVuY3Rpb24gKHNlc3Npb24sIHN1YiwgdHJhY2UpIHtcbiAgbG9nZ2VyKCdSRUFEWTonLCBzZXNzaW9uLmlkLCBzdWIuX3N1YnNjcmlwdGlvbklkKTtcbiAgLy8gdXNlIHRoZSBjdXJyZW50IHRpbWUgdG8gdHJhY2sgdGhlIHJlc3BvbnNlIHRpbWVcbiAgbGV0IHB1YmxpY2F0aW9uID0gdGhpcy5fZ2V0UHVibGljYXRpb25OYW1lKHN1Yi5fbmFtZSk7XG4gIGxldCBzdWJzY3JpcHRpb25JZCA9IHN1Yi5fc3Vic2NyaXB0aW9uSWQ7XG4gIGxldCB0aW1lc3RhbXAgPSBOdHAuX25vdygpO1xuICBsZXQgbWV0cmljcyA9IHRoaXMuX2dldE1ldHJpY3ModGltZXN0YW1wLCBwdWJsaWNhdGlvbik7XG5cbiAgbGV0IHN1YnNjcmlwdGlvblN0YXRlID0gdGhpcy5zdWJzY3JpcHRpb25zW3N1YnNjcmlwdGlvbklkXTtcbiAgaWYgKHN1YnNjcmlwdGlvblN0YXRlICYmICFzdWJzY3JpcHRpb25TdGF0ZS5yZWFkeVRyYWNrZWQpIHtcbiAgICBsZXQgcmVzVGltZSA9IHRpbWVzdGFtcCAtIHN1YnNjcmlwdGlvblN0YXRlLnN0YXJ0VGltZTtcbiAgICBtZXRyaWNzLnJlc1RpbWUgKz0gcmVzVGltZTtcbiAgICBzdWJzY3JpcHRpb25TdGF0ZS5yZWFkeVRyYWNrZWQgPSB0cnVlO1xuICAgIG1ldHJpY3MuaGlzdG9ncmFtLmFkZChyZXNUaW1lKTtcbiAgfVxuXG4gIGlmICh0cmFjZSkge1xuICAgIHRoaXMudHJhY2VyU3RvcmUuYWRkVHJhY2UodHJhY2UpO1xuICB9XG59O1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUuX3RyYWNrRXJyb3IgPSBmdW5jdGlvbiAoc2Vzc2lvbiwgc3ViLCB0cmFjZSkge1xuICBsb2dnZXIoJ0VSUk9SOicsIHNlc3Npb24uaWQsIHN1Yi5fc3Vic2NyaXB0aW9uSWQpO1xuICAvLyB1c2UgdGhlIGN1cnJlbnQgdGltZSB0byB0cmFjayB0aGUgcmVzcG9uc2UgdGltZVxuICBsZXQgcHVibGljYXRpb24gPSB0aGlzLl9nZXRQdWJsaWNhdGlvbk5hbWUoc3ViLl9uYW1lKTtcbiAgbGV0IHRpbWVzdGFtcCA9IE50cC5fbm93KCk7XG4gIGxldCBtZXRyaWNzID0gdGhpcy5fZ2V0TWV0cmljcyh0aW1lc3RhbXAsIHB1YmxpY2F0aW9uKTtcblxuICBtZXRyaWNzLmVycm9ycysrO1xuXG4gIGlmICh0cmFjZSkge1xuICAgIHRoaXMudHJhY2VyU3RvcmUuYWRkVHJhY2UodHJhY2UpO1xuICB9XG59O1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUuX2dldE1ldHJpY3MgPSBmdW5jdGlvbiAodGltZXN0YW1wLCBwdWJsaWNhdGlvbikge1xuICBsZXQgZGF0ZUlkID0gdGhpcy5fZ2V0RGF0ZUlkKHRpbWVzdGFtcCk7XG5cbiAgaWYgKCF0aGlzLm1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdKSB7XG4gICAgdGhpcy5tZXRyaWNzQnlNaW51dGVbZGF0ZUlkXSA9IHtcbiAgICAgIC8vIHN0YXJ0VGltZSBuZWVkcyB0byBiZSBjb252ZXJ0IHRvIHNlcnZlclRpbWUgYmVmb3JlIHNlbmRpbmcgdG8gdGhlIHNlcnZlclxuICAgICAgc3RhcnRUaW1lOiB0aW1lc3RhbXAsXG4gICAgICBwdWJzOiBPYmplY3QuY3JlYXRlKG51bGwpXG4gICAgfTtcbiAgfVxuXG4gIGlmICghdGhpcy5tZXRyaWNzQnlNaW51dGVbZGF0ZUlkXS5wdWJzW3B1YmxpY2F0aW9uXSkge1xuICAgIHRoaXMubWV0cmljc0J5TWludXRlW2RhdGVJZF0ucHVic1twdWJsaWNhdGlvbl0gPSB7XG4gICAgICBzdWJzOiAwLFxuICAgICAgdW5zdWJzOiAwLFxuICAgICAgcmVzVGltZTogMCxcbiAgICAgIGFjdGl2ZVN1YnM6IDAsXG4gICAgICBhY3RpdmVEb2NzOiAwLFxuICAgICAgbGlmZVRpbWU6IDAsXG4gICAgICB0b3RhbE9ic2VydmVyczogMCxcbiAgICAgIGNhY2hlZE9ic2VydmVyczogMCxcbiAgICAgIGNyZWF0ZWRPYnNlcnZlcnM6IDAsXG4gICAgICBkZWxldGVkT2JzZXJ2ZXJzOiAwLFxuICAgICAgZXJyb3JzOiAwLFxuICAgICAgb2JzZXJ2ZXJMaWZldGltZTogMCxcbiAgICAgIHBvbGxlZERvY3VtZW50czogMCxcbiAgICAgIG9wbG9nVXBkYXRlZERvY3VtZW50czogMCxcbiAgICAgIG9wbG9nSW5zZXJ0ZWREb2N1bWVudHM6IDAsXG4gICAgICBvcGxvZ0RlbGV0ZWREb2N1bWVudHM6IDAsXG4gICAgICBpbml0aWFsbHlBZGRlZERvY3VtZW50czogMCxcbiAgICAgIGxpdmVBZGRlZERvY3VtZW50czogMCxcbiAgICAgIGxpdmVDaGFuZ2VkRG9jdW1lbnRzOiAwLFxuICAgICAgbGl2ZVJlbW92ZWREb2N1bWVudHM6IDAsXG4gICAgICBwb2xsZWREb2NTaXplOiAwLFxuICAgICAgZmV0Y2hlZERvY1NpemU6IDAsXG4gICAgICBpbml0aWFsbHlGZXRjaGVkRG9jU2l6ZTogMCxcbiAgICAgIGxpdmVGZXRjaGVkRG9jU2l6ZTogMCxcbiAgICAgIGluaXRpYWxseVNlbnRNc2dTaXplOiAwLFxuICAgICAgbGl2ZVNlbnRNc2dTaXplOiAwLFxuICAgICAgaGlzdG9ncmFtOiBuZXcgRERTa2V0Y2goe1xuICAgICAgICBhbHBoYTogMC4wMlxuICAgICAgfSlcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHRoaXMubWV0cmljc0J5TWludXRlW2RhdGVJZF0ucHVic1twdWJsaWNhdGlvbl07XG59O1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUuX2dldFB1YmxpY2F0aW9uTmFtZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gIHJldHVybiBuYW1lIHx8ICdudWxsKGF1dG9wdWJsaXNoKSc7XG59O1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUuX2dldFN1YnNjcmlwdGlvbkluZm8gPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBzZWxmID0gdGhpcztcbiAgbGV0IGFjdGl2ZVN1YnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICBsZXQgYWN0aXZlRG9jcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGxldCB0b3RhbE9ic2VydmVycyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGxldCBjYWNoZWRPYnNlcnZlcnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGl0ZXJhdGUoTWV0ZW9yLnNlcnZlci5zZXNzaW9ucywgc2Vzc2lvbiA9PiB7XG4gICAgaXRlcmF0ZShzZXNzaW9uLl9uYW1lZFN1YnMsIGNvdW50U3ViRGF0YSk7XG4gICAgaXRlcmF0ZShzZXNzaW9uLl91bml2ZXJzYWxTdWJzLCBjb3VudFN1YkRhdGEpO1xuICB9KTtcblxuICBsZXQgYXZnT2JzZXJ2ZXJSZXVzZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIF8uZWFjaCh0b3RhbE9ic2VydmVycywgZnVuY3Rpb24gKHZhbHVlLCBwdWJsaWNhdGlvbikge1xuICAgIGF2Z09ic2VydmVyUmV1c2VbcHVibGljYXRpb25dID0gY2FjaGVkT2JzZXJ2ZXJzW3B1YmxpY2F0aW9uXSAvIHRvdGFsT2JzZXJ2ZXJzW3B1YmxpY2F0aW9uXTtcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBhY3RpdmVTdWJzLFxuICAgIGFjdGl2ZURvY3MsXG4gICAgYXZnT2JzZXJ2ZXJSZXVzZVxuICB9O1xuXG4gIGZ1bmN0aW9uIGNvdW50U3ViRGF0YSAoc3ViKSB7XG4gICAgbGV0IHB1YmxpY2F0aW9uID0gc2VsZi5fZ2V0UHVibGljYXRpb25OYW1lKHN1Yi5fbmFtZSk7XG4gICAgY291bnRTdWJzY3JpcHRpb25zKHN1YiwgcHVibGljYXRpb24pO1xuICAgIGNvdW50RG9jdW1lbnRzKHN1YiwgcHVibGljYXRpb24pO1xuICAgIGNvdW50T2JzZXJ2ZXJzKHN1YiwgcHVibGljYXRpb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gY291bnRTdWJzY3JpcHRpb25zIChzdWIsIHB1YmxpY2F0aW9uKSB7XG4gICAgYWN0aXZlU3Vic1twdWJsaWNhdGlvbl0gPSBhY3RpdmVTdWJzW3B1YmxpY2F0aW9uXSB8fCAwO1xuICAgIGFjdGl2ZVN1YnNbcHVibGljYXRpb25dKys7XG4gIH1cblxuICBmdW5jdGlvbiBjb3VudERvY3VtZW50cyAoc3ViLCBwdWJsaWNhdGlvbikge1xuICAgIGFjdGl2ZURvY3NbcHVibGljYXRpb25dID0gYWN0aXZlRG9jc1twdWJsaWNhdGlvbl0gfHwgMDtcbiAgICBpdGVyYXRlKHN1Yi5fZG9jdW1lbnRzLCBjb2xsZWN0aW9uID0+IHtcbiAgICAgIGFjdGl2ZURvY3NbcHVibGljYXRpb25dICs9IGNvdW50S2V5cyhjb2xsZWN0aW9uKTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvdW50T2JzZXJ2ZXJzIChzdWIsIHB1YmxpY2F0aW9uKSB7XG4gICAgdG90YWxPYnNlcnZlcnNbcHVibGljYXRpb25dID0gdG90YWxPYnNlcnZlcnNbcHVibGljYXRpb25dIHx8IDA7XG4gICAgY2FjaGVkT2JzZXJ2ZXJzW3B1YmxpY2F0aW9uXSA9IGNhY2hlZE9ic2VydmVyc1twdWJsaWNhdGlvbl0gfHwgMDtcblxuICAgIHRvdGFsT2JzZXJ2ZXJzW3B1YmxpY2F0aW9uXSArPSBzdWIuX3RvdGFsT2JzZXJ2ZXJzO1xuICAgIGNhY2hlZE9ic2VydmVyc1twdWJsaWNhdGlvbl0gKz0gc3ViLl9jYWNoZWRPYnNlcnZlcnM7XG4gIH1cbn07XG5cblB1YnN1Yk1vZGVsLnByb3RvdHlwZS5idWlsZFBheWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBtZXRyaWNzQnlNaW51dGUgPSB0aGlzLm1ldHJpY3NCeU1pbnV0ZTtcbiAgdGhpcy5tZXRyaWNzQnlNaW51dGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGxldCBwYXlsb2FkID0ge1xuICAgIHB1Yk1ldHJpY3M6IFtdXG4gIH07XG5cbiAgbGV0IHN1YnNjcmlwdGlvbkRhdGEgPSB0aGlzLl9nZXRTdWJzY3JpcHRpb25JbmZvKCk7XG4gIGxldCBhY3RpdmVTdWJzID0gc3Vic2NyaXB0aW9uRGF0YS5hY3RpdmVTdWJzO1xuICBsZXQgYWN0aXZlRG9jcyA9IHN1YnNjcmlwdGlvbkRhdGEuYWN0aXZlRG9jcztcbiAgbGV0IGF2Z09ic2VydmVyUmV1c2UgPSBzdWJzY3JpcHRpb25EYXRhLmF2Z09ic2VydmVyUmV1c2U7XG5cbiAgLy8gdG8gdGhlIGF2ZXJhZ2luZ1xuICBmb3IgKGxldCBkYXRlSWQgaW4gbWV0cmljc0J5TWludXRlKSB7XG4gICAgbGV0IGRhdGVNZXRyaWNzID0gbWV0cmljc0J5TWludXRlW2RhdGVJZF07XG4gICAgLy8gV2UgbmVlZCB0byBjb252ZXJ0IHN0YXJ0VGltZSBpbnRvIGFjdHVhbCBzZXJ2ZXJUaW1lXG4gICAgZGF0ZU1ldHJpY3Muc3RhcnRUaW1lID0gS2FkaXJhLnN5bmNlZERhdGUuc3luY1RpbWUoZGF0ZU1ldHJpY3Muc3RhcnRUaW1lKTtcblxuICAgIGZvciAobGV0IHB1YmxpY2F0aW9uIGluIG1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdLnB1YnMpIHtcbiAgICAgIGxldCBzaW5nbGVQdWJNZXRyaWNzID0gbWV0cmljc0J5TWludXRlW2RhdGVJZF0ucHVic1twdWJsaWNhdGlvbl07XG4gICAgICAvLyBXZSBvbmx5IGNhbGN1bGF0ZSByZXNUaW1lIGZvciBuZXcgc3Vic2NyaXB0aW9uc1xuICAgICAgc2luZ2xlUHViTWV0cmljcy5yZXNUaW1lIC89IHNpbmdsZVB1Yk1ldHJpY3Muc3VicztcbiAgICAgIHNpbmdsZVB1Yk1ldHJpY3MucmVzVGltZSA9IHNpbmdsZVB1Yk1ldHJpY3MucmVzVGltZSB8fCAwO1xuICAgICAgLy8gV2Ugb25seSB0cmFjayBsaWZlVGltZSBpbiB0aGUgdW5zdWJzXG4gICAgICBzaW5nbGVQdWJNZXRyaWNzLmxpZmVUaW1lIC89IHNpbmdsZVB1Yk1ldHJpY3MudW5zdWJzO1xuICAgICAgc2luZ2xlUHViTWV0cmljcy5saWZlVGltZSA9IHNpbmdsZVB1Yk1ldHJpY3MubGlmZVRpbWUgfHwgMDtcblxuICAgICAgLy8gQ291bnQgdGhlIGF2ZXJhZ2UgZm9yIG9ic2VydmVyIGxpZmV0aW1lXG4gICAgICBpZiAoc2luZ2xlUHViTWV0cmljcy5kZWxldGVkT2JzZXJ2ZXJzID4gMCkge1xuICAgICAgICBzaW5nbGVQdWJNZXRyaWNzLm9ic2VydmVyTGlmZXRpbWUgLz0gc2luZ2xlUHViTWV0cmljcy5kZWxldGVkT2JzZXJ2ZXJzO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgdHdvIG9yIG1vcmUgZGF0ZUlkcywgd2Ugd2lsbCBiZSB1c2luZyB0aGUgY3VycmVudENvdW50IGZvciBhbGwgb2YgdGhlbS5cbiAgICAgIC8vIFdlIGNhbiBjb21lIHVwIHdpdGggYSBiZXR0ZXIgc29sdXRpb24gbGF0ZXIgb24uXG4gICAgICBzaW5nbGVQdWJNZXRyaWNzLmFjdGl2ZVN1YnMgPSBhY3RpdmVTdWJzW3B1YmxpY2F0aW9uXSB8fCAwO1xuICAgICAgc2luZ2xlUHViTWV0cmljcy5hY3RpdmVEb2NzID0gYWN0aXZlRG9jc1twdWJsaWNhdGlvbl0gfHwgMDtcbiAgICAgIHNpbmdsZVB1Yk1ldHJpY3MuYXZnT2JzZXJ2ZXJSZXVzZSA9IGF2Z09ic2VydmVyUmV1c2VbcHVibGljYXRpb25dIHx8IDA7XG4gICAgfVxuXG4gICAgcGF5bG9hZC5wdWJNZXRyaWNzLnB1c2gobWV0cmljc0J5TWludXRlW2RhdGVJZF0pO1xuICB9XG5cbiAgLy8gY29sbGVjdCB0cmFjZXMgYW5kIHNlbmQgdGhlbSB3aXRoIHRoZSBwYXlsb2FkXG4gIHBheWxvYWQucHViUmVxdWVzdHMgPSB0aGlzLnRyYWNlclN0b3JlLmNvbGxlY3RUcmFjZXMoKTtcblxuICByZXR1cm4gcGF5bG9hZDtcbn07XG5cblB1YnN1Yk1vZGVsLnByb3RvdHlwZS5pbmNyZW1lbnRIYW5kbGVDb3VudCA9IGZ1bmN0aW9uICh0cmFjZSwgaXNDYWNoZWQpIHtcbiAgbGV0IHRpbWVzdGFtcCA9IE50cC5fbm93KCk7XG4gIGxldCBwdWJsaWNhdGlvbk5hbWUgPSB0aGlzLl9nZXRQdWJsaWNhdGlvbk5hbWUodHJhY2UubmFtZSk7XG4gIGxldCBwdWJsaWNhdGlvbiA9IHRoaXMuX2dldE1ldHJpY3ModGltZXN0YW1wLCBwdWJsaWNhdGlvbk5hbWUpO1xuXG4gIGxldCBzZXNzaW9uID0gZ2V0UHJvcGVydHkoTWV0ZW9yLnNlcnZlci5zZXNzaW9ucywgdHJhY2Uuc2Vzc2lvbik7XG5cbiAgbGV0IHN1YjtcblxuICBpZiAoc2Vzc2lvbikge1xuICAgIHN1YiA9IGdldFByb3BlcnR5KHNlc3Npb24uX25hbWVkU3VicywgdHJhY2UuaWQpO1xuICAgIGlmIChzdWIpIHtcbiAgICAgIHN1Yi5fdG90YWxPYnNlcnZlcnMgPSBzdWIuX3RvdGFsT2JzZXJ2ZXJzIHx8IDA7XG4gICAgICBzdWIuX2NhY2hlZE9ic2VydmVycyA9IHN1Yi5fY2FjaGVkT2JzZXJ2ZXJzIHx8IDA7XG4gICAgfVxuICB9XG4gIC8vIG5vdCBzdXJlLCB3ZSBuZWVkIHRvIGRvIHRoaXM/IEJ1dCBJIGRvbid0IG5lZWQgdG8gYnJlYWsgdGhlIGhvd2V2ZXJcbiAgc3ViID0gc3ViIHx8IHtfdG90YWxPYnNlcnZlcnM6IDAgLCBfY2FjaGVkT2JzZXJ2ZXJzOiAwfTtcblxuICBwdWJsaWNhdGlvbi50b3RhbE9ic2VydmVycysrO1xuICBzdWIuX3RvdGFsT2JzZXJ2ZXJzKys7XG4gIGlmIChpc0NhY2hlZCkge1xuICAgIHB1YmxpY2F0aW9uLmNhY2hlZE9ic2VydmVycysrO1xuICAgIHN1Yi5fY2FjaGVkT2JzZXJ2ZXJzKys7XG4gIH1cbn07XG5cblB1YnN1Yk1vZGVsLnByb3RvdHlwZS50cmFja0NyZWF0ZWRPYnNlcnZlciA9IGZ1bmN0aW9uIChpbmZvKSB7XG4gIGxldCB0aW1lc3RhbXAgPSBOdHAuX25vdygpO1xuICBsZXQgcHVibGljYXRpb25OYW1lID0gdGhpcy5fZ2V0UHVibGljYXRpb25OYW1lKGluZm8ubmFtZSk7XG4gIGxldCBwdWJsaWNhdGlvbiA9IHRoaXMuX2dldE1ldHJpY3ModGltZXN0YW1wLCBwdWJsaWNhdGlvbk5hbWUpO1xuICBwdWJsaWNhdGlvbi5jcmVhdGVkT2JzZXJ2ZXJzKys7XG59O1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUudHJhY2tEZWxldGVkT2JzZXJ2ZXIgPSBmdW5jdGlvbiAoaW5mbykge1xuICBsZXQgdGltZXN0YW1wID0gTnRwLl9ub3coKTtcbiAgbGV0IHB1YmxpY2F0aW9uTmFtZSA9IHRoaXMuX2dldFB1YmxpY2F0aW9uTmFtZShpbmZvLm5hbWUpO1xuICBsZXQgcHVibGljYXRpb24gPSB0aGlzLl9nZXRNZXRyaWNzKHRpbWVzdGFtcCwgcHVibGljYXRpb25OYW1lKTtcbiAgcHVibGljYXRpb24uZGVsZXRlZE9ic2VydmVycysrO1xuICBwdWJsaWNhdGlvbi5vYnNlcnZlckxpZmV0aW1lICs9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gaW5mby5zdGFydFRpbWU7XG59O1xuXG5QdWJzdWJNb2RlbC5wcm90b3R5cGUudHJhY2tEb2N1bWVudENoYW5nZXMgPSBmdW5jdGlvbiAoaW5mbywgb3ApIHtcbiAgLy8gSXQncyBwb3NzaWJlbCB0aGF0IGluZm8gdG8gYmUgbnVsbFxuICAvLyBTcGVjaWFsbHkgd2hlbiBnZXR0aW5nIGNoYW5nZXMgYXQgdGhlIHZlcnkgYmVnaW5pbmcuXG4gIC8vIFRoaXMgbWF5IGJlIGZhbHNlLCBidXQgbmljZSB0byBoYXZlIGEgY2hlY2tcbiAgaWYgKCFpbmZvKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IHRpbWVzdGFtcCA9IE50cC5fbm93KCk7XG4gIGxldCBwdWJsaWNhdGlvbk5hbWUgPSB0aGlzLl9nZXRQdWJsaWNhdGlvbk5hbWUoaW5mby5uYW1lKTtcbiAgbGV0IHB1YmxpY2F0aW9uID0gdGhpcy5fZ2V0TWV0cmljcyh0aW1lc3RhbXAsIHB1YmxpY2F0aW9uTmFtZSk7XG4gIGlmIChvcC5vcCA9PT0gJ2QnKSB7XG4gICAgcHVibGljYXRpb24ub3Bsb2dEZWxldGVkRG9jdW1lbnRzKys7XG4gIH0gZWxzZSBpZiAob3Aub3AgPT09ICdpJykge1xuICAgIHB1YmxpY2F0aW9uLm9wbG9nSW5zZXJ0ZWREb2N1bWVudHMrKztcbiAgfSBlbHNlIGlmIChvcC5vcCA9PT0gJ3UnKSB7XG4gICAgcHVibGljYXRpb24ub3Bsb2dVcGRhdGVkRG9jdW1lbnRzKys7XG4gIH1cbn07XG5cblB1YnN1Yk1vZGVsLnByb3RvdHlwZS50cmFja1BvbGxlZERvY3VtZW50cyA9IGZ1bmN0aW9uIChpbmZvLCBjb3VudCkge1xuICBsZXQgdGltZXN0YW1wID0gTnRwLl9ub3coKTtcbiAgbGV0IHB1YmxpY2F0aW9uTmFtZSA9IHRoaXMuX2dldFB1YmxpY2F0aW9uTmFtZShpbmZvLm5hbWUpO1xuICBsZXQgcHVibGljYXRpb24gPSB0aGlzLl9nZXRNZXRyaWNzKHRpbWVzdGFtcCwgcHVibGljYXRpb25OYW1lKTtcbiAgcHVibGljYXRpb24ucG9sbGVkRG9jdW1lbnRzICs9IGNvdW50O1xufTtcblxuUHVic3ViTW9kZWwucHJvdG90eXBlLnRyYWNrTGl2ZVVwZGF0ZXMgPSBmdW5jdGlvbiAoaW5mbywgdHlwZSwgY291bnQpIHtcbiAgbGV0IHRpbWVzdGFtcCA9IE50cC5fbm93KCk7XG4gIGxldCBwdWJsaWNhdGlvbk5hbWUgPSB0aGlzLl9nZXRQdWJsaWNhdGlvbk5hbWUoaW5mby5uYW1lKTtcbiAgbGV0IHB1YmxpY2F0aW9uID0gdGhpcy5fZ2V0TWV0cmljcyh0aW1lc3RhbXAsIHB1YmxpY2F0aW9uTmFtZSk7XG5cbiAgaWYgKHR5cGUgPT09ICdfYWRkUHVibGlzaGVkJykge1xuICAgIHB1YmxpY2F0aW9uLmxpdmVBZGRlZERvY3VtZW50cyArPSBjb3VudDtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnX3JlbW92ZVB1Ymxpc2hlZCcpIHtcbiAgICBwdWJsaWNhdGlvbi5saXZlUmVtb3ZlZERvY3VtZW50cyArPSBjb3VudDtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnX2NoYW5nZVB1Ymxpc2hlZCcpIHtcbiAgICBwdWJsaWNhdGlvbi5saXZlQ2hhbmdlZERvY3VtZW50cyArPSBjb3VudDtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnX2luaXRpYWxBZGRzJykge1xuICAgIHB1YmxpY2F0aW9uLmluaXRpYWxseUFkZGVkRG9jdW1lbnRzICs9IGNvdW50O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignS2FkaXJhOiBVbmtub3duIGxpdmUgdXBkYXRlIHR5cGUnKTtcbiAgfVxufTtcblxuUHVic3ViTW9kZWwucHJvdG90eXBlLnRyYWNrRG9jU2l6ZSA9IGZ1bmN0aW9uIChuYW1lLCB0eXBlLCBzaXplKSB7XG4gIGxldCB0aW1lc3RhbXAgPSBOdHAuX25vdygpO1xuICBsZXQgcHVibGljYXRpb25OYW1lID0gdGhpcy5fZ2V0UHVibGljYXRpb25OYW1lKG5hbWUpO1xuICBsZXQgcHVibGljYXRpb24gPSB0aGlzLl9nZXRNZXRyaWNzKHRpbWVzdGFtcCwgcHVibGljYXRpb25OYW1lKTtcblxuICBpZiAodHlwZSA9PT0gJ3BvbGxlZEZldGNoZXMnKSB7XG4gICAgcHVibGljYXRpb24ucG9sbGVkRG9jU2l6ZSArPSBzaXplO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdsaXZlRmV0Y2hlcycpIHtcbiAgICBwdWJsaWNhdGlvbi5saXZlRmV0Y2hlZERvY1NpemUgKz0gc2l6ZTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnY3Vyc29yRmV0Y2hlcycpIHtcbiAgICBwdWJsaWNhdGlvbi5mZXRjaGVkRG9jU2l6ZSArPSBzaXplO1xuICB9IGVsc2UgaWYgKHR5cGUgPT09ICdpbml0aWFsRmV0Y2hlcycpIHtcbiAgICBwdWJsaWNhdGlvbi5pbml0aWFsbHlGZXRjaGVkRG9jU2l6ZSArPSBzaXplO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignS2FkaXJhOiBVbmtub3duIGRvY3MgZmV0Y2hlZCB0eXBlJyk7XG4gIH1cbn07XG5cblB1YnN1Yk1vZGVsLnByb3RvdHlwZS50cmFja01zZ1NpemUgPSBmdW5jdGlvbiAobmFtZSwgdHlwZSwgc2l6ZSkge1xuICBsZXQgdGltZXN0YW1wID0gTnRwLl9ub3coKTtcbiAgbGV0IHB1YmxpY2F0aW9uTmFtZSA9IHRoaXMuX2dldFB1YmxpY2F0aW9uTmFtZShuYW1lKTtcbiAgbGV0IHB1YmxpY2F0aW9uID0gdGhpcy5fZ2V0TWV0cmljcyh0aW1lc3RhbXAsIHB1YmxpY2F0aW9uTmFtZSk7XG5cbiAgaWYgKHR5cGUgPT09ICdsaXZlU2VudCcpIHtcbiAgICBwdWJsaWNhdGlvbi5saXZlU2VudE1zZ1NpemUgKz0gc2l6ZTtcbiAgfSBlbHNlIGlmICh0eXBlID09PSAnaW5pdGlhbFNlbnQnKSB7XG4gICAgcHVibGljYXRpb24uaW5pdGlhbGx5U2VudE1zZ1NpemUgKz0gc2l6ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0thZGlyYTogVW5rbm93biBkb2NzIGZldGNoZWQgdHlwZScpO1xuICB9XG59O1xuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgY291bnRLZXlzLCBjcmVhdGVIaXN0b2dyYW0gfSBmcm9tICcuLi91dGlscy5qcyc7XG5pbXBvcnQgR0NNZXRyaWNzIGZyb20gJy4uL2hpamFjay9nYy5qcyc7XG5pbXBvcnQgeyBnZXRGaWJlck1ldHJpY3MsIHJlc2V0RmliZXJNZXRyaWNzIH0gZnJvbSAnLi4vaGlqYWNrL2FzeW5jLmpzJztcbmltcG9ydCB7IGdldE1vbmdvRHJpdmVyU3RhdHMsIHJlc2V0TW9uZ29Ecml2ZXJTdGF0cyB9IGZyb20gJy4uL2hpamFjay9tb25nb19kcml2ZXJfZXZlbnRzLmpzJztcbmltcG9ydCB7IEthZGlyYU1vZGVsIH0gZnJvbSAnLi8wbW9kZWwnO1xuaW1wb3J0IHsgRXZlbnRMb29wTW9uaXRvciB9IGZyb20gJy4uL2V2ZW50X2xvb3BfbW9uaXRvci5qcyc7XG5pbXBvcnQgeyBOdHAgfSBmcm9tICcuLi9udHAnO1xuXG5leHBvcnQgZnVuY3Rpb24gU3lzdGVtTW9kZWwgKCkge1xuICB0aGlzLnN0YXJ0VGltZSA9IE50cC5fbm93KCk7XG4gIHRoaXMubmV3U2Vzc2lvbnMgPSAwO1xuICAvLyAzMCBtaW5cbiAgdGhpcy5zZXNzaW9uVGltZW91dCA9IDEwMDAgKiA2MCAqIDMwO1xuXG4gIHRoaXMuZXZsb29wSGlzdG9ncmFtID0gY3JlYXRlSGlzdG9ncmFtKCk7XG4gIHRoaXMuZXZsb29wTW9uaXRvciA9IG5ldyBFdmVudExvb3BNb25pdG9yKDIwMCk7XG4gIHRoaXMuZXZsb29wTW9uaXRvci5zdGFydCgpO1xuICB0aGlzLmV2bG9vcE1vbml0b3Iub24oJ2xhZycsIGxhZyA9PiB7XG4gICAgLy8gc3RvcmUgYXMgbWljcm9zZWNvbmRcbiAgICB0aGlzLmV2bG9vcEhpc3RvZ3JhbS5hZGQobGFnICogMTAwMCk7XG4gIH0pO1xuXG4gIHRoaXMuZ2NNZXRyaWNzID0gbmV3IEdDTWV0cmljcygpO1xuICB0aGlzLmdjTWV0cmljcy5zdGFydCgpO1xuXG5cbiAgdGhpcy5jcHVUaW1lID0gcHJvY2Vzcy5ocnRpbWUoKTtcbiAgdGhpcy5wcmV2aW91c0NwdVVzYWdlID0gcHJvY2Vzcy5jcHVVc2FnZSgpO1xuICB0aGlzLmNwdUhpc3RvcnkgPSBbXTtcbiAgdGhpcy5jdXJyZW50Q3B1VXNhZ2UgPSAwO1xuXG4gIHNldEludGVydmFsKCgpID0+IHtcbiAgICB0aGlzLmNwdVVzYWdlKCk7XG4gIH0sIDIwMDApO1xufVxuXG5fLmV4dGVuZChTeXN0ZW1Nb2RlbC5wcm90b3R5cGUsIEthZGlyYU1vZGVsLnByb3RvdHlwZSk7XG5cblN5c3RlbU1vZGVsLnByb3RvdHlwZS5idWlsZFBheWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGxldCBtZXRyaWNzID0ge307XG4gIGxldCBub3cgPSBOdHAuX25vdygpO1xuICBtZXRyaWNzLnN0YXJ0VGltZSA9IEthZGlyYS5zeW5jZWREYXRlLnN5bmNUaW1lKHRoaXMuc3RhcnRUaW1lKTtcbiAgbWV0cmljcy5lbmRUaW1lID0gS2FkaXJhLnN5bmNlZERhdGUuc3luY1RpbWUobm93KTtcbiAgbWV0cmljcy5zZXNzaW9ucyA9IGNvdW50S2V5cyhNZXRlb3Iuc2VydmVyLnNlc3Npb25zKTtcblxuICBsZXQgbWVtb3J5VXNhZ2UgPSBwcm9jZXNzLm1lbW9yeVVzYWdlKCk7XG4gIG1ldHJpY3MubWVtb3J5ID0gbWVtb3J5VXNhZ2UucnNzIC8gKDEwMjQgKiAxMDI0KTtcbiAgbWV0cmljcy5tZW1vcnlBcnJheUJ1ZmZlcnMgPSAobWVtb3J5VXNhZ2UuYXJyYXlCdWZmZXJzIHx8IDApIC8gKDEwMjQgKiAxMDI0KTtcbiAgbWV0cmljcy5tZW1vcnlFeHRlcm5hbCA9IG1lbW9yeVVzYWdlLmV4dGVybmFsIC8gKDEwMjQgKiAxMDI0KTtcbiAgbWV0cmljcy5tZW1vcnlIZWFwVXNlZCA9IG1lbW9yeVVzYWdlLmhlYXBVc2VkIC8gKDEwMjQgKiAxMDI0KTtcbiAgbWV0cmljcy5tZW1vcnlIZWFwVG90YWwgPSBtZW1vcnlVc2FnZS5oZWFwVG90YWwgLyAoMTAyNCAqIDEwMjQpO1xuXG4gIG1ldHJpY3MubmV3U2Vzc2lvbnMgPSB0aGlzLm5ld1Nlc3Npb25zO1xuICB0aGlzLm5ld1Nlc3Npb25zID0gMDtcblxuICBtZXRyaWNzLmFjdGl2ZVJlcXVlc3RzID0gcHJvY2Vzcy5fZ2V0QWN0aXZlUmVxdWVzdHMoKS5sZW5ndGg7XG4gIG1ldHJpY3MuYWN0aXZlSGFuZGxlcyA9IHByb2Nlc3MuX2dldEFjdGl2ZUhhbmRsZXMoKS5sZW5ndGg7XG5cbiAgLy8gdHJhY2sgZXZlbnRsb29wIG1ldHJpY3NcbiAgbWV0cmljcy5wY3RFdmxvb3BCbG9jayA9IHRoaXMuZXZsb29wTW9uaXRvci5zdGF0dXMoKS5wY3RCbG9jaztcbiAgbWV0cmljcy5ldmxvb3BIaXN0b2dyYW0gPSB0aGlzLmV2bG9vcEhpc3RvZ3JhbTtcbiAgdGhpcy5ldmxvb3BIaXN0b2dyYW0gPSBjcmVhdGVIaXN0b2dyYW0oKTtcblxuICBtZXRyaWNzLmdjTWFqb3JEdXJhdGlvbiA9IHRoaXMuZ2NNZXRyaWNzLm1ldHJpY3MuZ2NNYWpvcjtcbiAgbWV0cmljcy5nY01pbm9yRHVyYXRpb24gPSB0aGlzLmdjTWV0cmljcy5tZXRyaWNzLmdjTWlub3I7XG4gIG1ldHJpY3MuZ2NJbmNyZW1lbnRhbER1cmF0aW9uID0gdGhpcy5nY01ldHJpY3MubWV0cmljcy5nY0luY3JlbWVudGFsO1xuICBtZXRyaWNzLmdjV2Vha0NCRHVyYXRpb24gPSB0aGlzLmdjTWV0cmljcy5tZXRyaWNzLmdjV2Vha0NCO1xuICB0aGlzLmdjTWV0cmljcy5yZXNldCgpO1xuXG4gIGNvbnN0IGRyaXZlck1ldHJpY3MgPSBnZXRNb25nb0RyaXZlclN0YXRzKCk7XG4gIHJlc2V0TW9uZ29Ecml2ZXJTdGF0cygpO1xuXG4gIG1ldHJpY3MubW9uZ29Qb29sU2l6ZSA9IGRyaXZlck1ldHJpY3MucG9vbFNpemU7XG4gIG1ldHJpY3MubW9uZ29Qb29sUHJpbWFyeUNoZWNrb3V0cyA9IGRyaXZlck1ldHJpY3MucHJpbWFyeUNoZWNrb3V0cztcbiAgbWV0cmljcy5tb25nb1Bvb2xPdGhlckNoZWNrb3V0cyA9IGRyaXZlck1ldHJpY3Mub3RoZXJDaGVja291dHM7XG4gIG1ldHJpY3MubW9uZ29Qb29sQ2hlY2tvdXRUaW1lID0gZHJpdmVyTWV0cmljcy5jaGVja291dFRpbWU7XG4gIG1ldHJpY3MubW9uZ29Qb29sTWF4Q2hlY2tvdXRUaW1lID0gZHJpdmVyTWV0cmljcy5tYXhDaGVja291dFRpbWU7XG4gIG1ldHJpY3MubW9uZ29Qb29sUGVuZGluZyA9IGRyaXZlck1ldHJpY3MucGVuZGluZztcbiAgbWV0cmljcy5tb25nb1Bvb2xDaGVja2VkT3V0Q29ubmVjdGlvbnMgPSBkcml2ZXJNZXRyaWNzLmNoZWNrZWRPdXQ7XG4gIG1ldHJpY3MubW9uZ29Qb29sQ3JlYXRlZENvbm5lY3Rpb25zID0gZHJpdmVyTWV0cmljcy5jcmVhdGVkO1xuXG4gIGNvbnN0IGZpYmVyTWV0cmljcyA9IGdldEZpYmVyTWV0cmljcygpO1xuICByZXNldEZpYmVyTWV0cmljcygpO1xuICBtZXRyaWNzLmNyZWF0ZWRGaWJlcnMgPSBmaWJlck1ldHJpY3MuY3JlYXRlZDtcbiAgbWV0cmljcy5hY3RpdmVGaWJlcnMgPSBmaWJlck1ldHJpY3MuYWN0aXZlO1xuICBtZXRyaWNzLmZpYmVyUG9vbFNpemUgPSBmaWJlck1ldHJpY3MucG9vbFNpemU7XG5cbiAgbWV0cmljcy5wY3B1ID0gMDtcbiAgbWV0cmljcy5wY3B1VXNlciA9IDA7XG4gIG1ldHJpY3MucGNwdVN5c3RlbSA9IDA7XG5cbiAgaWYgKHRoaXMuY3B1SGlzdG9yeS5sZW5ndGggPiAwKSB7XG4gICAgbGV0IGxhc3RDcHVVc2FnZSA9IHRoaXMuY3B1SGlzdG9yeVt0aGlzLmNwdUhpc3RvcnkubGVuZ3RoIC0gMV07XG4gICAgbWV0cmljcy5wY3B1ID0gbGFzdENwdVVzYWdlLnVzYWdlICogMTAwO1xuICAgIG1ldHJpY3MucGNwdVVzZXIgPSBsYXN0Q3B1VXNhZ2UudXNlciAqIDEwMDtcbiAgICBtZXRyaWNzLnBjcHVTeXN0ZW0gPSBsYXN0Q3B1VXNhZ2Uuc3lzICogMTAwO1xuICB9XG5cbiAgbWV0cmljcy5jcHVIaXN0b3J5ID0gdGhpcy5jcHVIaXN0b3J5Lm1hcChlbnRyeSA9PiAoe1xuICAgIHRpbWU6IEthZGlyYS5zeW5jZWREYXRlLnN5bmNUaW1lKGVudHJ5LnRpbWUpLFxuICAgIHVzYWdlOiBlbnRyeS51c2FnZSxcbiAgICBzeXM6IGVudHJ5LnN5cyxcbiAgICB1c2VyOiBlbnRyeS51c2VyXG4gIH0pKTtcblxuICB0aGlzLmNwdUhpc3RvcnkgPSBbXTtcbiAgdGhpcy5zdGFydFRpbWUgPSBub3c7XG4gIHJldHVybiB7c3lzdGVtTWV0cmljczogW21ldHJpY3NdfTtcbn07XG5cbmZ1bmN0aW9uIGhydGltZVRvTVMgKGhydGltZSkge1xuICByZXR1cm4gaHJ0aW1lWzBdICogMTAwMCArIGhydGltZVsxXSAvIDEwMDAwMDA7XG59XG5cblN5c3RlbU1vZGVsLnByb3RvdHlwZS5jcHVVc2FnZSA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IGVsYXBUaW1lTVMgPSBocnRpbWVUb01TKHByb2Nlc3MuaHJ0aW1lKHRoaXMuY3B1VGltZSkpO1xuICBsZXQgZWxhcFVzYWdlID0gcHJvY2Vzcy5jcHVVc2FnZSh0aGlzLnByZXZpb3VzQ3B1VXNhZ2UpO1xuICBsZXQgZWxhcFVzZXJNUyA9IGVsYXBVc2FnZS51c2VyIC8gMTAwMDtcbiAgbGV0IGVsYXBTeXN0TVMgPSBlbGFwVXNhZ2Uuc3lzdGVtIC8gMTAwMDtcbiAgbGV0IHRvdGFsVXNhZ2VNUyA9IGVsYXBVc2VyTVMgKyBlbGFwU3lzdE1TO1xuICBsZXQgdG90YWxVc2FnZVBlcmNlbnQgPSB0b3RhbFVzYWdlTVMgLyBlbGFwVGltZU1TO1xuXG4gIHRoaXMuY3B1SGlzdG9yeS5wdXNoKHtcbiAgICB0aW1lOiBOdHAuX25vdygpLFxuICAgIHVzYWdlOiB0b3RhbFVzYWdlUGVyY2VudCxcbiAgICB1c2VyOiBlbGFwVXNlck1TIC8gZWxhcFRpbWVNUyxcbiAgICBzeXM6IGVsYXBTeXN0TVMgLyBlbGFwVXNhZ2Uuc3lzdGVtXG4gIH0pO1xuXG4gIHRoaXMuY3VycmVudENwdVVzYWdlID0gdG90YWxVc2FnZVBlcmNlbnQgKiAxMDA7XG4gIEthZGlyYS5kb2NTekNhY2hlLnNldFBjcHUodGhpcy5jdXJyZW50Q3B1VXNhZ2UpO1xuXG4gIHRoaXMuY3B1VGltZSA9IHByb2Nlc3MuaHJ0aW1lKCk7XG4gIHRoaXMucHJldmlvdXNDcHVVc2FnZSA9IHByb2Nlc3MuY3B1VXNhZ2UoKTtcbn07XG5cblN5c3RlbU1vZGVsLnByb3RvdHlwZS5oYW5kbGVTZXNzaW9uQWN0aXZpdHkgPSBmdW5jdGlvbiAobXNnLCBzZXNzaW9uKSB7XG4gIGlmIChtc2cubXNnID09PSAnY29ubmVjdCcgJiYgIW1zZy5zZXNzaW9uKSB7XG4gICAgdGhpcy5jb3VudE5ld1Nlc3Npb24oc2Vzc2lvbik7XG4gIH0gZWxzZSBpZiAoWydzdWInLCAnbWV0aG9kJ10uaW5kZXhPZihtc2cubXNnKSAhPT0gLTEpIHtcbiAgICBpZiAoIXRoaXMuaXNTZXNzaW9uQWN0aXZlKHNlc3Npb24pKSB7XG4gICAgICB0aGlzLmNvdW50TmV3U2Vzc2lvbihzZXNzaW9uKTtcbiAgICB9XG4gIH1cbiAgc2Vzc2lvbi5fYWN0aXZlQXQgPSBEYXRlLm5vdygpO1xufTtcblxuU3lzdGVtTW9kZWwucHJvdG90eXBlLmNvdW50TmV3U2Vzc2lvbiA9IGZ1bmN0aW9uIChzZXNzaW9uKSB7XG4gIGlmICghaXNMb2NhbEFkZHJlc3Moc2Vzc2lvbi5zb2NrZXQpKSB7XG4gICAgdGhpcy5uZXdTZXNzaW9ucysrO1xuICB9XG59O1xuXG5TeXN0ZW1Nb2RlbC5wcm90b3R5cGUuaXNTZXNzaW9uQWN0aXZlID0gZnVuY3Rpb24gKHNlc3Npb24pIHtcbiAgbGV0IGluYWN0aXZlVGltZSA9IERhdGUubm93KCkgLSBzZXNzaW9uLl9hY3RpdmVBdDtcbiAgcmV0dXJuIGluYWN0aXZlVGltZSA8IHRoaXMuc2Vzc2lvblRpbWVvdXQ7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbi8vIGh0dHA6Ly9yZWdleDEwMS5jb20vci9pRjN5UjMvMlxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVzZWxlc3MtZXNjYXBlXG5sZXQgaXNMb2NhbEhvc3RSZWdleCA9IC9eKD86LipcXC5sb2NhbHxsb2NhbGhvc3QpKD86XFw6XFxkKyk/fDEyNyg/OlxcLlxcZHsxLDN9KXszfXwxOTJcXC4xNjgoPzpcXC5cXGR7MSwzfSl7Mn18MTAoPzpcXC5cXGR7MSwzfSl7M318MTcyXFwuKD86MVs2LTldfDJcXGR8M1swLTFdKSg/OlxcLlxcZHsxLDN9KXsyfSQvO1xuXG4vLyBodHRwOi8vcmVnZXgxMDEuY29tL3IvaE01Z0Q4LzFcbmxldCBpc0xvY2FsQWRkcmVzc1JlZ2V4ID0gL14xMjcoPzpcXC5cXGR7MSwzfSl7M318MTkyXFwuMTY4KD86XFwuXFxkezEsM30pezJ9fDEwKD86XFwuXFxkezEsM30pezN9fDE3MlxcLig/OjFbNi05XXwyXFxkfDNbMC0xXSkoPzpcXC5cXGR7MSwzfSl7Mn0kLztcblxuZnVuY3Rpb24gaXNMb2NhbEFkZHJlc3MgKHNvY2tldCkge1xuICBsZXQgaG9zdCA9IHNvY2tldC5oZWFkZXJzWydob3N0J107XG4gIGlmIChob3N0KSB7XG4gICAgcmV0dXJuIGlzTG9jYWxIb3N0UmVnZXgudGVzdChob3N0KTtcbiAgfVxuICBsZXQgYWRkcmVzcyA9IHNvY2tldC5oZWFkZXJzWyd4LWZvcndhcmRlZC1mb3InXSB8fCBzb2NrZXQucmVtb3RlQWRkcmVzcztcbiAgaWYgKGFkZHJlc3MpIHtcbiAgICByZXR1cm4gaXNMb2NhbEFkZHJlc3NSZWdleC50ZXN0KGFkZHJlc3MpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgS2FkaXJhTW9kZWwgfSBmcm9tICcuLzBtb2RlbCc7XG5pbXBvcnQgeyBCYXNlRXJyb3JNb2RlbCB9IGZyb20gJy4vYmFzZV9lcnJvcic7XG5pbXBvcnQgeyBOdHAgfSBmcm9tICcuLi9udHAnO1xuXG5leHBvcnQgZnVuY3Rpb24gRXJyb3JNb2RlbCAoYXBwSWQpIHtcbiAgQmFzZUVycm9yTW9kZWwuY2FsbCh0aGlzKTtcbiAgdGhpcy5hcHBJZCA9IGFwcElkO1xuICB0aGlzLmVycm9ycyA9IHt9O1xuICB0aGlzLnN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gIHRoaXMubWF4RXJyb3JzID0gMTA7XG59XG5cbk9iamVjdC5hc3NpZ24oRXJyb3JNb2RlbC5wcm90b3R5cGUsIEthZGlyYU1vZGVsLnByb3RvdHlwZSk7XG5PYmplY3QuYXNzaWduKEVycm9yTW9kZWwucHJvdG90eXBlLCBCYXNlRXJyb3JNb2RlbC5wcm90b3R5cGUpO1xuXG5FcnJvck1vZGVsLnByb3RvdHlwZS5idWlsZFBheWxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IG1ldHJpY3MgPSBfLnZhbHVlcyh0aGlzLmVycm9ycyk7XG4gIHRoaXMuc3RhcnRUaW1lID0gTnRwLl9ub3coKTtcblxuICBtZXRyaWNzLmZvckVhY2goZnVuY3Rpb24gKG1ldHJpYykge1xuICAgIG1ldHJpYy5zdGFydFRpbWUgPSBLYWRpcmEuc3luY2VkRGF0ZS5zeW5jVGltZShtZXRyaWMuc3RhcnRUaW1lKTtcbiAgfSk7XG5cbiAgdGhpcy5lcnJvcnMgPSB7fTtcbiAgcmV0dXJuIHtlcnJvcnM6IG1ldHJpY3N9O1xufTtcblxuRXJyb3JNb2RlbC5wcm90b3R5cGUuZXJyb3JDb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIF8udmFsdWVzKHRoaXMuZXJyb3JzKS5sZW5ndGg7XG59O1xuXG5FcnJvck1vZGVsLnByb3RvdHlwZS50cmFja0Vycm9yID0gZnVuY3Rpb24gKGV4LCB0cmFjZSkge1xuICBjb25zdCBrZXkgPSBgJHt0cmFjZS50eXBlfToke2V4Lm1lc3NhZ2V9YDtcbiAgaWYgKHRoaXMuZXJyb3JzW2tleV0pIHtcbiAgICB0aGlzLmVycm9yc1trZXldLmNvdW50Kys7XG4gIH0gZWxzZSBpZiAodGhpcy5lcnJvckNvdW50KCkgPCB0aGlzLm1heEVycm9ycykge1xuICAgIGNvbnN0IGVycm9yRGVmID0gdGhpcy5fZm9ybWF0RXJyb3IoZXgsIHRyYWNlKTtcbiAgICBpZiAodGhpcy5hcHBseUZpbHRlcnMoZXJyb3JEZWYudHlwZSwgZXJyb3JEZWYubmFtZSwgZXgsIGVycm9yRGVmLnN1YlR5cGUpKSB7XG4gICAgICB0aGlzLmVycm9yc1trZXldID0gdGhpcy5fZm9ybWF0RXJyb3IoZXgsIHRyYWNlKTtcbiAgICB9XG4gIH1cbn07XG5cbkVycm9yTW9kZWwucHJvdG90eXBlLl9mb3JtYXRFcnJvciA9IGZ1bmN0aW9uIChleCwgdHJhY2UpIHtcbiAgY29uc3QgdGltZSA9IERhdGUubm93KCk7XG4gIGxldCBzdGFjayA9IGV4LnN0YWNrO1xuXG4gIC8vIHRvIGdldCBNZXRlb3IncyBFcnJvciBkZXRhaWxzXG4gIGlmIChleC5kZXRhaWxzKSB7XG4gICAgc3RhY2sgPSBgRGV0YWlsczogJHtleC5kZXRhaWxzfVxcclxcbiR7c3RhY2t9YDtcbiAgfVxuXG4gIC8vIFVwZGF0ZSB0cmFjZSdzIGVycm9yIGV2ZW50IHdpdGggdGhlIG5leHQgc3RhY2tcbiAgY29uc3QgZXJyb3JFdmVudCA9IHRyYWNlLmV2ZW50cyAmJiB0cmFjZS5ldmVudHNbdHJhY2UuZXZlbnRzLmxlbmd0aCAtIDFdO1xuICBjb25zdCBlcnJvck9iamVjdCA9IGVycm9yRXZlbnQgJiYgZXJyb3JFdmVudFsyXSAmJiBlcnJvckV2ZW50WzJdLmVycm9yO1xuXG4gIGlmIChlcnJvck9iamVjdCkge1xuICAgIGVycm9yT2JqZWN0LnN0YWNrID0gc3RhY2s7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGFwcElkOiB0aGlzLmFwcElkLFxuICAgIG5hbWU6IGV4Lm1lc3NhZ2UsXG4gICAgdHlwZTogdHJhY2UudHlwZSxcbiAgICBzdGFydFRpbWU6IHRpbWUsXG4gICAgc3ViVHlwZTogdHJhY2Uuc3ViVHlwZSB8fCB0cmFjZS5uYW1lLFxuICAgIHRyYWNlLFxuICAgIHN0YWNrczogW3tzdGFja31dLFxuICAgIGNvdW50OiAxXG4gIH07XG59O1xuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmNvbnN0IHsgRERTa2V0Y2ggfSA9IHJlcXVpcmUoJ21vbnRpLWFwbS1za2V0Y2hlcy1qcycpO1xuaW1wb3J0IHsgS2FkaXJhTW9kZWwgfSBmcm9tICcuLzBtb2RlbCc7XG5pbXBvcnQgeyBUcmFjZXJTdG9yZSB9IGZyb20gJy4uL3RyYWNlci90cmFjZXJfc3RvcmUnO1xuXG5jb25zdCBNRVRIT0RfTUVUUklDU19GSUVMRFMgPSBbJ2RiJywgJ2h0dHAnLCAnZW1haWwnLCAnYXN5bmMnLCAnY29tcHV0ZScsICd0b3RhbCcsICdmcyddO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBIdHRwTW9kZWwgKCkge1xuICB0aGlzLm1ldHJpY3NCeU1pbnV0ZSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIHRoaXMudHJhY2VyU3RvcmUgPSBuZXcgVHJhY2VyU3RvcmUoe1xuICAgIGludGVydmFsOiAxMDAwICogMTAsXG4gICAgbWF4VG90YWxQb2ludHM6IDMwLFxuICAgIGFyY2hpdmVFdmVyeTogMTBcbiAgfSk7XG5cbiAgdGhpcy50cmFjZXJTdG9yZS5zdGFydCgpO1xufVxuXG5fLmV4dGVuZChIdHRwTW9kZWwucHJvdG90eXBlLCBLYWRpcmFNb2RlbC5wcm90b3R5cGUpO1xuXG5IdHRwTW9kZWwucHJvdG90eXBlLnByb2Nlc3NSZXF1ZXN0ID0gZnVuY3Rpb24gKHRyYWNlLCByZXEsIHJlcykge1xuICBjb25zdCBkYXRlSWQgPSB0aGlzLl9nZXREYXRlSWQodHJhY2UuYXQpO1xuICB0aGlzLl9hcHBlbmRNZXRyaWNzKGRhdGVJZCwgdHJhY2UsIHJlcyk7XG4gIHRoaXMudHJhY2VyU3RvcmUuYWRkVHJhY2UodHJhY2UpO1xufTtcblxuSHR0cE1vZGVsLnByb3RvdHlwZS5fZ2V0TWV0cmljcyA9IGZ1bmN0aW9uICh0aW1lc3RhbXAsIHJvdXRlSWQpIHtcbiAgY29uc3QgZGF0ZUlkID0gdGhpcy5fZ2V0RGF0ZUlkKHRpbWVzdGFtcCk7XG5cbiAgaWYgKCF0aGlzLm1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdKSB7XG4gICAgdGhpcy5tZXRyaWNzQnlNaW51dGVbZGF0ZUlkXSA9IHtcbiAgICAgIHJvdXRlczogT2JqZWN0LmNyZWF0ZShudWxsKVxuICAgIH07XG4gIH1cblxuICBjb25zdCByb3V0ZXMgPSB0aGlzLm1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdLnJvdXRlcztcblxuICBpZiAoIXJvdXRlc1tyb3V0ZUlkXSkge1xuICAgIHJvdXRlc1tyb3V0ZUlkXSA9IHtcbiAgICAgIGhpc3RvZ3JhbTogbmV3IEREU2tldGNoKHtcbiAgICAgICAgYWxwaGE6IDAuMDIsXG4gICAgICB9KSxcbiAgICAgIGNvdW50OiAwLFxuICAgICAgZXJyb3JzOiAwLFxuICAgICAgc3RhdHVzQ29kZXM6IE9iamVjdC5jcmVhdGUobnVsbClcbiAgICB9O1xuXG4gICAgTUVUSE9EX01FVFJJQ1NfRklFTERTLmZvckVhY2goZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICByb3V0ZXNbcm91dGVJZF1bZmllbGRdID0gMDtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLm1ldHJpY3NCeU1pbnV0ZVtkYXRlSWRdLnJvdXRlc1tyb3V0ZUlkXTtcbn07XG5cbkh0dHBNb2RlbC5wcm90b3R5cGUuX2FwcGVuZE1ldHJpY3MgPSBmdW5jdGlvbiAoZGF0ZUlkLCB0cmFjZSwgcmVzKSB7XG4gIGxldCByZXF1ZXN0TWV0cmljcyA9IHRoaXMuX2dldE1ldHJpY3MoZGF0ZUlkLCB0cmFjZS5uYW1lKTtcblxuICBpZiAoIXRoaXMubWV0cmljc0J5TWludXRlW2RhdGVJZF0uc3RhcnRUaW1lKSB7XG4gICAgdGhpcy5tZXRyaWNzQnlNaW51dGVbZGF0ZUlkXS5zdGFydFRpbWUgPSB0cmFjZS5hdDtcbiAgfVxuXG4gIC8vIG1lcmdlXG4gIE1FVEhPRF9NRVRSSUNTX0ZJRUxEUy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICBsZXQgdmFsdWUgPSB0cmFjZS5tZXRyaWNzW2ZpZWxkXTtcbiAgICBpZiAodmFsdWUgPiAwKSB7XG4gICAgICByZXF1ZXN0TWV0cmljc1tmaWVsZF0gKz0gdmFsdWU7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCBzdGF0dXNDb2RlID0gcmVzLnN0YXR1c0NvZGU7XG4gIGxldCBzdGF0dXNNZXRyaWM7XG5cbiAgaWYgKHN0YXR1c0NvZGUgPCAyMDApIHtcbiAgICBzdGF0dXNNZXRyaWMgPSAnMXh4JztcbiAgfSBlbHNlIGlmIChzdGF0dXNDb2RlIDwgMzAwKSB7XG4gICAgc3RhdHVzTWV0cmljID0gJzJ4eCc7XG4gIH0gZWxzZSBpZiAoc3RhdHVzQ29kZSA8IDQwMCkge1xuICAgIHN0YXR1c01ldHJpYyA9ICczeHgnO1xuICB9IGVsc2UgaWYgKHN0YXR1c0NvZGUgPCA1MDApIHtcbiAgICBzdGF0dXNNZXRyaWMgPSAnNHh4JztcbiAgfSBlbHNlIGlmIChzdGF0dXNDb2RlIDwgNjAwKSB7XG4gICAgc3RhdHVzTWV0cmljID0gJzV4eCc7XG4gIH1cblxuICByZXF1ZXN0TWV0cmljcy5zdGF0dXNDb2Rlc1tzdGF0dXNNZXRyaWNdID0gcmVxdWVzdE1ldHJpY3Muc3RhdHVzQ29kZXNbc3RhdHVzTWV0cmljXSB8fCAwO1xuICByZXF1ZXN0TWV0cmljcy5zdGF0dXNDb2Rlc1tzdGF0dXNNZXRyaWNdICs9IDE7XG5cbiAgcmVxdWVzdE1ldHJpY3MuY291bnQgKz0gMTtcbiAgcmVxdWVzdE1ldHJpY3MuaGlzdG9ncmFtLmFkZCh0cmFjZS5tZXRyaWNzLnRvdGFsKTtcbiAgdGhpcy5tZXRyaWNzQnlNaW51dGVbZGF0ZUlkXS5lbmRUaW1lID0gdHJhY2UubWV0cmljcy5hdDtcbn07XG5cbkh0dHBNb2RlbC5wcm90b3R5cGUuYnVpbGRQYXlsb2FkID0gZnVuY3Rpb24gKCkge1xuICBsZXQgcGF5bG9hZCA9IHtcbiAgICBodHRwTWV0cmljczogW10sXG4gICAgaHR0cFJlcXVlc3RzOiBbXVxuICB9O1xuXG4gIGxldCBtZXRyaWNzQnlNaW51dGUgPSB0aGlzLm1ldHJpY3NCeU1pbnV0ZTtcbiAgdGhpcy5tZXRyaWNzQnlNaW51dGUgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gIGZvciAobGV0IGtleSBpbiBtZXRyaWNzQnlNaW51dGUpIHtcbiAgICBjb25zdCBtZXRyaWNzID0gbWV0cmljc0J5TWludXRlW2tleV07XG4gICAgLy8gY29udmVydCBzdGFydFRpbWUgaW50byB0aGUgYWN0dWFsIHNlcnZlclRpbWVcbiAgICBsZXQgc3RhcnRUaW1lID0gbWV0cmljcy5zdGFydFRpbWU7XG4gICAgbWV0cmljcy5zdGFydFRpbWUgPSBLYWRpcmEuc3luY2VkRGF0ZS5zeW5jVGltZShzdGFydFRpbWUpO1xuXG4gICAgZm9yIChsZXQgcmVxdWVzdE5hbWUgaW4gbWV0cmljcy5yb3V0ZXMpIHtcbiAgICAgIE1FVEhPRF9NRVRSSUNTX0ZJRUxEUy5mb3JFYWNoKGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICBtZXRyaWNzLnJvdXRlc1tyZXF1ZXN0TmFtZV1bZmllbGRdIC89IG1ldHJpY3Mucm91dGVzW3JlcXVlc3ROYW1lXS5jb3VudDtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHBheWxvYWQuaHR0cE1ldHJpY3MucHVzaChtZXRyaWNzQnlNaW51dGVba2V5XSk7XG4gIH1cblxuICBwYXlsb2FkLmh0dHBSZXF1ZXN0cyA9IHRoaXMudHJhY2VyU3RvcmUuY29sbGVjdFRyYWNlcygpO1xuXG4gIHJldHVybiBwYXlsb2FkO1xufTtcbiIsImxldCBKb2JzID0gS2FkaXJhLkpvYnMgPSB7fTtcblxuSm9icy5nZXRBc3luYyA9IGZ1bmN0aW9uIChpZCwgY2FsbGJhY2spIHtcbiAgS2FkaXJhLmNvcmVBcGkuZ2V0Sm9iKGlkKVxuICAgIC50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBjYWxsYmFjayhudWxsLCBkYXRhKTtcbiAgICB9KVxuICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBjYWxsYmFjayhlcnIpO1xuICAgIH0pO1xufTtcblxuXG5Kb2JzLnNldEFzeW5jID0gZnVuY3Rpb24gKGlkLCBjaGFuZ2VzLCBjYWxsYmFjaykge1xuICBLYWRpcmEuY29yZUFwaS51cGRhdGVKb2IoaWQsIGNoYW5nZXMpXG4gICAgLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGNhbGxiYWNrKG51bGwsIGRhdGEpO1xuICAgIH0pXG4gICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgfSk7XG59O1xuXG5Kb2JzLnNldCA9IEthZGlyYS5fd3JhcEFzeW5jKEpvYnMuc2V0QXN5bmMpO1xuSm9icy5nZXQgPSBLYWRpcmEuX3dyYXBBc3luYyhKb2JzLmdldEFzeW5jKTtcbiIsImltcG9ydCB7IFJhbmRvbSB9IGZyb20gJ21ldGVvci9yYW5kb20nO1xuXG4vLyBSZXRyeSBsb2dpYyB3aXRoIGFuIGV4cG9uZW50aWFsIGJhY2tvZmYuXG4vL1xuLy8gb3B0aW9uczpcbi8vICBiYXNlVGltZW91dDogdGltZSBmb3IgaW5pdGlhbCByZWNvbm5lY3QgYXR0ZW1wdCAobXMpLlxuLy8gIGV4cG9uZW50OiBleHBvbmVudGlhbCBmYWN0b3IgdG8gaW5jcmVhc2UgdGltZW91dCBlYWNoIGF0dGVtcHQuXG4vLyAgbWF4VGltZW91dDogbWF4aW11bSB0aW1lIGJldHdlZW4gcmV0cmllcyAobXMpLlxuLy8gIG1pbkNvdW50OiBob3cgbWFueSB0aW1lcyB0byByZWNvbm5lY3QgXCJpbnN0YW50bHlcIi5cbi8vICBtaW5UaW1lb3V0OiB0aW1lIHRvIHdhaXQgZm9yIHRoZSBmaXJzdCBgbWluQ291bnRgIHJldHJpZXMgKG1zKS5cbi8vICBmdXp6OiBmYWN0b3IgdG8gcmFuZG9taXplIHJldHJ5IHRpbWVzIGJ5ICh0byBhdm9pZCByZXRyeSBzdG9ybXMpLlxuXG4vLyBUT0RPOiByZW1vdmUgdGhpcyBjbGFzcyBhbmQgdXNlIE1ldGVvciBSZXRyeSBpbiBhIGxhdGVyIHZlcnNpb24gb2YgbWV0ZW9yLlxuXG5leHBvcnQgY2xhc3MgUmV0cnkge1xuICBjb25zdHJ1Y3RvciAoe1xuICAgIC8vIDEgc2Vjb25kXG4gICAgYmFzZVRpbWVvdXQgPSAxMDAwLFxuICAgIGV4cG9uZW50ID0gMi4yLFxuICAgIC8vIFRoZSBkZWZhdWx0IGlzIGhpZ2gtaXNoIHRvIGVuc3VyZSBhIHNlcnZlciBjYW4gcmVjb3ZlciBmcm9tIGFcbiAgICAvLyBmYWlsdXJlIGNhdXNlZCBieSBsb2FkLlxuICAgIC8vIDUgbWludXRlc1xuICAgIG1heFRpbWVvdXQgPSA1ICogNjAwMDAsXG4gICAgbWluVGltZW91dCA9IDEwLFxuICAgIG1pbkNvdW50ID0gMixcbiAgICAvLyArLSAyNSVcbiAgICBmdXp6ID0gMC41LFxuICB9ID0ge30pIHtcbiAgICB0aGlzLmJhc2VUaW1lb3V0ID0gYmFzZVRpbWVvdXQ7XG4gICAgdGhpcy5leHBvbmVudCA9IGV4cG9uZW50O1xuICAgIHRoaXMubWF4VGltZW91dCA9IG1heFRpbWVvdXQ7XG4gICAgdGhpcy5taW5UaW1lb3V0ID0gbWluVGltZW91dDtcbiAgICB0aGlzLm1pbkNvdW50ID0gbWluQ291bnQ7XG4gICAgdGhpcy5mdXp6ID0gZnV6ejtcbiAgICB0aGlzLnJldHJ5VGltZXIgPSBudWxsO1xuICB9XG5cbiAgLy8gUmVzZXQgYSBwZW5kaW5nIHJldHJ5LCBpZiBhbnkuXG4gIGNsZWFyICgpIHtcbiAgICBpZiAodGhpcy5yZXRyeVRpbWVyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5yZXRyeVRpbWVyKTtcbiAgICB9XG4gICAgdGhpcy5yZXRyeVRpbWVyID0gbnVsbDtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZSBob3cgbG9uZyB0byB3YWl0IGluIG1pbGxpc2Vjb25kcyB0byByZXRyeSwgYmFzZWQgb24gdGhlXG4gIC8vIGBjb3VudGAgb2Ygd2hpY2ggcmV0cnkgdGhpcyBpcy5cbiAgX3RpbWVvdXQgKGNvdW50KSB7XG4gICAgaWYgKGNvdW50IDwgdGhpcy5taW5Db3VudCkge1xuICAgICAgcmV0dXJuIHRoaXMubWluVGltZW91dDtcbiAgICB9XG5cbiAgICBsZXQgdGltZW91dCA9IE1hdGgubWluKFxuICAgICAgdGhpcy5tYXhUaW1lb3V0LFxuICAgICAgdGhpcy5iYXNlVGltZW91dCAqIE1hdGgucG93KHRoaXMuZXhwb25lbnQsIGNvdW50KSk7XG4gICAgLy8gZnV6eiB0aGUgdGltZW91dCByYW5kb21seSwgdG8gYXZvaWQgcmVjb25uZWN0IHN0b3JtcyB3aGVuIGFcbiAgICAvLyBzZXJ2ZXIgZ29lcyBkb3duLlxuICAgIHRpbWVvdXQgKj0gKFJhbmRvbS5mcmFjdGlvbigpICogdGhpcy5mdXp6KSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgKDEgLSB0aGlzLmZ1enogLyAyKTtcbiAgICByZXR1cm4gTWF0aC5jZWlsKHRpbWVvdXQpO1xuICB9XG5cbiAgLy8gQ2FsbCBgZm5gIGFmdGVyIGEgZGVsYXksIGJhc2VkIG9uIHRoZSBgY291bnRgIG9mIHdoaWNoIHJldHJ5IHRoaXMgaXMuXG4gIHJldHJ5TGF0ZXIgKGNvdW50LCBmbikge1xuICAgIGNvbnN0IHRpbWVvdXQgPSB0aGlzLl90aW1lb3V0KGNvdW50KTtcbiAgICBpZiAodGhpcy5yZXRyeVRpbWVyKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5yZXRyeVRpbWVyKTtcbiAgICB9XG5cbiAgICB0aGlzLnJldHJ5VGltZXIgPSBzZXRUaW1lb3V0KGZuLCB0aW1lb3V0KTtcbiAgICByZXR1cm4gdGltZW91dDtcbiAgfVxufVxuIiwiaW1wb3J0IHsgZ2V0Q2xpZW50QXJjaFZlcnNpb24gfSBmcm9tICcuL2NvbW1vbi91dGlscyc7XG5cbmNvbnN0IHsgRERTa2V0Y2ggfSA9IHJlcXVpcmUoJ21vbnRpLWFwbS1za2V0Y2hlcy1qcycpO1xuXG5leHBvcnQgZnVuY3Rpb24gaGF2ZUFzeW5jQ2FsbGJhY2sgKGFyZ3MpIHtcbiAgY29uc3QgbGFzdEFyZyA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcblxuICByZXR1cm4gdHlwZW9mIGxhc3RBcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmV4cG9ydCBjbGFzcyBVbmlxdWVJZCB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLmlkID0gMDtcbiAgfVxuXG4gIGdldCAoKSB7XG4gICAgcmV0dXJuIGAke3RoaXMuaWQrK31gO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBEZWZhdWx0VW5pcXVlSWQgPSBuZXcgVW5pcXVlSWQoKTtcblxuLy8gY3JlYXRlcyBhIHN0YWNrIHRyYWNlLCByZW1vdmluZyBmcmFtZXMgaW4gbW9udGlhcG06YWdlbnQncyBjb2RlXG5leHBvcnQgZnVuY3Rpb24gQ3JlYXRlVXNlclN0YWNrIChlcnJvcikge1xuICBjb25zdCBzdGFjayA9IChlcnJvciB8fCBuZXcgRXJyb3IoKSkuc3RhY2suc3BsaXQoJ1xcbicpO1xuICBsZXQgdG9SZW1vdmUgPSAxO1xuXG4gIC8vIEZpbmQgaG93IG1hbnkgZnJhbWVzIG5lZWQgdG8gYmUgcmVtb3ZlZFxuICAvLyB0byBtYWtlIHRoZSB1c2VyJ3MgY29kZSB0aGUgZmlyc3QgZnJhbWVcbiAgZm9yICg7IHRvUmVtb3ZlIDwgc3RhY2subGVuZ3RoOyB0b1JlbW92ZSsrKSB7XG4gICAgaWYgKHN0YWNrW3RvUmVtb3ZlXS5pbmRleE9mKCdtb250aWFwbTphZ2VudCcpID09PSAtMSkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHN0YWNrLnNsaWNlKHRvUmVtb3ZlKS5qb2luKCdcXG4nKTtcbn1cblxuLy8gT3B0aW1pemVkIHZlcnNpb24gb2YgYXBwbHkgd2hpY2ggdHJpZXMgdG8gY2FsbCBhcyBwb3NzaWJsZSBhcyBpdCBjYW5cbi8vIFRoZW4gZmFsbCBiYWNrIHRvIGFwcGx5XG4vLyBUaGlzIGlzIGJlY2F1c2UsIHY4IGlzIHZlcnkgc2xvdyB0byBpbnZva2UgYXBwbHkuXG5leHBvcnQgZnVuY3Rpb24gT3B0aW1pemVkQXBwbHkgKGNvbnRleHQsIGZuLCBhcmdzKSB7XG4gIGxldCBhID0gYXJncztcbiAgc3dpdGNoIChhLmxlbmd0aCkge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQsIGFbMF0pO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQsIGFbMF0sIGFbMV0pO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQsIGFbMF0sIGFbMV0sIGFbMl0pO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQsIGFbMF0sIGFbMV0sIGFbMl0sIGFbM10pO1xuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQsIGFbMF0sIGFbMV0sIGFbMl0sIGFbM10sIGFbNF0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZm4uYXBwbHkoY29udGV4dCwgYSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsaWVudFZlcnNpb25zICgpIHtcbiAgcmV0dXJuIHtcbiAgICAnd2ViLmNvcmRvdmEnOiBnZXRDbGllbnRBcmNoVmVyc2lvbignd2ViLmNvcmRvdmEnKSxcbiAgICAnd2ViLmJyb3dzZXInOiBnZXRDbGllbnRBcmNoVmVyc2lvbignd2ViLmJyb3dzZXInKSxcbiAgICAnd2ViLmJyb3dzZXIubGVnYWN5JzogZ2V0Q2xpZW50QXJjaFZlcnNpb24oJ3dlYi5icm93c2VyLmxlZ2FjeScpXG4gIH07XG59XG5cbi8vIFJldHVybnMgbnVtYmVyIG9mIGtleXMgb2YgYW4gb2JqZWN0LCBvciBzaXplIG9mIGEgTWFwIG9yIFNldFxuZXhwb3J0IGZ1bmN0aW9uIGNvdW50S2V5cyAob2JqKSB7XG4gIGlmIChvYmogaW5zdGFuY2VvZiBNYXAgfHwgb2JqIGluc3RhbmNlb2YgU2V0KSB7XG4gICAgcmV0dXJuIG9iai5zaXplO1xuICB9XG5cbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoO1xufVxuXG4vLyBJdGVyYXRlcyBvYmplY3RzIGFuZCBtYXBzLlxuLy8gQ2FsbGJhY2sgaXMgY2FsbGVkIHdpdGggYSB2YWx1ZSBhbmQga2V5XG5leHBvcnQgZnVuY3Rpb24gaXRlcmF0ZSAob2JqLCBjYWxsYmFjaykge1xuICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgcmV0dXJuIG9iai5mb3JFYWNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBndWFyZC1mb3ItaW5cbiAgZm9yIChsZXQga2V5IGluIG9iaikge1xuICAgIGxldCB2YWx1ZSA9IG9ialtrZXldO1xuICAgIGNhbGxiYWNrKHZhbHVlLCBrZXkpO1xuICB9XG59XG5cbi8vIFJldHVybnMgYSBwcm9wZXJ0eSBmcm9tIGFuIG9iamVjdCwgb3IgYW4gZW50cnkgZnJvbSBhIG1hcFxuZXhwb3J0IGZ1bmN0aW9uIGdldFByb3BlcnR5IChvYmosIGtleSkge1xuICBpZiAob2JqIGluc3RhbmNlb2YgTWFwKSB7XG4gICAgcmV0dXJuIG9iai5nZXQoa2V5KTtcbiAgfVxuXG4gIHJldHVybiBvYmpba2V5XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUhpc3RvZ3JhbSAoKSB7XG4gIHJldHVybiBuZXcgRERTa2V0Y2goe1xuICAgIGFscGhhOiAwLjAyXG4gIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGljayAob2JqLCBrZXlzKSB7XG4gIHJldHVybiBrZXlzLnJlZHVjZSgocmVzdWx0LCBrZXkpID0+IHtcbiAgICBpZiAob2JqW2tleV0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVzdWx0W2tleV0gPSBvYmpba2V5XTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSwge30pO1xufVxuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSZXRyeSB9IGZyb20gJy4vcmV0cnknO1xuXG5jb25zdCBsb2dnZXIgPSBnZXRMb2dnZXIoKTtcblxuZXhwb3J0IGNsYXNzIE50cCB7XG4gIGNvbnN0cnVjdG9yIChvcHRpb25zKSB7XG4gICAgY29uc3Qge2VuZHBvaW50LCBkaXNhYmxlTnRwfSA9IG9wdGlvbnMgfHwge307XG5cbiAgICB0aGlzLmlzRGlzYWJsZWQgPSBkaXNhYmxlTnRwO1xuICAgIHRoaXMucGF0aCA9ICcvc2ltcGxlbnRwL3N5bmMnO1xuICAgIHRoaXMuc2V0RW5kcG9pbnQoZW5kcG9pbnQpO1xuICAgIHRoaXMuZGlmZiA9IDA7XG4gICAgdGhpcy5zeW5jZWQgPSBmYWxzZTtcbiAgICB0aGlzLnJlU3luY0NvdW50ID0gMDtcbiAgICB0aGlzLnJlU3luYyA9IG5ldyBSZXRyeSh7XG4gICAgICBiYXNlVGltZW91dDogMTAwMCAqIDYwLFxuICAgICAgbWF4VGltZW91dDogMTAwMCAqIDYwICogMTAsXG4gICAgICBtaW5Db3VudDogMFxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIF9ub3cgKCkge1xuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKHR5cGVvZiBub3cgPT09ICdudW1iZXInKSB7XG4gICAgICByZXR1cm4gbm93O1xuICAgIH0gZWxzZSBpZiAobm93IGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgLy8gc29tZSBleHRlbmFsIEpTIGxpYnJhcmllcyBvdmVycmlkZSBEYXRlLm5vdyBhbmQgcmV0dXJucyBhIERhdGUgb2JqZWN0XG4gICAgICAvLyB3aGljaCBkaXJlY3RseSBhZmZlY3QgdXMuIFNvIHdlIG5lZWQgdG8gcHJlcGFyZSBmb3IgdGhhdFxuICAgICAgcmV0dXJuIG5vdy5nZXRUaW1lKCk7XG4gICAgfVxuICAgIC8vIHRydXN0IG1lLiBJJ3ZlIHNlZW4gbm93ID09PSB1bmRlZmluZWRcbiAgICByZXR1cm4gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIH1cblxuICBzZXRFbmRwb2ludCAoZW5kcG9pbnQpIHtcbiAgICB0aGlzLmVuZHBvaW50ID0gZW5kcG9pbnQgPyBlbmRwb2ludCArIHRoaXMucGF0aCA6IG51bGw7XG4gIH1cblxuICBnZXRUaW1lICgpIHtcbiAgICByZXR1cm4gTnRwLl9ub3coKSArIE1hdGgucm91bmQodGhpcy5kaWZmKTtcbiAgfVxuXG4gIHN5bmNUaW1lIChsb2NhbFRpbWUpIHtcbiAgICByZXR1cm4gbG9jYWxUaW1lICsgTWF0aC5jZWlsKHRoaXMuZGlmZik7XG4gIH1cblxuICBzeW5jICgpIHtcbiAgICBpZiAodGhpcy5lbmRwb2ludCA9PT0gbnVsbCB8fCB0aGlzLmlzRGlzYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBsb2dnZXIoJ2luaXQgc3luYycpO1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgcmV0cnlDb3VudCA9IDA7XG5cbiAgICBsZXQgcmV0cnkgPSBuZXcgUmV0cnkoe1xuICAgICAgYmFzZVRpbWVvdXQ6IDEwMDAgKiAyMCxcbiAgICAgIG1heFRpbWVvdXQ6IDEwMDAgKiA2MCxcbiAgICAgIG1pbkNvdW50OiAxLFxuICAgICAgbWluVGltZW91dDogMFxuICAgIH0pO1xuXG4gICAgc3luY1RpbWUoKTtcblxuICAgIGZ1bmN0aW9uIHN5bmNUaW1lICgpIHtcbiAgICAgIGlmIChyZXRyeUNvdW50IDwgNSkge1xuICAgICAgICBsb2dnZXIoJ2F0dGVtcHQgdGltZSBzeW5jIHdpdGggc2VydmVyJywgcmV0cnlDb3VudCk7XG4gICAgICAgIC8vIGlmIHdlIHNlbmQgMCB0byB0aGUgcmV0cnlMYXRlciwgY2FjaGVEbnMgd2lsbCBydW4gaW1tZWRpYXRlbHlcbiAgICAgICAgcmV0cnkucmV0cnlMYXRlcihyZXRyeUNvdW50KyssIGNhY2hlRG5zKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxvZ2dlcignbWF4aW11bSByZXRyaWVzIHJlYWNoZWQnKTtcbiAgICAgICAgc2VsZi5yZVN5bmMucmV0cnlMYXRlcihzZWxmLnJlU3luY0NvdW50KyssIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBsZXQgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICBzZWxmLnN5bmMoLi4uYXJncyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGZpcnN0IGF0dGVtcHQgaXMgdG8gY2FjaGUgZG5zLiBTbywgY2FsY3VsYXRpb24gZG9lcyBub3RcbiAgICAvLyBpbmNsdWRlIEROUyByZXNvbHV0aW9uIHRpbWVcbiAgICBmdW5jdGlvbiBjYWNoZURucyAoKSB7XG4gICAgICBzZWxmLmdldFNlcnZlclRpbWUoZnVuY3Rpb24gKGVycikge1xuICAgICAgICBpZiAoIWVycikge1xuICAgICAgICAgIGNhbGN1bGF0ZVRpbWVEaWZmKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3luY1RpbWUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2FsY3VsYXRlVGltZURpZmYgKCkge1xuICAgICAgbGV0IGNsaWVudFN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgc2VsZi5nZXRTZXJ2ZXJUaW1lKGZ1bmN0aW9uIChlcnIsIHNlcnZlclRpbWUpIHtcbiAgICAgICAgaWYgKCFlcnIgJiYgc2VydmVyVGltZSkge1xuICAgICAgICAgIC8vIChEYXRlLm5vdygpICsgY2xpZW50U3RhcnRUaW1lKS8yIDogTWlkcG9pbnQgYmV0d2VlbiByZXEgYW5kIHJlc1xuICAgICAgICAgIGxldCBuZXR3b3JrVGltZSA9IChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIGNsaWVudFN0YXJ0VGltZSkgLyAyO1xuICAgICAgICAgIGxldCBzZXJ2ZXJTdGFydFRpbWUgPSBzZXJ2ZXJUaW1lIC0gbmV0d29ya1RpbWU7XG4gICAgICAgICAgc2VsZi5kaWZmID0gc2VydmVyU3RhcnRUaW1lIC0gY2xpZW50U3RhcnRUaW1lO1xuICAgICAgICAgIHNlbGYuc3luY2VkID0gdHJ1ZTtcbiAgICAgICAgICAvLyB3ZSBuZWVkIHRvIHNlbmQgMSBpbnRvIHJldHJ5TGF0ZXIuXG4gICAgICAgICAgc2VsZi5yZVN5bmMucmV0cnlMYXRlcihzZWxmLnJlU3luY0NvdW50KyssIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgc2VsZi5zeW5jKC4uLmFyZ3MpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGxvZ2dlcignc3VjY2Vzc2Z1bGx5IHVwZGF0ZWQgZGlmZiB2YWx1ZScsIHNlbGYuZGlmZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3luY1RpbWUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0U2VydmVyVGltZSAoY2FsbGJhY2spIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoc2VsZi5lbmRwb2ludCA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdnZXRTZXJ2ZXJUaW1lIHJlcXVpcmVzIHRoZSBlbmRwb2ludCB0byBiZSBzZXQnKTtcbiAgICB9XG5cbiAgICBpZiAoc2VsZi5pc0Rpc2FibGVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFNlcnZlclRpbWUgcmVxdWlyZXMgTlRQIHRvIGJlIGVuYWJsZWQnKTtcbiAgICB9XG5cbiAgICBpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgICBLYWRpcmEuY29yZUFwaS5nZXQoc2VsZi5wYXRoLCB7bm9SZXRyaWVzOiB0cnVlfSkudGhlbihjb250ZW50ID0+IHtcbiAgICAgICAgbGV0IHNlcnZlclRpbWUgPSBwYXJzZUludChjb250ZW50LCAxMCk7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHNlcnZlclRpbWUpO1xuICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIEthZGlyYS5fbWFrZUh0dHBSZXF1ZXN0KCdHRVQnLCBgJHtzZWxmLmVuZHBvaW50fT9ub0NhY2hlPSR7bmV3IERhdGUoKS5nZXRUaW1lKCl9LSR7TWF0aC5yYW5kb20oKX1gLCBmdW5jdGlvbiAoZXJyLCByZXMpIHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbGV0IHNlcnZlclRpbWUgPSBwYXJzZUludChyZXMuY29udGVudCwgMTApO1xuICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHNlcnZlclRpbWUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TG9nZ2VyICgpIHtcbiAgaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICAgIHJldHVybiBOcG0ucmVxdWlyZSgnZGVidWcnKSgna2FkaXJhOm50cCcpO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgbGV0IGNhbkxvZyA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBjYW5Mb2cgPSBnbG9iYWwubG9jYWxTdG9yYWdlLmdldEl0ZW0oJ0xPR19LQURJUkEnKSAhPT0gbnVsbCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZW1wdHlcbiAgICB9IGNhdGNoIChlKSB7IH0gLy8gb2xkZXIgYnJvd3NlcnMgY2FuIHNvbWV0aW1lcyB0aHJvdyBiZWNhdXNlIG9mIGdldEl0ZW1cblxuICAgIGlmICghY2FuTG9nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG1lc3NhZ2UpIHtcbiAgICAgIG1lc3NhZ2UgPSBga2FkaXJhOm50cCAke21lc3NhZ2V9YDtcbiAgICAgIGFyZ3VtZW50c1swXSA9IG1lc3NhZ2U7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coLi4uYXJndW1lbnRzKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7IFdlYkFwcCB9IGZyb20gJ21ldGVvci93ZWJhcHAnO1xubGV0IHBhdGggPSBOcG0ucmVxdWlyZSgncGF0aCcpO1xubGV0IGZzID0gTnBtLnJlcXVpcmUoJ2ZzJyk7XG5sZXQgbG9nZ2VyID0gTnBtLnJlcXVpcmUoJ2RlYnVnJykoJ2thZGlyYTphcG06c291cmNlbWFwcycpO1xuXG4vLyBNZXRlb3IgMS43IGFuZCBvbGRlciB1c2VkIGNsaWVudFBhdGhzXG5sZXQgY2xpZW50UGF0aHMgPSBfX21ldGVvcl9ib290c3RyYXBfXy5jb25maWdKc29uLmNsaWVudFBhdGhzO1xubGV0IGNsaWVudEFyY2hzID0gX19tZXRlb3JfYm9vdHN0cmFwX18uY29uZmlnSnNvbi5jbGllbnRBcmNocztcbmxldCBzZXJ2ZXJEaXIgPSBfX21ldGVvcl9ib290c3RyYXBfXy5zZXJ2ZXJEaXI7XG5sZXQgYWJzQ2xpZW50UGF0aHM7XG5cbmlmIChjbGllbnRBcmNocykge1xuICBhYnNDbGllbnRQYXRocyA9IGNsaWVudEFyY2hzLnJlZHVjZSgocmVzdWx0LCBhcmNoKSA9PiB7XG4gICAgcmVzdWx0W2FyY2hdID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShzZXJ2ZXJEaXIpLCBhcmNoKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHt9KTtcbn0gZWxzZSB7XG4gIGFic0NsaWVudFBhdGhzID0gT2JqZWN0LmtleXMoY2xpZW50UGF0aHMpLnJlZHVjZSgocmVzdWx0LCBrZXkpID0+IHtcbiAgICByZXN1bHRba2V5XSA9IHBhdGgucmVzb2x2ZShzZXJ2ZXJEaXIsIHBhdGguZGlybmFtZShjbGllbnRQYXRoc1trZXldKSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LCB7fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVBcGlSZXNwb25zZSAoYm9keSA9IHt9KSB7XG4gIGxldCB1bmF2YWlsYWJsZSA9IFtdO1xuXG4gIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICB0cnkge1xuICAgICAgYm9keSA9IEpTT04ucGFyc2UoYm9keSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgbG9nZ2VyKCdmYWlsZWQgcGFyc2luZyBib2R5JywgZSwgYm9keSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG5cbiAgbGV0IG5lZWRlZFNvdXJjZW1hcHMgPSBib2R5Lm5lZWRlZFNvdXJjZW1hcHMgfHwgW107XG4gIGxvZ2dlcignYm9keScsIG5lZWRlZFNvdXJjZW1hcHMpO1xuXG4gIGxldCBwcm9taXNlcyA9IG5lZWRlZFNvdXJjZW1hcHMubWFwKChzb3VyY2VtYXApID0+IHtcbiAgICBpZiAoIUthZGlyYS5vcHRpb25zLnVwbG9hZFNvdXJjZU1hcHMpIHtcbiAgICAgIHJldHVybiB1bmF2YWlsYWJsZS5wdXNoKHNvdXJjZW1hcCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdldFNvdXJjZW1hcFBhdGgoc291cmNlbWFwLmFyY2gsIHNvdXJjZW1hcC5maWxlLnBhdGgpXG4gICAgICAudGhlbihmdW5jdGlvbiAoc291cmNlTWFwUGF0aCkge1xuICAgICAgICBpZiAoc291cmNlTWFwUGF0aCA9PT0gbnVsbCkge1xuICAgICAgICAgIHVuYXZhaWxhYmxlLnB1c2goc291cmNlbWFwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZW5kU291cmNlbWFwKHNvdXJjZW1hcCwgc291cmNlTWFwUGF0aCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9KTtcblxuICBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHVuYXZhaWxhYmxlLmxlbmd0aCA+IDApIHtcbiAgICAgIGxvZ2dlcignc2VuZGluZyB1bmF2YWlsYWJsZSBzb3VyY2VtYXBzJywgdW5hdmFpbGFibGUpO1xuICAgICAgS2FkaXJhLmNvcmVBcGkuc2VuZERhdGEoe1xuICAgICAgICB1bmF2YWlsYWJsZVNvdXJjZW1hcHM6IHVuYXZhaWxhYmxlXG4gICAgICB9KVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoX2JvZHkpIHtcbiAgICAgICAgICBoYW5kbGVBcGlSZXNwb25zZShfYm9keSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ01vbnRpIEFQTTogdW5hYmxlIHRvIHNlbmQgZGF0YScsIGVycik7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHNlbmRTb3VyY2VtYXAgKHNvdXJjZW1hcCwgc291cmNlbWFwUGF0aCkge1xuICBsb2dnZXIoJ1NlbmRpbmcgc291cmNlbWFwJywgc291cmNlbWFwLCBzb3VyY2VtYXBQYXRoKTtcblxuICBsZXQgc3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbShzb3VyY2VtYXBQYXRoKTtcblxuICBzdHJlYW0ub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgIGNvbnNvbGUubG9nKCdNb250aSBBUE06IGVycm9yIHdoaWxlIHVwbG9hZGluZyBzb3VyY2VtYXAnLCBlcnIpO1xuICB9KTtcblxuICBsZXQgYXJjaCA9IHNvdXJjZW1hcC5hcmNoO1xuICBsZXQgYXJjaFZlcnNpb24gPSBzb3VyY2VtYXAuYXJjaFZlcnNpb247XG4gIGxldCBmaWxlID0gZW5jb2RlVVJJQ29tcG9uZW50KHNvdXJjZW1hcC5maWxlLnBhdGgpO1xuXG4gIEthZGlyYS5jb3JlQXBpLnNlbmRTdHJlYW0oYC9zb3VyY2VtYXA/YXJjaD0ke2FyY2h9JmFyY2hWZXJzaW9uPSR7YXJjaFZlcnNpb259JmZpbGU9JHtmaWxlfWAsIHN0cmVhbSlcbiAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ01vbnRpIEFQTTogZXJyb3IgdXBsb2FkaW5nIHNvdXJjZW1hcCcsIGVycik7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHByZXBhcmVQYXRoICh1cmxQYXRoKSB7XG4gIHVybFBhdGggPSBwYXRoLnBvc2l4Lm5vcm1hbGl6ZSh1cmxQYXRoKTtcblxuICBpZiAodXJsUGF0aFswXSA9PT0gJy8nKSB7XG4gICAgdXJsUGF0aCA9IHVybFBhdGguc2xpY2UoMSk7XG4gIH1cblxuICByZXR1cm4gdXJsUGF0aDtcbn1cblxuZnVuY3Rpb24gY2hlY2tGb3JEeW5hbWljSW1wb3J0IChhcmNoLCB1cmxQYXRoKSB7XG4gIGNvbnN0IGZpbGVQYXRoID0gcHJlcGFyZVBhdGgodXJsUGF0aCk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgY29uc3QgYXJjaFBhdGggPSBhYnNDbGllbnRQYXRoc1thcmNoXTtcbiAgICBjb25zdCBkeW5hbWljUGF0aCA9IGAke3BhdGguam9pbihhcmNoUGF0aCwgJ2R5bmFtaWMnLCBmaWxlUGF0aCl9Lm1hcGA7XG5cbiAgICBmcy5zdGF0KGR5bmFtaWNQYXRoLCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICByZXNvbHZlKGVyciA/IG51bGwgOiBkeW5hbWljUGF0aCk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRTb3VyY2VtYXBQYXRoIChhcmNoLCB1cmxQYXRoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGNsaWVudFByb2dyYW0gPSBXZWJBcHAuY2xpZW50UHJvZ3JhbXNbYXJjaF07XG5cbiAgICBpZiAoIWNsaWVudFByb2dyYW0gfHwgIWNsaWVudFByb2dyYW0ubWFuaWZlc3QpIHtcbiAgICAgIHJldHVybiByZXNvbHZlKG51bGwpO1xuICAgIH1cblxuICAgIGxldCBmaWxlSW5mbyA9IGNsaWVudFByb2dyYW0ubWFuaWZlc3QuZmluZCgoZmlsZSkgPT4gZmlsZS51cmwgJiYgZmlsZS51cmwuc3RhcnRzV2l0aCh1cmxQYXRoKSk7XG5cbiAgICBpZiAoZmlsZUluZm8gJiYgZmlsZUluZm8uc291cmNlTWFwKSB7XG4gICAgICByZXR1cm4gcmVzb2x2ZShwYXRoLmpvaW4oXG4gICAgICAgIGFic0NsaWVudFBhdGhzW2FyY2hdLFxuICAgICAgICBmaWxlSW5mby5zb3VyY2VNYXBcbiAgICAgICkpO1xuICAgIH1cblxuICAgIGNoZWNrRm9yRHluYW1pY0ltcG9ydChhcmNoLCB1cmxQYXRoKS50aGVuKHJlc29sdmUpLmNhdGNoKHJlamVjdCk7XG4gIH0pO1xufVxuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCB7IFRpbWVvdXRNYW5hZ2VyIH0gZnJvbSAnLi9oaWphY2svdGltZW91dF9tYW5hZ2VyJztcblxuY29uc3QgV0FJVE9OX01FU1NBR0VfRklFTERTID0gWydtc2cnLCAnaWQnLCAnbWV0aG9kJywgJ25hbWUnLCAnd2FpdFRpbWUnXTtcblxuLy8gVGhpcyBpcyB3YXkgaG93IHdlIGNhbiBidWlsZCB3YWl0VGltZSBhbmQgaXQncyBicmVha2Rvd25cbmV4cG9ydCBjbGFzcyBXYWl0VGltZUJ1aWxkZXIge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5fd2FpdExpc3RTdG9yZSA9IHt9O1xuICAgIHRoaXMuX2N1cnJlbnRQcm9jZXNzaW5nTWVzc2FnZXMgPSB7fTtcbiAgICB0aGlzLl9tZXNzYWdlQ2FjaGUgPSB7fTtcbiAgfVxuXG4gIHJlZ2lzdGVyIChzZXNzaW9uLCBtc2dJZCkge1xuICAgIGNvbnN0IG1haW5LZXkgPSB0aGlzLl9nZXRNZXNzYWdlS2V5KHNlc3Npb24uaWQsIG1zZ0lkKTtcblxuICAgIGxldCBpblF1ZXVlID0gc2Vzc2lvbi5pblF1ZXVlIHx8IFtdO1xuICAgIGlmICh0eXBlb2YgaW5RdWV1ZS50b0FycmF5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBsYXRlc3QgdmVyc2lvbiBvZiBNZXRlb3IgdXNlcyBhIGRvdWJsZS1lbmRlZC1xdWV1ZSBmb3IgdGhlIGluUXVldWVcbiAgICAgIC8vIGluZm86IGh0dHBzOi8vd3d3Lm5wbWpzLmNvbS9wYWNrYWdlL2RvdWJsZS1lbmRlZC1xdWV1ZVxuICAgICAgaW5RdWV1ZSA9IGluUXVldWUudG9BcnJheSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHdhaXRMaXN0ID1cbiAgICAgIGluUXVldWUubWFwKG1zZyA9PiB7XG4gICAgICAgIGNvbnN0IGtleSA9IHRoaXMuX2dldE1lc3NhZ2VLZXkoc2Vzc2lvbi5pZCwgbXNnLmlkKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0Q2FjaGVNZXNzYWdlKGtleSwgbXNnKTtcbiAgICAgIH0pIHx8IFtdO1xuXG4gICAgLy8gYWRkIGN1cnJlbnRseSBwcm9jZXNzaW5nIGRkcCBtZXNzYWdlIGlmIGV4aXN0c1xuICAgIGNvbnN0IGN1cnJlbnRseVByb2Nlc3NpbmdNZXNzYWdlID1cbiAgICAgIHRoaXMuX2N1cnJlbnRQcm9jZXNzaW5nTWVzc2FnZXNbc2Vzc2lvbi5pZF07XG4gICAgaWYgKGN1cnJlbnRseVByb2Nlc3NpbmdNZXNzYWdlKSB7XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLl9nZXRNZXNzYWdlS2V5KFxuICAgICAgICBzZXNzaW9uLmlkLFxuICAgICAgICBjdXJyZW50bHlQcm9jZXNzaW5nTWVzc2FnZS5pZFxuICAgICAgKTtcbiAgICAgIHdhaXRMaXN0LnVuc2hpZnQodGhpcy5fZ2V0Q2FjaGVNZXNzYWdlKGtleSwgY3VycmVudGx5UHJvY2Vzc2luZ01lc3NhZ2UpKTtcbiAgICB9XG5cbiAgICB0aGlzLl93YWl0TGlzdFN0b3JlW21haW5LZXldID0gd2FpdExpc3Q7XG4gIH1cblxuICBidWlsZCAoc2Vzc2lvbiwgbXNnSWQpIHtcbiAgICBjb25zdCBtYWluS2V5ID0gdGhpcy5fZ2V0TWVzc2FnZUtleShzZXNzaW9uLmlkLCBtc2dJZCk7XG4gICAgY29uc3Qgd2FpdExpc3QgPSB0aGlzLl93YWl0TGlzdFN0b3JlW21haW5LZXldIHx8IFtdO1xuICAgIGRlbGV0ZSB0aGlzLl93YWl0TGlzdFN0b3JlW21haW5LZXldO1xuXG4gICAgY29uc3QgZmlsdGVyZWRXYWl0TGlzdCA9IHdhaXRMaXN0Lm1hcCh0aGlzLl9jbGVhbkNhY2hlTWVzc2FnZS5iaW5kKHRoaXMpKTtcblxuICAgIHJldHVybiBmaWx0ZXJlZFdhaXRMaXN0O1xuICB9XG5cbiAgX2dldE1lc3NhZ2VLZXkgKHNlc3Npb25JZCwgbXNnSWQpIHtcbiAgICByZXR1cm4gYCR7c2Vzc2lvbklkfTo6JHttc2dJZH1gO1xuICB9XG5cbiAgX2dldENhY2hlTWVzc2FnZSAoa2V5LCBtc2cpIHtcbiAgICBsZXQgY2FjaGVkTWVzc2FnZSA9IHRoaXMuX21lc3NhZ2VDYWNoZVtrZXldO1xuICAgIGlmICghY2FjaGVkTWVzc2FnZSkge1xuICAgICAgdGhpcy5fbWVzc2FnZUNhY2hlW2tleV0gPSBjYWNoZWRNZXNzYWdlID0gXy5waWNrKFxuICAgICAgICBtc2csXG4gICAgICAgIFdBSVRPTl9NRVNTQUdFX0ZJRUxEU1xuICAgICAgKTtcbiAgICAgIGNhY2hlZE1lc3NhZ2UuX2tleSA9IGtleTtcbiAgICAgIGNhY2hlZE1lc3NhZ2UuX3JlZ2lzdGVyZWQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBjYWNoZWRNZXNzYWdlLl9yZWdpc3RlcmVkKys7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhY2hlZE1lc3NhZ2U7XG4gIH1cblxuICBfY2xlYW5DYWNoZU1lc3NhZ2UgKG1zZykge1xuICAgIG1zZy5fcmVnaXN0ZXJlZC0tO1xuICAgIGlmIChtc2cuX3JlZ2lzdGVyZWQgPT09IDApIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9tZXNzYWdlQ2FjaGVbbXNnLl9rZXldO1xuICAgIH1cblxuICAgIC8vIG5lZWQgdG8gc2VuZCBhIGNsZWFuIHNldCBvZiBvYmplY3RzXG4gICAgLy8gb3RoZXJ3aXNlIHJlZ2lzdGVyIGNhbiBnbyB3aXRoIHRoaXNcbiAgICByZXR1cm4gXy5waWNrKG1zZywgV0FJVE9OX01FU1NBR0VfRklFTERTKTtcbiAgfVxuXG4gIHRyYWNrV2FpdFRpbWUgKHNlc3Npb24sIG1zZywgdW5ibG9jaykge1xuICAgIGNvbnN0IHN0YXJ0ZWQgPSBEYXRlLm5vdygpO1xuICAgIHRoaXMuX2N1cnJlbnRQcm9jZXNzaW5nTWVzc2FnZXNbc2Vzc2lvbi5pZF0gPSBtc2c7XG5cbiAgICBsZXQgdW5ibG9ja2VkID0gZmFsc2U7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBjb25zdCB3cmFwcGVkVW5ibG9jayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGlmICghdW5ibG9ja2VkKSB7XG4gICAgICAgIGNvbnN0IHdhaXRUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0ZWQ7XG4gICAgICAgIGNvbnN0IGtleSA9IHNlbGYuX2dldE1lc3NhZ2VLZXkoc2Vzc2lvbi5pZCwgbXNnLmlkKTtcbiAgICAgICAgY29uc3QgY2FjaGVkTWVzc2FnZSA9IHNlbGYuX21lc3NhZ2VDYWNoZVtrZXldO1xuICAgICAgICBpZiAoY2FjaGVkTWVzc2FnZSkge1xuICAgICAgICAgIGNhY2hlZE1lc3NhZ2Uud2FpdFRpbWUgPSB3YWl0VGltZTtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgc2VsZi5fY3VycmVudFByb2Nlc3NpbmdNZXNzYWdlc1tzZXNzaW9uLmlkXTtcbiAgICAgICAgdW5ibG9ja2VkID0gdHJ1ZTtcbiAgICAgICAgdW5ibG9jaygpO1xuXG4gICAgICAgIFRpbWVvdXRNYW5hZ2VyLmNsZWFyVGltZW91dCgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gd3JhcHBlZFVuYmxvY2s7XG4gIH1cbn1cbiIsIi8qIGdsb2JhbCBMb2NhbENvbGxlY3Rpb24gKi9cblxuaW1wb3J0IHsgVHJhY2tlciB9IGZyb20gJ21ldGVvci90cmFja2VyJztcblxuLy8gZXhwb3NlIGZvciB0ZXN0aW5nIHB1cnBvc2VcbmV4cG9ydCBjb25zdCBPcGxvZ0NoZWNrID0ge307XG5cbk9wbG9nQ2hlY2suZW52ID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXByb2Nlc3MuZW52Lk1PTkdPX09QTE9HX1VSTCkge1xuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiAnTk9fRU5WJyxcbiAgICAgIHJlYXNvbjogXCJZb3UgaGF2ZW4ndCBhZGRlZCBvcGxvZyBzdXBwb3J0IGZvciB5b3VyIHRoZSBNZXRlb3IgYXBwLlwiLFxuICAgICAgc29sdXRpb246ICdBZGQgb3Bsb2cgc3VwcG9ydCBmb3IgeW91ciBNZXRlb3IgYXBwLiBzZWU6IGh0dHA6Ly9nb28uZ2wvQ28xakpjJ1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5PcGxvZ0NoZWNrLmRpc2FibGVPcGxvZyA9IGZ1bmN0aW9uIChjdXJzb3JEZXNjcmlwdGlvbikge1xuICBjb25zdCB7IG9wdGlvbnMgfSA9IGN1cnNvckRlc2NyaXB0aW9uO1xuXG4gIC8vIFVuZGVyc2NvcmVkIHZlcnNpb24gZm9yIE1ldGVvciBwcmUgMS4yXG4gIGlmIChvcHRpb25zLl9kaXNhYmxlT3Bsb2cgfHwgb3B0aW9ucy5kaXNhYmxlT3Bsb2cpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogJ0RJU0FCTEVfT1BMT0cnLFxuICAgICAgcmVhc29uOiBcIllvdSd2ZSBkaXNhYmxlZCBvcGxvZyBmb3IgdGhpcyBjdXJzb3IgZXhwbGljaXRseSB3aXRoIF9kaXNhYmxlT3Bsb2cgb3B0aW9uLlwiXG4gICAgfTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8vIHdoZW4gY3JlYXRpbmcgTWluaW1vbmdvLk1hdGNoZXIgb2JqZWN0LCBpZiB0aGF0J3MgdGhyb3dzIGFuIGV4Y2VwdGlvblxuLy8gbWV0ZW9yIHdvbid0IGRvIHRoZSBvcGxvZyBzdXBwb3J0XG5PcGxvZ0NoZWNrLm1pbmlNb25nb01hdGNoZXIgPSBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24pIHtcbiAgaWYgKE1pbmltb25nby5NYXRjaGVyKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1uZXdcbiAgICAgIG5ldyBNaW5pbW9uZ28uTWF0Y2hlcihjdXJzb3JEZXNjcmlwdGlvbi5zZWxlY3Rvcik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29kZTogJ01JTklNT05HT19NQVRDSEVSX0VSUk9SJyxcbiAgICAgICAgcmVhc29uOiBgVGhlcmUncyBzb21ldGhpbmcgd3JvbmcgaW4geW91ciBtb25nbyBxdWVyeTogJHtleC5tZXNzYWdlfWAsXG4gICAgICAgIHNvbHV0aW9uOiAnQ2hlY2sgeW91ciBzZWxlY3RvciBhbmQgY2hhbmdlIGl0IGFjY29yZGluZ2x5LidcbiAgICAgIH07XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vIE1pbmltb25nby5NYXRjaGVyLCB3ZSBkb24ndCBuZWVkIHRvIGNoZWNrIHRoaXNcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuT3Bsb2dDaGVjay5taW5pTW9uZ29Tb3J0ZXIgPSBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24pIHtcbiAgbGV0IG1hdGNoZXIgPSBuZXcgTWluaW1vbmdvLk1hdGNoZXIoY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IpO1xuICBpZiAoTWluaW1vbmdvLlNvcnRlciAmJiBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLnNvcnQpIHtcbiAgICB0cnkge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLW5ld1xuICAgICAgbmV3IE1pbmltb25nby5Tb3J0ZXIoXG4gICAgICAgIGN1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnMuc29ydCxcbiAgICAgICAgeyBtYXRjaGVyIH1cbiAgICAgICk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgY29kZTogJ01JTklNT05HT19TT1JURVJfRVJST1InLFxuICAgICAgICByZWFzb246IGBTb21lIG9mIHlvdXIgc29ydCBzcGVjaWZpZXJzIGFyZSBub3Qgc3VwcG9ydGVkOiAke2V4Lm1lc3NhZ2V9YCxcbiAgICAgICAgc29sdXRpb246ICdDaGVjayB5b3VyIHNvcnQgc3BlY2lmaWVycyBhbmQgY2hhZ2UgdGhlbSBhY2NvcmRpbmdseS4nXG4gICAgICB9O1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxufTtcblxuT3Bsb2dDaGVjay5maWVsZHMgPSBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24pIHtcbiAgbGV0IG9wdGlvbnMgPSBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zO1xuXG4gIC8vIENoZWNraW5nIGBwcm9qZWN0aW9uYCBmb3IgTWV0ZW9yIDIuNitcbiAgY29uc3QgZmllbGRzID0gb3B0aW9ucy5maWVsZHMgfHwgb3B0aW9ucy5wcm9qZWN0aW9uO1xuXG4gIGlmIChmaWVsZHMpIHtcbiAgICB0cnkge1xuICAgICAgTG9jYWxDb2xsZWN0aW9uLl9jaGVja1N1cHBvcnRlZFByb2plY3Rpb24oZmllbGRzKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlLm5hbWUgPT09ICdNaW5pbW9uZ29FcnJvcicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBjb2RlOiAnTk9UX1NVUFBPUlRFRF9GSUVMRFMnLFxuICAgICAgICAgIHJlYXNvbjogYFNvbWUgb2YgdGhlIGZpZWxkIGZpbHRlcnMgYXJlIG5vdCBzdXBwb3J0ZWQ6ICR7ZS5tZXNzYWdlfWAsXG4gICAgICAgICAgc29sdXRpb246ICdUcnkgcmVtb3ZpbmcgdGhvc2UgZmllbGQgZmlsdGVycy4nXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbk9wbG9nQ2hlY2suc2tpcCA9IGZ1bmN0aW9uIChjdXJzb3JEZXNjcmlwdGlvbikge1xuICBpZiAoY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucy5za2lwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6ICdTS0lQX05PVF9TVVBQT1JURUQnLFxuICAgICAgcmVhc29uOiAnU2tpcCBkb2VzIG5vdCBzdXBwb3J0IHdpdGggb3Bsb2cuJyxcbiAgICAgIHNvbHV0aW9uOiAnVHJ5IHRvIGF2b2lkIHVzaW5nIHNraXAuIFVzZSByYW5nZSBxdWVyaWVzIGluc3RlYWQ6IGh0dHA6Ly9nb28uZ2wvYjUyMkF2J1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbk9wbG9nQ2hlY2sud2hlcmUgPSBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24pIHtcbiAgbGV0IG1hdGNoZXIgPSBuZXcgTWluaW1vbmdvLk1hdGNoZXIoY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IpO1xuICBpZiAobWF0Y2hlci5oYXNXaGVyZSgpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6ICdXSEVSRV9OT1RfU1VQUE9SVEVEJyxcbiAgICAgIHJlYXNvbjogJ01ldGVvciBkb2VzIG5vdCBzdXBwb3J0IHF1ZXJpZXMgd2l0aCAkd2hlcmUuJyxcbiAgICAgIHNvbHV0aW9uOiAnVHJ5IHRvIHJlbW92ZSAkd2hlcmUgZnJvbSB5b3VyIHF1ZXJ5LiBVc2Ugc29tZSBhbHRlcm5hdGl2ZS4nXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuT3Bsb2dDaGVjay5nZW8gPSBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24pIHtcbiAgbGV0IG1hdGNoZXIgPSBuZXcgTWluaW1vbmdvLk1hdGNoZXIoY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IpO1xuXG4gIGlmIChtYXRjaGVyLmhhc0dlb1F1ZXJ5KCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogJ0dFT19OT1RfU1VQUE9SVEVEJyxcbiAgICAgIHJlYXNvbjogJ01ldGVvciBkb2VzIG5vdCBzdXBwb3J0IHF1ZXJpZXMgd2l0aCBnZW8gcGFydGlhbCBvcGVyYXRvcnMuJyxcbiAgICAgIHNvbHV0aW9uOiAnVHJ5IHRvIHJlbW92ZSBnZW8gcGFydGlhbCBvcGVyYXRvcnMgZnJvbSB5b3VyIHF1ZXJ5IGlmIHBvc3NpYmxlLidcbiAgICB9O1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5PcGxvZ0NoZWNrLmxpbWl0QnV0Tm9Tb3J0ID0gZnVuY3Rpb24gKGN1cnNvckRlc2NyaXB0aW9uKSB7XG4gIGxldCBvcHRpb25zID0gY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucztcblxuICBpZiAob3B0aW9ucy5saW1pdCAmJiAhb3B0aW9ucy5zb3J0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6ICdMSU1JVF9OT19TT1JUJyxcbiAgICAgIHJlYXNvbjogJ01ldGVvciBvcGxvZyBpbXBsZW1lbnRhdGlvbiBkb2VzIG5vdCBzdXBwb3J0IGxpbWl0IHdpdGhvdXQgYSBzb3J0IHNwZWNpZmllci4nLFxuICAgICAgc29sdXRpb246ICdUcnkgYWRkaW5nIGEgc29ydCBzcGVjaWZpZXIuJ1xuICAgIH07XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbk9wbG9nQ2hlY2sudGhpcmRQYXJ0eSA9IGZ1bmN0aW9uIChjdXJzb3JEZXNjcmlwdGlvbiwgb2JzZXJ2ZXJEcml2ZXIpIHtcbiAgaWYgKFRyYWNrZXIuYWN0aXZlICYmIG9ic2VydmVyRHJpdmVyLmNvbnN0cnVjdG9yLm5hbWUgIT09ICdPcGxvZ09ic2VydmVEcml2ZXInKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6ICdUUkFDS0VSX0FDVElWRScsXG4gICAgICByZWFzb246ICdPYnNlcnZlIGRyaXZlciBkZXRlY3RlZCBpbnNpZGUgYW4gYWN0aXZlIHRyYWNrZXIsIHlvdSBtaWdodCBiZSB1c2luZyBhIHRoaXJkIHBhcnR5IGxpYnJhcnkgKGUuZyBcInJlYWN0aXZlLW1vbmdvXCIpLicsXG4gICAgICBzb2x1dGlvbjogJ0NoZWNrIHRoZSBsaWJyYXJ5IGRvY3VtZW50YXRpb24sIHBlcmhhcHMgYW4gb3B0aW9uIGlzIG1pc3NpbmcuJ1xuICAgIH07XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5PcGxvZ0NoZWNrLnVua25vd25SZWFzb24gPSBmdW5jdGlvbiAoY3Vyc29yRGVzY3JpcHRpb24sIGRyaXZlcikge1xuICBpZiAoZHJpdmVyICYmIGRyaXZlci5jb25zdHJ1Y3Rvci5uYW1lICE9PSAnT3Bsb2dPYnNlcnZlRHJpdmVyJykge1xuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiAnVU5LTk9XTl9SRUFTT04nLFxuICAgICAgcmVhc29uOiBgTm90IHVzaW5nIHRoZSBPcGxvZyBPYnNlcnZlIERyaXZlciBmb3IgdW5rbm93biByZWFzb24uIERyaXZlcjogJHtkcml2ZXIuY29uc3RydWN0b3IubmFtZX1gLFxuICAgICAgc29sdXRpb246ICdDaGVjayB5b3VyIHRoaXJkLXBhcnR5IGxpYnJhcmllcy4nXG4gICAgfTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbmxldCBwcmVSdW5uaW5nTWF0Y2hlcnMgPSBbXG4gIE9wbG9nQ2hlY2suZW52LFxuICBPcGxvZ0NoZWNrLmRpc2FibGVPcGxvZyxcbiAgT3Bsb2dDaGVjay5taW5pTW9uZ29NYXRjaGVyXG5dO1xuXG5sZXQgZ2xvYmFsTWF0Y2hlcnMgPSBbXG4gIE9wbG9nQ2hlY2suZmllbGRzLFxuICBPcGxvZ0NoZWNrLnNraXAsXG4gIE9wbG9nQ2hlY2sud2hlcmUsXG4gIE9wbG9nQ2hlY2suZ2VvLFxuICBPcGxvZ0NoZWNrLmxpbWl0QnV0Tm9Tb3J0LFxuICBPcGxvZ0NoZWNrLm1pbmlNb25nb1NvcnRlcixcbiAgT3Bsb2dDaGVjay50aGlyZFBhcnR5LFxuICBPcGxvZ0NoZWNrLnVua25vd25SZWFzb24sXG5dO1xuXG5LYWRpcmEuY2hlY2tXaHlOb09wbG9nID0gZnVuY3Rpb24gKGN1cnNvckRlc2NyaXB0aW9uLCBvYnNlcnZlckRyaXZlcikge1xuICBpZiAodHlwZW9mIE1pbmltb25nbyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogJ0NBTk5PVF9ERVRFQ1QnLFxuICAgICAgcmVhc29uOiBcIllvdSBhcmUgcnVubmluZyBhbiBvbGRlciBNZXRlb3IgdmVyc2lvbiBhbmQgTW9udGkgQVBNIGNhbid0IGNoZWNrIG9wbG9nIHN0YXRlLlwiLFxuICAgICAgc29sdXRpb246ICdUcnkgdXBkYXRpbmcgeW91ciBNZXRlb3IgYXBwJ1xuICAgIH07XG4gIH1cblxuICBsZXQgcmVzdWx0ID0gcnVuTWF0Y2hlcnMocHJlUnVubmluZ01hdGNoZXJzLCBjdXJzb3JEZXNjcmlwdGlvbiwgb2JzZXJ2ZXJEcml2ZXIpO1xuXG4gIGlmIChyZXN1bHQgIT09IHRydWUpIHtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcmVzdWx0ID0gcnVuTWF0Y2hlcnMoZ2xvYmFsTWF0Y2hlcnMsIGN1cnNvckRlc2NyaXB0aW9uLCBvYnNlcnZlckRyaXZlcik7XG5cbiAgaWYgKHJlc3VsdCAhPT0gdHJ1ZSkge1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGNvZGU6ICdPUExPR19TVVBQT1JURUQnLFxuICAgIHJlYXNvbjogXCJUaGlzIHF1ZXJ5IHNob3VsZCBzdXBwb3J0IG9wbG9nLiBJdCdzIHdlaXJkIGlmIGl0J3Mgbm90LlwiLFxuICAgIHNvbHV0aW9uOiBcIlBsZWFzZSBjb250YWN0IEthZGlyYSBzdXBwb3J0IGFuZCBsZXQncyBkaXNjdXNzLlwiXG4gIH07XG59O1xuXG5mdW5jdGlvbiBydW5NYXRjaGVycyAobWF0Y2hlckxpc3QsIGN1cnNvckRlc2NyaXB0aW9uLCBvYnNlcnZlckRyaXZlcikge1xuICBmb3IgKGNvbnN0IG1hdGNoZXIgb2YgbWF0Y2hlckxpc3QpIHtcbiAgICBjb25zdCBtYXRjaGVkID0gbWF0Y2hlcihjdXJzb3JEZXNjcmlwdGlvbiwgb2JzZXJ2ZXJEcml2ZXIpO1xuXG4gICAgaWYgKG1hdGNoZWQgIT09IHRydWUpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuIiwiaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcbmltcG9ydCB7IG9iamVjdEhhc0RhdGEgfSBmcm9tICcuLi9jb21tb24vdXRpbHMnO1xuaW1wb3J0IHsgQ3JlYXRlVXNlclN0YWNrLCBEZWZhdWx0VW5pcXVlSWQgfSBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBOdHAgfSBmcm9tICcuLi9udHAnO1xuXG5cbmxldCBldmVudExvZ2dlciA9IE5wbS5yZXF1aXJlKCdkZWJ1ZycpKCdrYWRpcmE6dHJhY2VyJyk7XG5cbmxldCBSRVBFVElUSVZFX0VWRU5UUyA9IHtkYjogdHJ1ZSwgaHR0cDogdHJ1ZSwgZW1haWw6IHRydWUsIHdhaXQ6IHRydWUsIGFzeW5jOiB0cnVlLCBjdXN0b206IHRydWUsIGZzOiB0cnVlfTtcbmxldCBUUkFDRV9UWVBFUyA9IFsnc3ViJywgJ21ldGhvZCcsICdodHRwJ107XG5sZXQgTUFYX1RSQUNFX0VWRU5UUyA9IDE1MDA7XG5cblxuZXhwb3J0IGNvbnN0IFRyYWNlciA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5fZmlsdGVycyA9IFtdO1xuICB0aGlzLl9maWx0ZXJGaWVsZHMgPSBbJ3Bhc3N3b3JkJ107XG4gIHRoaXMubWF4QXJyYXlJdGVtc1RvRmlsdGVyID0gMjA7XG59O1xuXG4vLyBJbiB0aGUgZnV0dXJlLCB3ZSBtaWdodCB3YW4ndCB0byB0cmFjayBpbm5lciBmaWJlciBldmVudHMgdG9vLlxuLy8gVGhlbiB3ZSBjYW4ndCBzZXJpYWxpemUgdGhlIG9iamVjdCB3aXRoIG1ldGhvZHNcbi8vIFRoYXQncyB3aHkgd2UgdXNlIHRoaXMgbWV0aG9kIG9mIHJldHVybmluZyB0aGUgZGF0YVxuVHJhY2VyLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uIChuYW1lLCB0eXBlLCB7XG4gIHNlc3Npb25JZCxcbiAgbXNnSWQsXG4gIHVzZXJJZFxufSA9IHt9KSB7XG4gIC8vIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG4gIGlmICh0eXBlb2YgbmFtZSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHR5cGUgPT09ICdvYmplY3QnKSB7XG4gICAgbGV0IHNlc3Npb24gPSBuYW1lO1xuICAgIGxldCBtc2cgPSB0eXBlO1xuICAgIHNlc3Npb25JZCA9IHNlc3Npb24uaWQ7XG4gICAgbXNnSWQgPSBtc2cuaWQ7XG4gICAgdXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG5cbiAgICBpZiAobXNnLm1zZyA9PT0gJ21ldGhvZCcpIHtcbiAgICAgIHR5cGUgPSAnbWV0aG9kJztcbiAgICAgIG5hbWUgPSBtc2cubWV0aG9kO1xuICAgIH0gZWxzZSBpZiAobXNnLm1zZyA9PT0gJ3N1YicpIHtcbiAgICAgIHR5cGUgPSAnc3ViJztcbiAgICAgIG5hbWUgPSBtc2cubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgaWYgKFRSQUNFX1RZUEVTLmluZGV4T2YodHlwZSkgPT09IC0xKSB7XG4gICAgY29uc29sZS53YXJuKGBNb250aSBBUE06IHVua25vd24gdHJhY2UgdHlwZSBcIiR7dHlwZX1cImApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgdHJhY2VJbmZvID0ge1xuICAgIF9pZDogYCR7c2Vzc2lvbklkfTo6JHttc2dJZCB8fCBEZWZhdWx0VW5pcXVlSWQuZ2V0KCl9YCxcbiAgICB0eXBlLFxuICAgIG5hbWUsXG4gICAgc2Vzc2lvbjogc2Vzc2lvbklkLFxuICAgIGlkOiBtc2dJZCxcbiAgICBldmVudHM6IFtdLFxuICAgIHVzZXJJZCxcbiAgfTtcblxuICByZXR1cm4gdHJhY2VJbmZvO1xufTtcblxuVHJhY2VyLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0cmFjZUluZm8sIHR5cGUsIGRhdGEsIG1ldGFEYXRhKSB7XG4gIC8vIGRvIG5vdCBhbGxvdyB0byBwcm9jZWVkLCBpZiBhbHJlYWR5IGNvbXBsZXRlZCBvciBlcnJvcmVkXG4gIGxldCBsYXN0RXZlbnQgPSB0aGlzLmdldExhc3RFdmVudCh0cmFjZUluZm8pO1xuXG4gIGlmIChcbiAgICAvLyB0cmFjZSBjb21wbGV0ZWQgYnV0IGhhcyBub3QgYmVlbiBwcm9jZXNzZWRcbiAgICBsYXN0RXZlbnQgJiZcbiAgICBbJ2NvbXBsZXRlJywgJ2Vycm9yJ10uaW5kZXhPZihsYXN0RXZlbnQudHlwZSkgPj0gMCB8fFxuICAgIC8vIHRyYWNlIGNvbXBsZXRlZCBhbmQgcHJvY2Vzc2VkLlxuICAgIHRyYWNlSW5mby5pc0V2ZW50c1Byb2Nlc3NlZFxuICApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBsZXQgZXZlbnQgPSB7XG4gICAgdHlwZSxcbiAgICBhdDogTnRwLl9ub3coKSxcbiAgICBlbmRBdDogbnVsbCxcbiAgICBuZXN0ZWQ6IFtdLFxuICB9O1xuXG4gIC8vIHNwZWNpYWwgaGFuZGxpbmcgZm9yIGV2ZW50cyB0aGF0IGFyZSBub3QgcmVwZXRpdGl2ZVxuICBpZiAoIVJFUEVUSVRJVkVfRVZFTlRTW3R5cGVdKSB7XG4gICAgZXZlbnQuZW5kQXQgPSBldmVudC5hdDtcbiAgfVxuXG4gIGlmIChkYXRhKSB7XG4gICAgbGV0IGluZm8gPSBfLnBpY2sodHJhY2VJbmZvLCAndHlwZScsICduYW1lJyk7XG4gICAgZXZlbnQuZGF0YSA9IHRoaXMuX2FwcGx5RmlsdGVycyh0eXBlLCBkYXRhLCBpbmZvLCAnc3RhcnQnKTtcbiAgfVxuXG4gIGlmIChtZXRhRGF0YSAmJiBtZXRhRGF0YS5uYW1lKSB7XG4gICAgZXZlbnQubmFtZSA9IG1ldGFEYXRhLm5hbWU7XG4gIH1cblxuICBpZiAoS2FkaXJhLm9wdGlvbnMuZXZlbnRTdGFja1RyYWNlKSB7XG4gICAgZXZlbnQuc3RhY2sgPSBDcmVhdGVVc2VyU3RhY2soKTtcbiAgfVxuXG4gIGV2ZW50TG9nZ2VyKCclcyAlcycsIHR5cGUsIHRyYWNlSW5mby5faWQpO1xuXG4gIGlmIChsYXN0RXZlbnQgJiYgIWxhc3RFdmVudC5lbmRBdCkge1xuICAgIGlmICghbGFzdEV2ZW50Lm5lc3RlZCkge1xuICAgICAgY29uc29sZS5lcnJvcignTW9udGk6IGludmFsaWQgdHJhY2UuIFBsZWFzZSBzaGFyZSB0aGUgdHJhY2UgYmVsb3cgYXQnKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ01vbnRpOiBodHRwczovL2dpdGh1Yi5jb20vbW9udGktYXBtL21vbnRpLWFwbS1hZ2VudC9pc3N1ZXMvMTQnKTtcbiAgICAgIGNvbnNvbGUuZGlyKHRyYWNlSW5mbywgeyBkZXB0aDogMTAgfSk7XG4gICAgfVxuICAgIGxldCBsYXN0TmVzdGVkID0gbGFzdEV2ZW50Lm5lc3RlZFtsYXN0RXZlbnQubmVzdGVkLmxlbmd0aCAtIDFdO1xuXG4gICAgLy8gT25seSBuZXN0IG9uZSBsZXZlbFxuICAgIGlmICghbGFzdE5lc3RlZCB8fCBsYXN0TmVzdGVkLmVuZEF0KSB7XG4gICAgICBsYXN0RXZlbnQubmVzdGVkLnB1c2goZXZlbnQpO1xuICAgICAgcmV0dXJuIGV2ZW50O1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHRyYWNlSW5mby5ldmVudHMucHVzaChldmVudCk7XG5cbiAgcmV0dXJuIGV2ZW50O1xufTtcblxuVHJhY2VyLnByb3RvdHlwZS5ldmVudEVuZCA9IGZ1bmN0aW9uICh0cmFjZUluZm8sIGV2ZW50LCBkYXRhKSB7XG4gIGlmIChldmVudC5lbmRBdCkge1xuICAgIC8vIEV2ZW50IGFscmVhZHkgZW5kZWQgb3IgaXMgbm90IGEgcmVwaXRpdGl2ZSBldmVudFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGV2ZW50LmVuZEF0ID0gTnRwLl9ub3coKTtcblxuICBpZiAoZGF0YSkge1xuICAgIGxldCBpbmZvID0gXy5waWNrKHRyYWNlSW5mbywgJ3R5cGUnLCAnbmFtZScpO1xuICAgIGV2ZW50LmRhdGEgPSBPYmplY3QuYXNzaWduKFxuICAgICAgZXZlbnQuZGF0YSB8fCB7fSxcbiAgICAgIHRoaXMuX2FwcGx5RmlsdGVycyhgJHtldmVudC50eXBlfWVuZGAsIGRhdGEsIGluZm8sICdlbmQnKVxuICAgICk7XG4gIH1cbiAgZXZlbnRMb2dnZXIoJyVzICVzJywgYCR7ZXZlbnQudHlwZX1lbmRgLCB0cmFjZUluZm8uX2lkKTtcblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cblRyYWNlci5wcm90b3R5cGUuZ2V0TGFzdEV2ZW50ID0gZnVuY3Rpb24gKHRyYWNlSW5mbykge1xuICByZXR1cm4gdHJhY2VJbmZvLmV2ZW50c1t0cmFjZUluZm8uZXZlbnRzLmxlbmd0aCAtIDFdO1xufTtcblxuVHJhY2VyLnByb3RvdHlwZS5lbmRMYXN0RXZlbnQgPSBmdW5jdGlvbiAodHJhY2VJbmZvKSB7XG4gIGxldCBsYXN0RXZlbnQgPSB0aGlzLmdldExhc3RFdmVudCh0cmFjZUluZm8pO1xuXG4gIGlmICghbGFzdEV2ZW50LmVuZEF0KSB7XG4gICAgdGhpcy5ldmVudEVuZCh0cmFjZUluZm8sIGxhc3RFdmVudCk7XG4gICAgbGFzdEV2ZW50LmZvcmNlZEVuZCA9IHRydWU7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufTtcblxuLy8gTW9zdCBvZiB0aGUgdGltZSwgYWxsIHRoZSBuZXN0ZWQgZXZlbnRzIGFyZSBhc3luY1xuLy8gd2hpY2ggaXMgbm90IGhlbHBmdWwuIFRoaXMgcmV0dXJucyB0cnVlIGlmXG4vLyB0aGVyZSBhcmUgbmVzdGVkIGV2ZW50cyBvdGhlciB0aGFuIGFzeW5jLlxuVHJhY2VyLnByb3RvdHlwZS5faGFzVXNlZnVsTmVzdGVkID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIHJldHVybiBldmVudC5uZXN0ZWQgJiZcbiAgICBldmVudC5uZXN0ZWQubGVuZ3RoICYmXG4gICAgIWV2ZW50Lm5lc3RlZC5ldmVyeShlID0+IGUudHlwZSA9PT0gJ2FzeW5jJyk7XG59O1xuXG5UcmFjZXIucHJvdG90eXBlLmJ1aWxkRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQsIGRlcHRoID0gMCwgdHJhY2UpIHtcbiAgbGV0IGVsYXBzZWRUaW1lRm9yRXZlbnQgPSBldmVudC5lbmRBdCAtIGV2ZW50LmF0O1xuICBsZXQgYnVpbHRFdmVudCA9IFtldmVudC50eXBlXTtcbiAgbGV0IG5lc3RlZCA9IFtdO1xuXG4gIGJ1aWx0RXZlbnQucHVzaChlbGFwc2VkVGltZUZvckV2ZW50KTtcbiAgYnVpbHRFdmVudC5wdXNoKGV2ZW50LmRhdGEgfHwge30pO1xuXG4gIGlmICh0aGlzLl9oYXNVc2VmdWxOZXN0ZWQoZXZlbnQpKSB7XG4gICAgbGV0IHByZXZFbmQgPSBldmVudC5hdDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV2ZW50Lm5lc3RlZC5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IG5lc3RlZEV2ZW50ID0gZXZlbnQubmVzdGVkW2ldO1xuICAgICAgaWYgKCFuZXN0ZWRFdmVudC5lbmRBdCkge1xuICAgICAgICB0aGlzLmV2ZW50RW5kKHRyYWNlLCBuZXN0ZWRFdmVudCk7XG4gICAgICAgIG5lc3RlZEV2ZW50LmZvcmNlZEVuZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGxldCBjb21wdXRlVGltZSA9IG5lc3RlZEV2ZW50LmF0IC0gcHJldkVuZDtcbiAgICAgIGlmIChjb21wdXRlVGltZSA+IDApIHtcbiAgICAgICAgbmVzdGVkLnB1c2goWydjb21wdXRlJywgY29tcHV0ZVRpbWVdKTtcbiAgICAgIH1cblxuICAgICAgbmVzdGVkLnB1c2godGhpcy5idWlsZEV2ZW50KG5lc3RlZEV2ZW50LCBkZXB0aCArIDEsIHRyYWNlKSk7XG4gICAgICBwcmV2RW5kID0gbmVzdGVkRXZlbnQuZW5kQXQ7XG4gICAgfVxuICB9XG5cblxuICBpZiAoXG4gICAgbmVzdGVkLmxlbmd0aCB8fFxuICAgIGV2ZW50LnN0YWNrIHx8XG4gICAgZXZlbnQuZm9yY2VkRW5kIHx8XG4gICAgZXZlbnQubmFtZVxuICApIHtcbiAgICBidWlsdEV2ZW50LnB1c2goe1xuICAgICAgc3RhY2s6IGV2ZW50LnN0YWNrLFxuICAgICAgbmVzdGVkOiBuZXN0ZWQubGVuZ3RoID8gbmVzdGVkIDogdW5kZWZpbmVkLFxuICAgICAgZm9yY2VkRW5kOiBldmVudC5mb3JjZWRFbmQsXG4gICAgICBuYW1lOiBldmVudC5uYW1lXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gYnVpbHRFdmVudDtcbn07XG5cblRyYWNlci5wcm90b3R5cGUuYnVpbGRUcmFjZSA9IGZ1bmN0aW9uICh0cmFjZUluZm8pIHtcbiAgbGV0IGZpcnN0RXZlbnQgPSB0cmFjZUluZm8uZXZlbnRzWzBdO1xuICBsZXQgbGFzdEV2ZW50ID0gdHJhY2VJbmZvLmV2ZW50c1t0cmFjZUluZm8uZXZlbnRzLmxlbmd0aCAtIDFdO1xuICBsZXQgcHJvY2Vzc2VkRXZlbnRzID0gW107XG5cbiAgaWYgKGZpcnN0RXZlbnQudHlwZSAhPT0gJ3N0YXJ0Jykge1xuICAgIGNvbnNvbGUud2FybignTW9udGkgQVBNOiB0cmFjZSBoYXMgbm90IHN0YXJ0ZWQgeWV0Jyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH0gZWxzZSBpZiAobGFzdEV2ZW50LnR5cGUgIT09ICdjb21wbGV0ZScgJiYgbGFzdEV2ZW50LnR5cGUgIT09ICdlcnJvcicpIHtcbiAgICAvLyB0cmFjZSBpcyBub3QgY29tcGxldGVkIG9yIGVycm9yZWQgeWV0XG4gICAgY29uc29sZS53YXJuKCdNb250aSBBUE06IHRyYWNlIGhhcyBub3QgY29tcGxldGVkIG9yIGVycm9yZWQgeWV0Jyk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgLy8gYnVpbGQgdGhlIG1ldHJpY3NcbiAgdHJhY2VJbmZvLmVycm9yZWQgPSBsYXN0RXZlbnQudHlwZSA9PT0gJ2Vycm9yJztcbiAgdHJhY2VJbmZvLmF0ID0gZmlyc3RFdmVudC5hdDtcblxuICBsZXQgbWV0cmljcyA9IHtcbiAgICB0b3RhbDogbGFzdEV2ZW50LmF0IC0gZmlyc3RFdmVudC5hdCxcbiAgfTtcblxuICBsZXQgdG90YWxOb25Db21wdXRlID0gMDtcblxuICBmaXJzdEV2ZW50ID0gWydzdGFydCcsIDBdO1xuICBpZiAodHJhY2VJbmZvLmV2ZW50c1swXS5kYXRhKSB7XG4gICAgZmlyc3RFdmVudC5wdXNoKHRyYWNlSW5mby5ldmVudHNbMF0uZGF0YSk7XG4gIH1cbiAgcHJvY2Vzc2VkRXZlbnRzLnB1c2goZmlyc3RFdmVudCk7XG5cbiAgbGV0IGNvbXB1dGVUaW1lO1xuXG4gIGZvciAobGV0IGxjID0gMTsgbGMgPCB0cmFjZUluZm8uZXZlbnRzLmxlbmd0aCAtIDE7IGxjICs9IDEpIHtcbiAgICBsZXQgcHJldkV2ZW50ID0gdHJhY2VJbmZvLmV2ZW50c1tsYyAtIDFdO1xuICAgIGxldCBldmVudCA9IHRyYWNlSW5mby5ldmVudHNbbGNdO1xuXG4gICAgaWYgKCFldmVudC5lbmRBdCkge1xuICAgICAgY29uc29sZS5lcnJvcignTW9udGkgQVBNOiBubyBlbmQgZXZlbnQgZm9yIHR5cGU6ICcsIGV2ZW50LnR5cGUpO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29tcHV0ZVRpbWUgPSBldmVudC5hdCAtIHByZXZFdmVudC5lbmRBdDtcbiAgICBpZiAoY29tcHV0ZVRpbWUgPiAwKSB7XG4gICAgICBwcm9jZXNzZWRFdmVudHMucHVzaChbJ2NvbXB1dGUnLCBjb21wdXRlVGltZV0pO1xuICAgIH1cbiAgICBsZXQgYnVpbHRFdmVudCA9IHRoaXMuYnVpbGRFdmVudChldmVudCwgMCwgdHJhY2VJbmZvKTtcbiAgICBwcm9jZXNzZWRFdmVudHMucHVzaChidWlsdEV2ZW50KTtcblxuICAgIG1ldHJpY3NbZXZlbnQudHlwZV0gPSBtZXRyaWNzW2V2ZW50LnR5cGVdIHx8IDA7XG4gICAgbWV0cmljc1tldmVudC50eXBlXSArPSBidWlsdEV2ZW50WzFdO1xuICAgIHRvdGFsTm9uQ29tcHV0ZSArPSBidWlsdEV2ZW50WzFdO1xuICB9XG5cblxuICBjb21wdXRlVGltZSA9IGxhc3RFdmVudC5hdCAtIHRyYWNlSW5mby5ldmVudHNbdHJhY2VJbmZvLmV2ZW50cy5sZW5ndGggLSAyXS5lbmRBdDtcblxuICBpZiAoY29tcHV0ZVRpbWUgPiAwKSB7XG4gICAgcHJvY2Vzc2VkRXZlbnRzLnB1c2goWydjb21wdXRlJywgY29tcHV0ZVRpbWVdKTtcbiAgfVxuXG4gIGxldCBsYXN0RXZlbnREYXRhID0gW2xhc3RFdmVudC50eXBlLCAwXTtcbiAgaWYgKGxhc3RFdmVudC5kYXRhKSB7XG4gICAgbGFzdEV2ZW50RGF0YS5wdXNoKGxhc3RFdmVudC5kYXRhKTtcbiAgfVxuICBwcm9jZXNzZWRFdmVudHMucHVzaChsYXN0RXZlbnREYXRhKTtcblxuICBpZiAocHJvY2Vzc2VkRXZlbnRzLmxlbmd0aCA+IE1BWF9UUkFDRV9FVkVOVFMpIHtcbiAgICBjb25zdCByZW1vdmVDb3VudCA9IHByb2Nlc3NlZEV2ZW50cy5sZW5ndGggLSBNQVhfVFJBQ0VfRVZFTlRTO1xuICAgIHByb2Nlc3NlZEV2ZW50cy5zcGxpY2UoTUFYX1RSQUNFX0VWRU5UUywgcmVtb3ZlQ291bnQpO1xuICB9XG5cbiAgbWV0cmljcy5jb21wdXRlID0gbWV0cmljcy50b3RhbCAtIHRvdGFsTm9uQ29tcHV0ZTtcbiAgdHJhY2VJbmZvLm1ldHJpY3MgPSBtZXRyaWNzO1xuICB0cmFjZUluZm8uZXZlbnRzID0gcHJvY2Vzc2VkRXZlbnRzO1xuICB0cmFjZUluZm8uaXNFdmVudHNQcm9jZXNzZWQgPSB0cnVlO1xuICByZXR1cm4gdHJhY2VJbmZvO1xufTtcblxuLyoqXG4gKiBUaGVyZSBhcmUgdHdvIGZvcm1hdHMgZm9yIHRyYWNlcy4gV2hpbGUgdGhlIG1ldGhvZC9wdWJsaWNhdGlvbiBpcyBydW5uaW5nLCB0aGUgdHJhY2UgaXMgaW4gdGhlIG9iamVjdCBmb3JtYXQuXG4gKiBUaGlzIGlzIGVhc2llciB0byB3b3JrIHdpdGgsIGJ1dCB0YWtlcyBtb3JlIHNwYWNlIHRvIHN0b3JlLiBBZnRlciB0aGUgdHJhY2UgaXMgY29tcGxldGUgKGVpdGhlciBmaW5pc2hlZCBvciBlcnJvcmVkKSxcbiAqIGl0IGlzIGJ1aWx0IHdoaWNoIGFtb25nIG90aGVyIHRoaW5ncyBjb252ZXJ0cyB0aGUgZXZlbnRzIHRvIHRoZSBhcnJheSBmb3JtYXQuXG4gKlxuICogVGhlIGtleSBkaWZmZXJlbmNlIG9mIGBvcHRpbWl6ZUV2ZW50YCBhbmQgYG9wdGltaXplRXZlbnRzYCBpcyB0aGF0IHRoZXkgZG8gbm90IG11dGF0ZSB0aGUgb3JpZ2luYWwgZXZlbnRzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmplY3RFdmVudCBFeHBhbmRlZCBvYmplY3QgZXZlbnQuXG4gKlxuICogQHJldHVybnMge0FycmF5fSBBcnJheSBub3RhdGlvbiBvZiB0aGUgZXZlbnQgb3B0aW1pemVkIGZvciB0cmFuc3BvcnRcbiAqL1xuVHJhY2VyLnByb3RvdHlwZS5vcHRpbWl6ZUV2ZW50ID0gZnVuY3Rpb24gKG9iamVjdEV2ZW50KSB7XG4gIGxldCB7YXQsIGVuZEF0LCBzdGFjaywgbmVzdGVkID0gW10sIGZvcmNlZEVuZCwgbmFtZSwgdHlwZSwgZGF0YX0gPSBvYmplY3RFdmVudDtcblxuICBpZiAoIWVuZEF0KSB7XG4gICAgZW5kQXQgPSBOdHAuX25vdygpO1xuICAgIGZvcmNlZEVuZCA9IHRydWU7XG4gIH1cblxuICBsZXQgZHVyYXRpb24gPSBhdCAmJiBlbmRBdCA/IGVuZEF0IC0gYXQgOiAwO1xuXG4gIGNvbnN0IG9wdGltaXplZE5lc3RlZEV2ZW50cyA9IHRoaXMuX2hhc1VzZWZ1bE5lc3RlZChvYmplY3RFdmVudCkgPyB0aGlzLm9wdGltaXplRXZlbnRzKG5lc3RlZCkgOiB1bmRlZmluZWQ7XG5cbiAgY29uc3Qgb3B0aW1pemVkRXZlbnQgPSBbdHlwZSwgZHVyYXRpb24sIGRhdGEgfHwge31dO1xuXG4gIGNvbnN0IGV4dHJhSW5mbyA9IHtcbiAgICBzdGFjayxcbiAgICBmb3JjZWRFbmQsXG4gICAgbmFtZSxcbiAgICBuZXN0ZWQ6IG9wdGltaXplZE5lc3RlZEV2ZW50c1xuICB9O1xuXG4gIGlmIChvYmplY3RIYXNEYXRhKGV4dHJhSW5mbykpIHtcbiAgICBvcHRpbWl6ZWRFdmVudC5wdXNoKGV4dHJhSW5mbyk7XG4gIH1cblxuICByZXR1cm4gb3B0aW1pemVkRXZlbnQ7XG59O1xuXG5UcmFjZXIucHJvdG90eXBlLm9wdGltaXplRXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50cykge1xuICBpZiAoIWV2ZW50cykge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IG9wdGltaXplZEV2ZW50cyA9IFtdO1xuXG4gIGxldCBwcmV2RXZlbnQgPSB7fTtcblxuICBldmVudHMuZm9yRWFjaCgoZXZlbnQpID0+IHtcbiAgICBpZiAocHJldkV2ZW50LmVuZEF0ICYmIGV2ZW50LmF0KSB7XG4gICAgICBjb25zdCBjb21wdXRlVGltZSA9IGV2ZW50LmF0IC0gcHJldkV2ZW50LmVuZEF0O1xuXG4gICAgICBpZiAoY29tcHV0ZVRpbWUgPiAwKSB7XG4gICAgICAgIG9wdGltaXplZEV2ZW50cy5wdXNoKFsnY29tcHV0ZScsIGNvbXB1dGVUaW1lXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgb3B0aW1pemVkRXZlbnRzLnB1c2godGhpcy5vcHRpbWl6ZUV2ZW50KGV2ZW50KSk7XG5cbiAgICBwcmV2RXZlbnQgPSBldmVudDtcbiAgfSk7XG5cbiAgcmV0dXJuIG9wdGltaXplZEV2ZW50cztcbn07XG5cblRyYWNlci5wcm90b3R5cGUuYWRkRmlsdGVyID0gZnVuY3Rpb24gKGZpbHRlckZuKSB7XG4gIHRoaXMuX2ZpbHRlcnMucHVzaChmaWx0ZXJGbik7XG59O1xuXG5UcmFjZXIucHJvdG90eXBlLnJlZGFjdEZpZWxkID0gZnVuY3Rpb24gKGZpZWxkKSB7XG4gIHRoaXMuX2ZpbHRlckZpZWxkcy5wdXNoKGZpZWxkKTtcbn07XG5cblRyYWNlci5wcm90b3R5cGUuX2FwcGx5RmlsdGVycyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGRhdGEsIGluZm8pIHtcbiAgdGhpcy5fZmlsdGVycy5mb3JFYWNoKGZ1bmN0aW9uIChmaWx0ZXJGbikge1xuICAgIGRhdGEgPSBmaWx0ZXJGbihldmVudFR5cGUsIF8uY2xvbmUoZGF0YSksIGluZm8pO1xuICB9KTtcblxuICByZXR1cm4gZGF0YTtcbn07XG5cblRyYWNlci5wcm90b3R5cGUuX2FwcGx5T2JqZWN0RmlsdGVycyA9IGZ1bmN0aW9uICh0b0ZpbHRlcikge1xuICBjb25zdCBmaWx0ZXJPYmplY3QgPSAob2JqKSA9PiB7XG4gICAgbGV0IGNsb25lZDtcbiAgICB0aGlzLl9maWx0ZXJGaWVsZHMuZm9yRWFjaChmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgIGlmIChmaWVsZCBpbiBvYmopIHtcbiAgICAgICAgY2xvbmVkID0gY2xvbmVkIHx8IE9iamVjdC5hc3NpZ24oe30sIG9iaik7XG4gICAgICAgIGNsb25lZFtmaWVsZF0gPSAnTW9udGk6IHJlZGFjdGVkJztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjbG9uZWQ7XG4gIH07XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkodG9GaWx0ZXIpKSB7XG4gICAgbGV0IGNsb25lZDtcbiAgICAvLyBUaGVyZSBjb3VsZCBiZSB0aG91c2FuZHMgb3IgbW9yZSBpdGVtcyBpbiB0aGUgYXJyYXksIGFuZCB0aGlzIHVzdWFsbHkgcnVuc1xuICAgIC8vIGJlZm9yZSB0aGUgZGF0YSBpcyB2YWxpZGF0ZWQuIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIGxpbWl0IGhvd1xuICAgIC8vIG1hbnkgdG8gY2hlY2tcbiAgICBsZXQgbGVuZ3RoID0gTWF0aC5taW4odG9GaWx0ZXIubGVuZ3RoLCB0aGlzLm1heEFycmF5SXRlbXNUb0ZpbHRlcik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHR5cGVvZiB0b0ZpbHRlcltpXSA9PT0gJ29iamVjdCcgJiYgdG9GaWx0ZXJbaV0gIT09IG51bGwpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IGZpbHRlck9iamVjdCh0b0ZpbHRlcltpXSk7XG4gICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICBjbG9uZWQgPSBjbG9uZWQgfHwgWy4uLnRvRmlsdGVyXTtcbiAgICAgICAgICBjbG9uZWRbaV0gPSByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY2xvbmVkIHx8IHRvRmlsdGVyO1xuICB9XG5cbiAgcmV0dXJuIGZpbHRlck9iamVjdCh0b0ZpbHRlcikgfHwgdG9GaWx0ZXI7XG59O1xuXG5LYWRpcmEudHJhY2VyID0gbmV3IFRyYWNlcigpO1xuLy8gbmVlZCB0byBleHBvc2UgVHJhY2VyIHRvIHByb3ZpZGUgZGVmYXVsdCBzZXQgb2YgZmlsdGVyc1xuS2FkaXJhLlRyYWNlciA9IFRyYWNlcjtcbiIsImltcG9ydCB7IFRyYWNlciB9IGZyb20gJy4vdHJhY2VyJztcblxuLy8gc3RyaXAgc2Vuc2l0aXZlIGRhdGEgc2VudCB0byBNb250aSBBUE0gZW5naW5lLlxuLy8gcG9zc2libGUgdG8gbGltaXQgdHlwZXMgYnkgcHJvdmlkaW5nIGFuIGFycmF5IG9mIHR5cGVzIHRvIHN0cmlwXG4vLyBwb3NzaWJsZSB0eXBlcyBhcmU6IFwic3RhcnRcIiwgXCJkYlwiLCBcImh0dHBcIiwgXCJlbWFpbFwiXG5UcmFjZXIuc3RyaXBTZW5zaXRpdmUgPSBmdW5jdGlvbiBzdHJpcFNlbnNpdGl2ZSAodHlwZXNUb1N0cmlwLCByZWNlaXZlclR5cGUsIG5hbWUpIHtcbiAgdHlwZXNUb1N0cmlwID0gdHlwZXNUb1N0cmlwIHx8IFtdO1xuXG4gIGxldCBzdHJpcHBlZFR5cGVzID0ge307XG4gIHR5cGVzVG9TdHJpcC5mb3JFYWNoKGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgc3RyaXBwZWRUeXBlc1t0eXBlXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBmdW5jdGlvbiAodHlwZSwgZGF0YSwgaW5mbykge1xuICAgIGlmICh0eXBlc1RvU3RyaXAubGVuZ3RoID4gMCAmJiAhc3RyaXBwZWRUeXBlc1t0eXBlXSkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgaWYgKHJlY2VpdmVyVHlwZSAmJiByZWNlaXZlclR5cGUgIT09IGluZm8udHlwZSkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPT0gaW5mby5uYW1lKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICBpZiAodHlwZSA9PT0gJ3N0YXJ0Jykge1xuICAgICAgaWYgKGRhdGEucGFyYW1zKSB7XG4gICAgICAgIGRhdGEucGFyYW1zID0gJ1tzdHJpcHBlZF0nO1xuICAgICAgfVxuICAgICAgaWYgKGRhdGEuaGVhZGVycykge1xuICAgICAgICBkYXRhLmhlYWRlcnMgPSAnW3N0cmlwcGVkXSc7XG4gICAgICB9XG4gICAgICBpZiAoZGF0YS5ib2R5KSB7XG4gICAgICAgIGRhdGEuYm9keSA9ICdbc3RyaXBwZWRdJztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdkYicpIHtcbiAgICAgIGRhdGEuc2VsZWN0b3IgPSAnW3N0cmlwcGVkXSc7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnaHR0cCcpIHtcbiAgICAgIGRhdGEudXJsID0gJ1tzdHJpcHBlZF0nO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2VtYWlsJykge1xuICAgICAgWydmcm9tJywgJ3RvJywgJ2NjJywgJ2JjYycsICdyZXBseVRvJ10uZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgICBpZiAoZGF0YVtpdGVtXSkge1xuICAgICAgICAgIGRhdGFbaXRlbV0gPSAnW3N0cmlwcGVkXSc7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xufTtcblxuLy8gU3RyaXAgc2Vuc2l0aXZlIGRhdGEgc2VudCB0byBNb250aSBBUE0gZW5naW5lLlxuLy8gSW4gY29udHJhc3QgdG8gc3RyaXBTZW5zaXRpdmUsIHRoaXMgb25lIGhhcyBhbiBhbGxvdyBsaXN0IG9mIHdoYXQgdG8ga2VlcFxuLy8gdG8gZ3VhcmQgYWdhaW5zdCBmb3JnZXR0aW5nIHRvIHN0cmlwIG5ldyBmaWVsZHNcbi8vIEluIHRoZSBmdXR1cmUgdGhpcyBvbmUgbWlnaHQgcmVwbGFjZSBUcmFjZXIuc3RyaXBTZW5zaXRpdmVcbi8vIG9wdGlvbnNcblRyYWNlci5zdHJpcFNlbnNpdGl2ZVRob3JvdWdoID0gZnVuY3Rpb24gc3RyaXBTZW5zaXRpdmUgKCkge1xuICByZXR1cm4gZnVuY3Rpb24gKHR5cGUsIGRhdGEpIHtcbiAgICBsZXQgZmllbGRzVG9LZWVwID0gW107XG5cbiAgICBpZiAodHlwZSA9PT0gJ3N0YXJ0Jykge1xuICAgICAgZmllbGRzVG9LZWVwID0gWyd1c2VySWQnXTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd3YWl0ZW5kJykge1xuICAgICAgZmllbGRzVG9LZWVwID0gWyd3YWl0T24nXTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdkYicpIHtcbiAgICAgIGZpZWxkc1RvS2VlcCA9IFtcbiAgICAgICAgJ2NvbGwnLCAnZnVuYycsICdjdXJzb3InLCAnbGltaXQnLCAnZG9jc0ZldGNoZWQnLCAnZG9jU2l6ZScsICdvcGxvZycsXG4gICAgICAgICdmaWVsZHMnLCAncHJvamVjdGlvbicsICd3YXNNdWx0aXBsZXhlclJlYWR5JywgJ3F1ZXVlTGVuZ3RoJywgJ2VsYXBzZWRQb2xsaW5nVGltZScsXG4gICAgICAgICdub09mQ2FjaGVkRG9jcydcbiAgICAgIF07XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnaHR0cCcpIHtcbiAgICAgIGZpZWxkc1RvS2VlcCA9IFsnbWV0aG9kJywgJ3N0YXR1c0NvZGUnXTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdlbWFpbCcpIHtcbiAgICAgIGZpZWxkc1RvS2VlcCA9IFtdO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2N1c3RvbScpIHtcbiAgICAgIC8vIFRoaXMgaXMgc3VwcGxpZWQgYnkgdGhlIHVzZXIgc28gd2UgYXNzdW1lIHRoZXkgYXJlIG9ubHkgZ2l2aW5nIGRhdGEgdGhhdCBjYW4gYmUgc2VudFxuICAgICAgZmllbGRzVG9LZWVwID0gT2JqZWN0LmtleXMoZGF0YSk7XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSAnZXJyb3InKSB7XG4gICAgICBmaWVsZHNUb0tlZXAgPSBbJ2Vycm9yJ107XG4gICAgfVxuXG4gICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKGZpZWxkc1RvS2VlcC5pbmRleE9mKGtleSkgPT09IC0xKSB7XG4gICAgICAgIGRhdGFba2V5XSA9ICdbc3RyaXBwZWRdJztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xufTtcblxuLy8gc3RyaXAgc2VsZWN0b3JzIG9ubHkgZnJvbSB0aGUgZ2l2ZW4gbGlzdCBvZiBjb2xsZWN0aW9uIG5hbWVzXG5UcmFjZXIuc3RyaXBTZWxlY3RvcnMgPSBmdW5jdGlvbiBzdHJpcFNlbGVjdG9ycyAoY29sbGVjdGlvbkxpc3QsIHJlY2VpdmVyVHlwZSwgbmFtZSkge1xuICBjb2xsZWN0aW9uTGlzdCA9IGNvbGxlY3Rpb25MaXN0IHx8IFtdO1xuXG4gIGxldCBjb2xsTWFwID0ge307XG4gIGNvbGxlY3Rpb25MaXN0LmZvckVhY2goZnVuY3Rpb24gKGNvbGxOYW1lKSB7XG4gICAgY29sbE1hcFtjb2xsTmFtZV0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gZnVuY3Rpb24gKHR5cGUsIGRhdGEsIGluZm8pIHtcbiAgICBpZiAodHlwZSAhPT0gJ2RiJyB8fCAoZGF0YSAmJiAhY29sbE1hcFtkYXRhLmNvbGxdKSkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgaWYgKHJlY2VpdmVyVHlwZSAmJiByZWNlaXZlclR5cGUgIT09IGluZm8udHlwZSkge1xuICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgaWYgKG5hbWUgJiYgbmFtZSAhPT0gaW5mby5uYW1lKSB7XG4gICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICBkYXRhLnNlbGVjdG9yID0gJ1tzdHJpcHBlZF0nO1xuICAgIHJldHVybiBkYXRhO1xuICB9O1xufTtcbiIsImltcG9ydCB7IF8gfSBmcm9tICdtZXRlb3IvdW5kZXJzY29yZSc7XG5pbXBvcnQgeyBFSlNPTiB9IGZyb20gJ21ldGVvci9lanNvbic7XG5sZXQgbG9nZ2VyID0gTnBtLnJlcXVpcmUoJ2RlYnVnJykoJ2thZGlyYTp0cycpO1xuXG5leHBvcnQgZnVuY3Rpb24gVHJhY2VyU3RvcmUgKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgdGhpcy5tYXhUb3RhbFBvaW50cyA9IG9wdGlvbnMubWF4VG90YWxQb2ludHMgfHwgMzA7XG4gIHRoaXMuaW50ZXJ2YWwgPSBvcHRpb25zLmludGVydmFsIHx8IDEwMDAgKiA2MDtcbiAgdGhpcy5hcmNoaXZlRXZlcnkgPSBvcHRpb25zLmFyY2hpdmVFdmVyeSB8fCB0aGlzLm1heFRvdGFsUG9pbnRzIC8gNjtcblxuICAvLyBzdG9yZSBtYXggdG90YWwgb24gdGhlIHBhc3QgMzAgbWludXRlcyAob3IgcGFzdCAzMCBpdGVtcylcbiAgdGhpcy5tYXhUb3RhbHMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAvLyBzdG9yZSB0aGUgbWF4IHRyYWNlIG9mIHRoZSBjdXJyZW50IGludGVydmFsXG4gIHRoaXMuY3VycmVudE1heFRyYWNlID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgLy8gYXJjaGl2ZSBmb3IgdGhlIHRyYWNlc1xuICB0aGlzLnRyYWNlQXJjaGl2ZSA9IFtdO1xuXG4gIHRoaXMucHJvY2Vzc2VkQ250ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAvLyBncm91cCBlcnJvcnMgYnkgbWVzc2FnZXMgYmV0d2VlbiBhbiBpbnRlcnZhbFxuICB0aGlzLmVycm9yTWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cblxuVHJhY2VyU3RvcmUucHJvdG90eXBlLmFkZFRyYWNlID0gZnVuY3Rpb24gKHRyYWNlKSB7XG4gIGxldCBraW5kID0gW3RyYWNlLnR5cGUsIHRyYWNlLm5hbWVdLmpvaW4oJzo6Jyk7XG4gIGlmICghdGhpcy5jdXJyZW50TWF4VHJhY2Vba2luZF0pIHtcbiAgICB0aGlzLmN1cnJlbnRNYXhUcmFjZVtraW5kXSA9IEVKU09OLmNsb25lKHRyYWNlKTtcbiAgfSBlbHNlIGlmICh0aGlzLmN1cnJlbnRNYXhUcmFjZVtraW5kXS5tZXRyaWNzLnRvdGFsIDwgdHJhY2UubWV0cmljcy50b3RhbCkge1xuICAgIHRoaXMuY3VycmVudE1heFRyYWNlW2tpbmRdID0gRUpTT04uY2xvbmUodHJhY2UpO1xuICB9IGVsc2UgaWYgKHRyYWNlLmVycm9yZWQpIHtcbiAgICB0aGlzLl9oYW5kbGVFcnJvcnModHJhY2UpO1xuICB9XG59O1xuXG5UcmFjZXJTdG9yZS5wcm90b3R5cGUuY29sbGVjdFRyYWNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IHRyYWNlcyA9IHRoaXMudHJhY2VBcmNoaXZlO1xuICB0aGlzLnRyYWNlQXJjaGl2ZSA9IFtdO1xuXG4gIC8vIGNvbnZlcnQgYXQodGltZXN0YW1wKSBpbnRvIHRoZSBhY3R1YWwgc2VydmVyVGltZVxuICB0cmFjZXMuZm9yRWFjaChmdW5jdGlvbiAodHJhY2UpIHtcbiAgICB0cmFjZS5hdCA9IEthZGlyYS5zeW5jZWREYXRlLnN5bmNUaW1lKHRyYWNlLmF0KTtcbiAgfSk7XG4gIHJldHVybiB0cmFjZXM7XG59O1xuXG5UcmFjZXJTdG9yZS5wcm90b3R5cGUuc3RhcnQgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX3RpbWVvdXRIYW5kbGVyID0gc2V0SW50ZXJ2YWwodGhpcy5wcm9jZXNzVHJhY2VzLmJpbmQodGhpcyksIHRoaXMuaW50ZXJ2YWwpO1xufTtcblxuVHJhY2VyU3RvcmUucHJvdG90eXBlLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLl90aW1lb3V0SGFuZGxlcikge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy5fdGltZW91dEhhbmRsZXIpO1xuICB9XG59O1xuXG5UcmFjZXJTdG9yZS5wcm90b3R5cGUuX2hhbmRsZUVycm9ycyA9IGZ1bmN0aW9uICh0cmFjZSkge1xuICAvLyBzZW5kaW5nIGVycm9yIHJlcXVlc3RzIGFzIGl0IGlzXG4gIGxldCBsYXN0RXZlbnQgPSB0cmFjZS5ldmVudHNbdHJhY2UuZXZlbnRzLmxlbmd0aCAtIDFdO1xuICBpZiAobGFzdEV2ZW50ICYmIGxhc3RFdmVudFsyXSkge1xuICAgIGxldCBlcnJvciA9IGxhc3RFdmVudFsyXS5lcnJvcjtcblxuICAgIC8vIGdyb3VwaW5nIGVycm9ycyBvY2N1cmVkIChyZXNldCBhZnRlciBwcm9jZXNzVHJhY2VzKVxuICAgIGxldCBlcnJvcktleSA9IFt0cmFjZS50eXBlLCB0cmFjZS5uYW1lLCBlcnJvci5tZXNzYWdlXS5qb2luKCc6OicpO1xuICAgIGlmICghdGhpcy5lcnJvck1hcFtlcnJvcktleV0pIHtcbiAgICAgIGxldCBlcnJvcmVkVHJhY2UgPSBFSlNPTi5jbG9uZSh0cmFjZSk7XG4gICAgICB0aGlzLmVycm9yTWFwW2Vycm9yS2V5XSA9IGVycm9yZWRUcmFjZTtcblxuICAgICAgdGhpcy50cmFjZUFyY2hpdmUucHVzaChlcnJvcmVkVHJhY2UpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsb2dnZXIoJ2xhc3QgZXZlbnRzIGlzIG5vdCBhbiBlcnJvcjogJywgSlNPTi5zdHJpbmdpZnkodHJhY2UuZXZlbnRzKSk7XG4gIH1cbn07XG5cblRyYWNlclN0b3JlLnByb3RvdHlwZS5wcm9jZXNzVHJhY2VzID0gZnVuY3Rpb24gKCkge1xuICBsZXQgc2VsZiA9IHRoaXM7XG5cbiAgbGV0IGtpbmRzID0gbmV3IFNldCgpO1xuICBPYmplY3Qua2V5cyh0aGlzLm1heFRvdGFscykuZm9yRWFjaChrZXkgPT4ge1xuICAgIGtpbmRzLmFkZChrZXkpO1xuICB9KTtcbiAgT2JqZWN0LmtleXModGhpcy5jdXJyZW50TWF4VHJhY2UpLmZvckVhY2goa2V5ID0+IHtcbiAgICBraW5kcy5hZGQoa2V5KTtcbiAgfSk7XG5cbiAgZm9yIChjb25zdCBraW5kIG9mIGtpbmRzKSB7XG4gICAgc2VsZi5wcm9jZXNzZWRDbnRba2luZF0gPSBzZWxmLnByb2Nlc3NlZENudFtraW5kXSB8fCAwO1xuICAgIGxldCBjdXJyZW50TWF4VHJhY2UgPSBzZWxmLmN1cnJlbnRNYXhUcmFjZVtraW5kXTtcbiAgICBsZXQgY3VycmVudE1heFRvdGFsID0gY3VycmVudE1heFRyYWNlID8gY3VycmVudE1heFRyYWNlLm1ldHJpY3MudG90YWwgOiAwO1xuXG4gICAgc2VsZi5tYXhUb3RhbHNba2luZF0gPSBzZWxmLm1heFRvdGFsc1traW5kXSB8fCBbXTtcbiAgICAvLyBhZGQgdGhlIGN1cnJlbnQgbWF4UG9pbnRcbiAgICBzZWxmLm1heFRvdGFsc1traW5kXS5wdXNoKGN1cnJlbnRNYXhUb3RhbCk7XG4gICAgbGV0IGV4Y2VlZGluZ1BvaW50cyA9IHNlbGYubWF4VG90YWxzW2tpbmRdLmxlbmd0aCAtIHNlbGYubWF4VG90YWxQb2ludHM7XG4gICAgaWYgKGV4Y2VlZGluZ1BvaW50cyA+IDApIHtcbiAgICAgIHNlbGYubWF4VG90YWxzW2tpbmRdLnNwbGljZSgwLCBleGNlZWRpbmdQb2ludHMpO1xuICAgIH1cblxuICAgIGxldCBhcmNoaXZlRGVmYXVsdCA9IChzZWxmLnByb2Nlc3NlZENudFtraW5kXSAlIHNlbGYuYXJjaGl2ZUV2ZXJ5KSA9PT0gMDtcbiAgICBzZWxmLnByb2Nlc3NlZENudFtraW5kXSsrO1xuXG4gICAgbGV0IGNhbkFyY2hpdmUgPSBhcmNoaXZlRGVmYXVsdCB8fFxuICAgICAgc2VsZi5faXNUcmFjZU91dGxpZXIoa2luZCwgY3VycmVudE1heFRyYWNlKTtcblxuICAgIGlmIChjYW5BcmNoaXZlICYmIGN1cnJlbnRNYXhUcmFjZSkge1xuICAgICAgc2VsZi50cmFjZUFyY2hpdmUucHVzaChjdXJyZW50TWF4VHJhY2UpO1xuICAgIH1cblxuICAgIC8vIHJlc2V0IGN1cnJlbnRNYXhUcmFjZVxuICAgIHNlbGYuY3VycmVudE1heFRyYWNlW2tpbmRdID0gbnVsbDtcbiAgfVxuXG4gIC8vIHJlc2V0IHRoZSBlcnJvck1hcFxuICBzZWxmLmVycm9yTWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn07XG5cblRyYWNlclN0b3JlLnByb3RvdHlwZS5faXNUcmFjZU91dGxpZXIgPSBmdW5jdGlvbiAoa2luZCwgdHJhY2UpIHtcbiAgaWYgKHRyYWNlKSB7XG4gICAgbGV0IGRhdGFTZXQgPSB0aGlzLm1heFRvdGFsc1traW5kXTtcbiAgICByZXR1cm4gdGhpcy5faXNPdXRsaWVyKGRhdGFTZXQsIHRyYWNlLm1ldHJpY3MudG90YWwsIDMpO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qXG4gIERhdGEgcG9pbnQgbXVzdCBleGlzdHMgaW4gdGhlIGRhdGFTZXRcbiovXG5UcmFjZXJTdG9yZS5wcm90b3R5cGUuX2lzT3V0bGllciA9IGZ1bmN0aW9uIChkYXRhU2V0LCBkYXRhUG9pbnQsIG1heE1hZFopIHtcbiAgbGV0IG1lZGlhbiA9IHRoaXMuX2dldE1lZGlhbihkYXRhU2V0KTtcbiAgbGV0IG1hZCA9IHRoaXMuX2NhbGN1bGF0ZU1hZChkYXRhU2V0LCBtZWRpYW4pO1xuICBsZXQgbWFkWiA9IHRoaXMuX2Z1bmNNZWRpYW5EZXZpYXRpb24obWVkaWFuKShkYXRhUG9pbnQpIC8gbWFkO1xuXG4gIHJldHVybiBtYWRaID4gbWF4TWFkWjtcbn07XG5cblRyYWNlclN0b3JlLnByb3RvdHlwZS5fZ2V0TWVkaWFuID0gZnVuY3Rpb24gKGRhdGFTZXQpIHtcbiAgbGV0IHNvcnRlZERhdGFTZXQgPSBfLmNsb25lKGRhdGFTZXQpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICByZXR1cm4gYSAtIGI7XG4gIH0pO1xuICByZXR1cm4gdGhpcy5fcGlja1F1YXJ0aWxlKHNvcnRlZERhdGFTZXQsIDIpO1xufTtcblxuVHJhY2VyU3RvcmUucHJvdG90eXBlLl9waWNrUXVhcnRpbGUgPSBmdW5jdGlvbiAoZGF0YVNldCwgbnVtKSB7XG4gIGxldCBwb3MgPSAoKGRhdGFTZXQubGVuZ3RoICsgMSkgKiBudW0pIC8gNDtcbiAgaWYgKHBvcyAlIDEgPT09IDApIHtcbiAgICByZXR1cm4gZGF0YVNldFtwb3MgLSAxXTtcbiAgfVxuICBwb3MgLT0gcG9zICUgMTtcbiAgcmV0dXJuIChkYXRhU2V0W3BvcyAtIDFdICsgZGF0YVNldFtwb3NdKSAvIDI7XG59O1xuXG5UcmFjZXJTdG9yZS5wcm90b3R5cGUuX2NhbGN1bGF0ZU1hZCA9IGZ1bmN0aW9uIChkYXRhU2V0LCBtZWRpYW4pIHtcbiAgbGV0IG1lZGlhbkRldmlhdGlvbnMgPSBfLm1hcChkYXRhU2V0LCB0aGlzLl9mdW5jTWVkaWFuRGV2aWF0aW9uKG1lZGlhbikpO1xuICBsZXQgbWFkID0gdGhpcy5fZ2V0TWVkaWFuKG1lZGlhbkRldmlhdGlvbnMpO1xuXG4gIHJldHVybiBtYWQ7XG59O1xuXG5UcmFjZXJTdG9yZS5wcm90b3R5cGUuX2Z1bmNNZWRpYW5EZXZpYXRpb24gPSBmdW5jdGlvbiAobWVkaWFuKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBNYXRoLmFicyhtZWRpYW4gLSB4KTtcbiAgfTtcbn07XG5cblRyYWNlclN0b3JlLnByb3RvdHlwZS5fZ2V0TWVhbiA9IGZ1bmN0aW9uIChkYXRhUG9pbnRzKSB7XG4gIGlmIChkYXRhUG9pbnRzLmxlbmd0aCA+IDApIHtcbiAgICBsZXQgdG90YWwgPSAwO1xuICAgIGRhdGFQb2ludHMuZm9yRWFjaChmdW5jdGlvbiAocG9pbnQpIHtcbiAgICAgIHRvdGFsICs9IHBvaW50O1xuICAgIH0pO1xuICAgIHJldHVybiB0b3RhbCAvIGRhdGFQb2ludHMubGVuZ3RoO1xuICB9XG4gIHJldHVybiAwO1xufTtcbiIsImxldCBMUlUgPSBOcG0ucmVxdWlyZSgnbHJ1LWNhY2hlJyk7XG5sZXQganNvblN0cmluZ2lmeSA9IE5wbS5yZXF1aXJlKCdqc29uLXN0cmluZ2lmeS1zYWZlJyk7XG5cbmV4cG9ydCBjb25zdCBEb2NTekNhY2hlID0gZnVuY3Rpb24gKG1heEl0ZW1zLCBtYXhWYWx1ZXMpIHtcbiAgdGhpcy5pdGVtcyA9IG5ldyBMUlUoe21heDogbWF4SXRlbXN9KTtcbiAgdGhpcy5tYXhWYWx1ZXMgPSBtYXhWYWx1ZXM7XG4gIHRoaXMuY3B1VXNhZ2UgPSAwO1xufTtcblxuLy8gVGhpcyBpcyBjYWxsZWQgZnJvbSBTeXN0ZW1Nb2RlbC5wcm90b3R5cGUuY3B1VXNhZ2UgYW5kIHNhdmVzIGNwdSB1c2FnZS5cbkRvY1N6Q2FjaGUucHJvdG90eXBlLnNldFBjcHUgPSBmdW5jdGlvbiAocGNwdSkge1xuICB0aGlzLmNwdVVzYWdlID0gcGNwdTtcbn07XG5cbkRvY1N6Q2FjaGUucHJvdG90eXBlLmdldFNpemUgPSBmdW5jdGlvbiAoY29sbCwgcXVlcnksIG9wdHMsIGRhdGEpIHtcbiAgLy8gSWYgdGhlIGRhdGFzZXQgaXMgbnVsbCBvciBlbXB0eSB3ZSBjYW4ndCBjYWxjdWxhdGUgdGhlIHNpemVcbiAgLy8gRG8gbm90IHByb2Nlc3MgdGhpcyBkYXRhIGFuZCByZXR1cm4gMCBhcyB0aGUgZG9jdW1lbnQgc2l6ZS5cbiAgaWYgKCEoZGF0YSAmJiAoZGF0YS5sZW5ndGggfHwgKHR5cGVvZiBkYXRhLnNpemUgPT09ICdmdW5jdGlvbicgJiYgZGF0YS5zaXplKCkpKSkpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIGxldCBrZXkgPSB0aGlzLmdldEtleShjb2xsLCBxdWVyeSwgb3B0cyk7XG4gIGxldCBpdGVtID0gdGhpcy5pdGVtcy5nZXQoa2V5KTtcblxuICBpZiAoIWl0ZW0pIHtcbiAgICBpdGVtID0gbmV3IERvY1N6Q2FjaGVJdGVtKHRoaXMubWF4VmFsdWVzKTtcbiAgICB0aGlzLml0ZW1zLnNldChrZXksIGl0ZW0pO1xuICB9XG5cbiAgaWYgKHRoaXMubmVlZHNVcGRhdGUoaXRlbSkpIHtcbiAgICBsZXQgZG9jID0ge307XG4gICAgaWYgKHR5cGVvZiBkYXRhLmdldCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gVGhpcyBpcyBhbiBJZE1hcFxuICAgICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIGRvYyA9IGVsZW1lbnQ7XG4gICAgICAgIHJldHVybiBmYWxzZTsgLy8gcmV0dXJuIGZhbHNlIHRvIHN0b3AgbG9vcC4gV2Ugb25seSBuZWVkIG9uZSBkb2MuXG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgZG9jID0gZGF0YVswXTtcbiAgICB9XG4gICAgbGV0IHNpemUgPSBCdWZmZXIuYnl0ZUxlbmd0aChqc29uU3RyaW5naWZ5KGRvYyksICd1dGY4Jyk7XG4gICAgaXRlbS5hZGREYXRhKHNpemUpO1xuICB9XG5cbiAgcmV0dXJuIGl0ZW0uZ2V0VmFsdWUoKTtcbn07XG5cbkRvY1N6Q2FjaGUucHJvdG90eXBlLmdldEtleSA9IGZ1bmN0aW9uIChjb2xsLCBxdWVyeSwgb3B0cykge1xuICByZXR1cm4ganNvblN0cmluZ2lmeShbY29sbCwgcXVlcnksIG9wdHNdKTtcbn07XG5cbi8vIHJldHVybnMgYSBzY29yZSBiZXR3ZWVuIDAgYW5kIDEgZm9yIGEgY2FjaGUgaXRlbVxuLy8gdGhpcyBzY29yZSBpcyBkZXRlcm1pbmVkIGJ5OlxuLy8gICogYXZhaWxhYmxlIGNhY2hlIGl0ZW0gc2xvdHNcbi8vICAqIHRpbWUgc2luY2UgbGFzdCB1cGRhdGVkXG4vLyAgKiBjcHUgdXNhZ2Ugb2YgdGhlIGFwcGxpY2F0aW9uXG5Eb2NTekNhY2hlLnByb3RvdHlwZS5nZXRJdGVtU2NvcmUgPSBmdW5jdGlvbiAoaXRlbSkge1xuICByZXR1cm4gW1xuICAgIChpdGVtLm1heFZhbHVlcyAtIGl0ZW0udmFsdWVzLmxlbmd0aCkgLyBpdGVtLm1heFZhbHVlcyxcbiAgICAoRGF0ZS5ub3coKSAtIGl0ZW0udXBkYXRlZCkgLyA2MDAwMCxcbiAgICAoMTAwIC0gdGhpcy5jcHVVc2FnZSkgLyAxMDAsXG4gIF0ubWFwKGZ1bmN0aW9uIChzY29yZSkge1xuICAgIHJldHVybiBzY29yZSA+IDEgPyAxIDogc2NvcmU7XG4gIH0pLnJlZHVjZShmdW5jdGlvbiAodG90YWwsIHNjb3JlKSB7XG4gICAgcmV0dXJuICh0b3RhbCB8fCAwKSArIHNjb3JlO1xuICB9KSAvIDM7XG59O1xuXG5Eb2NTekNhY2hlLnByb3RvdHlwZS5uZWVkc1VwZGF0ZSA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIC8vIGhhbmRsZSBuZXdseSBtYWRlIGl0ZW1zXG4gIGlmICghaXRlbS52YWx1ZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBsZXQgY3VycmVudFRpbWUgPSBEYXRlLm5vdygpO1xuICBsZXQgdGltZVNpbmNlVXBkYXRlID0gY3VycmVudFRpbWUgLSBpdGVtLnVwZGF0ZWQ7XG4gIGlmICh0aW1lU2luY2VVcGRhdGUgPiAxMDAwICogNjApIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLmdldEl0ZW1TY29yZShpdGVtKSA+IDAuNTtcbn07XG5cblxuZXhwb3J0IGNvbnN0IERvY1N6Q2FjaGVJdGVtID0gZnVuY3Rpb24gKG1heFZhbHVlcykge1xuICB0aGlzLm1heFZhbHVlcyA9IG1heFZhbHVlcztcbiAgdGhpcy51cGRhdGVkID0gMDtcbiAgdGhpcy52YWx1ZXMgPSBbXTtcbn07XG5cbkRvY1N6Q2FjaGVJdGVtLnByb3RvdHlwZS5hZGREYXRhID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gIHRoaXMudmFsdWVzLnB1c2godmFsdWUpO1xuICB0aGlzLnVwZGF0ZWQgPSBEYXRlLm5vdygpO1xuXG4gIGlmICh0aGlzLnZhbHVlcy5sZW5ndGggPiB0aGlzLm1heFZhbHVlcykge1xuICAgIHRoaXMudmFsdWVzLnNoaWZ0KCk7XG4gIH1cbn07XG5cbkRvY1N6Q2FjaGVJdGVtLnByb3RvdHlwZS5nZXRWYWx1ZSA9IGZ1bmN0aW9uICgpIHtcbiAgZnVuY3Rpb24gc29ydE51bWJlciAoYSwgYikge1xuICAgIHJldHVybiBhIC0gYjtcbiAgfVxuICBsZXQgc29ydGVkID0gdGhpcy52YWx1ZXMuc29ydChzb3J0TnVtYmVyKTtcbiAgbGV0IG1lZGlhbiA9IDA7XG4gIGxldCBpZHg7XG5cbiAgaWYgKHNvcnRlZC5sZW5ndGggJSAyID09PSAwKSB7XG4gICAgaWR4ID0gc29ydGVkLmxlbmd0aCAvIDI7XG4gICAgbWVkaWFuID0gKHNvcnRlZFtpZHhdICsgc29ydGVkW2lkeCAtIDFdKSAvIDI7XG4gIH0gZWxzZSB7XG4gICAgaWR4ID0gTWF0aC5mbG9vcihzb3J0ZWQubGVuZ3RoIC8gMik7XG4gICAgbWVkaWFuID0gc29ydGVkW2lkeF07XG4gIH1cblxuICByZXR1cm4gbWVkaWFuO1xufTtcbiIsIi8qIGdsb2JhbCBNb250aVByb2ZpbGVyICovXG5cbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUmFuZG9tIH0gZnJvbSAnbWV0ZW9yL3JhbmRvbSc7XG5pbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgRXJyb3JNb2RlbCB9IGZyb20gJy4vbW9kZWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBIdHRwTW9kZWwgfSBmcm9tICcuL21vZGVscy9odHRwJztcbmltcG9ydCB7IE1ldGhvZHNNb2RlbCB9IGZyb20gJy4vbW9kZWxzL21ldGhvZHMnO1xuaW1wb3J0IHsgUHVic3ViTW9kZWwgfSBmcm9tICcuL21vZGVscy9wdWJzdWInO1xuaW1wb3J0IHsgU3lzdGVtTW9kZWwgfSBmcm9tICcuL21vZGVscy9zeXN0ZW0nO1xuaW1wb3J0IHBhY2thZ2VNYXAgZnJvbSAnLi8ubWV0ZW9yLXBhY2thZ2UtdmVyc2lvbnMnO1xuaW1wb3J0IHsgZ2V0RXJyb3JQYXJhbWV0ZXJzIH0gZnJvbSAnLi9jb21tb24vdXRpbHMnO1xuaW1wb3J0IHsgV2FpdFRpbWVCdWlsZGVyIH0gZnJvbSAnLi93YWl0X3RpbWVfYnVpbGRlcic7XG5pbXBvcnQgeyBEb2NTekNhY2hlIH0gZnJvbSAnLi9kb2NzaXplX2NhY2hlJztcbmltcG9ydCB7IE50cCB9IGZyb20gJy4vbnRwJztcbmltcG9ydCB7IGdldENsaWVudFZlcnNpb25zIH0gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQgeyBoYW5kbGVBcGlSZXNwb25zZSB9IGZyb20gJy4vc291cmNlbWFwcyc7XG5pbXBvcnQgeyBUcmFja01ldGVvckRlYnVnLCBUcmFja1VuY2F1Z2h0RXhjZXB0aW9ucywgVHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zIH0gZnJvbSAnLi9oaWphY2svZXJyb3InO1xuXG5jb25zdCBob3N0bmFtZSA9IE5wbS5yZXF1aXJlKCdvcycpLmhvc3RuYW1lKCk7XG5jb25zdCBsb2dnZXIgPSBOcG0ucmVxdWlyZSgnZGVidWcnKSgna2FkaXJhOmFwbScpO1xuY29uc3QgRmliZXJzID0gTnBtLnJlcXVpcmUoJ2ZpYmVycycpO1xuY29uc3QgS2FkaXJhQ29yZSA9IE5wbS5yZXF1aXJlKCdtb250aS1hcG0tY29yZScpLkthZGlyYTtcblxuY29uc3QgREVCVUdfUEFZTE9BRF9TSVpFID0gcHJvY2Vzcy5lbnYuTU9OVElfREVCVUdfUEFZTE9BRF9TSVpFID09PSAndHJ1ZSc7XG5cbkthZGlyYS5tb2RlbHMgPSB7fTtcbkthZGlyYS5vcHRpb25zID0ge307XG5LYWRpcmEuZW52ID0ge1xuICBjdXJyZW50U3ViOiBudWxsLCAvLyBrZWVwIGN1cnJlbnQgc3Vic2NyaXB0aW9uIGluc2lkZSBkZHBcbiAga2FkaXJhSW5mbzogbmV3IE1ldGVvci5FbnZpcm9ubWVudFZhcmlhYmxlKCksXG59O1xuS2FkaXJhLndhaXRUaW1lQnVpbGRlciA9IG5ldyBXYWl0VGltZUJ1aWxkZXIoKTtcbkthZGlyYS5lcnJvcnMgPSBbXTtcbkthZGlyYS5lcnJvcnMuYWRkRmlsdGVyID0gS2FkaXJhLmVycm9ycy5wdXNoLmJpbmQoS2FkaXJhLmVycm9ycyk7XG5cbkthZGlyYS5tb2RlbHMubWV0aG9kcyA9IG5ldyBNZXRob2RzTW9kZWwoKTtcbkthZGlyYS5tb2RlbHMucHVic3ViID0gbmV3IFB1YnN1Yk1vZGVsKCk7XG5LYWRpcmEubW9kZWxzLnN5c3RlbSA9IG5ldyBTeXN0ZW1Nb2RlbCgpO1xuS2FkaXJhLm1vZGVscy5odHRwID0gbmV3IEh0dHBNb2RlbCgpO1xuS2FkaXJhLmRvY1N6Q2FjaGUgPSBuZXcgRG9jU3pDYWNoZSgxMDAwMDAsIDEwKTtcbkthZGlyYS5zeW5jZWREYXRlID0gbmV3IE50cCgpO1xuXG4vLyBJZiB0aGUgYWdlbnQgaXMgbm90IGNvbm5lY3RlZCwgd2Ugc3RpbGwgd2FudCB0byBidWlsZCB0aGUgcGF5bG9hZCBvY2Nhc2lvbmFsbHlcbi8vIHNpbmNlIGJ1aWxkaW5nIHRoZSBwYXlsb2FkIGRvZXMgc29tZSBjbGVhbnVwIHRvIHByZXZlbnQgbWVtb3J5IGxlYWtzXG4vLyBPbmNlIGNvbm5lY3RlZCwgdGhpcyBpbnRlcnZhbCBpcyBjbGVhcmVkXG5sZXQgYnVpbGRJbnRlcnZhbCA9IE1ldGVvci5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gIEthZGlyYS5fYnVpbGRQYXlsb2FkKCk7XG59LCAxMDAwICogNjApO1xuXG5cbkthZGlyYS5jb25uZWN0ID0gZnVuY3Rpb24gKGFwcElkLCBhcHBTZWNyZXQsIG9wdGlvbnMpIHtcbiAgaWYgKEthZGlyYS5jb25uZWN0ZWQpIHtcbiAgICBjb25zb2xlLmxvZygnTW9udGkgQVBNOiBBbHJlYWR5IENvbm5lY3RlZCcpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmFwcElkID0gYXBwSWQ7XG4gIG9wdGlvbnMuYXBwU2VjcmV0ID0gYXBwU2VjcmV0O1xuICBvcHRpb25zLnBheWxvYWRUaW1lb3V0ID0gb3B0aW9ucy5wYXlsb2FkVGltZW91dCB8fCAxMDAwICogMjA7XG4gIG9wdGlvbnMuZW5kcG9pbnQgPSBvcHRpb25zLmVuZHBvaW50IHx8ICdodHRwczovL2VuZ2luZS5tb250aWFwbS5jb20nO1xuICBvcHRpb25zLmNsaWVudEVuZ2luZVN5bmNEZWxheSA9IG9wdGlvbnMuY2xpZW50RW5naW5lU3luY0RlbGF5IHx8IDEwMDAwO1xuICBvcHRpb25zLnRocmVzaG9sZHMgPSBvcHRpb25zLnRocmVzaG9sZHMgfHwge307XG4gIG9wdGlvbnMuaXNIb3N0TmFtZVNldCA9ICEhb3B0aW9ucy5ob3N0bmFtZTtcbiAgb3B0aW9ucy5ob3N0bmFtZSA9IG9wdGlvbnMuaG9zdG5hbWUgfHwgaG9zdG5hbWU7XG4gIG9wdGlvbnMucHJveHkgPSBvcHRpb25zLnByb3h5IHx8IG51bGw7XG4gIG9wdGlvbnMucmVjb3JkSVBBZGRyZXNzID0gb3B0aW9ucy5yZWNvcmRJUEFkZHJlc3MgfHwgJ2Z1bGwnO1xuICBvcHRpb25zLmV2ZW50U3RhY2tUcmFjZSA9IG9wdGlvbnMuZXZlbnRTdGFja1RyYWNlIHx8IGZhbHNlO1xuICBvcHRpb25zLnN0YWxsZWRUaW1lb3V0ID0gb3B0aW9ucy5zdGFsbGVkVGltZW91dCB8fCAxMDAwICogNjAgKiAzMDtcbiAgb3B0aW9ucy5kaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZyA9IG9wdGlvbnMuZGlzYWJsZUNsaWVudEVycm9yVHJhY2tpbmcgfHwgZmFsc2U7XG5cbiAgaWYgKG9wdGlvbnMuZG9jdW1lbnRTaXplQ2FjaGVTaXplKSB7XG4gICAgS2FkaXJhLmRvY1N6Q2FjaGUgPSBuZXcgRG9jU3pDYWNoZShvcHRpb25zLmRvY3VtZW50U2l6ZUNhY2hlU2l6ZSwgMTApO1xuICB9XG5cbiAgLy8gcmVtb3ZlIHRyYWlsaW5nIHNsYXNoIGZyb20gZW5kcG9pbnQgdXJsIChpZiBhbnkpXG4gIGlmIChfLmxhc3Qob3B0aW9ucy5lbmRwb2ludCkgPT09ICcvJykge1xuICAgIG9wdGlvbnMuZW5kcG9pbnQgPSBvcHRpb25zLmVuZHBvaW50LnN1YnN0cigwLCBvcHRpb25zLmVuZHBvaW50Lmxlbmd0aCAtIDEpO1xuICB9XG5cbiAgLy8gZXJyb3IgdHJhY2tpbmcgaXMgZW5hYmxlZCBieSBkZWZhdWx0XG4gIGlmIChvcHRpb25zLmVuYWJsZUVycm9yVHJhY2tpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgIG9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZyA9IHRydWU7XG4gIH1cblxuICAvLyB1cGxvYWRpbmcgc291cmNlbWFwcyBpcyBlbmFibGVkIGJ5IGRlZmF1bHQgaW4gcHJvZHVjdGlvblxuICBpZiAob3B0aW9ucy51cGxvYWRTb3VyY2VNYXBzID09PSB1bmRlZmluZWQgJiYgTWV0ZW9yLmlzUHJvZHVjdGlvbikge1xuICAgIG9wdGlvbnMudXBsb2FkU291cmNlTWFwcyA9IHRydWU7XG4gIH1cblxuICBLYWRpcmEub3B0aW9ucyA9IG9wdGlvbnM7XG4gIEthZGlyYS5vcHRpb25zLmF1dGhIZWFkZXJzID0ge1xuICAgICdLQURJUkEtQVBQLUlEJzogS2FkaXJhLm9wdGlvbnMuYXBwSWQsXG4gICAgJ0tBRElSQS1BUFAtU0VDUkVUJzogS2FkaXJhLm9wdGlvbnMuYXBwU2VjcmV0XG4gIH07XG5cbiAgaWYgKGFwcElkICYmIGFwcFNlY3JldCkge1xuICAgIG9wdGlvbnMuYXBwSWQgPSBvcHRpb25zLmFwcElkLnRyaW0oKTtcbiAgICBvcHRpb25zLmFwcFNlY3JldCA9IG9wdGlvbnMuYXBwU2VjcmV0LnRyaW0oKTtcblxuICAgIEthZGlyYS5jb3JlQXBpID0gbmV3IEthZGlyYUNvcmUoe1xuICAgICAgYXBwSWQ6IG9wdGlvbnMuYXBwSWQsXG4gICAgICBhcHBTZWNyZXQ6IG9wdGlvbnMuYXBwU2VjcmV0LFxuICAgICAgZW5kcG9pbnQ6IG9wdGlvbnMuZW5kcG9pbnQsXG4gICAgICBob3N0bmFtZTogb3B0aW9ucy5ob3N0bmFtZSxcbiAgICAgIGFnZW50VmVyc2lvbjogcGFja2FnZU1hcFsnbW9udGlhcG06YWdlbnQnXSB8fCAnPHVua25vd24+J1xuICAgIH0pO1xuXG4gICAgS2FkaXJhLmNvcmVBcGkuX2hlYWRlcnNbJ01FVEVPUi1SRUxFQVNFJ10gPSBNZXRlb3IucmVsZWFzZS5yZXBsYWNlKCdNRVRFT1JAJywgJycpO1xuXG4gICAgS2FkaXJhLmNvcmVBcGkuX2NoZWNrQXV0aCgpXG4gICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxvZ2dlcignY29ubmVjdGVkIHRvIGFwcDogJywgYXBwSWQpO1xuICAgICAgICBjb25zb2xlLmxvZygnTW9udGkgQVBNOiBDb25uZWN0ZWQnKTtcbiAgICAgICAgS2FkaXJhLl9zZW5kQXBwU3RhdHMoKTtcbiAgICAgICAgS2FkaXJhLl9zY2hlZHVsZVBheWxvYWRTZW5kKCk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlID09PSAnVW5hdXRob3JpemVkJykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdNb250aSBBUE06IEF1dGhlbnRpY2F0aW9uIGZhaWxlZCwgY2hlY2sgeW91ciBcImFwcElkXCIgJiBcImFwcFNlY3JldFwiJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coYE1vbnRpIEFQTTogVW5hYmxlIHRvIGNvbm5lY3QuICR7ZXJyLm1lc3NhZ2V9YCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignTW9udGkgQVBNOiByZXF1aXJlZCBhcHBJZCBhbmQgYXBwU2VjcmV0Jyk7XG4gIH1cblxuICBLYWRpcmEuc3luY2VkRGF0ZSA9IG5ldyBOdHAob3B0aW9ucyk7XG4gIEthZGlyYS5zeW5jZWREYXRlLnN5bmMoKTtcbiAgS2FkaXJhLm1vZGVscy5lcnJvciA9IG5ldyBFcnJvck1vZGVsKGFwcElkKTtcblxuICAvLyBoYW5kbGUgcHJlLWFkZGVkIGZpbHRlcnNcbiAgbGV0IGFkZEZpbHRlckZuID0gS2FkaXJhLm1vZGVscy5lcnJvci5hZGRGaWx0ZXIuYmluZChLYWRpcmEubW9kZWxzLmVycm9yKTtcbiAgS2FkaXJhLmVycm9ycy5mb3JFYWNoKGFkZEZpbHRlckZuKTtcbiAgS2FkaXJhLmVycm9ycyA9IEthZGlyYS5tb2RlbHMuZXJyb3I7XG5cbiAgLy8gc2V0dGluZyBydW50aW1lIGluZm8sIHdoaWNoIHdpbGwgYmUgc2VudCB0byBrYWRpcmFcbiAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5rYWRpcmEgPSB7XG4gICAgYXBwSWQsXG4gICAgZW5kcG9pbnQ6IG9wdGlvbnMuZW5kcG9pbnQsXG4gICAgY2xpZW50RW5naW5lU3luY0RlbGF5OiBvcHRpb25zLmNsaWVudEVuZ2luZVN5bmNEZWxheSxcbiAgICByZWNvcmRJUEFkZHJlc3M6IG9wdGlvbnMucmVjb3JkSVBBZGRyZXNzLFxuICAgIGRpc2FibGVOdHA6IG9wdGlvbnMuZGlzYWJsZU50cCxcbiAgICBkaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZzogb3B0aW9ucy5kaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZyxcbiAgfTtcblxuICBpZiAob3B0aW9ucy5lbmFibGVFcnJvclRyYWNraW5nKSB7XG4gICAgS2FkaXJhLmVuYWJsZUVycm9yVHJhY2tpbmcoKTtcbiAgfSBlbHNlIHtcbiAgICBLYWRpcmEuZGlzYWJsZUVycm9yVHJhY2tpbmcoKTtcbiAgfVxuXG4gIC8vIHN0YXJ0IHRyYWNraW5nIGVycm9yc1xuICBNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbiAoKSB7XG4gICAgVHJhY2tVbmNhdWdodEV4Y2VwdGlvbnMoKTtcbiAgICBUcmFja1VuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICBUcmFja01ldGVvckRlYnVnKCk7XG4gIH0pO1xuXG4gIE1ldGVvci5wdWJsaXNoKG51bGwsIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgX29wdGlvbnMgPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmthZGlyYTtcbiAgICB0aGlzLmFkZGVkKCdrYWRpcmFfc2V0dGluZ3MnLCBSYW5kb20uaWQoKSwgX29wdGlvbnMpO1xuICAgIHRoaXMucmVhZHkoKTtcbiAgfSk7XG5cbiAgLy8gbm90aWZ5IHdlJ3ZlIGNvbm5lY3RlZFxuICBLYWRpcmEuY29ubmVjdGVkID0gdHJ1ZTtcbn07XG5cbi8vIHRyYWNrIGhvdyBtYW55IHRpbWVzIHdlJ3ZlIHNlbnQgdGhlIGRhdGEgKG9uY2UgcGVyIG1pbnV0ZSlcbkthZGlyYS5fYnVpbGRQYXlsb2FkID0gZnVuY3Rpb24gKCkge1xuICBsZXQgcGF5bG9hZCA9IHtob3N0OiBLYWRpcmEub3B0aW9ucy5ob3N0bmFtZSwgY2xpZW50VmVyc2lvbnM6IGdldENsaWVudFZlcnNpb25zKCl9O1xuICBsZXQgYnVpbGREZXRhaWxlZEluZm8gPSBLYWRpcmEuX2lzRGV0YWlsZWRJbmZvKCk7XG4gIF8uZXh0ZW5kKHBheWxvYWQsIEthZGlyYS5tb2RlbHMubWV0aG9kcy5idWlsZFBheWxvYWQoYnVpbGREZXRhaWxlZEluZm8pKTtcbiAgXy5leHRlbmQocGF5bG9hZCwgS2FkaXJhLm1vZGVscy5wdWJzdWIuYnVpbGRQYXlsb2FkKGJ1aWxkRGV0YWlsZWRJbmZvKSk7XG4gIF8uZXh0ZW5kKHBheWxvYWQsIEthZGlyYS5tb2RlbHMuc3lzdGVtLmJ1aWxkUGF5bG9hZCgpKTtcbiAgXy5leHRlbmQocGF5bG9hZCwgS2FkaXJhLm1vZGVscy5odHRwLmJ1aWxkUGF5bG9hZCgpKTtcblxuICBpZiAoS2FkaXJhLm9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZykge1xuICAgIF8uZXh0ZW5kKHBheWxvYWQsIEthZGlyYS5tb2RlbHMuZXJyb3IuYnVpbGRQYXlsb2FkKCkpO1xuICB9XG5cbiAgcmV0dXJuIHBheWxvYWQ7XG59O1xuXG5LYWRpcmEuX2NvdW50RGF0YVNlbnQgPSAwO1xuS2FkaXJhLl9kZXRhaWxJbmZvU2VudEludGVydmFsID0gTWF0aC5jZWlsKCgxMDAwICogNjApIC8gS2FkaXJhLm9wdGlvbnMucGF5bG9hZFRpbWVvdXQpO1xuS2FkaXJhLl9pc0RldGFpbGVkSW5mbyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChLYWRpcmEuX2NvdW50RGF0YVNlbnQrKyAlIEthZGlyYS5fZGV0YWlsSW5mb1NlbnRJbnRlcnZhbCkgPT09IDA7XG59O1xuXG5LYWRpcmEuX3NlbmRBcHBTdGF0cyA9IGZ1bmN0aW9uICgpIHtcbiAgbGV0IGFwcFN0YXRzID0ge307XG4gIGFwcFN0YXRzLnJlbGVhc2UgPSBNZXRlb3IucmVsZWFzZTtcbiAgYXBwU3RhdHMucHJvdG9jb2xWZXJzaW9uID0gJzEuMC4wJztcbiAgYXBwU3RhdHMucGFja2FnZVZlcnNpb25zID0gW107XG4gIGFwcFN0YXRzLmNsaWVudFZlcnNpb25zID0gZ2V0Q2xpZW50VmVyc2lvbnMoKTtcblxuICBfLmVhY2goUGFja2FnZSwgZnVuY3Rpb24gKHYsIG5hbWUpIHtcbiAgICBhcHBTdGF0cy5wYWNrYWdlVmVyc2lvbnMucHVzaCh7XG4gICAgICBuYW1lLFxuICAgICAgdmVyc2lvbjogcGFja2FnZU1hcFtuYW1lXSB8fCBudWxsXG4gICAgfSk7XG4gIH0pO1xuXG4gIEthZGlyYS5jb3JlQXBpLnNlbmREYXRhKHtcbiAgICBzdGFydFRpbWU6IG5ldyBEYXRlKCksXG4gICAgYXBwU3RhdHNcbiAgfSkudGhlbihmdW5jdGlvbiAoYm9keSkge1xuICAgIGhhbmRsZUFwaVJlc3BvbnNlKGJvZHkpO1xuICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignTW9udGkgQVBNIEVycm9yIG9uIHNlbmRpbmcgYXBwU3RhdHM6JywgZXJyLm1lc3NhZ2UpO1xuICB9KTtcbn07XG5cbkthZGlyYS5fc2NoZWR1bGVQYXlsb2FkU2VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgY2xlYXJJbnRlcnZhbChidWlsZEludGVydmFsKTtcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICBLYWRpcmEuX3NjaGVkdWxlUGF5bG9hZFNlbmQoKTtcbiAgICBLYWRpcmEuX3NlbmRQYXlsb2FkKCk7XG4gIH0sIEthZGlyYS5vcHRpb25zLnBheWxvYWRUaW1lb3V0KTtcbn07XG5cbmZ1bmN0aW9uIGxvZ1BheWxvYWQgKHBheWxvYWQpIHtcbiAgbGV0IHRyYWNlQ291bnQgPSBwYXlsb2FkLm1ldGhvZFJlcXVlc3RzLmxlbmd0aCArXG4gICAgcGF5bG9hZC5wdWJSZXF1ZXN0cy5sZW5ndGggKyBwYXlsb2FkLmh0dHBSZXF1ZXN0cy5sZW5ndGggK1xuICAgIHBheWxvYWQuZXJyb3JzLmxlbmd0aDtcbiAgbGV0IGxhcmdlc3RUcmFjZSA9IHtcbiAgICBzaXplOiAwLFxuICAgIGNvbnRlbnQ6ICcnXG4gIH07XG5cbiAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWlubmVyLWRlY2xhcmF0aW9uc1xuICBmdW5jdGlvbiBjb3VudEJyZWFrZG93bnMgKGJyZWFrZG93bnMsIGZpZWxkKSB7XG4gICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgYnJlYWtkb3ducy5mb3JFYWNoKGVudHJ5ID0+IHtcbiAgICAgIHJlc3VsdCArPSBPYmplY3Qua2V5cyhlbnRyeVtmaWVsZF0pLmxlbmd0aDtcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8taW5uZXItZGVjbGFyYXRpb25zXG4gIGZ1bmN0aW9uIHNpemVUcmFjZXMgKHRyYWNlcykge1xuICAgIGxldCBoaXN0b2dyYW0gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCB0b3RhbCA9IDA7XG4gICAgdHJhY2VzLmZvckVhY2godHJhY2UgPT4ge1xuICAgICAgY29uc3Qgc3RyaW5naWZpZWQgPSBKU09OLnN0cmluZ2lmeSh0cmFjZSk7XG4gICAgICBsZXQgbGVuZ3RoID0gc3RyaW5naWZpZWQubGVuZ3RoO1xuICAgICAgdG90YWwgKz0gbGVuZ3RoO1xuXG4gICAgICBpZiAobGVuZ3RoID4gbGFyZ2VzdFRyYWNlLnNpemUpIHtcbiAgICAgICAgbGFyZ2VzdFRyYWNlID0geyBzaXplOiBsZW5ndGgsIGNvbnRlbnQ6IHN0cmluZ2lmaWVkIH07XG4gICAgICB9XG5cbiAgICAgIGxldCBub3JtYWxpemVkID0gbGVuZ3RoIC0gKGxlbmd0aCAlIDUwMCk7XG4gICAgICBoaXN0b2dyYW1bbm9ybWFsaXplZF0gPSBoaXN0b2dyYW1bbm9ybWFsaXplZF0gfHwgMDtcbiAgICAgIGhpc3RvZ3JhbVtub3JtYWxpemVkXSArPSAxO1xuICAgIH0pO1xuXG4gICAgaGlzdG9ncmFtLnRvdGFsID0gdG90YWw7XG5cbiAgICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaGlzdG9ncmFtKS5tYXAoKFtrLCB2XSkgPT4gYCR7a306ICR7dn1gKS5qb2luKCcsICcpO1xuICB9XG5cbiAgY29uc29sZS5sb2coJy0tLS0tLS0gQVBNIFBheWxvYWQgTWV0cmljcyAtLS0tLS0tJyk7XG4gIGNvbnNvbGUubG9nKGBtZXRob2RzOiAke2NvdW50QnJlYWtkb3ducyhwYXlsb2FkLm1ldGhvZE1ldHJpY3MsICdtZXRob2RzJyl9YCk7XG4gIGNvbnNvbGUubG9nKGBwdWJzOiAke2NvdW50QnJlYWtkb3ducyhwYXlsb2FkLnB1Yk1ldHJpY3MsICdwdWJzJyl9YCk7XG4gIGNvbnNvbGUubG9nKGByb3V0ZXM6ICR7Y291bnRCcmVha2Rvd25zKHBheWxvYWQuaHR0cE1ldHJpY3MsICdyb3V0ZXMnKX1gKTtcbiAgY29uc29sZS5sb2coYGVycm9yczogJHtwYXlsb2FkLmVycm9ycy5sZW5ndGh9YCk7XG4gIGNvbnNvbGUubG9nKGB0cmFjZXM6ICR7dHJhY2VDb3VudH1gKTtcbiAgY29uc29sZS5sb2coJ01ldGhvZCB0cmFjZSBzaXplczonLCBzaXplVHJhY2VzKHBheWxvYWQubWV0aG9kUmVxdWVzdHMpKTtcbiAgY29uc29sZS5sb2coJ1B1YiB0cmFjZSBzaXplczonLCBzaXplVHJhY2VzKHBheWxvYWQucHViUmVxdWVzdHMpKTtcbiAgY29uc29sZS5sb2coJ0hUVFAgdHJhY2Ugc2l6ZXM6Jywgc2l6ZVRyYWNlcyhwYXlsb2FkLmh0dHBSZXF1ZXN0cykpO1xuICBjb25zb2xlLmxvZygnRXJyb3IgdHJhY2Ugc2l6ZXM6Jywgc2l6ZVRyYWNlcyhwYXlsb2FkLmVycm9ycykpO1xuICBjb25zb2xlLmxvZygnTGFyZ2VzdCB0cmFjZTonLCBsYXJnZXN0VHJhY2UpO1xuICBjb25zb2xlLmxvZygnLS0tLS0tLSAtLS0tLS0tLS0tLS0tLS0tLS0tIC0tLS0tLS0nKTtcbn1cblxuS2FkaXJhLl9zZW5kUGF5bG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgbmV3IEZpYmVycyhmdW5jdGlvbiAoKSB7XG4gICAgbGV0IHBheWxvYWQgPSBLYWRpcmEuX2J1aWxkUGF5bG9hZCgpO1xuXG4gICAgaWYgKERFQlVHX1BBWUxPQURfU0laRSkge1xuICAgICAgbG9nUGF5bG9hZChwYXlsb2FkKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZW5kICgpIHtcbiAgICAgIHJldHVybiBLYWRpcmEuY29yZUFwaS5zZW5kRGF0YShwYXlsb2FkKVxuICAgICAgICAudGhlbihmdW5jdGlvbiAoYm9keSkge1xuICAgICAgICAgIGhhbmRsZUFwaVJlc3BvbnNlKGJvZHkpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBsb2dFcnIgKGVycikge1xuICAgICAgY29uc29sZS5sb2coJ01vbnRpIEFQTSBFcnJvcjonLCAnd2hpbGUgc2VuZGluZyBwYXlsb2FkIHRvIE1vbnRpIEFQTTonLCBlcnIubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgc2VuZCgpXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAvLyBMaWtlbHkgaXMgUmFuZ2VFcnJvcjogSW52YWxpZCBzdHJpbmcgbGVuZ3RoXG4gICAgICAgIC8vIFRoaXMgcHJvYmFibHkgbWVhbnMgd2UgYXJlIGNsb3NlIHRvIHJ1bm5pbmcgb3V0IG9mIG1lbW9yeS5cbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIFJhbmdlRXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTW9udGkgQVBNOiBwYXlsb2FkIHdhcyB0b28gbGFyZ2UgdG8gc2VuZCB0byBNb250aSBBUE0uIFJlc2VuZGluZyB3aXRob3V0IHRyYWNlcycpO1xuICAgICAgICAgIHBheWxvYWQubWV0aG9kUmVxdWVzdHMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgcGF5bG9hZC5odHRwUmVxdWVzdHMgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgcGF5bG9hZC5wdWJSZXF1ZXN0cyA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBzZW5kKClcbiAgICAgICAgICAgIC5jYXRjaChsb2dFcnIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvZ0VycihlcnIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfSkucnVuKCk7XG59O1xuXG4vLyB0aGlzIHJldHVybiB0aGUgX19rYWRpcmFJbmZvIGZyb20gdGhlIGN1cnJlbnQgRmliZXIgYnkgZGVmYXVsdFxuLy8gaWYgY2FsbGVkIHdpdGggMm5kIGFyZ3VtZW50IGFzIHRydWUsIGl0IHdpbGwgZ2V0IHRoZSBrYWRpcmEgaW5mbyBmcm9tXG4vLyBNZXRlb3IuRW52aXJvbm1lbnRWYXJpYWJsZVxuLy9cbi8vIFdBUk5OSU5HOiByZXR1cm5lZCBpbmZvIG9iamVjdCBpcyB0aGUgcmVmZXJlbmNlIG9iamVjdC5cbi8vICBDaGFuZ2luZyBpdCBtaWdodCBjYXVzZSBpc3N1ZXMgd2hlbiBidWlsZGluZyB0cmFjZXMuIFNvIHVzZSB3aXRoIGNhcmVcbkthZGlyYS5fZ2V0SW5mbyA9IGZ1bmN0aW9uIChjdXJyZW50RmliZXIsIHVzZUVudmlyb25tZW50VmFyaWFibGUpIHtcbiAgY3VycmVudEZpYmVyID0gY3VycmVudEZpYmVyIHx8IEZpYmVycy5jdXJyZW50O1xuICBpZiAoY3VycmVudEZpYmVyKSB7XG4gICAgaWYgKHVzZUVudmlyb25tZW50VmFyaWFibGUpIHtcbiAgICAgIHJldHVybiBLYWRpcmEuZW52LmthZGlyYUluZm8uZ2V0KCk7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50RmliZXIuX19rYWRpcmFJbmZvO1xuICB9XG59O1xuXG4vLyB0aGlzIGRvZXMgbm90IGNsb25lIHRoZSBpbmZvIG9iamVjdC4gU28sIHVzZSB3aXRoIGNhcmVcbkthZGlyYS5fc2V0SW5mbyA9IGZ1bmN0aW9uIChpbmZvKSB7XG4gIEZpYmVycy5jdXJyZW50Ll9fa2FkaXJhSW5mbyA9IGluZm87XG59O1xuXG5LYWRpcmEuc3RhcnRDb250aW51b3VzUHJvZmlsaW5nID0gZnVuY3Rpb24gKCkge1xuICBNb250aVByb2ZpbGVyLnN0YXJ0Q29udGludW91cyhmdW5jdGlvbiBvblByb2ZpbGUgKHsgcHJvZmlsZSwgc3RhcnRUaW1lLCBlbmRUaW1lIH0pIHtcbiAgICBpZiAoIUthZGlyYS5jb25uZWN0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBLYWRpcmEuY29yZUFwaS5zZW5kRGF0YSh7IHByb2ZpbGVzOiBbe3Byb2ZpbGUsIHN0YXJ0VGltZSwgZW5kVGltZSB9XX0pXG4gICAgICAuY2F0Y2goZSA9PiBjb25zb2xlLmxvZygnTW9udGk6IGVyciBzZW5kaW5nIGNwdSBwcm9maWxlJywgZSkpO1xuICB9KTtcbn07XG5cbi8qKlxuICogQHdhcm5pbmcgTXV0YXRpbmcgdGhlIGBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fYCBvYmplY3QgZG9lcyBub3QgcHJvcGFnYXRlIGluIHJlYWwtdGltZSB0byB0aGUgY2xpZW50LCBvbmx5IGlmIHRoZVxuICogdmVyc2lvbiBjaGFuZ2VzIGFuZCB0aGUgY2xpZW50IHJlZnJlc2hlcyBpdCBzZWVtcy4gSW4gdGhlIGZ1dHVyZSB3ZSBtaWdodCB3YW50IHRvIGNoYW5nZSB0aGF0IGludG8gYSByZWFjdGl2ZSBhcHByb2FjaC5cbiAqL1xuXG5LYWRpcmEuZW5hYmxlRXJyb3JUcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5rYWRpcmEuZW5hYmxlRXJyb3JUcmFja2luZyA9IHRydWU7XG4gIEthZGlyYS5vcHRpb25zLmVuYWJsZUVycm9yVHJhY2tpbmcgPSB0cnVlO1xufTtcblxuS2FkaXJhLmRpc2FibGVFcnJvclRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmthZGlyYS5lbmFibGVFcnJvclRyYWNraW5nID0gZmFsc2U7XG4gIEthZGlyYS5vcHRpb25zLmVuYWJsZUVycm9yVHJhY2tpbmcgPSBmYWxzZTtcbn07XG5cbkthZGlyYS5kaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5rYWRpcmEuZGlzYWJsZUNsaWVudEVycm9yVHJhY2tpbmcgPSBLYWRpcmEub3B0aW9ucy5kaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZyA9IHRydWU7XG59O1xuXG5LYWRpcmEuZW5hYmxlQ2xpZW50RXJyb3JUcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5rYWRpcmEuZGlzYWJsZUNsaWVudEVycm9yVHJhY2tpbmcgPSBLYWRpcmEub3B0aW9ucy5kaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZyA9IGZhbHNlO1xufTtcblxuS2FkaXJhLnRyYWNrRXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghS2FkaXJhLm9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IHtcbiAgICBtZXNzYWdlLFxuICAgIHN1YlR5cGUsXG4gICAgc3RhY2ssXG4gICAgdHlwZSxcbiAgICBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCksXG4gIH0gPSBnZXRFcnJvclBhcmFtZXRlcnMoYXJndW1lbnRzKTtcblxuICBjb25zdCBub3cgPSBOdHAuX25vdygpO1xuXG4gIGNvbnN0IHByZXZpb3VzRXZlbnRzID1cbiAgICBrYWRpcmFJbmZvICYmIGthZGlyYUluZm8udHJhY2UgP1xuICAgICAga2FkaXJhSW5mby50cmFjZS5ldmVudHMgOlxuICAgICAgW3sgdHlwZTogJ3N0YXJ0JywgYXQ6IG5vdywgZW5kQXQ6IG5vdyB9XTtcblxuICBjb25zdCBldmVudHMgPSBLYWRpcmEudHJhY2VyXG4gICAgLm9wdGltaXplRXZlbnRzKHByZXZpb3VzRXZlbnRzKVxuICAgIC5jb25jYXQoW1snZXJyb3InLCAwLCB7IGVycm9yOiB7IG1lc3NhZ2UsIHN0YWNrIH0gfV1dKTtcblxuICBpZiAobWVzc2FnZSkge1xuICAgIGxldCB0cmFjZSA9IHtcbiAgICAgIHR5cGU6IHR5cGUgfHwgJ3NlcnZlci1pbnRlcm5hbCcsXG4gICAgICBzdWJUeXBlOiBzdWJUeXBlIHx8ICdzZXJ2ZXInLFxuICAgICAgbmFtZTogbWVzc2FnZSxcbiAgICAgIGVycm9yZWQ6IHRydWUsXG4gICAgICBhdDogS2FkaXJhLnN5bmNlZERhdGUuZ2V0VGltZSgpLFxuICAgICAgZXZlbnRzLFxuICAgICAgbWV0cmljczogeyB0b3RhbDogMCB9LFxuICAgIH07XG5cbiAgICBLYWRpcmEubW9kZWxzLmVycm9yLnRyYWNrRXJyb3IoeyBtZXNzYWdlLCBzdGFjayB9LCB0cmFjZSk7XG4gIH1cbn07XG5cbkthZGlyYS5pZ25vcmVFcnJvclRyYWNraW5nID0gZnVuY3Rpb24gKGVycikge1xuICBlcnIuX3NraXBLYWRpcmEgPSB0cnVlO1xufTtcblxuS2FkaXJhLnN0YXJ0RXZlbnQgPSBmdW5jdGlvbiAobmFtZSwgZGF0YSA9IHt9KSB7XG4gIGxldCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCk7XG4gIGlmIChrYWRpcmFJbmZvKSB7XG4gICAgcmV0dXJuIEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2N1c3RvbScsIGRhdGEsIHsgbmFtZSB9KTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cbkthZGlyYS5lbmRFdmVudCA9IGZ1bmN0aW9uIChldmVudCwgZGF0YSkge1xuICBsZXQga2FkaXJhSW5mbyA9IEthZGlyYS5fZ2V0SW5mbygpO1xuXG4gIC8vIFRoZSBldmVudCBjb3VsZCBiZSBmYWxzZSBpZiBpdCBjb3VsZCBub3QgYmUgc3RhcnRlZC5cbiAgLy8gSGFuZGxlIGl0IGhlcmUgaW5zdGVhZCBvZiByZXF1aXJpbmcgdGhlIGFwcCB0by5cbiAgaWYgKGthZGlyYUluZm8gJiYgZXZlbnQpIHtcbiAgICBLYWRpcmEudHJhY2VyLmV2ZW50RW5kKGthZGlyYUluZm8udHJhY2UsIGV2ZW50LCBkYXRhKTtcbiAgfVxufTtcbiIsImV4cG9ydCBmdW5jdGlvbiB3cmFwU2VydmVyIChzZXJ2ZXJQcm90bykge1xuICBsZXQgb3JpZ2luYWxIYW5kbGVDb25uZWN0ID0gc2VydmVyUHJvdG8uX2hhbmRsZUNvbm5lY3Q7XG4gIHNlcnZlclByb3RvLl9oYW5kbGVDb25uZWN0ID0gZnVuY3Rpb24gKHNvY2tldCwgbXNnKSB7XG4gICAgb3JpZ2luYWxIYW5kbGVDb25uZWN0LmNhbGwodGhpcywgc29ja2V0LCBtc2cpO1xuICAgIGxldCBzZXNzaW9uID0gc29ja2V0Ll9tZXRlb3JTZXNzaW9uO1xuICAgIC8vIHNvbWV0aW1lcyBpdCBpcyBwb3NzaWJsZSBmb3IgX21ldGVvclNlc3Npb24gdG8gYmUgdW5kZWZpbmVkXG4gICAgLy8gb25lIHN1Y2ggcmVhc29uIHdvdWxkIGJlIGlmIEREUCB2ZXJzaW9ucyBhcmUgbm90IG1hdGNoaW5nXG4gICAgLy8gaWYgdGhlbiwgd2Ugc2hvdWxkIG5vdCBwcm9jZXNzIGl0XG4gICAgaWYgKCFzZXNzaW9uKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgS2FkaXJhLkV2ZW50QnVzLmVtaXQoJ3N5c3RlbScsICdjcmVhdGVTZXNzaW9uJywgbXNnLCBzb2NrZXQuX21ldGVvclNlc3Npb24pO1xuXG4gICAgaWYgKEthZGlyYS5jb25uZWN0ZWQpIHtcbiAgICAgIEthZGlyYS5tb2RlbHMuc3lzdGVtLmhhbmRsZVNlc3Npb25BY3Rpdml0eShtc2csIHNvY2tldC5fbWV0ZW9yU2Vzc2lvbik7XG4gICAgfVxuICB9O1xufVxuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IHsgTWV0ZW9yRGVidWdJZ25vcmUgfSBmcm9tICcuL2Vycm9yJztcbmltcG9ydCB7IFRpbWVvdXRNYW5hZ2VyIH0gZnJvbSAnLi90aW1lb3V0X21hbmFnZXInO1xuXG5jb25zdCBNQVhfUEFSQU1TX0xFTkdUSCA9IDQwMDA7XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwU2Vzc2lvbiAoc2Vzc2lvblByb3RvKSB7XG4gIGxldCBvcmlnaW5hbFByb2Nlc3NNZXNzYWdlID0gc2Vzc2lvblByb3RvLnByb2Nlc3NNZXNzYWdlO1xuICBzZXNzaW9uUHJvdG8ucHJvY2Vzc01lc3NhZ2UgPSBmdW5jdGlvbiAobXNnKSB7XG4gICAgbGV0IGthZGlyYUluZm8gPSB7XG4gICAgICBzZXNzaW9uOiB0aGlzLmlkLFxuICAgICAgdXNlcklkOiB0aGlzLnVzZXJJZFxuICAgIH07XG4gICAgaWYgKG1zZy5tc2cgPT09ICdtZXRob2QnIHx8IG1zZy5tc2cgPT09ICdzdWInKSB7XG4gICAgICBrYWRpcmFJbmZvLnRyYWNlID0gS2FkaXJhLnRyYWNlci5zdGFydCh0aGlzLCBtc2cpO1xuXG4gICAgICBLYWRpcmEud2FpdFRpbWVCdWlsZGVyLnJlZ2lzdGVyKHRoaXMsIG1zZy5pZCk7XG5cbiAgICAgIGxldCBwYXJhbXMgPSBLYWRpcmEudHJhY2VyLl9hcHBseU9iamVjdEZpbHRlcnMobXNnLnBhcmFtcyB8fCBbXSk7XG4gICAgICAvLyB1c2UgSlNPTiBpbnN0ZWFkIG9mIEVKU09OIHRvIHNhdmUgdGhlIENQVVxuICAgICAgbGV0IHN0cmluZ2lmaWVkUGFyYW1zID0gSlNPTi5zdHJpbmdpZnkocGFyYW1zKTtcblxuICAgICAgLy8gVGhlIHBhcmFtcyBjb3VsZCBiZSBzZXZlcmFsIG1iIG9yIGxhcmdlci5cbiAgICAgIC8vIFRydW5jYXRlIGlmIGl0IGlzIGxhcmdlXG4gICAgICBpZiAoc3RyaW5naWZpZWRQYXJhbXMubGVuZ3RoID4gTUFYX1BBUkFNU19MRU5HVEgpIHtcbiAgICAgICAgc3RyaW5naWZpZWRQYXJhbXMgPSBgTW9udGkgQVBNOiBwYXJhbXMgYXJlIHRvbyBiaWcuIEZpcnN0ICR7TUFYX1BBUkFNU19MRU5HVEh9IGNoYXJhY3RlcnM6ICR7c3RyaW5naWZpZWRQYXJhbXMuc2xpY2UoMCwgTUFYX1BBUkFNU19MRU5HVEgpfWA7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdGFydERhdGEgPSB7IHVzZXJJZDogdGhpcy51c2VySWQsIHBhcmFtczogc3RyaW5naWZpZWRQYXJhbXMgfTtcbiAgICAgIEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ3N0YXJ0Jywgc3RhcnREYXRhKTtcbiAgICAgIG1zZy5fd2FpdEV2ZW50SWQgPSBLYWRpcmEudHJhY2VyLmV2ZW50KGthZGlyYUluZm8udHJhY2UsICd3YWl0Jywge30sIGthZGlyYUluZm8pO1xuICAgICAgbXNnLl9fa2FkaXJhSW5mbyA9IGthZGlyYUluZm87XG5cbiAgICAgIGlmIChtc2cubXNnID09PSAnc3ViJykge1xuICAgICAgICAvLyBzdGFydCB0cmFja2luZyBpbnNpZGUgcHJvY2Vzc01lc3NhZ2UgYWxsb3dzIHVzIHRvIGluZGljYXRlXG4gICAgICAgIC8vIHdhaXQgdGltZSBhcyB3ZWxsXG4gICAgICAgIEthZGlyYS5FdmVudEJ1cy5lbWl0KCdwdWJzdWInLCAnc3ViUmVjZWl2ZWQnLCB0aGlzLCBtc2cpO1xuICAgICAgICBLYWRpcmEubW9kZWxzLnB1YnN1Yi5fdHJhY2tTdWIodGhpcywgbXNnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgS2FkaXJhLkV2ZW50QnVzLmVtaXQoJ3N5c3RlbScsICdkZHBNZXNzYWdlUmVjZWl2ZWQnLCB0aGlzLCBtc2cpO1xuICAgIEthZGlyYS5tb2RlbHMuc3lzdGVtLmhhbmRsZVNlc3Npb25BY3Rpdml0eShtc2csIHRoaXMpO1xuXG4gICAgcmV0dXJuIG9yaWdpbmFsUHJvY2Vzc01lc3NhZ2UuY2FsbCh0aGlzLCBtc2cpO1xuICB9O1xuXG4gIC8vIGFkZGluZyB0aGUgbWV0aG9kIGNvbnRleHQgdG8gdGhlIGN1cnJlbnQgZmliZXJcbiAgbGV0IG9yaWdpbmFsTWV0aG9kSGFuZGxlciA9IHNlc3Npb25Qcm90by5wcm90b2NvbF9oYW5kbGVycy5tZXRob2Q7XG4gIHNlc3Npb25Qcm90by5wcm90b2NvbF9oYW5kbGVycy5tZXRob2QgPSBmdW5jdGlvbiAobXNnLCB1bmJsb2NrKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIC8vIGFkZCBjb250ZXh0XG4gICAgbGV0IGthZGlyYUluZm8gPSBtc2cuX19rYWRpcmFJbmZvO1xuXG4gICAgbGV0IHJlc3BvbnNlO1xuXG4gICAgaWYgKGthZGlyYUluZm8pIHtcbiAgICAgIEthZGlyYS5fc2V0SW5mbyhrYWRpcmFJbmZvKTtcblxuICAgICAgVGltZW91dE1hbmFnZXIudHJhY2tUaW1lb3V0KHtcbiAgICAgICAga2FkaXJhSW5mbyxcbiAgICAgICAgbXNnLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIGVuZCB3YWl0IGV2ZW50XG4gICAgICBsZXQgd2FpdExpc3QgPSBLYWRpcmEud2FpdFRpbWVCdWlsZGVyLmJ1aWxkKHRoaXMsIG1zZy5pZCk7XG4gICAgICBLYWRpcmEudHJhY2VyLmV2ZW50RW5kKGthZGlyYUluZm8udHJhY2UsIG1zZy5fd2FpdEV2ZW50SWQsIHt3YWl0T246IHdhaXRMaXN0fSk7XG5cbiAgICAgIHVuYmxvY2sgPSBLYWRpcmEud2FpdFRpbWVCdWlsZGVyLnRyYWNrV2FpdFRpbWUodGhpcywgbXNnLCB1bmJsb2NrKTtcbiAgICAgIHJlc3BvbnNlID0gS2FkaXJhLmVudi5rYWRpcmFJbmZvLndpdGhWYWx1ZShrYWRpcmFJbmZvLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBvcmlnaW5hbE1ldGhvZEhhbmRsZXIuY2FsbChzZWxmLCBtc2csIHVuYmxvY2spO1xuICAgICAgfSk7XG4gICAgICB1bmJsb2NrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlc3BvbnNlID0gb3JpZ2luYWxNZXRob2RIYW5kbGVyLmNhbGwoc2VsZiwgbXNnLCB1bmJsb2NrKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH07XG5cbiAgLy8gdG8gY2FwdHVyZSB0aGUgY3VycmVudGx5IHByb2Nlc3NpbmcgbWVzc2FnZVxuICBsZXQgb3JnaW5hbFN1YkhhbmRsZXIgPSBzZXNzaW9uUHJvdG8ucHJvdG9jb2xfaGFuZGxlcnMuc3ViO1xuICBzZXNzaW9uUHJvdG8ucHJvdG9jb2xfaGFuZGxlcnMuc3ViID0gZnVuY3Rpb24gKG1zZywgdW5ibG9jaykge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAvLyBhZGQgY29udGV4dFxuICAgIGxldCBrYWRpcmFJbmZvID0gbXNnLl9fa2FkaXJhSW5mbztcbiAgICBsZXQgcmVzcG9uc2U7XG4gICAgaWYgKGthZGlyYUluZm8pIHtcbiAgICAgIEthZGlyYS5fc2V0SW5mbyhrYWRpcmFJbmZvKTtcblxuICAgICAgVGltZW91dE1hbmFnZXIudHJhY2tUaW1lb3V0KHtcbiAgICAgICAga2FkaXJhSW5mbyxcbiAgICAgICAgbXNnLFxuICAgICAgfSk7XG5cbiAgICAgIC8vIGVuZCB3YWl0IGV2ZW50XG4gICAgICBsZXQgd2FpdExpc3QgPSBLYWRpcmEud2FpdFRpbWVCdWlsZGVyLmJ1aWxkKHRoaXMsIG1zZy5pZCk7XG4gICAgICBLYWRpcmEudHJhY2VyLmV2ZW50RW5kKGthZGlyYUluZm8udHJhY2UsIG1zZy5fd2FpdEV2ZW50SWQsIHt3YWl0T246IHdhaXRMaXN0fSk7XG5cbiAgICAgIHVuYmxvY2sgPSBLYWRpcmEud2FpdFRpbWVCdWlsZGVyLnRyYWNrV2FpdFRpbWUodGhpcywgbXNnLCB1bmJsb2NrKTtcbiAgICAgIHJlc3BvbnNlID0gS2FkaXJhLmVudi5rYWRpcmFJbmZvLndpdGhWYWx1ZShrYWRpcmFJbmZvLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBvcmdpbmFsU3ViSGFuZGxlci5jYWxsKHNlbGYsIG1zZywgdW5ibG9jayk7XG4gICAgICB9KTtcbiAgICAgIHVuYmxvY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzcG9uc2UgPSBvcmdpbmFsU3ViSGFuZGxlci5jYWxsKHNlbGYsIG1zZywgdW5ibG9jayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9O1xuXG4gIC8vIHRvIGNhcHR1cmUgdGhlIGN1cnJlbnRseSBwcm9jZXNzaW5nIG1lc3NhZ2VcbiAgbGV0IG9yZ2luYWxVblN1YkhhbmRsZXIgPSBzZXNzaW9uUHJvdG8ucHJvdG9jb2xfaGFuZGxlcnMudW5zdWI7XG4gIHNlc3Npb25Qcm90by5wcm90b2NvbF9oYW5kbGVycy51bnN1YiA9IGZ1bmN0aW9uIChtc2csIHVuYmxvY2spIHtcbiAgICB1bmJsb2NrID0gS2FkaXJhLndhaXRUaW1lQnVpbGRlci50cmFja1dhaXRUaW1lKHRoaXMsIG1zZywgdW5ibG9jayk7XG4gICAgbGV0IHJlc3BvbnNlID0gb3JnaW5hbFVuU3ViSGFuZGxlci5jYWxsKHRoaXMsIG1zZywgdW5ibG9jayk7XG4gICAgdW5ibG9jaygpO1xuICAgIHJldHVybiByZXNwb25zZTtcbiAgfTtcblxuICAvLyB0cmFjayBtZXRob2QgZW5kaW5nICh0byBnZXQgdGhlIHJlc3VsdCBvZiBlcnJvcilcbiAgbGV0IG9yaWdpbmFsU2VuZCA9IHNlc3Npb25Qcm90by5zZW5kO1xuICBzZXNzaW9uUHJvdG8uc2VuZCA9IGZ1bmN0aW9uIChtc2cpIHtcbiAgICBpZiAobXNnLm1zZyA9PT0gJ3Jlc3VsdCcpIHtcbiAgICAgIGxldCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCk7XG4gICAgICBpZiAoa2FkaXJhSW5mbykge1xuICAgICAgICBUaW1lb3V0TWFuYWdlci5jbGVhclRpbWVvdXQoeyBrYWRpcmFJbmZvIH0pO1xuXG4gICAgICAgIGxldCBlcnJvcjtcblxuICAgICAgICBpZiAobXNnLmVycm9yKSB7XG4gICAgICAgICAgZXJyb3IgPSBfLnBpY2sobXNnLmVycm9yLCBbJ21lc3NhZ2UnLCAnc3RhY2snLCAnZGV0YWlscyddKTtcblxuICAgICAgICAgIC8vIHBpY2sgdGhlIGVycm9yIGZyb20gdGhlIHdyYXBwZWQgbWV0aG9kIGhhbmRsZXJcbiAgICAgICAgICBpZiAoa2FkaXJhSW5mbyAmJiBrYWRpcmFJbmZvLmN1cnJlbnRFcnJvcikge1xuICAgICAgICAgICAgLy8gdGhlIGVycm9yIHN0YWNrIGlzIHdyYXBwZWQgc28gTWV0ZW9yLl9kZWJ1ZyBjYW4gaWRlbnRpZnlcbiAgICAgICAgICAgIC8vIHRoaXMgYXMgYSBtZXRob2QgZXJyb3IuXG4gICAgICAgICAgICBlcnJvciA9IF8ucGljayhrYWRpcmFJbmZvLmN1cnJlbnRFcnJvciwgWydtZXNzYWdlJywgJ3N0YWNrJywgJ2RldGFpbHMnXSk7XG4gICAgICAgICAgICAvLyBzZWUgd3JhcE1ldGhvZEhhbmRlckZvckVycm9ycygpIG1ldGhvZCBkZWYgZm9yIG1vcmUgaW5mb1xuICAgICAgICAgICAgaWYgKGVycm9yLnN0YWNrICYmIGVycm9yLnN0YWNrLnN0YWNrKSB7XG4gICAgICAgICAgICAgIGVycm9yLnN0YWNrID0gZXJyb3Iuc3RhY2suc3RhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgS2FkaXJhLnRyYWNlci5lbmRMYXN0RXZlbnQoa2FkaXJhSW5mby50cmFjZSk7XG4gICAgICAgICAgS2FkaXJhLnRyYWNlci5ldmVudChrYWRpcmFJbmZvLnRyYWNlLCAnZXJyb3InLCB7ZXJyb3J9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBLYWRpcmEudHJhY2VyLmVuZExhc3RFdmVudChrYWRpcmFJbmZvLnRyYWNlKTtcbiAgICAgICAgICBLYWRpcmEudHJhY2VyLmV2ZW50KGthZGlyYUluZm8udHJhY2UsICdjb21wbGV0ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcHJvY2Vzc2luZyB0aGUgbWVzc2FnZVxuICAgICAgICBsZXQgdHJhY2UgPSBLYWRpcmEudHJhY2VyLmJ1aWxkVHJhY2Uoa2FkaXJhSW5mby50cmFjZSk7XG4gICAgICAgIEthZGlyYS5FdmVudEJ1cy5lbWl0KCdtZXRob2QnLCAnbWV0aG9kQ29tcGxldGVkJywgdHJhY2UsIHRoaXMpO1xuICAgICAgICBLYWRpcmEubW9kZWxzLm1ldGhvZHMucHJvY2Vzc01ldGhvZCh0cmFjZSk7XG5cbiAgICAgICAgLy8gZXJyb3IgbWF5IG9yIG1heSBub3QgZXhpc3QgYW5kIGVycm9yIHRyYWNraW5nIGNhbiBiZSBkaXNhYmxlZFxuICAgICAgICBpZiAoZXJyb3IgJiYgS2FkaXJhLm9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZykge1xuICAgICAgICAgIEthZGlyYS5tb2RlbHMuZXJyb3IudHJhY2tFcnJvcihlcnJvciwgdHJhY2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY2xlYW4gYW5kIG1ha2Ugc3VyZSwgZmliZXIgaXMgY2xlYW5cbiAgICAgICAgLy8gbm90IHN1cmUgd2UgbmVlZCB0byBkbyB0aGlzLCBidXQgYSBwcmV2ZW50aXZlIG1lYXN1cmVcbiAgICAgICAgS2FkaXJhLl9zZXRJbmZvKG51bGwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcmlnaW5hbFNlbmQuY2FsbCh0aGlzLCBtc2cpO1xuICB9O1xufVxuXG4vLyB3cmFwIGV4aXN0aW5nIG1ldGhvZCBoYW5kbGVycyBmb3IgY2FwdHVyaW5nIGVycm9yc1xuXy5lYWNoKE1ldGVvci5zZXJ2ZXIubWV0aG9kX2hhbmRsZXJzLCBmdW5jdGlvbiAoaGFuZGxlciwgbmFtZSkge1xuICB3cmFwTWV0aG9kSGFuZGVyRm9yRXJyb3JzKG5hbWUsIGhhbmRsZXIsIE1ldGVvci5zZXJ2ZXIubWV0aG9kX2hhbmRsZXJzKTtcbn0pO1xuXG4vLyB3cmFwIGZ1dHVyZSBtZXRob2QgaGFuZGxlcnMgZm9yIGNhcHR1cmluZyBlcnJvcnNcbmxldCBvcmlnaW5hbE1ldGVvck1ldGhvZHMgPSBNZXRlb3IubWV0aG9kcztcbk1ldGVvci5tZXRob2RzID0gZnVuY3Rpb24gKG1ldGhvZE1hcCkge1xuICBfLmVhY2gobWV0aG9kTWFwLCBmdW5jdGlvbiAoaGFuZGxlciwgbmFtZSkge1xuICAgIHdyYXBNZXRob2RIYW5kZXJGb3JFcnJvcnMobmFtZSwgaGFuZGxlciwgbWV0aG9kTWFwKTtcbiAgfSk7XG4gIG9yaWdpbmFsTWV0ZW9yTWV0aG9kcyhtZXRob2RNYXApO1xufTtcblxuXG5mdW5jdGlvbiB3cmFwTWV0aG9kSGFuZGVyRm9yRXJyb3JzIChuYW1lLCBvcmlnaW5hbEhhbmRsZXIsIG1ldGhvZE1hcCkge1xuICBtZXRob2RNYXBbbmFtZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBvcmlnaW5hbEhhbmRsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgaWYgKGV4ICYmIEthZGlyYS5fZ2V0SW5mbygpKSB7XG4gICAgICAgIC8vIHNvbWV0aW1lcyBlcnJvciBtYXkgYmUganVzdCBhIHN0cmluZyBvciBhIHByaW1pdGl2ZVxuICAgICAgICAvLyBpbiB0aGF0IGNhc2UsIHdlIG5lZWQgdG8gbWFrZSBpdCBhIHBzdWVkbyBlcnJvclxuICAgICAgICBpZiAodHlwZW9mIGV4ICE9PSAnb2JqZWN0Jykge1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1leC1hc3NpZ25cbiAgICAgICAgICBleCA9IHttZXNzYWdlOiBleCwgc3RhY2s6IGV4fTtcbiAgICAgICAgfVxuICAgICAgICAvLyBOb3cgd2UgYXJlIG1hcmtpbmcgdGhpcyBlcnJvciB0byBnZXQgdHJhY2tlZCB2aWEgbWV0aG9kc1xuICAgICAgICAvLyBCdXQsIHRoaXMgYWxzbyB0cmlnZ2VycyBhIE1ldGVvci5kZWJ1ZyBjYWxsLCBhbmRcbiAgICAgICAgLy8gaXQgb25seSBnZXRzIHRoZSBzdGFja1xuICAgICAgICAvLyBXZSBhbHNvIHRyYWNrIE1ldGVvci5kZWJ1ZyBlcnJvcnMgYW5kIHdhbnQgdG8gc3RvcFxuICAgICAgICAvLyB0cmFja2luZyB0aGlzIGVycm9yLiBUaGF0J3Mgd2h5IHdlIGRvIHRoaXNcbiAgICAgICAgLy8gU2VlIE1ldGVvci5kZWJ1ZyBlcnJvciB0cmFja2luZyBjb2RlIGZvciBtb3JlXG4gICAgICAgIC8vIElmIGVycm9yIHRyYWNraW5nIGlzIGRpc2FibGVkLCB3ZSBkbyBub3QgbW9kaWZ5IHRoZSBzdGFjayBzaW5jZVxuICAgICAgICAvLyBpdCB3b3VsZCBiZSBzaG93biBhcyBhbiBvYmplY3QgaW4gdGhlIGxvZ3NcbiAgICAgICAgaWYgKEthZGlyYS5vcHRpb25zLmVuYWJsZUVycm9yVHJhY2tpbmcpIHtcbiAgICAgICAgICBleC5zdGFjayA9IHtzdGFjazogZXguc3RhY2ssIHNvdXJjZTogJ21ldGhvZCcsIFtNZXRlb3JEZWJ1Z0lnbm9yZV06IHRydWV9O1xuICAgICAgICAgIEthZGlyYS5fZ2V0SW5mbygpLmN1cnJlbnRFcnJvciA9IGV4O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aHJvdyBleDtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBNZXRlb3JEZWJ1Z0lnbm9yZSB9IGZyb20gJy4vZXJyb3InO1xuaW1wb3J0IHsgXyB9IGZyb20gJ21ldGVvci91bmRlcnNjb3JlJztcblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBTdWJzY3JpcHRpb24gKHN1YnNjcmlwdGlvblByb3RvKSB7XG4gIC8vIElmIHRoZSByZWFkeSBldmVudCBydW5zIG91dHNpZGUgdGhlIEZpYmVyLCBLYWRpcmEuX2dldEluZm8oKSBkb2Vzbid0IHdvcmsuXG4gIC8vIHdlIG5lZWQgc29tZSBvdGhlciB3YXkgdG8gc3RvcmUga2FkaXJhSW5mbyBzbyB3ZSBjYW4gdXNlIGl0IGF0IHJlYWR5IGhpamFjay5cbiAgbGV0IG9yaWdpbmFsUnVuSGFuZGxlciA9IHN1YnNjcmlwdGlvblByb3RvLl9ydW5IYW5kbGVyO1xuICBzdWJzY3JpcHRpb25Qcm90by5fcnVuSGFuZGxlciA9IGZ1bmN0aW9uICgpIHtcbiAgICBsZXQga2FkaXJhSW5mbyA9IEthZGlyYS5fZ2V0SW5mbygpO1xuICAgIGlmIChrYWRpcmFJbmZvKSB7XG4gICAgICB0aGlzLl9fa2FkaXJhSW5mbyA9IGthZGlyYUluZm87XG4gICAgfVxuICAgIG9yaWdpbmFsUnVuSGFuZGxlci5jYWxsKHRoaXMpO1xuICB9O1xuXG4gIGxldCBvcmlnaW5hbFJlYWR5ID0gc3Vic2NyaXB0aW9uUHJvdG8ucmVhZHk7XG4gIHN1YnNjcmlwdGlvblByb3RvLnJlYWR5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vIG1ldGVvciBoYXMgYSBmaWVsZCBjYWxsZWQgYF9yZWFkeWAgd2hpY2ggdHJhY2tzIHRoaXMsXG4gICAgLy8gYnV0IHdlIG5lZWQgdG8gbWFrZSBpdCBmdXR1cmUtcHJvb2ZcbiAgICBpZiAoIXRoaXMuX2FwbVJlYWR5VHJhY2tlZCkge1xuICAgICAgbGV0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8oKSB8fCB0aGlzLl9fa2FkaXJhSW5mbztcbiAgICAgIGRlbGV0ZSB0aGlzLl9fa2FkaXJhSW5mbztcblxuICAgICAgbGV0IHRyYWNlO1xuXG4gICAgICAvLyBzb21ldGltZSAucmVhZHkgY2FuIGJlIGNhbGxlZCBpbiB0aGUgY29udGV4dCBvZiB0aGUgbWV0aG9kXG4gICAgICAvLyB0aGVuIHdlIGhhdmUgc29tZSBwcm9ibGVtcywgdGhhdCdzIHdoeSB3ZSBhcmUgY2hlY2tpbmcgdGhpc1xuICAgICAgLy8gZWc6LSBBY2NvdW50cy5jcmVhdGVVc2VyXG4gICAgICAvLyBBbHNvLCB3aGVuIHRoZSBzdWJzY3JpcHRpb24gaXMgY3JlYXRlZCBieSBmYXN0IHJlbmRlciwgX3N1YnNjcmlwdGlvbklkIGFuZFxuICAgICAgLy8gdGhlIHRyYWNlLmlkIGFyZSBib3RoIHVuZGVmaW5lZCwgYnV0IHdlIGRvbid0IHdhbnQgdG8gY29tcGxldGUgdGhlIEhUVFAgdHJhY2UgaGVyZVxuICAgICAgaWYgKGthZGlyYUluZm8gJiYgdGhpcy5fc3Vic2NyaXB0aW9uSWQgJiYgdGhpcy5fc3Vic2NyaXB0aW9uSWQgPT09IGthZGlyYUluZm8udHJhY2UuaWQpIHtcbiAgICAgICAgS2FkaXJhLnRyYWNlci5lbmRMYXN0RXZlbnQoa2FkaXJhSW5mby50cmFjZSk7XG4gICAgICAgIEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2NvbXBsZXRlJyk7XG4gICAgICAgIHRyYWNlID0gS2FkaXJhLnRyYWNlci5idWlsZFRyYWNlKGthZGlyYUluZm8udHJhY2UpO1xuICAgICAgfVxuXG4gICAgICBLYWRpcmEuRXZlbnRCdXMuZW1pdCgncHVic3ViJywgJ3N1YkNvbXBsZXRlZCcsIHRyYWNlLCB0aGlzLl9zZXNzaW9uLCB0aGlzKTtcbiAgICAgIEthZGlyYS5tb2RlbHMucHVic3ViLl90cmFja1JlYWR5KHRoaXMuX3Nlc3Npb24sIHRoaXMsIHRyYWNlKTtcbiAgICAgIHRoaXMuX2FwbVJlYWR5VHJhY2tlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gd2Ugc3RpbGwgcGFzcyB0aGUgY29udHJvbCB0byB0aGUgb3JpZ2luYWwgaW1wbGVtZW50YXRpb25cbiAgICAvLyBzaW5jZSBtdWx0aXBsZSByZWFkeSBjYWxscyBhcmUgaGFuZGxlZCBieSBpdHNlbGZcbiAgICBvcmlnaW5hbFJlYWR5LmNhbGwodGhpcyk7XG4gIH07XG5cbiAgbGV0IG9yaWdpbmFsRXJyb3IgPSBzdWJzY3JpcHRpb25Qcm90by5lcnJvcjtcbiAgc3Vic2NyaXB0aW9uUHJvdG8uZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgaWYgKHR5cGVvZiBlcnIgPT09ICdzdHJpbmcnKSB7XG4gICAgICBlcnIgPSB7IG1lc3NhZ2U6IGVyciB9O1xuICAgIH1cblxuICAgIGxldCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCk7XG5cbiAgICBpZiAoa2FkaXJhSW5mbyAmJiB0aGlzLl9zdWJzY3JpcHRpb25JZCAmJiB0aGlzLl9zdWJzY3JpcHRpb25JZCA9PT0ga2FkaXJhSW5mby50cmFjZS5pZCkge1xuICAgICAgS2FkaXJhLnRyYWNlci5lbmRMYXN0RXZlbnQoa2FkaXJhSW5mby50cmFjZSk7XG5cbiAgICAgIGxldCBlcnJvckZvckFwbSA9IF8ucGljayhlcnIsICdtZXNzYWdlJywgJ3N0YWNrJyk7XG4gICAgICBLYWRpcmEudHJhY2VyLmV2ZW50KGthZGlyYUluZm8udHJhY2UsICdlcnJvcicsIHtlcnJvcjogZXJyb3JGb3JBcG19KTtcbiAgICAgIGxldCB0cmFjZSA9IEthZGlyYS50cmFjZXIuYnVpbGRUcmFjZShrYWRpcmFJbmZvLnRyYWNlKTtcblxuICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIuX3RyYWNrRXJyb3IodGhpcy5fc2Vzc2lvbiwgdGhpcywgdHJhY2UpO1xuXG4gICAgICAvLyBlcnJvciB0cmFja2luZyBjYW4gYmUgZGlzYWJsZWQgYW5kIGlmIHRoZXJlIGlzIGEgdHJhY2VcbiAgICAgIC8vIHNob3VsZCBiZSBhdmFpbGFibGUgYWxsIHRoZSB0aW1lLCBidXQgaXQgd29uJ3RcbiAgICAgIC8vIGlmIHNvbWV0aGluZyB3cm9uZyBoYXBwZW5lZCBvbiB0aGUgdHJhY2UgYnVpbGRpbmdcbiAgICAgIGlmIChLYWRpcmEub3B0aW9ucy5lbmFibGVFcnJvclRyYWNraW5nICYmIHRyYWNlKSB7XG4gICAgICAgIEthZGlyYS5tb2RlbHMuZXJyb3IudHJhY2tFcnJvcihlcnIsIHRyYWNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB3cmFwIGVycm9yIHN0YWNrIHNvIE1ldGVvci5fZGVidWcgY2FuIGlkZW50aWZ5IGFuZCBpZ25vcmUgaXRcbiAgICAvLyBpdCBpcyBub3Qgd3JhcHBlZCB3aGVuIGVycm9yIHRyYWNraW5nIGlzIGRpc2FibGVkIHNpbmNlIGl0XG4gICAgLy8gd291bGQgYmUgc2hvd24gYXMgYW4gb2JqZWN0IGluIHRoZSBsb2dzXG4gICAgaWYgKEthZGlyYS5vcHRpb25zLmVuYWJsZUVycm9yVHJhY2tpbmcpIHtcbiAgICAgIGVyci5zdGFjayA9IHtzdGFjazogZXJyLnN0YWNrLCBzb3VyY2U6ICdzdWJzY3JpcHRpb24nLCBbTWV0ZW9yRGVidWdJZ25vcmVdOiB0cnVlfTtcbiAgICB9XG4gICAgb3JpZ2luYWxFcnJvci5jYWxsKHRoaXMsIGVycik7XG4gIH07XG5cbiAgbGV0IG9yaWdpbmFsRGVhY3RpdmF0ZSA9IHN1YnNjcmlwdGlvblByb3RvLl9kZWFjdGl2YXRlO1xuICBzdWJzY3JpcHRpb25Qcm90by5fZGVhY3RpdmF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICBLYWRpcmEuRXZlbnRCdXMuZW1pdCgncHVic3ViJywgJ3N1YkRlYWN0aXZhdGVkJywgdGhpcy5fc2Vzc2lvbiwgdGhpcyk7XG4gICAgS2FkaXJhLm1vZGVscy5wdWJzdWIuX3RyYWNrVW5zdWIodGhpcy5fc2Vzc2lvbiwgdGhpcyk7XG4gICAgb3JpZ2luYWxEZWFjdGl2YXRlLmNhbGwodGhpcyk7XG4gIH07XG5cbiAgLy8gYWRkaW5nIHRoZSBjdXJyZW5TdWIgZW52IHZhcmlhYmxlXG4gIFsnYWRkZWQnLCAnY2hhbmdlZCcsICdyZW1vdmVkJ10uZm9yRWFjaChmdW5jdGlvbiAoZnVuY05hbWUpIHtcbiAgICBsZXQgb3JpZ2luYWxGdW5jID0gc3Vic2NyaXB0aW9uUHJvdG9bZnVuY05hbWVdO1xuICAgIHN1YnNjcmlwdGlvblByb3RvW2Z1bmNOYW1lXSA9IGZ1bmN0aW9uIChjb2xsZWN0aW9uTmFtZSwgaWQsIGZpZWxkcykge1xuICAgICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAvLyB3ZSBuZWVkIHRvIHJ1biB0aGlzIGNvZGUgaW4gYSBmaWJlciBhbmQgdGhhdCdzIGhvdyB3ZSB0cmFja1xuICAgICAgLy8gc3Vic2NyaXB0aW9uIGluZm8uIE1heWJlIHdlIGNhbiBmaWd1cmUgb3V0LCBzb21lIG90aGVyIHdheSB0byBkbyB0aGlzXG4gICAgICAvLyBXZSB1c2UgdGhpcyBjdXJyZW50bHkgdG8gZ2V0IHRoZSBwdWJsaWNhdGlvbiBpbmZvIHdoZW4gdHJhY2tpbmcgbWVzc2FnZVxuICAgICAgLy8gc2l6ZXMgYXQgd3JhcF9kZHBfc3RyaW5naWZ5LmpzXG4gICAgICBLYWRpcmEuZW52LmN1cnJlbnRTdWIgPSBzZWxmO1xuICAgICAgbGV0IHJlcyA9IG9yaWdpbmFsRnVuYy5jYWxsKHNlbGYsIGNvbGxlY3Rpb25OYW1lLCBpZCwgZmllbGRzKTtcbiAgICAgIEthZGlyYS5lbnYuY3VycmVudFN1YiA9IG51bGw7XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JhcE9wbG9nT2JzZXJ2ZURyaXZlciAocHJvdG8pIHtcbiAgLy8gVHJhY2sgdGhlIHBvbGxlZCBkb2N1bWVudHMuIFRoaXMgaXMgcmVmbGVjdGVkIHRvIHRoZSBSQU0gc2l6ZSBhbmRcbiAgLy8gZm9yIHRoZSBDUFUgdXNhZ2UgZGlyZWN0bHlcbiAgbGV0IG9yaWdpbmFsUHVibGlzaE5ld1Jlc3VsdHMgPSBwcm90by5fcHVibGlzaE5ld1Jlc3VsdHM7XG4gIHByb3RvLl9wdWJsaXNoTmV3UmVzdWx0cyA9IGZ1bmN0aW9uIChuZXdSZXN1bHRzLCBuZXdCdWZmZXIpIHtcbiAgICBsZXQgY29sbCA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lO1xuICAgIGxldCBxdWVyeSA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLnNlbGVjdG9yO1xuICAgIGxldCBvcHRzID0gdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucztcbiAgICBjb25zdCBkb2NTaXplID0gS2FkaXJhLmRvY1N6Q2FjaGUuZ2V0U2l6ZShjb2xsLCBxdWVyeSwgb3B0cywgbmV3QnVmZmVyKTtcbiAgICBsZXQgY291bnQgPSBuZXdSZXN1bHRzLnNpemUoKSArIG5ld0J1ZmZlci5zaXplKCk7XG4gICAgaWYgKHRoaXMuX293bmVySW5mbykge1xuICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tQb2xsZWREb2N1bWVudHModGhpcy5fb3duZXJJbmZvLCBjb3VudCk7XG4gICAgICBLYWRpcmEubW9kZWxzLnB1YnN1Yi50cmFja0RvY1NpemUodGhpcy5fb3duZXJJbmZvLm5hbWUsICdwb2xsZWRGZXRjaGVzJywgZG9jU2l6ZSAqIGNvdW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcG9sbGVkRG9jdW1lbnRzID0gY291bnQ7XG4gICAgICB0aGlzLl9kb2NTaXplID0ge1xuICAgICAgICBwb2xsZWRGZXRjaGVzOiBkb2NTaXplICogY291bnRcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBvcmlnaW5hbFB1Ymxpc2hOZXdSZXN1bHRzLmNhbGwodGhpcywgbmV3UmVzdWx0cywgbmV3QnVmZmVyKTtcbiAgfTtcblxuICBsZXQgb3JpZ2luYWxIYW5kbGVPcGxvZ0VudHJ5UXVlcnlpbmcgPSBwcm90by5faGFuZGxlT3Bsb2dFbnRyeVF1ZXJ5aW5nO1xuICBwcm90by5faGFuZGxlT3Bsb2dFbnRyeVF1ZXJ5aW5nID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tEb2N1bWVudENoYW5nZXModGhpcy5fb3duZXJJbmZvLCBvcCk7XG4gICAgcmV0dXJuIG9yaWdpbmFsSGFuZGxlT3Bsb2dFbnRyeVF1ZXJ5aW5nLmNhbGwodGhpcywgb3ApO1xuICB9O1xuXG4gIGxldCBvcmlnaW5hbEhhbmRsZU9wbG9nRW50cnlTdGVhZHlPckZldGNoaW5nID0gcHJvdG8uX2hhbmRsZU9wbG9nRW50cnlTdGVhZHlPckZldGNoaW5nO1xuICBwcm90by5faGFuZGxlT3Bsb2dFbnRyeVN0ZWFkeU9yRmV0Y2hpbmcgPSBmdW5jdGlvbiAob3ApIHtcbiAgICBLYWRpcmEubW9kZWxzLnB1YnN1Yi50cmFja0RvY3VtZW50Q2hhbmdlcyh0aGlzLl9vd25lckluZm8sIG9wKTtcbiAgICByZXR1cm4gb3JpZ2luYWxIYW5kbGVPcGxvZ0VudHJ5U3RlYWR5T3JGZXRjaGluZy5jYWxsKHRoaXMsIG9wKTtcbiAgfTtcblxuICAvLyB0cmFjayBsaXZlIHVwZGF0ZXNcbiAgWydfYWRkUHVibGlzaGVkJywgJ19yZW1vdmVQdWJsaXNoZWQnLCAnX2NoYW5nZVB1Ymxpc2hlZCddLmZvckVhY2goZnVuY3Rpb24gKGZuTmFtZSkge1xuICAgIGxldCBvcmlnaW5hbEZuID0gcHJvdG9bZm5OYW1lXTtcbiAgICBwcm90b1tmbk5hbWVdID0gZnVuY3Rpb24gKGEsIGIsIGMpIHtcbiAgICAgIGlmICh0aGlzLl9vd25lckluZm8pIHtcbiAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tMaXZlVXBkYXRlcyh0aGlzLl9vd25lckluZm8sIGZuTmFtZSwgMSk7XG5cbiAgICAgICAgaWYgKGZuTmFtZSA9PT0gJ19hZGRQdWJsaXNoZWQnKSB7XG4gICAgICAgICAgY29uc3QgY29sbCA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lO1xuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3I7XG4gICAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnM7XG4gICAgICAgICAgY29uc3QgZG9jU2l6ZSA9IEthZGlyYS5kb2NTekNhY2hlLmdldFNpemUoY29sbCwgcXVlcnksIG9wdHMsIFtiXSk7XG5cbiAgICAgICAgICBLYWRpcmEubW9kZWxzLnB1YnN1Yi50cmFja0RvY1NpemUodGhpcy5fb3duZXJJbmZvLm5hbWUsICdsaXZlRmV0Y2hlcycsIGRvY1NpemUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBvd25lckluZm8sIHRoYXQgbWVhbnMgdGhpcyBpcyB0aGUgaW5pdGlhbCBhZGRzXG4gICAgICAgIGlmICghdGhpcy5fbGl2ZVVwZGF0ZXNDb3VudHMpIHtcbiAgICAgICAgICB0aGlzLl9saXZlVXBkYXRlc0NvdW50cyA9IHtcbiAgICAgICAgICAgIF9pbml0aWFsQWRkczogMFxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9saXZlVXBkYXRlc0NvdW50cy5faW5pdGlhbEFkZHMrKztcblxuICAgICAgICBpZiAoZm5OYW1lID09PSAnX2FkZFB1Ymxpc2hlZCcpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuX2RvY1NpemUpIHtcbiAgICAgICAgICAgIHRoaXMuX2RvY1NpemUgPSB7XG4gICAgICAgICAgICAgIGluaXRpYWxGZXRjaGVzOiAwXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghdGhpcy5fZG9jU2l6ZS5pbml0aWFsRmV0Y2hlcykge1xuICAgICAgICAgICAgdGhpcy5fZG9jU2l6ZS5pbml0aWFsRmV0Y2hlcyA9IDA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY29uc3QgY29sbCA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lO1xuICAgICAgICAgIGNvbnN0IHF1ZXJ5ID0gdGhpcy5fY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3I7XG4gICAgICAgICAgY29uc3Qgb3B0cyA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLm9wdGlvbnM7XG4gICAgICAgICAgY29uc3QgZG9jU2l6ZSA9IEthZGlyYS5kb2NTekNhY2hlLmdldFNpemUoY29sbCwgcXVlcnksIG9wdHMsIFtiXSk7XG5cbiAgICAgICAgICB0aGlzLl9kb2NTaXplLmluaXRpYWxGZXRjaGVzICs9IGRvY1NpemU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9yaWdpbmFsRm4uY2FsbCh0aGlzLCBhLCBiLCBjKTtcbiAgICB9O1xuICB9KTtcblxuICBsZXQgb3JpZ2luYWxTdG9wID0gcHJvdG8uc3RvcDtcbiAgcHJvdG8uc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fb3duZXJJbmZvICYmIHRoaXMuX293bmVySW5mby50eXBlID09PSAnc3ViJykge1xuICAgICAgS2FkaXJhLkV2ZW50QnVzLmVtaXQoJ3B1YnN1YicsICdvYnNlcnZlckRlbGV0ZWQnLCB0aGlzLl9vd25lckluZm8pO1xuICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tEZWxldGVkT2JzZXJ2ZXIodGhpcy5fb3duZXJJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JpZ2luYWxTdG9wLmNhbGwodGhpcyk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwUG9sbGluZ09ic2VydmVEcml2ZXIgKHByb3RvKSB7XG4gIGxldCBvcmlnaW5hbFBvbGxNb25nbyA9IHByb3RvLl9wb2xsTW9uZ287XG4gIHByb3RvLl9wb2xsTW9uZ28gPSBmdW5jdGlvbiAoKSB7XG4gICAgb3JpZ2luYWxQb2xsTW9uZ28uY2FsbCh0aGlzKTtcblxuICAgIC8vIEN1cnJlbnQgcmVzdWx0IGlzIHN0b3JlZCBpbiB0aGUgZm9sbG93aW5nIHZhcmlhYmxlLlxuICAgIC8vIFNvLCB3ZSBjYW4gdXNlIHRoYXRcbiAgICAvLyBTb21ldGltZXMsIGl0J3MgcG9zc2libGUgdG8gZ2V0IHNpemUgYXMgdW5kZWZpbmVkLlxuICAgIC8vIE1heSBiZSBzb21ldGhpbmcgd2l0aCBkaWZmZXJlbnQgdmVyc2lvbi4gV2UgZG9uJ3QgbmVlZCB0byB3b3JyeSBhYm91dFxuICAgIC8vIHRoaXMgbm93XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBsZXQgZG9jU2l6ZSA9IDA7XG5cbiAgICBpZiAodGhpcy5fcmVzdWx0cyAmJiB0aGlzLl9yZXN1bHRzLnNpemUpIHtcbiAgICAgIGNvdW50ID0gdGhpcy5fcmVzdWx0cy5zaXplKCkgfHwgMDtcblxuICAgICAgbGV0IGNvbGwgPSB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5jb2xsZWN0aW9uTmFtZTtcbiAgICAgIGxldCBxdWVyeSA9IHRoaXMuX2N1cnNvckRlc2NyaXB0aW9uLnNlbGVjdG9yO1xuICAgICAgbGV0IG9wdHMgPSB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zO1xuXG4gICAgICBkb2NTaXplID0gS2FkaXJhLmRvY1N6Q2FjaGUuZ2V0U2l6ZShjb2xsLCBxdWVyeSwgb3B0cywgdGhpcy5fcmVzdWx0cy5fbWFwKSAqIGNvdW50O1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9vd25lckluZm8pIHtcbiAgICAgIEthZGlyYS5tb2RlbHMucHVic3ViLnRyYWNrUG9sbGVkRG9jdW1lbnRzKHRoaXMuX293bmVySW5mbywgY291bnQpO1xuICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tEb2NTaXplKHRoaXMuX293bmVySW5mby5uYW1lLCAncG9sbGVkRmV0Y2hlcycsIGRvY1NpemUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9wb2xsZWREb2N1bWVudHMgPSBjb3VudDtcbiAgICAgIHRoaXMuX3BvbGxlZERvY1NpemUgPSBkb2NTaXplO1xuICAgIH1cbiAgfTtcblxuICBsZXQgb3JpZ2luYWxTdG9wID0gcHJvdG8uc3RvcDtcbiAgcHJvdG8uc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodGhpcy5fb3duZXJJbmZvICYmIHRoaXMuX293bmVySW5mby50eXBlID09PSAnc3ViJykge1xuICAgICAgS2FkaXJhLkV2ZW50QnVzLmVtaXQoJ3B1YnN1YicsICdvYnNlcnZlckRlbGV0ZWQnLCB0aGlzLl9vd25lckluZm8pO1xuICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tEZWxldGVkT2JzZXJ2ZXIodGhpcy5fb3duZXJJbmZvKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JpZ2luYWxTdG9wLmNhbGwodGhpcyk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTXVsdGlwbGV4ZXIgKHByb3RvKSB7XG4gIGxldCBvcmlnaW5hbEluaXRhbEFkZCA9IHByb3RvLmFkZEhhbmRsZUFuZFNlbmRJbml0aWFsQWRkcztcbiAgcHJvdG8uYWRkSGFuZGxlQW5kU2VuZEluaXRpYWxBZGRzID0gZnVuY3Rpb24gKGhhbmRsZSkge1xuICAgIGlmICghdGhpcy5fZmlyc3RJbml0aWFsQWRkVGltZSkge1xuICAgICAgdGhpcy5fZmlyc3RJbml0aWFsQWRkVGltZSA9IERhdGUubm93KCk7XG4gICAgfVxuXG4gICAgaGFuZGxlLl93YXNNdWx0aXBsZXhlclJlYWR5ID0gdGhpcy5fcmVhZHkoKTtcbiAgICBoYW5kbGUuX3F1ZXVlTGVuZ3RoID0gdGhpcy5fcXVldWUuX3Rhc2tIYW5kbGVzLmxlbmd0aDtcblxuICAgIGlmICghaGFuZGxlLl93YXNNdWx0aXBsZXhlclJlYWR5KSB7XG4gICAgICBoYW5kbGUuX2VsYXBzZWRQb2xsaW5nVGltZSA9IERhdGUubm93KCkgLSB0aGlzLl9maXJzdEluaXRpYWxBZGRUaW1lO1xuICAgIH1cbiAgICByZXR1cm4gb3JpZ2luYWxJbml0YWxBZGQuY2FsbCh0aGlzLCBoYW5kbGUpO1xuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcEZvckNvdW50aW5nT2JzZXJ2ZXJzICgpIHtcbiAgLy8gdG8gY291bnQgb2JzZXJ2ZXJzXG4gIGxldCBtb25nb0Nvbm5lY3Rpb25Qcm90byA9IE1ldGVvclguTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZTtcbiAgbGV0IG9yaWdpbmFsT2JzZXJ2ZUNoYW5nZXMgPSBtb25nb0Nvbm5lY3Rpb25Qcm90by5fb2JzZXJ2ZUNoYW5nZXM7XG4gIG1vbmdvQ29ubmVjdGlvblByb3RvLl9vYnNlcnZlQ2hhbmdlcyA9IGZ1bmN0aW9uIChjdXJzb3JEZXNjcmlwdGlvbiwgb3JkZXJlZCwgY2FsbGJhY2tzKSB7XG4gICAgbGV0IHJldCA9IG9yaWdpbmFsT2JzZXJ2ZUNoYW5nZXMuY2FsbCh0aGlzLCBjdXJzb3JEZXNjcmlwdGlvbiwgb3JkZXJlZCwgY2FsbGJhY2tzKTtcbiAgICAvLyBnZXQgdGhlIEthZGlyYSBJbmZvIHZpYSB0aGUgTWV0ZW9yLkVudmlyb25tZW50YWxWYXJpYWJsZVxuICAgIGxldCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKG51bGwsIHRydWUpO1xuXG4gICAgaWYgKGthZGlyYUluZm8gJiYgcmV0Ll9tdWx0aXBsZXhlcikge1xuICAgICAgaWYgKCFyZXQuX211bHRpcGxleGVyLl9fa2FkaXJhVHJhY2tlZCkge1xuICAgICAgICAvLyBuZXcgbXVsdGlwbGV4ZXJcbiAgICAgICAgcmV0Ll9tdWx0aXBsZXhlci5fX2thZGlyYVRyYWNrZWQgPSB0cnVlO1xuICAgICAgICBLYWRpcmEuRXZlbnRCdXMuZW1pdCgncHVic3ViJywgJ25ld1N1YkhhbmRsZUNyZWF0ZWQnLCBrYWRpcmFJbmZvLnRyYWNlKTtcbiAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIuaW5jcmVtZW50SGFuZGxlQ291bnQoa2FkaXJhSW5mby50cmFjZSwgZmFsc2UpO1xuICAgICAgICBpZiAoa2FkaXJhSW5mby50cmFjZS50eXBlID09PSAnc3ViJykge1xuICAgICAgICAgIGxldCBvd25lckluZm8gPSB7XG4gICAgICAgICAgICB0eXBlOiBrYWRpcmFJbmZvLnRyYWNlLnR5cGUsXG4gICAgICAgICAgICBuYW1lOiBrYWRpcmFJbmZvLnRyYWNlLm5hbWUsXG4gICAgICAgICAgICBzdGFydFRpbWU6IG5ldyBEYXRlKCkuZ2V0VGltZSgpXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGxldCBvYnNlcnZlckRyaXZlciA9IHJldC5fbXVsdGlwbGV4ZXIuX29ic2VydmVEcml2ZXI7XG4gICAgICAgICAgb2JzZXJ2ZXJEcml2ZXIuX293bmVySW5mbyA9IG93bmVySW5mbztcbiAgICAgICAgICBLYWRpcmEuRXZlbnRCdXMuZW1pdCgncHVic3ViJywgJ29ic2VydmVyQ3JlYXRlZCcsIG93bmVySW5mbyk7XG4gICAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tDcmVhdGVkT2JzZXJ2ZXIob3duZXJJbmZvKTtcblxuICAgICAgICAgIC8vIFdlIG5lZWQgdG8gc2VuZCBpbml0aWFsbHkgcG9sbGVkIGRvY3VtZW50cyBpZiB0aGVyZSBhcmVcbiAgICAgICAgICBpZiAob2JzZXJ2ZXJEcml2ZXIuX3BvbGxlZERvY3VtZW50cykge1xuICAgICAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tQb2xsZWREb2N1bWVudHMob3duZXJJbmZvLCBvYnNlcnZlckRyaXZlci5fcG9sbGVkRG9jdW1lbnRzKTtcbiAgICAgICAgICAgIG9ic2VydmVyRHJpdmVyLl9wb2xsZWREb2N1bWVudHMgPSAwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIFdlIG5lZWQgdG8gc2VuZCBpbml0aWFsbHkgcG9sbGVkIGRvY3VtZW50cyBpZiB0aGVyZSBhcmVcbiAgICAgICAgICBpZiAob2JzZXJ2ZXJEcml2ZXIuX3BvbGxlZERvY1NpemUpIHtcbiAgICAgICAgICAgIEthZGlyYS5tb2RlbHMucHVic3ViLnRyYWNrRG9jU2l6ZShvd25lckluZm8ubmFtZSwgJ3BvbGxlZEZldGNoZXMnLCBvYnNlcnZlckRyaXZlci5fcG9sbGVkRG9jU2l6ZSk7XG4gICAgICAgICAgICBvYnNlcnZlckRyaXZlci5fcG9sbGVkRG9jU2l6ZSA9IDA7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gUHJvY2VzcyBfbGl2ZVVwZGF0ZXNDb3VudHNcbiAgICAgICAgICBfLmVhY2gob2JzZXJ2ZXJEcml2ZXIuX2xpdmVVcGRhdGVzQ291bnRzLCBmdW5jdGlvbiAoY291bnQsIGtleSkge1xuICAgICAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tMaXZlVXBkYXRlcyhvd25lckluZm8sIGtleSwgY291bnQpO1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gUHJvY2VzcyBkb2NTaXplXG4gICAgICAgICAgXy5lYWNoKG9ic2VydmVyRHJpdmVyLl9kb2NTaXplLCBmdW5jdGlvbiAoY291bnQsIGtleSkge1xuICAgICAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tEb2NTaXplKG93bmVySW5mby5uYW1lLCBrZXksIGNvdW50KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgS2FkaXJhLkV2ZW50QnVzLmVtaXQoJ3B1YnN1YicsICdjYWNoZWRTdWJIYW5kbGVDcmVhdGVkJywga2FkaXJhSW5mby50cmFjZSk7XG4gICAgICAgIEthZGlyYS5tb2RlbHMucHVic3ViLmluY3JlbWVudEhhbmRsZUNvdW50KGthZGlyYUluZm8udHJhY2UsIHRydWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiByZXQ7XG4gIH07XG59XG4iLCJpbXBvcnQgeyBERFBDb21tb24gfSBmcm9tICdtZXRlb3IvZGRwLWNvbW1vbic7XG5cbmV4cG9ydCBmdW5jdGlvbiB3cmFwU3RyaW5naWZ5RERQICgpIHtcbiAgbGV0IG9yaWdpbmFsU3RyaW5naWZ5RERQID0gRERQQ29tbW9uLnN0cmluZ2lmeUREUDtcblxuICBERFBDb21tb24uc3RyaW5naWZ5RERQID0gZnVuY3Rpb24gKG1zZykge1xuICAgIGxldCBtc2dTdHJpbmcgPSBvcmlnaW5hbFN0cmluZ2lmeUREUChtc2cpO1xuICAgIGxldCBtc2dTaXplID0gQnVmZmVyLmJ5dGVMZW5ndGgobXNnU3RyaW5nLCAndXRmOCcpO1xuXG4gICAgbGV0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8obnVsbCwgdHJ1ZSk7XG5cbiAgICBpZiAoa2FkaXJhSW5mbyAmJiAhS2FkaXJhLmVudi5jdXJyZW50U3ViKSB7XG4gICAgICBpZiAoa2FkaXJhSW5mby50cmFjZS50eXBlID09PSAnbWV0aG9kJykge1xuICAgICAgICBLYWRpcmEubW9kZWxzLm1ldGhvZHMudHJhY2tNc2dTaXplKGthZGlyYUluZm8udHJhY2UubmFtZSwgbXNnU2l6ZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBtc2dTdHJpbmc7XG4gICAgfVxuXG4gICAgLy8gJ2N1cnJlbnRTdWInIGlzIHNldCB3aGVuIHdlIHdyYXAgU3Vic2NyaXB0aW9uIG9iamVjdCBhbmQgb3ZlcnJpZGVcbiAgICAvLyBoYW5kbGVycyBmb3IgJ2FkZGVkJywgJ2NoYW5nZWQnLCAncmVtb3ZlZCcgZXZlbnRzLiAoc2VlIGxpYi9oaWphY2svd3JhcF9zdWJzY3JpcHRpb24uanMpXG4gICAgaWYgKEthZGlyYS5lbnYuY3VycmVudFN1Yikge1xuICAgICAgaWYgKEthZGlyYS5lbnYuY3VycmVudFN1Yi5fX2thZGlyYUluZm8pIHtcbiAgICAgICAgS2FkaXJhLm1vZGVscy5wdWJzdWIudHJhY2tNc2dTaXplKEthZGlyYS5lbnYuY3VycmVudFN1Yi5fbmFtZSwgJ2luaXRpYWxTZW50JywgbXNnU2l6ZSk7XG4gICAgICAgIHJldHVybiBtc2dTdHJpbmc7XG4gICAgICB9XG4gICAgICBLYWRpcmEubW9kZWxzLnB1YnN1Yi50cmFja01zZ1NpemUoS2FkaXJhLmVudi5jdXJyZW50U3ViLl9uYW1lLCAnbGl2ZVNlbnQnLCBtc2dTaXplKTtcbiAgICAgIHJldHVybiBtc2dTdHJpbmc7XG4gICAgfVxuXG4gICAgS2FkaXJhLm1vZGVscy5tZXRob2RzLnRyYWNrTXNnU2l6ZSgnPG5vdC1hLW1ldGhvZC1vci1hLXB1Yj4nLCBtc2dTaXplKTtcbiAgICByZXR1cm4gbXNnU3RyaW5nO1xuICB9O1xufVxuIiwiaW1wb3J0IHsgd3JhcFdlYkFwcCB9IGZyb20gJy4vd3JhcF93ZWJhcHAuanMnO1xuaW1wb3J0IHsgd3JhcEZhc3RSZW5kZXIgfSBmcm9tICcuL2Zhc3RfcmVuZGVyLmpzJztcbmltcG9ydCB7IHdyYXBGcyB9IGZyb20gJy4vZnMuanMnO1xuaW1wb3J0IHsgd3JhcFBpY2tlciB9IGZyb20gJy4vcGlja2VyLmpzJztcbmltcG9ydCB7IHdyYXBSb3V0ZXJzIH0gZnJvbSAnLi93cmFwX3JvdXRlcnMuanMnO1xuaW1wb3J0IHsgd3JhcEZpYmVycyB9IGZyb20gJy4vYXN5bmMuanMnO1xuaW1wb3J0IHsgd3JhcFN1YnNjcmlwdGlvbiB9IGZyb20gJy4vd3JhcF9zdWJzY3JpcHRpb24nO1xuaW1wb3J0IHsgd3JhcFNlcnZlciB9IGZyb20gJy4vd3JhcF9zZXJ2ZXInO1xuaW1wb3J0IHsgd3JhcFNlc3Npb24gfSBmcm9tICcuL3dyYXBfc2Vzc2lvbic7XG5pbXBvcnQge1xuICB3cmFwRm9yQ291bnRpbmdPYnNlcnZlcnMsXG4gIHdyYXBNdWx0aXBsZXhlcixcbiAgd3JhcE9wbG9nT2JzZXJ2ZURyaXZlcixcbiAgd3JhcFBvbGxpbmdPYnNlcnZlRHJpdmVyXG59IGZyb20gJy4vd3JhcF9vYnNlcnZlcnMnO1xuaW1wb3J0IHsgd3JhcFN0cmluZ2lmeUREUCB9IGZyb20gJy4vd3JhcF9kZHBfc3RyaW5naWZ5JztcbmltcG9ydCB7IHNldExhYmVscyB9IGZyb20gJy4vc2V0X2xhYmVscyc7XG5pbXBvcnQgeyBoaWphY2tEQk9wcyB9IGZyb20gJy4vZGInO1xuXG5sZXQgaW5zdHJ1bWVudGVkID0gZmFsc2U7XG5LYWRpcmEuX3N0YXJ0SW5zdHJ1bWVudGluZyA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICBpZiAoaW5zdHJ1bWVudGVkKSB7XG4gICAgY2FsbGJhY2soKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpbnN0cnVtZW50ZWQgPSB0cnVlO1xuICB3cmFwRmliZXJzKCk7XG4gIHdyYXBTdHJpbmdpZnlERFAoKTtcbiAgd3JhcFdlYkFwcCgpO1xuICB3cmFwRmFzdFJlbmRlcigpO1xuICB3cmFwUGlja2VyKCk7XG4gIHdyYXBGcygpO1xuICB3cmFwUm91dGVycygpO1xuXG4gIE1ldGVvclgub25SZWFkeShmdW5jdGlvbiAoKSB7XG4gICAgLy8gaW5zdHJ1bWVudGluZyBzZXNzaW9uXG4gICAgd3JhcFNlcnZlcihNZXRlb3JYLlNlcnZlci5wcm90b3R5cGUpO1xuICAgIHdyYXBTZXNzaW9uKE1ldGVvclguU2Vzc2lvbi5wcm90b3R5cGUpO1xuICAgIHdyYXBTdWJzY3JpcHRpb24oTWV0ZW9yWC5TdWJzY3JpcHRpb24ucHJvdG90eXBlKTtcblxuICAgIGlmIChNZXRlb3JYLk1vbmdvT3Bsb2dEcml2ZXIpIHtcbiAgICAgIHdyYXBPcGxvZ09ic2VydmVEcml2ZXIoTWV0ZW9yWC5Nb25nb09wbG9nRHJpdmVyLnByb3RvdHlwZSk7XG4gICAgfVxuXG4gICAgaWYgKE1ldGVvclguTW9uZ29Qb2xsaW5nRHJpdmVyKSB7XG4gICAgICB3cmFwUG9sbGluZ09ic2VydmVEcml2ZXIoTWV0ZW9yWC5Nb25nb1BvbGxpbmdEcml2ZXIucHJvdG90eXBlKTtcbiAgICB9XG5cbiAgICBpZiAoTWV0ZW9yWC5NdWx0aXBsZXhlcikge1xuICAgICAgd3JhcE11bHRpcGxleGVyKE1ldGVvclguTXVsdGlwbGV4ZXIucHJvdG90eXBlKTtcbiAgICB9XG5cbiAgICB3cmFwRm9yQ291bnRpbmdPYnNlcnZlcnMoKTtcbiAgICBoaWphY2tEQk9wcygpO1xuXG4gICAgc2V0TGFiZWxzKCk7XG4gICAgY2FsbGJhY2soKTtcbiAgfSk7XG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBSYW5kb20gfSBmcm9tICdtZXRlb3IvcmFuZG9tJztcbmltcG9ydCB7IE1vbmdvLCBNb25nb0ludGVybmFscyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgeyBfIH0gZnJvbSAnbWV0ZW9yL3VuZGVyc2NvcmUnO1xuaW1wb3J0IHtoYXZlQXN5bmNDYWxsYmFjaywgT3B0aW1pemVkQXBwbHl9IGZyb20gJy4uL3V0aWxzJztcblxuXG4vLyBUaGlzIGhpamFjayBpcyBpbXBvcnRhbnQgdG8gbWFrZSBzdXJlLCBjb2xsZWN0aW9ucyBjcmVhdGVkIGJlZm9yZVxuLy8gd2UgaGlqYWNrIGRiT3BzLCBldmVuIGdldHMgdHJhY2tlZC5cbi8vICBNZXRlb3IgZG9lcyBub3Qgc2ltcGx5IGV4cG9zZSBNb25nb0Nvbm5lY3Rpb24gb2JqZWN0IHRvIHRoZSBjbGllbnRcbi8vICBJdCBwaWNrcyBtZXRob2RzIHdoaWNoIGFyZSBuZWNlc3NhcnkgYW5kIG1ha2UgYSBiaW5kZWQgb2JqZWN0IGFuZFxuLy8gIGFzc2lnbmVkIHRvIHRoZSBNb25nby5Db2xsZWN0aW9uXG4vLyAgc28sIGV2ZW4gd2UgdXBkYXRlZCBwcm90b3R5cGUsIHdlIGNhbid0IHRyYWNrIHRob3NlIGNvbGxlY3Rpb25zXG4vLyAgYnV0LCB0aGlzIHdpbGwgZml4IGl0LlxuXG5sZXQgb3JpZ2luYWxPcGVuID0gTW9uZ29JbnRlcm5hbHMuUmVtb3RlQ29sbGVjdGlvbkRyaXZlci5wcm90b3R5cGUub3Blbjtcbk1vbmdvSW50ZXJuYWxzLlJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiBvcGVuIChuYW1lKSB7XG4gIGxldCBzZWxmID0gdGhpcztcbiAgbGV0IHJldCA9IG9yaWdpbmFsT3Blbi5jYWxsKHNlbGYsIG5hbWUpO1xuXG4gIF8uZWFjaChyZXQsIGZ1bmN0aW9uIChmbiwgbSkge1xuICAgIC8vIG1ha2Ugc3VyZSwgaXQncyBpbiB0aGUgYWN0dWFsIG1vbmdvIGNvbm5lY3Rpb24gb2JqZWN0XG4gICAgLy8gbWV0ZW9yaGFja3M6bW9uZ28tY29sbGVjdGlvbi11dGlscyBwYWNrYWdlIGFkZCBzb21lIGFyYml0YXJ5IG1ldGhvZHNcbiAgICAvLyB3aGljaCBkb2VzIG5vdCBleGlzdCBpbiB0aGUgbW9uZ28gY29ubmVjdGlvblxuICAgIGlmIChzZWxmLm1vbmdvW21dKSB7XG4gICAgICByZXRbbV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS51bnNoaWZ0LmNhbGwoYXJndW1lbnRzLCBuYW1lKTtcbiAgICAgICAgcmV0dXJuIE9wdGltaXplZEFwcGx5KHNlbGYubW9uZ28sIHNlbGYubW9uZ29bbV0sIGFyZ3VtZW50cyk7XG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHJldDtcbn07XG5cbi8vIFRPRE86IHRoaXMgc2hvdWxkIGJlIGFkZGVkIHRvIE1ldGVvcnhcbmZ1bmN0aW9uIGdldFN5bmNyb25vdXNDdXJzb3IgKCkge1xuICBjb25zdCBNb25nb0NvbGwgPSB0eXBlb2YgTW9uZ28gIT09ICd1bmRlZmluZWQnID8gTW9uZ28uQ29sbGVjdGlvbiA6IE1ldGVvci5Db2xsZWN0aW9uO1xuICBjb25zdCBjb2xsID0gbmV3IE1vbmdvQ29sbChgX19kdW1teV9jb2xsXyR7UmFuZG9tLmlkKCl9YCk7XG4gIC8vIHdlIG5lZWQgdG8gd2FpdCB1bnRpbCB0aGUgZGIgaXMgY29ubmVjdGVkIHdpdGggbWV0ZW9yLiBmaW5kT25lIGRvZXMgdGhhdFxuICBjb2xsLmZpbmRPbmUoKTtcblxuICBjb25zdCBjdXJzb3IgPSBjb2xsLmZpbmQoKTtcbiAgY3Vyc29yLmZldGNoKCk7XG4gIHJldHVybiBjdXJzb3IuX3N5bmNocm9ub3VzQ3Vyc29yLmNvbnN0cnVjdG9yO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGlqYWNrREJPcHMgKCkge1xuICBsZXQgbW9uZ29Db25uZWN0aW9uUHJvdG8gPSBNZXRlb3JYLk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGU7XG4gIC8vIGZpbmRPbmUgaXMgaGFuZGxlZCBieSBmaW5kIC0gc28gbm8gbmVlZCB0byB0cmFjayBpdFxuICAvLyB1cHNlcnQgaXMgaGFuZGxlcyBieSB1cGRhdGVcbiAgLy8gMi40IHJlcGxhY2VkIF9lbnN1cmVJbmRleCB3aXRoIGNyZWF0ZUluZGV4XG4gIFtcbiAgICAnZmluZCcsICd1cGRhdGUnLCAncmVtb3ZlJywgJ2luc2VydCcsICdfZW5zdXJlSW5kZXgnLCAnX2Ryb3BJbmRleCcsICdjcmVhdGVJbmRleCdcbiAgXS5mb3JFYWNoKGZ1bmN0aW9uIChmdW5jKSB7XG4gICAgbGV0IG9yaWdpbmFsRnVuYyA9IG1vbmdvQ29ubmVjdGlvblByb3RvW2Z1bmNdO1xuXG4gICAgaWYgKCFvcmlnaW5hbEZ1bmMpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBtb25nb0Nvbm5lY3Rpb25Qcm90b1tmdW5jXSA9IGZ1bmN0aW9uIChjb2xsTmFtZSwgc2VsZWN0b3IsIG1vZCwgb3B0aW9ucykge1xuICAgICAgbGV0IHBheWxvYWQgPSB7XG4gICAgICAgIGNvbGw6IGNvbGxOYW1lLFxuICAgICAgICBmdW5jLFxuICAgICAgfTtcblxuICAgICAgaWYgKGZ1bmMgPT09ICdpbnNlcnQnKSB7XG4gICAgICAgIC8vIGFkZCBub3RoaW5nIG1vcmUgdG8gdGhlIHBheWxvYWRcbiAgICAgIH0gZWxzZSBpZiAoZnVuYyA9PT0gJ19lbnN1cmVJbmRleCcgfHwgZnVuYyA9PT0gJ19kcm9wSW5kZXgnIHx8IGZ1bmMgPT09ICdjcmVhdGVJbmRleCcpIHtcbiAgICAgICAgLy8gYWRkIGluZGV4XG4gICAgICAgIHBheWxvYWQuaW5kZXggPSBKU09OLnN0cmluZ2lmeShzZWxlY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKGZ1bmMgPT09ICd1cGRhdGUnICYmIG9wdGlvbnMgJiYgb3B0aW9ucy51cHNlcnQpIHtcbiAgICAgICAgcGF5bG9hZC5mdW5jID0gJ3Vwc2VydCc7XG4gICAgICAgIHBheWxvYWQuc2VsZWN0b3IgPSBKU09OLnN0cmluZ2lmeShzZWxlY3Rvcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBhbGwgdGhlIG90aGVyIGZ1bmN0aW9ucyBoYXZlIHNlbGVjdG9yc1xuICAgICAgICBwYXlsb2FkLnNlbGVjdG9yID0gSlNPTi5zdHJpbmdpZnkoc2VsZWN0b3IpO1xuICAgICAgfVxuXG4gICAgICBsZXQga2FkaXJhSW5mbyA9IEthZGlyYS5fZ2V0SW5mbygpO1xuXG4gICAgICBsZXQgZXZlbnRJZDtcblxuICAgICAgaWYgKGthZGlyYUluZm8pIHtcbiAgICAgICAgZXZlbnRJZCA9IEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2RiJywgcGF5bG9hZCk7XG4gICAgICB9XG5cbiAgICAgIC8vIHRoaXMgY2F1c2UgVjggdG8gYXZvaWQgYW55IHBlcmZvcm1hbmNlIG9wdGltaXphdGlvbnMsIGJ1dCB0aGlzIGlzIG11c3QgdXNlXG4gICAgICAvLyBvdGhlcndpc2UsIGlmIHRoZSBlcnJvciBhZGRzIHRyeSBjYXRjaCBibG9jayBvdXIgbG9ncyBnZXQgbWVzc3kgYW5kIGRpZG4ndCB3b3JrXG4gICAgICAvLyBzZWU6IGlzc3VlICM2XG5cbiAgICAgIGxldCByZXQ7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJldCA9IG9yaWdpbmFsRnVuYy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAvLyBoYW5kbGluZyBmdW5jdGlvbnMgd2hpY2ggY2FuIGJlIHRyaWdnZXJlZCB3aXRoIGFuIGFzeW5jQ2FsbGJhY2tcbiAgICAgICAgbGV0IGVuZE9wdGlvbnMgPSB7fTtcblxuICAgICAgICBpZiAoaGF2ZUFzeW5jQ2FsbGJhY2soYXJndW1lbnRzKSkge1xuICAgICAgICAgIGVuZE9wdGlvbnMuYXN5bmMgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZ1bmMgPT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgLy8gdXBzZXJ0IG9ubHkgcmV0dXJucyBhbiBvYmplY3Qgd2hlbiBjYWxsZWQgYHVwc2VydGAgZGlyZWN0bHlcbiAgICAgICAgICAvLyBvdGhlcndpc2UgaXQgb25seSBhY3QgYW4gdXBkYXRlIGNvbW1hbmRcbiAgICAgICAgICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnVwc2VydCAmJiB0eXBlb2YgcmV0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgZW5kT3B0aW9ucy51cGRhdGVkRG9jcyA9IHJldC5udW1iZXJBZmZlY3RlZDtcbiAgICAgICAgICAgIGVuZE9wdGlvbnMuaW5zZXJ0ZWRJZCA9IHJldC5pbnNlcnRlZElkO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlbmRPcHRpb25zLnVwZGF0ZWREb2NzID0gcmV0O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmdW5jID09PSAncmVtb3ZlJykge1xuICAgICAgICAgIGVuZE9wdGlvbnMucmVtb3ZlZERvY3MgPSByZXQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXZlbnRJZCkge1xuICAgICAgICAgIEthZGlyYS50cmFjZXIuZXZlbnRFbmQoa2FkaXJhSW5mby50cmFjZSwgZXZlbnRJZCwgZW5kT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICAgIGlmIChldmVudElkKSB7XG4gICAgICAgICAgS2FkaXJhLnRyYWNlci5ldmVudEVuZChrYWRpcmFJbmZvLnRyYWNlLCBldmVudElkLCB7ZXJyOiBleC5tZXNzYWdlfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZXg7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXQ7XG4gICAgfTtcbiAgfSk7XG5cbiAgbGV0IGN1cnNvclByb3RvID0gTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGU7XG4gIFsnZm9yRWFjaCcsICdtYXAnLCAnZmV0Y2gnLCAnY291bnQnLCAnb2JzZXJ2ZUNoYW5nZXMnLCAnb2JzZXJ2ZSddLmZvckVhY2goZnVuY3Rpb24gKHR5cGUpIHtcbiAgICBsZXQgb3JpZ2luYWxGdW5jID0gY3Vyc29yUHJvdG9bdHlwZV07XG4gICAgY3Vyc29yUHJvdG9bdHlwZV0gPSBmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgY3Vyc29yRGVzY3JpcHRpb24gPSB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbjtcbiAgICAgIGxldCBwYXlsb2FkID0gT2JqZWN0LmFzc2lnbihPYmplY3QuY3JlYXRlKG51bGwpLCB7XG4gICAgICAgIGNvbGw6IGN1cnNvckRlc2NyaXB0aW9uLmNvbGxlY3Rpb25OYW1lLFxuICAgICAgICBzZWxlY3RvcjogSlNPTi5zdHJpbmdpZnkoY3Vyc29yRGVzY3JpcHRpb24uc2VsZWN0b3IpLFxuICAgICAgICBmdW5jOiB0eXBlLFxuICAgICAgICBjdXJzb3I6IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoY3Vyc29yRGVzY3JpcHRpb24ub3B0aW9ucykge1xuICAgICAgICBsZXQgY3Vyc29yT3B0aW9ucyA9IF8ucGljayhjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zLCBbJ2ZpZWxkcycsICdwcm9qZWN0aW9uJywgJ3NvcnQnLCAnbGltaXQnXSk7XG4gICAgICAgIGZvciAobGV0IGZpZWxkIGluIGN1cnNvck9wdGlvbnMpIHtcbiAgICAgICAgICBsZXQgdmFsdWUgPSBjdXJzb3JPcHRpb25zW2ZpZWxkXTtcbiAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgdmFsdWUgPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBheWxvYWRbZmllbGRdID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgbGV0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8oKTtcbiAgICAgIGxldCBwcmV2aW91c1RyYWNrTmV4dE9iamVjdDtcbiAgICAgIGxldCBldmVudElkO1xuXG4gICAgICBpZiAoa2FkaXJhSW5mbykge1xuICAgICAgICBldmVudElkID0gS2FkaXJhLnRyYWNlci5ldmVudChrYWRpcmFJbmZvLnRyYWNlLCAnZGInLCBwYXlsb2FkKTtcblxuICAgICAgICBwcmV2aW91c1RyYWNrTmV4dE9iamVjdCA9IGthZGlyYUluZm8udHJhY2tOZXh0T2JqZWN0O1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2ZvckVhY2gnIHx8IHR5cGUgPT09ICdtYXAnKSB7XG4gICAgICAgICAga2FkaXJhSW5mby50cmFja05leHRPYmplY3QgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXQgPSBvcmlnaW5hbEZ1bmMuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICBsZXQgZW5kRGF0YSA9IHt9O1xuXG4gICAgICAgIGlmICh0eXBlID09PSAnb2JzZXJ2ZUNoYW5nZXMnIHx8IHR5cGUgPT09ICdvYnNlcnZlJykge1xuICAgICAgICAgIGxldCBvYnNlcnZlckRyaXZlcjtcbiAgICAgICAgICBlbmREYXRhLm9wbG9nID0gZmFsc2U7XG4gICAgICAgICAgLy8gZ2V0IGRhdGEgd3JpdHRlbiBieSB0aGUgbXVsdGlwbGV4ZXJcbiAgICAgICAgICBlbmREYXRhLndhc011bHRpcGxleGVyUmVhZHkgPSByZXQuX3dhc011bHRpcGxleGVyUmVhZHk7XG4gICAgICAgICAgZW5kRGF0YS5xdWV1ZUxlbmd0aCA9IHJldC5fcXVldWVMZW5ndGg7XG4gICAgICAgICAgZW5kRGF0YS5lbGFwc2VkUG9sbGluZ1RpbWUgPSByZXQuX2VsYXBzZWRQb2xsaW5nVGltZTtcblxuICAgICAgICAgIGlmIChyZXQuX211bHRpcGxleGVyKSB7XG4gICAgICAgICAgICAvLyBvbGRlciBtZXRlb3IgdmVyc2lvbnMgZG9uZSBub3QgaGF2ZSBhbiBfbXVsdGlwbGV4ZXIgdmFsdWVcbiAgICAgICAgICAgIG9ic2VydmVyRHJpdmVyID0gcmV0Ll9tdWx0aXBsZXhlci5fb2JzZXJ2ZURyaXZlcjtcbiAgICAgICAgICAgIGlmIChvYnNlcnZlckRyaXZlcikge1xuICAgICAgICAgICAgICBvYnNlcnZlckRyaXZlciA9IHJldC5fbXVsdGlwbGV4ZXIuX29ic2VydmVEcml2ZXI7XG4gICAgICAgICAgICAgIGxldCBvYnNlcnZlckRyaXZlckNsYXNzID0gb2JzZXJ2ZXJEcml2ZXIuY29uc3RydWN0b3I7XG4gICAgICAgICAgICAgIGVuZERhdGEub3Bsb2cgPSB0eXBlb2Ygb2JzZXJ2ZXJEcml2ZXJDbGFzcy5jdXJzb3JTdXBwb3J0ZWQgPT09ICdmdW5jdGlvbic7XG5cbiAgICAgICAgICAgICAgbGV0IHNpemUgPSAwO1xuICAgICAgICAgICAgICByZXQuX211bHRpcGxleGVyLl9jYWNoZS5kb2NzLmZvckVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHNpemUrKztcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIGVuZERhdGEubm9PZkNhY2hlZERvY3MgPSBzaXplO1xuXG4gICAgICAgICAgICAgIC8vIGlmIG11bHRpcGxleGVyV2FzTm90UmVhZHksIHdlIG5lZWQgdG8gZ2V0IHRoZSB0aW1lIHNwZW5kIGZvciB0aGUgcG9sbGluZ1xuICAgICAgICAgICAgICBpZiAoIXJldC5fd2FzTXVsdGlwbGV4ZXJSZWFkeSkge1xuICAgICAgICAgICAgICAgIGVuZERhdGEuaW5pdGlhbFBvbGxpbmdUaW1lID0gb2JzZXJ2ZXJEcml2ZXIuX2xhc3RQb2xsVGltZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZW5kRGF0YS5vcGxvZykge1xuICAgICAgICAgICAgLy8gbGV0J3MgdHJ5IHRvIGZpbmQgdGhlIHJlYXNvblxuICAgICAgICAgICAgbGV0IHJlYXNvbkluZm8gPSBLYWRpcmEuY2hlY2tXaHlOb09wbG9nKGN1cnNvckRlc2NyaXB0aW9uLCBvYnNlcnZlckRyaXZlcik7XG4gICAgICAgICAgICBlbmREYXRhLm5vT3Bsb2dDb2RlID0gcmVhc29uSW5mby5jb2RlO1xuICAgICAgICAgICAgZW5kRGF0YS5ub09wbG9nUmVhc29uID0gcmVhc29uSW5mby5yZWFzb247XG4gICAgICAgICAgICBlbmREYXRhLm5vT3Bsb2dTb2x1dGlvbiA9IHJlYXNvbkluZm8uc29sdXRpb247XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdmZXRjaCcgfHwgdHlwZSA9PT0gJ21hcCcpIHtcbiAgICAgICAgICAvLyBmb3Igb3RoZXIgY3Vyc29yIG9wZXJhdGlvblxuXG4gICAgICAgICAgZW5kRGF0YS5kb2NzRmV0Y2hlZCA9IHJldC5sZW5ndGg7XG5cbiAgICAgICAgICBpZiAodHlwZSA9PT0gJ2ZldGNoJykge1xuICAgICAgICAgICAgbGV0IGNvbGwgPSBjdXJzb3JEZXNjcmlwdGlvbi5jb2xsZWN0aW9uTmFtZTtcbiAgICAgICAgICAgIGxldCBxdWVyeSA9IGN1cnNvckRlc2NyaXB0aW9uLnNlbGVjdG9yO1xuICAgICAgICAgICAgbGV0IG9wdHMgPSBjdXJzb3JEZXNjcmlwdGlvbi5vcHRpb25zO1xuICAgICAgICAgICAgbGV0IGRvY1NpemUgPSBLYWRpcmEuZG9jU3pDYWNoZS5nZXRTaXplKGNvbGwsIHF1ZXJ5LCBvcHRzLCByZXQpICogcmV0Lmxlbmd0aDtcbiAgICAgICAgICAgIGVuZERhdGEuZG9jU2l6ZSA9IGRvY1NpemU7XG5cbiAgICAgICAgICAgIGlmIChrYWRpcmFJbmZvKSB7XG4gICAgICAgICAgICAgIGlmIChrYWRpcmFJbmZvLnRyYWNlLnR5cGUgPT09ICdtZXRob2QnKSB7XG4gICAgICAgICAgICAgICAgS2FkaXJhLm1vZGVscy5tZXRob2RzLnRyYWNrRG9jU2l6ZShrYWRpcmFJbmZvLnRyYWNlLm5hbWUsIGRvY1NpemUpO1xuICAgICAgICAgICAgICB9IGVsc2UgaWYgKGthZGlyYUluZm8udHJhY2UudHlwZSA9PT0gJ3N1YicpIHtcbiAgICAgICAgICAgICAgICBLYWRpcmEubW9kZWxzLnB1YnN1Yi50cmFja0RvY1NpemUoa2FkaXJhSW5mby50cmFjZS5uYW1lLCAnY3Vyc29yRmV0Y2hlcycsIGRvY1NpemUpO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAga2FkaXJhSW5mby50cmFja05leHRPYmplY3QgPSBwcmV2aW91c1RyYWNrTmV4dE9iamVjdDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIC8vIEZldGNoIHdpdGggbm8ga2FkaXJhIGluZm8gYXJlIHRyYWNrZWQgYXMgZnJvbSBhIG51bGwgbWV0aG9kXG4gICAgICAgICAgICAgIEthZGlyYS5tb2RlbHMubWV0aG9kcy50cmFja0RvY1NpemUoJzxub3QtYS1tZXRob2Qtb3ItYS1wdWI+JywgZG9jU2l6ZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRPRE86IEFkZCBkb2Mgc2l6ZSB0cmFja2luZyB0byBgbWFwYCBhcyB3ZWxsLlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChldmVudElkKSB7XG4gICAgICAgICAgS2FkaXJhLnRyYWNlci5ldmVudEVuZChrYWRpcmFJbmZvLnRyYWNlLCBldmVudElkLCBlbmREYXRhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgICAgaWYgKGV2ZW50SWQpIHtcbiAgICAgICAgICBLYWRpcmEudHJhY2VyLmV2ZW50RW5kKGthZGlyYUluZm8udHJhY2UsIGV2ZW50SWQsIHtlcnI6IGV4Lm1lc3NhZ2V9KTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBleDtcbiAgICAgIH1cbiAgICB9O1xuICB9KTtcblxuICBjb25zdCBTeW5jcm9ub3VzQ3Vyc29yID0gZ2V0U3luY3Jvbm91c0N1cnNvcigpO1xuICBsZXQgb3JpZ05leHRPYmplY3QgPSBTeW5jcm9ub3VzQ3Vyc29yLnByb3RvdHlwZS5fbmV4dE9iamVjdDtcbiAgU3luY3Jvbm91c0N1cnNvci5wcm90b3R5cGUuX25leHRPYmplY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8oKTtcbiAgICBsZXQgc2hvdWxkVHJhY2sgPSBrYWRpcmFJbmZvICYmIGthZGlyYUluZm8udHJhY2tOZXh0T2JqZWN0O1xuICAgIGxldCBldmVudDtcbiAgICBpZiAoc2hvdWxkVHJhY2sgKSB7XG4gICAgICBldmVudCA9IEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2RiJywge1xuICAgICAgICBmdW5jOiAnX25leHRPYmplY3QnLFxuICAgICAgICBjb2xsOiB0aGlzLl9jdXJzb3JEZXNjcmlwdGlvbi5jb2xsZWN0aW9uTmFtZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdCA9IG9yaWdOZXh0T2JqZWN0LmNhbGwodGhpcyk7XG5cbiAgICBpZiAoc2hvdWxkVHJhY2spIHtcbiAgICAgIEthZGlyYS50cmFjZXIuZXZlbnRFbmQoa2FkaXJhSW5mby50cmFjZSwgZXZlbnQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgcHJlZmVyLXJlc3QtcGFyYW1zICovXG5pbXBvcnQgeyBoYXZlQXN5bmNDYWxsYmFjayB9IGZyb20gJy4uL3V0aWxzJztcblxuaWYgKFBhY2thZ2VbJ2h0dHAnXSkge1xuICBjb25zdCBIVFRQID0gUGFja2FnZVsnaHR0cCddLkhUVFA7XG4gIGNvbnN0IGxpYnJhcnkgPSAnbWV0ZW9yL2h0dHAnO1xuICBjb25zdCBvcmlnaW5hbENhbGwgPSBIVFRQLmNhbGw7XG5cbiAgSFRUUC5jYWxsID0gZnVuY3Rpb24gKG1ldGhvZCwgdXJsKSB7XG4gICAgY29uc3QgdHJhY2VyID0gS2FkaXJhLnRyYWNlcjtcbiAgICBjb25zdCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCk7XG5cbiAgICBjb25zdCBldmVudCA9IGthZGlyYUluZm8gPyB0cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2h0dHAnLCB7XG4gICAgICBtZXRob2QsXG4gICAgICB1cmwsXG4gICAgICBsaWJyYXJ5LFxuICAgIH0pIDogbnVsbDtcblxuICAgIGlmICghZXZlbnQpIHtcbiAgICAgIHJldHVybiBvcmlnaW5hbENhbGwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBvcmlnaW5hbENhbGwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgLy8gSWYgdGhlIHVzZXIgc3VwcGxpZWQgYW4gYXN5bmNDYWxsYmFjayxcbiAgICAgIC8vIHdlIGRvbid0IGhhdmUgYSByZXNwb25zZSBvYmplY3QgYW5kIGl0IGhhbmRsZWQgYXN5bmNocm9ub3VzbHkuXG4gICAgICAvLyBXZSBuZWVkIHRvIHRyYWNrIGl0IGRvd24gdG8gcHJldmVudCBpc3N1ZXMgbGlrZTogIzNcbiAgICAgIGNvbnN0IGVuZE9wdGlvbnMgPSBoYXZlQXN5bmNDYWxsYmFjayhhcmd1bWVudHMpID8geyBhc3luYzogdHJ1ZSB9IDogeyBzdGF0dXNDb2RlOiByZXNwb25zZS5zdGF0dXNDb2RlIH07XG5cbiAgICAgIHRyYWNlci5ldmVudEVuZChrYWRpcmFJbmZvLnRyYWNlLCBldmVudCwgZW5kT3B0aW9ucyk7XG5cbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgdHJhY2VyLmV2ZW50RW5kKGthZGlyYUluZm8udHJhY2UsIGV2ZW50LCB7IGVycjogZXgubWVzc2FnZSB9KTtcblxuICAgICAgdGhyb3cgZXg7XG4gICAgfVxuICB9O1xufVxuXG5pZiAoUGFja2FnZVsnZmV0Y2gnXSkge1xuICBjb25zdCBsaWJyYXJ5ID0gJ21ldGVvci9mZXRjaCc7XG4gIGNvbnN0IG9yaWdpbmFsQ2FsbCA9IFBhY2thZ2VbJ2ZldGNoJ10uZmV0Y2g7XG4gIGNvbnN0IFJlcXVlc3QgPSBQYWNrYWdlWydmZXRjaCddLlJlcXVlc3Q7XG5cbiAgUGFja2FnZVsnZmV0Y2gnXS5mZXRjaCA9IGZ1bmN0aW9uICh1cmwsIG9wdHMpIHtcbiAgICBjb25zdCByZXF1ZXN0ID0gbmV3IFJlcXVlc3QodXJsLCBvcHRzKTtcbiAgICBjb25zdCB0cmFjZXIgPSBLYWRpcmEudHJhY2VyO1xuICAgIGNvbnN0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8oKTtcblxuICAgIGNvbnN0IGV2ZW50ID0ga2FkaXJhSW5mbyA/IHRyYWNlci5ldmVudChrYWRpcmFJbmZvLnRyYWNlLCAnaHR0cCcsIHtcbiAgICAgIG1ldGhvZDogcmVxdWVzdC5tZXRob2QsXG4gICAgICB1cmw6IHJlcXVlc3QudXJsLFxuICAgICAgbGlicmFyeSxcbiAgICB9KSA6IG51bGw7XG5cbiAgICBpZiAoIWV2ZW50KSB7XG4gICAgICByZXR1cm4gb3JpZ2luYWxDYWxsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gb3JpZ2luYWxDYWxsLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgIHJlc3BvbnNlXG4gICAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgICB0cmFjZXIuZXZlbnRFbmQoa2FkaXJhSW5mby50cmFjZSwgZXZlbnQsIHsgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXgpID0+IHtcbiAgICAgICAgICB0cmFjZXIuZXZlbnRFbmQoa2FkaXJhSW5mby50cmFjZSwgZXZlbnQsIHsgZXJyOiBleC5tZXNzYWdlIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICB0cmFjZXIuZXZlbnRFbmQoa2FkaXJhSW5mby50cmFjZSwgZXZlbnQsIHsgZXJyOiBleC5tZXNzYWdlIH0pO1xuXG4gICAgICB0aHJvdyBleDtcbiAgICB9XG4gIH07XG59XG4iLCJpbXBvcnQgeyBwaWNrIH0gZnJvbSAnLi4vdXRpbHMnO1xuXG5jb25zdCBDQVBUVVJFRF9PUFRJT05TID0gWydmcm9tJywgJ3RvJywgJ2NjJywgJ2JjYycsICdyZXBseVRvJywgJ21lc3NhZ2VJZCddO1xuXG5jb25zdCBnZXRXcmFwcGVyID0gKG9yaWdpbmFsU2VuZCwgZnVuYykgPT4gZnVuY3Rpb24gd3JhcHBlciAob3B0aW9ucykge1xuICBsZXQgZXZlbnRJZDtcbiAgY29uc3Qga2FkaXJhSW5mbyA9IEthZGlyYS5fZ2V0SW5mbygpO1xuXG4gIGlmIChrYWRpcmFJbmZvKSB7XG4gICAgY29uc3QgZGF0YSA9IHBpY2sob3B0aW9ucywgQ0FQVFVSRURfT1BUSU9OUyk7XG4gICAgZGF0YS5mdW5jID0gZnVuYztcblxuICAgIGV2ZW50SWQgPSBLYWRpcmEudHJhY2VyLmV2ZW50KGthZGlyYUluZm8udHJhY2UsICdlbWFpbCcsIGRhdGEpO1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCByZXQgPSBvcmlnaW5hbFNlbmQuY2FsbCh0aGlzLCBvcHRpb25zKTtcbiAgICBpZiAoZXZlbnRJZCkge1xuICAgICAgS2FkaXJhLnRyYWNlci5ldmVudEVuZChrYWRpcmFJbmZvLnRyYWNlLCBldmVudElkKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBpZiAoZXZlbnRJZCkge1xuICAgICAgS2FkaXJhLnRyYWNlci5ldmVudEVuZChrYWRpcmFJbmZvLnRyYWNlLCBldmVudElkLCB7ZXJyOiBleC5tZXNzYWdlfSk7XG4gICAgfVxuICAgIHRocm93IGV4O1xuICB9XG59O1xuXG5pZiAoUGFja2FnZVsnZW1haWwnXSkge1xuICBjb25zdCB7IEVtYWlsIH0gPSBQYWNrYWdlWydlbWFpbCddO1xuXG4gIEVtYWlsLnNlbmQgPSBnZXRXcmFwcGVyKEVtYWlsLnNlbmQsICdlbWFpbCcpO1xuXG4gIGlmIChFbWFpbC5zZW5kQXN5bmMpIHtcbiAgICBFbWFpbC5zZW5kQXN5bmMgPSBnZXRXcmFwcGVyKEVtYWlsLnNlbmRBc3luYywgJ2VtYWlsQXN5bmMnKTtcbiAgfVxufVxuIiwibGV0IEZpYmVycyA9IE5wbS5yZXF1aXJlKCdmaWJlcnMnKTtcbmxldCBFdmVudFN5bWJvbCA9IFN5bWJvbCgnTW9udGlFdmVudFN5bWJvbCcpO1xubGV0IFN0YXJ0VHJhY2tlZCA9IFN5bWJvbCgnTW9udGlTdGFydFRyYWNrZWQnKTtcblxubGV0IGFjdGl2ZUZpYmVycyA9IDA7XG5sZXQgd3JhcHBlZCA9IGZhbHNlO1xuXG5mdW5jdGlvbiBlbmRBc3luY0V2ZW50IChmaWJlcikge1xuICBpZiAoIWZpYmVyW0V2ZW50U3ltYm9sXSkgcmV0dXJuO1xuXG4gIGNvbnN0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8oZmliZXIpO1xuXG4gIGlmICgha2FkaXJhSW5mbykgcmV0dXJuO1xuXG4gIEthZGlyYS50cmFjZXIuZXZlbnRFbmQoa2FkaXJhSW5mby50cmFjZSwgZmliZXJbRXZlbnRTeW1ib2xdKTtcblxuICBmaWJlcltFdmVudFN5bWJvbF0gPSBudWxsO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcEZpYmVycyAoKSB7XG4gIGlmICh3cmFwcGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHdyYXBwZWQgPSB0cnVlO1xuXG4gIGxldCBvcmlnaW5hbFlpZWxkID0gRmliZXJzLnlpZWxkO1xuICBGaWJlcnMueWllbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IGthZGlyYUluZm8gPSBLYWRpcmEuX2dldEluZm8oKTtcbiAgICBpZiAoa2FkaXJhSW5mbykge1xuICAgICAgbGV0IGV2ZW50SWQgPSBLYWRpcmEudHJhY2VyLmV2ZW50KGthZGlyYUluZm8udHJhY2UsICdhc3luYycpO1xuICAgICAgaWYgKGV2ZW50SWQpIHtcbiAgICAgICAgLy8gVGhlIGV2ZW50IHVuaXF1ZSB0byB0aGlzIGZpYmVyXG4gICAgICAgIC8vIFVzaW5nIGEgc3ltYm9sIHNpbmNlIE1ldGVvciBkb2Vzbid0IGNvcHkgc3ltYm9scyB0byBuZXcgZmliZXJzIGNyZWF0ZWRcbiAgICAgICAgLy8gZm9yIHByb21pc2VzLiBUaGlzIGlzIG5lZWRlZCBzbyB0aGUgY29ycmVjdCBldmVudCBpcyBlbmRlZCB3aGVuIGEgZmliZXIgcnVucyBhZnRlciBiZWluZyB5aWVsZGVkLlxuICAgICAgICBGaWJlcnMuY3VycmVudFtFdmVudFN5bWJvbF0gPSBldmVudElkO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvcmlnaW5hbFlpZWxkKCk7XG4gIH07XG5cbiAgbGV0IG9yaWdpbmFsUnVuID0gRmliZXJzLnByb3RvdHlwZS5ydW47XG4gIGxldCBvcmlnaW5hbFRocm93SW50byA9IEZpYmVycy5wcm90b3R5cGUudGhyb3dJbnRvO1xuXG4gIGZ1bmN0aW9uIGVuc3VyZUZpYmVyQ291bnRlZCAoZmliZXIpIHtcbiAgICAvLyBJZiBmaWJlci5zdGFydGVkIGlzIHRydWUsIGFuZCBTdGFydFRyYWNrZWQgaXMgZmFsc2VcbiAgICAvLyB0aGVuIHRoZSBmaWJlciB3YXMgcHJvYmFibHkgaW5pdGlhbGx5IHJhbiBiZWZvcmUgd2Ugd3JhcHBlZCBGaWJlcnMucnVuXG4gICAgaWYgKCFmaWJlci5zdGFydGVkIHx8ICFmaWJlcltTdGFydFRyYWNrZWRdKSB7XG4gICAgICBhY3RpdmVGaWJlcnMgKz0gMTtcbiAgICAgIGZpYmVyW1N0YXJ0VHJhY2tlZF0gPSB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIEZpYmVycy5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHZhbCkge1xuICAgIGVuc3VyZUZpYmVyQ291bnRlZCh0aGlzKTtcblxuICAgIGlmICh0aGlzW0V2ZW50U3ltYm9sXSkge1xuICAgICAgZW5kQXN5bmNFdmVudCh0aGlzKTtcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9fa2FkaXJhSW5mbyAmJiBGaWJlcnMuY3VycmVudCAmJiBGaWJlcnMuY3VycmVudC5fX2thZGlyYUluZm8pIHtcbiAgICAgIC8vIENvcHkga2FkaXJhSW5mbyB3aGVuIHBhY2thZ2VzIG9yIHVzZXIgY29kZSBjcmVhdGVzIGEgbmV3IGZpYmVyXG4gICAgICAvLyBEb25lIGJ5IG1hbnkgYXBwcyBhbmQgcGFja2FnZXMgaW4gY29ubmVjdCBtaWRkbGV3YXJlIHNpbmNlIG9sZGVyXG4gICAgICAvLyB2ZXJzaW9ucyBvZiBNZXRlb3IgZGlkIG5vdCBkbyBpdCBhdXRvbWF0aWNhbGx5XG4gICAgICB0aGlzLl9fa2FkaXJhSW5mbyA9IEZpYmVycy5jdXJyZW50Ll9fa2FkaXJhSW5mbztcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBvcmlnaW5hbFJ1bi5jYWxsKHRoaXMsIHZhbCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgIGFjdGl2ZUZpYmVycyAtPSAxO1xuICAgICAgICB0aGlzW1N0YXJ0VHJhY2tlZF0gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIEZpYmVycy5wcm90b3R5cGUudGhyb3dJbnRvID0gZnVuY3Rpb24gKHZhbCkge1xuICAgIGVuc3VyZUZpYmVyQ291bnRlZCh0aGlzKTtcbiAgICBlbmRBc3luY0V2ZW50KHRoaXMpO1xuXG4gICAgbGV0IHJlc3VsdDtcblxuICAgIHRyeSB7XG4gICAgICByZXN1bHQgPSBvcmlnaW5hbFRocm93SW50by5jYWxsKHRoaXMsIHZhbCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmICghdGhpcy5zdGFydGVkKSB7XG4gICAgICAgIGFjdGl2ZUZpYmVycyAtPSAxO1xuICAgICAgICB0aGlzW1N0YXJ0VHJhY2tlZF0gPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xufVxuXG5sZXQgYWN0aXZlRmliZXJUb3RhbCA9IDA7XG5sZXQgYWN0aXZlRmliZXJDb3VudCA9IDA7XG5sZXQgcHJldmlvdXNUb3RhbENyZWF0ZWQgPSAwO1xuXG5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gIGFjdGl2ZUZpYmVyVG90YWwgKz0gYWN0aXZlRmliZXJzO1xuICBhY3RpdmVGaWJlckNvdW50ICs9IDE7XG59LCAxMDAwKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZpYmVyTWV0cmljcyAoKSB7XG4gIHJldHVybiB7XG4gICAgY3JlYXRlZDogRmliZXJzLmZpYmVyc0NyZWF0ZWQgLSBwcmV2aW91c1RvdGFsQ3JlYXRlZCxcbiAgICBhY3RpdmU6IGFjdGl2ZUZpYmVyVG90YWwgLyBhY3RpdmVGaWJlckNvdW50LFxuICAgIHBvb2xTaXplOiBGaWJlcnMucG9vbFNpemVcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0RmliZXJNZXRyaWNzICgpIHtcbiAgYWN0aXZlRmliZXJUb3RhbCA9IDA7XG4gIGFjdGl2ZUZpYmVyQ291bnQgPSAwO1xuICBwcmV2aW91c1RvdGFsQ3JlYXRlZCA9IEZpYmVycy5maWJlcnNDcmVhdGVkO1xufVxuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5pbXBvcnQgeyBDcmVhdGVVc2VyU3RhY2sgfSBmcm9tICcuLi91dGlscyc7XG5cbmV4cG9ydCBjb25zdCBNZXRlb3JEZWJ1Z0lnbm9yZSA9IFN5bWJvbCgnTW9udGlNZXRlb3JEZWJ1Z0lnbm9yZScpO1xuXG5leHBvcnQgZnVuY3Rpb24gVHJhY2tVbmNhdWdodEV4Y2VwdGlvbnMgKCkge1xuICBwcm9jZXNzLm9uKCd1bmNhdWdodEV4Y2VwdGlvbicsIGZ1bmN0aW9uIChlcnIpIHtcbiAgICBpZiAoZXJyID09PSB1bmRlZmluZWQgfHwgZXJyID09PSBudWxsKSB7XG4gICAgICBsZXQgdHlwZSA9IGVyciA9PT0gbnVsbCA/ICdudWxsJyA6ICd1bmRlZmluZWQnO1xuICAgICAgZXJyID0gbmV3IEVycm9yKGB1bmNhdWdodCBleGNlcHRpb246ICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgdGhyb3dFcnJvcihlcnIpO1xuICAgIH0sIDEwMDAgKiAxMCk7XG5cbiAgICAvLyBza2lwIGVycm9ycyB3aXRoIGBfc2tpcEthZGlyYWAgZmxhZ1xuICAgIGlmIChlcnIuX3NraXBLYWRpcmEpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBsZXQgdGhlIHNlcnZlciBjcmFzaCBub3JtYWxseSBpZiBlcnJvciB0cmFja2luZyBpcyBkaXNhYmxlZFxuICAgIGlmICghS2FkaXJhLm9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZykge1xuICAgICAgcHJpbnRFcnJvckFuZEtpbGwoZXJyKTtcbiAgICB9XG5cbiAgICAvLyBsb29raW5nIGZvciBhbHJlYWR5IHRyYWNrZWQgZXJyb3JzIGFuZCB0aHJvdyB0aGVtIGltbWVkaWF0ZWx5XG4gICAgLy8gdGhyb3cgZXJyb3IgaW1tZWRpYXRlbHkgaWYga2FkaXJhIGlzIG5vdCByZWFkeVxuICAgIGlmIChlcnIuX3RyYWNrZWQgfHwgIUthZGlyYS5jb25uZWN0ZWQpIHtcbiAgICAgIHByaW50RXJyb3JBbmRLaWxsKGVycik7XG4gICAgfVxuXG4gICAgbGV0IHRyYWNlID0gZ2V0VHJhY2UoZXJyLCAnc2VydmVyLWNyYXNoJywgJ3VuY2F1Z2h0RXhjZXB0aW9uJyk7XG4gICAgS2FkaXJhLm1vZGVscy5lcnJvci50cmFja0Vycm9yKGVyciwgdHJhY2UpO1xuICAgIEthZGlyYS5fc2VuZFBheWxvYWQoZnVuY3Rpb24gKCkge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHRocm93RXJyb3IoZXJyKTtcbiAgICB9KTtcblxuXG4gICAgZnVuY3Rpb24gdGhyb3dFcnJvciAoX2Vycikge1xuICAgICAgLy8gc29tZXRpbWVzIGVycm9yIGNhbWUgYmFjayBmcm9tIGEgZmliZXIuXG4gICAgICAvLyBCdXQgd2UgZG9uJ3QgZmliZXJzIHRvIHRyYWNrIHRoYXQgZXJyb3IgZm9yIHVzXG4gICAgICAvLyBUaGF0J3Mgd2h5IHdlIHRocm93IHRoZSBlcnJvciBvbiB0aGUgbmV4dFRpY2tcbiAgICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3ZSBuZWVkIHRvIG1hcmsgdGhpcyBlcnJvciB3aGVyZSB3ZSByZWFsbHkgbmVlZCB0byB0aHJvd1xuICAgICAgICBfZXJyLl90cmFja2VkID0gdHJ1ZTtcbiAgICAgICAgcHJpbnRFcnJvckFuZEtpbGwoX2Vycik7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHByaW50RXJyb3JBbmRLaWxsIChlcnIpIHtcbiAgICAvLyBzaW5jZSB3ZSBhcmUgY2FwdHVyaW5nIGVycm9yLCB3ZSBhcmUgYWxzbyBvbiB0aGUgZXJyb3IgbWVzc2FnZS5cbiAgICAvLyBzbyBkZXZlbG9wZXJzIHRoaW5rIHdlIGFyZSBhbHNvIHJlcG9uc2libGUgZm9yIHRoZSBlcnJvci5cbiAgICAvLyBCdXQgd2UgYXJlIG5vdC4gVGhpcyB3aWxsIGZpeCB0aGF0LlxuICAgIGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTtcbiAgICBwcm9jZXNzLmV4aXQoNyk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyAoKSB7XG4gIHByb2Nlc3Mub24oJ3VuaGFuZGxlZFJlamVjdGlvbicsIGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAvLyBza2lwIGVycm9ycyB3aXRoIGBfc2tpcEthZGlyYWAgZmxhZ1xuICAgIGlmIChcbiAgICAgIHJlYXNvbiAmJlxuICAgICAgcmVhc29uLl9za2lwS2FkaXJhIHx8XG4gICAgICAhS2FkaXJhLm9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZ1xuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChyZWFzb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmVhc29uID0gbmV3IEVycm9yKCd1bmhhbmRsZWRSZWplY3Rpb246IHVuZGVmaW5lZCcpO1xuICAgIH1cblxuICAgIGxldCB0cmFjZSA9IGdldFRyYWNlKHJlYXNvbiwgJ3NlcnZlci1pbnRlcm5hbCcsICd1bmhhbmRsZWRSZWplY3Rpb24nKTtcbiAgICBLYWRpcmEubW9kZWxzLmVycm9yLnRyYWNrRXJyb3IocmVhc29uLCB0cmFjZSk7XG5cbiAgICAvLyBUT0RPOiB3ZSBzaG91bGQgcmVzcGVjdCB0aGUgLS11bmhhbmRsZWQtcmVqZWN0aW9ucyBvcHRpb25cbiAgICAvLyBtZXNzYWdlIHRha2VuIGZyb21cbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvYmxvYi9mNDc5N2ZmMWVmNzMwNDY1OWQ3NDdkMTgxZWMxZTdhZmFjNDA4ZDUwL2xpYi9pbnRlcm5hbC9wcm9jZXNzL3Byb21pc2VzLmpzI0wyNDMtTDI0OFxuICAgIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgJ1RoaXMgZXJyb3Igb3JpZ2luYXRlZCBlaXRoZXIgYnkgJyArXG4gICAgICAndGhyb3dpbmcgaW5zaWRlIG9mIGFuIGFzeW5jIGZ1bmN0aW9uIHdpdGhvdXQgYSBjYXRjaCBibG9jaywgJyArXG4gICAgICAnb3IgYnkgcmVqZWN0aW5nIGEgcHJvbWlzZSB3aGljaCB3YXMgbm90IGhhbmRsZWQgd2l0aCAuY2F0Y2goKS4nICtcbiAgICAgICcgVGhlIHByb21pc2UgcmVqZWN0ZWQgd2l0aCB0aGUgcmVhc29uOiAnO1xuXG4gICAgLy8gV2UgY291bGQgZW1pdCBhIHdhcm5pbmcgaW5zdGVhZCBsaWtlIE5vZGUgZG9lcyBpbnRlcm5hbGx5XG4gICAgLy8gYnV0IGl0IHJlcXVpcmVzIE5vZGUgOCBvciBuZXdlclxuICAgIGNvbnNvbGUud2FybihtZXNzYWdlKTtcbiAgICBjb25zb2xlLmVycm9yKHJlYXNvbiAmJiByZWFzb24uc3RhY2sgPyByZWFzb24uc3RhY2sgOiByZWFzb24pO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRyYWNrTWV0ZW9yRGVidWcgKCkge1xuICBsZXQgb3JpZ2luYWxNZXRlb3JEZWJ1ZyA9IE1ldGVvci5fZGVidWc7XG4gIE1ldGVvci5fZGVidWcgPSBmdW5jdGlvbiAobWVzc2FnZSwgc3RhY2spIHtcbiAgICAvLyBTb21ldGltZXMgTWV0ZW9yIGNhbGxzIE1ldGVvci5fZGVidWcgd2l0aCBubyBhcmd1bWVudHNcbiAgICAvLyB0byBsb2cgYW4gZW1wdHkgbGluZVxuICAgIGNvbnN0IGlzQXJncyA9IG1lc3NhZ2UgIT09IHVuZGVmaW5lZCB8fCBzdGFjayAhPT0gdW5kZWZpbmVkO1xuXG4gICAgLy8gV2UndmUgY2hhbmdlZCBgc3RhY2tgIGludG8gYW4gb2JqZWN0IGF0IG1ldGhvZCBhbmQgc3ViIGhhbmRsZXJzIHNvIHdlIGNhblxuICAgIC8vIGRldGVjdCB0aGUgZXJyb3IgaGVyZS4gVGhlc2UgZXJyb3JzIGFyZSBhbHJlYWR5IHRyYWNrZWQgc28gZG9uJ3QgdHJhY2sgdGhlbSBhZ2Fpbi5cbiAgICBsZXQgYWxyZWFkeVRyYWNrZWQgPSBmYWxzZTtcblxuICAgIC8vIFNvbWUgTWV0ZW9yIHZlcnNpb25zIHBhc3MgdGhlIGVycm9yLCBhbmQgb3RoZXIgdmVyc2lvbnMgcGFzcyB0aGUgZXJyb3Igc3RhY2tcbiAgICAvLyBSZXN0b3JlIHNvIG9yaWdpb25hbE1ldGVvckRlYnVnIHNob3dzIHRoZSBzdGFjayBhcyBhIHN0cmluZyBpbnN0ZWFkIGFzIGFuIG9iamVjdFxuICAgIGlmIChzdGFjayAmJiBzdGFja1tNZXRlb3JEZWJ1Z0lnbm9yZV0pIHtcbiAgICAgIGFscmVhZHlUcmFja2VkID0gdHJ1ZTtcbiAgICAgIGFyZ3VtZW50c1sxXSA9IHN0YWNrLnN0YWNrO1xuICAgIH0gZWxzZSBpZiAoc3RhY2sgJiYgc3RhY2suc3RhY2sgJiYgc3RhY2suc3RhY2tbTWV0ZW9yRGVidWdJZ25vcmVdKSB7XG4gICAgICBhbHJlYWR5VHJhY2tlZCA9IHRydWU7XG4gICAgICBhcmd1bWVudHNbMV0gPSBzdGFjay5zdGFjay5zdGFjaztcbiAgICB9XG5cbiAgICAvLyBvbmx5IHNlbmQgdG8gdGhlIHNlcnZlciBpZiBjb25uZWN0ZWQgdG8ga2FkaXJhXG4gICAgaWYgKFxuICAgICAgS2FkaXJhLm9wdGlvbnMuZW5hYmxlRXJyb3JUcmFja2luZyAmJlxuICAgICAgaXNBcmdzICYmXG4gICAgICAhYWxyZWFkeVRyYWNrZWQgJiZcbiAgICAgIEthZGlyYS5jb25uZWN0ZWRcbiAgICApIHtcbiAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBtZXNzYWdlO1xuXG4gICAgICBpZiAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnICYmIHN0YWNrIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gbWVzc2FnZS5lbmRzV2l0aCgnOicpID8gJycgOiAnOic7XG4gICAgICAgIGVycm9yTWVzc2FnZSA9IGAke21lc3NhZ2V9JHtzZXBhcmF0b3J9ICR7c3RhY2subWVzc2FnZX1gO1xuICAgICAgfVxuXG4gICAgICBsZXQgZXJyb3IgPSBuZXcgRXJyb3IoZXJyb3JNZXNzYWdlKTtcbiAgICAgIGlmIChzdGFjayBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIGVycm9yLnN0YWNrID0gc3RhY2suc3RhY2s7XG4gICAgICB9IGVsc2UgaWYgKHN0YWNrKSB7XG4gICAgICAgIGVycm9yLnN0YWNrID0gc3RhY2s7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlcnJvci5zdGFjayA9IENyZWF0ZVVzZXJTdGFjayhlcnJvcik7XG4gICAgICB9XG4gICAgICBsZXQgdHJhY2UgPSBnZXRUcmFjZShlcnJvciwgJ3NlcnZlci1pbnRlcm5hbCcsICdNZXRlb3IuX2RlYnVnJyk7XG4gICAgICBLYWRpcmEubW9kZWxzLmVycm9yLnRyYWNrRXJyb3IoZXJyb3IsIHRyYWNlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gb3JpZ2luYWxNZXRlb3JEZWJ1Zy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRUcmFjZSAoZXJyLCB0eXBlLCBzdWJUeXBlKSB7XG4gIHJldHVybiB7XG4gICAgdHlwZSxcbiAgICBzdWJUeXBlLFxuICAgIG5hbWU6IGVyci5tZXNzYWdlLFxuICAgIGVycm9yZWQ6IHRydWUsXG4gICAgYXQ6IEthZGlyYS5zeW5jZWREYXRlLmdldFRpbWUoKSxcbiAgICBldmVudHM6IFtcbiAgICAgIFsnc3RhcnQnLCAwLCB7fV0sXG4gICAgICBbJ2Vycm9yJywgMCwge2Vycm9yOiB7bWVzc2FnZTogZXJyLm1lc3NhZ2UsIHN0YWNrOiBlcnIuc3RhY2t9fV1cbiAgICBdLFxuICAgIG1ldHJpY3M6IHtcbiAgICAgIHRvdGFsOiAwXG4gICAgfVxuICB9O1xufVxuIiwiLyogZXNsaW50LWRpc2FibGUgY2FtZWxjYXNlICovXG5cbmltcG9ydCB7IEREUFNlcnZlciB9IGZyb20gJ21ldGVvci9kZHAtc2VydmVyJztcblxuZXhwb3J0IGZ1bmN0aW9uIHNldExhYmVscyAoKSB7XG4gIC8vIG5hbWUgU2Vzc2lvbi5wcm90b3R5cGUuc2VuZFxuICBsZXQgb3JpZ2luYWxTZW5kID0gTWV0ZW9yWC5TZXNzaW9uLnByb3RvdHlwZS5zZW5kO1xuICBNZXRlb3JYLlNlc3Npb24ucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiBrYWRpcmFfU2Vzc2lvbl9zZW5kIChtc2cpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxTZW5kLmNhbGwodGhpcywgbXNnKTtcbiAgfTtcblxuICAvLyBuYW1lIE11bHRpcGxleGVyIGluaXRpYWwgYWRkc1xuICAvLyBNdWx0aXBsZXhlciBpcyB1bmRlZmluZWQgaW4gcm9ja2V0IGNoYXRcbiAgaWYgKE1ldGVvclguTXVsdGlwbGV4ZXIpIHtcbiAgICBsZXQgb3JpZ2luYWxTZW5kQWRkcyA9IE1ldGVvclguTXVsdGlwbGV4ZXIucHJvdG90eXBlLl9zZW5kQWRkcztcbiAgICBNZXRlb3JYLk11bHRpcGxleGVyLnByb3RvdHlwZS5fc2VuZEFkZHMgPSBmdW5jdGlvbiBrYWRpcmFfTXVsdGlwbGV4ZXJfc2VuZEFkZHMgKGhhbmRsZSkge1xuICAgICAgcmV0dXJuIG9yaWdpbmFsU2VuZEFkZHMuY2FsbCh0aGlzLCBoYW5kbGUpO1xuICAgIH07XG4gIH1cblxuICAvLyBuYW1lIE1vbmdvQ29ubmVjdGlvbiBpbnNlcnRcbiAgbGV0IG9yaWdpbmFsTW9uZ29JbnNlcnQgPSBNZXRlb3JYLk1vbmdvQ29ubmVjdGlvbi5wcm90b3R5cGUuX2luc2VydDtcbiAgTWV0ZW9yWC5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLl9pbnNlcnQgPSBmdW5jdGlvbiBrYWRpcmFfTW9uZ29Db25uZWN0aW9uX2luc2VydCAoY29sbCwgZG9jLCBjYikge1xuICAgIHJldHVybiBvcmlnaW5hbE1vbmdvSW5zZXJ0LmNhbGwodGhpcywgY29sbCwgZG9jLCBjYik7XG4gIH07XG5cbiAgLy8gbmFtZSBNb25nb0Nvbm5lY3Rpb24gdXBkYXRlXG4gIGxldCBvcmlnaW5hbE1vbmdvVXBkYXRlID0gTWV0ZW9yWC5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLl91cGRhdGU7XG4gIE1ldGVvclguTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24ga2FkaXJhX01vbmdvQ29ubmVjdGlvbl91cGRhdGUgKGNvbGwsIHNlbGVjdG9yLCBtb2QsIG9wdGlvbnMsIGNiKSB7XG4gICAgcmV0dXJuIG9yaWdpbmFsTW9uZ29VcGRhdGUuY2FsbCh0aGlzLCBjb2xsLCBzZWxlY3RvciwgbW9kLCBvcHRpb25zLCBjYik7XG4gIH07XG5cbiAgLy8gbmFtZSBNb25nb0Nvbm5lY3Rpb24gcmVtb3ZlXG4gIGxldCBvcmlnaW5hbE1vbmdvUmVtb3ZlID0gTWV0ZW9yWC5Nb25nb0Nvbm5lY3Rpb24ucHJvdG90eXBlLl9yZW1vdmU7XG4gIE1ldGVvclguTW9uZ29Db25uZWN0aW9uLnByb3RvdHlwZS5fcmVtb3ZlID0gZnVuY3Rpb24ga2FkaXJhX01vbmdvQ29ubmVjdGlvbl9yZW1vdmUgKGNvbGwsIHNlbGVjdG9yLCBjYikge1xuICAgIHJldHVybiBvcmlnaW5hbE1vbmdvUmVtb3ZlLmNhbGwodGhpcywgY29sbCwgc2VsZWN0b3IsIGNiKTtcbiAgfTtcblxuICAvLyBuYW1lIFB1YnN1YiBhZGRlZFxuICBsZXQgb3JpZ2luYWxQdWJzdWJBZGRlZCA9IE1ldGVvclguU2Vzc2lvbi5wcm90b3R5cGUuc2VuZEFkZGVkO1xuICBNZXRlb3JYLlNlc3Npb24ucHJvdG90eXBlLnNlbmRBZGRlZCA9IGZ1bmN0aW9uIGthZGlyYV9TZXNzaW9uX3NlbmRBZGRlZCAoY29sbCwgaWQsIGZpZWxkcykge1xuICAgIHJldHVybiBvcmlnaW5hbFB1YnN1YkFkZGVkLmNhbGwodGhpcywgY29sbCwgaWQsIGZpZWxkcyk7XG4gIH07XG5cbiAgLy8gbmFtZSBQdWJzdWIgY2hhbmdlZFxuICBsZXQgb3JpZ2luYWxQdWJzdWJDaGFuZ2VkID0gTWV0ZW9yWC5TZXNzaW9uLnByb3RvdHlwZS5zZW5kQ2hhbmdlZDtcbiAgTWV0ZW9yWC5TZXNzaW9uLnByb3RvdHlwZS5zZW5kQ2hhbmdlZCA9IGZ1bmN0aW9uIGthZGlyYV9TZXNzaW9uX3NlbmRDaGFuZ2VkIChjb2xsLCBpZCwgZmllbGRzKSB7XG4gICAgcmV0dXJuIG9yaWdpbmFsUHVic3ViQ2hhbmdlZC5jYWxsKHRoaXMsIGNvbGwsIGlkLCBmaWVsZHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgUHVic3ViIHJlbW92ZWRcbiAgbGV0IG9yaWdpbmFsUHVic3ViUmVtb3ZlZCA9IE1ldGVvclguU2Vzc2lvbi5wcm90b3R5cGUuc2VuZFJlbW92ZWQ7XG4gIE1ldGVvclguU2Vzc2lvbi5wcm90b3R5cGUuc2VuZFJlbW92ZWQgPSBmdW5jdGlvbiBrYWRpcmFfU2Vzc2lvbl9zZW5kUmVtb3ZlZCAoY29sbCwgaWQpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxQdWJzdWJSZW1vdmVkLmNhbGwodGhpcywgY29sbCwgaWQpO1xuICB9O1xuXG4gIC8vIG5hbWUgTW9uZ29DdXJzb3IgZm9yRWFjaFxuICBsZXQgb3JpZ2luYWxDdXJzb3JGb3JFYWNoID0gTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUuZm9yRWFjaDtcbiAgTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIGthZGlyYV9DdXJzb3JfZm9yRWFjaCAoKSB7XG4gICAgcmV0dXJuIG9yaWdpbmFsQ3Vyc29yRm9yRWFjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgTW9uZ29DdXJzb3IgbWFwXG4gIGxldCBvcmlnaW5hbEN1cnNvck1hcCA9IE1ldGVvclguTW9uZ29DdXJzb3IucHJvdG90eXBlLm1hcDtcbiAgTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24ga2FkaXJhX0N1cnNvcl9tYXAgKCkge1xuICAgIHJldHVybiBvcmlnaW5hbEN1cnNvck1hcC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgTW9uZ29DdXJzb3IgZmV0Y2hcbiAgbGV0IG9yaWdpbmFsQ3Vyc29yRmV0Y2ggPSBNZXRlb3JYLk1vbmdvQ3Vyc29yLnByb3RvdHlwZS5mZXRjaDtcbiAgTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUuZmV0Y2ggPSBmdW5jdGlvbiBrYWRpcmFfQ3Vyc29yX2ZldGNoICgpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxDdXJzb3JGZXRjaC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgTW9uZ29DdXJzb3IgY291bnRcbiAgbGV0IG9yaWdpbmFsQ3Vyc29yQ291bnQgPSBNZXRlb3JYLk1vbmdvQ3Vyc29yLnByb3RvdHlwZS5jb3VudDtcbiAgTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUuY291bnQgPSBmdW5jdGlvbiBrYWRpcmFfQ3Vyc29yX2NvdW50ICgpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxDdXJzb3JDb3VudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgTW9uZ29DdXJzb3Igb2JzZXJ2ZUNoYW5nZXNcbiAgbGV0IG9yaWdpbmFsQ3Vyc29yT2JzZXJ2ZUNoYW5nZXMgPSBNZXRlb3JYLk1vbmdvQ3Vyc29yLnByb3RvdHlwZS5vYnNlcnZlQ2hhbmdlcztcbiAgTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUub2JzZXJ2ZUNoYW5nZXMgPSBmdW5jdGlvbiBrYWRpcmFfQ3Vyc29yX29ic2VydmVDaGFuZ2VzICgpIHtcbiAgICByZXR1cm4gb3JpZ2luYWxDdXJzb3JPYnNlcnZlQ2hhbmdlcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgTW9uZ29DdXJzb3Igb2JzZXJ2ZVxuICBsZXQgb3JpZ2luYWxDdXJzb3JPYnNlcnZlID0gTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUub2JzZXJ2ZTtcbiAgTWV0ZW9yWC5Nb25nb0N1cnNvci5wcm90b3R5cGUub2JzZXJ2ZSA9IGZ1bmN0aW9uIGthZGlyYV9DdXJzb3Jfb2JzZXJ2ZSAoKSB7XG4gICAgcmV0dXJuIG9yaWdpbmFsQ3Vyc29yT2JzZXJ2ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIC8vIG5hbWUgQ3Jvc3NCYXIgbGlzdGVuXG4gIGxldCBvcmlnaW5hbENyb3NzYmFyTGlzdGVuID0gRERQU2VydmVyLl9Dcm9zc2Jhci5wcm90b3R5cGUubGlzdGVuO1xuICBERFBTZXJ2ZXIuX0Nyb3NzYmFyLnByb3RvdHlwZS5saXN0ZW4gPSBmdW5jdGlvbiBrYWRpcmFfQ3Jvc3NiYXJfbGlzdGVuICh0cmlnZ2VyLCBjYWxsYmFjaykge1xuICAgIHJldHVybiBvcmlnaW5hbENyb3NzYmFyTGlzdGVuLmNhbGwodGhpcywgdHJpZ2dlciwgY2FsbGJhY2spO1xuICB9O1xuXG4gIC8vIG5hbWUgQ3Jvc3NCYXIgZmlyZVxuICBsZXQgb3JpZ2luYWxDcm9zc2JhckZpcmUgPSBERFBTZXJ2ZXIuX0Nyb3NzYmFyLnByb3RvdHlwZS5maXJlO1xuICBERFBTZXJ2ZXIuX0Nyb3NzYmFyLnByb3RvdHlwZS5maXJlID0gZnVuY3Rpb24ga2FkaXJhX0Nyb3NzYmFyX2ZpcmUgKG5vdGlmaWNhdGlvbikge1xuICAgIHJldHVybiBvcmlnaW5hbENyb3NzYmFyRmlyZS5jYWxsKHRoaXMsIG5vdGlmaWNhdGlvbik7XG4gIH07XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuZXhwb3J0IGZ1bmN0aW9uIHdyYXBGYXN0UmVuZGVyICgpIHtcbiAgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgIGlmIChQYWNrYWdlWydzdGFyaW5nYXRsaWdodHM6ZmFzdC1yZW5kZXInXSkge1xuICAgICAgY29uc3QgRmFzdFJlbmRlciA9IFBhY2thZ2VbJ3N0YXJpbmdhdGxpZ2h0czpmYXN0LXJlbmRlciddLkZhc3RSZW5kZXI7XG5cbiAgICAgIC8vIEZsb3cgUm91dGVyIGRvZXNuJ3QgY2FsbCBGYXN0UmVuZGVyLnJvdXRlIHVudGlsIGFmdGVyIGFsbFxuICAgICAgLy8gTWV0ZW9yLnN0YXJ0dXAgY2FsbGJhY2tzIGZpbmlzaFxuICAgICAgbGV0IG9yaWdSb3V0ZSA9IEZhc3RSZW5kZXIucm91dGU7XG4gICAgICBGYXN0UmVuZGVyLnJvdXRlID0gZnVuY3Rpb24gKHBhdGgsIF9jYWxsYmFjaykge1xuICAgICAgICBsZXQgY2FsbGJhY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgY29uc3QgaW5mbyA9IEthZGlyYS5fZ2V0SW5mbygpO1xuICAgICAgICAgIGlmIChpbmZvKSB7XG4gICAgICAgICAgICBpbmZvLnN1Z2dlc3RlZFJvdXRlTmFtZSA9IHBhdGg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIF9jYWxsYmFjay5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBvcmlnUm91dGUuY2FsbChGYXN0UmVuZGVyLCBwYXRoLCBjYWxsYmFjayk7XG4gICAgICB9O1xuICAgIH1cbiAgfSk7XG59XG4iLCJpbXBvcnQgZnMgZnJvbSAnZnMnO1xuY29uc3QgRmliZXJzID0gcmVxdWlyZSgnZmliZXJzJyk7XG5cbmZ1bmN0aW9uIHdyYXBDYWxsYmFjayAoYXJncywgY3JlYXRlV3JhcHBlcikge1xuICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9IGNyZWF0ZVdyYXBwZXIoYXJnc1thcmdzLmxlbmd0aCAtIDFdKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXJyb3JFdmVudCAoZXZlbnRFbWl0dGVyLCB0cmFjZSwgZXZlbnQpIHtcbiAgZnVuY3Rpb24gaGFuZGxlciAoZXJyb3IpIHtcbiAgICBpZiAodHJhY2UgJiYgZXZlbnQpIHtcbiAgICAgIEthZGlyYS50cmFjZXIuZXZlbnRFbmQodHJhY2UsIGV2ZW50LCB7XG4gICAgICAgIGVycm9yXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBOb2RlIHRocm93cyB0aGUgZXJyb3IgaWYgdGhlcmUgYXJlIG5vIGxpc3RlbmVyc1xuICAgIC8vIFdlIHdhbnQgaXQgdG8gYmVoYXZlIGFzIGlmIHdlIGFyZSBub3QgbGlzdGVuaW5nIHRvIGl0XG4gICAgaWYgKGV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50KCdlcnJvcicpID09PSAxKSB7XG4gICAgICBldmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoJ2Vycm9yJywgaGFuZGxlcik7XG4gICAgICBldmVudEVtaXR0ZXIuZW1pdCgnZXJyb3InLCBlcnJvcik7XG4gICAgfVxuICB9XG5cbiAgZXZlbnRFbWl0dGVyLm9uKCdlcnJvcicsIGhhbmRsZXIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gd3JhcEZzICgpIHtcbiAgLy8gU29tZSBucG0gcGFja2FnZXMgd2lsbCBkbyBmcyBjYWxscyBpbiB0aGVcbiAgLy8gY2FsbGJhY2sgb2YgYW5vdGhlciBmcyBjYWxsLlxuICAvLyBUaGlzIHZhcmlhYmxlIGlzIHNldCB3aXRoIHRoZSBrYWRpcmFJbmZvIHdoaWxlXG4gIC8vIGEgY2FsbGJhY2sgaXMgcnVuIHNvIHdlIGNhbiB0cmFjayBvdGhlciBmcyBjYWxsc1xuICBsZXQgZnNLYWRpcmFJbmZvID0gbnVsbDtcblxuICBsZXQgb3JpZ2luYWxTdGF0ID0gZnMuc3RhdDtcbiAgZnMuc3RhdCA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCkgfHwgZnNLYWRpcmFJbmZvO1xuXG4gICAgaWYgKGthZGlyYUluZm8pIHtcbiAgICAgIGxldCBldmVudCA9IEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2ZzJywge1xuICAgICAgICBmdW5jOiAnc3RhdCcsXG4gICAgICAgIHBhdGg6IGFyZ3VtZW50c1swXSxcbiAgICAgICAgb3B0aW9uczogdHlwZW9mIGFyZ3VtZW50c1sxXSA9PT0gJ29iamVjdCcgPyBhcmd1bWVudHNbMV0gOiB1bmRlZmluZWRcbiAgICAgIH0pO1xuXG4gICAgICB3cmFwQ2FsbGJhY2soYXJndW1lbnRzLCAoY2IpID0+IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgS2FkaXJhLnRyYWNlci5ldmVudEVuZChrYWRpcmFJbmZvLnRyYWNlLCBldmVudCk7XG5cbiAgICAgICAgaWYgKCFGaWJlcnMuY3VycmVudCkge1xuICAgICAgICAgIGZzS2FkaXJhSW5mbyA9IGthZGlyYUluZm87XG4gICAgICAgIH1cblxuICAgICAgICB0cnkge1xuICAgICAgICAgIGNiKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgZnNLYWRpcmFJbmZvID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9yaWdpbmFsU3RhdC5hcHBseShmcywgYXJndW1lbnRzKTtcbiAgfTtcblxuICBsZXQgb3JpZ2luYWxDcmVhdGVSZWFkU3RyZWFtID0gZnMuY3JlYXRlUmVhZFN0cmVhbTtcbiAgZnMuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uICgpIHtcbiAgICBjb25zdCBrYWRpcmFJbmZvID0gS2FkaXJhLl9nZXRJbmZvKCkgfHwgZnNLYWRpcmFJbmZvO1xuICAgIGxldCBzdHJlYW0gPSBvcmlnaW5hbENyZWF0ZVJlYWRTdHJlYW0uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIGlmIChrYWRpcmFJbmZvKSB7XG4gICAgICBjb25zdCBldmVudCA9IEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2ZzJywge1xuICAgICAgICBmdW5jOiAnY3JlYXRlUmVhZFN0cmVhbScsXG4gICAgICAgIHBhdGg6IGFyZ3VtZW50c1swXSxcbiAgICAgICAgb3B0aW9uczogSlNPTi5zdHJpbmdpZnkoYXJndW1lbnRzWzFdKVxuICAgICAgfSk7XG5cbiAgICAgIHN0cmVhbS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICBLYWRpcmEudHJhY2VyLmV2ZW50RW5kKGthZGlyYUluZm8udHJhY2UsIGV2ZW50KTtcbiAgICAgIH0pO1xuXG4gICAgICBoYW5kbGVFcnJvckV2ZW50KHN0cmVhbSwga2FkaXJhSW5mby50cmFjZSwgZXZlbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBzdHJlYW07XG4gIH07XG59XG4iLCJsZXQgUGVyZm9ybWFuY2VPYnNlcnZlcjtcbmxldCBjb25zdGFudHM7XG5sZXQgcGVyZm9ybWFuY2U7XG5cbnRyeSB7XG4gIC8vIE9ubHkgYXZhaWxhYmxlIGluIE5vZGUgOC41IGFuZCBuZXdlclxuICAoe1xuICAgIFBlcmZvcm1hbmNlT2JzZXJ2ZXIsXG4gICAgY29uc3RhbnRzLFxuICAgIHBlcmZvcm1hbmNlXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGdsb2JhbC1yZXF1aXJlXG4gIH0gPSByZXF1aXJlKCdwZXJmX2hvb2tzJykpO1xufSBjYXRjaCAoZSkgeyAvKiBlbXB0eSAqLyB9XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdDTWV0cmljcyB7XG4gIGNvbnN0cnVjdG9yICgpIHtcbiAgICB0aGlzLl9vYnNlcnZlciA9IG51bGw7XG4gICAgdGhpcy5zdGFydGVkID0gZmFsc2U7XG4gICAgdGhpcy5tZXRyaWNzID0ge307XG5cbiAgICB0aGlzLnJlc2V0KCk7XG4gIH1cblxuICBzdGFydCAoKSB7XG4gICAgaWYgKHRoaXMuc3RhcnRlZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghUGVyZm9ybWFuY2VPYnNlcnZlciB8fCAhY29uc3RhbnRzKSB7XG4gICAgICAvLyBUaGUgbm9kZSB2ZXJzaW9uIGlzIHRvbyBvbGQgdG8gaGF2ZSBQZXJmb3JtYW5jZU9ic2VydmVyXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5zdGFydGVkID0gdHJ1ZTtcblxuICAgIHRoaXMub2JzZXJ2ZXIgPSBuZXcgUGVyZm9ybWFuY2VPYnNlcnZlcihsaXN0ID0+IHtcbiAgICAgIGxpc3QuZ2V0RW50cmllcygpLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBsZXQgbWV0cmljID0gdGhpcy5fbWFwS2luZFRvTWV0cmljKGVudHJ5LmtpbmQpO1xuICAgICAgICB0aGlzLm1ldHJpY3NbbWV0cmljXSArPSBlbnRyeS5kdXJhdGlvbjtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBUaGUgZnVuY3Rpb24gd2FzIHJlbW92ZWQgaW4gTm9kZSAxMCBzaW5jZSBpdCBzdG9wcGVkIHN0b3Jpbmcgb2xkXG4gICAgICAvLyBlbnRyaWVzXG4gICAgICBpZiAodHlwZW9mIHBlcmZvcm1hbmNlLmNsZWFyR0MgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgcGVyZm9ybWFuY2UuY2xlYXJHQygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5vYnNlcnZlci5vYnNlcnZlKHsgZW50cnlUeXBlczogWydnYyddLCBidWZmZXJlZDogZmFsc2UgfSk7XG4gIH1cblxuICBfbWFwS2luZFRvTWV0cmljIChnY0tpbmQpIHtcbiAgICBzd2l0Y2ggKGdjS2luZCkge1xuICAgICAgY2FzZSBjb25zdGFudHMuTk9ERV9QRVJGT1JNQU5DRV9HQ19NQUpPUjpcbiAgICAgICAgcmV0dXJuICdnY01ham9yJztcbiAgICAgIGNhc2UgY29uc3RhbnRzLk5PREVfUEVSRk9STUFOQ0VfR0NfTUlOT1I6XG4gICAgICAgIHJldHVybiAnZ2NNaW5vcic7XG4gICAgICBjYXNlIGNvbnN0YW50cy5OT0RFX1BFUkZPUk1BTkNFX0dDX0lOQ1JFTUVOVEFMOlxuICAgICAgICByZXR1cm4gJ2djSW5jcmVtZW50YWwnO1xuICAgICAgY2FzZSBjb25zdGFudHMuTk9ERV9QRVJGT1JNQU5DRV9HQ19XRUFLQ0I6XG4gICAgICAgIHJldHVybiAnZ2NXZWFrQ0InO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5sb2coYE1vbnRpIEFQTTogVW5yZWNvZ25pemVkIEdDIEtpbmQ6ICR7Z2NLaW5kfWApO1xuICAgIH1cbiAgfVxuXG4gIHJlc2V0ICgpIHtcbiAgICB0aGlzLm1ldHJpY3MgPSB7XG4gICAgICBnY01ham9yOiAwLFxuICAgICAgZ2NNaW5vcjogMCxcbiAgICAgIGdjSW5jcmVtZW50YWw6IDAsXG4gICAgICBnY1dlYWtDQjogMFxuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgTW9uZ29JbnRlcm5hbHMgfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuXG5sZXQgY2xpZW50O1xubGV0IHNlcnZlclN0YXR1cyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbmxldCBvdGhlckNoZWNrb3V0cyA9IDA7XG5cbi8vIFRoZXNlIG1ldHJpY3MgYXJlIG9ubHkgZm9yIHRoZSBtb25nbyBwb29sIGZvciB0aGUgcHJpbWFyeSBNb25nbyBzZXJ2ZXJcbmxldCBwcmltYXJ5Q2hlY2tvdXRzID0gMDtcbmxldCB0b3RhbENoZWNrb3V0VGltZSA9IDA7XG5sZXQgbWF4Q2hlY2tvdXRUaW1lID0gMDtcbmxldCBjcmVhdGVkID0gMDtcbmxldCBtZWFzdXJlbWVudENvdW50ID0gMDtcbmxldCBwZW5kaW5nVG90YWwgPSAwO1xubGV0IGNoZWNrZWRPdXRUb3RhbCA9IDA7XG5cbnNldEludGVydmFsKCgpID0+IHtcbiAgbGV0IHN0YXR1cyA9IGdldFNlcnZlclN0YXR1cyhnZXRQcmltYXJ5KCksIHRydWUpO1xuXG4gIGlmIChzdGF0dXMpIHtcbiAgICBwZW5kaW5nVG90YWwgKz0gc3RhdHVzLnBlbmRpbmcubGVuZ3RoO1xuICAgIGNoZWNrZWRPdXRUb3RhbCArPSBzdGF0dXMuY2hlY2tlZE91dC5zaXplO1xuICAgIG1lYXN1cmVtZW50Q291bnQgKz0gMTtcbiAgfVxufSwgMTAwMCk7XG5cbi8vIFZlcnNpb24gNCBvZiB0aGUgZHJpdmVyIGRlZmF1bHRzIHRvIDEwMC4gT2xkZXIgdmVyc2lvbnMgdXNlZCAxMC5cbmxldCBERUZBVUxUX01BWF9QT09MX1NJWkUgPSAxMDA7XG5cbmZ1bmN0aW9uIGdldFBvb2xTaXplICgpIHtcbiAgaWYgKGNsaWVudCAmJiBjbGllbnQudG9wb2xvZ3kgJiYgY2xpZW50LnRvcG9sb2d5LnMgJiYgY2xpZW50LnRvcG9sb2d5LnMub3B0aW9ucykge1xuICAgIHJldHVybiBjbGllbnQudG9wb2xvZ3kucy5vcHRpb25zLm1heFBvb2xTaXplIHx8IERFRkFVTFRfTUFYX1BPT0xfU0laRTtcbiAgfVxuXG4gIHJldHVybiAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9uZ29Ecml2ZXJTdGF0cyAoKSB7XG4gIHJldHVybiB7XG4gICAgcG9vbFNpemU6IGdldFBvb2xTaXplKCksXG4gICAgcHJpbWFyeUNoZWNrb3V0cyxcbiAgICBvdGhlckNoZWNrb3V0cyxcbiAgICBjaGVja291dFRpbWU6IHRvdGFsQ2hlY2tvdXRUaW1lLFxuICAgIG1heENoZWNrb3V0VGltZSxcbiAgICBwZW5kaW5nOiBwZW5kaW5nVG90YWwgPyBwZW5kaW5nVG90YWwgLyBtZWFzdXJlbWVudENvdW50IDogMCxcbiAgICBjaGVja2VkT3V0OiBjaGVja2VkT3V0VG90YWwgPyBjaGVja2VkT3V0VG90YWwgLyBtZWFzdXJlbWVudENvdW50IDogMCxcbiAgICBjcmVhdGVkXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNldE1vbmdvRHJpdmVyU3RhdHMgKCkge1xuICBwcmltYXJ5Q2hlY2tvdXRzID0gMDtcbiAgb3RoZXJDaGVja291dHMgPSAwO1xuICB0b3RhbENoZWNrb3V0VGltZSA9IDA7XG4gIG1heENoZWNrb3V0VGltZSA9IDA7XG4gIHBlbmRpbmdUb3RhbCA9IDA7XG4gIGNoZWNrZWRPdXRUb3RhbCA9IDA7XG4gIG1lYXN1cmVtZW50Q291bnQgPSAwO1xuICBwcmltYXJ5Q2hlY2tvdXRzID0gMDtcbiAgY3JlYXRlZCA9IDA7XG59XG5cbk1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgbGV0IF9jbGllbnQgPSBNb25nb0ludGVybmFscy5kZWZhdWx0UmVtb3RlQ29sbGVjdGlvbkRyaXZlcigpLm1vbmdvLmNsaWVudDtcblxuICBpZiAoIV9jbGllbnQgfHwgIV9jbGllbnQucykge1xuICAgIC8vIE9sZCB2ZXJzaW9uIG9mIGFnZW50XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IG9wdGlvbnMgPSBfY2xpZW50LnMub3B0aW9ucyB8fCB7fTtcbiAgbGV0IHZlcnNpb25QYXJ0cyA9IE1vbmdvSW50ZXJuYWxzLk5wbU1vZHVsZXMubW9uZ29kYi52ZXJzaW9uLnNwbGl0KCcuJylcbiAgICAubWFwKHBhcnQgPT4gcGFyc2VJbnQocGFydCwgMTApKTtcblxuICAvLyBWZXJzaW9uIDQgb2YgdGhlIGRyaXZlciByZW1vdmVkIHRoZSBvcHRpb24gYW5kIGVuYWJsZWQgaXQgYnkgZGVmYXVsdFxuICBpZiAoIW9wdGlvbnMudXNlVW5pZmllZFRvcG9sb2d5ICYmIHZlcnNpb25QYXJ0c1swXSA8IDQpIHtcbiAgICAvLyBDTUFQIGFuZCB0b3BvbG9neSBtb25pdG9yaW5nIHJlcXVpcmVzIHVzZVVuaWZpZWRUb3BvbG9neVxuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIE1ldGVvciAxLjkgZW5hYmxlZCB1c2VVbmlmaWVkVG9wb2xvZ3ksIGJ1dCBDTUFQIGV2ZW50cyB3ZXJlIG9ubHkgYWRkZWRcbiAgLy8gaW4gdmVyc2lvbiAzLjUgb2YgdGhlIGRyaXZlci5cbiAgaWYgKHZlcnNpb25QYXJ0c1swXSA9PT0gMyAmJiB2ZXJzaW9uUGFydHNbMV0gPCA1KSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY2xpZW50ID0gX2NsaWVudDtcblxuICAvLyBHZXQgdGhlIG51bWJlciBvZiBjb25uZWN0aW9ucyBhbHJlYWR5IGNyZWF0ZWRcbiAgbGV0IHByaW1hcnlEZXNjcmlwdGlvbiA9IGdldFNlcnZlckRlc2NyaXB0aW9uKGdldFByaW1hcnkoKSk7XG4gIGlmIChwcmltYXJ5RGVzY3JpcHRpb24gJiYgcHJpbWFyeURlc2NyaXB0aW9uLnMgJiYgcHJpbWFyeURlc2NyaXB0aW9uLnMucG9vbCkge1xuICAgIGxldCBwb29sID0gcHJpbWFyeURlc2NyaXB0aW9uLnMucG9vbDtcbiAgICBsZXQgdG90YWxDb25uZWN0aW9ucyA9IHBvb2wudG90YWxDb25uZWN0aW9uQ291bnQ7XG4gICAgbGV0IGF2YWlsYWJsZUNvbm5lY3Rpb25zID0gcG9vbC5hdmFpbGFibGVDb25uZWN0aW9uQ291bnQ7XG5cbiAgICAvLyB0b3RhbENvbm5lY3Rpb25Db3VudCBjb3VudHMgYXZhaWxhYmxlIGNvbm5lY3Rpb25zIHR3aWNlXG4gICAgY3JlYXRlZCArPSB0b3RhbENvbm5lY3Rpb25zIC0gYXZhaWxhYmxlQ29ubmVjdGlvbnM7XG4gIH1cblxuICBjbGllbnQub24oJ2Nvbm5lY3Rpb25DcmVhdGVkJywgZXZlbnQgPT4ge1xuICAgIGxldCBwcmltYXJ5ID0gZ2V0UHJpbWFyeSgpO1xuICAgIGlmIChwcmltYXJ5ID09PSBldmVudC5hZGRyZXNzKSB7XG4gICAgICBjcmVhdGVkICs9IDE7XG4gICAgfVxuICB9KTtcblxuICBjbGllbnQub24oJ2Nvbm5lY3Rpb25DbG9zZWQnLCBldmVudCA9PiB7XG4gICAgbGV0IHN0YXR1cyA9IGdldFNlcnZlclN0YXR1cyhldmVudC5hZGRyZXNzLCB0cnVlKTtcbiAgICBpZiAoc3RhdHVzKSB7XG4gICAgICBzdGF0dXMuY2hlY2tlZE91dC5kZWxldGUoZXZlbnQuY29ubmVjdGlvbklkKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNsaWVudC5vbignY29ubmVjdGlvbkNoZWNrT3V0U3RhcnRlZCcsIGV2ZW50ID0+IHtcbiAgICBsZXQgc3RhdHVzID0gZ2V0U2VydmVyU3RhdHVzKGV2ZW50LmFkZHJlc3MpO1xuICAgIHN0YXR1cy5wZW5kaW5nLnB1c2goZXZlbnQudGltZSk7XG4gIH0pO1xuXG4gIGNsaWVudC5vbignY29ubmVjdGlvbkNoZWNrT3V0RmFpbGVkJywgZXZlbnQgPT4ge1xuICAgIGxldCBzdGF0dXMgPSBnZXRTZXJ2ZXJTdGF0dXMoZXZlbnQuYWRkcmVzcywgdHJ1ZSk7XG4gICAgaWYgKHN0YXR1cykge1xuICAgICAgc3RhdHVzLnBlbmRpbmcuc2hpZnQoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNsaWVudC5vbignY29ubmVjdGlvbkNoZWNrZWRPdXQnLCBldmVudCA9PiB7XG4gICAgbGV0IHN0YXR1cyA9IGdldFNlcnZlclN0YXR1cyhldmVudC5hZGRyZXNzKTtcbiAgICBsZXQgc3RhcnQgPSBzdGF0dXMucGVuZGluZy5zaGlmdCgpO1xuICAgIGxldCBwcmltYXJ5ID0gZ2V0UHJpbWFyeSgpO1xuXG4gICAgaWYgKHN0YXJ0ICYmIHByaW1hcnkgPT09IGV2ZW50LmFkZHJlc3MpIHtcbiAgICAgIGxldCBjaGVja291dER1cmF0aW9uID0gZXZlbnQudGltZS5nZXRUaW1lKCkgLSBzdGFydC5nZXRUaW1lKCk7XG5cbiAgICAgIHByaW1hcnlDaGVja291dHMgKz0gMTtcbiAgICAgIHRvdGFsQ2hlY2tvdXRUaW1lICs9IGNoZWNrb3V0RHVyYXRpb247XG4gICAgICBpZiAoY2hlY2tvdXREdXJhdGlvbiA+IG1heENoZWNrb3V0VGltZSkge1xuICAgICAgICBtYXhDaGVja291dFRpbWUgPSBjaGVja291dER1cmF0aW9uO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvdGhlckNoZWNrb3V0cyArPSAxO1xuICAgIH1cblxuICAgIHN0YXR1cy5jaGVja2VkT3V0LmFkZChldmVudC5jb25uZWN0aW9uSWQpO1xuICB9KTtcblxuICBjbGllbnQub24oJ2Nvbm5lY3Rpb25DaGVja2VkSW4nLCBldmVudCA9PiB7XG4gICAgbGV0IHN0YXR1cyA9IGdldFNlcnZlclN0YXR1cyhldmVudC5hZGRyZXNzLCB0cnVlKTtcbiAgICBpZiAoc3RhdHVzKSB7XG4gICAgICBzdGF0dXMuY2hlY2tlZE91dC5kZWxldGUoZXZlbnQuY29ubmVjdGlvbklkKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNsaWVudC5vbignc2VydmVyQ2xvc2VkJywgZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgZGVsZXRlIHNlcnZlclN0YXR1c1tldmVudC5hZGRyZXNzXTtcbiAgfSk7XG59KTtcblxuZnVuY3Rpb24gZ2V0U2VydmVyU3RhdHVzIChhZGRyZXNzLCBkaXNhYmxlQ3JlYXRlKSB7XG4gIGlmICh0eXBlb2YgYWRkcmVzcyAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmIChhZGRyZXNzIGluIHNlcnZlclN0YXR1cykge1xuICAgIHJldHVybiBzZXJ2ZXJTdGF0dXNbYWRkcmVzc107XG4gIH1cblxuICBpZiAoZGlzYWJsZUNyZWF0ZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgc2VydmVyU3RhdHVzW2FkZHJlc3NdID0ge1xuICAgIHBlbmRpbmc6IFtdLFxuICAgIGNoZWNrZWRPdXQ6IG5ldyBTZXQoKSxcbiAgfTtcblxuICByZXR1cm4gc2VydmVyU3RhdHVzW2FkZHJlc3NdO1xufVxuXG5mdW5jdGlvbiBnZXRQcmltYXJ5ICgpIHtcbiAgaWYgKCFjbGllbnQgfHwgIWNsaWVudC50b3BvbG9neSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIC8vIFRoZSBkcml2ZXIgcmVuYW1lZCBsYXN0SXNNYXN0ZXIgaW4gdmVyc2lvbiA0LjMuMSB0byBsYXN0SGVsbG9cbiAgbGV0IHNlcnZlciA9IGNsaWVudC50b3BvbG9neS5sYXN0SXNNYXN0ZXIgP1xuICAgIGNsaWVudC50b3BvbG9neS5sYXN0SXNNYXN0ZXIoKSA6XG4gICAgY2xpZW50LnRvcG9sb2d5Lmxhc3RIZWxsbygpO1xuXG4gIGlmIChzZXJ2ZXIudHlwZSA9PT0gJ1N0YW5kYWxvbmUnKSB7XG4gICAgcmV0dXJuIHNlcnZlci5hZGRyZXNzO1xuICB9XG5cbiAgaWYgKCFzZXJ2ZXIgfHwgIXNlcnZlci5wcmltYXJ5KSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gc2VydmVyLnByaW1hcnk7XG59XG5cbmZ1bmN0aW9uIGdldFNlcnZlckRlc2NyaXB0aW9uIChhZGRyZXNzKSB7XG4gIGlmICghY2xpZW50IHx8ICFjbGllbnQudG9wb2xvZ3kgfHwgIWNsaWVudC50b3BvbG9neS5zIHx8ICFjbGllbnQudG9wb2xvZ3kucy5zZXJ2ZXJzKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgbGV0IGRlc2NyaXB0aW9uID0gY2xpZW50LnRvcG9sb2d5LnMuc2VydmVycy5nZXQoYWRkcmVzcyk7XG5cbiAgcmV0dXJuIGRlc2NyaXB0aW9uIHx8IG51bGw7XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCBGaWJlciBmcm9tICdmaWJlcnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gd3JhcFBpY2tlciAoKSB7XG4gIE1ldGVvci5zdGFydHVwKCgpID0+IHtcbiAgICBpZiAoIVBhY2thZ2VbJ21ldGVvcmhhY2tzOnBpY2tlciddKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgUGlja2VyID0gUGFja2FnZVsnbWV0ZW9yaGFja3M6cGlja2VyJ10uUGlja2VyO1xuXG4gICAgLy8gV3JhcCBQaWNrZXIuX3Byb2Nlc3NSb3V0ZSB0byBtYWtlIHN1cmUgaXQgcnVucyB0aGVcbiAgICAvLyBoYW5kbGVyIGluIGEgRmliZXIgd2l0aCBfX2thZGlyYUluZm8gc2V0XG4gICAgLy8gTmVlZGVkIGlmIGFueSBwcmV2aW91cyBtaWRkbGV3YXJlIGNhbGxlZCBgbmV4dGAgb3V0c2lkZSBvZiBhIGZpYmVyLlxuICAgIGNvbnN0IG9yaWdQcm9jZXNzUm91dGUgPSBQaWNrZXIuY29uc3RydWN0b3IucHJvdG90eXBlLl9wcm9jZXNzUm91dGU7XG4gICAgUGlja2VyLmNvbnN0cnVjdG9yLnByb3RvdHlwZS5fcHJvY2Vzc1JvdXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBwYXJhbXMsIHJlcSkge1xuICAgICAgY29uc3QgYXJncyA9IGFyZ3VtZW50cztcblxuICAgICAgaWYgKCFGaWJlci5jdXJyZW50KSB7XG4gICAgICAgIHJldHVybiBuZXcgRmliZXIoKCkgPT4ge1xuICAgICAgICAgIEthZGlyYS5fc2V0SW5mbyhyZXEuX19rYWRpcmFJbmZvKTtcbiAgICAgICAgICByZXR1cm4gb3JpZ1Byb2Nlc3NSb3V0ZS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfSkucnVuKCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXEuX19rYWRpcmFJbmZvKSB7XG4gICAgICAgIEthZGlyYS5fc2V0SW5mbyhyZXEuX19rYWRpcmFJbmZvKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG9yaWdQcm9jZXNzUm91dGUuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfTtcbiAgfSk7XG59XG4iLCJpbXBvcnQgeyBtaWxsaXNUb0h1bWFuIH0gZnJvbSAnLi4vY29tbW9uL3V0aWxzJztcblxuZXhwb3J0IGNvbnN0IFRpbWVvdXRNYW5hZ2VyID0ge1xuICBpZDogMCxcbiAgbWFwOiBuZXcgTWFwKCksXG5cbiAgcHJldHR5TWVzc2FnZToge1xuICAgIG1ldGhvZDogKG1ldGhvZCkgPT4gYE1ldGhvZCBcIiR7bWV0aG9kfVwiIHN0aWxsIHJ1bm5pbmcgYWZ0ZXJgLFxuICAgIHN1YjogKHN1YikgPT4gYFN1YnNjcmlwdGlvbiBcIiR7c3VifVwiIHN0aWxsIG5vdCByZWFkeSBhZnRlcmBcbiAgfSxcblxuICBhZGRUaW1lb3V0IChmbiwgdGltZW91dCkge1xuICAgIGlmICghZm4pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVGltZW91dE1hbmFnZXIuYWRkVGltZW91dDogZm4gaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZCA9ICsrdGhpcy5pZDtcblxuICAgIHRoaXMubWFwLnNldChpZCwgc2V0VGltZW91dChNZXRlb3IuYmluZEVudmlyb25tZW50KCgpID0+IHtcbiAgICAgIGZuKCk7XG5cbiAgICAgIHRoaXMubWFwLmRlbGV0ZShpZCk7XG4gICAgfSksIHRpbWVvdXQpKTtcblxuICAgIHJldHVybiBpZDtcbiAgfSxcblxuICB0cmFja1RpbWVvdXQgKHsga2FkaXJhSW5mbywgbXNnLCB0aW1lb3V0ID0gS2FkaXJhLm9wdGlvbnMuc3RhbGxlZFRpbWVvdXQgfSkge1xuICAgIGlmICghdGltZW91dCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHR5cGUgPSBtc2cubXNnO1xuICAgIGNvbnN0IG1ldGhvZCA9IG1zZy5tZXRob2QgfHwgbXNnLm5hbWU7XG5cbiAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihgJHt0aGlzLnByZXR0eU1lc3NhZ2VbdHlwZV0obWV0aG9kKSB8fCAnVW5rbm93biBUaW1lb3V0J30gJHttaWxsaXNUb0h1bWFuKHRpbWVvdXQpfWApO1xuXG4gICAga2FkaXJhSW5mby50aW1lb3V0SWQgPSB0aGlzLmFkZFRpbWVvdXQoKCkgPT4ge1xuICAgICAgS2FkaXJhLkV2ZW50QnVzLmVtaXQoJ21ldGhvZCcsICd0aW1lb3V0Jywga2FkaXJhSW5mbywgZXJyb3IpO1xuXG4gICAgICBNb250aS50cmFja0Vycm9yKGVycm9yLCB7IHR5cGUsIHN1YlR5cGU6ICdzZXJ2ZXInLCBrYWRpcmFJbmZvIH0pO1xuXG4gICAgICBjb25zb2xlLndhcm4oYFtNb250aSBBUE1dICR7ZXJyb3IubWVzc2FnZX1gKTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgfSxcblxuICBjbGVhclRpbWVvdXQgKHsga2FkaXJhSW5mbyA9IEthZGlyYS5fZ2V0SW5mbygpIH0gPSB7fSkge1xuICAgIGlmICgha2FkaXJhSW5mbykgcmV0dXJuO1xuXG4gICAgY29uc3QgeyB0aW1lb3V0SWQgfSA9IGthZGlyYUluZm87XG5cbiAgICBpZiAodGltZW91dElkICYmIHRoaXMubWFwLmhhcyh0aW1lb3V0SWQpKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5tYXAuZ2V0KHRpbWVvdXRJZCkpO1xuICAgICAgdGhpcy5tYXAuZGVsZXRlKHRpbWVvdXRJZCk7XG4gICAgICBkZWxldGUga2FkaXJhSW5mby50aW1lb3V0SWQ7XG4gICAgfVxuICB9XG59O1xuIiwiZXhwb3J0IGZ1bmN0aW9uIHdyYXBSb3V0ZXJzICgpIHtcbiAgbGV0IGNvbm5lY3RSb3V0ZXMgPSBbXTtcbiAgdHJ5IHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgZ2xvYmFsLXJlcXVpcmVcbiAgICBjb25uZWN0Um91dGVzLnB1c2gocmVxdWlyZSgnY29ubmVjdC1yb3V0ZScpKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIFdlIGNhbiBpZ25vcmUgZXJyb3JzXG4gIH1cblxuICB0cnkge1xuICAgIGlmIChQYWNrYWdlWydzaW1wbGU6anNvbi1yb3V0ZXMnXSkge1xuICAgICAgLy8gUmVsYXRpdmUgZnJvbSAubnBtL25vZGVfbW9kdWxlcy9tZXRlb3IvbW9udGlhcG1fYWdlbnQvbm9kZV9tb2R1bGVzXG4gICAgICAvLyBOcG0ucmVxdWlyZSBpcyBsZXNzIHN0cmljdCBvbiB3aGF0IHBhdGhzIHlvdSB1c2UgdGhhbiByZXF1aXJlXG4gICAgICBjb25uZWN0Um91dGVzLnB1c2goTnBtLnJlcXVpcmUoJy4uLy4uL3NpbXBsZV9qc29uLXJvdXRlcy9ub2RlX21vZHVsZXMvY29ubmVjdC1yb3V0ZScpKTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyB3ZSBjYW4gaWdub3JlIGVycm9yc1xuICB9XG5cbiAgY29ubmVjdFJvdXRlcy5mb3JFYWNoKGNvbm5lY3RSb3V0ZSA9PiB7XG4gICAgaWYgKHR5cGVvZiBjb25uZWN0Um91dGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25uZWN0Um91dGUoKHJvdXRlcikgPT4ge1xuICAgICAgY29uc3Qgb2xkQWRkID0gcm91dGVyLmNvbnN0cnVjdG9yLnByb3RvdHlwZS5hZGQ7XG4gICAgICByb3V0ZXIuY29uc3RydWN0b3IucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChtZXRob2QsIHJvdXRlLCBoYW5kbGVyKSB7XG4gICAgICAgIC8vIFVubGlrZSBtb3N0IHJvdXRlcnMsIGNvbm5lY3Qtcm91dGUgZG9lc24ndCBsb29rIGF0IHRoZSBhcmd1bWVudHMgbGVuZ3RoXG4gICAgICAgIG9sZEFkZC5jYWxsKHRoaXMsIG1ldGhvZCwgcm91dGUsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBpZiAoYXJndW1lbnRzWzBdICYmIGFyZ3VtZW50c1swXS5fX2thZGlyYUluZm8pIHtcbiAgICAgICAgICAgIGFyZ3VtZW50c1swXS5fX2thZGlyYUluZm8uc3VnZ2VzdGVkUm91dGVOYW1lID0gcm91dGU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaGFuZGxlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfSk7XG4gIH0pO1xufVxuIiwiaW1wb3J0IHsgV2ViQXBwSW50ZXJuYWxzLCBXZWJBcHAgfSBmcm9tICdtZXRlb3Ivd2ViYXBwJztcbmltcG9ydCBGaWJlcnMgZnJvbSAnZmliZXJzJztcblxuLy8gTWF4aW11bSBjb250ZW50LWxlbmd0aCBzaXplXG5jb25zdCBNQVhfQk9EWV9TSVpFID0gODAwMDtcbi8vIE1heGltdW0gY2hhcmFjdGVycyBmb3Igc3RyaW5naWZpZWQgYm9keVxuY29uc3QgTUFYX1NUUklOR0lGSUVEX0JPRFlfU0laRSA9IDQwMDA7XG5cbmNvbnN0IGNhbldyYXBTdGF0aWNIYW5kbGVyID0gISFXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNCeUFyY2g7XG5cbi8vIFRoaXMgY2hlY2tzIGlmIHJ1bm5pbmcgb24gYSB2ZXJzaW9uIG9mIE1ldGVvciB0aGF0XG4vLyB3cmFwcyBjb25uZWN0IGhhbmRsZXJzIGluIGEgZmliZXIuXG4vLyBUaGlzIGNoZWNrIGlzIGRlcGVuZGFudCBvbiBNZXRlb3IncyBpbXBsZW1lbnRhdGlvbiBvZiBgdXNlYCxcbi8vIHdoaWNoIHdyYXBzIGV2ZXJ5IGhhbmRsZXIgaW4gYSBuZXcgZmliZXIuXG4vLyBUaGlzIHdpbGwgbmVlZCB0byBiZSB1cGRhdGVkIGlmIE1ldGVvciBzdGFydHMgcmV1c2luZ1xuLy8gZmliZXJzIHdoZW4gdGhleSBleGlzdC5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0hhbmRsZXJzSW5GaWJlciAoKSB7XG4gIGNvbnN0IGhhbmRsZXJzTGVuZ3RoID0gV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy5zdGFjay5sZW5ndGg7XG4gIGxldCBpbkZpYmVyID0gZmFsc2U7XG4gIGxldCBvdXRzaWRlRmliZXIgPSBGaWJlcnMuY3VycmVudDtcblxuICBXZWJBcHAucmF3Q29ubmVjdEhhbmRsZXJzLnVzZSgoX3JlcSwgX3JlcywgbmV4dCkgPT4ge1xuICAgIGluRmliZXIgPSBGaWJlcnMuY3VycmVudCAmJiBGaWJlcnMuY3VycmVudCAhPT0gb3V0c2lkZUZpYmVyO1xuXG4gICAgLy8gaW4gY2FzZSB3ZSBkaWRuJ3Qgc3VjY2Vzc2Z1bGx5IHJlbW92ZSB0aGlzIGhhbmRsZXJcbiAgICAvLyBhbmQgaXQgaXMgYSByZWFsIHJlcXVlc3RcbiAgICBuZXh0KCk7XG4gIH0pO1xuXG4gIGlmIChXZWJBcHAucmF3Q29ubmVjdEhhbmRsZXJzLnN0YWNrW2hhbmRsZXJzTGVuZ3RoXSkge1xuICAgIGxldCBoYW5kbGVyID0gV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy5zdGFja1toYW5kbGVyc0xlbmd0aF0uaGFuZGxlO1xuXG4gICAgLy8gcmVtb3ZlIHRoZSBuZXdseSBhZGRlZCBoYW5kbGVyXG4gICAgLy8gV2UgcmVtb3ZlIGl0IGltbWVkaWF0ZWx5IHNvIHRoZXJlIGlzIG5vIG9wcG9ydHVuaXR5IGZvclxuICAgIC8vIG90aGVyIGNvZGUgdG8gYWRkIGhhbmRsZXJzIGZpcnN0IGlmIHRoZSBjdXJyZW50IGZpYmVyIGlzIHlpZWxkZWRcbiAgICAvLyB3aGlsZSBydW5uaW5nIHRoZSBoYW5kbGVyXG4gICAgd2hpbGUgKFdlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMuc3RhY2subGVuZ3RoID4gaGFuZGxlcnNMZW5ndGgpIHtcbiAgICAgIFdlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMuc3RhY2sucG9wKCk7XG4gICAgfVxuXG4gICAgaGFuZGxlcih7fSwge30sICgpID0+IHt9KTtcbiAgfVxuXG4gIHJldHVybiBpbkZpYmVyO1xufVxuXG5jb25zdCBJbmZvU3ltYm9sID0gU3ltYm9sKCdNb250aUluZm9TeW1ib2wnKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyYXBXZWJBcHAgKCkge1xuICBpZiAoIWNoZWNrSGFuZGxlcnNJbkZpYmVyKCkgfHwgIWNhbldyYXBTdGF0aWNIYW5kbGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgcGFyc2VVcmwgPSByZXF1aXJlKCdwYXJzZXVybCcpO1xuXG4gIFdlYkFwcEludGVybmFscy5yZWdpc3RlckJvaWxlcnBsYXRlRGF0YUNhbGxiYWNrKCdfX21vbnRpQXBtUm91dGVOYW1lJywgZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAvLyBUT0RPOiByZWNvcmQgaW4gdHJhY2Ugd2hpY2ggYXJjaCBpcyB1c2VkXG5cbiAgICBpZiAocmVxdWVzdFtJbmZvU3ltYm9sXSkge1xuICAgICAgcmVxdWVzdFtJbmZvU3ltYm9sXS5pc0FwcFJvdXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBMZXQgV2ViQXBwIGtub3cgd2UgZGlkbid0IG1ha2UgY2hhbmdlc1xuICAgIC8vIHNvIGl0IGNhbiB1c2UgYSBjYWNoZVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSk7XG5cbiAgLy8gV2Ugd2FudCB0aGUgcmVxdWVzdCBvYmplY3QgcmV0dXJuZWQgYnkgY2F0ZWdvcml6ZVJlcXVlc3QgdG8gaGF2ZVxuICAvLyBfX2thZGlyYUluZm9cbiAgbGV0IG9yaWdDYXRlZ29yaXplUmVxdWVzdCA9IFdlYkFwcC5jYXRlZ29yaXplUmVxdWVzdDtcbiAgV2ViQXBwLmNhdGVnb3JpemVSZXF1ZXN0ID0gZnVuY3Rpb24gKHJlcSkge1xuICAgIGxldCByZXN1bHQgPSBvcmlnQ2F0ZWdvcml6ZVJlcXVlc3QuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgIGlmIChyZXN1bHQgJiYgcmVxLl9fa2FkaXJhSW5mbykge1xuICAgICAgcmVzdWx0W0luZm9TeW1ib2xdID0gcmVxLl9fa2FkaXJhSW5mbztcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIC8vIEFkZGluZyB0aGUgaGFuZGxlciBkaXJlY3RseSB0byB0aGUgc3RhY2tcbiAgLy8gdG8gZm9yY2UgaXQgdG8gYmUgdGhlIGZpcnN0IG9uZSB0byBydW5cbiAgV2ViQXBwLnJhd0Nvbm5lY3RIYW5kbGVycy5zdGFjay51bnNoaWZ0KHtcbiAgICByb3V0ZTogJycsXG4gICAgaGFuZGxlOiAocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBwYXJzZVVybChyZXEpLnBhdGhuYW1lO1xuICAgICAgY29uc3QgdHJhY2UgPSBLYWRpcmEudHJhY2VyLnN0YXJ0KGAke3JlcS5tZXRob2R9LSR7bmFtZX1gLCAnaHR0cCcpO1xuXG4gICAgICBjb25zdCBoZWFkZXJzID0gS2FkaXJhLnRyYWNlci5fYXBwbHlPYmplY3RGaWx0ZXJzKHJlcS5oZWFkZXJzKTtcbiAgICAgIEthZGlyYS50cmFjZXIuZXZlbnQodHJhY2UsICdzdGFydCcsIHtcbiAgICAgICAgdXJsOiByZXEudXJsLFxuICAgICAgICBtZXRob2Q6IHJlcS5tZXRob2QsXG4gICAgICAgIGhlYWRlcnM6IEpTT04uc3RyaW5naWZ5KGhlYWRlcnMpLFxuICAgICAgfSk7XG4gICAgICByZXEuX19rYWRpcmFJbmZvID0geyB0cmFjZSB9O1xuXG4gICAgICByZXMub24oJ2ZpbmlzaCcsICgpID0+IHtcbiAgICAgICAgaWYgKHJlcS5fX2thZGlyYUluZm8uYXN5bmNFdmVudCkge1xuICAgICAgICAgIEthZGlyYS50cmFjZXIuZXZlbnRFbmQodHJhY2UsIHJlcS5fX2thZGlyYUluZm8uYXN5bmNFdmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBLYWRpcmEudHJhY2VyLmVuZExhc3RFdmVudCh0cmFjZSk7XG5cbiAgICAgICAgaWYgKHJlcS5fX2thZGlyYUluZm8uaXNTdGF0aWMpIHtcbiAgICAgICAgICB0cmFjZS5uYW1lID0gYCR7cmVxLm1ldGhvZH0tPHN0YXRpYyBmaWxlPmA7XG4gICAgICAgIH0gZWxzZSBpZiAocmVxLl9fa2FkaXJhSW5mby5zdWdnZXN0ZWRSb3V0ZU5hbWUpIHtcbiAgICAgICAgICB0cmFjZS5uYW1lID0gYCR7cmVxLm1ldGhvZH0tJHtyZXEuX19rYWRpcmFJbmZvLnN1Z2dlc3RlZFJvdXRlTmFtZX1gO1xuICAgICAgICB9IGVsc2UgaWYgKHJlcS5fX2thZGlyYUluZm8uaXNBcHBSb3V0ZSkge1xuICAgICAgICAgIHRyYWNlLm5hbWUgPSBgJHtyZXEubWV0aG9kfS08YXBwPmA7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpc0pzb24gPSByZXEuaGVhZGVyc1snY29udGVudC10eXBlJ10gPT09ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgICAgICAgY29uc3QgaGFzU21hbGxCb2R5ID0gcmVxLmhlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ10gPiAwICYmIHJlcS5oZWFkZXJzWydjb250ZW50LWxlbmd0aCddIDwgTUFYX0JPRFlfU0laRTtcblxuICAgICAgICAvLyBDaGVjayBhZnRlciBhbGwgbWlkZGxld2FyZSBoYXZlIHJ1biB0byBzZWUgaWYgYW55IG9mIHRoZW1cbiAgICAgICAgLy8gc2V0IHJlcS5ib2R5XG4gICAgICAgIC8vIFRlY2huaWNhbGx5IGJvZGllcyBjYW4gYmUgdXNlZCB3aXRoIGFueSBtZXRob2QsIGJ1dCBzaW5jZSBtYW55IGxvYWQgYmFsYW5jZXJzIGFuZFxuICAgICAgICAvLyBvdGhlciBzb2Z0d2FyZSBvbmx5IHN1cHBvcnQgYm9kaWVzIGZvciBQT1NUIHJlcXVlc3RzLCB3ZSBhcmVcbiAgICAgICAgLy8gbm90IHJlY29yZGluZyB0aGUgYm9keSBmb3Igb3RoZXIgbWV0aG9kcy5cbiAgICAgICAgaWYgKHJlcS5tZXRob2QgPT09ICdQT1NUJyAmJiByZXEuYm9keSAmJiBpc0pzb24gJiYgaGFzU21hbGxCb2R5KSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBib2R5ID0gSlNPTi5zdHJpbmdpZnkocmVxLmJvZHkpO1xuXG4gICAgICAgICAgICAvLyBDaGVjayB0aGUgYm9keSBzaXplIGFnYWluIGluIGNhc2UgaXQgaXMgbXVjaFxuICAgICAgICAgICAgLy8gbGFyZ2VyIHRoYW4gd2hhdCB3YXMgaW4gdGhlIGNvbnRlbnQtbGVuZ3RoIGhlYWRlclxuICAgICAgICAgICAgaWYgKGJvZHkubGVuZ3RoIDwgTUFYX1NUUklOR0lGSUVEX0JPRFlfU0laRSkge1xuICAgICAgICAgICAgICB0cmFjZS5ldmVudHNbMF0uZGF0YS5ib2R5ID0gYm9keTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgLy8gSXQgaXMgb2theSBpZiB0aGlzIGZhaWxzXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETzogcmVjb3JkIHN0YXR1cyBjb2RlXG4gICAgICAgIEthZGlyYS50cmFjZXIuZXZlbnQodHJhY2UsICdjb21wbGV0ZScpO1xuICAgICAgICBsZXQgYnVpbHQgPSBLYWRpcmEudHJhY2VyLmJ1aWxkVHJhY2UodHJhY2UpO1xuICAgICAgICBLYWRpcmEubW9kZWxzLmh0dHAucHJvY2Vzc1JlcXVlc3QoYnVpbHQsIHJlcSwgcmVzKTtcbiAgICAgIH0pO1xuXG4gICAgICBuZXh0KCk7XG4gICAgfVxuICB9KTtcblxuXG4gIGZ1bmN0aW9uIHdyYXBIYW5kbGVyIChoYW5kbGVyKSB7XG4gICAgLy8gY29ubmVjdCBpZGVudGlmaWVzIGVycm9yIGhhbmRsZXMgYnkgdGhlbSBhY2NlcHRpbmdcbiAgICAvLyBmb3VyIGFyZ3VtZW50c1xuICAgIGxldCBlcnJvckhhbmRsZXIgPSBoYW5kbGVyLmxlbmd0aCA9PT0gNDtcblxuICAgIGZ1bmN0aW9uIHdyYXBwZXIgKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICBsZXQgZXJyb3I7XG4gICAgICBpZiAoZXJyb3JIYW5kbGVyKSB7XG4gICAgICAgIGVycm9yID0gcmVxO1xuICAgICAgICByZXEgPSByZXM7XG4gICAgICAgIHJlcyA9IG5leHQ7XG4gICAgICAgIG5leHQgPSBhcmd1bWVudHNbM107XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGthZGlyYUluZm8gPSByZXEuX19rYWRpcmFJbmZvO1xuICAgICAgS2FkaXJhLl9zZXRJbmZvKGthZGlyYUluZm8pO1xuXG4gICAgICBsZXQgbmV4dENhbGxlZCA9IGZhbHNlO1xuICAgICAgLy8gVE9ETzogdHJhY2sgZXJyb3JzIHBhc3NlZCB0byBuZXh0IG9yIHRocm93blxuICAgICAgZnVuY3Rpb24gd3JhcHBlZE5leHQgKC4uLmFyZ3MpIHtcbiAgICAgICAgaWYgKGthZGlyYUluZm8gJiYga2FkaXJhSW5mby5hc3luY0V2ZW50KSB7XG4gICAgICAgICAgS2FkaXJhLnRyYWNlci5ldmVudEVuZChyZXEuX19rYWRpcmFJbmZvLnRyYWNlLCByZXEuX19rYWRpcmFJbmZvLmFzeW5jRXZlbnQpO1xuICAgICAgICAgIHJlcS5fX2thZGlyYUluZm8uYXN5bmNFdmVudCA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBuZXh0Q2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgbmV4dCguLi5hcmdzKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHBvdGVudGlhbFByb21pc2U7XG5cbiAgICAgIGlmIChlcnJvckhhbmRsZXIpIHtcbiAgICAgICAgcG90ZW50aWFsUHJvbWlzZSA9IGhhbmRsZXIuY2FsbCh0aGlzLCBlcnJvciwgcmVxLCByZXMsIHdyYXBwZWROZXh0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBvdGVudGlhbFByb21pc2UgPSBoYW5kbGVyLmNhbGwodGhpcywgcmVxLCByZXMsIHdyYXBwZWROZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHBvdGVudGlhbFByb21pc2UgJiYgdHlwZW9mIHBvdGVudGlhbFByb21pc2UudGhlbiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBwb3RlbnRpYWxQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIHJlcy5maW5pc2hlZCBpcyBkZXByZWNpYXRlZCBpbiBOb2RlIDEzLCBidXQgaXQgaXMgdGhlIG9ubHkgb3B0aW9uXG4gICAgICAgICAgLy8gZm9yIE5vZGUgMTIuOSBhbmQgb2xkZXIuXG4gICAgICAgICAgaWYgKGthZGlyYUluZm8gJiYgIXJlcy5maW5pc2hlZCAmJiAhbmV4dENhbGxlZCkge1xuICAgICAgICAgICAgY29uc3QgbGFzdEV2ZW50ID0gS2FkaXJhLnRyYWNlci5nZXRMYXN0RXZlbnQoa2FkaXJhSW5mby50cmFjZSk7XG4gICAgICAgICAgICBpZiAobGFzdEV2ZW50LmVuZEF0KSB7XG4gICAgICAgICAgICAgIC8vIHJlcSBpcyBub3QgZG9uZSwgYW5kIG5leHQgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgICAgICAgICAgICAvLyBjcmVhdGUgYW4gYXN5bmMgZXZlbnQgdGhhdCB3aWxsIGVuZCB3aGVuIGVpdGhlciBvZiB0aG9zZSBoYXBwZW5zXG4gICAgICAgICAgICAgIGthZGlyYUluZm8uYXN5bmNFdmVudCA9IEthZGlyYS50cmFjZXIuZXZlbnQoa2FkaXJhSW5mby50cmFjZSwgJ2FzeW5jJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBvdGVudGlhbFByb21pc2U7XG4gICAgfVxuXG4gICAgaWYgKGVycm9ySGFuZGxlcikge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uIChlcnJvciwgcmVxLCByZXMsIG5leHQpIHtcbiAgICAgICAgcmV0dXJuIHdyYXBwZXIoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KTtcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiAocmVxLCByZXMsIG5leHQpIHtcbiAgICAgIHJldHVybiB3cmFwcGVyKHJlcSwgcmVzLCBuZXh0KTtcbiAgICB9O1xuICB9XG5cbiAgZnVuY3Rpb24gd3JhcENvbm5lY3QgKGFwcCwgd3JhcFN0YWNrKSB7XG4gICAgbGV0IG9sZFVzZSA9IGFwcC51c2U7XG4gICAgaWYgKHdyYXBTdGFjaykge1xuICAgICAgLy8gV2UgbmVlZCB0byBzZXQga2FkaXJhSW5mbyBvbiB0aGUgRmliZXIgdGhlIGhhbmRsZXIgd2lsbCBydW4gaW4uXG4gICAgICAvLyBNZXRlb3IgaGFzIGFscmVhZHkgd3JhcHBlZCB0aGUgaGFuZGxlciB0byBydW4gaXQgaW4gYSBuZXcgRmliZXJcbiAgICAgIC8vIGJ5IHVzaW5nIFByb21pc2UuYXN5bmNBcHBseSBzbyB3ZSBhcmUgbm90IGFibGUgdG8gZGlyZWN0bHkgc2V0IGl0XG4gICAgICAvLyBvbiB0aGF0IEZpYmVyLlxuICAgICAgLy8gTWV0ZW9yJ3MgcHJvbWlzZSBsaWJyYXJ5IGNvcGllcyBwcm9wZXJ0aWVzIGZyb20gdGhlIGN1cnJlbnQgZmliZXIgdG9cbiAgICAgIC8vIHRoZSBuZXcgZmliZXIsIHNvIHdlIGNhbiB3cmFwIGl0IGluIGFub3RoZXIgRmliZXIgd2l0aCBrYWRpcmFJbmZvIHNldFxuICAgICAgLy8gYW5kIE1ldGVvciB3aWxsIGNvcHkga2FkaXJhSW5mbyB0byB0aGUgbmV3IEZpYmVyLlxuICAgICAgLy8gSXQgd2lsbCBvbmx5IGNyZWF0ZSB0aGUgYWRkaXRpb25hbCBGaWJlciBpZiBpdCBpc24ndCBhbHJlYWR5IHJ1bm5pbmcgaW4gYSBGaWJlclxuICAgICAgYXBwLnN0YWNrLmZvckVhY2goZW50cnkgPT4ge1xuICAgICAgICBsZXQgd3JhcHBlZEhhbmRsZXIgPSB3cmFwSGFuZGxlcihlbnRyeS5oYW5kbGUpO1xuICAgICAgICBpZiAoZW50cnkuaGFuZGxlLmxlbmd0aCA+PSA0KSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzLGhhbmRsZS1jYWxsYmFjay1lcnJcbiAgICAgICAgICBlbnRyeS5oYW5kbGUgPSBmdW5jdGlvbiAoZXJyb3IsIHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hc3luY0FwcGx5KFxuICAgICAgICAgICAgICB3cmFwcGVkSGFuZGxlcixcbiAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgYXJndW1lbnRzLFxuICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG4gICAgICAgICAgZW50cnkuaGFuZGxlID0gZnVuY3Rpb24gKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hc3luY0FwcGx5KFxuICAgICAgICAgICAgICB3cmFwcGVkSGFuZGxlcixcbiAgICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgICAgYXJndW1lbnRzLFxuICAgICAgICAgICAgICB0cnVlXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBhcHAudXNlID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgICAgIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9IHdyYXBIYW5kbGVyKGFyZ3NbYXJncy5sZW5ndGggLSAxXSk7XG4gICAgICByZXR1cm4gb2xkVXNlLmFwcGx5KGFwcCwgYXJncyk7XG4gICAgfTtcbiAgfVxuXG4gIHdyYXBDb25uZWN0KFdlYkFwcC5yYXdDb25uZWN0SGFuZGxlcnMsIGZhbHNlKTtcbiAgd3JhcENvbm5lY3QoV2ViQXBwSW50ZXJuYWxzLm1ldGVvckludGVybmFsSGFuZGxlcnMsIGZhbHNlKTtcblxuICAvLyBUaGUgb2F1dGggcGFja2FnZSBhbmQgb3RoZXIgY29yZSBwYWNrYWdlcyBtaWdodCBoYXZlIGFscmVhZHkgYWRkZWQgdGhlaXIgbWlkZGxld2FyZSxcbiAgLy8gc28gd2UgbmVlZCB0byB3cmFwIHRoZSBleGlzdGluZyBtaWRkbGV3YXJlXG4gIHdyYXBDb25uZWN0KFdlYkFwcC5jb25uZWN0SGFuZGxlcnMsIHRydWUpO1xuXG4gIHdyYXBDb25uZWN0KFdlYkFwcC5jb25uZWN0QXBwLCBmYWxzZSk7XG5cbiAgbGV0IG9sZFN0YXRpY0ZpbGVzTWlkZGxld2FyZSA9IFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc01pZGRsZXdhcmU7XG4gIGNvbnN0IHN0YXRpY0hhbmRsZXIgPSB3cmFwSGFuZGxlcihvbGRTdGF0aWNGaWxlc01pZGRsZXdhcmUuYmluZChXZWJBcHBJbnRlcm5hbHMsIFdlYkFwcEludGVybmFscy5zdGF0aWNGaWxlc0J5QXJjaCkpO1xuICBXZWJBcHBJbnRlcm5hbHMuc3RhdGljRmlsZXNNaWRkbGV3YXJlID0gZnVuY3Rpb24gKF9zdGF0aWNGaWxlcywgcmVxLCByZXMsIG5leHQpIHtcbiAgICBpZiAocmVxLl9fa2FkaXJhSW5mbykge1xuICAgICAgcmVxLl9fa2FkaXJhSW5mby5pc1N0YXRpYyA9IHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRpY0hhbmRsZXIocmVxLCByZXMsIGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIGlmIHRoZSByZXF1ZXN0IGlzIGZvciBhIHN0YXRpYyBmaWxlLCB0aGUgc3RhdGljIGhhbmRsZXIgd2lsbCBlbmQgdGhlIHJlc3BvbnNlXG4gICAgICAvLyBpbnN0ZWFkIG9mIGNhbGxpbmcgbmV4dFxuICAgICAgcmVxLl9fa2FkaXJhSW5mby5pc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgcmV0dXJuIG5leHQuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9KTtcbiAgfTtcbn1cbiIsImZ1bmN0aW9uIG5vcm1hbGl6ZWRQcmVmaXggKG5hbWUpIHtcbiAgcmV0dXJuIG5hbWUucmVwbGFjZSgnS0FESVJBXycsICdNT05USV8nKTtcbn1cblxuS2FkaXJhLl9wYXJzZUVudiA9IGZ1bmN0aW9uIChlbnYpIHtcbiAgbGV0IG9wdGlvbnMgPSB7fTtcbiAgZm9yIChsZXQgbmFtZSBpbiBlbnYpIHtcbiAgICBsZXQgdmFsdWUgPSBlbnZbbmFtZV07XG4gICAgbGV0IG5vcm1hbGl6ZWROYW1lID0gbm9ybWFsaXplZFByZWZpeChuYW1lKTtcbiAgICBsZXQgaW5mbyA9IEthZGlyYS5fcGFyc2VFbnYuX29wdGlvbnNbbm9ybWFsaXplZE5hbWVdO1xuXG4gICAgaWYgKGluZm8gJiYgdmFsdWUpIHtcbiAgICAgIG9wdGlvbnNbaW5mby5uYW1lXSA9IGluZm8ucGFyc2VyKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucztcbn07XG5cblxuS2FkaXJhLl9wYXJzZUVudi5wYXJzZUludCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgbGV0IG51bSA9IHBhcnNlSW50KHN0ciwgMTApO1xuICBpZiAobnVtIHx8IG51bSA9PT0gMCkge1xuICAgIHJldHVybiBudW07XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBLYWRpcmE6IE1hdGNoIEVycm9yOiBcIiR7bnVtfVwiIGlzIG5vdCBhIG51bWJlcmApO1xufTtcblxuXG5LYWRpcmEuX3BhcnNlRW52LnBhcnNlQm9vbCA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgc3RyID0gc3RyLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChzdHIgPT09ICd0cnVlJykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIGlmIChzdHIgPT09ICdmYWxzZScpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdGhyb3cgbmV3IEVycm9yKGBLYWRpcmE6IE1hdGNoIEVycm9yOiAke3N0cn0gaXMgbm90IGEgYm9vbGVhbmApO1xufTtcblxuXG5LYWRpcmEuX3BhcnNlRW52LnBhcnNlVXJsID0gZnVuY3Rpb24gKHN0cikge1xuICByZXR1cm4gc3RyO1xufTtcblxuXG5LYWRpcmEuX3BhcnNlRW52LnBhcnNlU3RyaW5nID0gZnVuY3Rpb24gKHN0cikge1xuICByZXR1cm4gc3RyO1xufTtcblxuXG5LYWRpcmEuX3BhcnNlRW52Ll9vcHRpb25zID0ge1xuICAvLyBhdXRoXG4gIE1PTlRJX0FQUF9JRDoge1xuICAgIG5hbWU6ICdhcHBJZCcsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlU3RyaW5nXG4gIH0sXG4gIE1PTlRJX0FQUF9TRUNSRVQ6IHtcbiAgICBuYW1lOiAnYXBwU2VjcmV0JyxcbiAgICBwYXJzZXI6IEthZGlyYS5fcGFyc2VFbnYucGFyc2VTdHJpbmdcbiAgfSxcbiAgTU9OVElfT1BUSU9OU19TVEFMTEVEX1RJTUVPVVQ6IHtcbiAgICBuYW1lOiAnc3RhbGxlZFRpbWVvdXQnLFxuICAgIHBhcnNlcjogS2FkaXJhLl9wYXJzZUVudi5wYXJzZUludCxcbiAgfSxcbiAgLy8gZGVsYXkgdG8gc2VuZCB0aGUgaW5pdGlhbCBwaW5nIHRvIHRoZSBrYWRpcmEgZW5naW5lIGFmdGVyIHBhZ2UgbG9hZHNcbiAgTU9OVElfT1BUSU9OU19DTElFTlRfRU5HSU5FX1NZTkNfREVMQVk6IHtcbiAgICBuYW1lOiAnY2xpZW50RW5naW5lU3luY0RlbGF5JyxcbiAgICBwYXJzZXI6IEthZGlyYS5fcGFyc2VFbnYucGFyc2VJbnQsXG4gIH0sXG4gIC8vIHRpbWUgYmV0d2VlbiBzZW5kaW5nIGVycm9ycyB0byB0aGUgZW5naW5lXG4gIE1PTlRJX09QVElPTlNfRVJST1JfRFVNUF9JTlRFUlZBTDoge1xuICAgIG5hbWU6ICdlcnJvckR1bXBJbnRlcnZhbCcsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlSW50LFxuICB9LFxuICAvLyBubyBvZiBlcnJvcnMgYWxsb3dlZCBpbiBhIGdpdmVuIGludGVydmFsXG4gIE1PTlRJX09QVElPTlNfTUFYX0VSUk9SU19QRVJfSU5URVJWQUw6IHtcbiAgICBuYW1lOiAnbWF4RXJyb3JzUGVySW50ZXJ2YWwnLFxuICAgIHBhcnNlcjogS2FkaXJhLl9wYXJzZUVudi5wYXJzZUludCxcbiAgfSxcbiAgLy8gYSB6b25lLmpzIHNwZWNpZmljIG9wdGlvbiB0byBjb2xsZWN0IHRoZSBmdWxsIHN0YWNrIHRyYWNlKHdoaWNoIGlzIG5vdCBtdWNoIHVzZWZ1bClcbiAgTU9OVElfT1BUSU9OU19DT0xMRUNUX0FMTF9TVEFDS1M6IHtcbiAgICBuYW1lOiAnY29sbGVjdEFsbFN0YWNrcycsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlQm9vbCxcbiAgfSxcbiAgLy8gZW5hYmxlIGVycm9yIHRyYWNraW5nICh3aGljaCBpcyB0dXJuZWQgb24gYnkgZGVmYXVsdClcbiAgTU9OVElfT1BUSU9OU19FTkFCTEVfRVJST1JfVFJBQ0tJTkc6IHtcbiAgICBuYW1lOiAnZW5hYmxlRXJyb3JUcmFja2luZycsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlQm9vbCxcbiAgfSxcbiAgTU9OVElfT1BUSU9OU19ESVNBQkxFX0NMSUVOVF9FUlJPUl9UUkFDS0lORzoge1xuICAgIG5hbWU6ICdkaXNhYmxlQ2xpZW50RXJyb3JUcmFja2luZycsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlQm9vbCxcbiAgfSxcbiAgLy8ga2FkaXJhIGVuZ2luZSBlbmRwb2ludFxuICBNT05USV9PUFRJT05TX0VORFBPSU5UOiB7XG4gICAgbmFtZTogJ2VuZHBvaW50JyxcbiAgICBwYXJzZXI6IEthZGlyYS5fcGFyc2VFbnYucGFyc2VVcmwsXG4gIH0sXG4gIC8vIGRlZmluZSB0aGUgaG9zdG5hbWUgb2YgdGhlIGN1cnJlbnQgcnVubmluZyBwcm9jZXNzXG4gIE1PTlRJX09QVElPTlNfSE9TVE5BTUU6IHtcbiAgICBuYW1lOiAnaG9zdG5hbWUnLFxuICAgIHBhcnNlcjogS2FkaXJhLl9wYXJzZUVudi5wYXJzZVN0cmluZyxcbiAgfSxcbiAgLy8gaW50ZXJ2YWwgYmV0d2VlbiBzZW5kaW5nIGRhdGEgdG8gdGhlIGthZGlyYSBlbmdpbmUgZnJvbSB0aGUgc2VydmVyXG4gIE1PTlRJX09QVElPTlNfUEFZTE9BRF9USU1FT1VUOiB7XG4gICAgbmFtZTogJ3BheWxvYWRUaW1lb3V0JyxcbiAgICBwYXJzZXI6IEthZGlyYS5fcGFyc2VFbnYucGFyc2VJbnQsXG4gIH0sXG4gIC8vIHNldCBIVFRQL0hUVFBTIHByb3h5XG4gIE1PTlRJX09QVElPTlNfUFJPWFk6IHtcbiAgICBuYW1lOiAncHJveHknLFxuICAgIHBhcnNlcjogS2FkaXJhLl9wYXJzZUVudi5wYXJzZVVybCxcbiAgfSxcbiAgLy8gbnVtYmVyIG9mIGl0ZW1zIGNhY2hlZCBmb3IgdHJhY2tpbmcgZG9jdW1lbnQgc2l6ZVxuICBNT05USV9PUFRJT05TX0RPQ1VNRU5UX1NJWkVfQ0FDSEVfU0laRToge1xuICAgIG5hbWU6ICdkb2N1bWVudFNpemVDYWNoZVNpemUnLFxuICAgIHBhcnNlcjogS2FkaXJhLl9wYXJzZUVudi5wYXJzZUludCxcbiAgfSxcbiAgLy8gZW5hYmxlIHVwbG9hZGluZyBzb3VyY2VtYXBzXG4gIE1PTlRJX1VQTE9BRF9TT1VSQ0VfTUFQUzoge1xuICAgIG5hbWU6ICd1cGxvYWRTb3VyY2VNYXBzJyxcbiAgICBwYXJzZXI6IEthZGlyYS5fcGFyc2VFbnYucGFyc2VCb29sXG4gIH0sXG4gIE1PTlRJX1JFQ09SRF9JUF9BRERSRVNTOiB7XG4gICAgbmFtZTogJ3JlY29yZElQQWRkcmVzcycsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlU3RyaW5nLFxuICB9LFxuICBNT05USV9FVkVOVF9TVEFDS19UUkFDRToge1xuICAgIG5hbWU6ICdldmVudFN0YWNrVHJhY2UnLFxuICAgIHBhcnNlcjogS2FkaXJhLl9wYXJzZUVudi5wYXJzZUJvb2wsXG4gIH0sXG4gIE1PTlRJX09QVElPTlNfRElTQUJMRV9OVFA6IHtcbiAgICBuYW1lOiAnZGlzYWJsZU50cCcsXG4gICAgcGFyc2VyOiBLYWRpcmEuX3BhcnNlRW52LnBhcnNlQm9vbCxcbiAgfSxcbn07XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuS2FkaXJhLl9jb25uZWN0V2l0aEVudiA9IGZ1bmN0aW9uICgpIHtcbiAgY29uc3Qgb3B0aW9ucyA9IEthZGlyYS5fcGFyc2VFbnYocHJvY2Vzcy5lbnYpO1xuICBpZiAob3B0aW9ucy5hcHBJZCAmJiBvcHRpb25zLmFwcFNlY3JldCkge1xuICAgIEthZGlyYS5jb25uZWN0KFxuICAgICAgb3B0aW9ucy5hcHBJZCxcbiAgICAgIG9wdGlvbnMuYXBwU2VjcmV0LFxuICAgICAgb3B0aW9uc1xuICAgICk7XG5cbiAgICBLYWRpcmEuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignS2FkaXJhIGhhcyBiZWVuIGFscmVhZHkgY29ubmVjdGVkIHVzaW5nIGNyZWRlbnRpYWxzIGZyb20gRW52aXJvbm1lbnQgVmFyaWFibGVzJyk7XG4gICAgfTtcbiAgfVxufTtcblxuXG5LYWRpcmEuX2Nvbm5lY3RXaXRoU2V0dGluZ3MgPSBmdW5jdGlvbiAoKSB7XG4gIGNvbnN0IG1vbnRpU2V0dGluZ3MgPSBNZXRlb3Iuc2V0dGluZ3MubW9udGkgfHwgTWV0ZW9yLnNldHRpbmdzLmthZGlyYTtcblxuICBpZiAoXG4gICAgbW9udGlTZXR0aW5ncyAmJlxuICAgIG1vbnRpU2V0dGluZ3MuYXBwSWQgJiZcbiAgICBtb250aVNldHRpbmdzLmFwcFNlY3JldFxuICApIHtcbiAgICBLYWRpcmEuY29ubmVjdChcbiAgICAgIG1vbnRpU2V0dGluZ3MuYXBwSWQsXG4gICAgICBtb250aVNldHRpbmdzLmFwcFNlY3JldCxcbiAgICAgIG1vbnRpU2V0dGluZ3Mub3B0aW9ucyB8fCB7fVxuICAgICk7XG5cbiAgICBLYWRpcmEuY29ubmVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignS2FkaXJhIGhhcyBiZWVuIGFscmVhZHkgY29ubmVjdGVkIHVzaW5nIGNyZWRlbnRpYWxzIGZyb20gTWV0ZW9yLnNldHRpbmdzJyk7XG4gICAgfTtcbiAgfVxufTtcblxuLyoqXG4gKiBXZSBuZWVkIHRvIGluc3RydW1lbnQgdGhpcyByaWdodCBhd2F5LCBhbmQgaXQncyBva2F5XG4gKiBPbmUgcmVhc29uIGZvciB0aGlzIGlzIHRvIGNhbGwgYHNldExhYmVscygpYCBmdW5jdGlvblxuICogT3RoZXJ3aXNlLCBDUFUgcHJvZmlsZSBjYW4ndCBzZWUgYWxsIG91ciBjdXN0b20gbGFiZWxpbmdcbiAqXG4gKiBQcmV2aW91c2x5IHRoZXJlIHdhcyB0d28gbG9nIG1lc3NhZ2VzIChvbmUgZm9yIGluc3RydW1lbnRhdGlvbixcbiAqIGFuZCBhbm90aGVyIGZvciBjb25uZWN0aW9uKSwgdGhpcyB3YXkgd2UgbWVyZ2VkIGJvdGggb2YgdGhlbS5cbiAqL1xuS2FkaXJhLl9zdGFydEluc3RydW1lbnRpbmcoZnVuY3Rpb24gKCkge1xuICBLYWRpcmEuX2Nvbm5lY3RXaXRoRW52KCk7XG4gIEthZGlyYS5fY29ubmVjdFdpdGhTZXR0aW5ncygpO1xufSk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcblxuY29uc3QgY29uZmxpY3RpbmdQYWNrYWdlcyA9IFtcbiAgJ21kZzptZXRlb3ItYXBtLWFnZW50JyxcbiAgJ2xtYWNoZW5zOmthZGlyYScsXG4gICdtZXRlb3JoYWNrczprYWRpcmEnXG5dO1xuXG5NZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gIGNvbmZsaWN0aW5nUGFja2FnZXMuZm9yRWFjaChuYW1lID0+IHtcbiAgICBpZiAobmFtZSBpbiBQYWNrYWdlKSB7XG4gICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgYE1vbnRpIEFQTTogeW91ciBhcHAgaXMgdXNpbmcgdGhlICR7bmFtZX0gcGFja2FnZS4gVXNpbmcgbW9yZSB0aGFuIG9uZSBBUE0gYWdlbnQgaW4gYW4gYXBwIGNhbiBjYXVzZSB1bmV4cGVjdGVkIHByb2JsZW1zLmBcbiAgICAgICk7XG4gICAgfVxuICB9KTtcbn0pO1xuIiwiaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcblxuZnVuY3Rpb24gaXNOb2RlICgpIHtcbiAgcmV0dXJuIHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwcm9jZXNzLnZlcnNpb25zICYmIHByb2Nlc3MudmVyc2lvbnMubm9kZTtcbn1cblxuZnVuY3Rpb24gcG9seWZpbGxOb3cgKCkge1xuICBjb25zdCBbc2Vjb25kcywgbmFub3NlY29uZHNdID0gcHJvY2Vzcy5ocnRpbWUoKTtcblxuICByZXR1cm4gc2Vjb25kcyAqIDEwMDAgKyBuYW5vc2Vjb25kcyAvIDEwMDAwMDA7XG59XG5cbmV4cG9ydCBjbGFzcyBFdmVudExvb3BNb25pdG9yIGV4dGVuZHMgRXZlbnRFbWl0dGVyIHtcbiAgY29uc3RydWN0b3IgKHRpbWVvdXRNaWxsaXMpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMudGltZW91dE1pbGxpcyA9IHRpbWVvdXRNaWxsaXM7XG4gICAgdGhpcy5fd2F0Y2hMYWcgPSB0aGlzLl93YXRjaExhZy5iaW5kKHRoaXMpO1xuICAgIHRoaXMuX3N0b3BwZWQgPSB0cnVlO1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IG51bGw7XG4gICAgdGhpcy5fdG90YWxMYWcgPSAwO1xuXG4gICAgdGhpcy5fcmVnaXN0ZXJOb3dGdW5jKCk7XG4gIH1cblxuICBzdGFydCAoKSB7XG4gICAgdGhpcy5fc3RvcHBlZCA9IGZhbHNlO1xuICAgIHRoaXMuX2xhc3RXYXRjaFRpbWUgPSBudWxsO1xuICAgIHRoaXMuX3N0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5fdG90YWxMYWcgPSAwO1xuXG4gICAgdGhpcy5vbignbGFnJywgdGhpcy5fd2F0Y2hMYWcpO1xuICAgIHRoaXMuX2RldGVjdExhZygpO1xuICB9XG5cbiAgc3RvcCAoKSB7XG4gICAgdGhpcy5fc3RvcHBlZCA9IHRydWU7XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ2xhZycpO1xuICB9XG5cbiAgc3RhdHVzICgpIHtcbiAgICBsZXQgcGN0QmxvY2sgPSAwO1xuICAgIGxldCBlbGFwc2VkVGltZSA9IDA7XG4gICAgaWYgKCF0aGlzLl9zdG9wcGVkICYmIHRoaXMuX2xhc3RXYXRjaFRpbWUpIHtcbiAgICAgIGVsYXBzZWRUaW1lID0gdGhpcy5fbGFzdFdhdGNoVGltZSAtIHRoaXMuX3N0YXJ0VGltZTtcbiAgICAgIHBjdEJsb2NrID0gKHRoaXMuX3RvdGFsTGFnIC8gZWxhcHNlZFRpbWUpICogMTAwO1xuICAgIH1cblxuICAgIGxldCBzdGF0dXNPYmplY3QgPSB7XG4gICAgICBwY3RCbG9jayxcbiAgICAgIGVsYXBzZWRUaW1lLFxuICAgICAgdG90YWxMYWc6IHRoaXMuX3RvdGFsTGFnXG4gICAgfTtcblxuICAgIHRoaXMuX3N0YXJ0VGltZSA9IHRoaXMuX2xhc3RXYXRjaFRpbWU7XG4gICAgdGhpcy5fdG90YWxMYWcgPSAwO1xuXG4gICAgcmV0dXJuIHN0YXR1c09iamVjdDtcbiAgfVxuXG4gIF93YXRjaExhZyAobGFnKSB7XG4gICAgdGhpcy5fbGFzdFdhdGNoVGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5fdG90YWxMYWcgKz0gbGFnO1xuICB9XG5cbiAgX2RldGVjdExhZyAoKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBzdGFydCA9IHNlbGYuX25vdygpO1xuXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICBsZXQgZW5kID0gc2VsZi5fbm93KCk7XG4gICAgICBsZXQgZWxhcHNlZFRpbWUgPSBlbmQgLSBzdGFydDtcbiAgICAgIGxldCByZWFsRGlmZiA9IGVsYXBzZWRUaW1lIC0gc2VsZi50aW1lb3V0TWlsbGlzO1xuICAgICAgbGV0IGxhZyA9IE1hdGgubWF4KDAsIHJlYWxEaWZmKTtcblxuICAgICAgaWYgKCFzZWxmLl9zdG9wcGVkKSB7XG4gICAgICAgIHNlbGYuZW1pdCgnbGFnJywgbGFnKTtcbiAgICAgICAgc2VsZi5fZGV0ZWN0TGFnKCk7XG4gICAgICB9XG4gICAgfSwgc2VsZi50aW1lb3V0TWlsbGlzKTtcbiAgfVxuXG4gIF9yZWdpc3Rlck5vd0Z1bmMgKCkge1xuICAgIGlmIChpc05vZGUoKSkge1xuICAgICAgY29uc3QgW21ham9yXSA9IHByb2Nlc3MudmVyc2lvbnMubm9kZS5zcGxpdCgnLicpLm1hcChOdW1iZXIpO1xuXG4gICAgICBpZiAobWFqb3IgPCA4KSB7XG4gICAgICAgIHRoaXMuX25vdyA9IHBvbHlmaWxsTm93O1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHtcbiAgICAgICAgcGVyZm9ybWFuY2VcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGdsb2JhbC1yZXF1aXJlXG4gICAgICB9ID0gcmVxdWlyZSgncGVyZl9ob29rcycpO1xuICAgICAgdGhpcy5fbm93ID0gcGVyZm9ybWFuY2Uubm93O1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucGVyZm9ybWFuY2UgJiYgd2luZG93LnBlcmZvcm1hbmNlLm5vdykge1xuICAgICAgdGhpcy5fbm93ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdztcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLl9ub3cgPSBEYXRlLm5vdztcbiAgfVxufVxuIl19
