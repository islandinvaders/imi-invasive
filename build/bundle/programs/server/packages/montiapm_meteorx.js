(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var ECMAScript = Package.ecmascript.ECMAScript;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var DDPServer = Package['ddp-server'].DDPServer;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;
var DDP = Package['ddp-client'].DDP;

/* Package-scope variables */
var exposeLivedata, MeteorX;

var require = meteorInstall({"node_modules":{"meteor":{"montiapm:meteorx":{"src":{"livedata.js":function module(){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/montiapm_meteorx/src/livedata.js                                                  //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
exposeLivedata = function (namespace) {
  // instrumenting session
  const fakeSocket = {
    send: function () {},
    close: function () {},
    headers: []
  };
  const ddpConnectMessage = {
    msg: 'connect',
    version: 'pre1',
    support: ['pre1']
  };
  Meteor.server._handleConnect(fakeSocket, ddpConnectMessage);
  if (fakeSocket._meteorSession) {
    // for newer meteor versions
    namespace.Session = fakeSocket._meteorSession.constructor;
    exposeSubscription(fakeSocket._meteorSession, namespace);
    exposeSessionCollectionView(fakeSocket._meteorSession, namespace);
    if (Meteor.server._removeSession) {
      // 1.7 +
      Meteor.server._removeSession(fakeSocket._meteorSession);
    } else if (Meteor.server._closeSession) {
      // 0.7.x +
      Meteor.server._closeSession(fakeSocket._meteorSession);
    } else if (Meteor.server._destroySession) {
      // 0.6.6.x
      Meteor.server._destroySession(fakeSocket._meteorSession);
    }
  } else if (fakeSocket.meteor_session) {
    // support for 0.6.5.x
    namespace.Session = fakeSocket.meteor_session.constructor;

    // instrumenting subscription
    exposeSubscription(fakeSocket.meteor_session, namespace);
    exposeSessionCollectionView(fakeSocket._meteorSession, namespace);
    fakeSocket.meteor_session.detach(fakeSocket);
  } else {
    console.error('expose: session exposing failed');
  }
};
function exposeSubscription(session, namespace) {
  const subId = Random.id();
  const publicationHandler = function () {
    this.ready();
  };
  const pubName = '__dummy_pub_' + Random.id();
  session._startSubscription(publicationHandler, subId, [], pubName);
  const isMap = session._namedSubs instanceof Map;
  const subscription = isMap ? session._namedSubs.get(subId) : session._namedSubs[subId];
  namespace.Subscription = subscription.constructor;

  // cleaning up
  session._stopSubscription(subId);
}
function exposeSessionCollectionView(session, namespace) {
  const documentView = session.getCollectionView();
  namespace.SessionCollectionView = documentView.constructor;
  const id = 'the-id';
  documentView.added('sample-handle', id, {
    aa: 10
  });
  const isMap = documentView.documents instanceof Map;
  const doc = isMap ? documentView.documents.get(id) : documentView.documents[id];
  namespace.SessionDocumentView = doc.constructor;
}
////////////////////////////////////////////////////////////////////////////////////////////////

},"mongo-livedata.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/montiapm_meteorx/src/mongo-livedata.js                                            //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
module.export({
  exposeMongoLivedata: () => exposeMongoLivedata
});
const exposeMongoLivedata = function (MeteorX) {
  let MongoInternals;
  module.link("meteor/mongo", {
    MongoInternals(v) {
      MongoInternals = v;
    }
  }, 0);
  if (!MeteorX._mongoInstalled) return;
  const MongoColl = typeof Mongo !== "undefined" ? Mongo.Collection : Meteor.Collection;
  const coll = new MongoColl("__dummy_coll_" + Random.id());
  // we need wait until db get connected with meteor, .findOne() does that
  coll.findOne();
  MeteorX.MongoConnection = MongoInternals.defaultRemoteCollectionDriver().mongo.constructor;
  const cursor = coll.find();
  MeteorX.MongoCursor = cursor.constructor;
  exposeOplogDriver(MeteorX, coll);
  exposePollingDriver(MeteorX, coll);
  exposeMultiplexer(MeteorX, coll);
  exposeSynchronousCursor(MeteorX, coll);
};
function exposeSynchronousCursor(namespace, coll) {
  const synchronousCursor = _getSynchronousCursor(coll.find({}));
  if (synchronousCursor) {
    namespace.SynchronousCursor = synchronousCursor.constructor;
  }
}
function exposeOplogDriver(namespace, coll) {
  const driver = _getObserverDriver(coll.find({}));
  // verify observer driver is an oplog driver
  if (driver && typeof driver.constructor.cursorSupported === "function") {
    namespace.MongoOplogDriver = driver.constructor;
  }
}
function exposePollingDriver(namespace, coll) {
  const cursor = coll.find({}, {
    limit: 20,
    _disableOplog: true
  });
  const driver = _getObserverDriver(cursor);
  // verify observer driver is a polling driver
  if (driver && typeof driver.constructor.cursorSupported === "undefined") {
    namespace.MongoPollingDriver = driver.constructor;
  }
}
function exposeMultiplexer(namespace, coll) {
  const multiplexer = _getMultiplexer(coll.find({}));
  if (multiplexer) {
    namespace.Multiplexer = multiplexer.constructor;
  }
}
function _getObserverDriver(cursor) {
  const multiplexer = _getMultiplexer(cursor);
  if (multiplexer && multiplexer._observeDriver) {
    return multiplexer._observeDriver;
  }
}
function _getMultiplexer(cursor) {
  const handler = cursor.observeChanges({
    added: Function.prototype
  });
  handler.stop();
  return handler._multiplexer;
}
function _getSynchronousCursor(cursor) {
  cursor.fetch();
  const synchronousCursor = cursor._synchronousCursor;
  if (synchronousCursor) {
    return synchronousCursor;
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////

},"server.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/montiapm_meteorx/src/server.js                                                    //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
let exposeMongoLivedata;
module.link("./mongo-livedata", {
  exposeMongoLivedata(v) {
    exposeMongoLivedata = v;
  }
}, 0);
let runWithAFiber;
module.link("./utils", {
  runWithAFiber(v) {
    runWithAFiber = v;
  }
}, 1);
let exposeMongoAsync;
module.link("./fiberless/mongo", {
  exposeMongoAsync(v) {
    exposeMongoAsync = v;
  }
}, 2);
/**
 * @namespace MeteorX
 */
MeteorX = {};
MeteorX._mongoInstalled = Package.hasOwnProperty("mongo");
MeteorX._readyCallbacks = [];
MeteorX._ready = false;
MeteorX._fibersDisabled = Meteor.isFibersDisabled;
MeteorX.onReady = function (cb) {
  if (MeteorX._ready) {
    return runWithAFiber(cb);
  }
  this._readyCallbacks.push(cb);
};
MeteorX.Server = Meteor.server.constructor;
exposeLivedata(MeteorX);
function initSync() {
  runWithAFiber(() => {
    exposeMongoLivedata(MeteorX);
  });
  MeteorX._readyCallbacks.map(runWithAFiber);
  MeteorX._ready = true;
}
function initAsync() {
  return Promise.asyncApply(() => {
    Promise.await(exposeMongoAsync(MeteorX));
    for (const cb of MeteorX._readyCallbacks) {
      Promise.await(cb());
    }
    MeteorX._ready = true;
  });
}
Meteor.startup(MeteorX._fibersDisabled ? initAsync : initSync);
////////////////////////////////////////////////////////////////////////////////////////////////

},"utils.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/montiapm_meteorx/src/utils.js                                                     //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
module.export({
  runWithAFiber: () => runWithAFiber
});
function runWithAFiber(cb) {
  if (Meteor.isFibersDisabled) {
    cb();
    return;
  }
  const Fibers = require('fibers');
  if (Fibers.current) {
    cb();
  } else {
    new Fiber(cb).run();
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////

},"fiberless":{"mongo.js":function module(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                            //
// packages/montiapm_meteorx/src/fiberless/mongo.js                                           //
//                                                                                            //
////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                              //
module.export({
  exposeMongoAsync: () => exposeMongoAsync
});
let Mongo, MongoInternals;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  },
  MongoInternals(v) {
    MongoInternals = v;
  }
}, 0);
function exposeMongoAsync(MeteorX) {
  return Promise.asyncApply(() => {
    let MongoInternals;
    module.link("meteor/mongo", {
      MongoInternals(v) {
        MongoInternals = v;
      }
    }, 1);
    if (!MeteorX._mongoInstalled) return;
    const coll = _getDummyCollection();
    Promise.await(coll.findOneAsync());
    const driver = MongoInternals.defaultRemoteCollectionDriver();
    MeteorX.MongoConnection = driver.mongo.constructor;
    const cursor = coll.find();
    MeteorX.MongoCursor = cursor.constructor;
    Promise.await(exposeOplogDriver(MeteorX, coll));
    Promise.await(exposePollingDriver(MeteorX, coll));
    Promise.await(exposeMultiplexer(MeteorX, coll));
    Promise.await(exposeSynchronousCursor(MeteorX, coll));
  });
}
function _getDummyCollection() {
  const Collection = typeof Mongo !== "undefined" ? Mongo.Collection : Meteor.Collection;
  return new Collection("__dummy_coll_" + Random.id());
}
function _getSynchronousCursor(cursor) {
  return Promise.asyncApply(() => {
    Promise.await(cursor.fetchAsync());
    return cursor._synchronousCursor || undefined;
  });
}
function _getMultiplexer(cursor) {
  return Promise.asyncApply(() => {
    const handler = Promise.await(cursor.observeChanges({
      added: Function.prototype
    }));
    Promise.await(handler.stop());
    return handler._multiplexer;
  });
}
function _getObserverDriver(cursor) {
  return Promise.asyncApply(() => {
    const multiplexer = Promise.await(_getMultiplexer(cursor));
    return multiplexer && multiplexer._observeDriver || undefined;
  });
}
function exposeOplogDriver(namespace, coll) {
  return Promise.asyncApply(() => {
    const driver = Promise.await(_getObserverDriver(coll.find({})));
    // verify observer driver is an oplog driver
    if (driver && typeof driver.constructor.cursorSupported === "function") {
      namespace.MongoOplogDriver = driver.constructor;
    }
  });
}
function exposePollingDriver(namespace, coll) {
  return Promise.asyncApply(() => {
    const cursor = coll.find({}, {
      limit: 20,
      _disableOplog: true
    });
    const driver = Promise.await(_getObserverDriver(cursor));
    // verify observer driver is a polling driver
    if (driver && typeof driver.constructor.cursorSupported === "undefined") {
      namespace.MongoPollingDriver = driver.constructor;
    }
  });
}
function exposeSynchronousCursor(namespace, coll) {
  return Promise.asyncApply(() => {
    const synchronousCursor = Promise.await(_getSynchronousCursor(coll.find({})));
    if (synchronousCursor) {
      namespace.SynchronousCursor = synchronousCursor.constructor;
    }
  });
}
function exposeMultiplexer(namespace, coll) {
  return Promise.asyncApply(() => {
    const multiplexer = Promise.await(_getMultiplexer(coll.find({})));
    if (multiplexer) {
      namespace.Multiplexer = multiplexer.constructor;
    }
  });
}
////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/montiapm:meteorx/src/livedata.js");
require("/node_modules/meteor/montiapm:meteorx/src/mongo-livedata.js");
require("/node_modules/meteor/montiapm:meteorx/src/server.js");

/* Exports */
Package._define("montiapm:meteorx", {
  MeteorX: MeteorX
});

})();

//# sourceURL=meteor://💻app/packages/montiapm_meteorx.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvbW9udGlhcG06bWV0ZW9yeC9zcmMvbGl2ZWRhdGEuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOm1ldGVvcngvc3JjL21vbmdvLWxpdmVkYXRhLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTptZXRlb3J4L3NyYy9zZXJ2ZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL21vbnRpYXBtOm1ldGVvcngvc3JjL3V0aWxzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9tb250aWFwbTptZXRlb3J4L3NyYy9maWJlcmxlc3MvbW9uZ28uanMiXSwibmFtZXMiOlsiZXhwb3NlTGl2ZWRhdGEiLCJuYW1lc3BhY2UiLCJmYWtlU29ja2V0Iiwic2VuZCIsImNsb3NlIiwiaGVhZGVycyIsImRkcENvbm5lY3RNZXNzYWdlIiwibXNnIiwidmVyc2lvbiIsInN1cHBvcnQiLCJNZXRlb3IiLCJzZXJ2ZXIiLCJfaGFuZGxlQ29ubmVjdCIsIl9tZXRlb3JTZXNzaW9uIiwiU2Vzc2lvbiIsImNvbnN0cnVjdG9yIiwiZXhwb3NlU3Vic2NyaXB0aW9uIiwiZXhwb3NlU2Vzc2lvbkNvbGxlY3Rpb25WaWV3IiwiX3JlbW92ZVNlc3Npb24iLCJfY2xvc2VTZXNzaW9uIiwiX2Rlc3Ryb3lTZXNzaW9uIiwibWV0ZW9yX3Nlc3Npb24iLCJkZXRhY2giLCJjb25zb2xlIiwiZXJyb3IiLCJzZXNzaW9uIiwic3ViSWQiLCJSYW5kb20iLCJpZCIsInB1YmxpY2F0aW9uSGFuZGxlciIsInJlYWR5IiwicHViTmFtZSIsIl9zdGFydFN1YnNjcmlwdGlvbiIsImlzTWFwIiwiX25hbWVkU3VicyIsIk1hcCIsInN1YnNjcmlwdGlvbiIsImdldCIsIlN1YnNjcmlwdGlvbiIsIl9zdG9wU3Vic2NyaXB0aW9uIiwiZG9jdW1lbnRWaWV3IiwiZ2V0Q29sbGVjdGlvblZpZXciLCJTZXNzaW9uQ29sbGVjdGlvblZpZXciLCJhZGRlZCIsImFhIiwiZG9jdW1lbnRzIiwiZG9jIiwiU2Vzc2lvbkRvY3VtZW50VmlldyIsIm1vZHVsZSIsImV4cG9ydCIsImV4cG9zZU1vbmdvTGl2ZWRhdGEiLCJNZXRlb3JYIiwiTW9uZ29JbnRlcm5hbHMiLCJsaW5rIiwidiIsIl9tb25nb0luc3RhbGxlZCIsIk1vbmdvQ29sbCIsIk1vbmdvIiwiQ29sbGVjdGlvbiIsImNvbGwiLCJmaW5kT25lIiwiTW9uZ29Db25uZWN0aW9uIiwiZGVmYXVsdFJlbW90ZUNvbGxlY3Rpb25Ecml2ZXIiLCJtb25nbyIsImN1cnNvciIsImZpbmQiLCJNb25nb0N1cnNvciIsImV4cG9zZU9wbG9nRHJpdmVyIiwiZXhwb3NlUG9sbGluZ0RyaXZlciIsImV4cG9zZU11bHRpcGxleGVyIiwiZXhwb3NlU3luY2hyb25vdXNDdXJzb3IiLCJzeW5jaHJvbm91c0N1cnNvciIsIl9nZXRTeW5jaHJvbm91c0N1cnNvciIsIlN5bmNocm9ub3VzQ3Vyc29yIiwiZHJpdmVyIiwiX2dldE9ic2VydmVyRHJpdmVyIiwiY3Vyc29yU3VwcG9ydGVkIiwiTW9uZ29PcGxvZ0RyaXZlciIsImxpbWl0IiwiX2Rpc2FibGVPcGxvZyIsIk1vbmdvUG9sbGluZ0RyaXZlciIsIm11bHRpcGxleGVyIiwiX2dldE11bHRpcGxleGVyIiwiTXVsdGlwbGV4ZXIiLCJfb2JzZXJ2ZURyaXZlciIsImhhbmRsZXIiLCJvYnNlcnZlQ2hhbmdlcyIsIkZ1bmN0aW9uIiwicHJvdG90eXBlIiwic3RvcCIsIl9tdWx0aXBsZXhlciIsImZldGNoIiwiX3N5bmNocm9ub3VzQ3Vyc29yIiwicnVuV2l0aEFGaWJlciIsImV4cG9zZU1vbmdvQXN5bmMiLCJQYWNrYWdlIiwiaGFzT3duUHJvcGVydHkiLCJfcmVhZHlDYWxsYmFja3MiLCJfcmVhZHkiLCJfZmliZXJzRGlzYWJsZWQiLCJpc0ZpYmVyc0Rpc2FibGVkIiwib25SZWFkeSIsImNiIiwicHVzaCIsIlNlcnZlciIsImluaXRTeW5jIiwibWFwIiwiaW5pdEFzeW5jIiwiUHJvbWlzZSIsImFzeW5jQXBwbHkiLCJhd2FpdCIsInN0YXJ0dXAiLCJGaWJlcnMiLCJyZXF1aXJlIiwiY3VycmVudCIsIkZpYmVyIiwicnVuIiwiX2dldER1bW15Q29sbGVjdGlvbiIsImZpbmRPbmVBc3luYyIsImZldGNoQXN5bmMiLCJ1bmRlZmluZWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLGNBQWMsR0FBRyxTQUFBQSxDQUFTQyxTQUFTLEVBQUU7RUFDbkM7RUFDQSxNQUFNQyxVQUFVLEdBQUc7SUFBQ0MsSUFBSSxFQUFFLFNBQUFBLENBQUEsRUFBVyxDQUFDLENBQUM7SUFBRUMsS0FBSyxFQUFFLFNBQUFBLENBQUEsRUFBVyxDQUFDLENBQUM7SUFBRUMsT0FBTyxFQUFFO0VBQUUsQ0FBQztFQUMzRSxNQUFNQyxpQkFBaUIsR0FBRztJQUFDQyxHQUFHLEVBQUUsU0FBUztJQUFFQyxPQUFPLEVBQUUsTUFBTTtJQUFFQyxPQUFPLEVBQUUsQ0FBQyxNQUFNO0VBQUMsQ0FBQztFQUM5RUMsTUFBTSxDQUFDQyxNQUFNLENBQUNDLGNBQWMsQ0FBQ1YsVUFBVSxFQUFFSSxpQkFBaUIsQ0FBQztFQUUzRCxJQUFHSixVQUFVLENBQUNXLGNBQWMsRUFBRTtJQUFFO0lBQzlCWixTQUFTLENBQUNhLE9BQU8sR0FBR1osVUFBVSxDQUFDVyxjQUFjLENBQUNFLFdBQVc7SUFFekRDLGtCQUFrQixDQUFDZCxVQUFVLENBQUNXLGNBQWMsRUFBRVosU0FBUyxDQUFDO0lBQ3hEZ0IsMkJBQTJCLENBQUNmLFVBQVUsQ0FBQ1csY0FBYyxFQUFFWixTQUFTLENBQUM7SUFFakUsSUFBSVMsTUFBTSxDQUFDQyxNQUFNLENBQUNPLGNBQWMsRUFBRTtNQUNoQztNQUNBUixNQUFNLENBQUNDLE1BQU0sQ0FBQ08sY0FBYyxDQUFDaEIsVUFBVSxDQUFDVyxjQUFjLENBQUM7SUFDekQsQ0FBQyxNQUFNLElBQUlILE1BQU0sQ0FBQ0MsTUFBTSxDQUFDUSxhQUFhLEVBQUU7TUFDdEM7TUFDQVQsTUFBTSxDQUFDQyxNQUFNLENBQUNRLGFBQWEsQ0FBQ2pCLFVBQVUsQ0FBQ1csY0FBYyxDQUFDO0lBQ3hELENBQUMsTUFBTSxJQUFHSCxNQUFNLENBQUNDLE1BQU0sQ0FBQ1MsZUFBZSxFQUFFO01BQ3ZDO01BQ0FWLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDUyxlQUFlLENBQUNsQixVQUFVLENBQUNXLGNBQWMsQ0FBQztJQUMxRDtFQUNGLENBQUMsTUFBTSxJQUFHWCxVQUFVLENBQUNtQixjQUFjLEVBQUU7SUFBRTtJQUNyQ3BCLFNBQVMsQ0FBQ2EsT0FBTyxHQUFHWixVQUFVLENBQUNtQixjQUFjLENBQUNOLFdBQVc7O0lBRXpEO0lBQ0FDLGtCQUFrQixDQUFDZCxVQUFVLENBQUNtQixjQUFjLEVBQUVwQixTQUFTLENBQUM7SUFDeERnQiwyQkFBMkIsQ0FBQ2YsVUFBVSxDQUFDVyxjQUFjLEVBQUVaLFNBQVMsQ0FBQztJQUVqRUMsVUFBVSxDQUFDbUIsY0FBYyxDQUFDQyxNQUFNLENBQUNwQixVQUFVLENBQUM7RUFDOUMsQ0FBQyxNQUFNO0lBQ0xxQixPQUFPLENBQUNDLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQztFQUNsRDtBQUNGLENBQUM7QUFFRCxTQUFTUixrQkFBa0JBLENBQUNTLE9BQU8sRUFBRXhCLFNBQVMsRUFBRTtFQUM5QyxNQUFNeUIsS0FBSyxHQUFHQyxNQUFNLENBQUNDLEVBQUUsQ0FBQyxDQUFDO0VBQ3pCLE1BQU1DLGtCQUFrQixHQUFHLFNBQUFBLENBQUEsRUFBVztJQUNwQyxJQUFJLENBQUNDLEtBQUssQ0FBQyxDQUFDO0VBQ2QsQ0FBQztFQUNELE1BQU1DLE9BQU8sR0FBRyxjQUFjLEdBQUdKLE1BQU0sQ0FBQ0MsRUFBRSxDQUFDLENBQUM7RUFFNUNILE9BQU8sQ0FBQ08sa0JBQWtCLENBQUNILGtCQUFrQixFQUFFSCxLQUFLLEVBQUUsRUFBRSxFQUFFSyxPQUFPLENBQUM7RUFDbEUsTUFBTUUsS0FBSyxHQUFHUixPQUFPLENBQUNTLFVBQVUsWUFBWUMsR0FBRztFQUMvQyxNQUFNQyxZQUFZLEdBQUdILEtBQUssR0FBR1IsT0FBTyxDQUFDUyxVQUFVLENBQUNHLEdBQUcsQ0FBQ1gsS0FBSyxDQUFDLEdBQUdELE9BQU8sQ0FBQ1MsVUFBVSxDQUFDUixLQUFLLENBQUM7RUFDdEZ6QixTQUFTLENBQUNxQyxZQUFZLEdBQUdGLFlBQVksQ0FBQ3JCLFdBQVc7O0VBRWpEO0VBQ0FVLE9BQU8sQ0FBQ2MsaUJBQWlCLENBQUNiLEtBQUssQ0FBQztBQUNsQztBQUVBLFNBQVNULDJCQUEyQkEsQ0FBQ1EsT0FBTyxFQUFFeEIsU0FBUyxFQUFFO0VBQ3ZELE1BQU11QyxZQUFZLEdBQUdmLE9BQU8sQ0FBQ2dCLGlCQUFpQixDQUFDLENBQUM7RUFDaER4QyxTQUFTLENBQUN5QyxxQkFBcUIsR0FBR0YsWUFBWSxDQUFDekIsV0FBVztFQUUxRCxNQUFNYSxFQUFFLEdBQUcsUUFBUTtFQUNuQlksWUFBWSxDQUFDRyxLQUFLLENBQUMsZUFBZSxFQUFFZixFQUFFLEVBQUU7SUFBQ2dCLEVBQUUsRUFBRTtFQUFFLENBQUMsQ0FBQztFQUNqRCxNQUFNWCxLQUFLLEdBQUdPLFlBQVksQ0FBQ0ssU0FBUyxZQUFZVixHQUFHO0VBQ25ELE1BQU1XLEdBQUcsR0FBR2IsS0FBSyxHQUFHTyxZQUFZLENBQUNLLFNBQVMsQ0FBQ1IsR0FBRyxDQUFDVCxFQUFFLENBQUMsR0FBR1ksWUFBWSxDQUFDSyxTQUFTLENBQUNqQixFQUFFLENBQUM7RUFDL0UzQixTQUFTLENBQUM4QyxtQkFBbUIsR0FBR0QsR0FBRyxDQUFDL0IsV0FBVztBQUNqRCxDOzs7Ozs7Ozs7OztBQzVEQWlDLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDO0VBQUNDLG1CQUFtQixFQUFDQSxDQUFBLEtBQUlBO0FBQW1CLENBQUMsQ0FBQztBQUFyRCxNQUFNQSxtQkFBbUIsR0FBRyxTQUFBQSxDQUFTQyxPQUFPLEVBQUU7RUFBckQsSUFBSUMsY0FBYztFQUFDSixNQUFNLENBQUNLLElBQUksQ0FBQyxjQUFjLEVBQUM7SUFBQ0QsY0FBY0EsQ0FBQ0UsQ0FBQyxFQUFDO01BQUNGLGNBQWMsR0FBQ0UsQ0FBQztJQUFBO0VBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztFQUNwRixJQUFJLENBQUNILE9BQU8sQ0FBQ0ksZUFBZSxFQUFFO0VBSTlCLE1BQU1DLFNBQVMsR0FBRyxPQUFPQyxLQUFLLEtBQUssV0FBVyxHQUFHQSxLQUFLLENBQUNDLFVBQVUsR0FBR2hELE1BQU0sQ0FBQ2dELFVBQVU7RUFDckYsTUFBTUMsSUFBSSxHQUFHLElBQUlILFNBQVMsQ0FBQyxlQUFlLEdBQUc3QixNQUFNLENBQUNDLEVBQUUsQ0FBQyxDQUFDLENBQUM7RUFDekQ7RUFDQStCLElBQUksQ0FBQ0MsT0FBTyxDQUFDLENBQUM7RUFFZFQsT0FBTyxDQUFDVSxlQUFlLEdBQUdULGNBQWMsQ0FBQ1UsNkJBQTZCLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUNoRCxXQUFXO0VBQzFGLE1BQU1pRCxNQUFNLEdBQUdMLElBQUksQ0FBQ00sSUFBSSxDQUFDLENBQUM7RUFDMUJkLE9BQU8sQ0FBQ2UsV0FBVyxHQUFHRixNQUFNLENBQUNqRCxXQUFXO0VBQ3hDb0QsaUJBQWlCLENBQUNoQixPQUFPLEVBQUVRLElBQUksQ0FBQztFQUNoQ1MsbUJBQW1CLENBQUNqQixPQUFPLEVBQUVRLElBQUksQ0FBQztFQUNsQ1UsaUJBQWlCLENBQUNsQixPQUFPLEVBQUVRLElBQUksQ0FBQztFQUNoQ1csdUJBQXVCLENBQUNuQixPQUFPLEVBQUVRLElBQUksQ0FBQztBQUN4QyxDQUFDO0FBRUQsU0FBU1csdUJBQXVCQSxDQUFDckUsU0FBUyxFQUFFMEQsSUFBSSxFQUFFO0VBQ2hELE1BQU1ZLGlCQUFpQixHQUFHQyxxQkFBcUIsQ0FBQ2IsSUFBSSxDQUFDTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM5RCxJQUFJTSxpQkFBaUIsRUFBRTtJQUNyQnRFLFNBQVMsQ0FBQ3dFLGlCQUFpQixHQUFHRixpQkFBaUIsQ0FBQ3hELFdBQVc7RUFDN0Q7QUFDRjtBQUVBLFNBQVNvRCxpQkFBaUJBLENBQUNsRSxTQUFTLEVBQUUwRCxJQUFJLEVBQUU7RUFDMUMsTUFBTWUsTUFBTSxHQUFHQyxrQkFBa0IsQ0FBQ2hCLElBQUksQ0FBQ00sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDaEQ7RUFDQSxJQUFJUyxNQUFNLElBQUksT0FBT0EsTUFBTSxDQUFDM0QsV0FBVyxDQUFDNkQsZUFBZSxLQUFLLFVBQVUsRUFBRTtJQUN0RTNFLFNBQVMsQ0FBQzRFLGdCQUFnQixHQUFHSCxNQUFNLENBQUMzRCxXQUFXO0VBQ2pEO0FBQ0Y7QUFFQSxTQUFTcUQsbUJBQW1CQSxDQUFDbkUsU0FBUyxFQUFFMEQsSUFBSSxFQUFFO0VBQzVDLE1BQU1LLE1BQU0sR0FBR0wsSUFBSSxDQUFDTSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFBRWEsS0FBSyxFQUFFLEVBQUU7SUFBRUMsYUFBYSxFQUFFO0VBQUssQ0FBQyxDQUFDO0VBQ2hFLE1BQU1MLE1BQU0sR0FBR0Msa0JBQWtCLENBQUNYLE1BQU0sQ0FBQztFQUN6QztFQUNBLElBQUlVLE1BQU0sSUFBSSxPQUFPQSxNQUFNLENBQUMzRCxXQUFXLENBQUM2RCxlQUFlLEtBQUssV0FBVyxFQUFFO0lBQ3ZFM0UsU0FBUyxDQUFDK0Usa0JBQWtCLEdBQUdOLE1BQU0sQ0FBQzNELFdBQVc7RUFDbkQ7QUFDRjtBQUVBLFNBQVNzRCxpQkFBaUJBLENBQUNwRSxTQUFTLEVBQUUwRCxJQUFJLEVBQUU7RUFDMUMsTUFBTXNCLFdBQVcsR0FBR0MsZUFBZSxDQUFDdkIsSUFBSSxDQUFDTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNsRCxJQUFJZ0IsV0FBVyxFQUFFO0lBQ2ZoRixTQUFTLENBQUNrRixXQUFXLEdBQUdGLFdBQVcsQ0FBQ2xFLFdBQVc7RUFDakQ7QUFDRjtBQUVBLFNBQVM0RCxrQkFBa0JBLENBQUNYLE1BQU0sRUFBRTtFQUNsQyxNQUFNaUIsV0FBVyxHQUFHQyxlQUFlLENBQUNsQixNQUFNLENBQUM7RUFDM0MsSUFBSWlCLFdBQVcsSUFBSUEsV0FBVyxDQUFDRyxjQUFjLEVBQUU7SUFDN0MsT0FBT0gsV0FBVyxDQUFDRyxjQUFjO0VBQ25DO0FBQ0Y7QUFFQSxTQUFTRixlQUFlQSxDQUFDbEIsTUFBTSxFQUFFO0VBQy9CLE1BQU1xQixPQUFPLEdBQUdyQixNQUFNLENBQUNzQixjQUFjLENBQUM7SUFBRTNDLEtBQUssRUFBRTRDLFFBQVEsQ0FBQ0M7RUFBVSxDQUFDLENBQUM7RUFDcEVILE9BQU8sQ0FBQ0ksSUFBSSxDQUFDLENBQUM7RUFDZCxPQUFPSixPQUFPLENBQUNLLFlBQVk7QUFDN0I7QUFFQSxTQUFTbEIscUJBQXFCQSxDQUFDUixNQUFNLEVBQUU7RUFDckNBLE1BQU0sQ0FBQzJCLEtBQUssQ0FBQyxDQUFDO0VBQ2QsTUFBTXBCLGlCQUFpQixHQUFHUCxNQUFNLENBQUM0QixrQkFBa0I7RUFDbkQsSUFBSXJCLGlCQUFpQixFQUFFO0lBQ3JCLE9BQU9BLGlCQUFpQjtFQUMxQjtBQUNGLEM7Ozs7Ozs7Ozs7O0FDckVBLElBQUlyQixtQkFBbUI7QUFBQ0YsTUFBTSxDQUFDSyxJQUFJLENBQUMsa0JBQWtCLEVBQUM7RUFBQ0gsbUJBQW1CQSxDQUFDSSxDQUFDLEVBQUM7SUFBQ0osbUJBQW1CLEdBQUNJLENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFBQyxJQUFJdUMsYUFBYTtBQUFDN0MsTUFBTSxDQUFDSyxJQUFJLENBQUMsU0FBUyxFQUFDO0VBQUN3QyxhQUFhQSxDQUFDdkMsQ0FBQyxFQUFDO0lBQUN1QyxhQUFhLEdBQUN2QyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQUMsSUFBSXdDLGdCQUFnQjtBQUFDOUMsTUFBTSxDQUFDSyxJQUFJLENBQUMsbUJBQW1CLEVBQUM7RUFBQ3lDLGdCQUFnQkEsQ0FBQ3hDLENBQUMsRUFBQztJQUFDd0MsZ0JBQWdCLEdBQUN4QyxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBSTFSO0FBQ0E7QUFDQTtBQUNBSCxPQUFPLEdBQUcsQ0FBQyxDQUFDO0FBRVpBLE9BQU8sQ0FBQ0ksZUFBZSxHQUFHd0MsT0FBTyxDQUFDQyxjQUFjLENBQUMsT0FBTyxDQUFDO0FBQ3pEN0MsT0FBTyxDQUFDOEMsZUFBZSxHQUFHLEVBQUU7QUFDNUI5QyxPQUFPLENBQUMrQyxNQUFNLEdBQUcsS0FBSztBQUN0Qi9DLE9BQU8sQ0FBQ2dELGVBQWUsR0FBR3pGLE1BQU0sQ0FBQzBGLGdCQUFnQjtBQUVqRGpELE9BQU8sQ0FBQ2tELE9BQU8sR0FBRyxVQUFTQyxFQUFFLEVBQUU7RUFDN0IsSUFBSW5ELE9BQU8sQ0FBQytDLE1BQU0sRUFBRTtJQUNsQixPQUFPTCxhQUFhLENBQUNTLEVBQUUsQ0FBQztFQUMxQjtFQUVBLElBQUksQ0FBQ0wsZUFBZSxDQUFDTSxJQUFJLENBQUNELEVBQUUsQ0FBQztBQUMvQixDQUFDO0FBRURuRCxPQUFPLENBQUNxRCxNQUFNLEdBQUc5RixNQUFNLENBQUNDLE1BQU0sQ0FBQ0ksV0FBVztBQUUxQ2YsY0FBYyxDQUFDbUQsT0FBTyxDQUFDO0FBRXZCLFNBQVNzRCxRQUFRQSxDQUFBLEVBQUc7RUFDbEJaLGFBQWEsQ0FBQyxNQUFNO0lBQ2xCM0MsbUJBQW1CLENBQUNDLE9BQU8sQ0FBQztFQUM5QixDQUFDLENBQUM7RUFFRkEsT0FBTyxDQUFDOEMsZUFBZSxDQUFDUyxHQUFHLENBQUNiLGFBQWEsQ0FBQztFQUMxQzFDLE9BQU8sQ0FBQytDLE1BQU0sR0FBRyxJQUFJO0FBQ3ZCO0FBRUEsU0FBZVMsU0FBU0EsQ0FBQTtFQUFBLE9BQUFDLE9BQUEsQ0FBQUMsVUFBQSxPQUFHO0lBQ3pCRCxPQUFBLENBQUFFLEtBQUEsQ0FBTWhCLGdCQUFnQixDQUFDM0MsT0FBTyxDQUFDO0lBRS9CLEtBQUssTUFBTW1ELEVBQUUsSUFBSW5ELE9BQU8sQ0FBQzhDLGVBQWUsRUFBRTtNQUN4Q1csT0FBQSxDQUFBRSxLQUFBLENBQU1SLEVBQUUsQ0FBQyxDQUFDO0lBQ1o7SUFFQW5ELE9BQU8sQ0FBQytDLE1BQU0sR0FBRyxJQUFJO0VBQ3ZCLENBQUM7QUFBQTtBQUVEeEYsTUFBTSxDQUFDcUcsT0FBTyxDQUFDNUQsT0FBTyxDQUFDZ0QsZUFBZSxHQUFHUSxTQUFTLEdBQUdGLFFBQVEsQ0FBQyxDOzs7Ozs7Ozs7OztBQzdDOUR6RCxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDNEMsYUFBYSxFQUFDQSxDQUFBLEtBQUlBO0FBQWEsQ0FBQyxDQUFDO0FBQXpDLFNBQVNBLGFBQWFBLENBQUVTLEVBQUUsRUFBRTtFQUNqQyxJQUFJNUYsTUFBTSxDQUFDMEYsZ0JBQWdCLEVBQUU7SUFDM0JFLEVBQUUsQ0FBQyxDQUFDO0lBQ0o7RUFDRjtFQUVBLE1BQU1VLE1BQU0sR0FBR0MsT0FBTyxDQUFDLFFBQVEsQ0FBQztFQUVoQyxJQUFJRCxNQUFNLENBQUNFLE9BQU8sRUFBRTtJQUNsQlosRUFBRSxDQUFDLENBQUM7RUFDTixDQUFDLE1BQU07SUFDTCxJQUFJYSxLQUFLLENBQUNiLEVBQUUsQ0FBQyxDQUFDYyxHQUFHLENBQUMsQ0FBQztFQUNyQjtBQUNGLEM7Ozs7Ozs7Ozs7O0FDYkFwRSxNQUFNLENBQUNDLE1BQU0sQ0FBQztFQUFDNkMsZ0JBQWdCLEVBQUNBLENBQUEsS0FBSUE7QUFBZ0IsQ0FBQyxDQUFDO0FBQUMsSUFBSXJDLEtBQUssRUFBQ0wsY0FBYztBQUFDSixNQUFNLENBQUNLLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQ0ksS0FBS0EsQ0FBQ0gsQ0FBQyxFQUFDO0lBQUNHLEtBQUssR0FBQ0gsQ0FBQztFQUFBLENBQUM7RUFBQ0YsY0FBY0EsQ0FBQ0UsQ0FBQyxFQUFDO0lBQUNGLGNBQWMsR0FBQ0UsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUU5SixTQUFld0MsZ0JBQWdCQSxDQUFDM0MsT0FBTztFQUFBLE9BQUF5RCxPQUFBLENBQUFDLFVBQUEsT0FBRTtJQUZoRCxJQUFJekQsY0FBYztJQUFDSixNQUFNLENBQUNLLElBQUksQ0FBQyxjQUFjLEVBQUM7TUFBQ0QsY0FBY0EsQ0FBQ0UsQ0FBQyxFQUFDO1FBQUNGLGNBQWMsR0FBQ0UsQ0FBQztNQUFBO0lBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztJQUdwRixJQUFJLENBQUNILE9BQU8sQ0FBQ0ksZUFBZSxFQUFFO0lBSTlCLE1BQU1JLElBQUksR0FBRzBELG1CQUFtQixDQUFDLENBQUM7SUFFbENULE9BQUEsQ0FBQUUsS0FBQSxDQUFNbkQsSUFBSSxDQUFDMkQsWUFBWSxDQUFDLENBQUM7SUFFekIsTUFBTTVDLE1BQU0sR0FBR3RCLGNBQWMsQ0FBQ1UsNkJBQTZCLENBQUMsQ0FBQztJQUU3RFgsT0FBTyxDQUFDVSxlQUFlLEdBQUdhLE1BQU0sQ0FBQ1gsS0FBSyxDQUFDaEQsV0FBVztJQUNsRCxNQUFNaUQsTUFBTSxHQUFHTCxJQUFJLENBQUNNLElBQUksQ0FBQyxDQUFDO0lBQzFCZCxPQUFPLENBQUNlLFdBQVcsR0FBR0YsTUFBTSxDQUFDakQsV0FBVztJQUV4QzZGLE9BQUEsQ0FBQUUsS0FBQSxDQUFNM0MsaUJBQWlCLENBQUNoQixPQUFPLEVBQUVRLElBQUksQ0FBQztJQUN0Q2lELE9BQUEsQ0FBQUUsS0FBQSxDQUFNMUMsbUJBQW1CLENBQUNqQixPQUFPLEVBQUVRLElBQUksQ0FBQztJQUN4Q2lELE9BQUEsQ0FBQUUsS0FBQSxDQUFNekMsaUJBQWlCLENBQUNsQixPQUFPLEVBQUVRLElBQUksQ0FBQztJQUN0Q2lELE9BQUEsQ0FBQUUsS0FBQSxDQUFNeEMsdUJBQXVCLENBQUNuQixPQUFPLEVBQUVRLElBQUksQ0FBQztFQUM5QyxDQUFDO0FBQUE7QUFFRCxTQUFTMEQsbUJBQW1CQSxDQUFBLEVBQUc7RUFDN0IsTUFBTTNELFVBQVUsR0FBRyxPQUFPRCxLQUFLLEtBQUssV0FBVyxHQUFHQSxLQUFLLENBQUNDLFVBQVUsR0FBR2hELE1BQU0sQ0FBQ2dELFVBQVU7RUFDdEYsT0FBTyxJQUFJQSxVQUFVLENBQUMsZUFBZSxHQUFHL0IsTUFBTSxDQUFDQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3REO0FBRUEsU0FBZTRDLHFCQUFxQkEsQ0FBQ1IsTUFBTTtFQUFBLE9BQUE0QyxPQUFBLENBQUFDLFVBQUEsT0FBRTtJQUMzQ0QsT0FBQSxDQUFBRSxLQUFBLENBQU05QyxNQUFNLENBQUN1RCxVQUFVLENBQUMsQ0FBQztJQUN6QixPQUFPdkQsTUFBTSxDQUFDNEIsa0JBQWtCLElBQUk0QixTQUFTO0VBQy9DLENBQUM7QUFBQTtBQUVELFNBQWV0QyxlQUFlQSxDQUFDbEIsTUFBTTtFQUFBLE9BQUE0QyxPQUFBLENBQUFDLFVBQUEsT0FBRTtJQUNyQyxNQUFNeEIsT0FBTyxHQUFBdUIsT0FBQSxDQUFBRSxLQUFBLENBQVM5QyxNQUFNLENBQUNzQixjQUFjLENBQUM7TUFBRTNDLEtBQUssRUFBRTRDLFFBQVEsQ0FBQ0M7SUFBVSxDQUFDLENBQUM7SUFDMUVvQixPQUFBLENBQUFFLEtBQUEsQ0FBTXpCLE9BQU8sQ0FBQ0ksSUFBSSxDQUFDLENBQUM7SUFFcEIsT0FBT0osT0FBTyxDQUFDSyxZQUFZO0VBQzdCLENBQUM7QUFBQTtBQUVELFNBQWVmLGtCQUFrQkEsQ0FBQ1gsTUFBTTtFQUFBLE9BQUE0QyxPQUFBLENBQUFDLFVBQUEsT0FBRTtJQUN4QyxNQUFNNUIsV0FBVyxHQUFBMkIsT0FBQSxDQUFBRSxLQUFBLENBQVM1QixlQUFlLENBQUNsQixNQUFNLENBQUM7SUFFakQsT0FBT2lCLFdBQVcsSUFBSUEsV0FBVyxDQUFDRyxjQUFjLElBQUlvQyxTQUFTO0VBQy9ELENBQUM7QUFBQTtBQUVELFNBQWVyRCxpQkFBaUJBLENBQUNsRSxTQUFTLEVBQUUwRCxJQUFJO0VBQUEsT0FBQWlELE9BQUEsQ0FBQUMsVUFBQSxPQUFFO0lBQ2hELE1BQU1uQyxNQUFNLEdBQUFrQyxPQUFBLENBQUFFLEtBQUEsQ0FBU25DLGtCQUFrQixDQUFDaEIsSUFBSSxDQUFDTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN0RDtJQUNBLElBQUlTLE1BQU0sSUFBSSxPQUFPQSxNQUFNLENBQUMzRCxXQUFXLENBQUM2RCxlQUFlLEtBQUssVUFBVSxFQUFFO01BQ3RFM0UsU0FBUyxDQUFDNEUsZ0JBQWdCLEdBQUdILE1BQU0sQ0FBQzNELFdBQVc7SUFDakQ7RUFDRixDQUFDO0FBQUE7QUFFRCxTQUFlcUQsbUJBQW1CQSxDQUFDbkUsU0FBUyxFQUFFMEQsSUFBSTtFQUFBLE9BQUFpRCxPQUFBLENBQUFDLFVBQUEsT0FBRTtJQUNsRCxNQUFNN0MsTUFBTSxHQUFHTCxJQUFJLENBQUNNLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUFFYSxLQUFLLEVBQUUsRUFBRTtNQUFFQyxhQUFhLEVBQUU7SUFBSyxDQUFDLENBQUM7SUFDaEUsTUFBTUwsTUFBTSxHQUFBa0MsT0FBQSxDQUFBRSxLQUFBLENBQVNuQyxrQkFBa0IsQ0FBQ1gsTUFBTSxDQUFDO0lBQy9DO0lBQ0EsSUFBSVUsTUFBTSxJQUFJLE9BQU9BLE1BQU0sQ0FBQzNELFdBQVcsQ0FBQzZELGVBQWUsS0FBSyxXQUFXLEVBQUU7TUFDdkUzRSxTQUFTLENBQUMrRSxrQkFBa0IsR0FBR04sTUFBTSxDQUFDM0QsV0FBVztJQUNuRDtFQUNGLENBQUM7QUFBQTtBQUVELFNBQWV1RCx1QkFBdUJBLENBQUNyRSxTQUFTLEVBQUUwRCxJQUFJO0VBQUEsT0FBQWlELE9BQUEsQ0FBQUMsVUFBQSxPQUFFO0lBQ3RELE1BQU10QyxpQkFBaUIsR0FBQXFDLE9BQUEsQ0FBQUUsS0FBQSxDQUFTdEMscUJBQXFCLENBQUNiLElBQUksQ0FBQ00sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEUsSUFBSU0saUJBQWlCLEVBQUU7TUFDckJ0RSxTQUFTLENBQUN3RSxpQkFBaUIsR0FBR0YsaUJBQWlCLENBQUN4RCxXQUFXO0lBQzdEO0VBQ0YsQ0FBQztBQUFBO0FBRUQsU0FBZXNELGlCQUFpQkEsQ0FBQ3BFLFNBQVMsRUFBRTBELElBQUk7RUFBQSxPQUFBaUQsT0FBQSxDQUFBQyxVQUFBLE9BQUU7SUFDaEQsTUFBTTVCLFdBQVcsR0FBQTJCLE9BQUEsQ0FBQUUsS0FBQSxDQUFTNUIsZUFBZSxDQUFDdkIsSUFBSSxDQUFDTSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV4RCxJQUFJZ0IsV0FBVyxFQUFFO01BQ2ZoRixTQUFTLENBQUNrRixXQUFXLEdBQUdGLFdBQVcsQ0FBQ2xFLFdBQVc7SUFDakQ7RUFDRixDQUFDO0FBQUEsQyIsImZpbGUiOiIvcGFja2FnZXMvbW9udGlhcG1fbWV0ZW9yeC5qcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9zZUxpdmVkYXRhID0gZnVuY3Rpb24obmFtZXNwYWNlKSB7XG4gIC8vIGluc3RydW1lbnRpbmcgc2Vzc2lvblxuICBjb25zdCBmYWtlU29ja2V0ID0ge3NlbmQ6IGZ1bmN0aW9uKCkge30sIGNsb3NlOiBmdW5jdGlvbigpIHt9LCBoZWFkZXJzOiBbXX07XG4gIGNvbnN0IGRkcENvbm5lY3RNZXNzYWdlID0ge21zZzogJ2Nvbm5lY3QnLCB2ZXJzaW9uOiAncHJlMScsIHN1cHBvcnQ6IFsncHJlMSddfTtcbiAgTWV0ZW9yLnNlcnZlci5faGFuZGxlQ29ubmVjdChmYWtlU29ja2V0LCBkZHBDb25uZWN0TWVzc2FnZSk7XG5cbiAgaWYoZmFrZVNvY2tldC5fbWV0ZW9yU2Vzc2lvbikgeyAvLyBmb3IgbmV3ZXIgbWV0ZW9yIHZlcnNpb25zXG4gICAgbmFtZXNwYWNlLlNlc3Npb24gPSBmYWtlU29ja2V0Ll9tZXRlb3JTZXNzaW9uLmNvbnN0cnVjdG9yO1xuXG4gICAgZXhwb3NlU3Vic2NyaXB0aW9uKGZha2VTb2NrZXQuX21ldGVvclNlc3Npb24sIG5hbWVzcGFjZSk7XG4gICAgZXhwb3NlU2Vzc2lvbkNvbGxlY3Rpb25WaWV3KGZha2VTb2NrZXQuX21ldGVvclNlc3Npb24sIG5hbWVzcGFjZSk7XG5cbiAgICBpZiAoTWV0ZW9yLnNlcnZlci5fcmVtb3ZlU2Vzc2lvbikge1xuICAgICAgLy8gMS43ICtcbiAgICAgIE1ldGVvci5zZXJ2ZXIuX3JlbW92ZVNlc3Npb24oZmFrZVNvY2tldC5fbWV0ZW9yU2Vzc2lvbik7XG4gICAgfSBlbHNlIGlmIChNZXRlb3Iuc2VydmVyLl9jbG9zZVNlc3Npb24pIHtcbiAgICAgIC8vIDAuNy54ICtcbiAgICAgIE1ldGVvci5zZXJ2ZXIuX2Nsb3NlU2Vzc2lvbihmYWtlU29ja2V0Ll9tZXRlb3JTZXNzaW9uKTtcbiAgICB9IGVsc2UgaWYoTWV0ZW9yLnNlcnZlci5fZGVzdHJveVNlc3Npb24pIHtcbiAgICAgIC8vIDAuNi42LnhcbiAgICAgIE1ldGVvci5zZXJ2ZXIuX2Rlc3Ryb3lTZXNzaW9uKGZha2VTb2NrZXQuX21ldGVvclNlc3Npb24pO1xuICAgIH1cbiAgfSBlbHNlIGlmKGZha2VTb2NrZXQubWV0ZW9yX3Nlc3Npb24pIHsgLy8gc3VwcG9ydCBmb3IgMC42LjUueFxuICAgIG5hbWVzcGFjZS5TZXNzaW9uID0gZmFrZVNvY2tldC5tZXRlb3Jfc2Vzc2lvbi5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIGluc3RydW1lbnRpbmcgc3Vic2NyaXB0aW9uXG4gICAgZXhwb3NlU3Vic2NyaXB0aW9uKGZha2VTb2NrZXQubWV0ZW9yX3Nlc3Npb24sIG5hbWVzcGFjZSk7XG4gICAgZXhwb3NlU2Vzc2lvbkNvbGxlY3Rpb25WaWV3KGZha2VTb2NrZXQuX21ldGVvclNlc3Npb24sIG5hbWVzcGFjZSk7XG5cbiAgICBmYWtlU29ja2V0Lm1ldGVvcl9zZXNzaW9uLmRldGFjaChmYWtlU29ja2V0KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zb2xlLmVycm9yKCdleHBvc2U6IHNlc3Npb24gZXhwb3NpbmcgZmFpbGVkJyk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIGV4cG9zZVN1YnNjcmlwdGlvbihzZXNzaW9uLCBuYW1lc3BhY2UpIHtcbiAgY29uc3Qgc3ViSWQgPSBSYW5kb20uaWQoKTtcbiAgY29uc3QgcHVibGljYXRpb25IYW5kbGVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZWFkeSgpXG4gIH07XG4gIGNvbnN0IHB1Yk5hbWUgPSAnX19kdW1teV9wdWJfJyArIFJhbmRvbS5pZCgpO1xuXG4gIHNlc3Npb24uX3N0YXJ0U3Vic2NyaXB0aW9uKHB1YmxpY2F0aW9uSGFuZGxlciwgc3ViSWQsIFtdLCBwdWJOYW1lKTtcbiAgY29uc3QgaXNNYXAgPSBzZXNzaW9uLl9uYW1lZFN1YnMgaW5zdGFuY2VvZiBNYXA7XG4gIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGlzTWFwID8gc2Vzc2lvbi5fbmFtZWRTdWJzLmdldChzdWJJZCkgOiBzZXNzaW9uLl9uYW1lZFN1YnNbc3ViSWRdO1xuICBuYW1lc3BhY2UuU3Vic2NyaXB0aW9uID0gc3Vic2NyaXB0aW9uLmNvbnN0cnVjdG9yO1xuXG4gIC8vIGNsZWFuaW5nIHVwXG4gIHNlc3Npb24uX3N0b3BTdWJzY3JpcHRpb24oc3ViSWQpO1xufVxuXG5mdW5jdGlvbiBleHBvc2VTZXNzaW9uQ29sbGVjdGlvblZpZXcoc2Vzc2lvbiwgbmFtZXNwYWNlKSB7XG4gIGNvbnN0IGRvY3VtZW50VmlldyA9IHNlc3Npb24uZ2V0Q29sbGVjdGlvblZpZXcoKTtcbiAgbmFtZXNwYWNlLlNlc3Npb25Db2xsZWN0aW9uVmlldyA9IGRvY3VtZW50Vmlldy5jb25zdHJ1Y3RvcjtcblxuICBjb25zdCBpZCA9ICd0aGUtaWQnO1xuICBkb2N1bWVudFZpZXcuYWRkZWQoJ3NhbXBsZS1oYW5kbGUnLCBpZCwge2FhOiAxMH0pO1xuICBjb25zdCBpc01hcCA9IGRvY3VtZW50Vmlldy5kb2N1bWVudHMgaW5zdGFuY2VvZiBNYXA7XG4gIGNvbnN0IGRvYyA9IGlzTWFwID8gZG9jdW1lbnRWaWV3LmRvY3VtZW50cy5nZXQoaWQpIDogZG9jdW1lbnRWaWV3LmRvY3VtZW50c1tpZF07XG4gIG5hbWVzcGFjZS5TZXNzaW9uRG9jdW1lbnRWaWV3ID0gZG9jLmNvbnN0cnVjdG9yO1xufVxuIiwiZXhwb3J0IGNvbnN0IGV4cG9zZU1vbmdvTGl2ZWRhdGEgPSBmdW5jdGlvbihNZXRlb3JYKSB7XG4gIGlmICghTWV0ZW9yWC5fbW9uZ29JbnN0YWxsZWQpIHJldHVyblxuXG4gIGltcG9ydCB7IE1vbmdvSW50ZXJuYWxzIH0gZnJvbSBcIm1ldGVvci9tb25nb1wiO1xuXG4gIGNvbnN0IE1vbmdvQ29sbCA9IHR5cGVvZiBNb25nbyAhPT0gXCJ1bmRlZmluZWRcIiA/IE1vbmdvLkNvbGxlY3Rpb24gOiBNZXRlb3IuQ29sbGVjdGlvbjtcbiAgY29uc3QgY29sbCA9IG5ldyBNb25nb0NvbGwoXCJfX2R1bW15X2NvbGxfXCIgKyBSYW5kb20uaWQoKSk7XG4gIC8vIHdlIG5lZWQgd2FpdCB1bnRpbCBkYiBnZXQgY29ubmVjdGVkIHdpdGggbWV0ZW9yLCAuZmluZE9uZSgpIGRvZXMgdGhhdFxuICBjb2xsLmZpbmRPbmUoKTtcblxuICBNZXRlb3JYLk1vbmdvQ29ubmVjdGlvbiA9IE1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKCkubW9uZ28uY29uc3RydWN0b3I7XG4gIGNvbnN0IGN1cnNvciA9IGNvbGwuZmluZCgpO1xuICBNZXRlb3JYLk1vbmdvQ3Vyc29yID0gY3Vyc29yLmNvbnN0cnVjdG9yO1xuICBleHBvc2VPcGxvZ0RyaXZlcihNZXRlb3JYLCBjb2xsKTtcbiAgZXhwb3NlUG9sbGluZ0RyaXZlcihNZXRlb3JYLCBjb2xsKTtcbiAgZXhwb3NlTXVsdGlwbGV4ZXIoTWV0ZW9yWCwgY29sbCk7XG4gIGV4cG9zZVN5bmNocm9ub3VzQ3Vyc29yKE1ldGVvclgsIGNvbGwpO1xufTtcblxuZnVuY3Rpb24gZXhwb3NlU3luY2hyb25vdXNDdXJzb3IobmFtZXNwYWNlLCBjb2xsKSB7XG4gIGNvbnN0IHN5bmNocm9ub3VzQ3Vyc29yID0gX2dldFN5bmNocm9ub3VzQ3Vyc29yKGNvbGwuZmluZCh7fSkpO1xuICBpZiAoc3luY2hyb25vdXNDdXJzb3IpIHtcbiAgICBuYW1lc3BhY2UuU3luY2hyb25vdXNDdXJzb3IgPSBzeW5jaHJvbm91c0N1cnNvci5jb25zdHJ1Y3RvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHBvc2VPcGxvZ0RyaXZlcihuYW1lc3BhY2UsIGNvbGwpIHtcbiAgY29uc3QgZHJpdmVyID0gX2dldE9ic2VydmVyRHJpdmVyKGNvbGwuZmluZCh7fSkpO1xuICAvLyB2ZXJpZnkgb2JzZXJ2ZXIgZHJpdmVyIGlzIGFuIG9wbG9nIGRyaXZlclxuICBpZiAoZHJpdmVyICYmIHR5cGVvZiBkcml2ZXIuY29uc3RydWN0b3IuY3Vyc29yU3VwcG9ydGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBuYW1lc3BhY2UuTW9uZ29PcGxvZ0RyaXZlciA9IGRyaXZlci5jb25zdHJ1Y3RvcjtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHBvc2VQb2xsaW5nRHJpdmVyKG5hbWVzcGFjZSwgY29sbCkge1xuICBjb25zdCBjdXJzb3IgPSBjb2xsLmZpbmQoe30sIHsgbGltaXQ6IDIwLCBfZGlzYWJsZU9wbG9nOiB0cnVlIH0pO1xuICBjb25zdCBkcml2ZXIgPSBfZ2V0T2JzZXJ2ZXJEcml2ZXIoY3Vyc29yKTtcbiAgLy8gdmVyaWZ5IG9ic2VydmVyIGRyaXZlciBpcyBhIHBvbGxpbmcgZHJpdmVyXG4gIGlmIChkcml2ZXIgJiYgdHlwZW9mIGRyaXZlci5jb25zdHJ1Y3Rvci5jdXJzb3JTdXBwb3J0ZWQgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBuYW1lc3BhY2UuTW9uZ29Qb2xsaW5nRHJpdmVyID0gZHJpdmVyLmNvbnN0cnVjdG9yO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4cG9zZU11bHRpcGxleGVyKG5hbWVzcGFjZSwgY29sbCkge1xuICBjb25zdCBtdWx0aXBsZXhlciA9IF9nZXRNdWx0aXBsZXhlcihjb2xsLmZpbmQoe30pKTtcbiAgaWYgKG11bHRpcGxleGVyKSB7XG4gICAgbmFtZXNwYWNlLk11bHRpcGxleGVyID0gbXVsdGlwbGV4ZXIuY29uc3RydWN0b3I7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldE9ic2VydmVyRHJpdmVyKGN1cnNvcikge1xuICBjb25zdCBtdWx0aXBsZXhlciA9IF9nZXRNdWx0aXBsZXhlcihjdXJzb3IpO1xuICBpZiAobXVsdGlwbGV4ZXIgJiYgbXVsdGlwbGV4ZXIuX29ic2VydmVEcml2ZXIpIHtcbiAgICByZXR1cm4gbXVsdGlwbGV4ZXIuX29ic2VydmVEcml2ZXI7XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldE11bHRpcGxleGVyKGN1cnNvcikge1xuICBjb25zdCBoYW5kbGVyID0gY3Vyc29yLm9ic2VydmVDaGFuZ2VzKHsgYWRkZWQ6IEZ1bmN0aW9uLnByb3RvdHlwZSB9KTtcbiAgaGFuZGxlci5zdG9wKCk7XG4gIHJldHVybiBoYW5kbGVyLl9tdWx0aXBsZXhlcjtcbn1cblxuZnVuY3Rpb24gX2dldFN5bmNocm9ub3VzQ3Vyc29yKGN1cnNvcikge1xuICBjdXJzb3IuZmV0Y2goKTtcbiAgY29uc3Qgc3luY2hyb25vdXNDdXJzb3IgPSBjdXJzb3IuX3N5bmNocm9ub3VzQ3Vyc29yO1xuICBpZiAoc3luY2hyb25vdXNDdXJzb3IpIHtcbiAgICByZXR1cm4gc3luY2hyb25vdXNDdXJzb3I7XG4gIH1cbn1cbiIsImltcG9ydCB7IGV4cG9zZU1vbmdvTGl2ZWRhdGEgfSBmcm9tIFwiLi9tb25nby1saXZlZGF0YVwiO1xuaW1wb3J0IHsgcnVuV2l0aEFGaWJlciB9IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgeyBleHBvc2VNb25nb0FzeW5jIH0gZnJvbSBcIi4vZmliZXJsZXNzL21vbmdvXCI7XG5cbi8qKlxuICogQG5hbWVzcGFjZSBNZXRlb3JYXG4gKi9cbk1ldGVvclggPSB7fTtcblxuTWV0ZW9yWC5fbW9uZ29JbnN0YWxsZWQgPSBQYWNrYWdlLmhhc093blByb3BlcnR5KFwibW9uZ29cIik7XG5NZXRlb3JYLl9yZWFkeUNhbGxiYWNrcyA9IFtdO1xuTWV0ZW9yWC5fcmVhZHkgPSBmYWxzZTtcbk1ldGVvclguX2ZpYmVyc0Rpc2FibGVkID0gTWV0ZW9yLmlzRmliZXJzRGlzYWJsZWQ7XG5cbk1ldGVvclgub25SZWFkeSA9IGZ1bmN0aW9uKGNiKSB7XG4gIGlmIChNZXRlb3JYLl9yZWFkeSkge1xuICAgIHJldHVybiBydW5XaXRoQUZpYmVyKGNiKTtcbiAgfVxuXG4gIHRoaXMuX3JlYWR5Q2FsbGJhY2tzLnB1c2goY2IpO1xufTtcblxuTWV0ZW9yWC5TZXJ2ZXIgPSBNZXRlb3Iuc2VydmVyLmNvbnN0cnVjdG9yO1xuXG5leHBvc2VMaXZlZGF0YShNZXRlb3JYKTtcblxuZnVuY3Rpb24gaW5pdFN5bmMoKSB7XG4gIHJ1bldpdGhBRmliZXIoKCkgPT4ge1xuICAgIGV4cG9zZU1vbmdvTGl2ZWRhdGEoTWV0ZW9yWCk7XG4gIH0pO1xuXG4gIE1ldGVvclguX3JlYWR5Q2FsbGJhY2tzLm1hcChydW5XaXRoQUZpYmVyKTtcbiAgTWV0ZW9yWC5fcmVhZHkgPSB0cnVlO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0QXN5bmMoKSB7XG4gIGF3YWl0IGV4cG9zZU1vbmdvQXN5bmMoTWV0ZW9yWCk7XG5cbiAgZm9yIChjb25zdCBjYiBvZiBNZXRlb3JYLl9yZWFkeUNhbGxiYWNrcykge1xuICAgIGF3YWl0IGNiKCk7XG4gIH1cblxuICBNZXRlb3JYLl9yZWFkeSA9IHRydWU7XG59XG5cbk1ldGVvci5zdGFydHVwKE1ldGVvclguX2ZpYmVyc0Rpc2FibGVkID8gaW5pdEFzeW5jIDogaW5pdFN5bmMpO1xuXG5cblxuIiwiZXhwb3J0IGZ1bmN0aW9uIHJ1bldpdGhBRmliZXIgKGNiKSB7XG4gIGlmIChNZXRlb3IuaXNGaWJlcnNEaXNhYmxlZCkge1xuICAgIGNiKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgRmliZXJzID0gcmVxdWlyZSgnZmliZXJzJyk7XG5cbiAgaWYgKEZpYmVycy5jdXJyZW50KSB7XG4gICAgY2IoKTtcbiAgfSBlbHNlIHtcbiAgICBuZXcgRmliZXIoY2IpLnJ1bigpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNb25nbywgTW9uZ29JbnRlcm5hbHMgfSBmcm9tIFwibWV0ZW9yL21vbmdvXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHBvc2VNb25nb0FzeW5jKE1ldGVvclgpIHtcbiAgaWYgKCFNZXRlb3JYLl9tb25nb0luc3RhbGxlZCkgcmV0dXJuXG5cbiAgaW1wb3J0IHsgTW9uZ29JbnRlcm5hbHMgfSBmcm9tIFwibWV0ZW9yL21vbmdvXCI7XG5cbiAgY29uc3QgY29sbCA9IF9nZXREdW1teUNvbGxlY3Rpb24oKTtcblxuICBhd2FpdCBjb2xsLmZpbmRPbmVBc3luYygpO1xuXG4gIGNvbnN0IGRyaXZlciA9IE1vbmdvSW50ZXJuYWxzLmRlZmF1bHRSZW1vdGVDb2xsZWN0aW9uRHJpdmVyKCk7XG5cbiAgTWV0ZW9yWC5Nb25nb0Nvbm5lY3Rpb24gPSBkcml2ZXIubW9uZ28uY29uc3RydWN0b3I7XG4gIGNvbnN0IGN1cnNvciA9IGNvbGwuZmluZCgpO1xuICBNZXRlb3JYLk1vbmdvQ3Vyc29yID0gY3Vyc29yLmNvbnN0cnVjdG9yO1xuXG4gIGF3YWl0IGV4cG9zZU9wbG9nRHJpdmVyKE1ldGVvclgsIGNvbGwpO1xuICBhd2FpdCBleHBvc2VQb2xsaW5nRHJpdmVyKE1ldGVvclgsIGNvbGwpO1xuICBhd2FpdCBleHBvc2VNdWx0aXBsZXhlcihNZXRlb3JYLCBjb2xsKTtcbiAgYXdhaXQgZXhwb3NlU3luY2hyb25vdXNDdXJzb3IoTWV0ZW9yWCwgY29sbCk7XG59XG5cbmZ1bmN0aW9uIF9nZXREdW1teUNvbGxlY3Rpb24oKSB7XG4gIGNvbnN0IENvbGxlY3Rpb24gPSB0eXBlb2YgTW9uZ28gIT09IFwidW5kZWZpbmVkXCIgPyBNb25nby5Db2xsZWN0aW9uIDogTWV0ZW9yLkNvbGxlY3Rpb247XG4gIHJldHVybiBuZXcgQ29sbGVjdGlvbihcIl9fZHVtbXlfY29sbF9cIiArIFJhbmRvbS5pZCgpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX2dldFN5bmNocm9ub3VzQ3Vyc29yKGN1cnNvcikge1xuICBhd2FpdCBjdXJzb3IuZmV0Y2hBc3luYygpO1xuICByZXR1cm4gY3Vyc29yLl9zeW5jaHJvbm91c0N1cnNvciB8fCB1bmRlZmluZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIF9nZXRNdWx0aXBsZXhlcihjdXJzb3IpIHtcbiAgY29uc3QgaGFuZGxlciA9IGF3YWl0IGN1cnNvci5vYnNlcnZlQ2hhbmdlcyh7IGFkZGVkOiBGdW5jdGlvbi5wcm90b3R5cGUgfSk7XG4gIGF3YWl0IGhhbmRsZXIuc3RvcCgpO1xuXG4gIHJldHVybiBoYW5kbGVyLl9tdWx0aXBsZXhlcjtcbn1cblxuYXN5bmMgZnVuY3Rpb24gX2dldE9ic2VydmVyRHJpdmVyKGN1cnNvcikge1xuICBjb25zdCBtdWx0aXBsZXhlciA9IGF3YWl0IF9nZXRNdWx0aXBsZXhlcihjdXJzb3IpO1xuXG4gIHJldHVybiBtdWx0aXBsZXhlciAmJiBtdWx0aXBsZXhlci5fb2JzZXJ2ZURyaXZlciB8fCB1bmRlZmluZWQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4cG9zZU9wbG9nRHJpdmVyKG5hbWVzcGFjZSwgY29sbCkge1xuICBjb25zdCBkcml2ZXIgPSBhd2FpdCBfZ2V0T2JzZXJ2ZXJEcml2ZXIoY29sbC5maW5kKHt9KSk7XG4gIC8vIHZlcmlmeSBvYnNlcnZlciBkcml2ZXIgaXMgYW4gb3Bsb2cgZHJpdmVyXG4gIGlmIChkcml2ZXIgJiYgdHlwZW9mIGRyaXZlci5jb25zdHJ1Y3Rvci5jdXJzb3JTdXBwb3J0ZWQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIG5hbWVzcGFjZS5Nb25nb09wbG9nRHJpdmVyID0gZHJpdmVyLmNvbnN0cnVjdG9yO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGV4cG9zZVBvbGxpbmdEcml2ZXIobmFtZXNwYWNlLCBjb2xsKSB7XG4gIGNvbnN0IGN1cnNvciA9IGNvbGwuZmluZCh7fSwgeyBsaW1pdDogMjAsIF9kaXNhYmxlT3Bsb2c6IHRydWUgfSk7XG4gIGNvbnN0IGRyaXZlciA9IGF3YWl0IF9nZXRPYnNlcnZlckRyaXZlcihjdXJzb3IpO1xuICAvLyB2ZXJpZnkgb2JzZXJ2ZXIgZHJpdmVyIGlzIGEgcG9sbGluZyBkcml2ZXJcbiAgaWYgKGRyaXZlciAmJiB0eXBlb2YgZHJpdmVyLmNvbnN0cnVjdG9yLmN1cnNvclN1cHBvcnRlZCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIG5hbWVzcGFjZS5Nb25nb1BvbGxpbmdEcml2ZXIgPSBkcml2ZXIuY29uc3RydWN0b3I7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZXhwb3NlU3luY2hyb25vdXNDdXJzb3IobmFtZXNwYWNlLCBjb2xsKSB7XG4gIGNvbnN0IHN5bmNocm9ub3VzQ3Vyc29yID0gYXdhaXQgX2dldFN5bmNocm9ub3VzQ3Vyc29yKGNvbGwuZmluZCh7fSkpO1xuICBpZiAoc3luY2hyb25vdXNDdXJzb3IpIHtcbiAgICBuYW1lc3BhY2UuU3luY2hyb25vdXNDdXJzb3IgPSBzeW5jaHJvbm91c0N1cnNvci5jb25zdHJ1Y3RvcjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBleHBvc2VNdWx0aXBsZXhlcihuYW1lc3BhY2UsIGNvbGwpIHtcbiAgY29uc3QgbXVsdGlwbGV4ZXIgPSBhd2FpdCBfZ2V0TXVsdGlwbGV4ZXIoY29sbC5maW5kKHt9KSk7XG5cbiAgaWYgKG11bHRpcGxleGVyKSB7XG4gICAgbmFtZXNwYWNlLk11bHRpcGxleGVyID0gbXVsdGlwbGV4ZXIuY29uc3RydWN0b3I7XG4gIH1cbn1cbiJdfQ==
