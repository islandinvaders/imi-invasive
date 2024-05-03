(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var check = Package.check.check;
var Match = Package.check.Match;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var Hook = Package['callback-hook'].Hook;
var URL = Package.url.URL;
var URLSearchParams = Package.url.URLSearchParams;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Accounts, options, stampedLoginToken, handler, name, query, oldestValidDate, user;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-base":{"server_main.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-base/server_main.js                                                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
!function (module1) {
  module1.export({
    AccountsServer: () => AccountsServer
  });
  let AccountsServer;
  module1.link("./accounts_server.js", {
    AccountsServer(v) {
      AccountsServer = v;
    }
  }, 0);
  /**
   * @namespace Accounts
   * @summary The namespace for all server-side accounts-related methods.
   */
  Accounts = new AccountsServer(Meteor.server);

  // Users table. Don't use the normal autopublish, since we want to hide
  // some fields. Code to autopublish this is in accounts_server.js.
  // XXX Allow users to configure this collection name.

  /**
   * @summary A [Mongo.Collection](#collections) containing user documents.
   * @locus Anywhere
   * @type {Mongo.Collection}
   * @importFromPackage meteor
  */
  Meteor.users = Accounts.users;
}.call(this, module);
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_common.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-base/accounts_common.js                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
module.export({
  AccountsCommon: () => AccountsCommon,
  EXPIRE_TOKENS_INTERVAL_MS: () => EXPIRE_TOKENS_INTERVAL_MS
});
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
// config option keys
const VALID_CONFIG_KEYS = ['sendVerificationEmail', 'forbidClientAccountCreation', 'passwordEnrollTokenExpiration', 'passwordEnrollTokenExpirationInDays', 'restrictCreationByEmailDomain', 'loginExpirationInDays', 'loginExpiration', 'passwordResetTokenExpirationInDays', 'passwordResetTokenExpiration', 'ambiguousErrorMessages', 'bcryptRounds', 'defaultFieldSelector', 'loginTokenExpirationHours', 'tokenSequenceLength', 'collection'];

/**
 * @summary Super-constructor for AccountsClient and AccountsServer.
 * @locus Anywhere
 * @class AccountsCommon
 * @instancename accountsClientOrServer
 * @param options {Object} an object with fields:
 * - connection {Object} Optional DDP connection to reuse.
 * - ddpUrl {String} Optional URL for creating a new DDP connection.
 * - collection {String|Mongo.Collection} The name of the Mongo.Collection
 *     or the Mongo.Collection object to hold the users.
 */
class AccountsCommon {
  constructor(options) {
    // Currently this is read directly by packages like accounts-password
    // and accounts-ui-unstyled.
    this._options = {};

    // Note that setting this.connection = null causes this.users to be a
    // LocalCollection, which is not what we want.
    this.connection = undefined;
    this._initConnection(options || {});

    // There is an allow call in accounts_server.js that restricts writes to
    // this collection.
    this.users = this._initializeCollection(options || {});

    // Callback exceptions are printed with Meteor._debug and ignored.
    this._onLoginHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: 'onLogin callback'
    });
    this._onLoginFailureHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: 'onLoginFailure callback'
    });
    this._onLogoutHook = new Hook({
      bindEnvironment: false,
      debugPrintExceptions: 'onLogout callback'
    });

    // Expose for testing.
    this.DEFAULT_LOGIN_EXPIRATION_DAYS = DEFAULT_LOGIN_EXPIRATION_DAYS;
    this.LOGIN_UNEXPIRING_TOKEN_DAYS = LOGIN_UNEXPIRING_TOKEN_DAYS;

    // Thrown when the user cancels the login process (eg, closes an oauth
    // popup, declines retina scan, etc)
    const lceName = 'Accounts.LoginCancelledError';
    this.LoginCancelledError = Meteor.makeErrorType(lceName, function (description) {
      this.message = description;
    });
    this.LoginCancelledError.prototype.name = lceName;

    // This is used to transmit specific subclass errors over the wire. We
    // should come up with a more generic way to do this (eg, with some sort of
    // symbolic error code rather than a number).
    this.LoginCancelledError.numericError = 0x8acdc2f;
  }
  _initializeCollection(options) {
    if (options.collection && typeof options.collection !== 'string' && !(options.collection instanceof Mongo.Collection)) {
      throw new Meteor.Error('Collection parameter can be only of type string or "Mongo.Collection"');
    }
    let collectionName = 'users';
    if (typeof options.collection === 'string') {
      collectionName = options.collection;
    }
    let collection;
    if (options.collection instanceof Mongo.Collection) {
      collection = options.collection;
    } else {
      collection = new Mongo.Collection(collectionName, {
        _preventAutopublish: true,
        connection: this.connection
      });
    }
    return collection;
  }

  /**
   * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   */
  userId() {
    throw new Error('userId method not implemented');
  }

  // merge the defaultFieldSelector with an existing options object
  _addDefaultFieldSelector() {
    let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    // this will be the most common case for most people, so make it quick
    if (!this._options.defaultFieldSelector) return options;

    // if no field selector then just use defaultFieldSelector
    if (!options.fields) return _objectSpread(_objectSpread({}, options), {}, {
      fields: this._options.defaultFieldSelector
    });

    // if empty field selector then the full user object is explicitly requested, so obey
    const keys = Object.keys(options.fields);
    if (!keys.length) return options;

    // if the requested fields are +ve then ignore defaultFieldSelector
    // assume they are all either +ve or -ve because Mongo doesn't like mixed
    if (!!options.fields[keys[0]]) return options;

    // The requested fields are -ve.
    // If the defaultFieldSelector is +ve then use requested fields, otherwise merge them
    const keys2 = Object.keys(this._options.defaultFieldSelector);
    return this._options.defaultFieldSelector[keys2[0]] ? options : _objectSpread(_objectSpread({}, options), {}, {
      fields: _objectSpread(_objectSpread({}, options.fields), this._options.defaultFieldSelector)
    });
  }

  /**
   * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
   * @locus Anywhere
   * @param {Object} [options]
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   */
  user(options) {
    const userId = this.userId();
    return userId ? this.users.findOne(userId, this._addDefaultFieldSelector(options)) : null;
  }

  /**
   * @summary Get the current user record, or `null` if no user is logged in.
   * @locus Anywhere
   * @param {Object} [options]
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
   */
  userAsync(options) {
    return Promise.asyncApply(() => {
      const userId = this.userId();
      return userId ? this.users.findOneAsync(userId, this._addDefaultFieldSelector(options)) : null;
    });
  }
  // Set up config for the accounts system. Call this on both the client
  // and the server.
  //
  // Note that this method gets overridden on AccountsServer.prototype, but
  // the overriding method calls the overridden method.
  //
  // XXX we should add some enforcement that this is called on both the
  // client and the server. Otherwise, a user can
  // 'forbidClientAccountCreation' only on the client and while it looks
  // like their app is secure, the server will still accept createUser
  // calls. https://github.com/meteor/meteor/issues/828
  //
  // @param options {Object} an object with fields:
  // - sendVerificationEmail {Boolean}
  //     Send email address verification emails to new users created from
  //     client signups.
  // - forbidClientAccountCreation {Boolean}
  //     Do not allow clients to create accounts directly.
  // - restrictCreationByEmailDomain {Function or String}
  //     Require created users to have an email matching the function or
  //     having the string as domain.
  // - loginExpirationInDays {Number}
  //     Number of days since login until a user is logged out (login token
  //     expires).
  // - collection {String|Mongo.Collection}
  //     A collection name or a Mongo.Collection object to hold the users.
  // - passwordResetTokenExpirationInDays {Number}
  //     Number of days since password reset token creation until the
  //     token cannt be used any longer (password reset token expires).
  // - ambiguousErrorMessages {Boolean}
  //     Return ambiguous error messages from login failures to prevent
  //     user enumeration.
  // - bcryptRounds {Number}
  //     Allows override of number of bcrypt rounds (aka work factor) used
  //     to store passwords.

  /**
   * @summary Set global accounts options. You can also set these in `Meteor.settings.packages.accounts` without the need to call this function.
   * @locus Anywhere
   * @param {Object} options
   * @param {Boolean} options.sendVerificationEmail New users with an email address will receive an address verification email.
   * @param {Boolean} options.forbidClientAccountCreation Calls to [`createUser`](#accounts_createuser) from the client will be rejected. In addition, if you are using [accounts-ui](#accountsui), the "Create account" link will not be available.
   * @param {String | Function} options.restrictCreationByEmailDomain If set to a string, only allows new users if the domain part of their email address matches the string. If set to a function, only allows new users if the function returns true.  The function is passed the full email address of the proposed new user.  Works with password-based sign-in and external services that expose email addresses (Google, Facebook, GitHub). All existing users still can log in after enabling this option. Example: `Accounts.config({ restrictCreationByEmailDomain: 'school.edu' })`.
   * @param {Number} options.loginExpirationInDays The number of days from when a user logs in until their token expires and they are logged out. Defaults to 90. Set to `null` to disable login expiration.
   * @param {Number} options.loginExpiration The number of milliseconds from when a user logs in until their token expires and they are logged out, for a more granular control. If `loginExpirationInDays` is set, it takes precedent.
   * @param {String} options.oauthSecretKey When using the `oauth-encryption` package, the 16 byte key using to encrypt sensitive account credentials in the database, encoded in base64.  This option may only be specified on the server.  See packages/oauth-encryption/README.md for details.
   * @param {Number} options.passwordResetTokenExpirationInDays The number of days from when a link to reset password is sent until token expires and user can't reset password with the link anymore. Defaults to 3.
   * @param {Number} options.passwordResetTokenExpiration The number of milliseconds from when a link to reset password is sent until token expires and user can't reset password with the link anymore. If `passwordResetTokenExpirationInDays` is set, it takes precedent.
   * @param {Number} options.passwordEnrollTokenExpirationInDays The number of days from when a link to set initial password is sent until token expires and user can't set password with the link anymore. Defaults to 30.
   * @param {Number} options.passwordEnrollTokenExpiration The number of milliseconds from when a link to set initial password is sent until token expires and user can't set password with the link anymore. If `passwordEnrollTokenExpirationInDays` is set, it takes precedent.
   * @param {Boolean} options.ambiguousErrorMessages Return ambiguous error messages from login failures to prevent user enumeration. Defaults to false.
   * @param {MongoFieldSpecifier} options.defaultFieldSelector To exclude by default large custom fields from `Meteor.user()` and `Meteor.findUserBy...()` functions when called without a field selector, and all `onLogin`, `onLoginFailure` and `onLogout` callbacks.  Example: `Accounts.config({ defaultFieldSelector: { myBigArray: 0 }})`. Beware when using this. If, for instance, you do not include `email` when excluding the fields, you can have problems with functions like `forgotPassword` that will break because they won't have the required data available. It's recommend that you always keep the fields `_id`, `username`, and `email`.
   * @param {String|Mongo.Collection} options.collection A collection name or a Mongo.Collection object to hold the users.
   * @param {Number} options.loginTokenExpirationHours When using the package `accounts-2fa`, use this to set the amount of time a token sent is valid. As it's just a number, you can use, for example, 0.5 to make the token valid for just half hour. The default is 1 hour.
   * @param {Number} options.tokenSequenceLength When using the package `accounts-2fa`, use this to the size of the token sequence generated. The default is 6.
   */
  config(options) {
    // We don't want users to accidentally only call Accounts.config on the
    // client, where some of the options will have partial effects (eg removing
    // the "create account" button from accounts-ui if forbidClientAccountCreation
    // is set, or redirecting Google login to a specific-domain page) without
    // having their full effects.
    if (Meteor.isServer) {
      __meteor_runtime_config__.accountsConfigCalled = true;
    } else if (!__meteor_runtime_config__.accountsConfigCalled) {
      // XXX would be nice to "crash" the client and replace the UI with an error
      // message, but there's no trivial way to do this.
      Meteor._debug('Accounts.config was called on the client but not on the ' + 'server; some configuration options may not take effect.');
    }

    // We need to validate the oauthSecretKey option at the time
    // Accounts.config is called. We also deliberately don't store the
    // oauthSecretKey in Accounts._options.
    if (Object.prototype.hasOwnProperty.call(options, 'oauthSecretKey')) {
      if (Meteor.isClient) {
        throw new Error('The oauthSecretKey option may only be specified on the server');
      }
      if (!Package['oauth-encryption']) {
        throw new Error('The oauth-encryption package must be loaded to set oauthSecretKey');
      }
      Package['oauth-encryption'].OAuthEncryption.loadKey(options.oauthSecretKey);
      options = _objectSpread({}, options);
      delete options.oauthSecretKey;
    }

    // Validate config options keys
    Object.keys(options).forEach(key => {
      if (!VALID_CONFIG_KEYS.includes(key)) {
        // TODO Consider just logging a debug message instead to allow for additional keys in the settings here?
        throw new Meteor.Error("Accounts.config: Invalid key: ".concat(key));
      }
    });

    // set values in Accounts._options
    VALID_CONFIG_KEYS.forEach(key => {
      if (key in options) {
        if (key in this._options) {
          if (key !== 'collection') {
            throw new Meteor.Error("Can't set `".concat(key, "` more than once"));
          }
        }
        this._options[key] = options[key];
      }
    });
    if (options.collection && options.collection !== this.users._name && options.collection !== this.users) {
      this.users = this._initializeCollection(options);
    }
  }

  /**
   * @summary Register a callback to be called after a login attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when login is successful.
   *                        The callback receives a single object that
   *                        holds login details. This object contains the login
   *                        result type (password, resume, etc.) on both the
   *                        client and server. `onLogin` callbacks registered
   *                        on the server also receive extra data, such
   *                        as user details, connection information, etc.
   */
  onLogin(func) {
    let ret = this._onLoginHook.register(func);
    // call the just registered callback if already logged in
    this._startupCallback(ret.callback);
    return ret;
  }

  /**
   * @summary Register a callback to be called after a login attempt fails.
   * @locus Anywhere
   * @param {Function} func The callback to be called after the login has failed.
   */
  onLoginFailure(func) {
    return this._onLoginFailureHook.register(func);
  }

  /**
   * @summary Register a callback to be called after a logout attempt succeeds.
   * @locus Anywhere
   * @param {Function} func The callback to be called when logout is successful.
   */
  onLogout(func) {
    return this._onLogoutHook.register(func);
  }
  _initConnection(options) {
    if (!Meteor.isClient) {
      return;
    }

    // The connection used by the Accounts system. This is the connection
    // that will get logged in by Meteor.login(), and this is the
    // connection whose login state will be reflected by Meteor.userId().
    //
    // It would be much preferable for this to be in accounts_client.js,
    // but it has to be here because it's needed to create the
    // Meteor.users collection.
    if (options.connection) {
      this.connection = options.connection;
    } else if (options.ddpUrl) {
      this.connection = DDP.connect(options.ddpUrl);
    } else if (typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__.ACCOUNTS_CONNECTION_URL) {
      // Temporary, internal hook to allow the server to point the client
      // to a different authentication server. This is for a very
      // particular use case that comes up when implementing a oauth
      // server. Unsupported and may go away at any point in time.
      //
      // We will eventually provide a general way to use account-base
      // against any DDP connection, not just one special one.
      this.connection = DDP.connect(__meteor_runtime_config__.ACCOUNTS_CONNECTION_URL);
    } else {
      this.connection = Meteor.connection;
    }
  }
  _getTokenLifetimeMs() {
    // When loginExpirationInDays is set to null, we'll use a really high
    // number of days (LOGIN_UNEXPIRABLE_TOKEN_DAYS) to simulate an
    // unexpiring token.
    const loginExpirationInDays = this._options.loginExpirationInDays === null ? LOGIN_UNEXPIRING_TOKEN_DAYS : this._options.loginExpirationInDays;
    return this._options.loginExpiration || (loginExpirationInDays || DEFAULT_LOGIN_EXPIRATION_DAYS) * 86400000;
  }
  _getPasswordResetTokenLifetimeMs() {
    return this._options.passwordResetTokenExpiration || (this._options.passwordResetTokenExpirationInDays || DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS) * 86400000;
  }
  _getPasswordEnrollTokenLifetimeMs() {
    return this._options.passwordEnrollTokenExpiration || (this._options.passwordEnrollTokenExpirationInDays || DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS) * 86400000;
  }
  _tokenExpiration(when) {
    // We pass when through the Date constructor for backwards compatibility;
    // `when` used to be a number.
    return new Date(new Date(when).getTime() + this._getTokenLifetimeMs());
  }
  _tokenExpiresSoon(when) {
    let minLifetimeMs = 0.1 * this._getTokenLifetimeMs();
    const minLifetimeCapMs = MIN_TOKEN_LIFETIME_CAP_SECS * 1000;
    if (minLifetimeMs > minLifetimeCapMs) {
      minLifetimeMs = minLifetimeCapMs;
    }
    return new Date() > new Date(when) - minLifetimeMs;
  }

  // No-op on the server, overridden on the client.
  _startupCallback(callback) {}
}
// Note that Accounts is defined separately in accounts_client.js and
// accounts_server.js.

/**
 * @summary Get the current user id, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 */
Meteor.userId = () => Accounts.userId();

/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 */
Meteor.user = options => Accounts.user(options);

/**
 * @summary Get the current user record, or `null` if no user is logged in. A reactive data source.
 * @locus Anywhere but publish functions
 * @importFromPackage meteor
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 */
Meteor.userAsync = options => Accounts.userAsync(options);

// how long (in days) until a login token expires
const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
// how long (in days) until reset password token expires
const DEFAULT_PASSWORD_RESET_TOKEN_EXPIRATION_DAYS = 3;
// how long (in days) until enrol password token expires
const DEFAULT_PASSWORD_ENROLL_TOKEN_EXPIRATION_DAYS = 30;
// Clients don't try to auto-login with a token that is going to expire within
// .1 * DEFAULT_LOGIN_EXPIRATION_DAYS, capped at MIN_TOKEN_LIFETIME_CAP_SECS.
// Tries to avoid abrupt disconnects from expiring tokens.
const MIN_TOKEN_LIFETIME_CAP_SECS = 3600; // one hour
// how often (in milliseconds) we check for expired tokens
const EXPIRE_TOKENS_INTERVAL_MS = 600 * 1000;
// 10 minutes
// A large number of expiration days (approximately 100 years worth) that is
// used when creating unexpiring tokens.
const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"accounts_server.js":function module(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/accounts-base/accounts_server.js                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var _Package$oauthEncryp;
const _excluded = ["token"];
let _objectWithoutProperties;
module.link("@babel/runtime/helpers/objectWithoutProperties", {
  default(v) {
    _objectWithoutProperties = v;
  }
}, 0);
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 1);
module.export({
  AccountsServer: () => AccountsServer
});
let crypto;
module.link("crypto", {
  default(v) {
    crypto = v;
  }
}, 0);
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 1);
let AccountsCommon, EXPIRE_TOKENS_INTERVAL_MS;
module.link("./accounts_common.js", {
  AccountsCommon(v) {
    AccountsCommon = v;
  },
  EXPIRE_TOKENS_INTERVAL_MS(v) {
    EXPIRE_TOKENS_INTERVAL_MS = v;
  }
}, 2);
let URL;
module.link("meteor/url", {
  URL(v) {
    URL = v;
  }
}, 3);
const hasOwn = Object.prototype.hasOwnProperty;

// XXX maybe this belongs in the check package
const NonEmptyString = Match.Where(x => {
  check(x, String);
  return x.length > 0;
});

/**
 * @summary Constructor for the `Accounts` namespace on the server.
 * @locus Server
 * @class AccountsServer
 * @extends AccountsCommon
 * @instancename accountsServer
 * @param {Object} server A server object such as `Meteor.server`.
 */
class AccountsServer extends AccountsCommon {
  // Note that this constructor is less likely to be instantiated multiple
  // times than the `AccountsClient` constructor, because a single server
  // can provide only one set of methods.
  constructor(server, _options) {
    var _this;
    super(_options || {});
    _this = this;
    ///
    /// CREATE USER HOOKS
    ///
    /**
     * @summary Customize login token creation.
     * @locus Server
     * @param {Function} func Called whenever a new token is created.
     * Return the sequence and the user object. Return true to keep sending the default email, or false to override the behavior.
     */
    this.onCreateLoginToken = function (func) {
      if (this._onCreateLoginTokenHook) {
        throw new Error('Can only call onCreateLoginToken once');
      }
      this._onCreateLoginTokenHook = func;
    };
    // Generates a MongoDB selector that can be used to perform a fast case
    // insensitive lookup for the given fieldName and string. Since MongoDB does
    // not support case insensitive indexes, and case insensitive regex queries
    // are slow, we construct a set of prefix selectors for all permutations of
    // the first 4 characters ourselves. We first attempt to matching against
    // these, and because 'prefix expression' regex queries do use indexes (see
    // http://docs.mongodb.org/v2.6/reference/operator/query/regex/#index-use),
    // this has been found to greatly improve performance (from 1200ms to 5ms in a
    // test with 1.000.000 users).
    this._selectorForFastCaseInsensitiveLookup = (fieldName, string) => {
      // Performance seems to improve up to 4 prefix characters
      const prefix = string.substring(0, Math.min(string.length, 4));
      const orClause = generateCasePermutationsForString(prefix).map(prefixPermutation => {
        const selector = {};
        selector[fieldName] = new RegExp("^".concat(Meteor._escapeRegExp(prefixPermutation)));
        return selector;
      });
      const caseInsensitiveClause = {};
      caseInsensitiveClause[fieldName] = new RegExp("^".concat(Meteor._escapeRegExp(string), "$"), 'i');
      return {
        $and: [{
          $or: orClause
        }, caseInsensitiveClause]
      };
    };
    this._findUserByQuery = (query, options) => {
      let user = null;
      if (query.id) {
        // default field selector is added within getUserById()
        user = Meteor.users.findOne(query.id, this._addDefaultFieldSelector(options));
      } else {
        options = this._addDefaultFieldSelector(options);
        let fieldName;
        let fieldValue;
        if (query.username) {
          fieldName = 'username';
          fieldValue = query.username;
        } else if (query.email) {
          fieldName = 'emails.address';
          fieldValue = query.email;
        } else {
          throw new Error("shouldn't happen (validation missed something)");
        }
        let selector = {};
        selector[fieldName] = fieldValue;
        user = Meteor.users.findOne(selector, options);
        // If user is not found, try a case insensitive lookup
        if (!user) {
          selector = this._selectorForFastCaseInsensitiveLookup(fieldName, fieldValue);
          const candidateUsers = Meteor.users.find(selector, _objectSpread(_objectSpread({}, options), {}, {
            limit: 2
          })).fetch();
          // No match if multiple candidates are found
          if (candidateUsers.length === 1) {
            user = candidateUsers[0];
          }
        }
      }
      return user;
    };
    this._handleError = function (msg) {
      let throwError = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
      let errorCode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 403;
      const error = new Meteor.Error(errorCode, _this._options.ambiguousErrorMessages ? "Something went wrong. Please check your credentials." : msg);
      if (throwError) {
        throw error;
      }
      return error;
    };
    this._userQueryValidator = Match.Where(user => {
      check(user, {
        id: Match.Optional(NonEmptyString),
        username: Match.Optional(NonEmptyString),
        email: Match.Optional(NonEmptyString)
      });
      if (Object.keys(user).length !== 1) throw new Match.Error("User property must have exactly one field");
      return true;
    });
    this._server = server || Meteor.server;
    // Set up the server's methods, as if by calling Meteor.methods.
    this._initServerMethods();
    this._initAccountDataHooks();

    // If autopublish is on, publish these user fields. Login service
    // packages (eg accounts-google) add to these by calling
    // addAutopublishFields.  Notably, this isn't implemented with multiple
    // publishes since DDP only merges only across top-level fields, not
    // subfields (such as 'services.facebook.accessToken')
    this._autopublishFields = {
      loggedInUser: ['profile', 'username', 'emails'],
      otherUsers: ['profile', 'username']
    };

    // use object to keep the reference when used in functions
    // where _defaultPublishFields is destructured into lexical scope
    // for publish callbacks that need `this`
    this._defaultPublishFields = {
      projection: {
        profile: 1,
        username: 1,
        emails: 1
      }
    };
    this._initServerPublications();

    // connectionId -> {connection, loginToken}
    this._accountData = {};

    // connection id -> observe handle for the login token that this connection is
    // currently associated with, or a number. The number indicates that we are in
    // the process of setting up the observe (using a number instead of a single
    // sentinel allows multiple attempts to set up the observe to identify which
    // one was theirs).
    this._userObservesForConnections = {};
    this._nextUserObserveNumber = 1; // for the number described above.

    // list of all registered handlers.
    this._loginHandlers = [];
    setupUsersCollection(this.users);
    setupDefaultLoginHandlers(this);
    setExpireTokensInterval(this);
    this._validateLoginHook = new Hook({
      bindEnvironment: false
    });
    this._validateNewUserHooks = [defaultValidateNewUserHook.bind(this)];
    this._deleteSavedTokensForAllUsersOnStartup();
    this._skipCaseInsensitiveChecksForTest = {};
    this.urls = {
      resetPassword: (token, extraParams) => this.buildEmailUrl("#/reset-password/".concat(token), extraParams),
      verifyEmail: (token, extraParams) => this.buildEmailUrl("#/verify-email/".concat(token), extraParams),
      loginToken: (selector, token, extraParams) => this.buildEmailUrl("/?loginToken=".concat(token, "&selector=").concat(selector), extraParams),
      enrollAccount: (token, extraParams) => this.buildEmailUrl("#/enroll-account/".concat(token), extraParams)
    };
    this.addDefaultRateLimit();
    this.buildEmailUrl = function (path) {
      let extraParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      const url = new URL(Meteor.absoluteUrl(path));
      const params = Object.entries(extraParams);
      if (params.length > 0) {
        // Add additional parameters to the url
        for (const [key, value] of params) {
          url.searchParams.append(key, value);
        }
      }
      return url.toString();
    };
  }

  ///
  /// CURRENT USER
  ///

  // @override of "abstract" non-implementation in accounts_common.js
  userId() {
    // This function only works if called inside a method or a pubication.
    // Using any of the information from Meteor.user() in a method or
    // publish function will always use the value from when the function first
    // runs. This is likely not what the user expects. The way to make this work
    // in a method or publish function is to do Meteor.find(this.userId).observe
    // and recompute when the user record changes.
    const currentInvocation = DDP._CurrentMethodInvocation.get() || DDP._CurrentPublicationInvocation.get();
    if (!currentInvocation) throw new Error("Meteor.userId can only be invoked in method calls or publications.");
    return currentInvocation.userId;
  }

  ///
  /// LOGIN HOOKS
  ///

  /**
   * @summary Validate login attempts.
   * @locus Server
   * @param {Function} func Called whenever a login is attempted (either successful or unsuccessful).  A login can be aborted by returning a falsy value or throwing an exception.
   */
  validateLoginAttempt(func) {
    // Exceptions inside the hook callback are passed up to us.
    return this._validateLoginHook.register(func);
  }

  /**
   * @summary Set restrictions on new user creation.
   * @locus Server
   * @param {Function} func Called whenever a new user is created. Takes the new user object, and returns true to allow the creation or false to abort.
   */
  validateNewUser(func) {
    this._validateNewUserHooks.push(func);
  }

  /**
   * @summary Validate login from external service
   * @locus Server
   * @param {Function} func Called whenever login/user creation from external service is attempted. Login or user creation based on this login can be aborted by passing a falsy value or throwing an exception.
   */
  beforeExternalLogin(func) {
    if (this._beforeExternalLoginHook) {
      throw new Error("Can only call beforeExternalLogin once");
    }
    this._beforeExternalLoginHook = func;
  }
  /**
   * @summary Customize new user creation.
   * @locus Server
   * @param {Function} func Called whenever a new user is created. Return the new user object, or throw an `Error` to abort the creation.
   */
  onCreateUser(func) {
    if (this._onCreateUserHook) {
      throw new Error("Can only call onCreateUser once");
    }
    this._onCreateUserHook = Meteor.wrapFn(func);
  }

  /**
   * @summary Customize oauth user profile updates
   * @locus Server
   * @param {Function} func Called whenever a user is logged in via oauth. Return the profile object to be merged, or throw an `Error` to abort the creation.
   */
  onExternalLogin(func) {
    if (this._onExternalLoginHook) {
      throw new Error("Can only call onExternalLogin once");
    }
    this._onExternalLoginHook = func;
  }

  /**
   * @summary Customize user selection on external logins
   * @locus Server
   * @param {Function} func Called whenever a user is logged in via oauth and a
   * user is not found with the service id. Return the user or undefined.
   */
  setAdditionalFindUserOnExternalLogin(func) {
    if (this._additionalFindUserOnExternalLogin) {
      throw new Error("Can only call setAdditionalFindUserOnExternalLogin once");
    }
    this._additionalFindUserOnExternalLogin = func;
  }
  _validateLogin(connection, attempt) {
    this._validateLoginHook.forEach(callback => {
      let ret;
      try {
        ret = callback(cloneAttemptWithConnection(connection, attempt));
      } catch (e) {
        attempt.allowed = false;
        // XXX this means the last thrown error overrides previous error
        // messages. Maybe this is surprising to users and we should make
        // overriding errors more explicit. (see
        // https://github.com/meteor/meteor/issues/1960)
        attempt.error = e;
        return true;
      }
      if (!ret) {
        attempt.allowed = false;
        // don't override a specific error provided by a previous
        // validator or the initial attempt (eg "incorrect password").
        if (!attempt.error) attempt.error = new Meteor.Error(403, "Login forbidden");
      }
      return true;
    });
  }
  _successfulLogin(connection, attempt) {
    this._onLoginHook.each(callback => {
      callback(cloneAttemptWithConnection(connection, attempt));
      return true;
    });
  }
  _failedLogin(connection, attempt) {
    this._onLoginFailureHook.each(callback => {
      callback(cloneAttemptWithConnection(connection, attempt));
      return true;
    });
  }
  _successfulLogout(connection, userId) {
    // don't fetch the user object unless there are some callbacks registered
    let user;
    this._onLogoutHook.each(callback => {
      if (!user && userId) user = this.users.findOne(userId, {
        fields: this._options.defaultFieldSelector
      });
      callback({
        user,
        connection
      });
      return true;
    });
  }
  ///
  /// LOGIN METHODS
  ///

  // Login methods return to the client an object containing these
  // fields when the user was logged in successfully:
  //
  //   id: userId
  //   token: *
  //   tokenExpires: *
  //
  // tokenExpires is optional and intends to provide a hint to the
  // client as to when the token will expire. If not provided, the
  // client will call Accounts._tokenExpiration, passing it the date
  // that it received the token.
  //
  // The login method will throw an error back to the client if the user
  // failed to log in.
  //
  //
  // Login handlers and service specific login methods such as
  // `createUser` internally return a `result` object containing these
  // fields:
  //
  //   type:
  //     optional string; the service name, overrides the handler
  //     default if present.
  //
  //   error:
  //     exception; if the user is not allowed to login, the reason why.
  //
  //   userId:
  //     string; the user id of the user attempting to login (if
  //     known), required for an allowed login.
  //
  //   options:
  //     optional object merged into the result returned by the login
  //     method; used by HAMK from SRP.
  //
  //   stampedLoginToken:
  //     optional object with `token` and `when` indicating the login
  //     token is already present in the database, returned by the
  //     "resume" login handler.
  //
  // For convenience, login methods can also throw an exception, which
  // is converted into an {error} result.  However, if the id of the
  // user attempting the login is known, a {userId, error} result should
  // be returned instead since the user id is not captured when an
  // exception is thrown.
  //
  // This internal `result` object is automatically converted into the
  // public {id, token, tokenExpires} object returned to the client.

  // Try a login method, converting thrown exceptions into an {error}
  // result.  The `type` argument is a default, inserted into the result
  // object if not explicitly returned.
  //
  // Log in a user on a connection.
  //
  // We use the method invocation to set the user id on the connection,
  // not the connection object directly. setUserId is tied to methods to
  // enforce clear ordering of method application (using wait methods on
  // the client, and a no setUserId after unblock restriction on the
  // server)
  //
  // The `stampedLoginToken` parameter is optional.  When present, it
  // indicates that the login token has already been inserted into the
  // database and doesn't need to be inserted again.  (It's used by the
  // "resume" login handler).
  _loginUser(methodInvocation, userId, stampedLoginToken) {
    if (!stampedLoginToken) {
      stampedLoginToken = this._generateStampedLoginToken();
      this._insertLoginToken(userId, stampedLoginToken);
    }

    // This order (and the avoidance of yields) is important to make
    // sure that when publish functions are rerun, they see a
    // consistent view of the world: the userId is set and matches
    // the login token on the connection (not that there is
    // currently a public API for reading the login token on a
    // connection).
    Meteor._noYieldsAllowed(() => this._setLoginToken(userId, methodInvocation.connection, this._hashLoginToken(stampedLoginToken.token)));
    methodInvocation.setUserId(userId);
    return {
      id: userId,
      token: stampedLoginToken.token,
      tokenExpires: this._tokenExpiration(stampedLoginToken.when)
    };
  }
  // After a login method has completed, call the login hooks.  Note
  // that `attemptLogin` is called for *all* login attempts, even ones
  // which aren't successful (such as an invalid password, etc).
  //
  // If the login is allowed and isn't aborted by a validate login hook
  // callback, log in the user.
  //
  _attemptLogin(methodInvocation, methodName, methodArgs, result) {
    return Promise.asyncApply(() => {
      if (!result) throw new Error("result is required");

      // XXX A programming error in a login handler can lead to this occurring, and
      // then we don't call onLogin or onLoginFailure callbacks. Should
      // tryLoginMethod catch this case and turn it into an error?
      if (!result.userId && !result.error) throw new Error("A login method must specify a userId or an error");
      let user;
      if (result.userId) user = this.users.findOne(result.userId, {
        fields: this._options.defaultFieldSelector
      });
      const attempt = {
        type: result.type || "unknown",
        allowed: !!(result.userId && !result.error),
        methodName: methodName,
        methodArguments: Array.from(methodArgs)
      };
      if (result.error) {
        attempt.error = result.error;
      }
      if (user) {
        attempt.user = user;
      }

      // _validateLogin may mutate `attempt` by adding an error and changing allowed
      // to false, but that's the only change it can make (and the user's callbacks
      // only get a clone of `attempt`).
      this._validateLogin(methodInvocation.connection, attempt);
      if (attempt.allowed) {
        const ret = _objectSpread(_objectSpread({}, this._loginUser(methodInvocation, result.userId, result.stampedLoginToken)), result.options);
        ret.type = attempt.type;
        this._successfulLogin(methodInvocation.connection, attempt);
        return ret;
      } else {
        this._failedLogin(methodInvocation.connection, attempt);
        throw attempt.error;
      }
    });
  }
  // All service specific login methods should go through this function.
  // Ensure that thrown exceptions are caught and that login hook
  // callbacks are still called.
  //
  _loginMethod(methodInvocation, methodName, methodArgs, type, fn) {
    return Promise.asyncApply(() => {
      return Promise.await(this._attemptLogin(methodInvocation, methodName, methodArgs, Promise.await(tryLoginMethod(type, fn))));
    });
  }
  // Report a login attempt failed outside the context of a normal login
  // method. This is for use in the case where there is a multi-step login
  // procedure (eg SRP based password login). If a method early in the
  // chain fails, it should call this function to report a failure. There
  // is no corresponding method for a successful login; methods that can
  // succeed at logging a user in should always be actual login methods
  // (using either Accounts._loginMethod or Accounts.registerLoginHandler).
  _reportLoginFailure(methodInvocation, methodName, methodArgs, result) {
    const attempt = {
      type: result.type || "unknown",
      allowed: false,
      error: result.error,
      methodName: methodName,
      methodArguments: Array.from(methodArgs)
    };
    if (result.userId) {
      attempt.user = this.users.findOne(result.userId, {
        fields: this._options.defaultFieldSelector
      });
    }
    this._validateLogin(methodInvocation.connection, attempt);
    this._failedLogin(methodInvocation.connection, attempt);

    // _validateLogin may mutate attempt to set a new error message. Return
    // the modified version.
    return attempt;
  }
  ///
  /// LOGIN HANDLERS
  ///

  /**
   * @summary Registers a new login handler.
   * @locus Server
   * @param {String} [name] The type of login method like oauth, password, etc.
   * @param {Function} handler A function that receives an options object
   * (as passed as an argument to the `login` method) and returns one of
   * `undefined`, meaning don't handle or a login method result object.
   */
  registerLoginHandler(name, handler) {
    if (!handler) {
      handler = name;
      name = null;
    }
    this._loginHandlers.push({
      name: name,
      handler: Meteor.wrapFn(handler)
    });
  }
  // Checks a user's credentials against all the registered login
  // handlers, and returns a login token if the credentials are valid. It
  // is like the login method, except that it doesn't set the logged-in
  // user on the connection. Throws a Meteor.Error if logging in fails,
  // including the case where none of the login handlers handled the login
  // request. Otherwise, returns {id: userId, token: *, tokenExpires: *}.
  //
  // For example, if you want to login with a plaintext password, `options` could be
  //   { user: { username: <username> }, password: <password> }, or
  //   { user: { email: <email> }, password: <password> }.

  // Try all of the registered login handlers until one of them doesn't
  // return `undefined`, meaning it handled this call to `login`. Return
  // that return value.
  _runLoginHandlers(methodInvocation, options) {
    return Promise.asyncApply(() => {
      for (let handler of this._loginHandlers) {
        const result = Promise.await(tryLoginMethod(handler.name, () => Promise.asyncApply(() => Promise.await(handler.handler.call(methodInvocation, options)))));
        if (result) {
          return result;
        }
        if (result !== undefined) {
          throw new Meteor.Error(400, 'A login handler should return a result or undefined');
        }
      }
      return {
        type: null,
        error: new Meteor.Error(400, "Unrecognized options for login request")
      };
    });
  }
  // Deletes the given loginToken from the database.
  //
  // For new-style hashed token, this will cause all connections
  // associated with the token to be closed.
  //
  // Any connections associated with old-style unhashed tokens will be
  // in the process of becoming associated with hashed tokens and then
  // they'll get closed.
  destroyToken(userId, loginToken) {
    this.users.update(userId, {
      $pull: {
        "services.resume.loginTokens": {
          $or: [{
            hashedToken: loginToken
          }, {
            token: loginToken
          }]
        }
      }
    });
  }
  _initServerMethods() {
    // The methods created in this function need to be created here so that
    // this variable is available in their scope.
    const accounts = this;

    // This object will be populated with methods and then passed to
    // accounts._server.methods further below.
    const methods = {};

    // @returns {Object|null}
    //   If successful, returns {token: reconnectToken, id: userId}
    //   If unsuccessful (for example, if the user closed the oauth login popup),
    //     throws an error describing the reason
    methods.login = function (options) {
      return Promise.asyncApply(() => {
        // Login handlers should really also check whatever field they look at in
        // options, but we don't enforce it.
        check(options, Object);
        const result = Promise.await(accounts._runLoginHandlers(this, options));
        //console.log({result});

        return Promise.await(accounts._attemptLogin(this, "login", arguments, result));
      });
    };
    methods.logout = function () {
      const token = accounts._getLoginToken(this.connection.id);
      accounts._setLoginToken(this.userId, this.connection, null);
      if (token && this.userId) {
        accounts.destroyToken(this.userId, token);
      }
      accounts._successfulLogout(this.connection, this.userId);
      this.setUserId(null);
    };

    // Generates a new login token with the same expiration as the
    // connection's current token and saves it to the database. Associates
    // the connection with this new token and returns it. Throws an error
    // if called on a connection that isn't logged in.
    //
    // @returns Object
    //   If successful, returns { token: <new token>, id: <user id>,
    //   tokenExpires: <expiration date> }.
    methods.getNewToken = function () {
      const user = accounts.users.findOne(this.userId, {
        fields: {
          "services.resume.loginTokens": 1
        }
      });
      if (!this.userId || !user) {
        throw new Meteor.Error("You are not logged in.");
      }
      // Be careful not to generate a new token that has a later
      // expiration than the curren token. Otherwise, a bad guy with a
      // stolen token could use this method to stop his stolen token from
      // ever expiring.
      const currentHashedToken = accounts._getLoginToken(this.connection.id);
      const currentStampedToken = user.services.resume.loginTokens.find(stampedToken => stampedToken.hashedToken === currentHashedToken);
      if (!currentStampedToken) {
        // safety belt: this should never happen
        throw new Meteor.Error("Invalid login token");
      }
      const newStampedToken = accounts._generateStampedLoginToken();
      newStampedToken.when = currentStampedToken.when;
      accounts._insertLoginToken(this.userId, newStampedToken);
      return accounts._loginUser(this, this.userId, newStampedToken);
    };

    // Removes all tokens except the token associated with the current
    // connection. Throws an error if the connection is not logged
    // in. Returns nothing on success.
    methods.removeOtherTokens = function () {
      if (!this.userId) {
        throw new Meteor.Error("You are not logged in.");
      }
      const currentToken = accounts._getLoginToken(this.connection.id);
      accounts.users.update(this.userId, {
        $pull: {
          "services.resume.loginTokens": {
            hashedToken: {
              $ne: currentToken
            }
          }
        }
      });
    };

    // Allow a one-time configuration for a login service. Modifications
    // to this collection are also allowed in insecure mode.
    methods.configureLoginService = options => {
      check(options, Match.ObjectIncluding({
        service: String
      }));
      // Don't let random users configure a service we haven't added yet (so
      // that when we do later add it, it's set up with their configuration
      // instead of ours).
      // XXX if service configuration is oauth-specific then this code should
      //     be in accounts-oauth; if it's not then the registry should be
      //     in this package
      if (!(accounts.oauth && accounts.oauth.serviceNames().includes(options.service))) {
        throw new Meteor.Error(403, "Service unknown");
      }
      if (Package['service-configuration']) {
        const {
          ServiceConfiguration
        } = Package['service-configuration'];
        if (ServiceConfiguration.configurations.findOne({
          service: options.service
        })) throw new Meteor.Error(403, "Service ".concat(options.service, " already configured"));
        if (Package["oauth-encryption"]) {
          const {
            OAuthEncryption
          } = Package["oauth-encryption"];
          if (hasOwn.call(options, 'secret') && OAuthEncryption.keyIsLoaded()) options.secret = OAuthEncryption.seal(options.secret);
        }
        ServiceConfiguration.configurations.insert(options);
      }
    };
    accounts._server.methods(methods);
  }
  _initAccountDataHooks() {
    this._server.onConnection(connection => {
      this._accountData[connection.id] = {
        connection: connection
      };
      connection.onClose(() => {
        this._removeTokenFromConnection(connection.id);
        delete this._accountData[connection.id];
      });
    });
  }
  _initServerPublications() {
    // Bring into lexical scope for publish callbacks that need `this`
    const {
      users,
      _autopublishFields,
      _defaultPublishFields
    } = this;

    // Publish all login service configuration fields other than secret.
    this._server.publish("meteor.loginServiceConfiguration", function () {
      if (Package['service-configuration']) {
        const {
          ServiceConfiguration
        } = Package['service-configuration'];
        return ServiceConfiguration.configurations.find({}, {
          fields: {
            secret: 0
          }
        });
      }
      this.ready();
    }, {
      is_auto: true
    }); // not technically autopublish, but stops the warning.

    // Use Meteor.startup to give other packages a chance to call
    // setDefaultPublishFields.
    Meteor.startup(() => {
      // Merge custom fields selector and default publish fields so that the client
      // gets all the necessary fields to run properly
      const customFields = this._addDefaultFieldSelector().fields || {};
      const keys = Object.keys(customFields);
      // If the custom fields are negative, then ignore them and only send the necessary fields
      const fields = keys.length > 0 && customFields[keys[0]] ? _objectSpread(_objectSpread({}, this._addDefaultFieldSelector().fields), _defaultPublishFields.projection) : _defaultPublishFields.projection;
      // Publish the current user's record to the client.
      this._server.publish(null, function () {
        if (this.userId) {
          return users.find({
            _id: this.userId
          }, {
            fields
          });
        } else {
          return null;
        }
      }, /*suppress autopublish warning*/{
        is_auto: true
      });
    });

    // Use Meteor.startup to give other packages a chance to call
    // addAutopublishFields.
    Package.autopublish && Meteor.startup(() => {
      // ['profile', 'username'] -> {profile: 1, username: 1}
      const toFieldSelector = fields => fields.reduce((prev, field) => _objectSpread(_objectSpread({}, prev), {}, {
        [field]: 1
      }), {});
      this._server.publish(null, function () {
        if (this.userId) {
          return users.find({
            _id: this.userId
          }, {
            fields: toFieldSelector(_autopublishFields.loggedInUser)
          });
        } else {
          return null;
        }
      }, /*suppress autopublish warning*/{
        is_auto: true
      });

      // XXX this publish is neither dedup-able nor is it optimized by our special
      // treatment of queries on a specific _id. Therefore this will have O(n^2)
      // run-time performance every time a user document is changed (eg someone
      // logging in). If this is a problem, we can instead write a manual publish
      // function which filters out fields based on 'this.userId'.
      this._server.publish(null, function () {
        const selector = this.userId ? {
          _id: {
            $ne: this.userId
          }
        } : {};
        return users.find(selector, {
          fields: toFieldSelector(_autopublishFields.otherUsers)
        });
      }, /*suppress autopublish warning*/{
        is_auto: true
      });
    });
  }
  // Add to the list of fields or subfields to be automatically
  // published if autopublish is on. Must be called from top-level
  // code (ie, before Meteor.startup hooks run).
  //
  // @param opts {Object} with:
  //   - forLoggedInUser {Array} Array of fields published to the logged-in user
  //   - forOtherUsers {Array} Array of fields published to users that aren't logged in
  addAutopublishFields(opts) {
    this._autopublishFields.loggedInUser.push.apply(this._autopublishFields.loggedInUser, opts.forLoggedInUser);
    this._autopublishFields.otherUsers.push.apply(this._autopublishFields.otherUsers, opts.forOtherUsers);
  }
  // Replaces the fields to be automatically
  // published when the user logs in
  //
  // @param {MongoFieldSpecifier} fields Dictionary of fields to return or exclude.
  setDefaultPublishFields(fields) {
    this._defaultPublishFields.projection = fields;
  }
  ///
  /// ACCOUNT DATA
  ///

  // HACK: This is used by 'meteor-accounts' to get the loginToken for a
  // connection. Maybe there should be a public way to do that.
  _getAccountData(connectionId, field) {
    const data = this._accountData[connectionId];
    return data && data[field];
  }
  _setAccountData(connectionId, field, value) {
    const data = this._accountData[connectionId];

    // safety belt. shouldn't happen. accountData is set in onConnection,
    // we don't have a connectionId until it is set.
    if (!data) return;
    if (value === undefined) delete data[field];else data[field] = value;
  }
  ///
  /// RECONNECT TOKENS
  ///
  /// support reconnecting using a meteor login token

  _hashLoginToken(loginToken) {
    const hash = crypto.createHash('sha256');
    hash.update(loginToken);
    return hash.digest('base64');
  }
  // {token, when} => {hashedToken, when}
  _hashStampedToken(stampedToken) {
    const {
        token
      } = stampedToken,
      hashedStampedToken = _objectWithoutProperties(stampedToken, _excluded);
    return _objectSpread(_objectSpread({}, hashedStampedToken), {}, {
      hashedToken: this._hashLoginToken(token)
    });
  }
  // Using $addToSet avoids getting an index error if another client
  // logging in simultaneously has already inserted the new hashed
  // token.
  _insertHashedLoginToken(userId, hashedToken, query) {
    query = query ? _objectSpread({}, query) : {};
    query._id = userId;
    this.users.update(query, {
      $addToSet: {
        "services.resume.loginTokens": hashedToken
      }
    });
  }
  // Exported for tests.
  _insertLoginToken(userId, stampedToken, query) {
    this._insertHashedLoginToken(userId, this._hashStampedToken(stampedToken), query);
  }
  _clearAllLoginTokens(userId) {
    this.users.update(userId, {
      $set: {
        'services.resume.loginTokens': []
      }
    });
  }
  // test hook
  _getUserObserve(connectionId) {
    return this._userObservesForConnections[connectionId];
  }
  // Clean up this connection's association with the token: that is, stop
  // the observe that we started when we associated the connection with
  // this token.
  _removeTokenFromConnection(connectionId) {
    if (hasOwn.call(this._userObservesForConnections, connectionId)) {
      const observe = this._userObservesForConnections[connectionId];
      if (typeof observe === 'number') {
        // We're in the process of setting up an observe for this connection. We
        // can't clean up that observe yet, but if we delete the placeholder for
        // this connection, then the observe will get cleaned up as soon as it has
        // been set up.
        delete this._userObservesForConnections[connectionId];
      } else {
        delete this._userObservesForConnections[connectionId];
        observe.stop();
      }
    }
  }
  _getLoginToken(connectionId) {
    return this._getAccountData(connectionId, 'loginToken');
  }
  // newToken is a hashed token.
  _setLoginToken(userId, connection, newToken) {
    this._removeTokenFromConnection(connection.id);
    this._setAccountData(connection.id, 'loginToken', newToken);
    if (newToken) {
      // Set up an observe for this token. If the token goes away, we need
      // to close the connection.  We defer the observe because there's
      // no need for it to be on the critical path for login; we just need
      // to ensure that the connection will get closed at some point if
      // the token gets deleted.
      //
      // Initially, we set the observe for this connection to a number; this
      // signifies to other code (which might run while we yield) that we are in
      // the process of setting up an observe for this connection. Once the
      // observe is ready to go, we replace the number with the real observe
      // handle (unless the placeholder has been deleted or replaced by a
      // different placehold number, signifying that the connection was closed
      // already -- in this case we just clean up the observe that we started).
      const myObserveNumber = ++this._nextUserObserveNumber;
      this._userObservesForConnections[connection.id] = myObserveNumber;
      Meteor.defer(() => {
        // If something else happened on this connection in the meantime (it got
        // closed, or another call to _setLoginToken happened), just do
        // nothing. We don't need to start an observe for an old connection or old
        // token.
        if (this._userObservesForConnections[connection.id] !== myObserveNumber) {
          return;
        }
        let foundMatchingUser;
        // Because we upgrade unhashed login tokens to hashed tokens at
        // login time, sessions will only be logged in with a hashed
        // token. Thus we only need to observe hashed tokens here.
        const observe = this.users.find({
          _id: userId,
          'services.resume.loginTokens.hashedToken': newToken
        }, {
          fields: {
            _id: 1
          }
        }).observeChanges({
          added: () => {
            foundMatchingUser = true;
          },
          removed: connection.close
          // The onClose callback for the connection takes care of
          // cleaning up the observe handle and any other state we have
          // lying around.
        }, {
          nonMutatingCallbacks: true
        });

        // If the user ran another login or logout command we were waiting for the
        // defer or added to fire (ie, another call to _setLoginToken occurred),
        // then we let the later one win (start an observe, etc) and just stop our
        // observe now.
        //
        // Similarly, if the connection was already closed, then the onClose
        // callback would have called _removeTokenFromConnection and there won't
        // be an entry in _userObservesForConnections. We can stop the observe.
        if (this._userObservesForConnections[connection.id] !== myObserveNumber) {
          observe.stop();
          return;
        }
        this._userObservesForConnections[connection.id] = observe;
        if (!foundMatchingUser) {
          // We've set up an observe on the user associated with `newToken`,
          // so if the new token is removed from the database, we'll close
          // the connection. But the token might have already been deleted
          // before we set up the observe, which wouldn't have closed the
          // connection because the observe wasn't running yet.
          connection.close();
        }
      });
    }
  }
  // (Also used by Meteor Accounts server and tests).
  //
  _generateStampedLoginToken() {
    return {
      token: Random.secret(),
      when: new Date()
    };
  }
  ///
  /// TOKEN EXPIRATION
  ///

  // Deletes expired password reset tokens from the database.
  //
  // Exported for tests. Also, the arguments are only used by
  // tests. oldestValidDate is simulate expiring tokens without waiting
  // for them to actually expire. userId is used by tests to only expire
  // tokens for the test user.
  _expirePasswordResetTokens(oldestValidDate, userId) {
    const tokenLifetimeMs = this._getPasswordResetTokenLifetimeMs();

    // when calling from a test with extra arguments, you must specify both!
    if (oldestValidDate && !userId || !oldestValidDate && userId) {
      throw new Error("Bad test. Must specify both oldestValidDate and userId.");
    }
    oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
    const tokenFilter = {
      $or: [{
        "services.password.reset.reason": "reset"
      }, {
        "services.password.reset.reason": {
          $exists: false
        }
      }]
    };
    expirePasswordToken(this, oldestValidDate, tokenFilter, userId);
  }

  // Deletes expired password enroll tokens from the database.
  //
  // Exported for tests. Also, the arguments are only used by
  // tests. oldestValidDate is simulate expiring tokens without waiting
  // for them to actually expire. userId is used by tests to only expire
  // tokens for the test user.
  _expirePasswordEnrollTokens(oldestValidDate, userId) {
    const tokenLifetimeMs = this._getPasswordEnrollTokenLifetimeMs();

    // when calling from a test with extra arguments, you must specify both!
    if (oldestValidDate && !userId || !oldestValidDate && userId) {
      throw new Error("Bad test. Must specify both oldestValidDate and userId.");
    }
    oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
    const tokenFilter = {
      "services.password.enroll.reason": "enroll"
    };
    expirePasswordToken(this, oldestValidDate, tokenFilter, userId);
  }

  // Deletes expired tokens from the database and closes all open connections
  // associated with these tokens.
  //
  // Exported for tests. Also, the arguments are only used by
  // tests. oldestValidDate is simulate expiring tokens without waiting
  // for them to actually expire. userId is used by tests to only expire
  // tokens for the test user.
  _expireTokens(oldestValidDate, userId) {
    const tokenLifetimeMs = this._getTokenLifetimeMs();

    // when calling from a test with extra arguments, you must specify both!
    if (oldestValidDate && !userId || !oldestValidDate && userId) {
      throw new Error("Bad test. Must specify both oldestValidDate and userId.");
    }
    oldestValidDate = oldestValidDate || new Date(new Date() - tokenLifetimeMs);
    const userFilter = userId ? {
      _id: userId
    } : {};

    // Backwards compatible with older versions of meteor that stored login token
    // timestamps as numbers.
    this.users.update(_objectSpread(_objectSpread({}, userFilter), {}, {
      $or: [{
        "services.resume.loginTokens.when": {
          $lt: oldestValidDate
        }
      }, {
        "services.resume.loginTokens.when": {
          $lt: +oldestValidDate
        }
      }]
    }), {
      $pull: {
        "services.resume.loginTokens": {
          $or: [{
            when: {
              $lt: oldestValidDate
            }
          }, {
            when: {
              $lt: +oldestValidDate
            }
          }]
        }
      }
    }, {
      multi: true
    });
    // The observe on Meteor.users will take care of closing connections for
    // expired tokens.
  }
  // @override from accounts_common.js
  config(options) {
    // Call the overridden implementation of the method.
    const superResult = AccountsCommon.prototype.config.apply(this, arguments);

    // If the user set loginExpirationInDays to null, then we need to clear the
    // timer that periodically expires tokens.
    if (hasOwn.call(this._options, 'loginExpirationInDays') && this._options.loginExpirationInDays === null && this.expireTokenInterval) {
      Meteor.clearInterval(this.expireTokenInterval);
      this.expireTokenInterval = null;
    }
    return superResult;
  }
  // Called by accounts-password
  insertUserDoc(options, user) {
    // - clone user document, to protect from modification
    // - add createdAt timestamp
    // - prepare an _id, so that you can modify other collections (eg
    // create a first task for every new user)
    //
    // XXX If the onCreateUser or validateNewUser hooks fail, we might
    // end up having modified some other collection
    // inappropriately. The solution is probably to have onCreateUser
    // accept two callbacks - one that gets called before inserting
    // the user document (in which you can modify its contents), and
    // one that gets called after (in which you should change other
    // collections)
    user = _objectSpread({
      createdAt: new Date(),
      _id: Random.id()
    }, user);
    if (user.services) {
      Object.keys(user.services).forEach(service => pinEncryptedFieldsToUser(user.services[service], user._id));
    }
    let fullUser;
    if (this._onCreateUserHook) {
      fullUser = this._onCreateUserHook(options, user);

      // This is *not* part of the API. We need this because we can't isolate
      // the global server environment between tests, meaning we can't test
      // both having a create user hook set and not having one set.
      if (fullUser === 'TEST DEFAULT HOOK') fullUser = defaultCreateUserHook(options, user);
    } else {
      fullUser = defaultCreateUserHook(options, user);
    }
    this._validateNewUserHooks.forEach(hook => {
      if (!hook(fullUser)) throw new Meteor.Error(403, "User validation failed");
    });
    let userId;
    try {
      userId = this.users.insert(fullUser);
    } catch (e) {
      // XXX string parsing sucks, maybe
      // https://jira.mongodb.org/browse/SERVER-3069 will get fixed one day
      // https://jira.mongodb.org/browse/SERVER-4637
      if (!e.errmsg) throw e;
      if (e.errmsg.includes('emails.address')) throw new Meteor.Error(403, "Email already exists.");
      if (e.errmsg.includes('username')) throw new Meteor.Error(403, "Username already exists.");
      throw e;
    }
    return userId;
  }
  // Helper function: returns false if email does not match company domain from
  // the configuration.
  _testEmailDomain(email) {
    const domain = this._options.restrictCreationByEmailDomain;
    return !domain || typeof domain === 'function' && domain(email) || typeof domain === 'string' && new RegExp("@".concat(Meteor._escapeRegExp(domain), "$"), 'i').test(email);
  }
  ///
  /// CLEAN UP FOR `logoutOtherClients`
  ///

  _deleteSavedTokensForUser(userId, tokensToDelete) {
    if (tokensToDelete) {
      this.users.update(userId, {
        $unset: {
          "services.resume.haveLoginTokensToDelete": 1,
          "services.resume.loginTokensToDelete": 1
        },
        $pullAll: {
          "services.resume.loginTokens": tokensToDelete
        }
      });
    }
  }
  _deleteSavedTokensForAllUsersOnStartup() {
    // If we find users who have saved tokens to delete on startup, delete
    // them now. It's possible that the server could have crashed and come
    // back up before new tokens are found in localStorage, but this
    // shouldn't happen very often. We shouldn't put a delay here because
    // that would give a lot of power to an attacker with a stolen login
    // token and the ability to crash the server.
    Meteor.startup(() => {
      this.users.find({
        "services.resume.haveLoginTokensToDelete": true
      }, {
        fields: {
          "services.resume.loginTokensToDelete": 1
        }
      }).forEach(user => {
        this._deleteSavedTokensForUser(user._id, user.services.resume.loginTokensToDelete);
      });
    });
  }
  ///
  /// MANAGING USER OBJECTS
  ///

  // Updates or creates a user after we authenticate with a 3rd party.
  //
  // @param serviceName {String} Service name (eg, twitter).
  // @param serviceData {Object} Data to store in the user's record
  //        under services[serviceName]. Must include an "id" field
  //        which is a unique identifier for the user in the service.
  // @param options {Object, optional} Other options to pass to insertUserDoc
  //        (eg, profile)
  // @returns {Object} Object with token and id keys, like the result
  //        of the "login" method.
  //
  updateOrCreateUserFromExternalService(serviceName, serviceData, options) {
    options = _objectSpread({}, options);
    if (serviceName === "password" || serviceName === "resume") {
      throw new Error("Can't use updateOrCreateUserFromExternalService with internal service " + serviceName);
    }
    if (!hasOwn.call(serviceData, 'id')) {
      throw new Error("Service data for service ".concat(serviceName, " must include id"));
    }

    // Look for a user with the appropriate service user id.
    const selector = {};
    const serviceIdKey = "services.".concat(serviceName, ".id");

    // XXX Temporary special case for Twitter. (Issue #629)
    //   The serviceData.id will be a string representation of an integer.
    //   We want it to match either a stored string or int representation.
    //   This is to cater to earlier versions of Meteor storing twitter
    //   user IDs in number form, and recent versions storing them as strings.
    //   This can be removed once migration technology is in place, and twitter
    //   users stored with integer IDs have been migrated to string IDs.
    if (serviceName === "twitter" && !isNaN(serviceData.id)) {
      selector["$or"] = [{}, {}];
      selector["$or"][0][serviceIdKey] = serviceData.id;
      selector["$or"][1][serviceIdKey] = parseInt(serviceData.id, 10);
    } else {
      selector[serviceIdKey] = serviceData.id;
    }
    let user = this.users.findOne(selector, {
      fields: this._options.defaultFieldSelector
    });

    // Check to see if the developer has a custom way to find the user outside
    // of the general selectors above.
    if (!user && this._additionalFindUserOnExternalLogin) {
      user = this._additionalFindUserOnExternalLogin({
        serviceName,
        serviceData,
        options
      });
    }

    // Before continuing, run user hook to see if we should continue
    if (this._beforeExternalLoginHook && !this._beforeExternalLoginHook(serviceName, serviceData, user)) {
      throw new Meteor.Error(403, "Login forbidden");
    }

    // When creating a new user we pass through all options. When updating an
    // existing user, by default we only process/pass through the serviceData
    // (eg, so that we keep an unexpired access token and don't cache old email
    // addresses in serviceData.email). The onExternalLogin hook can be used when
    // creating or updating a user, to modify or pass through more options as
    // needed.
    let opts = user ? {} : options;
    if (this._onExternalLoginHook) {
      opts = this._onExternalLoginHook(options, user);
    }
    if (user) {
      pinEncryptedFieldsToUser(serviceData, user._id);
      let setAttrs = {};
      Object.keys(serviceData).forEach(key => setAttrs["services.".concat(serviceName, ".").concat(key)] = serviceData[key]);

      // XXX Maybe we should re-use the selector above and notice if the update
      //     touches nothing?
      setAttrs = _objectSpread(_objectSpread({}, setAttrs), opts);
      this.users.update(user._id, {
        $set: setAttrs
      });
      return {
        type: serviceName,
        userId: user._id
      };
    } else {
      // Create a new user with the service data.
      user = {
        services: {}
      };
      user.services[serviceName] = serviceData;
      return {
        type: serviceName,
        userId: this.insertUserDoc(opts, user)
      };
    }
  }
  /**
   * @summary Removes default rate limiting rule
   * @locus Server
   * @importFromPackage accounts-base
   */
  removeDefaultRateLimit() {
    const resp = DDPRateLimiter.removeRule(this.defaultRateLimiterRuleId);
    this.defaultRateLimiterRuleId = null;
    return resp;
  }
  /**
   * @summary Add a default rule of limiting logins, creating new users and password reset
   * to 5 times every 10 seconds per connection.
   * @locus Server
   * @importFromPackage accounts-base
   */
  addDefaultRateLimit() {
    if (!this.defaultRateLimiterRuleId) {
      this.defaultRateLimiterRuleId = DDPRateLimiter.addRule({
        userId: null,
        clientAddress: null,
        type: 'method',
        name: name => ['login', 'createUser', 'resetPassword', 'forgotPassword'].includes(name),
        connectionId: connectionId => true
      }, 5, 10000);
    }
  }
  /**
   * @summary Creates options for email sending for reset password and enroll account emails.
   * You can use this function when customizing a reset password or enroll account email sending.
   * @locus Server
   * @param {Object} email Which address of the user's to send the email to.
   * @param {Object} user The user object to generate options for.
   * @param {String} url URL to which user is directed to confirm the email.
   * @param {String} reason `resetPassword` or `enrollAccount`.
   * @returns {Object} Options which can be passed to `Email.send`.
   * @importFromPackage accounts-base
   */
  generateOptionsForEmail(email, user, url, reason) {
    let extra = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};
    const options = {
      to: email,
      from: this.emailTemplates[reason].from ? this.emailTemplates[reason].from(user) : this.emailTemplates.from,
      subject: this.emailTemplates[reason].subject(user, url, extra)
    };
    if (typeof this.emailTemplates[reason].text === 'function') {
      options.text = this.emailTemplates[reason].text(user, url, extra);
    }
    if (typeof this.emailTemplates[reason].html === 'function') {
      options.html = this.emailTemplates[reason].html(user, url, extra);
    }
    if (typeof this.emailTemplates.headers === 'object') {
      options.headers = this.emailTemplates.headers;
    }
    return options;
  }
  _checkForCaseInsensitiveDuplicates(fieldName, displayName, fieldValue, ownUserId) {
    // Some tests need the ability to add users with the same case insensitive
    // value, hence the _skipCaseInsensitiveChecksForTest check
    const skipCheck = Object.prototype.hasOwnProperty.call(this._skipCaseInsensitiveChecksForTest, fieldValue);
    if (fieldValue && !skipCheck) {
      const matchedUsers = Meteor.users.find(this._selectorForFastCaseInsensitiveLookup(fieldName, fieldValue), {
        fields: {
          _id: 1
        },
        // we only need a maximum of 2 users for the logic below to work
        limit: 2
      }).fetch();
      if (matchedUsers.length > 0 && (
      // If we don't have a userId yet, any match we find is a duplicate
      !ownUserId ||
      // Otherwise, check to see if there are multiple matches or a match
      // that is not us
      matchedUsers.length > 1 || matchedUsers[0]._id !== ownUserId)) {
        this._handleError("".concat(displayName, " already exists."));
      }
    }
  }
  _createUserCheckingDuplicates(_ref) {
    let {
      user,
      email,
      username,
      options
    } = _ref;
    const newUser = _objectSpread(_objectSpread(_objectSpread({}, user), username ? {
      username
    } : {}), email ? {
      emails: [{
        address: email,
        verified: false
      }]
    } : {});

    // Perform a case insensitive check before insert
    this._checkForCaseInsensitiveDuplicates('username', 'Username', username);
    this._checkForCaseInsensitiveDuplicates('emails.address', 'Email', email);
    const userId = this.insertUserDoc(options, newUser);
    // Perform another check after insert, in case a matching user has been
    // inserted in the meantime
    try {
      this._checkForCaseInsensitiveDuplicates('username', 'Username', username, userId);
      this._checkForCaseInsensitiveDuplicates('emails.address', 'Email', email, userId);
    } catch (ex) {
      // Remove inserted user if the check fails
      Meteor.users.remove(userId);
      throw ex;
    }
    return userId;
  }
}
// Give each login hook callback a fresh cloned copy of the attempt
// object, but don't clone the connection.
//
const cloneAttemptWithConnection = (connection, attempt) => {
  const clonedAttempt = EJSON.clone(attempt);
  clonedAttempt.connection = connection;
  return clonedAttempt;
};
const tryLoginMethod = (type, fn) => Promise.asyncApply(() => {
  let result;
  try {
    result = Promise.await(fn());
  } catch (e) {
    result = {
      error: e
    };
  }
  if (result && !result.type && type) result.type = type;
  return result;
});
const setupDefaultLoginHandlers = accounts => {
  accounts.registerLoginHandler("resume", function (options) {
    return defaultResumeLoginHandler.call(this, accounts, options);
  });
};

// Login handler for resume tokens.
const defaultResumeLoginHandler = (accounts, options) => {
  if (!options.resume) return undefined;
  check(options.resume, String);
  const hashedToken = accounts._hashLoginToken(options.resume);

  // First look for just the new-style hashed login token, to avoid
  // sending the unhashed token to the database in a query if we don't
  // need to.
  let user = accounts.users.findOne({
    "services.resume.loginTokens.hashedToken": hashedToken
  }, {
    fields: {
      "services.resume.loginTokens.$": 1
    }
  });
  if (!user) {
    // If we didn't find the hashed login token, try also looking for
    // the old-style unhashed token.  But we need to look for either
    // the old-style token OR the new-style token, because another
    // client connection logging in simultaneously might have already
    // converted the token.
    user = accounts.users.findOne({
      $or: [{
        "services.resume.loginTokens.hashedToken": hashedToken
      }, {
        "services.resume.loginTokens.token": options.resume
      }]
    },
    // Note: Cannot use ...loginTokens.$ positional operator with $or query.
    {
      fields: {
        "services.resume.loginTokens": 1
      }
    });
  }
  if (!user) return {
    error: new Meteor.Error(403, "You've been logged out by the server. Please log in again.")
  };

  // Find the token, which will either be an object with fields
  // {hashedToken, when} for a hashed token or {token, when} for an
  // unhashed token.
  let oldUnhashedStyleToken;
  let token = user.services.resume.loginTokens.find(token => token.hashedToken === hashedToken);
  if (token) {
    oldUnhashedStyleToken = false;
  } else {
    token = user.services.resume.loginTokens.find(token => token.token === options.resume);
    oldUnhashedStyleToken = true;
  }
  const tokenExpires = accounts._tokenExpiration(token.when);
  if (new Date() >= tokenExpires) return {
    userId: user._id,
    error: new Meteor.Error(403, "Your session has expired. Please log in again.")
  };

  // Update to a hashed token when an unhashed token is encountered.
  if (oldUnhashedStyleToken) {
    // Only add the new hashed token if the old unhashed token still
    // exists (this avoids resurrecting the token if it was deleted
    // after we read it).  Using $addToSet avoids getting an index
    // error if another client logging in simultaneously has already
    // inserted the new hashed token.
    accounts.users.update({
      _id: user._id,
      "services.resume.loginTokens.token": options.resume
    }, {
      $addToSet: {
        "services.resume.loginTokens": {
          "hashedToken": hashedToken,
          "when": token.when
        }
      }
    });

    // Remove the old token *after* adding the new, since otherwise
    // another client trying to login between our removing the old and
    // adding the new wouldn't find a token to login with.
    accounts.users.update(user._id, {
      $pull: {
        "services.resume.loginTokens": {
          "token": options.resume
        }
      }
    });
  }
  return {
    userId: user._id,
    stampedLoginToken: {
      token: options.resume,
      when: token.when
    }
  };
};
const expirePasswordToken = (accounts, oldestValidDate, tokenFilter, userId) => {
  // boolean value used to determine if this method was called from enroll account workflow
  let isEnroll = false;
  const userFilter = userId ? {
    _id: userId
  } : {};
  // check if this method was called from enroll account workflow
  if (tokenFilter['services.password.enroll.reason']) {
    isEnroll = true;
  }
  let resetRangeOr = {
    $or: [{
      "services.password.reset.when": {
        $lt: oldestValidDate
      }
    }, {
      "services.password.reset.when": {
        $lt: +oldestValidDate
      }
    }]
  };
  if (isEnroll) {
    resetRangeOr = {
      $or: [{
        "services.password.enroll.when": {
          $lt: oldestValidDate
        }
      }, {
        "services.password.enroll.when": {
          $lt: +oldestValidDate
        }
      }]
    };
  }
  const expireFilter = {
    $and: [tokenFilter, resetRangeOr]
  };
  if (isEnroll) {
    accounts.users.update(_objectSpread(_objectSpread({}, userFilter), expireFilter), {
      $unset: {
        "services.password.enroll": ""
      }
    }, {
      multi: true
    });
  } else {
    accounts.users.update(_objectSpread(_objectSpread({}, userFilter), expireFilter), {
      $unset: {
        "services.password.reset": ""
      }
    }, {
      multi: true
    });
  }
};
const setExpireTokensInterval = accounts => {
  accounts.expireTokenInterval = Meteor.setInterval(() => {
    accounts._expireTokens();
    accounts._expirePasswordResetTokens();
    accounts._expirePasswordEnrollTokens();
  }, EXPIRE_TOKENS_INTERVAL_MS);
};
const OAuthEncryption = (_Package$oauthEncryp = Package["oauth-encryption"]) === null || _Package$oauthEncryp === void 0 ? void 0 : _Package$oauthEncryp.OAuthEncryption;

// OAuth service data is temporarily stored in the pending credentials
// collection during the oauth authentication process.  Sensitive data
// such as access tokens are encrypted without the user id because
// we don't know the user id yet.  We re-encrypt these fields with the
// user id included when storing the service data permanently in
// the users collection.
//
const pinEncryptedFieldsToUser = (serviceData, userId) => {
  Object.keys(serviceData).forEach(key => {
    let value = serviceData[key];
    if (OAuthEncryption !== null && OAuthEncryption !== void 0 && OAuthEncryption.isSealed(value)) value = OAuthEncryption.seal(OAuthEncryption.open(value), userId);
    serviceData[key] = value;
  });
};

// XXX see comment on Accounts.createUser in passwords_server about adding a
// second "server options" argument.
const defaultCreateUserHook = (options, user) => {
  if (options.profile) user.profile = options.profile;
  return user;
};

// Validate new user's email or Google/Facebook/GitHub account's email
function defaultValidateNewUserHook(user) {
  const domain = this._options.restrictCreationByEmailDomain;
  if (!domain) {
    return true;
  }
  let emailIsGood = false;
  if (user.emails && user.emails.length > 0) {
    emailIsGood = user.emails.reduce((prev, email) => prev || this._testEmailDomain(email.address), false);
  } else if (user.services && Object.values(user.services).length > 0) {
    // Find any email of any service and check it
    emailIsGood = Object.values(user.services).reduce((prev, service) => service.email && this._testEmailDomain(service.email), false);
  }
  if (emailIsGood) {
    return true;
  }
  if (typeof domain === 'string') {
    throw new Meteor.Error(403, "@".concat(domain, " email required"));
  } else {
    throw new Meteor.Error(403, "Email doesn't match the criteria.");
  }
}
const setupUsersCollection = users => {
  ///
  /// RESTRICTING WRITES TO USER OBJECTS
  ///
  users.allow({
    // clients can modify the profile field of their own document, and
    // nothing else.
    update: (userId, user, fields, modifier) => {
      // make sure it is our record
      if (user._id !== userId) {
        return false;
      }

      // user can only modify the 'profile' field. sets to multiple
      // sub-keys (eg profile.foo and profile.bar) are merged into entry
      // in the fields list.
      if (fields.length !== 1 || fields[0] !== 'profile') {
        return false;
      }
      return true;
    },
    fetch: ['_id'] // we only look at _id.
  });

  /// DEFAULT INDEXES ON USERS
  users.createIndexAsync('username', {
    unique: true,
    sparse: true
  });
  users.createIndexAsync('emails.address', {
    unique: true,
    sparse: true
  });
  users.createIndexAsync('services.resume.loginTokens.hashedToken', {
    unique: true,
    sparse: true
  });
  users.createIndexAsync('services.resume.loginTokens.token', {
    unique: true,
    sparse: true
  });
  // For taking care of logoutOtherClients calls that crashed before the
  // tokens were deleted.
  users.createIndexAsync('services.resume.haveLoginTokensToDelete', {
    sparse: true
  });
  // For expiring login tokens
  users.createIndexAsync("services.resume.loginTokens.when", {
    sparse: true
  });
  // For expiring password tokens
  users.createIndexAsync('services.password.reset.when', {
    sparse: true
  });
  users.createIndexAsync('services.password.enroll.when', {
    sparse: true
  });
};

// Generates permutations of all case variations of a given string.
const generateCasePermutationsForString = string => {
  let permutations = [''];
  for (let i = 0; i < string.length; i++) {
    const ch = string.charAt(i);
    permutations = [].concat(...permutations.map(prefix => {
      const lowerCaseChar = ch.toLowerCase();
      const upperCaseChar = ch.toUpperCase();
      // Don't add unnecessary permutations when ch is not a letter
      if (lowerCaseChar === upperCaseChar) {
        return [prefix + ch];
      } else {
        return [prefix + lowerCaseChar, prefix + upperCaseChar];
      }
    }));
  }
  return permutations;
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/accounts-base/server_main.js");

/* Exports */
Package._define("accounts-base", exports, {
  Accounts: Accounts
});

})();

//# sourceURL=meteor://💻app/packages/accounts-base.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9zZXJ2ZXJfbWFpbi5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtYmFzZS9hY2NvdW50c19jb21tb24uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL2FjY291bnRzLWJhc2UvYWNjb3VudHNfc2VydmVyLmpzIl0sIm5hbWVzIjpbIm1vZHVsZTEiLCJleHBvcnQiLCJBY2NvdW50c1NlcnZlciIsImxpbmsiLCJ2IiwiQWNjb3VudHMiLCJNZXRlb3IiLCJzZXJ2ZXIiLCJ1c2VycyIsImNhbGwiLCJtb2R1bGUiLCJfb2JqZWN0U3ByZWFkIiwiZGVmYXVsdCIsIkFjY291bnRzQ29tbW9uIiwiRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyIsIlZBTElEX0NPTkZJR19LRVlTIiwiY29uc3RydWN0b3IiLCJvcHRpb25zIiwiX29wdGlvbnMiLCJjb25uZWN0aW9uIiwidW5kZWZpbmVkIiwiX2luaXRDb25uZWN0aW9uIiwiX2luaXRpYWxpemVDb2xsZWN0aW9uIiwiX29uTG9naW5Ib29rIiwiSG9vayIsImJpbmRFbnZpcm9ubWVudCIsImRlYnVnUHJpbnRFeGNlcHRpb25zIiwiX29uTG9naW5GYWlsdXJlSG9vayIsIl9vbkxvZ291dEhvb2siLCJERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUyIsIkxPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZUyIsImxjZU5hbWUiLCJMb2dpbkNhbmNlbGxlZEVycm9yIiwibWFrZUVycm9yVHlwZSIsImRlc2NyaXB0aW9uIiwibWVzc2FnZSIsInByb3RvdHlwZSIsIm5hbWUiLCJudW1lcmljRXJyb3IiLCJjb2xsZWN0aW9uIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiRXJyb3IiLCJjb2xsZWN0aW9uTmFtZSIsIl9wcmV2ZW50QXV0b3B1Ymxpc2giLCJ1c2VySWQiLCJfYWRkRGVmYXVsdEZpZWxkU2VsZWN0b3IiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJkZWZhdWx0RmllbGRTZWxlY3RvciIsImZpZWxkcyIsImtleXMiLCJPYmplY3QiLCJrZXlzMiIsInVzZXIiLCJmaW5kT25lIiwidXNlckFzeW5jIiwiUHJvbWlzZSIsImFzeW5jQXBwbHkiLCJmaW5kT25lQXN5bmMiLCJjb25maWciLCJpc1NlcnZlciIsIl9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18iLCJhY2NvdW50c0NvbmZpZ0NhbGxlZCIsIl9kZWJ1ZyIsImhhc093blByb3BlcnR5IiwiaXNDbGllbnQiLCJQYWNrYWdlIiwiT0F1dGhFbmNyeXB0aW9uIiwibG9hZEtleSIsIm9hdXRoU2VjcmV0S2V5IiwiZm9yRWFjaCIsImtleSIsImluY2x1ZGVzIiwiY29uY2F0IiwiX25hbWUiLCJvbkxvZ2luIiwiZnVuYyIsInJldCIsInJlZ2lzdGVyIiwiX3N0YXJ0dXBDYWxsYmFjayIsImNhbGxiYWNrIiwib25Mb2dpbkZhaWx1cmUiLCJvbkxvZ291dCIsImRkcFVybCIsIkREUCIsImNvbm5lY3QiLCJBQ0NPVU5UU19DT05ORUNUSU9OX1VSTCIsIl9nZXRUb2tlbkxpZmV0aW1lTXMiLCJsb2dpbkV4cGlyYXRpb25JbkRheXMiLCJsb2dpbkV4cGlyYXRpb24iLCJfZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcyIsInBhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb24iLCJwYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzIiwiREVGQVVMVF9QQVNTV09SRF9SRVNFVF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMiLCJfZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMiLCJwYXNzd29yZEVucm9sbFRva2VuRXhwaXJhdGlvbiIsInBhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uSW5EYXlzIiwiREVGQVVMVF9QQVNTV09SRF9FTlJPTExfVE9LRU5fRVhQSVJBVElPTl9EQVlTIiwiX3Rva2VuRXhwaXJhdGlvbiIsIndoZW4iLCJEYXRlIiwiZ2V0VGltZSIsIl90b2tlbkV4cGlyZXNTb29uIiwibWluTGlmZXRpbWVNcyIsIm1pbkxpZmV0aW1lQ2FwTXMiLCJNSU5fVE9LRU5fTElGRVRJTUVfQ0FQX1NFQ1MiLCJfb2JqZWN0V2l0aG91dFByb3BlcnRpZXMiLCJjcnlwdG8iLCJVUkwiLCJoYXNPd24iLCJOb25FbXB0eVN0cmluZyIsIk1hdGNoIiwiV2hlcmUiLCJ4IiwiY2hlY2siLCJTdHJpbmciLCJfdGhpcyIsInRoaXMiLCJvbkNyZWF0ZUxvZ2luVG9rZW4iLCJfb25DcmVhdGVMb2dpblRva2VuSG9vayIsIl9zZWxlY3RvckZvckZhc3RDYXNlSW5zZW5zaXRpdmVMb29rdXAiLCJmaWVsZE5hbWUiLCJzdHJpbmciLCJwcmVmaXgiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwib3JDbGF1c2UiLCJnZW5lcmF0ZUNhc2VQZXJtdXRhdGlvbnNGb3JTdHJpbmciLCJtYXAiLCJwcmVmaXhQZXJtdXRhdGlvbiIsInNlbGVjdG9yIiwiUmVnRXhwIiwiX2VzY2FwZVJlZ0V4cCIsImNhc2VJbnNlbnNpdGl2ZUNsYXVzZSIsIiRhbmQiLCIkb3IiLCJfZmluZFVzZXJCeVF1ZXJ5IiwicXVlcnkiLCJpZCIsImZpZWxkVmFsdWUiLCJ1c2VybmFtZSIsImVtYWlsIiwiY2FuZGlkYXRlVXNlcnMiLCJmaW5kIiwibGltaXQiLCJmZXRjaCIsIl9oYW5kbGVFcnJvciIsIm1zZyIsInRocm93RXJyb3IiLCJlcnJvckNvZGUiLCJlcnJvciIsImFtYmlndW91c0Vycm9yTWVzc2FnZXMiLCJfdXNlclF1ZXJ5VmFsaWRhdG9yIiwiT3B0aW9uYWwiLCJfc2VydmVyIiwiX2luaXRTZXJ2ZXJNZXRob2RzIiwiX2luaXRBY2NvdW50RGF0YUhvb2tzIiwiX2F1dG9wdWJsaXNoRmllbGRzIiwibG9nZ2VkSW5Vc2VyIiwib3RoZXJVc2VycyIsIl9kZWZhdWx0UHVibGlzaEZpZWxkcyIsInByb2plY3Rpb24iLCJwcm9maWxlIiwiZW1haWxzIiwiX2luaXRTZXJ2ZXJQdWJsaWNhdGlvbnMiLCJfYWNjb3VudERhdGEiLCJfdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnMiLCJfbmV4dFVzZXJPYnNlcnZlTnVtYmVyIiwiX2xvZ2luSGFuZGxlcnMiLCJzZXR1cFVzZXJzQ29sbGVjdGlvbiIsInNldHVwRGVmYXVsdExvZ2luSGFuZGxlcnMiLCJzZXRFeHBpcmVUb2tlbnNJbnRlcnZhbCIsIl92YWxpZGF0ZUxvZ2luSG9vayIsIl92YWxpZGF0ZU5ld1VzZXJIb29rcyIsImRlZmF1bHRWYWxpZGF0ZU5ld1VzZXJIb29rIiwiYmluZCIsIl9kZWxldGVTYXZlZFRva2Vuc0ZvckFsbFVzZXJzT25TdGFydHVwIiwiX3NraXBDYXNlSW5zZW5zaXRpdmVDaGVja3NGb3JUZXN0IiwidXJscyIsInJlc2V0UGFzc3dvcmQiLCJ0b2tlbiIsImV4dHJhUGFyYW1zIiwiYnVpbGRFbWFpbFVybCIsInZlcmlmeUVtYWlsIiwibG9naW5Ub2tlbiIsImVucm9sbEFjY291bnQiLCJhZGREZWZhdWx0UmF0ZUxpbWl0IiwicGF0aCIsInVybCIsImFic29sdXRlVXJsIiwicGFyYW1zIiwiZW50cmllcyIsInZhbHVlIiwic2VhcmNoUGFyYW1zIiwiYXBwZW5kIiwidG9TdHJpbmciLCJjdXJyZW50SW52b2NhdGlvbiIsIl9DdXJyZW50TWV0aG9kSW52b2NhdGlvbiIsImdldCIsIl9DdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uIiwidmFsaWRhdGVMb2dpbkF0dGVtcHQiLCJ2YWxpZGF0ZU5ld1VzZXIiLCJwdXNoIiwiYmVmb3JlRXh0ZXJuYWxMb2dpbiIsIl9iZWZvcmVFeHRlcm5hbExvZ2luSG9vayIsIm9uQ3JlYXRlVXNlciIsIl9vbkNyZWF0ZVVzZXJIb29rIiwid3JhcEZuIiwib25FeHRlcm5hbExvZ2luIiwiX29uRXh0ZXJuYWxMb2dpbkhvb2siLCJzZXRBZGRpdGlvbmFsRmluZFVzZXJPbkV4dGVybmFsTG9naW4iLCJfYWRkaXRpb25hbEZpbmRVc2VyT25FeHRlcm5hbExvZ2luIiwiX3ZhbGlkYXRlTG9naW4iLCJhdHRlbXB0IiwiY2xvbmVBdHRlbXB0V2l0aENvbm5lY3Rpb24iLCJlIiwiYWxsb3dlZCIsIl9zdWNjZXNzZnVsTG9naW4iLCJlYWNoIiwiX2ZhaWxlZExvZ2luIiwiX3N1Y2Nlc3NmdWxMb2dvdXQiLCJfbG9naW5Vc2VyIiwibWV0aG9kSW52b2NhdGlvbiIsInN0YW1wZWRMb2dpblRva2VuIiwiX2dlbmVyYXRlU3RhbXBlZExvZ2luVG9rZW4iLCJfaW5zZXJ0TG9naW5Ub2tlbiIsIl9ub1lpZWxkc0FsbG93ZWQiLCJfc2V0TG9naW5Ub2tlbiIsIl9oYXNoTG9naW5Ub2tlbiIsInNldFVzZXJJZCIsInRva2VuRXhwaXJlcyIsIl9hdHRlbXB0TG9naW4iLCJtZXRob2ROYW1lIiwibWV0aG9kQXJncyIsInJlc3VsdCIsInR5cGUiLCJtZXRob2RBcmd1bWVudHMiLCJBcnJheSIsImZyb20iLCJfbG9naW5NZXRob2QiLCJmbiIsImF3YWl0IiwidHJ5TG9naW5NZXRob2QiLCJfcmVwb3J0TG9naW5GYWlsdXJlIiwicmVnaXN0ZXJMb2dpbkhhbmRsZXIiLCJoYW5kbGVyIiwiX3J1bkxvZ2luSGFuZGxlcnMiLCJkZXN0cm95VG9rZW4iLCJ1cGRhdGUiLCIkcHVsbCIsImhhc2hlZFRva2VuIiwiYWNjb3VudHMiLCJtZXRob2RzIiwibG9naW4iLCJsb2dvdXQiLCJfZ2V0TG9naW5Ub2tlbiIsImdldE5ld1Rva2VuIiwiY3VycmVudEhhc2hlZFRva2VuIiwiY3VycmVudFN0YW1wZWRUb2tlbiIsInNlcnZpY2VzIiwicmVzdW1lIiwibG9naW5Ub2tlbnMiLCJzdGFtcGVkVG9rZW4iLCJuZXdTdGFtcGVkVG9rZW4iLCJyZW1vdmVPdGhlclRva2VucyIsImN1cnJlbnRUb2tlbiIsIiRuZSIsImNvbmZpZ3VyZUxvZ2luU2VydmljZSIsIk9iamVjdEluY2x1ZGluZyIsInNlcnZpY2UiLCJvYXV0aCIsInNlcnZpY2VOYW1lcyIsIlNlcnZpY2VDb25maWd1cmF0aW9uIiwiY29uZmlndXJhdGlvbnMiLCJrZXlJc0xvYWRlZCIsInNlY3JldCIsInNlYWwiLCJpbnNlcnQiLCJvbkNvbm5lY3Rpb24iLCJvbkNsb3NlIiwiX3JlbW92ZVRva2VuRnJvbUNvbm5lY3Rpb24iLCJwdWJsaXNoIiwicmVhZHkiLCJpc19hdXRvIiwic3RhcnR1cCIsImN1c3RvbUZpZWxkcyIsIl9pZCIsImF1dG9wdWJsaXNoIiwidG9GaWVsZFNlbGVjdG9yIiwicmVkdWNlIiwicHJldiIsImZpZWxkIiwiYWRkQXV0b3B1Ymxpc2hGaWVsZHMiLCJvcHRzIiwiYXBwbHkiLCJmb3JMb2dnZWRJblVzZXIiLCJmb3JPdGhlclVzZXJzIiwic2V0RGVmYXVsdFB1Ymxpc2hGaWVsZHMiLCJfZ2V0QWNjb3VudERhdGEiLCJjb25uZWN0aW9uSWQiLCJkYXRhIiwiX3NldEFjY291bnREYXRhIiwiaGFzaCIsImNyZWF0ZUhhc2giLCJkaWdlc3QiLCJfaGFzaFN0YW1wZWRUb2tlbiIsImhhc2hlZFN0YW1wZWRUb2tlbiIsIl9leGNsdWRlZCIsIl9pbnNlcnRIYXNoZWRMb2dpblRva2VuIiwiJGFkZFRvU2V0IiwiX2NsZWFyQWxsTG9naW5Ub2tlbnMiLCIkc2V0IiwiX2dldFVzZXJPYnNlcnZlIiwib2JzZXJ2ZSIsInN0b3AiLCJuZXdUb2tlbiIsIm15T2JzZXJ2ZU51bWJlciIsImRlZmVyIiwiZm91bmRNYXRjaGluZ1VzZXIiLCJvYnNlcnZlQ2hhbmdlcyIsImFkZGVkIiwicmVtb3ZlZCIsImNsb3NlIiwibm9uTXV0YXRpbmdDYWxsYmFja3MiLCJSYW5kb20iLCJfZXhwaXJlUGFzc3dvcmRSZXNldFRva2VucyIsIm9sZGVzdFZhbGlkRGF0ZSIsInRva2VuTGlmZXRpbWVNcyIsInRva2VuRmlsdGVyIiwiJGV4aXN0cyIsImV4cGlyZVBhc3N3b3JkVG9rZW4iLCJfZXhwaXJlUGFzc3dvcmRFbnJvbGxUb2tlbnMiLCJfZXhwaXJlVG9rZW5zIiwidXNlckZpbHRlciIsIiRsdCIsIm11bHRpIiwic3VwZXJSZXN1bHQiLCJleHBpcmVUb2tlbkludGVydmFsIiwiY2xlYXJJbnRlcnZhbCIsImluc2VydFVzZXJEb2MiLCJjcmVhdGVkQXQiLCJwaW5FbmNyeXB0ZWRGaWVsZHNUb1VzZXIiLCJmdWxsVXNlciIsImRlZmF1bHRDcmVhdGVVc2VySG9vayIsImhvb2siLCJlcnJtc2ciLCJfdGVzdEVtYWlsRG9tYWluIiwiZG9tYWluIiwicmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW4iLCJ0ZXN0IiwiX2RlbGV0ZVNhdmVkVG9rZW5zRm9yVXNlciIsInRva2Vuc1RvRGVsZXRlIiwiJHVuc2V0IiwiJHB1bGxBbGwiLCJsb2dpblRva2Vuc1RvRGVsZXRlIiwidXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSIsInNlcnZpY2VOYW1lIiwic2VydmljZURhdGEiLCJzZXJ2aWNlSWRLZXkiLCJpc05hTiIsInBhcnNlSW50Iiwic2V0QXR0cnMiLCJyZW1vdmVEZWZhdWx0UmF0ZUxpbWl0IiwicmVzcCIsIkREUFJhdGVMaW1pdGVyIiwicmVtb3ZlUnVsZSIsImRlZmF1bHRSYXRlTGltaXRlclJ1bGVJZCIsImFkZFJ1bGUiLCJjbGllbnRBZGRyZXNzIiwiZ2VuZXJhdGVPcHRpb25zRm9yRW1haWwiLCJyZWFzb24iLCJleHRyYSIsInRvIiwiZW1haWxUZW1wbGF0ZXMiLCJzdWJqZWN0IiwidGV4dCIsImh0bWwiLCJoZWFkZXJzIiwiX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyIsImRpc3BsYXlOYW1lIiwib3duVXNlcklkIiwic2tpcENoZWNrIiwibWF0Y2hlZFVzZXJzIiwiX2NyZWF0ZVVzZXJDaGVja2luZ0R1cGxpY2F0ZXMiLCJfcmVmIiwibmV3VXNlciIsImFkZHJlc3MiLCJ2ZXJpZmllZCIsImV4IiwicmVtb3ZlIiwiY2xvbmVkQXR0ZW1wdCIsIkVKU09OIiwiY2xvbmUiLCJkZWZhdWx0UmVzdW1lTG9naW5IYW5kbGVyIiwib2xkVW5oYXNoZWRTdHlsZVRva2VuIiwiaXNFbnJvbGwiLCJyZXNldFJhbmdlT3IiLCJleHBpcmVGaWx0ZXIiLCJzZXRJbnRlcnZhbCIsIl9QYWNrYWdlJG9hdXRoRW5jcnlwIiwiaXNTZWFsZWQiLCJvcGVuIiwiZW1haWxJc0dvb2QiLCJ2YWx1ZXMiLCJhbGxvdyIsIm1vZGlmaWVyIiwiY3JlYXRlSW5kZXhBc3luYyIsInVuaXF1ZSIsInNwYXJzZSIsInBlcm11dGF0aW9ucyIsImkiLCJjaCIsImNoYXJBdCIsImxvd2VyQ2FzZUNoYXIiLCJ0b0xvd2VyQ2FzZSIsInVwcGVyQ2FzZUNoYXIiLCJ0b1VwcGVyQ2FzZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQUFBQSxPQUFPLENBQUNDLE1BQU0sQ0FBQztJQUFDQyxjQUFjLEVBQUNBLENBQUEsS0FBSUE7RUFBYyxDQUFDLENBQUM7RUFBQyxJQUFJQSxjQUFjO0VBQUNGLE9BQU8sQ0FBQ0csSUFBSSxDQUFDLHNCQUFzQixFQUFDO0lBQUNELGNBQWNBLENBQUNFLENBQUMsRUFBQztNQUFDRixjQUFjLEdBQUNFLENBQUM7SUFBQTtFQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7RUFFbko7QUFDQTtBQUNBO0FBQ0E7RUFDQUMsUUFBUSxHQUFHLElBQUlILGNBQWMsQ0FBQ0ksTUFBTSxDQUFDQyxNQUFNLENBQUM7O0VBRTVDO0VBQ0E7RUFDQTs7RUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDQUQsTUFBTSxDQUFDRSxLQUFLLEdBQUdILFFBQVEsQ0FBQ0csS0FBSztBQUFDLEVBQUFDLElBQUEsT0FBQUMsTUFBQSxFOzs7Ozs7Ozs7OztBQ2xCOUIsSUFBSUMsYUFBYTtBQUFDRCxNQUFNLENBQUNQLElBQUksQ0FBQyxzQ0FBc0MsRUFBQztFQUFDUyxPQUFPQSxDQUFDUixDQUFDLEVBQUM7SUFBQ08sYUFBYSxHQUFDUCxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQXJHTSxNQUFNLENBQUNULE1BQU0sQ0FBQztFQUFDWSxjQUFjLEVBQUNBLENBQUEsS0FBSUEsY0FBYztFQUFDQyx5QkFBeUIsRUFBQ0EsQ0FBQSxLQUFJQTtBQUF5QixD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LENBQUMsQ0FBQztFQUN4RWxaLEtBQUssQ0FBQ2daLGdCQUFnQixDQUFDLCtCQUErQixFQUFFO0lBQUVFLE1BQU0sRUFBRTtFQUFLLENBQUMsQ0FBQztBQUMzRSxDQUFDOztBQUdEO0FBQ0EsTUFBTXpSLGlDQUFpQyxHQUFHTixNQUFNLElBQUk7RUFDbEQsSUFBSWdTLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQztFQUN2QixLQUFLLElBQUlDLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR2pTLE1BQU0sQ0FBQzNFLE1BQU0sRUFBRTRXLENBQUMsRUFBRSxFQUFFO0lBQ3RDLE1BQU1DLEVBQUUsR0FBR2xTLE1BQU0sQ0FBQ21TLE1BQU0sQ0FBQ0YsQ0FBQyxDQUFDO0lBQzNCRCxZQUFZLEdBQUcsRUFBRSxDQUFDalYsTUFBTSxDQUFDLEdBQUlpVixZQUFZLENBQUN6UixHQUFHLENBQUNOLE1BQU0sSUFBSTtNQUN0RCxNQUFNbVMsYUFBYSxHQUFHRixFQUFFLENBQUNHLFdBQVcsQ0FBQyxDQUFDO01BQ3RDLE1BQU1DLGFBQWEsR0FBR0osRUFBRSxDQUFDSyxXQUFXLENBQUMsQ0FBQztNQUN0QztNQUNBLElBQUlILGFBQWEsS0FBS0UsYUFBYSxFQUFFO1FBQ25DLE9BQU8sQ0FBQ3JTLE1BQU0sR0FBR2lTLEVBQUUsQ0FBQztNQUN0QixDQUFDLE1BQU07UUFDTCxPQUFPLENBQUNqUyxNQUFNLEdBQUdtUyxhQUFhLEVBQUVuUyxNQUFNLEdBQUdxUyxhQUFhLENBQUM7TUFDekQ7SUFDRixDQUFDLENBQUUsQ0FBQztFQUNOO0VBQ0EsT0FBT04sWUFBWTtBQUNyQixDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2FjY291bnRzLWJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBY2NvdW50c1NlcnZlciB9IGZyb20gXCIuL2FjY291bnRzX3NlcnZlci5qc1wiO1xuXG4vKipcbiAqIEBuYW1lc3BhY2UgQWNjb3VudHNcbiAqIEBzdW1tYXJ5IFRoZSBuYW1lc3BhY2UgZm9yIGFsbCBzZXJ2ZXItc2lkZSBhY2NvdW50cy1yZWxhdGVkIG1ldGhvZHMuXG4gKi9cbkFjY291bnRzID0gbmV3IEFjY291bnRzU2VydmVyKE1ldGVvci5zZXJ2ZXIpO1xuXG4vLyBVc2VycyB0YWJsZS4gRG9uJ3QgdXNlIHRoZSBub3JtYWwgYXV0b3B1Ymxpc2gsIHNpbmNlIHdlIHdhbnQgdG8gaGlkZVxuLy8gc29tZSBmaWVsZHMuIENvZGUgdG8gYXV0b3B1Ymxpc2ggdGhpcyBpcyBpbiBhY2NvdW50c19zZXJ2ZXIuanMuXG4vLyBYWFggQWxsb3cgdXNlcnMgdG8gY29uZmlndXJlIHRoaXMgY29sbGVjdGlvbiBuYW1lLlxuXG4vKipcbiAqIEBzdW1tYXJ5IEEgW01vbmdvLkNvbGxlY3Rpb25dKCNjb2xsZWN0aW9ucykgY29udGFpbmluZyB1c2VyIGRvY3VtZW50cy5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQHR5cGUge01vbmdvLkNvbGxlY3Rpb259XG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4qL1xuTWV0ZW9yLnVzZXJzID0gQWNjb3VudHMudXNlcnM7XG5cbmV4cG9ydCB7XG4gIC8vIFNpbmNlIHRoaXMgZmlsZSBpcyB0aGUgbWFpbiBtb2R1bGUgZm9yIHRoZSBzZXJ2ZXIgdmVyc2lvbiBvZiB0aGVcbiAgLy8gYWNjb3VudHMtYmFzZSBwYWNrYWdlLCBwcm9wZXJ0aWVzIG9mIG5vbi1lbnRyeS1wb2ludCBtb2R1bGVzIG5lZWQgdG9cbiAgLy8gYmUgcmUtZXhwb3J0ZWQgaW4gb3JkZXIgdG8gYmUgYWNjZXNzaWJsZSB0byBtb2R1bGVzIHRoYXQgaW1wb3J0IHRoZVxuICAvLyBhY2NvdW50cy1iYXNlIHBhY2thZ2UuXG4gIEFjY291bnRzU2VydmVyXG59O1xuIiwiaW1wb3J0IHsgTWV0ZW9yIH0gZnJvbSAnbWV0ZW9yL21ldGVvcic7XG5cbi8vIGNvbmZpZyBvcHRpb24ga2V5c1xuY29uc3QgVkFMSURfQ09ORklHX0tFWVMgPSBbXG4gICdzZW5kVmVyaWZpY2F0aW9uRW1haWwnLFxuICAnZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uJyxcbiAgJ3Bhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uJyxcbiAgJ3Bhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uSW5EYXlzJyxcbiAgJ3Jlc3RyaWN0Q3JlYXRpb25CeUVtYWlsRG9tYWluJyxcbiAgJ2xvZ2luRXhwaXJhdGlvbkluRGF5cycsXG4gICdsb2dpbkV4cGlyYXRpb24nLFxuICAncGFzc3dvcmRSZXNldFRva2VuRXhwaXJhdGlvbkluRGF5cycsXG4gICdwYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uJyxcbiAgJ2FtYmlndW91c0Vycm9yTWVzc2FnZXMnLFxuICAnYmNyeXB0Um91bmRzJyxcbiAgJ2RlZmF1bHRGaWVsZFNlbGVjdG9yJyxcbiAgJ2xvZ2luVG9rZW5FeHBpcmF0aW9uSG91cnMnLFxuICAndG9rZW5TZXF1ZW5jZUxlbmd0aCcsXG4gICdjb2xsZWN0aW9uJyxcbl07XG5cbi8qKlxuICogQHN1bW1hcnkgU3VwZXItY29uc3RydWN0b3IgZm9yIEFjY291bnRzQ2xpZW50IGFuZCBBY2NvdW50c1NlcnZlci5cbiAqIEBsb2N1cyBBbnl3aGVyZVxuICogQGNsYXNzIEFjY291bnRzQ29tbW9uXG4gKiBAaW5zdGFuY2VuYW1lIGFjY291bnRzQ2xpZW50T3JTZXJ2ZXJcbiAqIEBwYXJhbSBvcHRpb25zIHtPYmplY3R9IGFuIG9iamVjdCB3aXRoIGZpZWxkczpcbiAqIC0gY29ubmVjdGlvbiB7T2JqZWN0fSBPcHRpb25hbCBERFAgY29ubmVjdGlvbiB0byByZXVzZS5cbiAqIC0gZGRwVXJsIHtTdHJpbmd9IE9wdGlvbmFsIFVSTCBmb3IgY3JlYXRpbmcgYSBuZXcgRERQIGNvbm5lY3Rpb24uXG4gKiAtIGNvbGxlY3Rpb24ge1N0cmluZ3xNb25nby5Db2xsZWN0aW9ufSBUaGUgbmFtZSBvZiB0aGUgTW9uZ28uQ29sbGVjdGlvblxuICogICAgIG9yIHRoZSBNb25nby5Db2xsZWN0aW9uIG9iamVjdCB0byBob2xkIHRoZSB1c2Vycy5cbiAqL1xuZXhwb3J0IGNsYXNzIEFjY291bnRzQ29tbW9uIHtcbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIC8vIEN1cnJlbnRseSB0aGlzIGlzIHJlYWQgZGlyZWN0bHkgYnkgcGFja2FnZXMgbGlrZSBhY2NvdW50cy1wYXNzd29yZFxuICAgIC8vIGFuZCBhY2NvdW50cy11aS11bnN0eWxlZC5cbiAgICB0aGlzLl9vcHRpb25zID0ge307XG5cbiAgICAvLyBOb3RlIHRoYXQgc2V0dGluZyB0aGlzLmNvbm5lY3Rpb24gPSBudWxsIGNhdXNlcyB0aGlzLnVzZXJzIHRvIGJlIGFcbiAgICAvLyBMb2NhbENvbGxlY3Rpb24sIHdoaWNoIGlzIG5vdCB3aGF0IHdlIHdhbnQuXG4gICAgdGhpcy5jb25uZWN0aW9uID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuX2luaXRDb25uZWN0aW9uKG9wdGlvbnMgfHwge30pO1xuXG4gICAgLy8gVGhlcmUgaXMgYW4gYWxsb3cgY2FsbCBpbiBhY2NvdW50c19zZXJ2ZXIuanMgdGhhdCByZXN0cmljdHMgd3JpdGVzIHRvXG4gICAgLy8gdGhpcyBjb2xsZWN0aW9uLlxuICAgIHRoaXMudXNlcnMgPSB0aGlzLl9pbml0aWFsaXplQ29sbGVjdGlvbihvcHRpb25zIHx8IHt9KTtcblxuICAgIC8vIENhbGxiYWNrIGV4Y2VwdGlvbnMgYXJlIHByaW50ZWQgd2l0aCBNZXRlb3IuX2RlYnVnIGFuZCBpZ25vcmVkLlxuICAgIHRoaXMuX29uTG9naW5Ib29rID0gbmV3IEhvb2soe1xuICAgICAgYmluZEVudmlyb25tZW50OiBmYWxzZSxcbiAgICAgIGRlYnVnUHJpbnRFeGNlcHRpb25zOiAnb25Mb2dpbiBjYWxsYmFjaycsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9vbkxvZ2luRmFpbHVyZUhvb2sgPSBuZXcgSG9vayh7XG4gICAgICBiaW5kRW52aXJvbm1lbnQ6IGZhbHNlLFxuICAgICAgZGVidWdQcmludEV4Y2VwdGlvbnM6ICdvbkxvZ2luRmFpbHVyZSBjYWxsYmFjaycsXG4gICAgfSk7XG5cbiAgICB0aGlzLl9vbkxvZ291dEhvb2sgPSBuZXcgSG9vayh7XG4gICAgICBiaW5kRW52aXJvbm1lbnQ6IGZhbHNlLFxuICAgICAgZGVidWdQcmludEV4Y2VwdGlvbnM6ICdvbkxvZ291dCBjYWxsYmFjaycsXG4gICAgfSk7XG5cbiAgICAvLyBFeHBvc2UgZm9yIHRlc3RpbmcuXG4gICAgdGhpcy5ERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUyA9IERFRkFVTFRfTE9HSU5fRVhQSVJBVElPTl9EQVlTO1xuICAgIHRoaXMuTE9HSU5fVU5FWFBJUklOR19UT0tFTl9EQVlTID0gTE9HSU5fVU5FWFBJUklOR19UT0tFTl9EQVlTO1xuXG4gICAgLy8gVGhyb3duIHdoZW4gdGhlIHVzZXIgY2FuY2VscyB0aGUgbG9naW4gcHJvY2VzcyAoZWcsIGNsb3NlcyBhbiBvYXV0aFxuICAgIC8vIHBvcHVwLCBkZWNsaW5lcyByZXRpbmEgc2NhbiwgZXRjKVxuICAgIGNvbnN0IGxjZU5hbWUgPSAnQWNjb3VudHMuTG9naW5DYW5jZWxsZWRFcnJvcic7XG4gICAgdGhpcy5Mb2dpbkNhbmNlbGxlZEVycm9yID0gTWV0ZW9yLm1ha2VFcnJvclR5cGUobGNlTmFtZSwgZnVuY3Rpb24oXG4gICAgICBkZXNjcmlwdGlvblxuICAgICkge1xuICAgICAgdGhpcy5tZXNzYWdlID0gZGVzY3JpcHRpb247XG4gICAgfSk7XG4gICAgdGhpcy5Mb2dpbkNhbmNlbGxlZEVycm9yLnByb3RvdHlwZS5uYW1lID0gbGNlTmFtZTtcblxuICAgIC8vIFRoaXMgaXMgdXNlZCB0byB0cmFuc21pdCBzcGVjaWZpYyBzdWJjbGFzcyBlcnJvcnMgb3ZlciB0aGUgd2lyZS4gV2VcbiAgICAvLyBzaG91bGQgY29tZSB1cCB3aXRoIGEgbW9yZSBnZW5lcmljIHdheSB0byBkbyB0aGlzIChlZywgd2l0aCBzb21lIHNvcnQgb2ZcbiAgICAvLyBzeW1ib2xpYyBlcnJvciBjb2RlIHJhdGhlciB0aGFuIGEgbnVtYmVyKS5cbiAgICB0aGlzLkxvZ2luQ2FuY2VsbGVkRXJyb3IubnVtZXJpY0Vycm9yID0gMHg4YWNkYzJmO1xuICB9XG5cbiAgX2luaXRpYWxpemVDb2xsZWN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5jb2xsZWN0aW9uICYmIHR5cGVvZiBvcHRpb25zLmNvbGxlY3Rpb24gIT09ICdzdHJpbmcnICYmICEob3B0aW9ucy5jb2xsZWN0aW9uIGluc3RhbmNlb2YgTW9uZ28uQ29sbGVjdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0NvbGxlY3Rpb24gcGFyYW1ldGVyIGNhbiBiZSBvbmx5IG9mIHR5cGUgc3RyaW5nIG9yIFwiTW9uZ28uQ29sbGVjdGlvblwiJyk7XG4gICAgfVxuXG4gICAgbGV0IGNvbGxlY3Rpb25OYW1lID0gJ3VzZXJzJztcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMuY29sbGVjdGlvbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGNvbGxlY3Rpb25OYW1lID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgIH1cblxuICAgIGxldCBjb2xsZWN0aW9uO1xuICAgIGlmIChvcHRpb25zLmNvbGxlY3Rpb24gaW5zdGFuY2VvZiBNb25nby5Db2xsZWN0aW9uKSB7XG4gICAgICBjb2xsZWN0aW9uID0gb3B0aW9ucy5jb2xsZWN0aW9uO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb2xsZWN0aW9uID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oY29sbGVjdGlvbk5hbWUsIHtcbiAgICAgICAgX3ByZXZlbnRBdXRvcHVibGlzaDogdHJ1ZSxcbiAgICAgICAgY29ubmVjdGlvbjogdGhpcy5jb25uZWN0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgR2V0IHRoZSBjdXJyZW50IHVzZXIgaWQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi4gQSByZWFjdGl2ZSBkYXRhIHNvdXJjZS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqL1xuICB1c2VySWQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd1c2VySWQgbWV0aG9kIG5vdCBpbXBsZW1lbnRlZCcpO1xuICB9XG5cbiAgLy8gbWVyZ2UgdGhlIGRlZmF1bHRGaWVsZFNlbGVjdG9yIHdpdGggYW4gZXhpc3Rpbmcgb3B0aW9ucyBvYmplY3RcbiAgX2FkZERlZmF1bHRGaWVsZFNlbGVjdG9yKG9wdGlvbnMgPSB7fSkge1xuICAgIC8vIHRoaXMgd2lsbCBiZSB0aGUgbW9zdCBjb21tb24gY2FzZSBmb3IgbW9zdCBwZW9wbGUsIHNvIG1ha2UgaXQgcXVpY2tcbiAgICBpZiAoIXRoaXMuX29wdGlvbnMuZGVmYXVsdEZpZWxkU2VsZWN0b3IpIHJldHVybiBvcHRpb25zO1xuXG4gICAgLy8gaWYgbm8gZmllbGQgc2VsZWN0b3IgdGhlbiBqdXN0IHVzZSBkZWZhdWx0RmllbGRTZWxlY3RvclxuICAgIGlmICghb3B0aW9ucy5maWVsZHMpXG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5vcHRpb25zLFxuICAgICAgICBmaWVsZHM6IHRoaXMuX29wdGlvbnMuZGVmYXVsdEZpZWxkU2VsZWN0b3IsXG4gICAgICB9O1xuXG4gICAgLy8gaWYgZW1wdHkgZmllbGQgc2VsZWN0b3IgdGhlbiB0aGUgZnVsbCB1c2VyIG9iamVjdCBpcyBleHBsaWNpdGx5IHJlcXVlc3RlZCwgc28gb2JleVxuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhvcHRpb25zLmZpZWxkcyk7XG4gICAgaWYgKCFrZXlzLmxlbmd0aCkgcmV0dXJuIG9wdGlvbnM7XG5cbiAgICAvLyBpZiB0aGUgcmVxdWVzdGVkIGZpZWxkcyBhcmUgK3ZlIHRoZW4gaWdub3JlIGRlZmF1bHRGaWVsZFNlbGVjdG9yXG4gICAgLy8gYXNzdW1lIHRoZXkgYXJlIGFsbCBlaXRoZXIgK3ZlIG9yIC12ZSBiZWNhdXNlIE1vbmdvIGRvZXNuJ3QgbGlrZSBtaXhlZFxuICAgIGlmICghIW9wdGlvbnMuZmllbGRzW2tleXNbMF1dKSByZXR1cm4gb3B0aW9ucztcblxuICAgIC8vIFRoZSByZXF1ZXN0ZWQgZmllbGRzIGFyZSAtdmUuXG4gICAgLy8gSWYgdGhlIGRlZmF1bHRGaWVsZFNlbGVjdG9yIGlzICt2ZSB0aGVuIHVzZSByZXF1ZXN0ZWQgZmllbGRzLCBvdGhlcndpc2UgbWVyZ2UgdGhlbVxuICAgIGNvbnN0IGtleXMyID0gT2JqZWN0LmtleXModGhpcy5fb3B0aW9ucy5kZWZhdWx0RmllbGRTZWxlY3Rvcik7XG4gICAgcmV0dXJuIHRoaXMuX29wdGlvbnMuZGVmYXVsdEZpZWxkU2VsZWN0b3Jba2V5czJbMF1dXG4gICAgICA/IG9wdGlvbnNcbiAgICAgIDoge1xuICAgICAgICAgIC4uLm9wdGlvbnMsXG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAuLi5vcHRpb25zLmZpZWxkcyxcbiAgICAgICAgICAgIC4uLnRoaXMuX29wdGlvbnMuZGVmYXVsdEZpZWxkU2VsZWN0b3IsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBHZXQgdGhlIGN1cnJlbnQgdXNlciByZWNvcmQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi4gQSByZWFjdGl2ZSBkYXRhIHNvdXJjZS5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtNb25nb0ZpZWxkU3BlY2lmaWVyfSBvcHRpb25zLmZpZWxkcyBEaWN0aW9uYXJ5IG9mIGZpZWxkcyB0byByZXR1cm4gb3IgZXhjbHVkZS5cbiAgICovXG4gIHVzZXIob3B0aW9ucykge1xuICAgIGNvbnN0IHVzZXJJZCA9IHRoaXMudXNlcklkKCk7XG4gICAgcmV0dXJuIHVzZXJJZFxuICAgICAgPyB0aGlzLnVzZXJzLmZpbmRPbmUodXNlcklkLCB0aGlzLl9hZGREZWZhdWx0RmllbGRTZWxlY3RvcihvcHRpb25zKSlcbiAgICAgIDogbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBHZXQgdGhlIGN1cnJlbnQgdXNlciByZWNvcmQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAgICogQHBhcmFtIHtNb25nb0ZpZWxkU3BlY2lmaWVyfSBvcHRpb25zLmZpZWxkcyBEaWN0aW9uYXJ5IG9mIGZpZWxkcyB0byByZXR1cm4gb3IgZXhjbHVkZS5cbiAgICovXG4gIGFzeW5jIHVzZXJBc3luYyhvcHRpb25zKSB7XG4gICAgY29uc3QgdXNlcklkID0gdGhpcy51c2VySWQoKTtcbiAgICByZXR1cm4gdXNlcklkXG4gICAgICA/IHRoaXMudXNlcnMuZmluZE9uZUFzeW5jKHVzZXJJZCwgdGhpcy5fYWRkRGVmYXVsdEZpZWxkU2VsZWN0b3Iob3B0aW9ucykpXG4gICAgICA6IG51bGw7XG4gIH1cbiAgLy8gU2V0IHVwIGNvbmZpZyBmb3IgdGhlIGFjY291bnRzIHN5c3RlbS4gQ2FsbCB0aGlzIG9uIGJvdGggdGhlIGNsaWVudFxuICAvLyBhbmQgdGhlIHNlcnZlci5cbiAgLy9cbiAgLy8gTm90ZSB0aGF0IHRoaXMgbWV0aG9kIGdldHMgb3ZlcnJpZGRlbiBvbiBBY2NvdW50c1NlcnZlci5wcm90b3R5cGUsIGJ1dFxuICAvLyB0aGUgb3ZlcnJpZGluZyBtZXRob2QgY2FsbHMgdGhlIG92ZXJyaWRkZW4gbWV0aG9kLlxuICAvL1xuICAvLyBYWFggd2Ugc2hvdWxkIGFkZCBzb21lIGVuZm9yY2VtZW50IHRoYXQgdGhpcyBpcyBjYWxsZWQgb24gYm90aCB0aGVcbiAgLy8gY2xpZW50IGFuZCB0aGUgc2VydmVyLiBPdGhlcndpc2UsIGEgdXNlciBjYW5cbiAgLy8gJ2ZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbicgb25seSBvbiB0aGUgY2xpZW50IGFuZCB3aGlsZSBpdCBsb29rc1xuICAvLyBsaWtlIHRoZWlyIGFwcCBpcyBzZWN1cmUsIHRoZSBzZXJ2ZXIgd2lsbCBzdGlsbCBhY2NlcHQgY3JlYXRlVXNlclxuICAvLyBjYWxscy4gaHR0cHM6Ly9naXRodWIuY29tL21ldGVvci9tZXRlb3IvaXNzdWVzLzgyOFxuICAvL1xuICAvLyBAcGFyYW0gb3B0aW9ucyB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCBmaWVsZHM6XG4gIC8vIC0gc2VuZFZlcmlmaWNhdGlvbkVtYWlsIHtCb29sZWFufVxuICAvLyAgICAgU2VuZCBlbWFpbCBhZGRyZXNzIHZlcmlmaWNhdGlvbiBlbWFpbHMgdG8gbmV3IHVzZXJzIGNyZWF0ZWQgZnJvbVxuICAvLyAgICAgY2xpZW50IHNpZ251cHMuXG4gIC8vIC0gZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uIHtCb29sZWFufVxuICAvLyAgICAgRG8gbm90IGFsbG93IGNsaWVudHMgdG8gY3JlYXRlIGFjY291bnRzIGRpcmVjdGx5LlxuICAvLyAtIHJlc3RyaWN0Q3JlYXRpb25CeUVtYWlsRG9tYWluIHtGdW5jdGlvbiBvciBTdHJpbmd9XG4gIC8vICAgICBSZXF1aXJlIGNyZWF0ZWQgdXNlcnMgdG8gaGF2ZSBhbiBlbWFpbCBtYXRjaGluZyB0aGUgZnVuY3Rpb24gb3JcbiAgLy8gICAgIGhhdmluZyB0aGUgc3RyaW5nIGFzIGRvbWFpbi5cbiAgLy8gLSBsb2dpbkV4cGlyYXRpb25JbkRheXMge051bWJlcn1cbiAgLy8gICAgIE51bWJlciBvZiBkYXlzIHNpbmNlIGxvZ2luIHVudGlsIGEgdXNlciBpcyBsb2dnZWQgb3V0IChsb2dpbiB0b2tlblxuICAvLyAgICAgZXhwaXJlcykuXG4gIC8vIC0gY29sbGVjdGlvbiB7U3RyaW5nfE1vbmdvLkNvbGxlY3Rpb259XG4gIC8vICAgICBBIGNvbGxlY3Rpb24gbmFtZSBvciBhIE1vbmdvLkNvbGxlY3Rpb24gb2JqZWN0IHRvIGhvbGQgdGhlIHVzZXJzLlxuICAvLyAtIHBhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb25JbkRheXMge051bWJlcn1cbiAgLy8gICAgIE51bWJlciBvZiBkYXlzIHNpbmNlIHBhc3N3b3JkIHJlc2V0IHRva2VuIGNyZWF0aW9uIHVudGlsIHRoZVxuICAvLyAgICAgdG9rZW4gY2FubnQgYmUgdXNlZCBhbnkgbG9uZ2VyIChwYXNzd29yZCByZXNldCB0b2tlbiBleHBpcmVzKS5cbiAgLy8gLSBhbWJpZ3VvdXNFcnJvck1lc3NhZ2VzIHtCb29sZWFufVxuICAvLyAgICAgUmV0dXJuIGFtYmlndW91cyBlcnJvciBtZXNzYWdlcyBmcm9tIGxvZ2luIGZhaWx1cmVzIHRvIHByZXZlbnRcbiAgLy8gICAgIHVzZXIgZW51bWVyYXRpb24uXG4gIC8vIC0gYmNyeXB0Um91bmRzIHtOdW1iZXJ9XG4gIC8vICAgICBBbGxvd3Mgb3ZlcnJpZGUgb2YgbnVtYmVyIG9mIGJjcnlwdCByb3VuZHMgKGFrYSB3b3JrIGZhY3RvcikgdXNlZFxuICAvLyAgICAgdG8gc3RvcmUgcGFzc3dvcmRzLlxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBTZXQgZ2xvYmFsIGFjY291bnRzIG9wdGlvbnMuIFlvdSBjYW4gYWxzbyBzZXQgdGhlc2UgaW4gYE1ldGVvci5zZXR0aW5ncy5wYWNrYWdlcy5hY2NvdW50c2Agd2l0aG91dCB0aGUgbmVlZCB0byBjYWxsIHRoaXMgZnVuY3Rpb24uXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsIE5ldyB1c2VycyB3aXRoIGFuIGVtYWlsIGFkZHJlc3Mgd2lsbCByZWNlaXZlIGFuIGFkZHJlc3MgdmVyaWZpY2F0aW9uIGVtYWlsLlxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IG9wdGlvbnMuZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uIENhbGxzIHRvIFtgY3JlYXRlVXNlcmBdKCNhY2NvdW50c19jcmVhdGV1c2VyKSBmcm9tIHRoZSBjbGllbnQgd2lsbCBiZSByZWplY3RlZC4gSW4gYWRkaXRpb24sIGlmIHlvdSBhcmUgdXNpbmcgW2FjY291bnRzLXVpXSgjYWNjb3VudHN1aSksIHRoZSBcIkNyZWF0ZSBhY2NvdW50XCIgbGluayB3aWxsIG5vdCBiZSBhdmFpbGFibGUuXG4gICAqIEBwYXJhbSB7U3RyaW5nIHwgRnVuY3Rpb259IG9wdGlvbnMucmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW4gSWYgc2V0IHRvIGEgc3RyaW5nLCBvbmx5IGFsbG93cyBuZXcgdXNlcnMgaWYgdGhlIGRvbWFpbiBwYXJ0IG9mIHRoZWlyIGVtYWlsIGFkZHJlc3MgbWF0Y2hlcyB0aGUgc3RyaW5nLiBJZiBzZXQgdG8gYSBmdW5jdGlvbiwgb25seSBhbGxvd3MgbmV3IHVzZXJzIGlmIHRoZSBmdW5jdGlvbiByZXR1cm5zIHRydWUuICBUaGUgZnVuY3Rpb24gaXMgcGFzc2VkIHRoZSBmdWxsIGVtYWlsIGFkZHJlc3Mgb2YgdGhlIHByb3Bvc2VkIG5ldyB1c2VyLiAgV29ya3Mgd2l0aCBwYXNzd29yZC1iYXNlZCBzaWduLWluIGFuZCBleHRlcm5hbCBzZXJ2aWNlcyB0aGF0IGV4cG9zZSBlbWFpbCBhZGRyZXNzZXMgKEdvb2dsZSwgRmFjZWJvb2ssIEdpdEh1YikuIEFsbCBleGlzdGluZyB1c2VycyBzdGlsbCBjYW4gbG9nIGluIGFmdGVyIGVuYWJsaW5nIHRoaXMgb3B0aW9uLiBFeGFtcGxlOiBgQWNjb3VudHMuY29uZmlnKHsgcmVzdHJpY3RDcmVhdGlvbkJ5RW1haWxEb21haW46ICdzY2hvb2wuZWR1JyB9KWAuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLmxvZ2luRXhwaXJhdGlvbkluRGF5cyBUaGUgbnVtYmVyIG9mIGRheXMgZnJvbSB3aGVuIGEgdXNlciBsb2dzIGluIHVudGlsIHRoZWlyIHRva2VuIGV4cGlyZXMgYW5kIHRoZXkgYXJlIGxvZ2dlZCBvdXQuIERlZmF1bHRzIHRvIDkwLiBTZXQgdG8gYG51bGxgIHRvIGRpc2FibGUgbG9naW4gZXhwaXJhdGlvbi5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdGlvbnMubG9naW5FeHBpcmF0aW9uIFRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIGZyb20gd2hlbiBhIHVzZXIgbG9ncyBpbiB1bnRpbCB0aGVpciB0b2tlbiBleHBpcmVzIGFuZCB0aGV5IGFyZSBsb2dnZWQgb3V0LCBmb3IgYSBtb3JlIGdyYW51bGFyIGNvbnRyb2wuIElmIGBsb2dpbkV4cGlyYXRpb25JbkRheXNgIGlzIHNldCwgaXQgdGFrZXMgcHJlY2VkZW50LlxuICAgKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy5vYXV0aFNlY3JldEtleSBXaGVuIHVzaW5nIHRoZSBgb2F1dGgtZW5jcnlwdGlvbmAgcGFja2FnZSwgdGhlIDE2IGJ5dGUga2V5IHVzaW5nIHRvIGVuY3J5cHQgc2Vuc2l0aXZlIGFjY291bnQgY3JlZGVudGlhbHMgaW4gdGhlIGRhdGFiYXNlLCBlbmNvZGVkIGluIGJhc2U2NC4gIFRoaXMgb3B0aW9uIG1heSBvbmx5IGJlIHNwZWNpZmllZCBvbiB0aGUgc2VydmVyLiAgU2VlIHBhY2thZ2VzL29hdXRoLWVuY3J5cHRpb24vUkVBRE1FLm1kIGZvciBkZXRhaWxzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5wYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzIFRoZSBudW1iZXIgb2YgZGF5cyBmcm9tIHdoZW4gYSBsaW5rIHRvIHJlc2V0IHBhc3N3b3JkIGlzIHNlbnQgdW50aWwgdG9rZW4gZXhwaXJlcyBhbmQgdXNlciBjYW4ndCByZXNldCBwYXNzd29yZCB3aXRoIHRoZSBsaW5rIGFueW1vcmUuIERlZmF1bHRzIHRvIDMuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLnBhc3N3b3JkUmVzZXRUb2tlbkV4cGlyYXRpb24gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSB3aGVuIGEgbGluayB0byByZXNldCBwYXNzd29yZCBpcyBzZW50IHVudGlsIHRva2VuIGV4cGlyZXMgYW5kIHVzZXIgY2FuJ3QgcmVzZXQgcGFzc3dvcmQgd2l0aCB0aGUgbGluayBhbnltb3JlLiBJZiBgcGFzc3dvcmRSZXNldFRva2VuRXhwaXJhdGlvbkluRGF5c2AgaXMgc2V0LCBpdCB0YWtlcyBwcmVjZWRlbnQuXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBvcHRpb25zLnBhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uSW5EYXlzIFRoZSBudW1iZXIgb2YgZGF5cyBmcm9tIHdoZW4gYSBsaW5rIHRvIHNldCBpbml0aWFsIHBhc3N3b3JkIGlzIHNlbnQgdW50aWwgdG9rZW4gZXhwaXJlcyBhbmQgdXNlciBjYW4ndCBzZXQgcGFzc3dvcmQgd2l0aCB0aGUgbGluayBhbnltb3JlLiBEZWZhdWx0cyB0byAzMC5cbiAgICogQHBhcmFtIHtOdW1iZXJ9IG9wdGlvbnMucGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb24gVGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgZnJvbSB3aGVuIGEgbGluayB0byBzZXQgaW5pdGlhbCBwYXNzd29yZCBpcyBzZW50IHVudGlsIHRva2VuIGV4cGlyZXMgYW5kIHVzZXIgY2FuJ3Qgc2V0IHBhc3N3b3JkIHdpdGggdGhlIGxpbmsgYW55bW9yZS4gSWYgYHBhc3N3b3JkRW5yb2xsVG9rZW5FeHBpcmF0aW9uSW5EYXlzYCBpcyBzZXQsIGl0IHRha2VzIHByZWNlZGVudC5cbiAgICogQHBhcmFtIHtCb29sZWFufSBvcHRpb25zLmFtYmlndW91c0Vycm9yTWVzc2FnZXMgUmV0dXJuIGFtYmlndW91cyBlcnJvciBtZXNzYWdlcyBmcm9tIGxvZ2luIGZhaWx1cmVzIHRvIHByZXZlbnQgdXNlciBlbnVtZXJhdGlvbi4gRGVmYXVsdHMgdG8gZmFsc2UuXG4gICAqIEBwYXJhbSB7TW9uZ29GaWVsZFNwZWNpZmllcn0gb3B0aW9ucy5kZWZhdWx0RmllbGRTZWxlY3RvciBUbyBleGNsdWRlIGJ5IGRlZmF1bHQgbGFyZ2UgY3VzdG9tIGZpZWxkcyBmcm9tIGBNZXRlb3IudXNlcigpYCBhbmQgYE1ldGVvci5maW5kVXNlckJ5Li4uKClgIGZ1bmN0aW9ucyB3aGVuIGNhbGxlZCB3aXRob3V0IGEgZmllbGQgc2VsZWN0b3IsIGFuZCBhbGwgYG9uTG9naW5gLCBgb25Mb2dpbkZhaWx1cmVgIGFuZCBgb25Mb2dvdXRgIGNhbGxiYWNrcy4gIEV4YW1wbGU6IGBBY2NvdW50cy5jb25maWcoeyBkZWZhdWx0RmllbGRTZWxlY3RvcjogeyBteUJpZ0FycmF5OiAwIH19KWAuIEJld2FyZSB3aGVuIHVzaW5nIHRoaXMuIElmLCBmb3IgaW5zdGFuY2UsIHlvdSBkbyBub3QgaW5jbHVkZSBgZW1haWxgIHdoZW4gZXhjbHVkaW5nIHRoZSBmaWVsZHMsIHlvdSBjYW4gaGF2ZSBwcm9ibGVtcyB3aXRoIGZ1bmN0aW9ucyBsaWtlIGBmb3Jnb3RQYXNzd29yZGAgdGhhdCB3aWxsIGJyZWFrIGJlY2F1c2UgdGhleSB3b24ndCBoYXZlIHRoZSByZXF1aXJlZCBkYXRhIGF2YWlsYWJsZS4gSXQncyByZWNvbW1lbmQgdGhhdCB5b3UgYWx3YXlzIGtlZXAgdGhlIGZpZWxkcyBgX2lkYCwgYHVzZXJuYW1lYCwgYW5kIGBlbWFpbGAuXG4gICAqIEBwYXJhbSB7U3RyaW5nfE1vbmdvLkNvbGxlY3Rpb259IG9wdGlvbnMuY29sbGVjdGlvbiBBIGNvbGxlY3Rpb24gbmFtZSBvciBhIE1vbmdvLkNvbGxlY3Rpb24gb2JqZWN0IHRvIGhvbGQgdGhlIHVzZXJzLlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy5sb2dpblRva2VuRXhwaXJhdGlvbkhvdXJzIFdoZW4gdXNpbmcgdGhlIHBhY2thZ2UgYGFjY291bnRzLTJmYWAsIHVzZSB0aGlzIHRvIHNldCB0aGUgYW1vdW50IG9mIHRpbWUgYSB0b2tlbiBzZW50IGlzIHZhbGlkLiBBcyBpdCdzIGp1c3QgYSBudW1iZXIsIHlvdSBjYW4gdXNlLCBmb3IgZXhhbXBsZSwgMC41IHRvIG1ha2UgdGhlIHRva2VuIHZhbGlkIGZvciBqdXN0IGhhbGYgaG91ci4gVGhlIGRlZmF1bHQgaXMgMSBob3VyLlxuICAgKiBAcGFyYW0ge051bWJlcn0gb3B0aW9ucy50b2tlblNlcXVlbmNlTGVuZ3RoIFdoZW4gdXNpbmcgdGhlIHBhY2thZ2UgYGFjY291bnRzLTJmYWAsIHVzZSB0aGlzIHRvIHRoZSBzaXplIG9mIHRoZSB0b2tlbiBzZXF1ZW5jZSBnZW5lcmF0ZWQuIFRoZSBkZWZhdWx0IGlzIDYuXG4gICAqL1xuICBjb25maWcob3B0aW9ucykge1xuICAgIC8vIFdlIGRvbid0IHdhbnQgdXNlcnMgdG8gYWNjaWRlbnRhbGx5IG9ubHkgY2FsbCBBY2NvdW50cy5jb25maWcgb24gdGhlXG4gICAgLy8gY2xpZW50LCB3aGVyZSBzb21lIG9mIHRoZSBvcHRpb25zIHdpbGwgaGF2ZSBwYXJ0aWFsIGVmZmVjdHMgKGVnIHJlbW92aW5nXG4gICAgLy8gdGhlIFwiY3JlYXRlIGFjY291bnRcIiBidXR0b24gZnJvbSBhY2NvdW50cy11aSBpZiBmb3JiaWRDbGllbnRBY2NvdW50Q3JlYXRpb25cbiAgICAvLyBpcyBzZXQsIG9yIHJlZGlyZWN0aW5nIEdvb2dsZSBsb2dpbiB0byBhIHNwZWNpZmljLWRvbWFpbiBwYWdlKSB3aXRob3V0XG4gICAgLy8gaGF2aW5nIHRoZWlyIGZ1bGwgZWZmZWN0cy5cbiAgICBpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gICAgICBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmFjY291bnRzQ29uZmlnQ2FsbGVkID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKCFfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmFjY291bnRzQ29uZmlnQ2FsbGVkKSB7XG4gICAgICAvLyBYWFggd291bGQgYmUgbmljZSB0byBcImNyYXNoXCIgdGhlIGNsaWVudCBhbmQgcmVwbGFjZSB0aGUgVUkgd2l0aCBhbiBlcnJvclxuICAgICAgLy8gbWVzc2FnZSwgYnV0IHRoZXJlJ3Mgbm8gdHJpdmlhbCB3YXkgdG8gZG8gdGhpcy5cbiAgICAgIE1ldGVvci5fZGVidWcoXG4gICAgICAgICdBY2NvdW50cy5jb25maWcgd2FzIGNhbGxlZCBvbiB0aGUgY2xpZW50IGJ1dCBub3Qgb24gdGhlICcgK1xuICAgICAgICAgICdzZXJ2ZXI7IHNvbWUgY29uZmlndXJhdGlvbiBvcHRpb25zIG1heSBub3QgdGFrZSBlZmZlY3QuJ1xuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBXZSBuZWVkIHRvIHZhbGlkYXRlIHRoZSBvYXV0aFNlY3JldEtleSBvcHRpb24gYXQgdGhlIHRpbWVcbiAgICAvLyBBY2NvdW50cy5jb25maWcgaXMgY2FsbGVkLiBXZSBhbHNvIGRlbGliZXJhdGVseSBkb24ndCBzdG9yZSB0aGVcbiAgICAvLyBvYXV0aFNlY3JldEtleSBpbiBBY2NvdW50cy5fb3B0aW9ucy5cbiAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsICdvYXV0aFNlY3JldEtleScpKSB7XG4gICAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnVGhlIG9hdXRoU2VjcmV0S2V5IG9wdGlvbiBtYXkgb25seSBiZSBzcGVjaWZpZWQgb24gdGhlIHNlcnZlcidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGlmICghUGFja2FnZVsnb2F1dGgtZW5jcnlwdGlvbiddKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnVGhlIG9hdXRoLWVuY3J5cHRpb24gcGFja2FnZSBtdXN0IGJlIGxvYWRlZCB0byBzZXQgb2F1dGhTZWNyZXRLZXknXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBQYWNrYWdlWydvYXV0aC1lbmNyeXB0aW9uJ10uT0F1dGhFbmNyeXB0aW9uLmxvYWRLZXkoXG4gICAgICAgIG9wdGlvbnMub2F1dGhTZWNyZXRLZXlcbiAgICAgICk7XG4gICAgICBvcHRpb25zID0geyAuLi5vcHRpb25zIH07XG4gICAgICBkZWxldGUgb3B0aW9ucy5vYXV0aFNlY3JldEtleTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBjb25maWcgb3B0aW9ucyBrZXlzXG4gICAgT2JqZWN0LmtleXMob3B0aW9ucykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgaWYgKCFWQUxJRF9DT05GSUdfS0VZUy5pbmNsdWRlcyhrZXkpKSB7XG4gICAgICAgIC8vIFRPRE8gQ29uc2lkZXIganVzdCBsb2dnaW5nIGEgZGVidWcgbWVzc2FnZSBpbnN0ZWFkIHRvIGFsbG93IGZvciBhZGRpdGlvbmFsIGtleXMgaW4gdGhlIHNldHRpbmdzIGhlcmU/XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoYEFjY291bnRzLmNvbmZpZzogSW52YWxpZCBrZXk6ICR7a2V5fWApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gc2V0IHZhbHVlcyBpbiBBY2NvdW50cy5fb3B0aW9uc1xuICAgIFZBTElEX0NPTkZJR19LRVlTLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIGlmIChrZXkgaW4gb3B0aW9ucykge1xuICAgICAgICBpZiAoa2V5IGluIHRoaXMuX29wdGlvbnMpIHtcbiAgICAgICAgICBpZiAoa2V5ICE9PSAnY29sbGVjdGlvbicpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoYENhbid0IHNldCBcXGAke2tleX1cXGAgbW9yZSB0aGFuIG9uY2VgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fb3B0aW9uc1trZXldID0gb3B0aW9uc1trZXldO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKG9wdGlvbnMuY29sbGVjdGlvbiAmJiBvcHRpb25zLmNvbGxlY3Rpb24gIT09IHRoaXMudXNlcnMuX25hbWUgJiYgb3B0aW9ucy5jb2xsZWN0aW9uICE9PSB0aGlzLnVzZXJzKSB7XG4gICAgICB0aGlzLnVzZXJzID0gdGhpcy5faW5pdGlhbGl6ZUNvbGxlY3Rpb24ob3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIGEgbG9naW4gYXR0ZW1wdCBzdWNjZWVkcy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCB3aGVuIGxvZ2luIGlzIHN1Y2Nlc3NmdWwuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgVGhlIGNhbGxiYWNrIHJlY2VpdmVzIGEgc2luZ2xlIG9iamVjdCB0aGF0XG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgaG9sZHMgbG9naW4gZGV0YWlscy4gVGhpcyBvYmplY3QgY29udGFpbnMgdGhlIGxvZ2luXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0IHR5cGUgKHBhc3N3b3JkLCByZXN1bWUsIGV0Yy4pIG9uIGJvdGggdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgY2xpZW50IGFuZCBzZXJ2ZXIuIGBvbkxvZ2luYCBjYWxsYmFja3MgcmVnaXN0ZXJlZFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIG9uIHRoZSBzZXJ2ZXIgYWxzbyByZWNlaXZlIGV4dHJhIGRhdGEsIHN1Y2hcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBhcyB1c2VyIGRldGFpbHMsIGNvbm5lY3Rpb24gaW5mb3JtYXRpb24sIGV0Yy5cbiAgICovXG4gIG9uTG9naW4oZnVuYykge1xuICAgIGxldCByZXQgPSB0aGlzLl9vbkxvZ2luSG9vay5yZWdpc3RlcihmdW5jKTtcbiAgICAvLyBjYWxsIHRoZSBqdXN0IHJlZ2lzdGVyZWQgY2FsbGJhY2sgaWYgYWxyZWFkeSBsb2dnZWQgaW5cbiAgICB0aGlzLl9zdGFydHVwQ2FsbGJhY2socmV0LmNhbGxiYWNrKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIGEgbG9naW4gYXR0ZW1wdCBmYWlscy5cbiAgICogQGxvY3VzIEFueXdoZXJlXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgVGhlIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgbG9naW4gaGFzIGZhaWxlZC5cbiAgICovXG4gIG9uTG9naW5GYWlsdXJlKGZ1bmMpIHtcbiAgICByZXR1cm4gdGhpcy5fb25Mb2dpbkZhaWx1cmVIb29rLnJlZ2lzdGVyKGZ1bmMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVyIGEgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIGEgbG9nb3V0IGF0dGVtcHQgc3VjY2VlZHMuXG4gICAqIEBsb2N1cyBBbnl3aGVyZVxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIFRoZSBjYWxsYmFjayB0byBiZSBjYWxsZWQgd2hlbiBsb2dvdXQgaXMgc3VjY2Vzc2Z1bC5cbiAgICovXG4gIG9uTG9nb3V0KGZ1bmMpIHtcbiAgICByZXR1cm4gdGhpcy5fb25Mb2dvdXRIb29rLnJlZ2lzdGVyKGZ1bmMpO1xuICB9XG5cbiAgX2luaXRDb25uZWN0aW9uKG9wdGlvbnMpIHtcbiAgICBpZiAoIU1ldGVvci5pc0NsaWVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRoZSBjb25uZWN0aW9uIHVzZWQgYnkgdGhlIEFjY291bnRzIHN5c3RlbS4gVGhpcyBpcyB0aGUgY29ubmVjdGlvblxuICAgIC8vIHRoYXQgd2lsbCBnZXQgbG9nZ2VkIGluIGJ5IE1ldGVvci5sb2dpbigpLCBhbmQgdGhpcyBpcyB0aGVcbiAgICAvLyBjb25uZWN0aW9uIHdob3NlIGxvZ2luIHN0YXRlIHdpbGwgYmUgcmVmbGVjdGVkIGJ5IE1ldGVvci51c2VySWQoKS5cbiAgICAvL1xuICAgIC8vIEl0IHdvdWxkIGJlIG11Y2ggcHJlZmVyYWJsZSBmb3IgdGhpcyB0byBiZSBpbiBhY2NvdW50c19jbGllbnQuanMsXG4gICAgLy8gYnV0IGl0IGhhcyB0byBiZSBoZXJlIGJlY2F1c2UgaXQncyBuZWVkZWQgdG8gY3JlYXRlIHRoZVxuICAgIC8vIE1ldGVvci51c2VycyBjb2xsZWN0aW9uLlxuICAgIGlmIChvcHRpb25zLmNvbm5lY3Rpb24pIHtcbiAgICAgIHRoaXMuY29ubmVjdGlvbiA9IG9wdGlvbnMuY29ubmVjdGlvbjtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbnMuZGRwVXJsKSB7XG4gICAgICB0aGlzLmNvbm5lY3Rpb24gPSBERFAuY29ubmVjdChvcHRpb25zLmRkcFVybCk7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHR5cGVvZiBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5BQ0NPVU5UU19DT05ORUNUSU9OX1VSTFxuICAgICkge1xuICAgICAgLy8gVGVtcG9yYXJ5LCBpbnRlcm5hbCBob29rIHRvIGFsbG93IHRoZSBzZXJ2ZXIgdG8gcG9pbnQgdGhlIGNsaWVudFxuICAgICAgLy8gdG8gYSBkaWZmZXJlbnQgYXV0aGVudGljYXRpb24gc2VydmVyLiBUaGlzIGlzIGZvciBhIHZlcnlcbiAgICAgIC8vIHBhcnRpY3VsYXIgdXNlIGNhc2UgdGhhdCBjb21lcyB1cCB3aGVuIGltcGxlbWVudGluZyBhIG9hdXRoXG4gICAgICAvLyBzZXJ2ZXIuIFVuc3VwcG9ydGVkIGFuZCBtYXkgZ28gYXdheSBhdCBhbnkgcG9pbnQgaW4gdGltZS5cbiAgICAgIC8vXG4gICAgICAvLyBXZSB3aWxsIGV2ZW50dWFsbHkgcHJvdmlkZSBhIGdlbmVyYWwgd2F5IHRvIHVzZSBhY2NvdW50LWJhc2VcbiAgICAgIC8vIGFnYWluc3QgYW55IEREUCBjb25uZWN0aW9uLCBub3QganVzdCBvbmUgc3BlY2lhbCBvbmUuXG4gICAgICB0aGlzLmNvbm5lY3Rpb24gPSBERFAuY29ubmVjdChcbiAgICAgICAgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5BQ0NPVU5UU19DT05ORUNUSU9OX1VSTFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb25uZWN0aW9uID0gTWV0ZW9yLmNvbm5lY3Rpb247XG4gICAgfVxuICB9XG5cbiAgX2dldFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICAvLyBXaGVuIGxvZ2luRXhwaXJhdGlvbkluRGF5cyBpcyBzZXQgdG8gbnVsbCwgd2UnbGwgdXNlIGEgcmVhbGx5IGhpZ2hcbiAgICAvLyBudW1iZXIgb2YgZGF5cyAoTE9HSU5fVU5FWFBJUkFCTEVfVE9LRU5fREFZUykgdG8gc2ltdWxhdGUgYW5cbiAgICAvLyB1bmV4cGlyaW5nIHRva2VuLlxuICAgIGNvbnN0IGxvZ2luRXhwaXJhdGlvbkluRGF5cyA9XG4gICAgICB0aGlzLl9vcHRpb25zLmxvZ2luRXhwaXJhdGlvbkluRGF5cyA9PT0gbnVsbFxuICAgICAgICA/IExPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZU1xuICAgICAgICA6IHRoaXMuX29wdGlvbnMubG9naW5FeHBpcmF0aW9uSW5EYXlzO1xuICAgIHJldHVybiAoXG4gICAgICB0aGlzLl9vcHRpb25zLmxvZ2luRXhwaXJhdGlvbiB8fFxuICAgICAgKGxvZ2luRXhwaXJhdGlvbkluRGF5cyB8fCBERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUykgKiA4NjQwMDAwMFxuICAgICk7XG4gIH1cblxuICBfZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fb3B0aW9ucy5wYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uIHx8XG4gICAgICAodGhpcy5fb3B0aW9ucy5wYXNzd29yZFJlc2V0VG9rZW5FeHBpcmF0aW9uSW5EYXlzIHx8XG4gICAgICAgIERFRkFVTFRfUEFTU1dPUkRfUkVTRVRfVE9LRU5fRVhQSVJBVElPTl9EQVlTKSAqIDg2NDAwMDAwXG4gICAgKTtcbiAgfVxuXG4gIF9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5fb3B0aW9ucy5wYXNzd29yZEVucm9sbFRva2VuRXhwaXJhdGlvbiB8fFxuICAgICAgKHRoaXMuX29wdGlvbnMucGFzc3dvcmRFbnJvbGxUb2tlbkV4cGlyYXRpb25JbkRheXMgfHxcbiAgICAgICAgREVGQVVMVF9QQVNTV09SRF9FTlJPTExfVE9LRU5fRVhQSVJBVElPTl9EQVlTKSAqIDg2NDAwMDAwXG4gICAgKTtcbiAgfVxuXG4gIF90b2tlbkV4cGlyYXRpb24od2hlbikge1xuICAgIC8vIFdlIHBhc3Mgd2hlbiB0aHJvdWdoIHRoZSBEYXRlIGNvbnN0cnVjdG9yIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eTtcbiAgICAvLyBgd2hlbmAgdXNlZCB0byBiZSBhIG51bWJlci5cbiAgICByZXR1cm4gbmV3IERhdGUobmV3IERhdGUod2hlbikuZ2V0VGltZSgpICsgdGhpcy5fZ2V0VG9rZW5MaWZldGltZU1zKCkpO1xuICB9XG5cbiAgX3Rva2VuRXhwaXJlc1Nvb24od2hlbikge1xuICAgIGxldCBtaW5MaWZldGltZU1zID0gMC4xICogdGhpcy5fZ2V0VG9rZW5MaWZldGltZU1zKCk7XG4gICAgY29uc3QgbWluTGlmZXRpbWVDYXBNcyA9IE1JTl9UT0tFTl9MSUZFVElNRV9DQVBfU0VDUyAqIDEwMDA7XG4gICAgaWYgKG1pbkxpZmV0aW1lTXMgPiBtaW5MaWZldGltZUNhcE1zKSB7XG4gICAgICBtaW5MaWZldGltZU1zID0gbWluTGlmZXRpbWVDYXBNcztcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBEYXRlKCkgPiBuZXcgRGF0ZSh3aGVuKSAtIG1pbkxpZmV0aW1lTXM7XG4gIH1cblxuICAvLyBOby1vcCBvbiB0aGUgc2VydmVyLCBvdmVycmlkZGVuIG9uIHRoZSBjbGllbnQuXG4gIF9zdGFydHVwQ2FsbGJhY2soY2FsbGJhY2spIHt9XG59XG5cbi8vIE5vdGUgdGhhdCBBY2NvdW50cyBpcyBkZWZpbmVkIHNlcGFyYXRlbHkgaW4gYWNjb3VudHNfY2xpZW50LmpzIGFuZFxuLy8gYWNjb3VudHNfc2VydmVyLmpzLlxuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0aGUgY3VycmVudCB1c2VyIGlkLCBvciBgbnVsbGAgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4uIEEgcmVhY3RpdmUgZGF0YSBzb3VyY2UuXG4gKiBAbG9jdXMgQW55d2hlcmUgYnV0IHB1Ymxpc2ggZnVuY3Rpb25zXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgbWV0ZW9yXG4gKi9cbk1ldGVvci51c2VySWQgPSAoKSA9PiBBY2NvdW50cy51c2VySWQoKTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZXQgdGhlIGN1cnJlbnQgdXNlciByZWNvcmQsIG9yIGBudWxsYCBpZiBubyB1c2VyIGlzIGxvZ2dlZCBpbi4gQSByZWFjdGl2ZSBkYXRhIHNvdXJjZS5cbiAqIEBsb2N1cyBBbnl3aGVyZSBidXQgcHVibGlzaCBmdW5jdGlvbnNcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBtZXRlb3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7TW9uZ29GaWVsZFNwZWNpZmllcn0gb3B0aW9ucy5maWVsZHMgRGljdGlvbmFyeSBvZiBmaWVsZHMgdG8gcmV0dXJuIG9yIGV4Y2x1ZGUuXG4gKi9cbk1ldGVvci51c2VyID0gb3B0aW9ucyA9PiBBY2NvdW50cy51c2VyKG9wdGlvbnMpO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEdldCB0aGUgY3VycmVudCB1c2VyIHJlY29yZCwgb3IgYG51bGxgIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLiBBIHJlYWN0aXZlIGRhdGEgc291cmNlLlxuICogQGxvY3VzIEFueXdoZXJlIGJ1dCBwdWJsaXNoIGZ1bmN0aW9uc1xuICogQGltcG9ydEZyb21QYWNrYWdlIG1ldGVvclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtNb25nb0ZpZWxkU3BlY2lmaWVyfSBvcHRpb25zLmZpZWxkcyBEaWN0aW9uYXJ5IG9mIGZpZWxkcyB0byByZXR1cm4gb3IgZXhjbHVkZS5cbiAqL1xuTWV0ZW9yLnVzZXJBc3luYyA9IG9wdGlvbnMgPT4gQWNjb3VudHMudXNlckFzeW5jKG9wdGlvbnMpO1xuXG4vLyBob3cgbG9uZyAoaW4gZGF5cykgdW50aWwgYSBsb2dpbiB0b2tlbiBleHBpcmVzXG5jb25zdCBERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUyA9IDkwO1xuLy8gaG93IGxvbmcgKGluIGRheXMpIHVudGlsIHJlc2V0IHBhc3N3b3JkIHRva2VuIGV4cGlyZXNcbmNvbnN0IERFRkFVTFRfUEFTU1dPUkRfUkVTRVRfVE9LRU5fRVhQSVJBVElPTl9EQVlTID0gMztcbi8vIGhvdyBsb25nIChpbiBkYXlzKSB1bnRpbCBlbnJvbCBwYXNzd29yZCB0b2tlbiBleHBpcmVzXG5jb25zdCBERUZBVUxUX1BBU1NXT1JEX0VOUk9MTF9UT0tFTl9FWFBJUkFUSU9OX0RBWVMgPSAzMDtcbi8vIENsaWVudHMgZG9uJ3QgdHJ5IHRvIGF1dG8tbG9naW4gd2l0aCBhIHRva2VuIHRoYXQgaXMgZ29pbmcgdG8gZXhwaXJlIHdpdGhpblxuLy8gLjEgKiBERUZBVUxUX0xPR0lOX0VYUElSQVRJT05fREFZUywgY2FwcGVkIGF0IE1JTl9UT0tFTl9MSUZFVElNRV9DQVBfU0VDUy5cbi8vIFRyaWVzIHRvIGF2b2lkIGFicnVwdCBkaXNjb25uZWN0cyBmcm9tIGV4cGlyaW5nIHRva2Vucy5cbmNvbnN0IE1JTl9UT0tFTl9MSUZFVElNRV9DQVBfU0VDUyA9IDM2MDA7IC8vIG9uZSBob3VyXG4vLyBob3cgb2Z0ZW4gKGluIG1pbGxpc2Vjb25kcykgd2UgY2hlY2sgZm9yIGV4cGlyZWQgdG9rZW5zXG5leHBvcnQgY29uc3QgRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyA9IDYwMCAqIDEwMDA7IC8vIDEwIG1pbnV0ZXNcbi8vIEEgbGFyZ2UgbnVtYmVyIG9mIGV4cGlyYXRpb24gZGF5cyAoYXBwcm94aW1hdGVseSAxMDAgeWVhcnMgd29ydGgpIHRoYXQgaXNcbi8vIHVzZWQgd2hlbiBjcmVhdGluZyB1bmV4cGlyaW5nIHRva2Vucy5cbmNvbnN0IExPR0lOX1VORVhQSVJJTkdfVE9LRU5fREFZUyA9IDM2NSAqIDEwMDtcbiIsImltcG9ydCBjcnlwdG8gZnJvbSAnY3J5cHRvJztcbmltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InXG5pbXBvcnQge1xuICBBY2NvdW50c0NvbW1vbixcbiAgRVhQSVJFX1RPS0VOU19JTlRFUlZBTF9NUyxcbn0gZnJvbSAnLi9hY2NvdW50c19jb21tb24uanMnO1xuaW1wb3J0IHsgVVJMIH0gZnJvbSAnbWV0ZW9yL3VybCc7XG5cbmNvbnN0IGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8vIFhYWCBtYXliZSB0aGlzIGJlbG9uZ3MgaW4gdGhlIGNoZWNrIHBhY2thZ2VcbmNvbnN0IE5vbkVtcHR5U3RyaW5nID0gTWF0Y2guV2hlcmUoeCA9PiB7XG4gIGNoZWNrKHgsIFN0cmluZyk7XG4gIHJldHVybiB4Lmxlbmd0aCA+IDA7XG59KTtcblxuLyoqXG4gKiBAc3VtbWFyeSBDb25zdHJ1Y3RvciBmb3IgdGhlIGBBY2NvdW50c2AgbmFtZXNwYWNlIG9uIHRoZSBzZXJ2ZXIuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAY2xhc3MgQWNjb3VudHNTZXJ2ZXJcbiAqIEBleHRlbmRzIEFjY291bnRzQ29tbW9uXG4gKiBAaW5zdGFuY2VuYW1lIGFjY291bnRzU2VydmVyXG4gKiBAcGFyYW0ge09iamVjdH0gc2VydmVyIEEgc2VydmVyIG9iamVjdCBzdWNoIGFzIGBNZXRlb3Iuc2VydmVyYC5cbiAqL1xuZXhwb3J0IGNsYXNzIEFjY291bnRzU2VydmVyIGV4dGVuZHMgQWNjb3VudHNDb21tb24ge1xuICAvLyBOb3RlIHRoYXQgdGhpcyBjb25zdHJ1Y3RvciBpcyBsZXNzIGxpa2VseSB0byBiZSBpbnN0YW50aWF0ZWQgbXVsdGlwbGVcbiAgLy8gdGltZXMgdGhhbiB0aGUgYEFjY291bnRzQ2xpZW50YCBjb25zdHJ1Y3RvciwgYmVjYXVzZSBhIHNpbmdsZSBzZXJ2ZXJcbiAgLy8gY2FuIHByb3ZpZGUgb25seSBvbmUgc2V0IG9mIG1ldGhvZHMuXG4gIGNvbnN0cnVjdG9yKHNlcnZlciwgb3B0aW9ucykge1xuICAgIHN1cGVyKG9wdGlvbnMgfHwge30pO1xuXG4gICAgdGhpcy5fc2VydmVyID0gc2VydmVyIHx8IE1ldGVvci5zZXJ2ZXI7XG4gICAgLy8gU2V0IHVwIHRoZSBzZXJ2ZXIncyBtZXRob2RzLCBhcyBpZiBieSBjYWxsaW5nIE1ldGVvci5tZXRob2RzLlxuICAgIHRoaXMuX2luaXRTZXJ2ZXJNZXRob2RzKCk7XG5cbiAgICB0aGlzLl9pbml0QWNjb3VudERhdGFIb29rcygpO1xuXG4gICAgLy8gSWYgYXV0b3B1Ymxpc2ggaXMgb24sIHB1Ymxpc2ggdGhlc2UgdXNlciBmaWVsZHMuIExvZ2luIHNlcnZpY2VcbiAgICAvLyBwYWNrYWdlcyAoZWcgYWNjb3VudHMtZ29vZ2xlKSBhZGQgdG8gdGhlc2UgYnkgY2FsbGluZ1xuICAgIC8vIGFkZEF1dG9wdWJsaXNoRmllbGRzLiAgTm90YWJseSwgdGhpcyBpc24ndCBpbXBsZW1lbnRlZCB3aXRoIG11bHRpcGxlXG4gICAgLy8gcHVibGlzaGVzIHNpbmNlIEREUCBvbmx5IG1lcmdlcyBvbmx5IGFjcm9zcyB0b3AtbGV2ZWwgZmllbGRzLCBub3RcbiAgICAvLyBzdWJmaWVsZHMgKHN1Y2ggYXMgJ3NlcnZpY2VzLmZhY2Vib29rLmFjY2Vzc1Rva2VuJylcbiAgICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcyA9IHtcbiAgICAgIGxvZ2dlZEluVXNlcjogWydwcm9maWxlJywgJ3VzZXJuYW1lJywgJ2VtYWlscyddLFxuICAgICAgb3RoZXJVc2VyczogWydwcm9maWxlJywgJ3VzZXJuYW1lJ11cbiAgICB9O1xuXG4gICAgLy8gdXNlIG9iamVjdCB0byBrZWVwIHRoZSByZWZlcmVuY2Ugd2hlbiB1c2VkIGluIGZ1bmN0aW9uc1xuICAgIC8vIHdoZXJlIF9kZWZhdWx0UHVibGlzaEZpZWxkcyBpcyBkZXN0cnVjdHVyZWQgaW50byBsZXhpY2FsIHNjb3BlXG4gICAgLy8gZm9yIHB1Ymxpc2ggY2FsbGJhY2tzIHRoYXQgbmVlZCBgdGhpc2BcbiAgICB0aGlzLl9kZWZhdWx0UHVibGlzaEZpZWxkcyA9IHtcbiAgICAgIHByb2plY3Rpb246IHtcbiAgICAgICAgcHJvZmlsZTogMSxcbiAgICAgICAgdXNlcm5hbWU6IDEsXG4gICAgICAgIGVtYWlsczogMSxcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5faW5pdFNlcnZlclB1YmxpY2F0aW9ucygpO1xuXG4gICAgLy8gY29ubmVjdGlvbklkIC0+IHtjb25uZWN0aW9uLCBsb2dpblRva2VufVxuICAgIHRoaXMuX2FjY291bnREYXRhID0ge307XG5cbiAgICAvLyBjb25uZWN0aW9uIGlkIC0+IG9ic2VydmUgaGFuZGxlIGZvciB0aGUgbG9naW4gdG9rZW4gdGhhdCB0aGlzIGNvbm5lY3Rpb24gaXNcbiAgICAvLyBjdXJyZW50bHkgYXNzb2NpYXRlZCB3aXRoLCBvciBhIG51bWJlci4gVGhlIG51bWJlciBpbmRpY2F0ZXMgdGhhdCB3ZSBhcmUgaW5cbiAgICAvLyB0aGUgcHJvY2VzcyBvZiBzZXR0aW5nIHVwIHRoZSBvYnNlcnZlICh1c2luZyBhIG51bWJlciBpbnN0ZWFkIG9mIGEgc2luZ2xlXG4gICAgLy8gc2VudGluZWwgYWxsb3dzIG11bHRpcGxlIGF0dGVtcHRzIHRvIHNldCB1cCB0aGUgb2JzZXJ2ZSB0byBpZGVudGlmeSB3aGljaFxuICAgIC8vIG9uZSB3YXMgdGhlaXJzKS5cbiAgICB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9ucyA9IHt9O1xuICAgIHRoaXMuX25leHRVc2VyT2JzZXJ2ZU51bWJlciA9IDE7ICAvLyBmb3IgdGhlIG51bWJlciBkZXNjcmliZWQgYWJvdmUuXG5cbiAgICAvLyBsaXN0IG9mIGFsbCByZWdpc3RlcmVkIGhhbmRsZXJzLlxuICAgIHRoaXMuX2xvZ2luSGFuZGxlcnMgPSBbXTtcblxuICAgIHNldHVwVXNlcnNDb2xsZWN0aW9uKHRoaXMudXNlcnMpO1xuICAgIHNldHVwRGVmYXVsdExvZ2luSGFuZGxlcnModGhpcyk7XG4gICAgc2V0RXhwaXJlVG9rZW5zSW50ZXJ2YWwodGhpcyk7XG5cbiAgICB0aGlzLl92YWxpZGF0ZUxvZ2luSG9vayA9IG5ldyBIb29rKHsgYmluZEVudmlyb25tZW50OiBmYWxzZSB9KTtcbiAgICB0aGlzLl92YWxpZGF0ZU5ld1VzZXJIb29rcyA9IFtcbiAgICAgIGRlZmF1bHRWYWxpZGF0ZU5ld1VzZXJIb29rLmJpbmQodGhpcylcbiAgICBdO1xuXG4gICAgdGhpcy5fZGVsZXRlU2F2ZWRUb2tlbnNGb3JBbGxVc2Vyc09uU3RhcnR1cCgpO1xuXG4gICAgdGhpcy5fc2tpcENhc2VJbnNlbnNpdGl2ZUNoZWNrc0ZvclRlc3QgPSB7fTtcblxuICAgIHRoaXMudXJscyA9IHtcbiAgICAgIHJlc2V0UGFzc3dvcmQ6ICh0b2tlbiwgZXh0cmFQYXJhbXMpID0+IHRoaXMuYnVpbGRFbWFpbFVybChgIy9yZXNldC1wYXNzd29yZC8ke3Rva2VufWAsIGV4dHJhUGFyYW1zKSxcbiAgICAgIHZlcmlmeUVtYWlsOiAodG9rZW4sIGV4dHJhUGFyYW1zKSA9PiB0aGlzLmJ1aWxkRW1haWxVcmwoYCMvdmVyaWZ5LWVtYWlsLyR7dG9rZW59YCwgZXh0cmFQYXJhbXMpLFxuICAgICAgbG9naW5Ub2tlbjogKHNlbGVjdG9yLCB0b2tlbiwgZXh0cmFQYXJhbXMpID0+XG4gICAgICAgIHRoaXMuYnVpbGRFbWFpbFVybChgLz9sb2dpblRva2VuPSR7dG9rZW59JnNlbGVjdG9yPSR7c2VsZWN0b3J9YCwgZXh0cmFQYXJhbXMpLFxuICAgICAgZW5yb2xsQWNjb3VudDogKHRva2VuLCBleHRyYVBhcmFtcykgPT4gdGhpcy5idWlsZEVtYWlsVXJsKGAjL2Vucm9sbC1hY2NvdW50LyR7dG9rZW59YCwgZXh0cmFQYXJhbXMpLFxuICAgIH07XG5cbiAgICB0aGlzLmFkZERlZmF1bHRSYXRlTGltaXQoKTtcblxuICAgIHRoaXMuYnVpbGRFbWFpbFVybCA9IChwYXRoLCBleHRyYVBhcmFtcyA9IHt9KSA9PiB7XG4gICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKE1ldGVvci5hYnNvbHV0ZVVybChwYXRoKSk7XG4gICAgICBjb25zdCBwYXJhbXMgPSBPYmplY3QuZW50cmllcyhleHRyYVBhcmFtcyk7XG4gICAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gQWRkIGFkZGl0aW9uYWwgcGFyYW1ldGVycyB0byB0aGUgdXJsXG4gICAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHBhcmFtcykge1xuICAgICAgICAgIHVybC5zZWFyY2hQYXJhbXMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdXJsLnRvU3RyaW5nKCk7XG4gICAgfTtcbiAgfVxuXG4gIC8vL1xuICAvLy8gQ1VSUkVOVCBVU0VSXG4gIC8vL1xuXG4gIC8vIEBvdmVycmlkZSBvZiBcImFic3RyYWN0XCIgbm9uLWltcGxlbWVudGF0aW9uIGluIGFjY291bnRzX2NvbW1vbi5qc1xuICB1c2VySWQoKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiBvbmx5IHdvcmtzIGlmIGNhbGxlZCBpbnNpZGUgYSBtZXRob2Qgb3IgYSBwdWJpY2F0aW9uLlxuICAgIC8vIFVzaW5nIGFueSBvZiB0aGUgaW5mb3JtYXRpb24gZnJvbSBNZXRlb3IudXNlcigpIGluIGEgbWV0aG9kIG9yXG4gICAgLy8gcHVibGlzaCBmdW5jdGlvbiB3aWxsIGFsd2F5cyB1c2UgdGhlIHZhbHVlIGZyb20gd2hlbiB0aGUgZnVuY3Rpb24gZmlyc3RcbiAgICAvLyBydW5zLiBUaGlzIGlzIGxpa2VseSBub3Qgd2hhdCB0aGUgdXNlciBleHBlY3RzLiBUaGUgd2F5IHRvIG1ha2UgdGhpcyB3b3JrXG4gICAgLy8gaW4gYSBtZXRob2Qgb3IgcHVibGlzaCBmdW5jdGlvbiBpcyB0byBkbyBNZXRlb3IuZmluZCh0aGlzLnVzZXJJZCkub2JzZXJ2ZVxuICAgIC8vIGFuZCByZWNvbXB1dGUgd2hlbiB0aGUgdXNlciByZWNvcmQgY2hhbmdlcy5cbiAgICBjb25zdCBjdXJyZW50SW52b2NhdGlvbiA9IEREUC5fQ3VycmVudE1ldGhvZEludm9jYXRpb24uZ2V0KCkgfHwgRERQLl9DdXJyZW50UHVibGljYXRpb25JbnZvY2F0aW9uLmdldCgpO1xuICAgIGlmICghY3VycmVudEludm9jYXRpb24pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRlb3IudXNlcklkIGNhbiBvbmx5IGJlIGludm9rZWQgaW4gbWV0aG9kIGNhbGxzIG9yIHB1YmxpY2F0aW9ucy5cIik7XG4gICAgcmV0dXJuIGN1cnJlbnRJbnZvY2F0aW9uLnVzZXJJZDtcbiAgfVxuXG4gIC8vL1xuICAvLy8gTE9HSU4gSE9PS1NcbiAgLy8vXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFZhbGlkYXRlIGxvZ2luIGF0dGVtcHRzLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGEgbG9naW4gaXMgYXR0ZW1wdGVkIChlaXRoZXIgc3VjY2Vzc2Z1bCBvciB1bnN1Y2Nlc3NmdWwpLiAgQSBsb2dpbiBjYW4gYmUgYWJvcnRlZCBieSByZXR1cm5pbmcgYSBmYWxzeSB2YWx1ZSBvciB0aHJvd2luZyBhbiBleGNlcHRpb24uXG4gICAqL1xuICB2YWxpZGF0ZUxvZ2luQXR0ZW1wdChmdW5jKSB7XG4gICAgLy8gRXhjZXB0aW9ucyBpbnNpZGUgdGhlIGhvb2sgY2FsbGJhY2sgYXJlIHBhc3NlZCB1cCB0byB1cy5cbiAgICByZXR1cm4gdGhpcy5fdmFsaWRhdGVMb2dpbkhvb2sucmVnaXN0ZXIoZnVuYyk7XG4gIH1cblxuICAvKipcbiAgICogQHN1bW1hcnkgU2V0IHJlc3RyaWN0aW9ucyBvbiBuZXcgdXNlciBjcmVhdGlvbi5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIENhbGxlZCB3aGVuZXZlciBhIG5ldyB1c2VyIGlzIGNyZWF0ZWQuIFRha2VzIHRoZSBuZXcgdXNlciBvYmplY3QsIGFuZCByZXR1cm5zIHRydWUgdG8gYWxsb3cgdGhlIGNyZWF0aW9uIG9yIGZhbHNlIHRvIGFib3J0LlxuICAgKi9cbiAgdmFsaWRhdGVOZXdVc2VyKGZ1bmMpIHtcbiAgICB0aGlzLl92YWxpZGF0ZU5ld1VzZXJIb29rcy5wdXNoKGZ1bmMpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFZhbGlkYXRlIGxvZ2luIGZyb20gZXh0ZXJuYWwgc2VydmljZVxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGxvZ2luL3VzZXIgY3JlYXRpb24gZnJvbSBleHRlcm5hbCBzZXJ2aWNlIGlzIGF0dGVtcHRlZC4gTG9naW4gb3IgdXNlciBjcmVhdGlvbiBiYXNlZCBvbiB0aGlzIGxvZ2luIGNhbiBiZSBhYm9ydGVkIGJ5IHBhc3NpbmcgYSBmYWxzeSB2YWx1ZSBvciB0aHJvd2luZyBhbiBleGNlcHRpb24uXG4gICAqL1xuICBiZWZvcmVFeHRlcm5hbExvZ2luKGZ1bmMpIHtcbiAgICBpZiAodGhpcy5fYmVmb3JlRXh0ZXJuYWxMb2dpbkhvb2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbiBvbmx5IGNhbGwgYmVmb3JlRXh0ZXJuYWxMb2dpbiBvbmNlXCIpO1xuICAgIH1cblxuICAgIHRoaXMuX2JlZm9yZUV4dGVybmFsTG9naW5Ib29rID0gZnVuYztcbiAgfVxuXG4gIC8vL1xuICAvLy8gQ1JFQVRFIFVTRVIgSE9PS1NcbiAgLy8vXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IEN1c3RvbWl6ZSBsb2dpbiB0b2tlbiBjcmVhdGlvbi5cbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIENhbGxlZCB3aGVuZXZlciBhIG5ldyB0b2tlbiBpcyBjcmVhdGVkLlxuICAgKiBSZXR1cm4gdGhlIHNlcXVlbmNlIGFuZCB0aGUgdXNlciBvYmplY3QuIFJldHVybiB0cnVlIHRvIGtlZXAgc2VuZGluZyB0aGUgZGVmYXVsdCBlbWFpbCwgb3IgZmFsc2UgdG8gb3ZlcnJpZGUgdGhlIGJlaGF2aW9yLlxuICAgKi9cbiAgb25DcmVhdGVMb2dpblRva2VuID0gZnVuY3Rpb24oZnVuYykge1xuICAgIGlmICh0aGlzLl9vbkNyZWF0ZUxvZ2luVG9rZW5Ib29rKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NhbiBvbmx5IGNhbGwgb25DcmVhdGVMb2dpblRva2VuIG9uY2UnKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vbkNyZWF0ZUxvZ2luVG9rZW5Ib29rID0gZnVuYztcbiAgfTtcblxuICAvKipcbiAgICogQHN1bW1hcnkgQ3VzdG9taXplIG5ldyB1c2VyIGNyZWF0aW9uLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZ1bmMgQ2FsbGVkIHdoZW5ldmVyIGEgbmV3IHVzZXIgaXMgY3JlYXRlZC4gUmV0dXJuIHRoZSBuZXcgdXNlciBvYmplY3QsIG9yIHRocm93IGFuIGBFcnJvcmAgdG8gYWJvcnQgdGhlIGNyZWF0aW9uLlxuICAgKi9cbiAgb25DcmVhdGVVc2VyKGZ1bmMpIHtcbiAgICBpZiAodGhpcy5fb25DcmVhdGVVc2VySG9vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgY2FsbCBvbkNyZWF0ZVVzZXIgb25jZVwiKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vbkNyZWF0ZVVzZXJIb29rID0gTWV0ZW9yLndyYXBGbihmdW5jKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDdXN0b21pemUgb2F1dGggdXNlciBwcm9maWxlIHVwZGF0ZXNcbiAgICogQGxvY3VzIFNlcnZlclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jIENhbGxlZCB3aGVuZXZlciBhIHVzZXIgaXMgbG9nZ2VkIGluIHZpYSBvYXV0aC4gUmV0dXJuIHRoZSBwcm9maWxlIG9iamVjdCB0byBiZSBtZXJnZWQsIG9yIHRocm93IGFuIGBFcnJvcmAgdG8gYWJvcnQgdGhlIGNyZWF0aW9uLlxuICAgKi9cbiAgb25FeHRlcm5hbExvZ2luKGZ1bmMpIHtcbiAgICBpZiAodGhpcy5fb25FeHRlcm5hbExvZ2luSG9vaykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgY2FsbCBvbkV4dGVybmFsTG9naW4gb25jZVwiKTtcbiAgICB9XG5cbiAgICB0aGlzLl9vbkV4dGVybmFsTG9naW5Ib29rID0gZnVuYztcbiAgfVxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDdXN0b21pemUgdXNlciBzZWxlY3Rpb24gb24gZXh0ZXJuYWwgbG9naW5zXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyBDYWxsZWQgd2hlbmV2ZXIgYSB1c2VyIGlzIGxvZ2dlZCBpbiB2aWEgb2F1dGggYW5kIGFcbiAgICogdXNlciBpcyBub3QgZm91bmQgd2l0aCB0aGUgc2VydmljZSBpZC4gUmV0dXJuIHRoZSB1c2VyIG9yIHVuZGVmaW5lZC5cbiAgICovXG4gIHNldEFkZGl0aW9uYWxGaW5kVXNlck9uRXh0ZXJuYWxMb2dpbihmdW5jKSB7XG4gICAgaWYgKHRoaXMuX2FkZGl0aW9uYWxGaW5kVXNlck9uRXh0ZXJuYWxMb2dpbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuIG9ubHkgY2FsbCBzZXRBZGRpdGlvbmFsRmluZFVzZXJPbkV4dGVybmFsTG9naW4gb25jZVwiKTtcbiAgICB9XG4gICAgdGhpcy5fYWRkaXRpb25hbEZpbmRVc2VyT25FeHRlcm5hbExvZ2luID0gZnVuYztcbiAgfVxuXG4gIF92YWxpZGF0ZUxvZ2luKGNvbm5lY3Rpb24sIGF0dGVtcHQpIHtcbiAgICB0aGlzLl92YWxpZGF0ZUxvZ2luSG9vay5mb3JFYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgIGxldCByZXQ7XG4gICAgICB0cnkge1xuICAgICAgICByZXQgPSBjYWxsYmFjayhjbG9uZUF0dGVtcHRXaXRoQ29ubmVjdGlvbihjb25uZWN0aW9uLCBhdHRlbXB0KSk7XG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICBhdHRlbXB0LmFsbG93ZWQgPSBmYWxzZTtcbiAgICAgICAgLy8gWFhYIHRoaXMgbWVhbnMgdGhlIGxhc3QgdGhyb3duIGVycm9yIG92ZXJyaWRlcyBwcmV2aW91cyBlcnJvclxuICAgICAgICAvLyBtZXNzYWdlcy4gTWF5YmUgdGhpcyBpcyBzdXJwcmlzaW5nIHRvIHVzZXJzIGFuZCB3ZSBzaG91bGQgbWFrZVxuICAgICAgICAvLyBvdmVycmlkaW5nIGVycm9ycyBtb3JlIGV4cGxpY2l0LiAoc2VlXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL2lzc3Vlcy8xOTYwKVxuICAgICAgICBhdHRlbXB0LmVycm9yID0gZTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoISByZXQpIHtcbiAgICAgICAgYXR0ZW1wdC5hbGxvd2VkID0gZmFsc2U7XG4gICAgICAgIC8vIGRvbid0IG92ZXJyaWRlIGEgc3BlY2lmaWMgZXJyb3IgcHJvdmlkZWQgYnkgYSBwcmV2aW91c1xuICAgICAgICAvLyB2YWxpZGF0b3Igb3IgdGhlIGluaXRpYWwgYXR0ZW1wdCAoZWcgXCJpbmNvcnJlY3QgcGFzc3dvcmRcIikuXG4gICAgICAgIGlmICghYXR0ZW1wdC5lcnJvcilcbiAgICAgICAgICBhdHRlbXB0LmVycm9yID0gbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiTG9naW4gZm9yYmlkZGVuXCIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgX3N1Y2Nlc3NmdWxMb2dpbihjb25uZWN0aW9uLCBhdHRlbXB0KSB7XG4gICAgdGhpcy5fb25Mb2dpbkhvb2suZWFjaChjYWxsYmFjayA9PiB7XG4gICAgICBjYWxsYmFjayhjbG9uZUF0dGVtcHRXaXRoQ29ubmVjdGlvbihjb25uZWN0aW9uLCBhdHRlbXB0KSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfTtcblxuICBfZmFpbGVkTG9naW4oY29ubmVjdGlvbiwgYXR0ZW1wdCkge1xuICAgIHRoaXMuX29uTG9naW5GYWlsdXJlSG9vay5lYWNoKGNhbGxiYWNrID0+IHtcbiAgICAgIGNhbGxiYWNrKGNsb25lQXR0ZW1wdFdpdGhDb25uZWN0aW9uKGNvbm5lY3Rpb24sIGF0dGVtcHQpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuICB9O1xuXG4gIF9zdWNjZXNzZnVsTG9nb3V0KGNvbm5lY3Rpb24sIHVzZXJJZCkge1xuICAgIC8vIGRvbid0IGZldGNoIHRoZSB1c2VyIG9iamVjdCB1bmxlc3MgdGhlcmUgYXJlIHNvbWUgY2FsbGJhY2tzIHJlZ2lzdGVyZWRcbiAgICBsZXQgdXNlcjtcbiAgICB0aGlzLl9vbkxvZ291dEhvb2suZWFjaChjYWxsYmFjayA9PiB7XG4gICAgICBpZiAoIXVzZXIgJiYgdXNlcklkKSB1c2VyID0gdGhpcy51c2Vycy5maW5kT25lKHVzZXJJZCwge2ZpZWxkczogdGhpcy5fb3B0aW9ucy5kZWZhdWx0RmllbGRTZWxlY3Rvcn0pO1xuICAgICAgY2FsbGJhY2soeyB1c2VyLCBjb25uZWN0aW9uIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gR2VuZXJhdGVzIGEgTW9uZ29EQiBzZWxlY3RvciB0aGF0IGNhbiBiZSB1c2VkIHRvIHBlcmZvcm0gYSBmYXN0IGNhc2VcbiAgLy8gaW5zZW5zaXRpdmUgbG9va3VwIGZvciB0aGUgZ2l2ZW4gZmllbGROYW1lIGFuZCBzdHJpbmcuIFNpbmNlIE1vbmdvREIgZG9lc1xuICAvLyBub3Qgc3VwcG9ydCBjYXNlIGluc2Vuc2l0aXZlIGluZGV4ZXMsIGFuZCBjYXNlIGluc2Vuc2l0aXZlIHJlZ2V4IHF1ZXJpZXNcbiAgLy8gYXJlIHNsb3csIHdlIGNvbnN0cnVjdCBhIHNldCBvZiBwcmVmaXggc2VsZWN0b3JzIGZvciBhbGwgcGVybXV0YXRpb25zIG9mXG4gIC8vIHRoZSBmaXJzdCA0IGNoYXJhY3RlcnMgb3Vyc2VsdmVzLiBXZSBmaXJzdCBhdHRlbXB0IHRvIG1hdGNoaW5nIGFnYWluc3RcbiAgLy8gdGhlc2UsIGFuZCBiZWNhdXNlICdwcmVmaXggZXhwcmVzc2lvbicgcmVnZXggcXVlcmllcyBkbyB1c2UgaW5kZXhlcyAoc2VlXG4gIC8vIGh0dHA6Ly9kb2NzLm1vbmdvZGIub3JnL3YyLjYvcmVmZXJlbmNlL29wZXJhdG9yL3F1ZXJ5L3JlZ2V4LyNpbmRleC11c2UpLFxuICAvLyB0aGlzIGhhcyBiZWVuIGZvdW5kIHRvIGdyZWF0bHkgaW1wcm92ZSBwZXJmb3JtYW5jZSAoZnJvbSAxMjAwbXMgdG8gNW1zIGluIGFcbiAgLy8gdGVzdCB3aXRoIDEuMDAwLjAwMCB1c2VycykuXG4gIF9zZWxlY3RvckZvckZhc3RDYXNlSW5zZW5zaXRpdmVMb29rdXAgPSAoZmllbGROYW1lLCBzdHJpbmcpID0+IHtcbiAgICAvLyBQZXJmb3JtYW5jZSBzZWVtcyB0byBpbXByb3ZlIHVwIHRvIDQgcHJlZml4IGNoYXJhY3RlcnNcbiAgICBjb25zdCBwcmVmaXggPSBzdHJpbmcuc3Vic3RyaW5nKDAsIE1hdGgubWluKHN0cmluZy5sZW5ndGgsIDQpKTtcbiAgICBjb25zdCBvckNsYXVzZSA9IGdlbmVyYXRlQ2FzZVBlcm11dGF0aW9uc0ZvclN0cmluZyhwcmVmaXgpLm1hcChcbiAgICAgICAgcHJlZml4UGVybXV0YXRpb24gPT4ge1xuICAgICAgICAgIGNvbnN0IHNlbGVjdG9yID0ge307XG4gICAgICAgICAgc2VsZWN0b3JbZmllbGROYW1lXSA9XG4gICAgICAgICAgICAgIG5ldyBSZWdFeHAoYF4ke01ldGVvci5fZXNjYXBlUmVnRXhwKHByZWZpeFBlcm11dGF0aW9uKX1gKTtcbiAgICAgICAgICByZXR1cm4gc2VsZWN0b3I7XG4gICAgICAgIH0pO1xuICAgIGNvbnN0IGNhc2VJbnNlbnNpdGl2ZUNsYXVzZSA9IHt9O1xuICAgIGNhc2VJbnNlbnNpdGl2ZUNsYXVzZVtmaWVsZE5hbWVdID1cbiAgICAgICAgbmV3IFJlZ0V4cChgXiR7TWV0ZW9yLl9lc2NhcGVSZWdFeHAoc3RyaW5nKX0kYCwgJ2knKVxuICAgIHJldHVybiB7JGFuZDogW3skb3I6IG9yQ2xhdXNlfSwgY2FzZUluc2Vuc2l0aXZlQ2xhdXNlXX07XG4gIH1cblxuICBfZmluZFVzZXJCeVF1ZXJ5ID0gKHF1ZXJ5LCBvcHRpb25zKSA9PiB7XG4gICAgbGV0IHVzZXIgPSBudWxsO1xuXG4gICAgaWYgKHF1ZXJ5LmlkKSB7XG4gICAgICAvLyBkZWZhdWx0IGZpZWxkIHNlbGVjdG9yIGlzIGFkZGVkIHdpdGhpbiBnZXRVc2VyQnlJZCgpXG4gICAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUocXVlcnkuaWQsIHRoaXMuX2FkZERlZmF1bHRGaWVsZFNlbGVjdG9yKG9wdGlvbnMpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucyA9IHRoaXMuX2FkZERlZmF1bHRGaWVsZFNlbGVjdG9yKG9wdGlvbnMpO1xuICAgICAgbGV0IGZpZWxkTmFtZTtcbiAgICAgIGxldCBmaWVsZFZhbHVlO1xuICAgICAgaWYgKHF1ZXJ5LnVzZXJuYW1lKSB7XG4gICAgICAgIGZpZWxkTmFtZSA9ICd1c2VybmFtZSc7XG4gICAgICAgIGZpZWxkVmFsdWUgPSBxdWVyeS51c2VybmFtZTtcbiAgICAgIH0gZWxzZSBpZiAocXVlcnkuZW1haWwpIHtcbiAgICAgICAgZmllbGROYW1lID0gJ2VtYWlscy5hZGRyZXNzJztcbiAgICAgICAgZmllbGRWYWx1ZSA9IHF1ZXJ5LmVtYWlsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwic2hvdWxkbid0IGhhcHBlbiAodmFsaWRhdGlvbiBtaXNzZWQgc29tZXRoaW5nKVwiKTtcbiAgICAgIH1cbiAgICAgIGxldCBzZWxlY3RvciA9IHt9O1xuICAgICAgc2VsZWN0b3JbZmllbGROYW1lXSA9IGZpZWxkVmFsdWU7XG4gICAgICB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoc2VsZWN0b3IsIG9wdGlvbnMpO1xuICAgICAgLy8gSWYgdXNlciBpcyBub3QgZm91bmQsIHRyeSBhIGNhc2UgaW5zZW5zaXRpdmUgbG9va3VwXG4gICAgICBpZiAoIXVzZXIpIHtcbiAgICAgICAgc2VsZWN0b3IgPSB0aGlzLl9zZWxlY3RvckZvckZhc3RDYXNlSW5zZW5zaXRpdmVMb29rdXAoZmllbGROYW1lLCBmaWVsZFZhbHVlKTtcbiAgICAgICAgY29uc3QgY2FuZGlkYXRlVXNlcnMgPSBNZXRlb3IudXNlcnMuZmluZChzZWxlY3RvciwgeyAuLi5vcHRpb25zLCBsaW1pdDogMiB9KS5mZXRjaCgpO1xuICAgICAgICAvLyBObyBtYXRjaCBpZiBtdWx0aXBsZSBjYW5kaWRhdGVzIGFyZSBmb3VuZFxuICAgICAgICBpZiAoY2FuZGlkYXRlVXNlcnMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgdXNlciA9IGNhbmRpZGF0ZVVzZXJzWzBdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHVzZXI7XG4gIH1cblxuICAvLy9cbiAgLy8vIExPR0lOIE1FVEhPRFNcbiAgLy8vXG5cbiAgLy8gTG9naW4gbWV0aG9kcyByZXR1cm4gdG8gdGhlIGNsaWVudCBhbiBvYmplY3QgY29udGFpbmluZyB0aGVzZVxuICAvLyBmaWVsZHMgd2hlbiB0aGUgdXNlciB3YXMgbG9nZ2VkIGluIHN1Y2Nlc3NmdWxseTpcbiAgLy9cbiAgLy8gICBpZDogdXNlcklkXG4gIC8vICAgdG9rZW46ICpcbiAgLy8gICB0b2tlbkV4cGlyZXM6ICpcbiAgLy9cbiAgLy8gdG9rZW5FeHBpcmVzIGlzIG9wdGlvbmFsIGFuZCBpbnRlbmRzIHRvIHByb3ZpZGUgYSBoaW50IHRvIHRoZVxuICAvLyBjbGllbnQgYXMgdG8gd2hlbiB0aGUgdG9rZW4gd2lsbCBleHBpcmUuIElmIG5vdCBwcm92aWRlZCwgdGhlXG4gIC8vIGNsaWVudCB3aWxsIGNhbGwgQWNjb3VudHMuX3Rva2VuRXhwaXJhdGlvbiwgcGFzc2luZyBpdCB0aGUgZGF0ZVxuICAvLyB0aGF0IGl0IHJlY2VpdmVkIHRoZSB0b2tlbi5cbiAgLy9cbiAgLy8gVGhlIGxvZ2luIG1ldGhvZCB3aWxsIHRocm93IGFuIGVycm9yIGJhY2sgdG8gdGhlIGNsaWVudCBpZiB0aGUgdXNlclxuICAvLyBmYWlsZWQgdG8gbG9nIGluLlxuICAvL1xuICAvL1xuICAvLyBMb2dpbiBoYW5kbGVycyBhbmQgc2VydmljZSBzcGVjaWZpYyBsb2dpbiBtZXRob2RzIHN1Y2ggYXNcbiAgLy8gYGNyZWF0ZVVzZXJgIGludGVybmFsbHkgcmV0dXJuIGEgYHJlc3VsdGAgb2JqZWN0IGNvbnRhaW5pbmcgdGhlc2VcbiAgLy8gZmllbGRzOlxuICAvL1xuICAvLyAgIHR5cGU6XG4gIC8vICAgICBvcHRpb25hbCBzdHJpbmc7IHRoZSBzZXJ2aWNlIG5hbWUsIG92ZXJyaWRlcyB0aGUgaGFuZGxlclxuICAvLyAgICAgZGVmYXVsdCBpZiBwcmVzZW50LlxuICAvL1xuICAvLyAgIGVycm9yOlxuICAvLyAgICAgZXhjZXB0aW9uOyBpZiB0aGUgdXNlciBpcyBub3QgYWxsb3dlZCB0byBsb2dpbiwgdGhlIHJlYXNvbiB3aHkuXG4gIC8vXG4gIC8vICAgdXNlcklkOlxuICAvLyAgICAgc3RyaW5nOyB0aGUgdXNlciBpZCBvZiB0aGUgdXNlciBhdHRlbXB0aW5nIHRvIGxvZ2luIChpZlxuICAvLyAgICAga25vd24pLCByZXF1aXJlZCBmb3IgYW4gYWxsb3dlZCBsb2dpbi5cbiAgLy9cbiAgLy8gICBvcHRpb25zOlxuICAvLyAgICAgb3B0aW9uYWwgb2JqZWN0IG1lcmdlZCBpbnRvIHRoZSByZXN1bHQgcmV0dXJuZWQgYnkgdGhlIGxvZ2luXG4gIC8vICAgICBtZXRob2Q7IHVzZWQgYnkgSEFNSyBmcm9tIFNSUC5cbiAgLy9cbiAgLy8gICBzdGFtcGVkTG9naW5Ub2tlbjpcbiAgLy8gICAgIG9wdGlvbmFsIG9iamVjdCB3aXRoIGB0b2tlbmAgYW5kIGB3aGVuYCBpbmRpY2F0aW5nIHRoZSBsb2dpblxuICAvLyAgICAgdG9rZW4gaXMgYWxyZWFkeSBwcmVzZW50IGluIHRoZSBkYXRhYmFzZSwgcmV0dXJuZWQgYnkgdGhlXG4gIC8vICAgICBcInJlc3VtZVwiIGxvZ2luIGhhbmRsZXIuXG4gIC8vXG4gIC8vIEZvciBjb252ZW5pZW5jZSwgbG9naW4gbWV0aG9kcyBjYW4gYWxzbyB0aHJvdyBhbiBleGNlcHRpb24sIHdoaWNoXG4gIC8vIGlzIGNvbnZlcnRlZCBpbnRvIGFuIHtlcnJvcn0gcmVzdWx0LiAgSG93ZXZlciwgaWYgdGhlIGlkIG9mIHRoZVxuICAvLyB1c2VyIGF0dGVtcHRpbmcgdGhlIGxvZ2luIGlzIGtub3duLCBhIHt1c2VySWQsIGVycm9yfSByZXN1bHQgc2hvdWxkXG4gIC8vIGJlIHJldHVybmVkIGluc3RlYWQgc2luY2UgdGhlIHVzZXIgaWQgaXMgbm90IGNhcHR1cmVkIHdoZW4gYW5cbiAgLy8gZXhjZXB0aW9uIGlzIHRocm93bi5cbiAgLy9cbiAgLy8gVGhpcyBpbnRlcm5hbCBgcmVzdWx0YCBvYmplY3QgaXMgYXV0b21hdGljYWxseSBjb252ZXJ0ZWQgaW50byB0aGVcbiAgLy8gcHVibGljIHtpZCwgdG9rZW4sIHRva2VuRXhwaXJlc30gb2JqZWN0IHJldHVybmVkIHRvIHRoZSBjbGllbnQuXG5cbiAgLy8gVHJ5IGEgbG9naW4gbWV0aG9kLCBjb252ZXJ0aW5nIHRocm93biBleGNlcHRpb25zIGludG8gYW4ge2Vycm9yfVxuICAvLyByZXN1bHQuICBUaGUgYHR5cGVgIGFyZ3VtZW50IGlzIGEgZGVmYXVsdCwgaW5zZXJ0ZWQgaW50byB0aGUgcmVzdWx0XG4gIC8vIG9iamVjdCBpZiBub3QgZXhwbGljaXRseSByZXR1cm5lZC5cbiAgLy9cbiAgLy8gTG9nIGluIGEgdXNlciBvbiBhIGNvbm5lY3Rpb24uXG4gIC8vXG4gIC8vIFdlIHVzZSB0aGUgbWV0aG9kIGludm9jYXRpb24gdG8gc2V0IHRoZSB1c2VyIGlkIG9uIHRoZSBjb25uZWN0aW9uLFxuICAvLyBub3QgdGhlIGNvbm5lY3Rpb24gb2JqZWN0IGRpcmVjdGx5LiBzZXRVc2VySWQgaXMgdGllZCB0byBtZXRob2RzIHRvXG4gIC8vIGVuZm9yY2UgY2xlYXIgb3JkZXJpbmcgb2YgbWV0aG9kIGFwcGxpY2F0aW9uICh1c2luZyB3YWl0IG1ldGhvZHMgb25cbiAgLy8gdGhlIGNsaWVudCwgYW5kIGEgbm8gc2V0VXNlcklkIGFmdGVyIHVuYmxvY2sgcmVzdHJpY3Rpb24gb24gdGhlXG4gIC8vIHNlcnZlcilcbiAgLy9cbiAgLy8gVGhlIGBzdGFtcGVkTG9naW5Ub2tlbmAgcGFyYW1ldGVyIGlzIG9wdGlvbmFsLiAgV2hlbiBwcmVzZW50LCBpdFxuICAvLyBpbmRpY2F0ZXMgdGhhdCB0aGUgbG9naW4gdG9rZW4gaGFzIGFscmVhZHkgYmVlbiBpbnNlcnRlZCBpbnRvIHRoZVxuICAvLyBkYXRhYmFzZSBhbmQgZG9lc24ndCBuZWVkIHRvIGJlIGluc2VydGVkIGFnYWluLiAgKEl0J3MgdXNlZCBieSB0aGVcbiAgLy8gXCJyZXN1bWVcIiBsb2dpbiBoYW5kbGVyKS5cbiAgX2xvZ2luVXNlcihtZXRob2RJbnZvY2F0aW9uLCB1c2VySWQsIHN0YW1wZWRMb2dpblRva2VuKSB7XG4gICAgaWYgKCEgc3RhbXBlZExvZ2luVG9rZW4pIHtcbiAgICAgIHN0YW1wZWRMb2dpblRva2VuID0gdGhpcy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICAgICAgdGhpcy5faW5zZXJ0TG9naW5Ub2tlbih1c2VySWQsIHN0YW1wZWRMb2dpblRva2VuKTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG9yZGVyIChhbmQgdGhlIGF2b2lkYW5jZSBvZiB5aWVsZHMpIGlzIGltcG9ydGFudCB0byBtYWtlXG4gICAgLy8gc3VyZSB0aGF0IHdoZW4gcHVibGlzaCBmdW5jdGlvbnMgYXJlIHJlcnVuLCB0aGV5IHNlZSBhXG4gICAgLy8gY29uc2lzdGVudCB2aWV3IG9mIHRoZSB3b3JsZDogdGhlIHVzZXJJZCBpcyBzZXQgYW5kIG1hdGNoZXNcbiAgICAvLyB0aGUgbG9naW4gdG9rZW4gb24gdGhlIGNvbm5lY3Rpb24gKG5vdCB0aGF0IHRoZXJlIGlzXG4gICAgLy8gY3VycmVudGx5IGEgcHVibGljIEFQSSBmb3IgcmVhZGluZyB0aGUgbG9naW4gdG9rZW4gb24gYVxuICAgIC8vIGNvbm5lY3Rpb24pLlxuICAgIE1ldGVvci5fbm9ZaWVsZHNBbGxvd2VkKCgpID0+XG4gICAgICB0aGlzLl9zZXRMb2dpblRva2VuKFxuICAgICAgICB1c2VySWQsXG4gICAgICAgIG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbixcbiAgICAgICAgdGhpcy5faGFzaExvZ2luVG9rZW4oc3RhbXBlZExvZ2luVG9rZW4udG9rZW4pXG4gICAgICApXG4gICAgKTtcblxuICAgIG1ldGhvZEludm9jYXRpb24uc2V0VXNlcklkKHVzZXJJZCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaWQ6IHVzZXJJZCxcbiAgICAgIHRva2VuOiBzdGFtcGVkTG9naW5Ub2tlbi50b2tlbixcbiAgICAgIHRva2VuRXhwaXJlczogdGhpcy5fdG9rZW5FeHBpcmF0aW9uKHN0YW1wZWRMb2dpblRva2VuLndoZW4pXG4gICAgfTtcbiAgfTtcblxuICAvLyBBZnRlciBhIGxvZ2luIG1ldGhvZCBoYXMgY29tcGxldGVkLCBjYWxsIHRoZSBsb2dpbiBob29rcy4gIE5vdGVcbiAgLy8gdGhhdCBgYXR0ZW1wdExvZ2luYCBpcyBjYWxsZWQgZm9yICphbGwqIGxvZ2luIGF0dGVtcHRzLCBldmVuIG9uZXNcbiAgLy8gd2hpY2ggYXJlbid0IHN1Y2Nlc3NmdWwgKHN1Y2ggYXMgYW4gaW52YWxpZCBwYXNzd29yZCwgZXRjKS5cbiAgLy9cbiAgLy8gSWYgdGhlIGxvZ2luIGlzIGFsbG93ZWQgYW5kIGlzbid0IGFib3J0ZWQgYnkgYSB2YWxpZGF0ZSBsb2dpbiBob29rXG4gIC8vIGNhbGxiYWNrLCBsb2cgaW4gdGhlIHVzZXIuXG4gIC8vXG4gIGFzeW5jIF9hdHRlbXB0TG9naW4oXG4gICAgbWV0aG9kSW52b2NhdGlvbixcbiAgICBtZXRob2ROYW1lLFxuICAgIG1ldGhvZEFyZ3MsXG4gICAgcmVzdWx0XG4gICkge1xuICAgIGlmICghcmVzdWx0KVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwicmVzdWx0IGlzIHJlcXVpcmVkXCIpO1xuXG4gICAgLy8gWFhYIEEgcHJvZ3JhbW1pbmcgZXJyb3IgaW4gYSBsb2dpbiBoYW5kbGVyIGNhbiBsZWFkIHRvIHRoaXMgb2NjdXJyaW5nLCBhbmRcbiAgICAvLyB0aGVuIHdlIGRvbid0IGNhbGwgb25Mb2dpbiBvciBvbkxvZ2luRmFpbHVyZSBjYWxsYmFja3MuIFNob3VsZFxuICAgIC8vIHRyeUxvZ2luTWV0aG9kIGNhdGNoIHRoaXMgY2FzZSBhbmQgdHVybiBpdCBpbnRvIGFuIGVycm9yP1xuICAgIGlmICghcmVzdWx0LnVzZXJJZCAmJiAhcmVzdWx0LmVycm9yKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQSBsb2dpbiBtZXRob2QgbXVzdCBzcGVjaWZ5IGEgdXNlcklkIG9yIGFuIGVycm9yXCIpO1xuXG4gICAgbGV0IHVzZXI7XG4gICAgaWYgKHJlc3VsdC51c2VySWQpXG4gICAgICB1c2VyID0gdGhpcy51c2Vycy5maW5kT25lKHJlc3VsdC51c2VySWQsIHtmaWVsZHM6IHRoaXMuX29wdGlvbnMuZGVmYXVsdEZpZWxkU2VsZWN0b3J9KTtcblxuICAgIGNvbnN0IGF0dGVtcHQgPSB7XG4gICAgICB0eXBlOiByZXN1bHQudHlwZSB8fCBcInVua25vd25cIixcbiAgICAgIGFsbG93ZWQ6ICEhIChyZXN1bHQudXNlcklkICYmICFyZXN1bHQuZXJyb3IpLFxuICAgICAgbWV0aG9kTmFtZTogbWV0aG9kTmFtZSxcbiAgICAgIG1ldGhvZEFyZ3VtZW50czogQXJyYXkuZnJvbShtZXRob2RBcmdzKVxuICAgIH07XG4gICAgaWYgKHJlc3VsdC5lcnJvcikge1xuICAgICAgYXR0ZW1wdC5lcnJvciA9IHJlc3VsdC5lcnJvcjtcbiAgICB9XG4gICAgaWYgKHVzZXIpIHtcbiAgICAgIGF0dGVtcHQudXNlciA9IHVzZXI7XG4gICAgfVxuXG4gICAgLy8gX3ZhbGlkYXRlTG9naW4gbWF5IG11dGF0ZSBgYXR0ZW1wdGAgYnkgYWRkaW5nIGFuIGVycm9yIGFuZCBjaGFuZ2luZyBhbGxvd2VkXG4gICAgLy8gdG8gZmFsc2UsIGJ1dCB0aGF0J3MgdGhlIG9ubHkgY2hhbmdlIGl0IGNhbiBtYWtlIChhbmQgdGhlIHVzZXIncyBjYWxsYmFja3NcbiAgICAvLyBvbmx5IGdldCBhIGNsb25lIG9mIGBhdHRlbXB0YCkuXG4gICAgdGhpcy5fdmFsaWRhdGVMb2dpbihtZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb24sIGF0dGVtcHQpO1xuXG4gICAgaWYgKGF0dGVtcHQuYWxsb3dlZCkge1xuICAgICAgY29uc3QgcmV0ID0ge1xuICAgICAgICAuLi50aGlzLl9sb2dpblVzZXIoXG4gICAgICAgICAgbWV0aG9kSW52b2NhdGlvbixcbiAgICAgICAgICByZXN1bHQudXNlcklkLFxuICAgICAgICAgIHJlc3VsdC5zdGFtcGVkTG9naW5Ub2tlblxuICAgICAgICApLFxuICAgICAgICAuLi5yZXN1bHQub3B0aW9uc1xuICAgICAgfTtcbiAgICAgIHJldC50eXBlID0gYXR0ZW1wdC50eXBlO1xuICAgICAgdGhpcy5fc3VjY2Vzc2Z1bExvZ2luKG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbiwgYXR0ZW1wdCk7XG4gICAgICByZXR1cm4gcmV0O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuX2ZhaWxlZExvZ2luKG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbiwgYXR0ZW1wdCk7XG4gICAgICB0aHJvdyBhdHRlbXB0LmVycm9yO1xuICAgIH1cbiAgfTtcblxuICAvLyBBbGwgc2VydmljZSBzcGVjaWZpYyBsb2dpbiBtZXRob2RzIHNob3VsZCBnbyB0aHJvdWdoIHRoaXMgZnVuY3Rpb24uXG4gIC8vIEVuc3VyZSB0aGF0IHRocm93biBleGNlcHRpb25zIGFyZSBjYXVnaHQgYW5kIHRoYXQgbG9naW4gaG9va1xuICAvLyBjYWxsYmFja3MgYXJlIHN0aWxsIGNhbGxlZC5cbiAgLy9cbiAgYXN5bmMgX2xvZ2luTWV0aG9kKFxuICAgIG1ldGhvZEludm9jYXRpb24sXG4gICAgbWV0aG9kTmFtZSxcbiAgICBtZXRob2RBcmdzLFxuICAgIHR5cGUsXG4gICAgZm5cbiAgKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuX2F0dGVtcHRMb2dpbihcbiAgICAgIG1ldGhvZEludm9jYXRpb24sXG4gICAgICBtZXRob2ROYW1lLFxuICAgICAgbWV0aG9kQXJncyxcbiAgICAgIGF3YWl0IHRyeUxvZ2luTWV0aG9kKHR5cGUsIGZuKVxuICAgICk7XG4gIH07XG5cblxuICAvLyBSZXBvcnQgYSBsb2dpbiBhdHRlbXB0IGZhaWxlZCBvdXRzaWRlIHRoZSBjb250ZXh0IG9mIGEgbm9ybWFsIGxvZ2luXG4gIC8vIG1ldGhvZC4gVGhpcyBpcyBmb3IgdXNlIGluIHRoZSBjYXNlIHdoZXJlIHRoZXJlIGlzIGEgbXVsdGktc3RlcCBsb2dpblxuICAvLyBwcm9jZWR1cmUgKGVnIFNSUCBiYXNlZCBwYXNzd29yZCBsb2dpbikuIElmIGEgbWV0aG9kIGVhcmx5IGluIHRoZVxuICAvLyBjaGFpbiBmYWlscywgaXQgc2hvdWxkIGNhbGwgdGhpcyBmdW5jdGlvbiB0byByZXBvcnQgYSBmYWlsdXJlLiBUaGVyZVxuICAvLyBpcyBubyBjb3JyZXNwb25kaW5nIG1ldGhvZCBmb3IgYSBzdWNjZXNzZnVsIGxvZ2luOyBtZXRob2RzIHRoYXQgY2FuXG4gIC8vIHN1Y2NlZWQgYXQgbG9nZ2luZyBhIHVzZXIgaW4gc2hvdWxkIGFsd2F5cyBiZSBhY3R1YWwgbG9naW4gbWV0aG9kc1xuICAvLyAodXNpbmcgZWl0aGVyIEFjY291bnRzLl9sb2dpbk1ldGhvZCBvciBBY2NvdW50cy5yZWdpc3RlckxvZ2luSGFuZGxlcikuXG4gIF9yZXBvcnRMb2dpbkZhaWx1cmUoXG4gICAgbWV0aG9kSW52b2NhdGlvbixcbiAgICBtZXRob2ROYW1lLFxuICAgIG1ldGhvZEFyZ3MsXG4gICAgcmVzdWx0XG4gICkge1xuICAgIGNvbnN0IGF0dGVtcHQgPSB7XG4gICAgICB0eXBlOiByZXN1bHQudHlwZSB8fCBcInVua25vd25cIixcbiAgICAgIGFsbG93ZWQ6IGZhbHNlLFxuICAgICAgZXJyb3I6IHJlc3VsdC5lcnJvcixcbiAgICAgIG1ldGhvZE5hbWU6IG1ldGhvZE5hbWUsXG4gICAgICBtZXRob2RBcmd1bWVudHM6IEFycmF5LmZyb20obWV0aG9kQXJncylcbiAgICB9O1xuXG4gICAgaWYgKHJlc3VsdC51c2VySWQpIHtcbiAgICAgIGF0dGVtcHQudXNlciA9IHRoaXMudXNlcnMuZmluZE9uZShyZXN1bHQudXNlcklkLCB7ZmllbGRzOiB0aGlzLl9vcHRpb25zLmRlZmF1bHRGaWVsZFNlbGVjdG9yfSk7XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsaWRhdGVMb2dpbihtZXRob2RJbnZvY2F0aW9uLmNvbm5lY3Rpb24sIGF0dGVtcHQpO1xuICAgIHRoaXMuX2ZhaWxlZExvZ2luKG1ldGhvZEludm9jYXRpb24uY29ubmVjdGlvbiwgYXR0ZW1wdCk7XG5cbiAgICAvLyBfdmFsaWRhdGVMb2dpbiBtYXkgbXV0YXRlIGF0dGVtcHQgdG8gc2V0IGEgbmV3IGVycm9yIG1lc3NhZ2UuIFJldHVyblxuICAgIC8vIHRoZSBtb2RpZmllZCB2ZXJzaW9uLlxuICAgIHJldHVybiBhdHRlbXB0O1xuICB9O1xuXG4gIC8vL1xuICAvLy8gTE9HSU4gSEFORExFUlNcbiAgLy8vXG5cbiAgLyoqXG4gICAqIEBzdW1tYXJ5IFJlZ2lzdGVycyBhIG5ldyBsb2dpbiBoYW5kbGVyLlxuICAgKiBAbG9jdXMgU2VydmVyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbbmFtZV0gVGhlIHR5cGUgb2YgbG9naW4gbWV0aG9kIGxpa2Ugb2F1dGgsIHBhc3N3b3JkLCBldGMuXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGhhbmRsZXIgQSBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGFuIG9wdGlvbnMgb2JqZWN0XG4gICAqIChhcyBwYXNzZWQgYXMgYW4gYXJndW1lbnQgdG8gdGhlIGBsb2dpbmAgbWV0aG9kKSBhbmQgcmV0dXJucyBvbmUgb2ZcbiAgICogYHVuZGVmaW5lZGAsIG1lYW5pbmcgZG9uJ3QgaGFuZGxlIG9yIGEgbG9naW4gbWV0aG9kIHJlc3VsdCBvYmplY3QuXG4gICAqL1xuICByZWdpc3RlckxvZ2luSGFuZGxlcihuYW1lLCBoYW5kbGVyKSB7XG4gICAgaWYgKCEgaGFuZGxlcikge1xuICAgICAgaGFuZGxlciA9IG5hbWU7XG4gICAgICBuYW1lID0gbnVsbDtcbiAgICB9XG5cbiAgICB0aGlzLl9sb2dpbkhhbmRsZXJzLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIGhhbmRsZXI6IE1ldGVvci53cmFwRm4oaGFuZGxlcilcbiAgICB9KTtcbiAgfTtcblxuXG4gIC8vIENoZWNrcyBhIHVzZXIncyBjcmVkZW50aWFscyBhZ2FpbnN0IGFsbCB0aGUgcmVnaXN0ZXJlZCBsb2dpblxuICAvLyBoYW5kbGVycywgYW5kIHJldHVybnMgYSBsb2dpbiB0b2tlbiBpZiB0aGUgY3JlZGVudGlhbHMgYXJlIHZhbGlkLiBJdFxuICAvLyBpcyBsaWtlIHRoZSBsb2dpbiBtZXRob2QsIGV4Y2VwdCB0aGF0IGl0IGRvZXNuJ3Qgc2V0IHRoZSBsb2dnZWQtaW5cbiAgLy8gdXNlciBvbiB0aGUgY29ubmVjdGlvbi4gVGhyb3dzIGEgTWV0ZW9yLkVycm9yIGlmIGxvZ2dpbmcgaW4gZmFpbHMsXG4gIC8vIGluY2x1ZGluZyB0aGUgY2FzZSB3aGVyZSBub25lIG9mIHRoZSBsb2dpbiBoYW5kbGVycyBoYW5kbGVkIHRoZSBsb2dpblxuICAvLyByZXF1ZXN0LiBPdGhlcndpc2UsIHJldHVybnMge2lkOiB1c2VySWQsIHRva2VuOiAqLCB0b2tlbkV4cGlyZXM6ICp9LlxuICAvL1xuICAvLyBGb3IgZXhhbXBsZSwgaWYgeW91IHdhbnQgdG8gbG9naW4gd2l0aCBhIHBsYWludGV4dCBwYXNzd29yZCwgYG9wdGlvbnNgIGNvdWxkIGJlXG4gIC8vICAgeyB1c2VyOiB7IHVzZXJuYW1lOiA8dXNlcm5hbWU+IH0sIHBhc3N3b3JkOiA8cGFzc3dvcmQ+IH0sIG9yXG4gIC8vICAgeyB1c2VyOiB7IGVtYWlsOiA8ZW1haWw+IH0sIHBhc3N3b3JkOiA8cGFzc3dvcmQ+IH0uXG5cbiAgLy8gVHJ5IGFsbCBvZiB0aGUgcmVnaXN0ZXJlZCBsb2dpbiBoYW5kbGVycyB1bnRpbCBvbmUgb2YgdGhlbSBkb2Vzbid0XG4gIC8vIHJldHVybiBgdW5kZWZpbmVkYCwgbWVhbmluZyBpdCBoYW5kbGVkIHRoaXMgY2FsbCB0byBgbG9naW5gLiBSZXR1cm5cbiAgLy8gdGhhdCByZXR1cm4gdmFsdWUuXG4gIGFzeW5jIF9ydW5Mb2dpbkhhbmRsZXJzKG1ldGhvZEludm9jYXRpb24sIG9wdGlvbnMpIHtcbiAgICBmb3IgKGxldCBoYW5kbGVyIG9mIHRoaXMuX2xvZ2luSGFuZGxlcnMpIHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRyeUxvZ2luTWV0aG9kKGhhbmRsZXIubmFtZSwgYXN5bmMgKCkgPT5cbiAgICAgICAgYXdhaXQgaGFuZGxlci5oYW5kbGVyLmNhbGwobWV0aG9kSW52b2NhdGlvbiwgb3B0aW9ucylcbiAgICAgICk7XG5cbiAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICAgICAgNDAwLFxuICAgICAgICAgICdBIGxvZ2luIGhhbmRsZXIgc2hvdWxkIHJldHVybiBhIHJlc3VsdCBvciB1bmRlZmluZWQnXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IG51bGwsXG4gICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDAsIFwiVW5yZWNvZ25pemVkIG9wdGlvbnMgZm9yIGxvZ2luIHJlcXVlc3RcIilcbiAgICB9O1xuICB9O1xuXG4gIC8vIERlbGV0ZXMgdGhlIGdpdmVuIGxvZ2luVG9rZW4gZnJvbSB0aGUgZGF0YWJhc2UuXG4gIC8vXG4gIC8vIEZvciBuZXctc3R5bGUgaGFzaGVkIHRva2VuLCB0aGlzIHdpbGwgY2F1c2UgYWxsIGNvbm5lY3Rpb25zXG4gIC8vIGFzc29jaWF0ZWQgd2l0aCB0aGUgdG9rZW4gdG8gYmUgY2xvc2VkLlxuICAvL1xuICAvLyBBbnkgY29ubmVjdGlvbnMgYXNzb2NpYXRlZCB3aXRoIG9sZC1zdHlsZSB1bmhhc2hlZCB0b2tlbnMgd2lsbCBiZVxuICAvLyBpbiB0aGUgcHJvY2VzcyBvZiBiZWNvbWluZyBhc3NvY2lhdGVkIHdpdGggaGFzaGVkIHRva2VucyBhbmQgdGhlblxuICAvLyB0aGV5J2xsIGdldCBjbG9zZWQuXG4gIGRlc3Ryb3lUb2tlbih1c2VySWQsIGxvZ2luVG9rZW4pIHtcbiAgICB0aGlzLnVzZXJzLnVwZGF0ZSh1c2VySWQsIHtcbiAgICAgICRwdWxsOiB7XG4gICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHtcbiAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgIHsgaGFzaGVkVG9rZW46IGxvZ2luVG9rZW4gfSxcbiAgICAgICAgICAgIHsgdG9rZW46IGxvZ2luVG9rZW4gfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG4gIF9pbml0U2VydmVyTWV0aG9kcygpIHtcbiAgICAvLyBUaGUgbWV0aG9kcyBjcmVhdGVkIGluIHRoaXMgZnVuY3Rpb24gbmVlZCB0byBiZSBjcmVhdGVkIGhlcmUgc28gdGhhdFxuICAgIC8vIHRoaXMgdmFyaWFibGUgaXMgYXZhaWxhYmxlIGluIHRoZWlyIHNjb3BlLlxuICAgIGNvbnN0IGFjY291bnRzID0gdGhpcztcblxuXG4gICAgLy8gVGhpcyBvYmplY3Qgd2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCBtZXRob2RzIGFuZCB0aGVuIHBhc3NlZCB0b1xuICAgIC8vIGFjY291bnRzLl9zZXJ2ZXIubWV0aG9kcyBmdXJ0aGVyIGJlbG93LlxuICAgIGNvbnN0IG1ldGhvZHMgPSB7fTtcblxuICAgIC8vIEByZXR1cm5zIHtPYmplY3R8bnVsbH1cbiAgICAvLyAgIElmIHN1Y2Nlc3NmdWwsIHJldHVybnMge3Rva2VuOiByZWNvbm5lY3RUb2tlbiwgaWQ6IHVzZXJJZH1cbiAgICAvLyAgIElmIHVuc3VjY2Vzc2Z1bCAoZm9yIGV4YW1wbGUsIGlmIHRoZSB1c2VyIGNsb3NlZCB0aGUgb2F1dGggbG9naW4gcG9wdXApLFxuICAgIC8vICAgICB0aHJvd3MgYW4gZXJyb3IgZGVzY3JpYmluZyB0aGUgcmVhc29uXG4gICAgbWV0aG9kcy5sb2dpbiA9IGFzeW5jIGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAvLyBMb2dpbiBoYW5kbGVycyBzaG91bGQgcmVhbGx5IGFsc28gY2hlY2sgd2hhdGV2ZXIgZmllbGQgdGhleSBsb29rIGF0IGluXG4gICAgICAvLyBvcHRpb25zLCBidXQgd2UgZG9uJ3QgZW5mb3JjZSBpdC5cbiAgICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGFjY291bnRzLl9ydW5Mb2dpbkhhbmRsZXJzKHRoaXMsIG9wdGlvbnMpO1xuICAgICAgLy9jb25zb2xlLmxvZyh7cmVzdWx0fSk7XG5cbiAgICAgIHJldHVybiBhd2FpdCBhY2NvdW50cy5fYXR0ZW1wdExvZ2luKHRoaXMsIFwibG9naW5cIiwgYXJndW1lbnRzLCByZXN1bHQpO1xuICAgIH07XG5cbiAgICBtZXRob2RzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgIGNvbnN0IHRva2VuID0gYWNjb3VudHMuX2dldExvZ2luVG9rZW4odGhpcy5jb25uZWN0aW9uLmlkKTtcbiAgICAgIGFjY291bnRzLl9zZXRMb2dpblRva2VuKHRoaXMudXNlcklkLCB0aGlzLmNvbm5lY3Rpb24sIG51bGwpO1xuICAgICAgaWYgKHRva2VuICYmIHRoaXMudXNlcklkKSB7XG4gICAgICAgIGFjY291bnRzLmRlc3Ryb3lUb2tlbih0aGlzLnVzZXJJZCwgdG9rZW4pO1xuICAgICAgfVxuICAgICAgYWNjb3VudHMuX3N1Y2Nlc3NmdWxMb2dvdXQodGhpcy5jb25uZWN0aW9uLCB0aGlzLnVzZXJJZCk7XG4gICAgICB0aGlzLnNldFVzZXJJZChudWxsKTtcbiAgICB9O1xuXG4gICAgLy8gR2VuZXJhdGVzIGEgbmV3IGxvZ2luIHRva2VuIHdpdGggdGhlIHNhbWUgZXhwaXJhdGlvbiBhcyB0aGVcbiAgICAvLyBjb25uZWN0aW9uJ3MgY3VycmVudCB0b2tlbiBhbmQgc2F2ZXMgaXQgdG8gdGhlIGRhdGFiYXNlLiBBc3NvY2lhdGVzXG4gICAgLy8gdGhlIGNvbm5lY3Rpb24gd2l0aCB0aGlzIG5ldyB0b2tlbiBhbmQgcmV0dXJucyBpdC4gVGhyb3dzIGFuIGVycm9yXG4gICAgLy8gaWYgY2FsbGVkIG9uIGEgY29ubmVjdGlvbiB0aGF0IGlzbid0IGxvZ2dlZCBpbi5cbiAgICAvL1xuICAgIC8vIEByZXR1cm5zIE9iamVjdFxuICAgIC8vICAgSWYgc3VjY2Vzc2Z1bCwgcmV0dXJucyB7IHRva2VuOiA8bmV3IHRva2VuPiwgaWQ6IDx1c2VyIGlkPixcbiAgICAvLyAgIHRva2VuRXhwaXJlczogPGV4cGlyYXRpb24gZGF0ZT4gfS5cbiAgICBtZXRob2RzLmdldE5ld1Rva2VuID0gZnVuY3Rpb24gKCkge1xuICAgICAgY29uc3QgdXNlciA9IGFjY291bnRzLnVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQsIHtcbiAgICAgICAgZmllbGRzOiB7IFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IDEgfVxuICAgICAgfSk7XG4gICAgICBpZiAoISB0aGlzLnVzZXJJZCB8fCAhIHVzZXIpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIllvdSBhcmUgbm90IGxvZ2dlZCBpbi5cIik7XG4gICAgICB9XG4gICAgICAvLyBCZSBjYXJlZnVsIG5vdCB0byBnZW5lcmF0ZSBhIG5ldyB0b2tlbiB0aGF0IGhhcyBhIGxhdGVyXG4gICAgICAvLyBleHBpcmF0aW9uIHRoYW4gdGhlIGN1cnJlbiB0b2tlbi4gT3RoZXJ3aXNlLCBhIGJhZCBndXkgd2l0aCBhXG4gICAgICAvLyBzdG9sZW4gdG9rZW4gY291bGQgdXNlIHRoaXMgbWV0aG9kIHRvIHN0b3AgaGlzIHN0b2xlbiB0b2tlbiBmcm9tXG4gICAgICAvLyBldmVyIGV4cGlyaW5nLlxuICAgICAgY29uc3QgY3VycmVudEhhc2hlZFRva2VuID0gYWNjb3VudHMuX2dldExvZ2luVG9rZW4odGhpcy5jb25uZWN0aW9uLmlkKTtcbiAgICAgIGNvbnN0IGN1cnJlbnRTdGFtcGVkVG9rZW4gPSB1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5maW5kKFxuICAgICAgICBzdGFtcGVkVG9rZW4gPT4gc3RhbXBlZFRva2VuLmhhc2hlZFRva2VuID09PSBjdXJyZW50SGFzaGVkVG9rZW5cbiAgICAgICk7XG4gICAgICBpZiAoISBjdXJyZW50U3RhbXBlZFRva2VuKSB7IC8vIHNhZmV0eSBiZWx0OiB0aGlzIHNob3VsZCBuZXZlciBoYXBwZW5cbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIkludmFsaWQgbG9naW4gdG9rZW5cIik7XG4gICAgICB9XG4gICAgICBjb25zdCBuZXdTdGFtcGVkVG9rZW4gPSBhY2NvdW50cy5fZ2VuZXJhdGVTdGFtcGVkTG9naW5Ub2tlbigpO1xuICAgICAgbmV3U3RhbXBlZFRva2VuLndoZW4gPSBjdXJyZW50U3RhbXBlZFRva2VuLndoZW47XG4gICAgICBhY2NvdW50cy5faW5zZXJ0TG9naW5Ub2tlbih0aGlzLnVzZXJJZCwgbmV3U3RhbXBlZFRva2VuKTtcbiAgICAgIHJldHVybiBhY2NvdW50cy5fbG9naW5Vc2VyKHRoaXMsIHRoaXMudXNlcklkLCBuZXdTdGFtcGVkVG9rZW4pO1xuICAgIH07XG5cbiAgICAvLyBSZW1vdmVzIGFsbCB0b2tlbnMgZXhjZXB0IHRoZSB0b2tlbiBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnRcbiAgICAvLyBjb25uZWN0aW9uLiBUaHJvd3MgYW4gZXJyb3IgaWYgdGhlIGNvbm5lY3Rpb24gaXMgbm90IGxvZ2dlZFxuICAgIC8vIGluLiBSZXR1cm5zIG5vdGhpbmcgb24gc3VjY2Vzcy5cbiAgICBtZXRob2RzLnJlbW92ZU90aGVyVG9rZW5zID0gZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKCEgdGhpcy51c2VySWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIllvdSBhcmUgbm90IGxvZ2dlZCBpbi5cIik7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50VG9rZW4gPSBhY2NvdW50cy5fZ2V0TG9naW5Ub2tlbih0aGlzLmNvbm5lY3Rpb24uaWQpO1xuICAgICAgYWNjb3VudHMudXNlcnMudXBkYXRlKHRoaXMudXNlcklkLCB7XG4gICAgICAgICRwdWxsOiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogeyBoYXNoZWRUb2tlbjogeyAkbmU6IGN1cnJlbnRUb2tlbiB9IH1cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIC8vIEFsbG93IGEgb25lLXRpbWUgY29uZmlndXJhdGlvbiBmb3IgYSBsb2dpbiBzZXJ2aWNlLiBNb2RpZmljYXRpb25zXG4gICAgLy8gdG8gdGhpcyBjb2xsZWN0aW9uIGFyZSBhbHNvIGFsbG93ZWQgaW4gaW5zZWN1cmUgbW9kZS5cbiAgICBtZXRob2RzLmNvbmZpZ3VyZUxvZ2luU2VydmljZSA9IChvcHRpb25zKSA9PiB7XG4gICAgICBjaGVjayhvcHRpb25zLCBNYXRjaC5PYmplY3RJbmNsdWRpbmcoe3NlcnZpY2U6IFN0cmluZ30pKTtcbiAgICAgIC8vIERvbid0IGxldCByYW5kb20gdXNlcnMgY29uZmlndXJlIGEgc2VydmljZSB3ZSBoYXZlbid0IGFkZGVkIHlldCAoc29cbiAgICAgIC8vIHRoYXQgd2hlbiB3ZSBkbyBsYXRlciBhZGQgaXQsIGl0J3Mgc2V0IHVwIHdpdGggdGhlaXIgY29uZmlndXJhdGlvblxuICAgICAgLy8gaW5zdGVhZCBvZiBvdXJzKS5cbiAgICAgIC8vIFhYWCBpZiBzZXJ2aWNlIGNvbmZpZ3VyYXRpb24gaXMgb2F1dGgtc3BlY2lmaWMgdGhlbiB0aGlzIGNvZGUgc2hvdWxkXG4gICAgICAvLyAgICAgYmUgaW4gYWNjb3VudHMtb2F1dGg7IGlmIGl0J3Mgbm90IHRoZW4gdGhlIHJlZ2lzdHJ5IHNob3VsZCBiZVxuICAgICAgLy8gICAgIGluIHRoaXMgcGFja2FnZVxuICAgICAgaWYgKCEoYWNjb3VudHMub2F1dGhcbiAgICAgICAgJiYgYWNjb3VudHMub2F1dGguc2VydmljZU5hbWVzKCkuaW5jbHVkZXMob3B0aW9ucy5zZXJ2aWNlKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiU2VydmljZSB1bmtub3duXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ10pIHtcbiAgICAgICAgY29uc3QgeyBTZXJ2aWNlQ29uZmlndXJhdGlvbiB9ID0gUGFja2FnZVsnc2VydmljZS1jb25maWd1cmF0aW9uJ107XG4gICAgICAgIGlmIChTZXJ2aWNlQ29uZmlndXJhdGlvbi5jb25maWd1cmF0aW9ucy5maW5kT25lKHtzZXJ2aWNlOiBvcHRpb25zLnNlcnZpY2V9KSlcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgYFNlcnZpY2UgJHtvcHRpb25zLnNlcnZpY2V9IGFscmVhZHkgY29uZmlndXJlZGApO1xuXG4gICAgICAgIGlmIChQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXSkge1xuICAgICAgICAgIGNvbnN0IHsgT0F1dGhFbmNyeXB0aW9uIH0gPSBQYWNrYWdlW1wib2F1dGgtZW5jcnlwdGlvblwiXVxuICAgICAgICAgIGlmIChoYXNPd24uY2FsbChvcHRpb25zLCAnc2VjcmV0JykgJiYgT0F1dGhFbmNyeXB0aW9uLmtleUlzTG9hZGVkKCkpXG4gICAgICAgICAgICBvcHRpb25zLnNlY3JldCA9IE9BdXRoRW5jcnlwdGlvbi5zZWFsKG9wdGlvbnMuc2VjcmV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIFNlcnZpY2VDb25maWd1cmF0aW9uLmNvbmZpZ3VyYXRpb25zLmluc2VydChvcHRpb25zKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgYWNjb3VudHMuX3NlcnZlci5tZXRob2RzKG1ldGhvZHMpO1xuICB9O1xuXG4gIF9pbml0QWNjb3VudERhdGFIb29rcygpIHtcbiAgICB0aGlzLl9zZXJ2ZXIub25Db25uZWN0aW9uKGNvbm5lY3Rpb24gPT4ge1xuICAgICAgdGhpcy5fYWNjb3VudERhdGFbY29ubmVjdGlvbi5pZF0gPSB7XG4gICAgICAgIGNvbm5lY3Rpb246IGNvbm5lY3Rpb25cbiAgICAgIH07XG5cbiAgICAgIGNvbm5lY3Rpb24ub25DbG9zZSgoKSA9PiB7XG4gICAgICAgIHRoaXMuX3JlbW92ZVRva2VuRnJvbUNvbm5lY3Rpb24oY29ubmVjdGlvbi5pZCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9hY2NvdW50RGF0YVtjb25uZWN0aW9uLmlkXTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIF9pbml0U2VydmVyUHVibGljYXRpb25zKCkge1xuICAgIC8vIEJyaW5nIGludG8gbGV4aWNhbCBzY29wZSBmb3IgcHVibGlzaCBjYWxsYmFja3MgdGhhdCBuZWVkIGB0aGlzYFxuICAgIGNvbnN0IHsgdXNlcnMsIF9hdXRvcHVibGlzaEZpZWxkcywgX2RlZmF1bHRQdWJsaXNoRmllbGRzIH0gPSB0aGlzO1xuXG4gICAgLy8gUHVibGlzaCBhbGwgbG9naW4gc2VydmljZSBjb25maWd1cmF0aW9uIGZpZWxkcyBvdGhlciB0aGFuIHNlY3JldC5cbiAgICB0aGlzLl9zZXJ2ZXIucHVibGlzaChcIm1ldGVvci5sb2dpblNlcnZpY2VDb25maWd1cmF0aW9uXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddKSB7XG4gICAgICAgIGNvbnN0IHsgU2VydmljZUNvbmZpZ3VyYXRpb24gfSA9IFBhY2thZ2VbJ3NlcnZpY2UtY29uZmlndXJhdGlvbiddO1xuICAgICAgICByZXR1cm4gU2VydmljZUNvbmZpZ3VyYXRpb24uY29uZmlndXJhdGlvbnMuZmluZCh7fSwge2ZpZWxkczoge3NlY3JldDogMH19KTtcbiAgICAgIH1cbiAgICAgIHRoaXMucmVhZHkoKTtcbiAgICB9LCB7aXNfYXV0bzogdHJ1ZX0pOyAvLyBub3QgdGVjaG5pY2FsbHkgYXV0b3B1Ymxpc2gsIGJ1dCBzdG9wcyB0aGUgd2FybmluZy5cblxuICAgIC8vIFVzZSBNZXRlb3Iuc3RhcnR1cCB0byBnaXZlIG90aGVyIHBhY2thZ2VzIGEgY2hhbmNlIHRvIGNhbGxcbiAgICAvLyBzZXREZWZhdWx0UHVibGlzaEZpZWxkcy5cbiAgICBNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gICAgICAvLyBNZXJnZSBjdXN0b20gZmllbGRzIHNlbGVjdG9yIGFuZCBkZWZhdWx0IHB1Ymxpc2ggZmllbGRzIHNvIHRoYXQgdGhlIGNsaWVudFxuICAgICAgLy8gZ2V0cyBhbGwgdGhlIG5lY2Vzc2FyeSBmaWVsZHMgdG8gcnVuIHByb3Blcmx5XG4gICAgICBjb25zdCBjdXN0b21GaWVsZHMgPSB0aGlzLl9hZGREZWZhdWx0RmllbGRTZWxlY3RvcigpLmZpZWxkcyB8fCB7fTtcbiAgICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhjdXN0b21GaWVsZHMpO1xuICAgICAgLy8gSWYgdGhlIGN1c3RvbSBmaWVsZHMgYXJlIG5lZ2F0aXZlLCB0aGVuIGlnbm9yZSB0aGVtIGFuZCBvbmx5IHNlbmQgdGhlIG5lY2Vzc2FyeSBmaWVsZHNcbiAgICAgIGNvbnN0IGZpZWxkcyA9IGtleXMubGVuZ3RoID4gMCAmJiBjdXN0b21GaWVsZHNba2V5c1swXV0gPyB7XG4gICAgICAgIC4uLnRoaXMuX2FkZERlZmF1bHRGaWVsZFNlbGVjdG9yKCkuZmllbGRzLFxuICAgICAgICAuLi5fZGVmYXVsdFB1Ymxpc2hGaWVsZHMucHJvamVjdGlvblxuICAgICAgfSA6IF9kZWZhdWx0UHVibGlzaEZpZWxkcy5wcm9qZWN0aW9uXG4gICAgICAvLyBQdWJsaXNoIHRoZSBjdXJyZW50IHVzZXIncyByZWNvcmQgdG8gdGhlIGNsaWVudC5cbiAgICAgIHRoaXMuX3NlcnZlci5wdWJsaXNoKG51bGwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudXNlcklkKSB7XG4gICAgICAgICAgcmV0dXJuIHVzZXJzLmZpbmQoe1xuICAgICAgICAgICAgX2lkOiB0aGlzLnVzZXJJZFxuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIGZpZWxkcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfSwgLypzdXBwcmVzcyBhdXRvcHVibGlzaCB3YXJuaW5nKi97aXNfYXV0bzogdHJ1ZX0pO1xuICAgIH0pO1xuXG4gICAgLy8gVXNlIE1ldGVvci5zdGFydHVwIHRvIGdpdmUgb3RoZXIgcGFja2FnZXMgYSBjaGFuY2UgdG8gY2FsbFxuICAgIC8vIGFkZEF1dG9wdWJsaXNoRmllbGRzLlxuICAgIFBhY2thZ2UuYXV0b3B1Ymxpc2ggJiYgTWV0ZW9yLnN0YXJ0dXAoKCkgPT4ge1xuICAgICAgLy8gWydwcm9maWxlJywgJ3VzZXJuYW1lJ10gLT4ge3Byb2ZpbGU6IDEsIHVzZXJuYW1lOiAxfVxuICAgICAgY29uc3QgdG9GaWVsZFNlbGVjdG9yID0gZmllbGRzID0+IGZpZWxkcy5yZWR1Y2UoKHByZXYsIGZpZWxkKSA9PiAoXG4gICAgICAgICAgeyAuLi5wcmV2LCBbZmllbGRdOiAxIH0pLFxuICAgICAgICB7fVxuICAgICAgKTtcbiAgICAgIHRoaXMuX3NlcnZlci5wdWJsaXNoKG51bGwsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMudXNlcklkKSB7XG4gICAgICAgICAgcmV0dXJuIHVzZXJzLmZpbmQoeyBfaWQ6IHRoaXMudXNlcklkIH0sIHtcbiAgICAgICAgICAgIGZpZWxkczogdG9GaWVsZFNlbGVjdG9yKF9hdXRvcHVibGlzaEZpZWxkcy5sb2dnZWRJblVzZXIpLFxuICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgIH0sIC8qc3VwcHJlc3MgYXV0b3B1Ymxpc2ggd2FybmluZyove2lzX2F1dG86IHRydWV9KTtcblxuICAgICAgLy8gWFhYIHRoaXMgcHVibGlzaCBpcyBuZWl0aGVyIGRlZHVwLWFibGUgbm9yIGlzIGl0IG9wdGltaXplZCBieSBvdXIgc3BlY2lhbFxuICAgICAgLy8gdHJlYXRtZW50IG9mIHF1ZXJpZXMgb24gYSBzcGVjaWZpYyBfaWQuIFRoZXJlZm9yZSB0aGlzIHdpbGwgaGF2ZSBPKG5eMilcbiAgICAgIC8vIHJ1bi10aW1lIHBlcmZvcm1hbmNlIGV2ZXJ5IHRpbWUgYSB1c2VyIGRvY3VtZW50IGlzIGNoYW5nZWQgKGVnIHNvbWVvbmVcbiAgICAgIC8vIGxvZ2dpbmcgaW4pLiBJZiB0aGlzIGlzIGEgcHJvYmxlbSwgd2UgY2FuIGluc3RlYWQgd3JpdGUgYSBtYW51YWwgcHVibGlzaFxuICAgICAgLy8gZnVuY3Rpb24gd2hpY2ggZmlsdGVycyBvdXQgZmllbGRzIGJhc2VkIG9uICd0aGlzLnVzZXJJZCcuXG4gICAgICB0aGlzLl9zZXJ2ZXIucHVibGlzaChudWxsLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0gdGhpcy51c2VySWQgPyB7IF9pZDogeyAkbmU6IHRoaXMudXNlcklkIH0gfSA6IHt9O1xuICAgICAgICByZXR1cm4gdXNlcnMuZmluZChzZWxlY3Rvciwge1xuICAgICAgICAgIGZpZWxkczogdG9GaWVsZFNlbGVjdG9yKF9hdXRvcHVibGlzaEZpZWxkcy5vdGhlclVzZXJzKSxcbiAgICAgICAgfSlcbiAgICAgIH0sIC8qc3VwcHJlc3MgYXV0b3B1Ymxpc2ggd2FybmluZyove2lzX2F1dG86IHRydWV9KTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBBZGQgdG8gdGhlIGxpc3Qgb2YgZmllbGRzIG9yIHN1YmZpZWxkcyB0byBiZSBhdXRvbWF0aWNhbGx5XG4gIC8vIHB1Ymxpc2hlZCBpZiBhdXRvcHVibGlzaCBpcyBvbi4gTXVzdCBiZSBjYWxsZWQgZnJvbSB0b3AtbGV2ZWxcbiAgLy8gY29kZSAoaWUsIGJlZm9yZSBNZXRlb3Iuc3RhcnR1cCBob29rcyBydW4pLlxuICAvL1xuICAvLyBAcGFyYW0gb3B0cyB7T2JqZWN0fSB3aXRoOlxuICAvLyAgIC0gZm9yTG9nZ2VkSW5Vc2VyIHtBcnJheX0gQXJyYXkgb2YgZmllbGRzIHB1Ymxpc2hlZCB0byB0aGUgbG9nZ2VkLWluIHVzZXJcbiAgLy8gICAtIGZvck90aGVyVXNlcnMge0FycmF5fSBBcnJheSBvZiBmaWVsZHMgcHVibGlzaGVkIHRvIHVzZXJzIHRoYXQgYXJlbid0IGxvZ2dlZCBpblxuICBhZGRBdXRvcHVibGlzaEZpZWxkcyhvcHRzKSB7XG4gICAgdGhpcy5fYXV0b3B1Ymxpc2hGaWVsZHMubG9nZ2VkSW5Vc2VyLnB1c2guYXBwbHkoXG4gICAgICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcy5sb2dnZWRJblVzZXIsIG9wdHMuZm9yTG9nZ2VkSW5Vc2VyKTtcbiAgICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcy5vdGhlclVzZXJzLnB1c2guYXBwbHkoXG4gICAgICB0aGlzLl9hdXRvcHVibGlzaEZpZWxkcy5vdGhlclVzZXJzLCBvcHRzLmZvck90aGVyVXNlcnMpO1xuICB9O1xuXG4gIC8vIFJlcGxhY2VzIHRoZSBmaWVsZHMgdG8gYmUgYXV0b21hdGljYWxseVxuICAvLyBwdWJsaXNoZWQgd2hlbiB0aGUgdXNlciBsb2dzIGluXG4gIC8vXG4gIC8vIEBwYXJhbSB7TW9uZ29GaWVsZFNwZWNpZmllcn0gZmllbGRzIERpY3Rpb25hcnkgb2YgZmllbGRzIHRvIHJldHVybiBvciBleGNsdWRlLlxuICBzZXREZWZhdWx0UHVibGlzaEZpZWxkcyhmaWVsZHMpIHtcbiAgICB0aGlzLl9kZWZhdWx0UHVibGlzaEZpZWxkcy5wcm9qZWN0aW9uID0gZmllbGRzO1xuICB9O1xuXG4gIC8vL1xuICAvLy8gQUNDT1VOVCBEQVRBXG4gIC8vL1xuXG4gIC8vIEhBQ0s6IFRoaXMgaXMgdXNlZCBieSAnbWV0ZW9yLWFjY291bnRzJyB0byBnZXQgdGhlIGxvZ2luVG9rZW4gZm9yIGFcbiAgLy8gY29ubmVjdGlvbi4gTWF5YmUgdGhlcmUgc2hvdWxkIGJlIGEgcHVibGljIHdheSB0byBkbyB0aGF0LlxuICBfZ2V0QWNjb3VudERhdGEoY29ubmVjdGlvbklkLCBmaWVsZCkge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLl9hY2NvdW50RGF0YVtjb25uZWN0aW9uSWRdO1xuICAgIHJldHVybiBkYXRhICYmIGRhdGFbZmllbGRdO1xuICB9O1xuXG4gIF9zZXRBY2NvdW50RGF0YShjb25uZWN0aW9uSWQsIGZpZWxkLCB2YWx1ZSkge1xuICAgIGNvbnN0IGRhdGEgPSB0aGlzLl9hY2NvdW50RGF0YVtjb25uZWN0aW9uSWRdO1xuXG4gICAgLy8gc2FmZXR5IGJlbHQuIHNob3VsZG4ndCBoYXBwZW4uIGFjY291bnREYXRhIGlzIHNldCBpbiBvbkNvbm5lY3Rpb24sXG4gICAgLy8gd2UgZG9uJ3QgaGF2ZSBhIGNvbm5lY3Rpb25JZCB1bnRpbCBpdCBpcyBzZXQuXG4gICAgaWYgKCFkYXRhKVxuICAgICAgcmV0dXJuO1xuXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICBkZWxldGUgZGF0YVtmaWVsZF07XG4gICAgZWxzZVxuICAgICAgZGF0YVtmaWVsZF0gPSB2YWx1ZTtcbiAgfTtcblxuICAvLy9cbiAgLy8vIFJFQ09OTkVDVCBUT0tFTlNcbiAgLy8vXG4gIC8vLyBzdXBwb3J0IHJlY29ubmVjdGluZyB1c2luZyBhIG1ldGVvciBsb2dpbiB0b2tlblxuXG4gIF9oYXNoTG9naW5Ub2tlbihsb2dpblRva2VuKSB7XG4gICAgY29uc3QgaGFzaCA9IGNyeXB0by5jcmVhdGVIYXNoKCdzaGEyNTYnKTtcbiAgICBoYXNoLnVwZGF0ZShsb2dpblRva2VuKTtcbiAgICByZXR1cm4gaGFzaC5kaWdlc3QoJ2Jhc2U2NCcpO1xuICB9O1xuXG4gIC8vIHt0b2tlbiwgd2hlbn0gPT4ge2hhc2hlZFRva2VuLCB3aGVufVxuICBfaGFzaFN0YW1wZWRUb2tlbihzdGFtcGVkVG9rZW4pIHtcbiAgICBjb25zdCB7IHRva2VuLCAuLi5oYXNoZWRTdGFtcGVkVG9rZW4gfSA9IHN0YW1wZWRUb2tlbjtcbiAgICByZXR1cm4ge1xuICAgICAgLi4uaGFzaGVkU3RhbXBlZFRva2VuLFxuICAgICAgaGFzaGVkVG9rZW46IHRoaXMuX2hhc2hMb2dpblRva2VuKHRva2VuKVxuICAgIH07XG4gIH07XG5cbiAgLy8gVXNpbmcgJGFkZFRvU2V0IGF2b2lkcyBnZXR0aW5nIGFuIGluZGV4IGVycm9yIGlmIGFub3RoZXIgY2xpZW50XG4gIC8vIGxvZ2dpbmcgaW4gc2ltdWx0YW5lb3VzbHkgaGFzIGFscmVhZHkgaW5zZXJ0ZWQgdGhlIG5ldyBoYXNoZWRcbiAgLy8gdG9rZW4uXG4gIF9pbnNlcnRIYXNoZWRMb2dpblRva2VuKHVzZXJJZCwgaGFzaGVkVG9rZW4sIHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBxdWVyeSA/IHsgLi4ucXVlcnkgfSA6IHt9O1xuICAgIHF1ZXJ5Ll9pZCA9IHVzZXJJZDtcbiAgICB0aGlzLnVzZXJzLnVwZGF0ZShxdWVyeSwge1xuICAgICAgJGFkZFRvU2V0OiB7XG4gICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IGhhc2hlZFRva2VuXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLlxuICBfaW5zZXJ0TG9naW5Ub2tlbih1c2VySWQsIHN0YW1wZWRUb2tlbiwgcXVlcnkpIHtcbiAgICB0aGlzLl9pbnNlcnRIYXNoZWRMb2dpblRva2VuKFxuICAgICAgdXNlcklkLFxuICAgICAgdGhpcy5faGFzaFN0YW1wZWRUb2tlbihzdGFtcGVkVG9rZW4pLFxuICAgICAgcXVlcnlcbiAgICApO1xuICB9O1xuXG4gIF9jbGVhckFsbExvZ2luVG9rZW5zKHVzZXJJZCkge1xuICAgIHRoaXMudXNlcnMudXBkYXRlKHVzZXJJZCwge1xuICAgICAgJHNldDoge1xuICAgICAgICAnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJzogW11cbiAgICAgIH1cbiAgICB9KTtcbiAgfTtcblxuICAvLyB0ZXN0IGhvb2tcbiAgX2dldFVzZXJPYnNlcnZlKGNvbm5lY3Rpb25JZCkge1xuICAgIHJldHVybiB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uSWRdO1xuICB9O1xuXG4gIC8vIENsZWFuIHVwIHRoaXMgY29ubmVjdGlvbidzIGFzc29jaWF0aW9uIHdpdGggdGhlIHRva2VuOiB0aGF0IGlzLCBzdG9wXG4gIC8vIHRoZSBvYnNlcnZlIHRoYXQgd2Ugc3RhcnRlZCB3aGVuIHdlIGFzc29jaWF0ZWQgdGhlIGNvbm5lY3Rpb24gd2l0aFxuICAvLyB0aGlzIHRva2VuLlxuICBfcmVtb3ZlVG9rZW5Gcm9tQ29ubmVjdGlvbihjb25uZWN0aW9uSWQpIHtcbiAgICBpZiAoaGFzT3duLmNhbGwodGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnMsIGNvbm5lY3Rpb25JZCkpIHtcbiAgICAgIGNvbnN0IG9ic2VydmUgPSB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uSWRdO1xuICAgICAgaWYgKHR5cGVvZiBvYnNlcnZlID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBXZSdyZSBpbiB0aGUgcHJvY2VzcyBvZiBzZXR0aW5nIHVwIGFuIG9ic2VydmUgZm9yIHRoaXMgY29ubmVjdGlvbi4gV2VcbiAgICAgICAgLy8gY2FuJ3QgY2xlYW4gdXAgdGhhdCBvYnNlcnZlIHlldCwgYnV0IGlmIHdlIGRlbGV0ZSB0aGUgcGxhY2Vob2xkZXIgZm9yXG4gICAgICAgIC8vIHRoaXMgY29ubmVjdGlvbiwgdGhlbiB0aGUgb2JzZXJ2ZSB3aWxsIGdldCBjbGVhbmVkIHVwIGFzIHNvb24gYXMgaXQgaGFzXG4gICAgICAgIC8vIGJlZW4gc2V0IHVwLlxuICAgICAgICBkZWxldGUgdGhpcy5fdXNlck9ic2VydmVzRm9yQ29ubmVjdGlvbnNbY29ubmVjdGlvbklkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uSWRdO1xuICAgICAgICBvYnNlcnZlLnN0b3AoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgX2dldExvZ2luVG9rZW4oY29ubmVjdGlvbklkKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEFjY291bnREYXRhKGNvbm5lY3Rpb25JZCwgJ2xvZ2luVG9rZW4nKTtcbiAgfTtcblxuICAvLyBuZXdUb2tlbiBpcyBhIGhhc2hlZCB0b2tlbi5cbiAgX3NldExvZ2luVG9rZW4odXNlcklkLCBjb25uZWN0aW9uLCBuZXdUb2tlbikge1xuICAgIHRoaXMuX3JlbW92ZVRva2VuRnJvbUNvbm5lY3Rpb24oY29ubmVjdGlvbi5pZCk7XG4gICAgdGhpcy5fc2V0QWNjb3VudERhdGEoY29ubmVjdGlvbi5pZCwgJ2xvZ2luVG9rZW4nLCBuZXdUb2tlbik7XG5cbiAgICBpZiAobmV3VG9rZW4pIHtcbiAgICAgIC8vIFNldCB1cCBhbiBvYnNlcnZlIGZvciB0aGlzIHRva2VuLiBJZiB0aGUgdG9rZW4gZ29lcyBhd2F5LCB3ZSBuZWVkXG4gICAgICAvLyB0byBjbG9zZSB0aGUgY29ubmVjdGlvbi4gIFdlIGRlZmVyIHRoZSBvYnNlcnZlIGJlY2F1c2UgdGhlcmUnc1xuICAgICAgLy8gbm8gbmVlZCBmb3IgaXQgdG8gYmUgb24gdGhlIGNyaXRpY2FsIHBhdGggZm9yIGxvZ2luOyB3ZSBqdXN0IG5lZWRcbiAgICAgIC8vIHRvIGVuc3VyZSB0aGF0IHRoZSBjb25uZWN0aW9uIHdpbGwgZ2V0IGNsb3NlZCBhdCBzb21lIHBvaW50IGlmXG4gICAgICAvLyB0aGUgdG9rZW4gZ2V0cyBkZWxldGVkLlxuICAgICAgLy9cbiAgICAgIC8vIEluaXRpYWxseSwgd2Ugc2V0IHRoZSBvYnNlcnZlIGZvciB0aGlzIGNvbm5lY3Rpb24gdG8gYSBudW1iZXI7IHRoaXNcbiAgICAgIC8vIHNpZ25pZmllcyB0byBvdGhlciBjb2RlICh3aGljaCBtaWdodCBydW4gd2hpbGUgd2UgeWllbGQpIHRoYXQgd2UgYXJlIGluXG4gICAgICAvLyB0aGUgcHJvY2VzcyBvZiBzZXR0aW5nIHVwIGFuIG9ic2VydmUgZm9yIHRoaXMgY29ubmVjdGlvbi4gT25jZSB0aGVcbiAgICAgIC8vIG9ic2VydmUgaXMgcmVhZHkgdG8gZ28sIHdlIHJlcGxhY2UgdGhlIG51bWJlciB3aXRoIHRoZSByZWFsIG9ic2VydmVcbiAgICAgIC8vIGhhbmRsZSAodW5sZXNzIHRoZSBwbGFjZWhvbGRlciBoYXMgYmVlbiBkZWxldGVkIG9yIHJlcGxhY2VkIGJ5IGFcbiAgICAgIC8vIGRpZmZlcmVudCBwbGFjZWhvbGQgbnVtYmVyLCBzaWduaWZ5aW5nIHRoYXQgdGhlIGNvbm5lY3Rpb24gd2FzIGNsb3NlZFxuICAgICAgLy8gYWxyZWFkeSAtLSBpbiB0aGlzIGNhc2Ugd2UganVzdCBjbGVhbiB1cCB0aGUgb2JzZXJ2ZSB0aGF0IHdlIHN0YXJ0ZWQpLlxuICAgICAgY29uc3QgbXlPYnNlcnZlTnVtYmVyID0gKyt0aGlzLl9uZXh0VXNlck9ic2VydmVOdW1iZXI7XG4gICAgICB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uLmlkXSA9IG15T2JzZXJ2ZU51bWJlcjtcbiAgICAgIE1ldGVvci5kZWZlcigoKSA9PiB7XG4gICAgICAgIC8vIElmIHNvbWV0aGluZyBlbHNlIGhhcHBlbmVkIG9uIHRoaXMgY29ubmVjdGlvbiBpbiB0aGUgbWVhbnRpbWUgKGl0IGdvdFxuICAgICAgICAvLyBjbG9zZWQsIG9yIGFub3RoZXIgY2FsbCB0byBfc2V0TG9naW5Ub2tlbiBoYXBwZW5lZCksIGp1c3QgZG9cbiAgICAgICAgLy8gbm90aGluZy4gV2UgZG9uJ3QgbmVlZCB0byBzdGFydCBhbiBvYnNlcnZlIGZvciBhbiBvbGQgY29ubmVjdGlvbiBvciBvbGRcbiAgICAgICAgLy8gdG9rZW4uXG4gICAgICAgIGlmICh0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uLmlkXSAhPT0gbXlPYnNlcnZlTnVtYmVyKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGZvdW5kTWF0Y2hpbmdVc2VyO1xuICAgICAgICAvLyBCZWNhdXNlIHdlIHVwZ3JhZGUgdW5oYXNoZWQgbG9naW4gdG9rZW5zIHRvIGhhc2hlZCB0b2tlbnMgYXRcbiAgICAgICAgLy8gbG9naW4gdGltZSwgc2Vzc2lvbnMgd2lsbCBvbmx5IGJlIGxvZ2dlZCBpbiB3aXRoIGEgaGFzaGVkXG4gICAgICAgIC8vIHRva2VuLiBUaHVzIHdlIG9ubHkgbmVlZCB0byBvYnNlcnZlIGhhc2hlZCB0b2tlbnMgaGVyZS5cbiAgICAgICAgY29uc3Qgb2JzZXJ2ZSA9IHRoaXMudXNlcnMuZmluZCh7XG4gICAgICAgICAgX2lkOiB1c2VySWQsXG4gICAgICAgICAgJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlbic6IG5ld1Rva2VuXG4gICAgICAgIH0sIHsgZmllbGRzOiB7IF9pZDogMSB9IH0pLm9ic2VydmVDaGFuZ2VzKHtcbiAgICAgICAgICBhZGRlZDogKCkgPT4ge1xuICAgICAgICAgICAgZm91bmRNYXRjaGluZ1VzZXIgPSB0cnVlO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVtb3ZlZDogY29ubmVjdGlvbi5jbG9zZSxcbiAgICAgICAgICAvLyBUaGUgb25DbG9zZSBjYWxsYmFjayBmb3IgdGhlIGNvbm5lY3Rpb24gdGFrZXMgY2FyZSBvZlxuICAgICAgICAgIC8vIGNsZWFuaW5nIHVwIHRoZSBvYnNlcnZlIGhhbmRsZSBhbmQgYW55IG90aGVyIHN0YXRlIHdlIGhhdmVcbiAgICAgICAgICAvLyBseWluZyBhcm91bmQuXG4gICAgICAgIH0sIHsgbm9uTXV0YXRpbmdDYWxsYmFja3M6IHRydWUgfSk7XG5cbiAgICAgICAgLy8gSWYgdGhlIHVzZXIgcmFuIGFub3RoZXIgbG9naW4gb3IgbG9nb3V0IGNvbW1hbmQgd2Ugd2VyZSB3YWl0aW5nIGZvciB0aGVcbiAgICAgICAgLy8gZGVmZXIgb3IgYWRkZWQgdG8gZmlyZSAoaWUsIGFub3RoZXIgY2FsbCB0byBfc2V0TG9naW5Ub2tlbiBvY2N1cnJlZCksXG4gICAgICAgIC8vIHRoZW4gd2UgbGV0IHRoZSBsYXRlciBvbmUgd2luIChzdGFydCBhbiBvYnNlcnZlLCBldGMpIGFuZCBqdXN0IHN0b3Agb3VyXG4gICAgICAgIC8vIG9ic2VydmUgbm93LlxuICAgICAgICAvL1xuICAgICAgICAvLyBTaW1pbGFybHksIGlmIHRoZSBjb25uZWN0aW9uIHdhcyBhbHJlYWR5IGNsb3NlZCwgdGhlbiB0aGUgb25DbG9zZVxuICAgICAgICAvLyBjYWxsYmFjayB3b3VsZCBoYXZlIGNhbGxlZCBfcmVtb3ZlVG9rZW5Gcm9tQ29ubmVjdGlvbiBhbmQgdGhlcmUgd29uJ3RcbiAgICAgICAgLy8gYmUgYW4gZW50cnkgaW4gX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zLiBXZSBjYW4gc3RvcCB0aGUgb2JzZXJ2ZS5cbiAgICAgICAgaWYgKHRoaXMuX3VzZXJPYnNlcnZlc0ZvckNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24uaWRdICE9PSBteU9ic2VydmVOdW1iZXIpIHtcbiAgICAgICAgICBvYnNlcnZlLnN0b3AoKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl91c2VyT2JzZXJ2ZXNGb3JDb25uZWN0aW9uc1tjb25uZWN0aW9uLmlkXSA9IG9ic2VydmU7XG5cbiAgICAgICAgaWYgKCEgZm91bmRNYXRjaGluZ1VzZXIpIHtcbiAgICAgICAgICAvLyBXZSd2ZSBzZXQgdXAgYW4gb2JzZXJ2ZSBvbiB0aGUgdXNlciBhc3NvY2lhdGVkIHdpdGggYG5ld1Rva2VuYCxcbiAgICAgICAgICAvLyBzbyBpZiB0aGUgbmV3IHRva2VuIGlzIHJlbW92ZWQgZnJvbSB0aGUgZGF0YWJhc2UsIHdlJ2xsIGNsb3NlXG4gICAgICAgICAgLy8gdGhlIGNvbm5lY3Rpb24uIEJ1dCB0aGUgdG9rZW4gbWlnaHQgaGF2ZSBhbHJlYWR5IGJlZW4gZGVsZXRlZFxuICAgICAgICAgIC8vIGJlZm9yZSB3ZSBzZXQgdXAgdGhlIG9ic2VydmUsIHdoaWNoIHdvdWxkbid0IGhhdmUgY2xvc2VkIHRoZVxuICAgICAgICAgIC8vIGNvbm5lY3Rpb24gYmVjYXVzZSB0aGUgb2JzZXJ2ZSB3YXNuJ3QgcnVubmluZyB5ZXQuXG4gICAgICAgICAgY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgLy8gKEFsc28gdXNlZCBieSBNZXRlb3IgQWNjb3VudHMgc2VydmVyIGFuZCB0ZXN0cykuXG4gIC8vXG4gIF9nZW5lcmF0ZVN0YW1wZWRMb2dpblRva2VuKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0b2tlbjogUmFuZG9tLnNlY3JldCgpLFxuICAgICAgd2hlbjogbmV3IERhdGVcbiAgICB9O1xuICB9O1xuXG4gIC8vL1xuICAvLy8gVE9LRU4gRVhQSVJBVElPTlxuICAvLy9cblxuICAvLyBEZWxldGVzIGV4cGlyZWQgcGFzc3dvcmQgcmVzZXQgdG9rZW5zIGZyb20gdGhlIGRhdGFiYXNlLlxuICAvL1xuICAvLyBFeHBvcnRlZCBmb3IgdGVzdHMuIEFsc28sIHRoZSBhcmd1bWVudHMgYXJlIG9ubHkgdXNlZCBieVxuICAvLyB0ZXN0cy4gb2xkZXN0VmFsaWREYXRlIGlzIHNpbXVsYXRlIGV4cGlyaW5nIHRva2VucyB3aXRob3V0IHdhaXRpbmdcbiAgLy8gZm9yIHRoZW0gdG8gYWN0dWFsbHkgZXhwaXJlLiB1c2VySWQgaXMgdXNlZCBieSB0ZXN0cyB0byBvbmx5IGV4cGlyZVxuICAvLyB0b2tlbnMgZm9yIHRoZSB0ZXN0IHVzZXIuXG4gIF9leHBpcmVQYXNzd29yZFJlc2V0VG9rZW5zKG9sZGVzdFZhbGlkRGF0ZSwgdXNlcklkKSB7XG4gICAgY29uc3QgdG9rZW5MaWZldGltZU1zID0gdGhpcy5fZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcygpO1xuXG4gICAgLy8gd2hlbiBjYWxsaW5nIGZyb20gYSB0ZXN0IHdpdGggZXh0cmEgYXJndW1lbnRzLCB5b3UgbXVzdCBzcGVjaWZ5IGJvdGghXG4gICAgaWYgKChvbGRlc3RWYWxpZERhdGUgJiYgIXVzZXJJZCkgfHwgKCFvbGRlc3RWYWxpZERhdGUgJiYgdXNlcklkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQmFkIHRlc3QuIE11c3Qgc3BlY2lmeSBib3RoIG9sZGVzdFZhbGlkRGF0ZSBhbmQgdXNlcklkLlwiKTtcbiAgICB9XG5cbiAgICBvbGRlc3RWYWxpZERhdGUgPSBvbGRlc3RWYWxpZERhdGUgfHxcbiAgICAgIChuZXcgRGF0ZShuZXcgRGF0ZSgpIC0gdG9rZW5MaWZldGltZU1zKSk7XG5cbiAgICBjb25zdCB0b2tlbkZpbHRlciA9IHtcbiAgICAgICRvcjogW1xuICAgICAgICB7IFwic2VydmljZXMucGFzc3dvcmQucmVzZXQucmVhc29uXCI6IFwicmVzZXRcIn0sXG4gICAgICAgIHsgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC5yZWFzb25cIjogeyRleGlzdHM6IGZhbHNlfX1cbiAgICAgIF1cbiAgICB9O1xuXG4gICAgZXhwaXJlUGFzc3dvcmRUb2tlbih0aGlzLCBvbGRlc3RWYWxpZERhdGUsIHRva2VuRmlsdGVyLCB1c2VySWQpO1xuICB9XG5cbiAgLy8gRGVsZXRlcyBleHBpcmVkIHBhc3N3b3JkIGVucm9sbCB0b2tlbnMgZnJvbSB0aGUgZGF0YWJhc2UuXG4gIC8vXG4gIC8vIEV4cG9ydGVkIGZvciB0ZXN0cy4gQWxzbywgdGhlIGFyZ3VtZW50cyBhcmUgb25seSB1c2VkIGJ5XG4gIC8vIHRlc3RzLiBvbGRlc3RWYWxpZERhdGUgaXMgc2ltdWxhdGUgZXhwaXJpbmcgdG9rZW5zIHdpdGhvdXQgd2FpdGluZ1xuICAvLyBmb3IgdGhlbSB0byBhY3R1YWxseSBleHBpcmUuIHVzZXJJZCBpcyB1c2VkIGJ5IHRlc3RzIHRvIG9ubHkgZXhwaXJlXG4gIC8vIHRva2VucyBmb3IgdGhlIHRlc3QgdXNlci5cbiAgX2V4cGlyZVBhc3N3b3JkRW5yb2xsVG9rZW5zKG9sZGVzdFZhbGlkRGF0ZSwgdXNlcklkKSB7XG4gICAgY29uc3QgdG9rZW5MaWZldGltZU1zID0gdGhpcy5fZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMoKTtcblxuICAgIC8vIHdoZW4gY2FsbGluZyBmcm9tIGEgdGVzdCB3aXRoIGV4dHJhIGFyZ3VtZW50cywgeW91IG11c3Qgc3BlY2lmeSBib3RoIVxuICAgIGlmICgob2xkZXN0VmFsaWREYXRlICYmICF1c2VySWQpIHx8ICghb2xkZXN0VmFsaWREYXRlICYmIHVzZXJJZCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJhZCB0ZXN0LiBNdXN0IHNwZWNpZnkgYm90aCBvbGRlc3RWYWxpZERhdGUgYW5kIHVzZXJJZC5cIik7XG4gICAgfVxuXG4gICAgb2xkZXN0VmFsaWREYXRlID0gb2xkZXN0VmFsaWREYXRlIHx8XG4gICAgICAobmV3IERhdGUobmV3IERhdGUoKSAtIHRva2VuTGlmZXRpbWVNcykpO1xuXG4gICAgY29uc3QgdG9rZW5GaWx0ZXIgPSB7XG4gICAgICBcInNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC5yZWFzb25cIjogXCJlbnJvbGxcIlxuICAgIH07XG5cbiAgICBleHBpcmVQYXNzd29yZFRva2VuKHRoaXMsIG9sZGVzdFZhbGlkRGF0ZSwgdG9rZW5GaWx0ZXIsIHVzZXJJZCk7XG4gIH1cblxuICAvLyBEZWxldGVzIGV4cGlyZWQgdG9rZW5zIGZyb20gdGhlIGRhdGFiYXNlIGFuZCBjbG9zZXMgYWxsIG9wZW4gY29ubmVjdGlvbnNcbiAgLy8gYXNzb2NpYXRlZCB3aXRoIHRoZXNlIHRva2Vucy5cbiAgLy9cbiAgLy8gRXhwb3J0ZWQgZm9yIHRlc3RzLiBBbHNvLCB0aGUgYXJndW1lbnRzIGFyZSBvbmx5IHVzZWQgYnlcbiAgLy8gdGVzdHMuIG9sZGVzdFZhbGlkRGF0ZSBpcyBzaW11bGF0ZSBleHBpcmluZyB0b2tlbnMgd2l0aG91dCB3YWl0aW5nXG4gIC8vIGZvciB0aGVtIHRvIGFjdHVhbGx5IGV4cGlyZS4gdXNlcklkIGlzIHVzZWQgYnkgdGVzdHMgdG8gb25seSBleHBpcmVcbiAgLy8gdG9rZW5zIGZvciB0aGUgdGVzdCB1c2VyLlxuICBfZXhwaXJlVG9rZW5zKG9sZGVzdFZhbGlkRGF0ZSwgdXNlcklkKSB7XG4gICAgY29uc3QgdG9rZW5MaWZldGltZU1zID0gdGhpcy5fZ2V0VG9rZW5MaWZldGltZU1zKCk7XG5cbiAgICAvLyB3aGVuIGNhbGxpbmcgZnJvbSBhIHRlc3Qgd2l0aCBleHRyYSBhcmd1bWVudHMsIHlvdSBtdXN0IHNwZWNpZnkgYm90aCFcbiAgICBpZiAoKG9sZGVzdFZhbGlkRGF0ZSAmJiAhdXNlcklkKSB8fCAoIW9sZGVzdFZhbGlkRGF0ZSAmJiB1c2VySWQpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCYWQgdGVzdC4gTXVzdCBzcGVjaWZ5IGJvdGggb2xkZXN0VmFsaWREYXRlIGFuZCB1c2VySWQuXCIpO1xuICAgIH1cblxuICAgIG9sZGVzdFZhbGlkRGF0ZSA9IG9sZGVzdFZhbGlkRGF0ZSB8fFxuICAgICAgKG5ldyBEYXRlKG5ldyBEYXRlKCkgLSB0b2tlbkxpZmV0aW1lTXMpKTtcbiAgICBjb25zdCB1c2VyRmlsdGVyID0gdXNlcklkID8ge19pZDogdXNlcklkfSA6IHt9O1xuXG5cbiAgICAvLyBCYWNrd2FyZHMgY29tcGF0aWJsZSB3aXRoIG9sZGVyIHZlcnNpb25zIG9mIG1ldGVvciB0aGF0IHN0b3JlZCBsb2dpbiB0b2tlblxuICAgIC8vIHRpbWVzdGFtcHMgYXMgbnVtYmVycy5cbiAgICB0aGlzLnVzZXJzLnVwZGF0ZSh7IC4uLnVzZXJGaWx0ZXIsXG4gICAgICAkb3I6IFtcbiAgICAgICAgeyBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy53aGVuXCI6IHsgJGx0OiBvbGRlc3RWYWxpZERhdGUgfSB9LFxuICAgICAgICB7IFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLndoZW5cIjogeyAkbHQ6ICtvbGRlc3RWYWxpZERhdGUgfSB9XG4gICAgICBdXG4gICAgfSwge1xuICAgICAgJHB1bGw6IHtcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjoge1xuICAgICAgICAgICRvcjogW1xuICAgICAgICAgICAgeyB3aGVuOiB7ICRsdDogb2xkZXN0VmFsaWREYXRlIH0gfSxcbiAgICAgICAgICAgIHsgd2hlbjogeyAkbHQ6ICtvbGRlc3RWYWxpZERhdGUgfSB9XG4gICAgICAgICAgXVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgeyBtdWx0aTogdHJ1ZSB9KTtcbiAgICAvLyBUaGUgb2JzZXJ2ZSBvbiBNZXRlb3IudXNlcnMgd2lsbCB0YWtlIGNhcmUgb2YgY2xvc2luZyBjb25uZWN0aW9ucyBmb3JcbiAgICAvLyBleHBpcmVkIHRva2Vucy5cbiAgfTtcblxuICAvLyBAb3ZlcnJpZGUgZnJvbSBhY2NvdW50c19jb21tb24uanNcbiAgY29uZmlnKG9wdGlvbnMpIHtcbiAgICAvLyBDYWxsIHRoZSBvdmVycmlkZGVuIGltcGxlbWVudGF0aW9uIG9mIHRoZSBtZXRob2QuXG4gICAgY29uc3Qgc3VwZXJSZXN1bHQgPSBBY2NvdW50c0NvbW1vbi5wcm90b3R5cGUuY29uZmlnLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAvLyBJZiB0aGUgdXNlciBzZXQgbG9naW5FeHBpcmF0aW9uSW5EYXlzIHRvIG51bGwsIHRoZW4gd2UgbmVlZCB0byBjbGVhciB0aGVcbiAgICAvLyB0aW1lciB0aGF0IHBlcmlvZGljYWxseSBleHBpcmVzIHRva2Vucy5cbiAgICBpZiAoaGFzT3duLmNhbGwodGhpcy5fb3B0aW9ucywgJ2xvZ2luRXhwaXJhdGlvbkluRGF5cycpICYmXG4gICAgICB0aGlzLl9vcHRpb25zLmxvZ2luRXhwaXJhdGlvbkluRGF5cyA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy5leHBpcmVUb2tlbkludGVydmFsKSB7XG4gICAgICBNZXRlb3IuY2xlYXJJbnRlcnZhbCh0aGlzLmV4cGlyZVRva2VuSW50ZXJ2YWwpO1xuICAgICAgdGhpcy5leHBpcmVUb2tlbkludGVydmFsID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXJSZXN1bHQ7XG4gIH07XG5cbiAgLy8gQ2FsbGVkIGJ5IGFjY291bnRzLXBhc3N3b3JkXG4gIGluc2VydFVzZXJEb2Mob3B0aW9ucywgdXNlcikge1xuICAgIC8vIC0gY2xvbmUgdXNlciBkb2N1bWVudCwgdG8gcHJvdGVjdCBmcm9tIG1vZGlmaWNhdGlvblxuICAgIC8vIC0gYWRkIGNyZWF0ZWRBdCB0aW1lc3RhbXBcbiAgICAvLyAtIHByZXBhcmUgYW4gX2lkLCBzbyB0aGF0IHlvdSBjYW4gbW9kaWZ5IG90aGVyIGNvbGxlY3Rpb25zIChlZ1xuICAgIC8vIGNyZWF0ZSBhIGZpcnN0IHRhc2sgZm9yIGV2ZXJ5IG5ldyB1c2VyKVxuICAgIC8vXG4gICAgLy8gWFhYIElmIHRoZSBvbkNyZWF0ZVVzZXIgb3IgdmFsaWRhdGVOZXdVc2VyIGhvb2tzIGZhaWwsIHdlIG1pZ2h0XG4gICAgLy8gZW5kIHVwIGhhdmluZyBtb2RpZmllZCBzb21lIG90aGVyIGNvbGxlY3Rpb25cbiAgICAvLyBpbmFwcHJvcHJpYXRlbHkuIFRoZSBzb2x1dGlvbiBpcyBwcm9iYWJseSB0byBoYXZlIG9uQ3JlYXRlVXNlclxuICAgIC8vIGFjY2VwdCB0d28gY2FsbGJhY2tzIC0gb25lIHRoYXQgZ2V0cyBjYWxsZWQgYmVmb3JlIGluc2VydGluZ1xuICAgIC8vIHRoZSB1c2VyIGRvY3VtZW50IChpbiB3aGljaCB5b3UgY2FuIG1vZGlmeSBpdHMgY29udGVudHMpLCBhbmRcbiAgICAvLyBvbmUgdGhhdCBnZXRzIGNhbGxlZCBhZnRlciAoaW4gd2hpY2ggeW91IHNob3VsZCBjaGFuZ2Ugb3RoZXJcbiAgICAvLyBjb2xsZWN0aW9ucylcbiAgICB1c2VyID0ge1xuICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgX2lkOiBSYW5kb20uaWQoKSxcbiAgICAgIC4uLnVzZXIsXG4gICAgfTtcblxuICAgIGlmICh1c2VyLnNlcnZpY2VzKSB7XG4gICAgICBPYmplY3Qua2V5cyh1c2VyLnNlcnZpY2VzKS5mb3JFYWNoKHNlcnZpY2UgPT5cbiAgICAgICAgcGluRW5jcnlwdGVkRmllbGRzVG9Vc2VyKHVzZXIuc2VydmljZXNbc2VydmljZV0sIHVzZXIuX2lkKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBsZXQgZnVsbFVzZXI7XG4gICAgaWYgKHRoaXMuX29uQ3JlYXRlVXNlckhvb2spIHtcbiAgICAgIGZ1bGxVc2VyID0gdGhpcy5fb25DcmVhdGVVc2VySG9vayhvcHRpb25zLCB1c2VyKTtcblxuICAgICAgLy8gVGhpcyBpcyAqbm90KiBwYXJ0IG9mIHRoZSBBUEkuIFdlIG5lZWQgdGhpcyBiZWNhdXNlIHdlIGNhbid0IGlzb2xhdGVcbiAgICAgIC8vIHRoZSBnbG9iYWwgc2VydmVyIGVudmlyb25tZW50IGJldHdlZW4gdGVzdHMsIG1lYW5pbmcgd2UgY2FuJ3QgdGVzdFxuICAgICAgLy8gYm90aCBoYXZpbmcgYSBjcmVhdGUgdXNlciBob29rIHNldCBhbmQgbm90IGhhdmluZyBvbmUgc2V0LlxuICAgICAgaWYgKGZ1bGxVc2VyID09PSAnVEVTVCBERUZBVUxUIEhPT0snKVxuICAgICAgICBmdWxsVXNlciA9IGRlZmF1bHRDcmVhdGVVc2VySG9vayhvcHRpb25zLCB1c2VyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZnVsbFVzZXIgPSBkZWZhdWx0Q3JlYXRlVXNlckhvb2sob3B0aW9ucywgdXNlcik7XG4gICAgfVxuXG4gICAgdGhpcy5fdmFsaWRhdGVOZXdVc2VySG9va3MuZm9yRWFjaChob29rID0+IHtcbiAgICAgIGlmICghIGhvb2soZnVsbFVzZXIpKVxuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJVc2VyIHZhbGlkYXRpb24gZmFpbGVkXCIpO1xuICAgIH0pO1xuXG4gICAgbGV0IHVzZXJJZDtcbiAgICB0cnkge1xuICAgICAgdXNlcklkID0gdGhpcy51c2Vycy5pbnNlcnQoZnVsbFVzZXIpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIFhYWCBzdHJpbmcgcGFyc2luZyBzdWNrcywgbWF5YmVcbiAgICAgIC8vIGh0dHBzOi8vamlyYS5tb25nb2RiLm9yZy9icm93c2UvU0VSVkVSLTMwNjkgd2lsbCBnZXQgZml4ZWQgb25lIGRheVxuICAgICAgLy8gaHR0cHM6Ly9qaXJhLm1vbmdvZGIub3JnL2Jyb3dzZS9TRVJWRVItNDYzN1xuICAgICAgaWYgKCFlLmVycm1zZykgdGhyb3cgZTtcbiAgICAgIGlmIChlLmVycm1zZy5pbmNsdWRlcygnZW1haWxzLmFkZHJlc3MnKSlcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiRW1haWwgYWxyZWFkeSBleGlzdHMuXCIpO1xuICAgICAgaWYgKGUuZXJybXNnLmluY2x1ZGVzKCd1c2VybmFtZScpKVxuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJVc2VybmFtZSBhbHJlYWR5IGV4aXN0cy5cIik7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICByZXR1cm4gdXNlcklkO1xuICB9O1xuXG4gIC8vIEhlbHBlciBmdW5jdGlvbjogcmV0dXJucyBmYWxzZSBpZiBlbWFpbCBkb2VzIG5vdCBtYXRjaCBjb21wYW55IGRvbWFpbiBmcm9tXG4gIC8vIHRoZSBjb25maWd1cmF0aW9uLlxuICBfdGVzdEVtYWlsRG9tYWluKGVtYWlsKSB7XG4gICAgY29uc3QgZG9tYWluID0gdGhpcy5fb3B0aW9ucy5yZXN0cmljdENyZWF0aW9uQnlFbWFpbERvbWFpbjtcblxuICAgIHJldHVybiAhZG9tYWluIHx8XG4gICAgICAodHlwZW9mIGRvbWFpbiA9PT0gJ2Z1bmN0aW9uJyAmJiBkb21haW4oZW1haWwpKSB8fFxuICAgICAgKHR5cGVvZiBkb21haW4gPT09ICdzdHJpbmcnICYmXG4gICAgICAgIChuZXcgUmVnRXhwKGBAJHtNZXRlb3IuX2VzY2FwZVJlZ0V4cChkb21haW4pfSRgLCAnaScpKS50ZXN0KGVtYWlsKSk7XG4gIH07XG5cbiAgLy8vXG4gIC8vLyBDTEVBTiBVUCBGT1IgYGxvZ291dE90aGVyQ2xpZW50c2BcbiAgLy8vXG5cbiAgX2RlbGV0ZVNhdmVkVG9rZW5zRm9yVXNlcih1c2VySWQsIHRva2Vuc1RvRGVsZXRlKSB7XG4gICAgaWYgKHRva2Vuc1RvRGVsZXRlKSB7XG4gICAgICB0aGlzLnVzZXJzLnVwZGF0ZSh1c2VySWQsIHtcbiAgICAgICAgJHVuc2V0OiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUuaGF2ZUxvZ2luVG9rZW5zVG9EZWxldGVcIjogMSxcbiAgICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1RvRGVsZXRlXCI6IDFcbiAgICAgICAgfSxcbiAgICAgICAgJHB1bGxBbGw6IHtcbiAgICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vuc1wiOiB0b2tlbnNUb0RlbGV0ZVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cbiAgX2RlbGV0ZVNhdmVkVG9rZW5zRm9yQWxsVXNlcnNPblN0YXJ0dXAoKSB7XG4gICAgLy8gSWYgd2UgZmluZCB1c2VycyB3aG8gaGF2ZSBzYXZlZCB0b2tlbnMgdG8gZGVsZXRlIG9uIHN0YXJ0dXAsIGRlbGV0ZVxuICAgIC8vIHRoZW0gbm93LiBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHNlcnZlciBjb3VsZCBoYXZlIGNyYXNoZWQgYW5kIGNvbWVcbiAgICAvLyBiYWNrIHVwIGJlZm9yZSBuZXcgdG9rZW5zIGFyZSBmb3VuZCBpbiBsb2NhbFN0b3JhZ2UsIGJ1dCB0aGlzXG4gICAgLy8gc2hvdWxkbid0IGhhcHBlbiB2ZXJ5IG9mdGVuLiBXZSBzaG91bGRuJ3QgcHV0IGEgZGVsYXkgaGVyZSBiZWNhdXNlXG4gICAgLy8gdGhhdCB3b3VsZCBnaXZlIGEgbG90IG9mIHBvd2VyIHRvIGFuIGF0dGFja2VyIHdpdGggYSBzdG9sZW4gbG9naW5cbiAgICAvLyB0b2tlbiBhbmQgdGhlIGFiaWxpdHkgdG8gY3Jhc2ggdGhlIHNlcnZlci5cbiAgICBNZXRlb3Iuc3RhcnR1cCgoKSA9PiB7XG4gICAgICB0aGlzLnVzZXJzLmZpbmQoe1xuICAgICAgICBcInNlcnZpY2VzLnJlc3VtZS5oYXZlTG9naW5Ub2tlbnNUb0RlbGV0ZVwiOiB0cnVlXG4gICAgICB9LCB7ZmllbGRzOiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNUb0RlbGV0ZVwiOiAxXG4gICAgICAgIH19KS5mb3JFYWNoKHVzZXIgPT4ge1xuICAgICAgICB0aGlzLl9kZWxldGVTYXZlZFRva2Vuc0ZvclVzZXIoXG4gICAgICAgICAgdXNlci5faWQsXG4gICAgICAgICAgdXNlci5zZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNUb0RlbGV0ZVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8vXG4gIC8vLyBNQU5BR0lORyBVU0VSIE9CSkVDVFNcbiAgLy8vXG5cbiAgLy8gVXBkYXRlcyBvciBjcmVhdGVzIGEgdXNlciBhZnRlciB3ZSBhdXRoZW50aWNhdGUgd2l0aCBhIDNyZCBwYXJ0eS5cbiAgLy9cbiAgLy8gQHBhcmFtIHNlcnZpY2VOYW1lIHtTdHJpbmd9IFNlcnZpY2UgbmFtZSAoZWcsIHR3aXR0ZXIpLlxuICAvLyBAcGFyYW0gc2VydmljZURhdGEge09iamVjdH0gRGF0YSB0byBzdG9yZSBpbiB0aGUgdXNlcidzIHJlY29yZFxuICAvLyAgICAgICAgdW5kZXIgc2VydmljZXNbc2VydmljZU5hbWVdLiBNdXN0IGluY2x1ZGUgYW4gXCJpZFwiIGZpZWxkXG4gIC8vICAgICAgICB3aGljaCBpcyBhIHVuaXF1ZSBpZGVudGlmaWVyIGZvciB0aGUgdXNlciBpbiB0aGUgc2VydmljZS5cbiAgLy8gQHBhcmFtIG9wdGlvbnMge09iamVjdCwgb3B0aW9uYWx9IE90aGVyIG9wdGlvbnMgdG8gcGFzcyB0byBpbnNlcnRVc2VyRG9jXG4gIC8vICAgICAgICAoZWcsIHByb2ZpbGUpXG4gIC8vIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHRva2VuIGFuZCBpZCBrZXlzLCBsaWtlIHRoZSByZXN1bHRcbiAgLy8gICAgICAgIG9mIHRoZSBcImxvZ2luXCIgbWV0aG9kLlxuICAvL1xuICB1cGRhdGVPckNyZWF0ZVVzZXJGcm9tRXh0ZXJuYWxTZXJ2aWNlKFxuICAgIHNlcnZpY2VOYW1lLFxuICAgIHNlcnZpY2VEYXRhLFxuICAgIG9wdGlvbnNcbiAgKSB7XG4gICAgb3B0aW9ucyA9IHsgLi4ub3B0aW9ucyB9O1xuXG4gICAgaWYgKHNlcnZpY2VOYW1lID09PSBcInBhc3N3b3JkXCIgfHwgc2VydmljZU5hbWUgPT09IFwicmVzdW1lXCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJDYW4ndCB1c2UgdXBkYXRlT3JDcmVhdGVVc2VyRnJvbUV4dGVybmFsU2VydmljZSB3aXRoIGludGVybmFsIHNlcnZpY2UgXCJcbiAgICAgICAgKyBzZXJ2aWNlTmFtZSk7XG4gICAgfVxuICAgIGlmICghaGFzT3duLmNhbGwoc2VydmljZURhdGEsICdpZCcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBTZXJ2aWNlIGRhdGEgZm9yIHNlcnZpY2UgJHtzZXJ2aWNlTmFtZX0gbXVzdCBpbmNsdWRlIGlkYCk7XG4gICAgfVxuXG4gICAgLy8gTG9vayBmb3IgYSB1c2VyIHdpdGggdGhlIGFwcHJvcHJpYXRlIHNlcnZpY2UgdXNlciBpZC5cbiAgICBjb25zdCBzZWxlY3RvciA9IHt9O1xuICAgIGNvbnN0IHNlcnZpY2VJZEtleSA9IGBzZXJ2aWNlcy4ke3NlcnZpY2VOYW1lfS5pZGA7XG5cbiAgICAvLyBYWFggVGVtcG9yYXJ5IHNwZWNpYWwgY2FzZSBmb3IgVHdpdHRlci4gKElzc3VlICM2MjkpXG4gICAgLy8gICBUaGUgc2VydmljZURhdGEuaWQgd2lsbCBiZSBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhbiBpbnRlZ2VyLlxuICAgIC8vICAgV2Ugd2FudCBpdCB0byBtYXRjaCBlaXRoZXIgYSBzdG9yZWQgc3RyaW5nIG9yIGludCByZXByZXNlbnRhdGlvbi5cbiAgICAvLyAgIFRoaXMgaXMgdG8gY2F0ZXIgdG8gZWFybGllciB2ZXJzaW9ucyBvZiBNZXRlb3Igc3RvcmluZyB0d2l0dGVyXG4gICAgLy8gICB1c2VyIElEcyBpbiBudW1iZXIgZm9ybSwgYW5kIHJlY2VudCB2ZXJzaW9ucyBzdG9yaW5nIHRoZW0gYXMgc3RyaW5ncy5cbiAgICAvLyAgIFRoaXMgY2FuIGJlIHJlbW92ZWQgb25jZSBtaWdyYXRpb24gdGVjaG5vbG9neSBpcyBpbiBwbGFjZSwgYW5kIHR3aXR0ZXJcbiAgICAvLyAgIHVzZXJzIHN0b3JlZCB3aXRoIGludGVnZXIgSURzIGhhdmUgYmVlbiBtaWdyYXRlZCB0byBzdHJpbmcgSURzLlxuICAgIGlmIChzZXJ2aWNlTmFtZSA9PT0gXCJ0d2l0dGVyXCIgJiYgIWlzTmFOKHNlcnZpY2VEYXRhLmlkKSkge1xuICAgICAgc2VsZWN0b3JbXCIkb3JcIl0gPSBbe30se31dO1xuICAgICAgc2VsZWN0b3JbXCIkb3JcIl1bMF1bc2VydmljZUlkS2V5XSA9IHNlcnZpY2VEYXRhLmlkO1xuICAgICAgc2VsZWN0b3JbXCIkb3JcIl1bMV1bc2VydmljZUlkS2V5XSA9IHBhcnNlSW50KHNlcnZpY2VEYXRhLmlkLCAxMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNlbGVjdG9yW3NlcnZpY2VJZEtleV0gPSBzZXJ2aWNlRGF0YS5pZDtcbiAgICB9XG5cbiAgICBsZXQgdXNlciA9IHRoaXMudXNlcnMuZmluZE9uZShzZWxlY3Rvciwge2ZpZWxkczogdGhpcy5fb3B0aW9ucy5kZWZhdWx0RmllbGRTZWxlY3Rvcn0pO1xuXG4gICAgLy8gQ2hlY2sgdG8gc2VlIGlmIHRoZSBkZXZlbG9wZXIgaGFzIGEgY3VzdG9tIHdheSB0byBmaW5kIHRoZSB1c2VyIG91dHNpZGVcbiAgICAvLyBvZiB0aGUgZ2VuZXJhbCBzZWxlY3RvcnMgYWJvdmUuXG4gICAgaWYgKCF1c2VyICYmIHRoaXMuX2FkZGl0aW9uYWxGaW5kVXNlck9uRXh0ZXJuYWxMb2dpbikge1xuICAgICAgdXNlciA9IHRoaXMuX2FkZGl0aW9uYWxGaW5kVXNlck9uRXh0ZXJuYWxMb2dpbih7c2VydmljZU5hbWUsIHNlcnZpY2VEYXRhLCBvcHRpb25zfSlcbiAgICB9XG5cbiAgICAvLyBCZWZvcmUgY29udGludWluZywgcnVuIHVzZXIgaG9vayB0byBzZWUgaWYgd2Ugc2hvdWxkIGNvbnRpbnVlXG4gICAgaWYgKHRoaXMuX2JlZm9yZUV4dGVybmFsTG9naW5Ib29rICYmICF0aGlzLl9iZWZvcmVFeHRlcm5hbExvZ2luSG9vayhzZXJ2aWNlTmFtZSwgc2VydmljZURhdGEsIHVzZXIpKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJMb2dpbiBmb3JiaWRkZW5cIik7XG4gICAgfVxuXG4gICAgLy8gV2hlbiBjcmVhdGluZyBhIG5ldyB1c2VyIHdlIHBhc3MgdGhyb3VnaCBhbGwgb3B0aW9ucy4gV2hlbiB1cGRhdGluZyBhblxuICAgIC8vIGV4aXN0aW5nIHVzZXIsIGJ5IGRlZmF1bHQgd2Ugb25seSBwcm9jZXNzL3Bhc3MgdGhyb3VnaCB0aGUgc2VydmljZURhdGFcbiAgICAvLyAoZWcsIHNvIHRoYXQgd2Uga2VlcCBhbiB1bmV4cGlyZWQgYWNjZXNzIHRva2VuIGFuZCBkb24ndCBjYWNoZSBvbGQgZW1haWxcbiAgICAvLyBhZGRyZXNzZXMgaW4gc2VydmljZURhdGEuZW1haWwpLiBUaGUgb25FeHRlcm5hbExvZ2luIGhvb2sgY2FuIGJlIHVzZWQgd2hlblxuICAgIC8vIGNyZWF0aW5nIG9yIHVwZGF0aW5nIGEgdXNlciwgdG8gbW9kaWZ5IG9yIHBhc3MgdGhyb3VnaCBtb3JlIG9wdGlvbnMgYXNcbiAgICAvLyBuZWVkZWQuXG4gICAgbGV0IG9wdHMgPSB1c2VyID8ge30gOiBvcHRpb25zO1xuICAgIGlmICh0aGlzLl9vbkV4dGVybmFsTG9naW5Ib29rKSB7XG4gICAgICBvcHRzID0gdGhpcy5fb25FeHRlcm5hbExvZ2luSG9vayhvcHRpb25zLCB1c2VyKTtcbiAgICB9XG5cbiAgICBpZiAodXNlcikge1xuICAgICAgcGluRW5jcnlwdGVkRmllbGRzVG9Vc2VyKHNlcnZpY2VEYXRhLCB1c2VyLl9pZCk7XG5cbiAgICAgIGxldCBzZXRBdHRycyA9IHt9O1xuICAgICAgT2JqZWN0LmtleXMoc2VydmljZURhdGEpLmZvckVhY2goa2V5ID0+XG4gICAgICAgIHNldEF0dHJzW2BzZXJ2aWNlcy4ke3NlcnZpY2VOYW1lfS4ke2tleX1gXSA9IHNlcnZpY2VEYXRhW2tleV1cbiAgICAgICk7XG5cbiAgICAgIC8vIFhYWCBNYXliZSB3ZSBzaG91bGQgcmUtdXNlIHRoZSBzZWxlY3RvciBhYm92ZSBhbmQgbm90aWNlIGlmIHRoZSB1cGRhdGVcbiAgICAgIC8vICAgICB0b3VjaGVzIG5vdGhpbmc/XG4gICAgICBzZXRBdHRycyA9IHsgLi4uc2V0QXR0cnMsIC4uLm9wdHMgfTtcbiAgICAgIHRoaXMudXNlcnMudXBkYXRlKHVzZXIuX2lkLCB7XG4gICAgICAgICRzZXQ6IHNldEF0dHJzXG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogc2VydmljZU5hbWUsXG4gICAgICAgIHVzZXJJZDogdXNlci5faWRcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENyZWF0ZSBhIG5ldyB1c2VyIHdpdGggdGhlIHNlcnZpY2UgZGF0YS5cbiAgICAgIHVzZXIgPSB7c2VydmljZXM6IHt9fTtcbiAgICAgIHVzZXIuc2VydmljZXNbc2VydmljZU5hbWVdID0gc2VydmljZURhdGE7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBzZXJ2aWNlTmFtZSxcbiAgICAgICAgdXNlcklkOiB0aGlzLmluc2VydFVzZXJEb2Mob3B0cywgdXNlcilcbiAgICAgIH07XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBSZW1vdmVzIGRlZmF1bHQgcmF0ZSBsaW1pdGluZyBydWxlXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAgICovXG4gIHJlbW92ZURlZmF1bHRSYXRlTGltaXQoKSB7XG4gICAgY29uc3QgcmVzcCA9IEREUFJhdGVMaW1pdGVyLnJlbW92ZVJ1bGUodGhpcy5kZWZhdWx0UmF0ZUxpbWl0ZXJSdWxlSWQpO1xuICAgIHRoaXMuZGVmYXVsdFJhdGVMaW1pdGVyUnVsZUlkID0gbnVsbDtcbiAgICByZXR1cm4gcmVzcDtcbiAgfTtcblxuICAvKipcbiAgICogQHN1bW1hcnkgQWRkIGEgZGVmYXVsdCBydWxlIG9mIGxpbWl0aW5nIGxvZ2lucywgY3JlYXRpbmcgbmV3IHVzZXJzIGFuZCBwYXNzd29yZCByZXNldFxuICAgKiB0byA1IHRpbWVzIGV2ZXJ5IDEwIHNlY29uZHMgcGVyIGNvbm5lY3Rpb24uXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAgICovXG4gIGFkZERlZmF1bHRSYXRlTGltaXQoKSB7XG4gICAgaWYgKCF0aGlzLmRlZmF1bHRSYXRlTGltaXRlclJ1bGVJZCkge1xuICAgICAgdGhpcy5kZWZhdWx0UmF0ZUxpbWl0ZXJSdWxlSWQgPSBERFBSYXRlTGltaXRlci5hZGRSdWxlKHtcbiAgICAgICAgdXNlcklkOiBudWxsLFxuICAgICAgICBjbGllbnRBZGRyZXNzOiBudWxsLFxuICAgICAgICB0eXBlOiAnbWV0aG9kJyxcbiAgICAgICAgbmFtZTogbmFtZSA9PiBbJ2xvZ2luJywgJ2NyZWF0ZVVzZXInLCAncmVzZXRQYXNzd29yZCcsICdmb3Jnb3RQYXNzd29yZCddXG4gICAgICAgICAgLmluY2x1ZGVzKG5hbWUpLFxuICAgICAgICBjb25uZWN0aW9uSWQ6IChjb25uZWN0aW9uSWQpID0+IHRydWUsXG4gICAgICB9LCA1LCAxMDAwMCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBAc3VtbWFyeSBDcmVhdGVzIG9wdGlvbnMgZm9yIGVtYWlsIHNlbmRpbmcgZm9yIHJlc2V0IHBhc3N3b3JkIGFuZCBlbnJvbGwgYWNjb3VudCBlbWFpbHMuXG4gICAqIFlvdSBjYW4gdXNlIHRoaXMgZnVuY3Rpb24gd2hlbiBjdXN0b21pemluZyBhIHJlc2V0IHBhc3N3b3JkIG9yIGVucm9sbCBhY2NvdW50IGVtYWlsIHNlbmRpbmcuXG4gICAqIEBsb2N1cyBTZXJ2ZXJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVtYWlsIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIncyB0byBzZW5kIHRoZSBlbWFpbCB0by5cbiAgICogQHBhcmFtIHtPYmplY3R9IHVzZXIgVGhlIHVzZXIgb2JqZWN0IHRvIGdlbmVyYXRlIG9wdGlvbnMgZm9yLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gdXJsIFVSTCB0byB3aGljaCB1c2VyIGlzIGRpcmVjdGVkIHRvIGNvbmZpcm0gdGhlIGVtYWlsLlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcmVhc29uIGByZXNldFBhc3N3b3JkYCBvciBgZW5yb2xsQWNjb3VudGAuXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IE9wdGlvbnMgd2hpY2ggY2FuIGJlIHBhc3NlZCB0byBgRW1haWwuc2VuZGAuXG4gICAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gICAqL1xuICBnZW5lcmF0ZU9wdGlvbnNGb3JFbWFpbChlbWFpbCwgdXNlciwgdXJsLCByZWFzb24sIGV4dHJhID0ge30pe1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICB0bzogZW1haWwsXG4gICAgICBmcm9tOiB0aGlzLmVtYWlsVGVtcGxhdGVzW3JlYXNvbl0uZnJvbVxuICAgICAgICA/IHRoaXMuZW1haWxUZW1wbGF0ZXNbcmVhc29uXS5mcm9tKHVzZXIpXG4gICAgICAgIDogdGhpcy5lbWFpbFRlbXBsYXRlcy5mcm9tLFxuICAgICAgc3ViamVjdDogdGhpcy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLnN1YmplY3QodXNlciwgdXJsLCBleHRyYSksXG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLnRleHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMudGV4dCA9IHRoaXMuZW1haWxUZW1wbGF0ZXNbcmVhc29uXS50ZXh0KHVzZXIsIHVybCwgZXh0cmEpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5lbWFpbFRlbXBsYXRlc1tyZWFzb25dLmh0bWwgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9wdGlvbnMuaHRtbCA9IHRoaXMuZW1haWxUZW1wbGF0ZXNbcmVhc29uXS5odG1sKHVzZXIsIHVybCwgZXh0cmEpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgdGhpcy5lbWFpbFRlbXBsYXRlcy5oZWFkZXJzID09PSAnb2JqZWN0Jykge1xuICAgICAgb3B0aW9ucy5oZWFkZXJzID0gdGhpcy5lbWFpbFRlbXBsYXRlcy5oZWFkZXJzO1xuICAgIH1cblxuICAgIHJldHVybiBvcHRpb25zO1xuICB9O1xuXG4gIF9jaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMoXG4gICAgZmllbGROYW1lLFxuICAgIGRpc3BsYXlOYW1lLFxuICAgIGZpZWxkVmFsdWUsXG4gICAgb3duVXNlcklkXG4gICkge1xuICAgIC8vIFNvbWUgdGVzdHMgbmVlZCB0aGUgYWJpbGl0eSB0byBhZGQgdXNlcnMgd2l0aCB0aGUgc2FtZSBjYXNlIGluc2Vuc2l0aXZlXG4gICAgLy8gdmFsdWUsIGhlbmNlIHRoZSBfc2tpcENhc2VJbnNlbnNpdGl2ZUNoZWNrc0ZvclRlc3QgY2hlY2tcbiAgICBjb25zdCBza2lwQ2hlY2sgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoXG4gICAgICB0aGlzLl9za2lwQ2FzZUluc2Vuc2l0aXZlQ2hlY2tzRm9yVGVzdCxcbiAgICAgIGZpZWxkVmFsdWVcbiAgICApO1xuXG4gICAgaWYgKGZpZWxkVmFsdWUgJiYgIXNraXBDaGVjaykge1xuICAgICAgY29uc3QgbWF0Y2hlZFVzZXJzID0gTWV0ZW9yLnVzZXJzXG4gICAgICAgIC5maW5kKFxuICAgICAgICAgIHRoaXMuX3NlbGVjdG9yRm9yRmFzdENhc2VJbnNlbnNpdGl2ZUxvb2t1cChmaWVsZE5hbWUsIGZpZWxkVmFsdWUpLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZpZWxkczogeyBfaWQ6IDEgfSxcbiAgICAgICAgICAgIC8vIHdlIG9ubHkgbmVlZCBhIG1heGltdW0gb2YgMiB1c2VycyBmb3IgdGhlIGxvZ2ljIGJlbG93IHRvIHdvcmtcbiAgICAgICAgICAgIGxpbWl0OiAyLFxuICAgICAgICAgIH1cbiAgICAgICAgKVxuICAgICAgICAuZmV0Y2goKTtcblxuICAgICAgaWYgKFxuICAgICAgICBtYXRjaGVkVXNlcnMubGVuZ3RoID4gMCAmJlxuICAgICAgICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgdXNlcklkIHlldCwgYW55IG1hdGNoIHdlIGZpbmQgaXMgYSBkdXBsaWNhdGVcbiAgICAgICAgKCFvd25Vc2VySWQgfHxcbiAgICAgICAgICAvLyBPdGhlcndpc2UsIGNoZWNrIHRvIHNlZSBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgbWF0Y2hlcyBvciBhIG1hdGNoXG4gICAgICAgICAgLy8gdGhhdCBpcyBub3QgdXNcbiAgICAgICAgICBtYXRjaGVkVXNlcnMubGVuZ3RoID4gMSB8fCBtYXRjaGVkVXNlcnNbMF0uX2lkICE9PSBvd25Vc2VySWQpXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5faGFuZGxlRXJyb3IoYCR7ZGlzcGxheU5hbWV9IGFscmVhZHkgZXhpc3RzLmApO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBfY3JlYXRlVXNlckNoZWNraW5nRHVwbGljYXRlcyh7IHVzZXIsIGVtYWlsLCB1c2VybmFtZSwgb3B0aW9ucyB9KSB7XG4gICAgY29uc3QgbmV3VXNlciA9IHtcbiAgICAgIC4uLnVzZXIsXG4gICAgICAuLi4odXNlcm5hbWUgPyB7IHVzZXJuYW1lIH0gOiB7fSksXG4gICAgICAuLi4oZW1haWwgPyB7IGVtYWlsczogW3sgYWRkcmVzczogZW1haWwsIHZlcmlmaWVkOiBmYWxzZSB9XSB9IDoge30pLFxuICAgIH07XG5cbiAgICAvLyBQZXJmb3JtIGEgY2FzZSBpbnNlbnNpdGl2ZSBjaGVjayBiZWZvcmUgaW5zZXJ0XG4gICAgdGhpcy5fY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzKCd1c2VybmFtZScsICdVc2VybmFtZScsIHVzZXJuYW1lKTtcbiAgICB0aGlzLl9jaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMoJ2VtYWlscy5hZGRyZXNzJywgJ0VtYWlsJywgZW1haWwpO1xuXG4gICAgY29uc3QgdXNlcklkID0gdGhpcy5pbnNlcnRVc2VyRG9jKG9wdGlvbnMsIG5ld1VzZXIpO1xuICAgIC8vIFBlcmZvcm0gYW5vdGhlciBjaGVjayBhZnRlciBpbnNlcnQsIGluIGNhc2UgYSBtYXRjaGluZyB1c2VyIGhhcyBiZWVuXG4gICAgLy8gaW5zZXJ0ZWQgaW4gdGhlIG1lYW50aW1lXG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLCAnVXNlcm5hbWUnLCB1c2VybmFtZSwgdXNlcklkKTtcbiAgICAgIHRoaXMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLCAnRW1haWwnLCBlbWFpbCwgdXNlcklkKTtcbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgLy8gUmVtb3ZlIGluc2VydGVkIHVzZXIgaWYgdGhlIGNoZWNrIGZhaWxzXG4gICAgICBNZXRlb3IudXNlcnMucmVtb3ZlKHVzZXJJZCk7XG4gICAgICB0aHJvdyBleDtcbiAgICB9XG4gICAgcmV0dXJuIHVzZXJJZDtcbiAgfVxuXG4gIF9oYW5kbGVFcnJvciA9IChtc2csIHRocm93RXJyb3IgPSB0cnVlLCBlcnJvckNvZGUgPSA0MDMpID0+IHtcbiAgICBjb25zdCBlcnJvciA9IG5ldyBNZXRlb3IuRXJyb3IoXG4gICAgICBlcnJvckNvZGUsXG4gICAgICB0aGlzLl9vcHRpb25zLmFtYmlndW91c0Vycm9yTWVzc2FnZXNcbiAgICAgICAgPyBcIlNvbWV0aGluZyB3ZW50IHdyb25nLiBQbGVhc2UgY2hlY2sgeW91ciBjcmVkZW50aWFscy5cIlxuICAgICAgICA6IG1zZ1xuICAgICk7XG4gICAgaWYgKHRocm93RXJyb3IpIHtcbiAgICAgIHRocm93IGVycm9yO1xuICAgIH1cbiAgICByZXR1cm4gZXJyb3I7XG4gIH1cblxuICBfdXNlclF1ZXJ5VmFsaWRhdG9yID0gTWF0Y2guV2hlcmUodXNlciA9PiB7XG4gICAgY2hlY2sodXNlciwge1xuICAgICAgaWQ6IE1hdGNoLk9wdGlvbmFsKE5vbkVtcHR5U3RyaW5nKSxcbiAgICAgIHVzZXJuYW1lOiBNYXRjaC5PcHRpb25hbChOb25FbXB0eVN0cmluZyksXG4gICAgICBlbWFpbDogTWF0Y2guT3B0aW9uYWwoTm9uRW1wdHlTdHJpbmcpXG4gICAgfSk7XG4gICAgaWYgKE9iamVjdC5rZXlzKHVzZXIpLmxlbmd0aCAhPT0gMSlcbiAgICAgIHRocm93IG5ldyBNYXRjaC5FcnJvcihcIlVzZXIgcHJvcGVydHkgbXVzdCBoYXZlIGV4YWN0bHkgb25lIGZpZWxkXCIpO1xuICAgIHJldHVybiB0cnVlO1xuICB9KTtcblxufVxuXG4vLyBHaXZlIGVhY2ggbG9naW4gaG9vayBjYWxsYmFjayBhIGZyZXNoIGNsb25lZCBjb3B5IG9mIHRoZSBhdHRlbXB0XG4vLyBvYmplY3QsIGJ1dCBkb24ndCBjbG9uZSB0aGUgY29ubmVjdGlvbi5cbi8vXG5jb25zdCBjbG9uZUF0dGVtcHRXaXRoQ29ubmVjdGlvbiA9IChjb25uZWN0aW9uLCBhdHRlbXB0KSA9PiB7XG4gIGNvbnN0IGNsb25lZEF0dGVtcHQgPSBFSlNPTi5jbG9uZShhdHRlbXB0KTtcbiAgY2xvbmVkQXR0ZW1wdC5jb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgcmV0dXJuIGNsb25lZEF0dGVtcHQ7XG59O1xuXG5jb25zdCB0cnlMb2dpbk1ldGhvZCA9IGFzeW5jICh0eXBlLCBmbikgPT4ge1xuICBsZXQgcmVzdWx0O1xuICB0cnkge1xuICAgIHJlc3VsdCA9IGF3YWl0IGZuKCk7XG4gIH1cbiAgY2F0Y2ggKGUpIHtcbiAgICByZXN1bHQgPSB7ZXJyb3I6IGV9O1xuICB9XG5cbiAgaWYgKHJlc3VsdCAmJiAhcmVzdWx0LnR5cGUgJiYgdHlwZSlcbiAgICByZXN1bHQudHlwZSA9IHR5cGU7XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn07XG5cbmNvbnN0IHNldHVwRGVmYXVsdExvZ2luSGFuZGxlcnMgPSBhY2NvdW50cyA9PiB7XG4gIGFjY291bnRzLnJlZ2lzdGVyTG9naW5IYW5kbGVyKFwicmVzdW1lXCIsIGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgcmV0dXJuIGRlZmF1bHRSZXN1bWVMb2dpbkhhbmRsZXIuY2FsbCh0aGlzLCBhY2NvdW50cywgb3B0aW9ucyk7XG4gIH0pO1xufTtcblxuLy8gTG9naW4gaGFuZGxlciBmb3IgcmVzdW1lIHRva2Vucy5cbmNvbnN0IGRlZmF1bHRSZXN1bWVMb2dpbkhhbmRsZXIgPSAoYWNjb3VudHMsIG9wdGlvbnMpID0+IHtcbiAgaWYgKCFvcHRpb25zLnJlc3VtZSlcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuXG4gIGNoZWNrKG9wdGlvbnMucmVzdW1lLCBTdHJpbmcpO1xuXG4gIGNvbnN0IGhhc2hlZFRva2VuID0gYWNjb3VudHMuX2hhc2hMb2dpblRva2VuKG9wdGlvbnMucmVzdW1lKTtcblxuICAvLyBGaXJzdCBsb29rIGZvciBqdXN0IHRoZSBuZXctc3R5bGUgaGFzaGVkIGxvZ2luIHRva2VuLCB0byBhdm9pZFxuICAvLyBzZW5kaW5nIHRoZSB1bmhhc2hlZCB0b2tlbiB0byB0aGUgZGF0YWJhc2UgaW4gYSBxdWVyeSBpZiB3ZSBkb24ndFxuICAvLyBuZWVkIHRvLlxuICBsZXQgdXNlciA9IGFjY291bnRzLnVzZXJzLmZpbmRPbmUoXG4gICAge1wic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLmhhc2hlZFRva2VuXCI6IGhhc2hlZFRva2VufSxcbiAgICB7ZmllbGRzOiB7XCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuJFwiOiAxfX0pO1xuXG4gIGlmICghIHVzZXIpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgZmluZCB0aGUgaGFzaGVkIGxvZ2luIHRva2VuLCB0cnkgYWxzbyBsb29raW5nIGZvclxuICAgIC8vIHRoZSBvbGQtc3R5bGUgdW5oYXNoZWQgdG9rZW4uICBCdXQgd2UgbmVlZCB0byBsb29rIGZvciBlaXRoZXJcbiAgICAvLyB0aGUgb2xkLXN0eWxlIHRva2VuIE9SIHRoZSBuZXctc3R5bGUgdG9rZW4sIGJlY2F1c2UgYW5vdGhlclxuICAgIC8vIGNsaWVudCBjb25uZWN0aW9uIGxvZ2dpbmcgaW4gc2ltdWx0YW5lb3VzbHkgbWlnaHQgaGF2ZSBhbHJlYWR5XG4gICAgLy8gY29udmVydGVkIHRoZSB0b2tlbi5cbiAgICB1c2VyID0gYWNjb3VudHMudXNlcnMuZmluZE9uZSh7XG4gICAgICAgICRvcjogW1xuICAgICAgICAgIHtcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlbn0sXG4gICAgICAgICAge1wic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zLnRva2VuXCI6IG9wdGlvbnMucmVzdW1lfVxuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgLy8gTm90ZTogQ2Fubm90IHVzZSAuLi5sb2dpblRva2Vucy4kIHBvc2l0aW9uYWwgb3BlcmF0b3Igd2l0aCAkb3IgcXVlcnkuXG4gICAgICB7ZmllbGRzOiB7XCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjogMX19KTtcbiAgfVxuXG4gIGlmICghIHVzZXIpXG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJZb3UndmUgYmVlbiBsb2dnZWQgb3V0IGJ5IHRoZSBzZXJ2ZXIuIFBsZWFzZSBsb2cgaW4gYWdhaW4uXCIpXG4gICAgfTtcblxuICAvLyBGaW5kIHRoZSB0b2tlbiwgd2hpY2ggd2lsbCBlaXRoZXIgYmUgYW4gb2JqZWN0IHdpdGggZmllbGRzXG4gIC8vIHtoYXNoZWRUb2tlbiwgd2hlbn0gZm9yIGEgaGFzaGVkIHRva2VuIG9yIHt0b2tlbiwgd2hlbn0gZm9yIGFuXG4gIC8vIHVuaGFzaGVkIHRva2VuLlxuICBsZXQgb2xkVW5oYXNoZWRTdHlsZVRva2VuO1xuICBsZXQgdG9rZW4gPSB1c2VyLnNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5maW5kKHRva2VuID0+XG4gICAgdG9rZW4uaGFzaGVkVG9rZW4gPT09IGhhc2hlZFRva2VuXG4gICk7XG4gIGlmICh0b2tlbikge1xuICAgIG9sZFVuaGFzaGVkU3R5bGVUb2tlbiA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIHRva2VuID0gdXNlci5zZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuZmluZCh0b2tlbiA9PlxuICAgICAgdG9rZW4udG9rZW4gPT09IG9wdGlvbnMucmVzdW1lXG4gICAgKTtcbiAgICBvbGRVbmhhc2hlZFN0eWxlVG9rZW4gPSB0cnVlO1xuICB9XG5cbiAgY29uc3QgdG9rZW5FeHBpcmVzID0gYWNjb3VudHMuX3Rva2VuRXhwaXJhdGlvbih0b2tlbi53aGVuKTtcbiAgaWYgKG5ldyBEYXRlKCkgPj0gdG9rZW5FeHBpcmVzKVxuICAgIHJldHVybiB7XG4gICAgICB1c2VySWQ6IHVzZXIuX2lkLFxuICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIllvdXIgc2Vzc2lvbiBoYXMgZXhwaXJlZC4gUGxlYXNlIGxvZyBpbiBhZ2Fpbi5cIilcbiAgICB9O1xuXG4gIC8vIFVwZGF0ZSB0byBhIGhhc2hlZCB0b2tlbiB3aGVuIGFuIHVuaGFzaGVkIHRva2VuIGlzIGVuY291bnRlcmVkLlxuICBpZiAob2xkVW5oYXNoZWRTdHlsZVRva2VuKSB7XG4gICAgLy8gT25seSBhZGQgdGhlIG5ldyBoYXNoZWQgdG9rZW4gaWYgdGhlIG9sZCB1bmhhc2hlZCB0b2tlbiBzdGlsbFxuICAgIC8vIGV4aXN0cyAodGhpcyBhdm9pZHMgcmVzdXJyZWN0aW5nIHRoZSB0b2tlbiBpZiBpdCB3YXMgZGVsZXRlZFxuICAgIC8vIGFmdGVyIHdlIHJlYWQgaXQpLiAgVXNpbmcgJGFkZFRvU2V0IGF2b2lkcyBnZXR0aW5nIGFuIGluZGV4XG4gICAgLy8gZXJyb3IgaWYgYW5vdGhlciBjbGllbnQgbG9nZ2luZyBpbiBzaW11bHRhbmVvdXNseSBoYXMgYWxyZWFkeVxuICAgIC8vIGluc2VydGVkIHRoZSBuZXcgaGFzaGVkIHRva2VuLlxuICAgIGFjY291bnRzLnVzZXJzLnVwZGF0ZShcbiAgICAgIHtcbiAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMudG9rZW5cIjogb3B0aW9ucy5yZXN1bWVcbiAgICAgIH0sXG4gICAgICB7JGFkZFRvU2V0OiB7XG4gICAgICAgICAgXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnNcIjoge1xuICAgICAgICAgICAgXCJoYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlbixcbiAgICAgICAgICAgIFwid2hlblwiOiB0b2tlbi53aGVuXG4gICAgICAgICAgfVxuICAgICAgICB9fVxuICAgICk7XG5cbiAgICAvLyBSZW1vdmUgdGhlIG9sZCB0b2tlbiAqYWZ0ZXIqIGFkZGluZyB0aGUgbmV3LCBzaW5jZSBvdGhlcndpc2VcbiAgICAvLyBhbm90aGVyIGNsaWVudCB0cnlpbmcgdG8gbG9naW4gYmV0d2VlbiBvdXIgcmVtb3ZpbmcgdGhlIG9sZCBhbmRcbiAgICAvLyBhZGRpbmcgdGhlIG5ldyB3b3VsZG4ndCBmaW5kIGEgdG9rZW4gdG8gbG9naW4gd2l0aC5cbiAgICBhY2NvdW50cy51c2Vycy51cGRhdGUodXNlci5faWQsIHtcbiAgICAgICRwdWxsOiB7XG4gICAgICAgIFwic2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zXCI6IHsgXCJ0b2tlblwiOiBvcHRpb25zLnJlc3VtZSB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgc3RhbXBlZExvZ2luVG9rZW46IHtcbiAgICAgIHRva2VuOiBvcHRpb25zLnJlc3VtZSxcbiAgICAgIHdoZW46IHRva2VuLndoZW5cbiAgICB9XG4gIH07XG59O1xuXG5jb25zdCBleHBpcmVQYXNzd29yZFRva2VuID0gKFxuICBhY2NvdW50cyxcbiAgb2xkZXN0VmFsaWREYXRlLFxuICB0b2tlbkZpbHRlcixcbiAgdXNlcklkXG4pID0+IHtcbiAgLy8gYm9vbGVhbiB2YWx1ZSB1c2VkIHRvIGRldGVybWluZSBpZiB0aGlzIG1ldGhvZCB3YXMgY2FsbGVkIGZyb20gZW5yb2xsIGFjY291bnQgd29ya2Zsb3dcbiAgbGV0IGlzRW5yb2xsID0gZmFsc2U7XG4gIGNvbnN0IHVzZXJGaWx0ZXIgPSB1c2VySWQgPyB7X2lkOiB1c2VySWR9IDoge307XG4gIC8vIGNoZWNrIGlmIHRoaXMgbWV0aG9kIHdhcyBjYWxsZWQgZnJvbSBlbnJvbGwgYWNjb3VudCB3b3JrZmxvd1xuICBpZih0b2tlbkZpbHRlclsnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsLnJlYXNvbiddKSB7XG4gICAgaXNFbnJvbGwgPSB0cnVlO1xuICB9XG4gIGxldCByZXNldFJhbmdlT3IgPSB7XG4gICAgJG9yOiBbXG4gICAgICB7IFwic2VydmljZXMucGFzc3dvcmQucmVzZXQud2hlblwiOiB7ICRsdDogb2xkZXN0VmFsaWREYXRlIH0gfSxcbiAgICAgIHsgXCJzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC53aGVuXCI6IHsgJGx0OiArb2xkZXN0VmFsaWREYXRlIH0gfVxuICAgIF1cbiAgfTtcbiAgaWYoaXNFbnJvbGwpIHtcbiAgICByZXNldFJhbmdlT3IgPSB7XG4gICAgICAkb3I6IFtcbiAgICAgICAgeyBcInNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC53aGVuXCI6IHsgJGx0OiBvbGRlc3RWYWxpZERhdGUgfSB9LFxuICAgICAgICB7IFwic2VydmljZXMucGFzc3dvcmQuZW5yb2xsLndoZW5cIjogeyAkbHQ6ICtvbGRlc3RWYWxpZERhdGUgfSB9XG4gICAgICBdXG4gICAgfTtcbiAgfVxuICBjb25zdCBleHBpcmVGaWx0ZXIgPSB7ICRhbmQ6IFt0b2tlbkZpbHRlciwgcmVzZXRSYW5nZU9yXSB9O1xuICBpZihpc0Vucm9sbCkge1xuICAgIGFjY291bnRzLnVzZXJzLnVwZGF0ZSh7Li4udXNlckZpbHRlciwgLi4uZXhwaXJlRmlsdGVyfSwge1xuICAgICAgJHVuc2V0OiB7XG4gICAgICAgIFwic2VydmljZXMucGFzc3dvcmQuZW5yb2xsXCI6IFwiXCJcbiAgICAgIH1cbiAgICB9LCB7IG11bHRpOiB0cnVlIH0pO1xuICB9IGVsc2Uge1xuICAgIGFjY291bnRzLnVzZXJzLnVwZGF0ZSh7Li4udXNlckZpbHRlciwgLi4uZXhwaXJlRmlsdGVyfSwge1xuICAgICAgJHVuc2V0OiB7XG4gICAgICAgIFwic2VydmljZXMucGFzc3dvcmQucmVzZXRcIjogXCJcIlxuICAgICAgfVxuICAgIH0sIHsgbXVsdGk6IHRydWUgfSk7XG4gIH1cblxufTtcblxuY29uc3Qgc2V0RXhwaXJlVG9rZW5zSW50ZXJ2YWwgPSBhY2NvdW50cyA9PiB7XG4gIGFjY291bnRzLmV4cGlyZVRva2VuSW50ZXJ2YWwgPSBNZXRlb3Iuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgIGFjY291bnRzLl9leHBpcmVUb2tlbnMoKTtcbiAgICBhY2NvdW50cy5fZXhwaXJlUGFzc3dvcmRSZXNldFRva2VucygpO1xuICAgIGFjY291bnRzLl9leHBpcmVQYXNzd29yZEVucm9sbFRva2VucygpO1xuICB9LCBFWFBJUkVfVE9LRU5TX0lOVEVSVkFMX01TKTtcbn07XG5cbmNvbnN0IE9BdXRoRW5jcnlwdGlvbiA9IFBhY2thZ2VbXCJvYXV0aC1lbmNyeXB0aW9uXCJdPy5PQXV0aEVuY3J5cHRpb247XG5cbi8vIE9BdXRoIHNlcnZpY2UgZGF0YSBpcyB0ZW1wb3JhcmlseSBzdG9yZWQgaW4gdGhlIHBlbmRpbmcgY3JlZGVudGlhbHNcbi8vIGNvbGxlY3Rpb24gZHVyaW5nIHRoZSBvYXV0aCBhdXRoZW50aWNhdGlvbiBwcm9jZXNzLiAgU2Vuc2l0aXZlIGRhdGFcbi8vIHN1Y2ggYXMgYWNjZXNzIHRva2VucyBhcmUgZW5jcnlwdGVkIHdpdGhvdXQgdGhlIHVzZXIgaWQgYmVjYXVzZVxuLy8gd2UgZG9uJ3Qga25vdyB0aGUgdXNlciBpZCB5ZXQuICBXZSByZS1lbmNyeXB0IHRoZXNlIGZpZWxkcyB3aXRoIHRoZVxuLy8gdXNlciBpZCBpbmNsdWRlZCB3aGVuIHN0b3JpbmcgdGhlIHNlcnZpY2UgZGF0YSBwZXJtYW5lbnRseSBpblxuLy8gdGhlIHVzZXJzIGNvbGxlY3Rpb24uXG4vL1xuY29uc3QgcGluRW5jcnlwdGVkRmllbGRzVG9Vc2VyID0gKHNlcnZpY2VEYXRhLCB1c2VySWQpID0+IHtcbiAgT2JqZWN0LmtleXMoc2VydmljZURhdGEpLmZvckVhY2goa2V5ID0+IHtcbiAgICBsZXQgdmFsdWUgPSBzZXJ2aWNlRGF0YVtrZXldO1xuICAgIGlmIChPQXV0aEVuY3J5cHRpb24/LmlzU2VhbGVkKHZhbHVlKSlcbiAgICAgIHZhbHVlID0gT0F1dGhFbmNyeXB0aW9uLnNlYWwoT0F1dGhFbmNyeXB0aW9uLm9wZW4odmFsdWUpLCB1c2VySWQpO1xuICAgIHNlcnZpY2VEYXRhW2tleV0gPSB2YWx1ZTtcbiAgfSk7XG59O1xuXG4vLyBYWFggc2VlIGNvbW1lbnQgb24gQWNjb3VudHMuY3JlYXRlVXNlciBpbiBwYXNzd29yZHNfc2VydmVyIGFib3V0IGFkZGluZyBhXG4vLyBzZWNvbmQgXCJzZXJ2ZXIgb3B0aW9uc1wiIGFyZ3VtZW50LlxuY29uc3QgZGVmYXVsdENyZWF0ZVVzZXJIb29rID0gKG9wdGlvbnMsIHVzZXIpID0+IHtcbiAgaWYgKG9wdGlvbnMucHJvZmlsZSlcbiAgICB1c2VyLnByb2ZpbGUgPSBvcHRpb25zLnByb2ZpbGU7XG4gIHJldHVybiB1c2VyO1xufTtcblxuLy8gVmFsaWRhdGUgbmV3IHVzZXIncyBlbWFpbCBvciBHb29nbGUvRmFjZWJvb2svR2l0SHViIGFjY291bnQncyBlbWFpbFxuZnVuY3Rpb24gZGVmYXVsdFZhbGlkYXRlTmV3VXNlckhvb2sodXNlcikge1xuICBjb25zdCBkb21haW4gPSB0aGlzLl9vcHRpb25zLnJlc3RyaWN0Q3JlYXRpb25CeUVtYWlsRG9tYWluO1xuICBpZiAoIWRvbWFpbikge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgbGV0IGVtYWlsSXNHb29kID0gZmFsc2U7XG4gIGlmICh1c2VyLmVtYWlscyAmJiB1c2VyLmVtYWlscy5sZW5ndGggPiAwKSB7XG4gICAgZW1haWxJc0dvb2QgPSB1c2VyLmVtYWlscy5yZWR1Y2UoXG4gICAgICAocHJldiwgZW1haWwpID0+IHByZXYgfHwgdGhpcy5fdGVzdEVtYWlsRG9tYWluKGVtYWlsLmFkZHJlc3MpLCBmYWxzZVxuICAgICk7XG4gIH0gZWxzZSBpZiAodXNlci5zZXJ2aWNlcyAmJiBPYmplY3QudmFsdWVzKHVzZXIuc2VydmljZXMpLmxlbmd0aCA+IDApIHtcbiAgICAvLyBGaW5kIGFueSBlbWFpbCBvZiBhbnkgc2VydmljZSBhbmQgY2hlY2sgaXRcbiAgICBlbWFpbElzR29vZCA9IE9iamVjdC52YWx1ZXModXNlci5zZXJ2aWNlcykucmVkdWNlKFxuICAgICAgKHByZXYsIHNlcnZpY2UpID0+IHNlcnZpY2UuZW1haWwgJiYgdGhpcy5fdGVzdEVtYWlsRG9tYWluKHNlcnZpY2UuZW1haWwpLFxuICAgICAgZmFsc2UsXG4gICAgKTtcbiAgfVxuXG4gIGlmIChlbWFpbElzR29vZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBkb21haW4gPT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIGBAJHtkb21haW59IGVtYWlsIHJlcXVpcmVkYCk7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiRW1haWwgZG9lc24ndCBtYXRjaCB0aGUgY3JpdGVyaWEuXCIpO1xuICB9XG59XG5cbmNvbnN0IHNldHVwVXNlcnNDb2xsZWN0aW9uID0gdXNlcnMgPT4ge1xuICAvLy9cbiAgLy8vIFJFU1RSSUNUSU5HIFdSSVRFUyBUTyBVU0VSIE9CSkVDVFNcbiAgLy8vXG4gIHVzZXJzLmFsbG93KHtcbiAgICAvLyBjbGllbnRzIGNhbiBtb2RpZnkgdGhlIHByb2ZpbGUgZmllbGQgb2YgdGhlaXIgb3duIGRvY3VtZW50LCBhbmRcbiAgICAvLyBub3RoaW5nIGVsc2UuXG4gICAgdXBkYXRlOiAodXNlcklkLCB1c2VyLCBmaWVsZHMsIG1vZGlmaWVyKSA9PiB7XG4gICAgICAvLyBtYWtlIHN1cmUgaXQgaXMgb3VyIHJlY29yZFxuICAgICAgaWYgKHVzZXIuX2lkICE9PSB1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvLyB1c2VyIGNhbiBvbmx5IG1vZGlmeSB0aGUgJ3Byb2ZpbGUnIGZpZWxkLiBzZXRzIHRvIG11bHRpcGxlXG4gICAgICAvLyBzdWIta2V5cyAoZWcgcHJvZmlsZS5mb28gYW5kIHByb2ZpbGUuYmFyKSBhcmUgbWVyZ2VkIGludG8gZW50cnlcbiAgICAgIC8vIGluIHRoZSBmaWVsZHMgbGlzdC5cbiAgICAgIGlmIChmaWVsZHMubGVuZ3RoICE9PSAxIHx8IGZpZWxkc1swXSAhPT0gJ3Byb2ZpbGUnKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICBmZXRjaDogWydfaWQnXSAvLyB3ZSBvbmx5IGxvb2sgYXQgX2lkLlxuICB9KTtcblxuICAvLy8gREVGQVVMVCBJTkRFWEVTIE9OIFVTRVJTXG4gIHVzZXJzLmNyZWF0ZUluZGV4QXN5bmMoJ3VzZXJuYW1lJywgeyB1bmlxdWU6IHRydWUsIHNwYXJzZTogdHJ1ZSB9KTtcbiAgdXNlcnMuY3JlYXRlSW5kZXhBc3luYygnZW1haWxzLmFkZHJlc3MnLCB7IHVuaXF1ZTogdHJ1ZSwgc3BhcnNlOiB0cnVlIH0pO1xuICB1c2Vycy5jcmVhdGVJbmRleEFzeW5jKCdzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW4nLFxuICAgIHsgdW5pcXVlOiB0cnVlLCBzcGFyc2U6IHRydWUgfSk7XG4gIHVzZXJzLmNyZWF0ZUluZGV4QXN5bmMoJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy50b2tlbicsXG4gICAgeyB1bmlxdWU6IHRydWUsIHNwYXJzZTogdHJ1ZSB9KTtcbiAgLy8gRm9yIHRha2luZyBjYXJlIG9mIGxvZ291dE90aGVyQ2xpZW50cyBjYWxscyB0aGF0IGNyYXNoZWQgYmVmb3JlIHRoZVxuICAvLyB0b2tlbnMgd2VyZSBkZWxldGVkLlxuICB1c2Vycy5jcmVhdGVJbmRleEFzeW5jKCdzZXJ2aWNlcy5yZXN1bWUuaGF2ZUxvZ2luVG9rZW5zVG9EZWxldGUnLFxuICAgIHsgc3BhcnNlOiB0cnVlIH0pO1xuICAvLyBGb3IgZXhwaXJpbmcgbG9naW4gdG9rZW5zXG4gIHVzZXJzLmNyZWF0ZUluZGV4QXN5bmMoXCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMud2hlblwiLCB7IHNwYXJzZTogdHJ1ZSB9KTtcbiAgLy8gRm9yIGV4cGlyaW5nIHBhc3N3b3JkIHRva2Vuc1xuICB1c2Vycy5jcmVhdGVJbmRleEFzeW5jKCdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC53aGVuJywgeyBzcGFyc2U6IHRydWUgfSk7XG4gIHVzZXJzLmNyZWF0ZUluZGV4QXN5bmMoJ3NlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC53aGVuJywgeyBzcGFyc2U6IHRydWUgfSk7XG59O1xuXG5cbi8vIEdlbmVyYXRlcyBwZXJtdXRhdGlvbnMgb2YgYWxsIGNhc2UgdmFyaWF0aW9ucyBvZiBhIGdpdmVuIHN0cmluZy5cbmNvbnN0IGdlbmVyYXRlQ2FzZVBlcm11dGF0aW9uc0ZvclN0cmluZyA9IHN0cmluZyA9PiB7XG4gIGxldCBwZXJtdXRhdGlvbnMgPSBbJyddO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoID0gc3RyaW5nLmNoYXJBdChpKTtcbiAgICBwZXJtdXRhdGlvbnMgPSBbXS5jb25jYXQoLi4uKHBlcm11dGF0aW9ucy5tYXAocHJlZml4ID0+IHtcbiAgICAgIGNvbnN0IGxvd2VyQ2FzZUNoYXIgPSBjaC50b0xvd2VyQ2FzZSgpO1xuICAgICAgY29uc3QgdXBwZXJDYXNlQ2hhciA9IGNoLnRvVXBwZXJDYXNlKCk7XG4gICAgICAvLyBEb24ndCBhZGQgdW5uZWNlc3NhcnkgcGVybXV0YXRpb25zIHdoZW4gY2ggaXMgbm90IGEgbGV0dGVyXG4gICAgICBpZiAobG93ZXJDYXNlQ2hhciA9PT0gdXBwZXJDYXNlQ2hhcikge1xuICAgICAgICByZXR1cm4gW3ByZWZpeCArIGNoXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBbcHJlZml4ICsgbG93ZXJDYXNlQ2hhciwgcHJlZml4ICsgdXBwZXJDYXNlQ2hhcl07XG4gICAgICB9XG4gICAgfSkpKTtcbiAgfVxuICByZXR1cm4gcGVybXV0YXRpb25zO1xufVxuXG4iXX0=
