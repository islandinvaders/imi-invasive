(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var EventEmitter;

(function(){

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/raix_eventemitter/eventemitter.server.js                 //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
/* global EventEmitter: true */
EventEmitter = Npm.require('events').EventEmitter;

///////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("raix:eventemitter", {
  EventEmitter: EventEmitter
});

})();
