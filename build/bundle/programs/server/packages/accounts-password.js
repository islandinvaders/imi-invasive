(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Accounts = Package['accounts-base'].Accounts;
var SHA256 = Package.sha.SHA256;
var EJSON = Package.ejson.EJSON;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Email = Package.email.Email;
var EmailInternals = Package.email.EmailInternals;
var Random = Package.random.Random;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"accounts-password":{"email_templates.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/accounts-password/email_templates.js                                                             //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
const greet = welcomeMsg => (user, url) => {
  const greeting = user.profile && user.profile.name ? "Hello ".concat(user.profile.name, ",") : 'Hello,';
  return "".concat(greeting, "\n\n").concat(welcomeMsg, ", simply click the link below.\n\n").concat(url, "\n\nThank you.\n");
};

/**
 * @summary Options to customize emails sent from the Accounts system.
 * @locus Server
 * @importFromPackage accounts-base
 */
Accounts.emailTemplates = _objectSpread(_objectSpread({}, Accounts.emailTemplates || {}), {}, {
  from: 'Accounts Example <no-reply@example.com>',
  siteName: Meteor.absoluteUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''),
  resetPassword: {
    subject: () => "How to reset your password on ".concat(Accounts.emailTemplates.siteName),
    text: greet('To reset your password')
  },
  verifyEmail: {
    subject: () => "How to verify email address on ".concat(Accounts.emailTemplates.siteName),
    text: greet('To verify your account email')
  },
  enrollAccount: {
    subject: () => "An account has been created for you on ".concat(Accounts.emailTemplates.siteName),
    text: greet('To start using the service')
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"password_server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// packages/accounts-password/password_server.js                                                             //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let _objectSpread;
module.link("@babel/runtime/helpers/objectSpread2", {
  default(v) {
    _objectSpread = v;
  }
}, 0);
let bcryptHash, bcryptCompare;
module.link("bcrypt", {
  hash(v) {
    bcryptHash = v;
  },
  compare(v) {
    bcryptCompare = v;
  }
}, 0);
let Accounts;
module.link("meteor/accounts-base", {
  Accounts(v) {
    Accounts = v;
  }
}, 1);
// Utility for grabbing user
const getUserById = (id, options) => Meteor.users.findOne(id, Accounts._addDefaultFieldSelector(options));

// User records have a 'services.password.bcrypt' field on them to hold
// their hashed passwords.
//
// When the client sends a password to the server, it can either be a
// string (the plaintext password) or an object with keys 'digest' and
// 'algorithm' (must be "sha-256" for now). The Meteor client always sends
// password objects { digest: *, algorithm: "sha-256" }, but DDP clients
// that don't have access to SHA can just send plaintext passwords as
// strings.
//
// When the server receives a plaintext password as a string, it always
// hashes it with SHA256 before passing it into bcrypt. When the server
// receives a password as an object, it asserts that the algorithm is
// "sha-256" and then passes the digest to bcrypt.

Accounts._bcryptRounds = () => Accounts._options.bcryptRounds || 10;

// Given a 'password' from the client, extract the string that we should
// bcrypt. 'password' can be one of:
//  - String (the plaintext password)
//  - Object with 'digest' and 'algorithm' keys. 'algorithm' must be "sha-256".
//
const getPasswordString = password => {
  if (typeof password === "string") {
    password = SHA256(password);
  } else {
    // 'password' is an object
    if (password.algorithm !== "sha-256") {
      throw new Error("Invalid password hash algorithm. " + "Only 'sha-256' is allowed.");
    }
    password = password.digest;
  }
  return password;
};

// Use bcrypt to hash the password for storage in the database.
// `password` can be a string (in which case it will be run through
// SHA256 before bcrypt) or an object with properties `digest` and
// `algorithm` (in which case we bcrypt `password.digest`).
//
const hashPassword = password => Promise.asyncApply(() => {
  password = getPasswordString(password);
  return Promise.await(bcryptHash(password, Accounts._bcryptRounds()));
});

// Extract the number of rounds used in the specified bcrypt hash.
const getRoundsFromBcryptHash = hash => {
  let rounds;
  if (hash) {
    const hashSegments = hash.split('$');
    if (hashSegments.length > 2) {
      rounds = parseInt(hashSegments[2], 10);
    }
  }
  return rounds;
};

// Check whether the provided password matches the bcrypt'ed password in
// the database user record. `password` can be a string (in which case
// it will be run through SHA256 before bcrypt) or an object with
// properties `digest` and `algorithm` (in which case we bcrypt
// `password.digest`).
//
// The user parameter needs at least user._id and user.services
Accounts._checkPasswordUserFields = {
  _id: 1,
  services: 1
};
//
const checkPasswordAsync = (user, password) => Promise.asyncApply(() => {
  const result = {
    userId: user._id
  };
  const formattedPassword = getPasswordString(password);
  const hash = user.services.password.bcrypt;
  const hashRounds = getRoundsFromBcryptHash(hash);
  if (!Promise.await(bcryptCompare(formattedPassword, hash))) {
    result.error = Accounts._handleError("Incorrect password", false);
  } else if (hash && Accounts._bcryptRounds() != hashRounds) {
    // The password checks out, but the user's bcrypt hash needs to be updated.

    Meteor.defer(() => Promise.asyncApply(() => {
      Meteor.users.update({
        _id: user._id
      }, {
        $set: {
          'services.password.bcrypt': Promise.await(bcryptHash(formattedPassword, Accounts._bcryptRounds()))
        }
      });
    }));
  }
  return result;
});
const checkPassword = (user, password) => {
  return Promise.await(checkPasswordAsync(user, password));
};
Accounts._checkPassword = checkPassword;
Accounts._checkPasswordAsync = checkPasswordAsync;

///
/// LOGIN
///

/**
 * @summary Finds the user with the specified username.
 * First tries to match username case sensitively; if that fails, it
 * tries case insensitively; but if more than one user matches the case
 * insensitive search, it returns null.
 * @locus Server
 * @param {String} username The username to look for
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 * @returns {Object} A user if found, else null
 * @importFromPackage accounts-base
 */
Accounts.findUserByUsername = (username, options) => Accounts._findUserByQuery({
  username
}, options);

/**
 * @summary Finds the user with the specified email.
 * First tries to match email case sensitively; if that fails, it
 * tries case insensitively; but if more than one user matches the case
 * insensitive search, it returns null.
 * @locus Server
 * @param {String} email The email address to look for
 * @param {Object} [options]
 * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.
 * @returns {Object} A user if found, else null
 * @importFromPackage accounts-base
 */
Accounts.findUserByEmail = (email, options) => Accounts._findUserByQuery({
  email
}, options);

// XXX maybe this belongs in the check package
const NonEmptyString = Match.Where(x => {
  check(x, String);
  return x.length > 0;
});
const passwordValidator = Match.OneOf(Match.Where(str => {
  var _Meteor$settings, _Meteor$settings$pack, _Meteor$settings$pack2;
  return Match.test(str, String) && str.length <= ((_Meteor$settings = Meteor.settings) === null || _Meteor$settings === void 0 ? void 0 : (_Meteor$settings$pack = _Meteor$settings.packages) === null || _Meteor$settings$pack === void 0 ? void 0 : (_Meteor$settings$pack2 = _Meteor$settings$pack.accounts) === null || _Meteor$settings$pack2 === void 0 ? void 0 : _Meteor$settings$pack2.passwordMaxLength) || 256;
}), {
  digest: Match.Where(str => Match.test(str, String) && str.length === 64),
  algorithm: Match.OneOf('sha-256')
});

// Handler to login with a password.
//
// The Meteor client sets options.password to an object with keys
// 'digest' (set to SHA256(password)) and 'algorithm' ("sha-256").
//
// For other DDP clients which don't have access to SHA, the handler
// also accepts the plaintext password in options.password as a string.
//
// (It might be nice if servers could turn the plaintext password
// option off. Or maybe it should be opt-in, not opt-out?
// Accounts.config option?)
//
// Note that neither password option is secure without SSL.
//
Accounts.registerLoginHandler("password", options => Promise.asyncApply(() => {
  var _Accounts$_check2faEn, _Accounts;
  if (!options.password) return undefined; // don't handle

  check(options, {
    user: Accounts._userQueryValidator,
    password: passwordValidator,
    code: Match.Optional(NonEmptyString)
  });
  const user = Accounts._findUserByQuery(options.user, {
    fields: _objectSpread({
      services: 1
    }, Accounts._checkPasswordUserFields)
  });
  if (!user) {
    Accounts._handleError("User not found");
  }
  if (!user.services || !user.services.password || !user.services.password.bcrypt) {
    Accounts._handleError("User has no password set");
  }
  const result = Promise.await(checkPasswordAsync(user, options.password));
  // This method is added by the package accounts-2fa
  // First the login is validated, then the code situation is checked
  if (!result.error && (_Accounts$_check2faEn = (_Accounts = Accounts)._check2faEnabled) !== null && _Accounts$_check2faEn !== void 0 && _Accounts$_check2faEn.call(_Accounts, user)) {
    if (!options.code) {
      Accounts._handleError('2FA code must be informed', true, 'no-2fa-code');
    }
    if (!Accounts._isTokenValid(user.services.twoFactorAuthentication.secret, options.code)) {
      Accounts._handleError('Invalid 2FA code', true, 'invalid-2fa-code');
    }
  }
  return result;
}));

///
/// CHANGING
///

/**
 * @summary Change a user's username. Use this instead of updating the
 * database directly. The operation will fail if there is an existing user
 * with a username only differing in case.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newUsername A new username for the user.
 * @importFromPackage accounts-base
 */
Accounts.setUsername = (userId, newUsername) => {
  check(userId, NonEmptyString);
  check(newUsername, NonEmptyString);
  const user = getUserById(userId, {
    fields: {
      username: 1
    }
  });
  if (!user) {
    Accounts._handleError("User not found");
  }
  const oldUsername = user.username;

  // Perform a case insensitive check for duplicates before update
  Accounts._checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
  Meteor.users.update({
    _id: user._id
  }, {
    $set: {
      username: newUsername
    }
  });

  // Perform another check after update, in case a matching user has been
  // inserted in the meantime
  try {
    Accounts._checkForCaseInsensitiveDuplicates('username', 'Username', newUsername, user._id);
  } catch (ex) {
    // Undo update if the check fails
    Meteor.users.update({
      _id: user._id
    }, {
      $set: {
        username: oldUsername
      }
    });
    throw ex;
  }
};

// Let the user change their own password if they know the old
// password. `oldPassword` and `newPassword` should be objects with keys
// `digest` and `algorithm` (representing the SHA256 of the password).
Meteor.methods({
  changePassword: function (oldPassword, newPassword) {
    return Promise.asyncApply(() => {
      check(oldPassword, passwordValidator);
      check(newPassword, passwordValidator);
      if (!this.userId) {
        throw new Meteor.Error(401, "Must be logged in");
      }
      const user = getUserById(this.userId, {
        fields: _objectSpread({
          services: 1
        }, Accounts._checkPasswordUserFields)
      });
      if (!user) {
        Accounts._handleError("User not found");
      }
      if (!user.services || !user.services.password || !user.services.password.bcrypt) {
        Accounts._handleError("User has no password set");
      }
      const result = Promise.await(checkPasswordAsync(user, oldPassword));
      if (result.error) {
        throw result.error;
      }
      const hashed = Promise.await(hashPassword(newPassword));

      // It would be better if this removed ALL existing tokens and replaced
      // the token for the current connection with a new one, but that would
      // be tricky, so we'll settle for just replacing all tokens other than
      // the one for the current connection.
      const currentToken = Accounts._getLoginToken(this.connection.id);
      Meteor.users.update({
        _id: this.userId
      }, {
        $set: {
          'services.password.bcrypt': hashed
        },
        $pull: {
          'services.resume.loginTokens': {
            hashedToken: {
              $ne: currentToken
            }
          }
        },
        $unset: {
          'services.password.reset': 1
        }
      });
      return {
        passwordChanged: true
      };
    });
  }
});

// Force change the users password.

/**
 * @summary Forcibly change the password for a user.
 * @locus Server
 * @param {String} userId The id of the user to update.
 * @param {String} newPassword A new password for the user.
 * @param {Object} [options]
 * @param {Object} options.logout Logout all current connections with this userId (default: true)
 * @importFromPackage accounts-base
 */
Accounts.setPasswordAsync = (userId, newPlaintextPassword, options) => Promise.asyncApply(() => {
  check(userId, String);
  check(newPlaintextPassword, Match.Where(str => {
    var _Meteor$settings2, _Meteor$settings2$pac, _Meteor$settings2$pac2;
    return Match.test(str, String) && str.length <= ((_Meteor$settings2 = Meteor.settings) === null || _Meteor$settings2 === void 0 ? void 0 : (_Meteor$settings2$pac = _Meteor$settings2.packages) === null || _Meteor$settings2$pac === void 0 ? void 0 : (_Meteor$settings2$pac2 = _Meteor$settings2$pac.accounts) === null || _Meteor$settings2$pac2 === void 0 ? void 0 : _Meteor$settings2$pac2.passwordMaxLength) || 256;
  }));
  check(options, Match.Maybe({
    logout: Boolean
  }));
  options = _objectSpread({
    logout: true
  }, options);
  const user = getUserById(userId, {
    fields: {
      _id: 1
    }
  });
  if (!user) {
    throw new Meteor.Error(403, "User not found");
  }
  const update = {
    $unset: {
      'services.password.reset': 1
    },
    $set: {
      'services.password.bcrypt': Promise.await(hashPassword(newPlaintextPassword))
    }
  };
  if (options.logout) {
    update.$unset['services.resume.loginTokens'] = 1;
  }
  Meteor.users.update({
    _id: user._id
  }, update);
});

/**
 * @summary Forcibly change the password for a user.
 * @locus Server
 * @param {String} userId The id of the user to update.
 * @param {String} newPassword A new password for the user.
 * @param {Object} [options]
 * @param {Object} options.logout Logout all current connections with this userId (default: true)
 * @importFromPackage accounts-base
 */
Accounts.setPassword = (userId, newPlaintextPassword, options) => {
  return Promise.await(Accounts.setPasswordAsync(userId, newPlaintextPassword, options));
};

///
/// RESETTING VIA EMAIL
///

// Utility for plucking addresses from emails
const pluckAddresses = function () {
  let emails = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  return emails.map(email => email.address);
};

// Method called by a user to request a password reset email. This is
// the start of the reset process.
Meteor.methods({
  forgotPassword: options => {
    check(options, {
      email: String
    });
    const user = Accounts.findUserByEmail(options.email, {
      fields: {
        emails: 1
      }
    });
    if (!user) {
      Accounts._handleError("User not found");
    }
    const emails = pluckAddresses(user.emails);
    const caseSensitiveEmail = emails.find(email => email.toLowerCase() === options.email.toLowerCase());
    Accounts.sendResetPasswordEmail(user._id, caseSensitiveEmail);
  }
});

/**
 * @summary Generates a reset token and saves it into the database.
 * @locus Server
 * @param {String} userId The id of the user to generate the reset token for.
 * @param {String} email Which address of the user to generate the reset token for. This address must be in the user's `emails` list. If `null`, defaults to the first email in the list.
 * @param {String} reason `resetPassword` or `enrollAccount`.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token} values.
 * @importFromPackage accounts-base
 */
Accounts.generateResetToken = (userId, email, reason, extraTokenData) => {
  // Make sure the user exists, and email is one of their addresses.
  // Don't limit the fields in the user object since the user is returned
  // by the function and some other fields might be used elsewhere.
  const user = getUserById(userId);
  if (!user) {
    Accounts._handleError("Can't find user");
  }

  // pick the first email if we weren't passed an email.
  if (!email && user.emails && user.emails[0]) {
    email = user.emails[0].address;
  }

  // make sure we have a valid email
  if (!email || !pluckAddresses(user.emails).includes(email)) {
    Accounts._handleError("No such email for user.");
  }
  const token = Random.secret();
  const tokenRecord = {
    token,
    email,
    when: new Date()
  };
  if (reason === 'resetPassword') {
    tokenRecord.reason = 'reset';
  } else if (reason === 'enrollAccount') {
    tokenRecord.reason = 'enroll';
  } else if (reason) {
    // fallback so that this function can be used for unknown reasons as well
    tokenRecord.reason = reason;
  }
  if (extraTokenData) {
    Object.assign(tokenRecord, extraTokenData);
  }
  // if this method is called from the enroll account work-flow then
  // store the token record in 'services.password.enroll' db field
  // else store the token record in in 'services.password.reset' db field
  if (reason === 'enrollAccount') {
    Meteor.users.update({
      _id: user._id
    }, {
      $set: {
        'services.password.enroll': tokenRecord
      }
    });
    // before passing to template, update user object with new token
    Meteor._ensure(user, 'services', 'password').enroll = tokenRecord;
  } else {
    Meteor.users.update({
      _id: user._id
    }, {
      $set: {
        'services.password.reset': tokenRecord
      }
    });
    // before passing to template, update user object with new token
    Meteor._ensure(user, 'services', 'password').reset = tokenRecord;
  }
  return {
    email,
    user,
    token
  };
};

/**
 * @summary Generates an e-mail verification token and saves it into the database.
 * @locus Server
 * @param {String} userId The id of the user to generate the  e-mail verification token for.
 * @param {String} email Which address of the user to generate the e-mail verification token for. This address must be in the user's `emails` list. If `null`, defaults to the first unverified email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @returns {Object} Object with {email, user, token} values.
 * @importFromPackage accounts-base
 */
Accounts.generateVerificationToken = (userId, email, extraTokenData) => {
  // Make sure the user exists, and email is one of their addresses.
  // Don't limit the fields in the user object since the user is returned
  // by the function and some other fields might be used elsewhere.
  const user = getUserById(userId);
  if (!user) {
    Accounts._handleError("Can't find user");
  }

  // pick the first unverified email if we weren't passed an email.
  if (!email) {
    const emailRecord = (user.emails || []).find(e => !e.verified);
    email = (emailRecord || {}).address;
    if (!email) {
      Accounts._handleError("That user has no unverified email addresses.");
    }
  }

  // make sure we have a valid email
  if (!email || !pluckAddresses(user.emails).includes(email)) {
    Accounts._handleError("No such email for user.");
  }
  const token = Random.secret();
  const tokenRecord = {
    token,
    // TODO: This should probably be renamed to "email" to match reset token record.
    address: email,
    when: new Date()
  };
  if (extraTokenData) {
    Object.assign(tokenRecord, extraTokenData);
  }
  Meteor.users.update({
    _id: user._id
  }, {
    $push: {
      'services.email.verificationTokens': tokenRecord
    }
  });

  // before passing to template, update user object with new token
  Meteor._ensure(user, 'services', 'email');
  if (!user.services.email.verificationTokens) {
    user.services.email.verificationTokens = [];
  }
  user.services.email.verificationTokens.push(tokenRecord);
  return {
    email,
    user,
    token
  };
};

// send the user an email with a link that when opened allows the user
// to set a new password, without the old password.

/**
 * @summary Send an email with a link the user can use to reset their password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @param {Object} [extraParams] Optional additional params to be added to the reset url.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */
Accounts.sendResetPasswordEmail = (userId, email, extraTokenData, extraParams) => {
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateResetToken(userId, email, 'resetPassword', extraTokenData);
  const url = Accounts.urls.resetPassword(token, extraParams);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'resetPassword');
  Email.send(options);
  if (Meteor.isDevelopment) {
    console.log("\nReset password URL: ".concat(url));
  }
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
};

// send the user an email informing them that their account was created, with
// a link that when opened both marks their email as verified and forces them
// to choose their password. The email must be one of the addresses in the
// user's emails field, or undefined to pick the first email automatically.
//
// This is not called automatically. It must be called manually if you
// want to use enrollment emails.

/**
 * @summary Send an email with a link the user can use to set their initial password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @param {Object} [extraParams] Optional additional params to be added to the enrollment url.
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */
Accounts.sendEnrollmentEmail = (userId, email, extraTokenData, extraParams) => {
  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateResetToken(userId, email, 'enrollAccount', extraTokenData);
  const url = Accounts.urls.enrollAccount(token, extraParams);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'enrollAccount');
  Email.send(options);
  if (Meteor.isDevelopment) {
    console.log("\nEnrollment email URL: ".concat(url));
  }
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
};

// Take token from sendResetPasswordEmail or sendEnrollmentEmail, change
// the users password, and log them in.
Meteor.methods({
  resetPassword: function () {
    return Promise.asyncApply(() => {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      const token = args[0];
      const newPassword = args[1];
      return Promise.await(Accounts._loginMethod(this, "resetPassword", args, "password", () => Promise.asyncApply(() => {
        var _Accounts$_check2faEn2, _Accounts2;
        check(token, String);
        check(newPassword, passwordValidator);
        let user = Meteor.users.findOne({
          "services.password.reset.token": token
        }, {
          fields: {
            services: 1,
            emails: 1
          }
        });
        let isEnroll = false;
        // if token is in services.password.reset db field implies
        // this method is was not called from enroll account workflow
        // else this method is called from enroll account workflow
        if (!user) {
          user = Meteor.users.findOne({
            "services.password.enroll.token": token
          }, {
            fields: {
              services: 1,
              emails: 1
            }
          });
          isEnroll = true;
        }
        if (!user) {
          throw new Meteor.Error(403, "Token expired");
        }
        let tokenRecord = {};
        if (isEnroll) {
          tokenRecord = user.services.password.enroll;
        } else {
          tokenRecord = user.services.password.reset;
        }
        const {
          when,
          email
        } = tokenRecord;
        let tokenLifetimeMs = Accounts._getPasswordResetTokenLifetimeMs();
        if (isEnroll) {
          tokenLifetimeMs = Accounts._getPasswordEnrollTokenLifetimeMs();
        }
        const currentTimeMs = Date.now();
        if (currentTimeMs - when > tokenLifetimeMs) throw new Meteor.Error(403, "Token expired");
        if (!pluckAddresses(user.emails).includes(email)) return {
          userId: user._id,
          error: new Meteor.Error(403, "Token has invalid email address")
        };
        const hashed = Promise.await(hashPassword(newPassword));

        // NOTE: We're about to invalidate tokens on the user, who we might be
        // logged in as. Make sure to avoid logging ourselves out if this
        // happens. But also make sure not to leave the connection in a state
        // of having a bad token set if things fail.
        const oldToken = Accounts._getLoginToken(this.connection.id);
        Accounts._setLoginToken(user._id, this.connection, null);
        const resetToOldToken = () => Accounts._setLoginToken(user._id, this.connection, oldToken);
        try {
          // Update the user record by:
          // - Changing the password to the new one
          // - Forgetting about the reset token or enroll token that was just used
          // - Verifying their email, since they got the password reset via email.
          let affectedRecords = {};
          // if reason is enroll then check services.password.enroll.token field for affected records
          if (isEnroll) {
            affectedRecords = Meteor.users.update({
              _id: user._id,
              'emails.address': email,
              'services.password.enroll.token': token
            }, {
              $set: {
                'services.password.bcrypt': hashed,
                'emails.$.verified': true
              },
              $unset: {
                'services.password.enroll': 1
              }
            });
          } else {
            affectedRecords = Meteor.users.update({
              _id: user._id,
              'emails.address': email,
              'services.password.reset.token': token
            }, {
              $set: {
                'services.password.bcrypt': hashed,
                'emails.$.verified': true
              },
              $unset: {
                'services.password.reset': 1
              }
            });
          }
          if (affectedRecords !== 1) return {
            userId: user._id,
            error: new Meteor.Error(403, "Invalid email")
          };
        } catch (err) {
          resetToOldToken();
          throw err;
        }

        // Replace all valid login tokens with new ones (changing
        // password should invalidate existing sessions).
        Accounts._clearAllLoginTokens(user._id);
        if ((_Accounts$_check2faEn2 = (_Accounts2 = Accounts)._check2faEnabled) !== null && _Accounts$_check2faEn2 !== void 0 && _Accounts$_check2faEn2.call(_Accounts2, user)) {
          return {
            userId: user._id,
            error: Accounts._handleError('Changed password, but user not logged in because 2FA is enabled', false, '2fa-enabled')
          };
        }
        return {
          userId: user._id
        };
      })));
    });
  }
});

///
/// EMAIL VERIFICATION
///

// send the user an email with a link that when opened marks that
// address as verified

/**
 * @summary Send an email with a link the user can use verify their email address.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first unverified email in the list.
 * @param {Object} [extraTokenData] Optional additional data to be added into the token record.
 * @param {Object} [extraParams] Optional additional params to be added to the verification url.
 *
 * @returns {Object} Object with {email, user, token, url, options} values.
 * @importFromPackage accounts-base
 */
Accounts.sendVerificationEmail = (userId, email, extraTokenData, extraParams) => {
  // XXX Also generate a link using which someone can delete this
  // account if they own said address but weren't those who created
  // this account.

  const {
    email: realEmail,
    user,
    token
  } = Accounts.generateVerificationToken(userId, email, extraTokenData);
  const url = Accounts.urls.verifyEmail(token, extraParams);
  const options = Accounts.generateOptionsForEmail(realEmail, user, url, 'verifyEmail');
  Email.send(options);
  if (Meteor.isDevelopment) {
    console.log("\nVerification email URL: ".concat(url));
  }
  return {
    email: realEmail,
    user,
    token,
    url,
    options
  };
};

// Take token from sendVerificationEmail, mark the email as verified,
// and log them in.
Meteor.methods({
  verifyEmail: function () {
    return Promise.asyncApply(() => {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      const token = args[0];
      return Promise.await(Accounts._loginMethod(this, "verifyEmail", args, "password", () => {
        var _Accounts$_check2faEn3, _Accounts3;
        check(token, String);
        const user = Meteor.users.findOne({
          'services.email.verificationTokens.token': token
        }, {
          fields: {
            services: 1,
            emails: 1
          }
        });
        if (!user) throw new Meteor.Error(403, "Verify email link expired");
        const tokenRecord = user.services.email.verificationTokens.find(t => t.token == token);
        if (!tokenRecord) return {
          userId: user._id,
          error: new Meteor.Error(403, "Verify email link expired")
        };
        const emailsRecord = user.emails.find(e => e.address == tokenRecord.address);
        if (!emailsRecord) return {
          userId: user._id,
          error: new Meteor.Error(403, "Verify email link is for unknown address")
        };

        // By including the address in the query, we can use 'emails.$' in the
        // modifier to get a reference to the specific object in the emails
        // array. See
        // http://www.mongodb.org/display/DOCS/Updating/#Updating-The%24positionaloperator)
        // http://www.mongodb.org/display/DOCS/Updating#Updating-%24pull
        Meteor.users.update({
          _id: user._id,
          'emails.address': tokenRecord.address
        }, {
          $set: {
            'emails.$.verified': true
          },
          $pull: {
            'services.email.verificationTokens': {
              address: tokenRecord.address
            }
          }
        });
        if ((_Accounts$_check2faEn3 = (_Accounts3 = Accounts)._check2faEnabled) !== null && _Accounts$_check2faEn3 !== void 0 && _Accounts$_check2faEn3.call(_Accounts3, user)) {
          return {
            userId: user._id,
            error: Accounts._handleError('Email verified, but user not logged in because 2FA is enabled', false, '2fa-enabled')
          };
        }
        return {
          userId: user._id
        };
      }));
    });
  }
});

/**
 * @summary Add an email address for a user. Use this instead of directly
 * updating the database. The operation will fail if there is a different user
 * with an email only differing in case. If the specified user has an existing
 * email only differing in case however, we replace it.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newEmail A new email address for the user.
 * @param {Boolean} [verified] Optional - whether the new email address should
 * be marked as verified. Defaults to false.
 * @importFromPackage accounts-base
 */
Accounts.addEmail = (userId, newEmail, verified) => {
  check(userId, NonEmptyString);
  check(newEmail, NonEmptyString);
  check(verified, Match.Optional(Boolean));
  if (verified === void 0) {
    verified = false;
  }
  const user = getUserById(userId, {
    fields: {
      emails: 1
    }
  });
  if (!user) throw new Meteor.Error(403, "User not found");

  // Allow users to change their own email to a version with a different case

  // We don't have to call checkForCaseInsensitiveDuplicates to do a case
  // insensitive check across all emails in the database here because: (1) if
  // there is no case-insensitive duplicate between this user and other users,
  // then we are OK and (2) if this would create a conflict with other users
  // then there would already be a case-insensitive duplicate and we can't fix
  // that in this code anyway.
  const caseInsensitiveRegExp = new RegExp("^".concat(Meteor._escapeRegExp(newEmail), "$"), 'i');
  const didUpdateOwnEmail = (user.emails || []).reduce((prev, email) => {
    if (caseInsensitiveRegExp.test(email.address)) {
      Meteor.users.update({
        _id: user._id,
        'emails.address': email.address
      }, {
        $set: {
          'emails.$.address': newEmail,
          'emails.$.verified': verified
        }
      });
      return true;
    } else {
      return prev;
    }
  }, false);

  // In the other updates below, we have to do another call to
  // checkForCaseInsensitiveDuplicates to make sure that no conflicting values
  // were added to the database in the meantime. We don't have to do this for
  // the case where the user is updating their email address to one that is the
  // same as before, but only different because of capitalization. Read the
  // big comment above to understand why.

  if (didUpdateOwnEmail) {
    return;
  }

  // Perform a case insensitive check for duplicates before update
  Accounts._checkForCaseInsensitiveDuplicates('emails.address', 'Email', newEmail, user._id);
  Meteor.users.update({
    _id: user._id
  }, {
    $addToSet: {
      emails: {
        address: newEmail,
        verified: verified
      }
    }
  });

  // Perform another check after update, in case a matching user has been
  // inserted in the meantime
  try {
    Accounts._checkForCaseInsensitiveDuplicates('emails.address', 'Email', newEmail, user._id);
  } catch (ex) {
    // Undo update if the check fails
    Meteor.users.update({
      _id: user._id
    }, {
      $pull: {
        emails: {
          address: newEmail
        }
      }
    });
    throw ex;
  }
};

/**
 * @summary Remove an email address for a user. Use this instead of updating
 * the database directly.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} email The email address to remove.
 * @importFromPackage accounts-base
 */
Accounts.removeEmail = (userId, email) => {
  check(userId, NonEmptyString);
  check(email, NonEmptyString);
  const user = getUserById(userId, {
    fields: {
      _id: 1
    }
  });
  if (!user) throw new Meteor.Error(403, "User not found");
  Meteor.users.update({
    _id: user._id
  }, {
    $pull: {
      emails: {
        address: email
      }
    }
  });
};

///
/// CREATING USERS
///

// Shared createUser function called from the createUser method, both
// if originates in client or server code. Calls user provided hooks,
// does the actual user insertion.
//
// returns the user id
const createUser = options => Promise.asyncApply(() => {
  // Unknown keys allowed, because a onCreateUserHook can take arbitrary
  // options.
  check(options, Match.ObjectIncluding({
    username: Match.Optional(String),
    email: Match.Optional(String),
    password: Match.Optional(passwordValidator)
  }));
  const {
    username,
    email,
    password
  } = options;
  if (!username && !email) throw new Meteor.Error(400, "Need to set a username or email");
  const user = {
    services: {}
  };
  if (password) {
    const hashed = Promise.await(hashPassword(password));
    user.services.password = {
      bcrypt: hashed
    };
  }
  return Accounts._createUserCheckingDuplicates({
    user,
    email,
    username,
    options
  });
});

// method for create user. Requests come from the client.
Meteor.methods({
  createUser: function () {
    return Promise.asyncApply(() => {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      const options = args[0];
      return Promise.await(Accounts._loginMethod(this, "createUser", args, "password", () => Promise.asyncApply(() => {
        // createUser() above does more checking.
        check(options, Object);
        if (Accounts._options.forbidClientAccountCreation) return {
          error: new Meteor.Error(403, "Signups forbidden")
        };
        const userId = Promise.await(Accounts.createUserVerifyingEmail(options));

        // client gets logged in as the new user afterwards.
        return {
          userId: userId
        };
      })));
    });
  }
});

/**
 * @summary Creates an user and sends an email if `options.email` is informed.
 * Then if the `sendVerificationEmail` option from the `Accounts` package is
 * enabled, you'll send a verification email if `options.password` is informed,
 * otherwise you'll send an enrollment email.
 * @locus Server
 * @param {Object} options The options object to be passed down when creating
 * the user
 * @param {String} options.username A unique name for this user.
 * @param {String} options.email The user's email address.
 * @param {String} options.password The user's password. This is __not__ sent in plain text over the wire.
 * @param {Object} options.profile The user's profile, typically including the `name` field.
 * @importFromPackage accounts-base
 * */
Accounts.createUserVerifyingEmail = options => Promise.asyncApply(() => {
  options = _objectSpread({}, options);
  // Create user. result contains id and token.
  const userId = Promise.await(createUser(options));
  // safety belt. createUser is supposed to throw on error. send 500 error
  // instead of sending a verification email with empty userid.
  if (!userId) throw new Error("createUser failed to insert new user");

  // If `Accounts._options.sendVerificationEmail` is set, register
  // a token to verify the user's primary email, and send it to
  // that address.
  if (options.email && Accounts._options.sendVerificationEmail) {
    if (options.password) {
      Accounts.sendVerificationEmail(userId, options.email);
    } else {
      Accounts.sendEnrollmentEmail(userId, options.email);
    }
  }
  return userId;
});

// Create user directly on the server.
//
// Unlike the client version, this does not log you in as this user
// after creation.
//
// returns Promise<userId> or throws an error if it can't create
//
// XXX add another argument ("server options") that gets sent to onCreateUser,
// which is always empty when called from the createUser method? eg, "admin:
// true", which we want to prevent the client from setting, but which a custom
// method calling Accounts.createUser could set?
//

Accounts.createUserAsync = (options, callback) => Promise.asyncApply(() => {
  options = _objectSpread({}, options);

  // XXX allow an optional callback?
  if (callback) {
    throw new Error("Accounts.createUser with callback not supported on the server yet.");
  }
  return createUser(options);
});

// Create user directly on the server.
//
// Unlike the client version, this does not log you in as this user
// after creation.
//
// returns userId or throws an error if it can't create
//
// XXX add another argument ("server options") that gets sent to onCreateUser,
// which is always empty when called from the createUser method? eg, "admin:
// true", which we want to prevent the client from setting, but which a custom
// method calling Accounts.createUser could set?
//

Accounts.createUser = (options, callback) => {
  return Promise.await(Accounts.createUserAsync(options, callback));
};

///
/// PASSWORD-SPECIFIC INDEXES ON USERS
///
Meteor.users.createIndexAsync('services.email.verificationTokens.token', {
  unique: true,
  sparse: true
});
Meteor.users.createIndexAsync('services.password.reset.token', {
  unique: true,
  sparse: true
});
Meteor.users.createIndexAsync('services.password.enroll.token', {
  unique: true,
  sparse: true
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"bcrypt":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// node_modules/meteor/accounts-password/node_modules/bcrypt/package.json                                    //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.exports = {
  "name": "bcrypt",
  "version": "5.0.1",
  "main": "./bcrypt"
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"bcrypt.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// node_modules/meteor/accounts-password/node_modules/bcrypt/bcrypt.js                                       //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/accounts-password/email_templates.js");
require("/node_modules/meteor/accounts-password/password_server.js");

/* Exports */
Package._define("accounts-password");

})();

//# sourceURL=meteor://💻app/packages/accounts-password.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYWNjb3VudHMtcGFzc3dvcmQvZW1haWxfdGVtcGxhdGVzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9hY2NvdW50cy1wYXNzd29yZC9wYXNzd29yZF9zZXJ2ZXIuanMiXSwibmFtZXMiOlsiX29iamVjdFNwcmVhZCIsIm1vZHVsZSIsImxpbmsiLCJkZWZhdWx0IiwidiIsImdyZWV0Iiwid2VsY29tZU1zZyIsInVzZXIiLCJ1cmwiLCJncmVldGluZyIsInByb2ZpbGUiLCJuYW1lIiwiY29uY2F0IiwiQWNjb3VudHMiLCJlbWFpbFRlbXBsYXRlcyIsImZyb20iLCJzaXRlTmFtZSIsIk1ldGVvciIsImFic29sdXRlVXJsIiwicmVwbGFjZSIsInJlc2V0UGFzc3dvcmQiLCJzdWJqZWN0IiwidGV4dCIsInZlcmlmeUVtYWlsIiwiZW5yb2xsQWNjb3VudCIsImJjcnlwdEhhc2giLCJiY3J5cHRDb21wYXJlIiwiaGFzaCIsImNvbXBhcmUiLCJnZXRVc2VyQnlJZCIsImlkIiwib3B0aW9ucyIsInVzZXJzIiwiZmluZE9uZSIsIl9hZGREZWZhdWx0RmllbGRTZWxlY3RvciIsIl9iY3J5cHRSb3VuZHMiLCJfb3B0aW9ucyIsImJjcnlwdFJvdW5kcyIsImdldFBhc3N3b3JkU3RyaW5nIiwicGFzc3dvcmQiLCJTSEEyNTYiLCJhbGdvcml0aG0iLCJFcnJvciIsImRpZ2VzdCIsImhhc2hQYXNzd29yZCIsIlByb21pc2UiLCJhc3luY0FwcGx5IiwiYXdhaXQiLCJnZXRSb3VuZHNGcm9tQmNyeXB0SGFzaCIsInJvdW5kcyIsImhhc2hTZWdtZW50cyIsInNwbGl0IiwibGVuZ3RoIiwicGFyc2VJbnQiLCJfY2hlY2tQYXNzd29yZFVzZXJGaWVsZHMiLCJfaWQiLCJzZXJ2aWNlcyIsImNoZWNrUGFzc3dvcmRBc3luYyIsInJlc3VsdCIsInVzZXJJZCIsImZvcm1hdHRlZFBhc3N3b3JkIiwiYmNyeXB0IiwiaGFzaFJvdW5kcyIsImVycm9yIiwiX2hhbmRsZUVycm9yIiwiZGVmZXIiLCJ1cGRhdGUiLCIkc2V0IiwiY2hlY2tQYXNzd29yZCIsIl9jaGVja1Bhc3N3b3JkIiwiX2NoZWNrUGFzc3dvcmRBc3luYyIsImZpbmRVc2VyQnlVc2VybmFtZSIsInVzZXJuYW1lIiwiX2ZpbmRVc2VyQnlRdWVyeSIsImZpbmRVc2VyQnlFbWFpbCIsImVtYWlsIiwiTm9uRW1wdHlTdHJpbmciLCJNYXRjaCIsIldoZXJlIiwieCIsImNoZWNrIiwiU3RyaW5nIiwicGFzc3dvcmRWYWxpZGF0b3IiLCJPbmVPZiIsInN0ciIsIl9NZXRlb3Ikc2V0dGluZ3MiLCJfTWV0ZW9yJHNldHRpbmdzJHBhY2siLCJfTWV0ZW9yJHNldHRpbmdzJHBhY2syIiwidGVzdCIsInNldHRpbmdzIiwicGFja2FnZXMiLCJhY2NvdW50cyIsInBhc3N3b3JkTWF4TGVuZ3RoIiwicmVnaXN0ZXJMb2dpbkhhbmRsZXIiLCJfQWNjb3VudHMkX2NoZWNrMmZhRW4iLCJfQWNjb3VudHMiLCJ1bmRlZmluZWQiLCJfdXNlclF1ZXJ5VmFsaWRhdG9yIiwiY29kZSIsIk9wdGlvbmFsIiwiZmllbGRzIiwiX2NoZWNrMmZhRW5hYmxlZCIsImNhbGwiLCJfaXNUb2tlblZhbGlkIiwidHdvRmFjdG9yQXV0aGVudGljYXRpb24iLCJzZWNyZXQiLCJzZXRVc2VybmFtZSIsIm5ld1VzZXJuYW1lIiwib2xkVXNlcm5hbWUiLCJfY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzIiwiZXgiLCJtZXRob2RzIiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiaGFzaGVkIiwiY3VycmVudFRva2VuIiwiX2dldExvZ2luVG9rZW4iLCJjb25uZWN0aW9uIiwiJHB1bGwiLCJoYXNoZWRUb2tlbiIsIiRuZSIsIiR1bnNldCIsInBhc3N3b3JkQ2hhbmdlZCIsInNldFBhc3N3b3JkQXN5bmMiLCJuZXdQbGFpbnRleHRQYXNzd29yZCIsIl9NZXRlb3Ikc2V0dGluZ3MyIiwiX01ldGVvciRzZXR0aW5nczIkcGFjIiwiX01ldGVvciRzZXR0aW5nczIkcGFjMiIsIk1heWJlIiwibG9nb3V0IiwiQm9vbGVhbiIsInNldFBhc3N3b3JkIiwicGx1Y2tBZGRyZXNzZXMiLCJlbWFpbHMiLCJhcmd1bWVudHMiLCJtYXAiLCJhZGRyZXNzIiwiZm9yZ290UGFzc3dvcmQiLCJjYXNlU2Vuc2l0aXZlRW1haWwiLCJmaW5kIiwidG9Mb3dlckNhc2UiLCJzZW5kUmVzZXRQYXNzd29yZEVtYWlsIiwiZ2VuZXJhdGVSZXNldFRva2VuIiwicmVhc29uIiwiZXh0cmFUb2tlbkRhdGEiLCJpbmNsdWRlcyIsInRva2VuIiwiUmFuZG9tIiwidG9rZW5SZWNvcmQiLCJ3aGVuIiwiRGF0ZSIsIk9iamVjdCIsImFzc2lnbiIsIl9lbnN1cmUiLCJlbnJvbGwiLCJyZXNldCIsImdlbmVyYXRlVmVyaWZpY2F0aW9uVG9rZW4iLCJlbWFpbFJlY29yZCIsImUiLCJ2ZXJpZmllZCIsIiRwdXNoIiwidmVyaWZpY2F0aW9uVG9rZW5zIiwicHVzaCIsImV4dHJhUGFyYW1zIiwicmVhbEVtYWlsIiwidXJscyIsImdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsIiwiRW1haWwiLCJzZW5kIiwiaXNEZXZlbG9wbWVudCIsImNvbnNvbGUiLCJsb2ciLCJzZW5kRW5yb2xsbWVudEVtYWlsIiwiX2xlbiIsImFyZ3MiLCJBcnJheSIsIl9rZXkiLCJfbG9naW5NZXRob2QiLCJfQWNjb3VudHMkX2NoZWNrMmZhRW4yIiwiX0FjY291bnRzMiIsImlzRW5yb2xsIiwidG9rZW5MaWZldGltZU1zIiwiX2dldFBhc3N3b3JkUmVzZXRUb2tlbkxpZmV0aW1lTXMiLCJfZ2V0UGFzc3dvcmRFbnJvbGxUb2tlbkxpZmV0aW1lTXMiLCJjdXJyZW50VGltZU1zIiwibm93Iiwib2xkVG9rZW4iLCJfc2V0TG9naW5Ub2tlbiIsInJlc2V0VG9PbGRUb2tlbiIsImFmZmVjdGVkUmVjb3JkcyIsImVyciIsIl9jbGVhckFsbExvZ2luVG9rZW5zIiwic2VuZFZlcmlmaWNhdGlvbkVtYWlsIiwiX2xlbjIiLCJfa2V5MiIsIl9BY2NvdW50cyRfY2hlY2syZmFFbjMiLCJfQWNjb3VudHMzIiwidCIsImVtYWlsc1JlY29yZCIsImFkZEVtYWlsIiwibmV3RW1haWwiLCJjYXNlSW5zZW5zaXRpdmVSZWdFeHAiLCJSZWdFeHAiLCJfZXNjYXBlUmVnRXhwIiwiZGlkVXBkYXRlT3duRW1haWwiLCJyZWR1Y2UiLCJwcmV2IiwiJGFkZFRvU2V0IiwicmVtb3ZlRW1haWwiLCJjcmVhdGVVc2VyIiwiT2JqZWN0SW5jbHVkaW5nIiwiX2NyZWF0ZVVzZXJDaGVja2luZ0R1cGxpY2F0ZXMiLCJfbGVuMyIsIl9rZXkzIiwiZm9yYmlkQ2xpZW50QWNjb3VudENyZWF0aW9uIiwiY3JlYXRlVXNlclZlcmlmeWluZ0VtYWlsIiwiY3JlYXRlVXNlckFzeW5jIiwiY2FsbGJhY2siLCJjcmVhdGVJbmRleEFzeW5jIiwidW5pcXVlIiwic3BhcnNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsSUFBSUEsYUFBYTtBQUFDQyxNQUFNLENBQUNDLElBQUksQ0FBQyxzQ0FBc0MsRUFBQztFQUFDQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUM7SUFBQ0osYUFBYSxHQUFDSSxDQUFDO0VBQUE7QUFBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQXJHLE1BQU1DLEtBQUssR0FBR0MsVUFBVSxJQUFJLENBQUNDLElBQUksRUFBRUMsR0FBRyxLQUFLO0VBQ3pDLE1BQU1DLFFBQVEsR0FDWkYsSUFBSSxDQUFDRyxPQUFPLElBQUlILElBQUksQ0FBQ0csT0FBTyxDQUFDQyxJQUFJLFlBQUFDLE1BQUEsQ0FDcEJMLElBQUksQ0FBQ0csT0FBTyxDQUFDQyxJQUFJLFNBQzFCLFFBQVE7RUFDZCxVQUFBQyxNQUFBLENBQVVILFFBQVEsVUFBQUcsTUFBQSxDQUVsQk4sVUFBVSx3Q0FBQU0sTUFBQSxDQUVWSixHQUFHO0FBSUwsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtB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SUFBSTJMLFFBQVEsRUFBRTtJQUNaLE1BQU0sSUFBSWhMLEtBQUssQ0FBQyxvRUFBb0UsQ0FBQztFQUN2RjtFQUVBLE9BQU93SyxVQUFVLENBQUNuTCxPQUFPLENBQUM7QUFDNUIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUFsQixRQUFRLENBQUNxTSxVQUFVLEdBQUcsQ0FBQ25MLE9BQU8sRUFBRTJMLFFBQVEsS0FBSztFQUMzQyxPQUFPN0ssT0FBTyxDQUFDRSxLQUFLLENBQUNsQyxRQUFRLENBQUM0TSxlQUFlLENBQUMxTCxPQUFPLEVBQUUyTCxRQUFRLENBQUMsQ0FBQztBQUNuRSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBek0sTUFBTSxDQUFDZSxLQUFLLENBQUMyTCxnQkFBZ0IsQ0FBQyx5Q0FBeUMsRUFDekM7RUFBRUMsTUFBTSxFQUFFLElBQUk7RUFBRUMsTUFBTSxFQUFFO0FBQUssQ0FBQyxDQUFDO0FBQzdENU0sTUFBTSxDQUFDZSxLQUFLLENBQUMyTCxnQkFBZ0IsQ0FBQywrQkFBK0IsRUFDL0I7RUFBRUMsTUFBTSxFQUFFLElBQUk7RUFBRUMsTUFBTSxFQUFFO0FBQUssQ0FBQyxDQUFDO0FBQzdENU0sTUFBTSxDQUFDZSxLQUFLLENBQUMyTCxnQkFBZ0IsQ0FBQyxnQ0FBZ0MsRUFDaEM7RUFBRUMsTUFBTSxFQUFFLElBQUk7RUFBRUMsTUFBTSxFQUFFO0FBQUssQ0FBQyxDQUFDLEMiLCJmaWxlIjoiL3BhY2thZ2VzL2FjY291bnRzLXBhc3N3b3JkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiY29uc3QgZ3JlZXQgPSB3ZWxjb21lTXNnID0+ICh1c2VyLCB1cmwpID0+IHtcbiAgY29uc3QgZ3JlZXRpbmcgPVxuICAgIHVzZXIucHJvZmlsZSAmJiB1c2VyLnByb2ZpbGUubmFtZVxuICAgICAgPyBgSGVsbG8gJHt1c2VyLnByb2ZpbGUubmFtZX0sYFxuICAgICAgOiAnSGVsbG8sJztcbiAgcmV0dXJuIGAke2dyZWV0aW5nfVxuXG4ke3dlbGNvbWVNc2d9LCBzaW1wbHkgY2xpY2sgdGhlIGxpbmsgYmVsb3cuXG5cbiR7dXJsfVxuXG5UaGFuayB5b3UuXG5gO1xufTtcblxuLyoqXG4gKiBAc3VtbWFyeSBPcHRpb25zIHRvIGN1c3RvbWl6ZSBlbWFpbHMgc2VudCBmcm9tIHRoZSBBY2NvdW50cyBzeXN0ZW0uXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5lbWFpbFRlbXBsYXRlcyA9IHtcbiAgLi4uKEFjY291bnRzLmVtYWlsVGVtcGxhdGVzIHx8IHt9KSxcbiAgZnJvbTogJ0FjY291bnRzIEV4YW1wbGUgPG5vLXJlcGx5QGV4YW1wbGUuY29tPicsXG4gIHNpdGVOYW1lOiBNZXRlb3IuYWJzb2x1dGVVcmwoKVxuICAgIC5yZXBsYWNlKC9eaHR0cHM/OlxcL1xcLy8sICcnKVxuICAgIC5yZXBsYWNlKC9cXC8kLywgJycpLFxuXG4gIHJlc2V0UGFzc3dvcmQ6IHtcbiAgICBzdWJqZWN0OiAoKSA9PlxuICAgICAgYEhvdyB0byByZXNldCB5b3VyIHBhc3N3b3JkIG9uICR7QWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuc2l0ZU5hbWV9YCxcbiAgICB0ZXh0OiBncmVldCgnVG8gcmVzZXQgeW91ciBwYXNzd29yZCcpLFxuICB9LFxuICB2ZXJpZnlFbWFpbDoge1xuICAgIHN1YmplY3Q6ICgpID0+XG4gICAgICBgSG93IHRvIHZlcmlmeSBlbWFpbCBhZGRyZXNzIG9uICR7QWNjb3VudHMuZW1haWxUZW1wbGF0ZXMuc2l0ZU5hbWV9YCxcbiAgICB0ZXh0OiBncmVldCgnVG8gdmVyaWZ5IHlvdXIgYWNjb3VudCBlbWFpbCcpLFxuICB9LFxuICBlbnJvbGxBY2NvdW50OiB7XG4gICAgc3ViamVjdDogKCkgPT5cbiAgICAgIGBBbiBhY2NvdW50IGhhcyBiZWVuIGNyZWF0ZWQgZm9yIHlvdSBvbiAke0FjY291bnRzLmVtYWlsVGVtcGxhdGVzLnNpdGVOYW1lfWAsXG4gICAgdGV4dDogZ3JlZXQoJ1RvIHN0YXJ0IHVzaW5nIHRoZSBzZXJ2aWNlJyksXG4gIH0sXG59O1xuIiwiaW1wb3J0IHsgaGFzaCBhcyBiY3J5cHRIYXNoLCBjb21wYXJlIGFzIGJjcnlwdENvbXBhcmUgfSBmcm9tICdiY3J5cHQnO1xuaW1wb3J0IHsgQWNjb3VudHMgfSBmcm9tIFwibWV0ZW9yL2FjY291bnRzLWJhc2VcIjtcblxuLy8gVXRpbGl0eSBmb3IgZ3JhYmJpbmcgdXNlclxuY29uc3QgZ2V0VXNlckJ5SWQgPSAoaWQsIG9wdGlvbnMpID0+IE1ldGVvci51c2Vycy5maW5kT25lKGlkLCBBY2NvdW50cy5fYWRkRGVmYXVsdEZpZWxkU2VsZWN0b3Iob3B0aW9ucykpO1xuXG4vLyBVc2VyIHJlY29yZHMgaGF2ZSBhICdzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnIGZpZWxkIG9uIHRoZW0gdG8gaG9sZFxuLy8gdGhlaXIgaGFzaGVkIHBhc3N3b3Jkcy5cbi8vXG4vLyBXaGVuIHRoZSBjbGllbnQgc2VuZHMgYSBwYXNzd29yZCB0byB0aGUgc2VydmVyLCBpdCBjYW4gZWl0aGVyIGJlIGFcbi8vIHN0cmluZyAodGhlIHBsYWludGV4dCBwYXNzd29yZCkgb3IgYW4gb2JqZWN0IHdpdGgga2V5cyAnZGlnZXN0JyBhbmRcbi8vICdhbGdvcml0aG0nIChtdXN0IGJlIFwic2hhLTI1NlwiIGZvciBub3cpLiBUaGUgTWV0ZW9yIGNsaWVudCBhbHdheXMgc2VuZHNcbi8vIHBhc3N3b3JkIG9iamVjdHMgeyBkaWdlc3Q6ICosIGFsZ29yaXRobTogXCJzaGEtMjU2XCIgfSwgYnV0IEREUCBjbGllbnRzXG4vLyB0aGF0IGRvbid0IGhhdmUgYWNjZXNzIHRvIFNIQSBjYW4ganVzdCBzZW5kIHBsYWludGV4dCBwYXNzd29yZHMgYXNcbi8vIHN0cmluZ3MuXG4vL1xuLy8gV2hlbiB0aGUgc2VydmVyIHJlY2VpdmVzIGEgcGxhaW50ZXh0IHBhc3N3b3JkIGFzIGEgc3RyaW5nLCBpdCBhbHdheXNcbi8vIGhhc2hlcyBpdCB3aXRoIFNIQTI1NiBiZWZvcmUgcGFzc2luZyBpdCBpbnRvIGJjcnlwdC4gV2hlbiB0aGUgc2VydmVyXG4vLyByZWNlaXZlcyBhIHBhc3N3b3JkIGFzIGFuIG9iamVjdCwgaXQgYXNzZXJ0cyB0aGF0IHRoZSBhbGdvcml0aG0gaXNcbi8vIFwic2hhLTI1NlwiIGFuZCB0aGVuIHBhc3NlcyB0aGUgZGlnZXN0IHRvIGJjcnlwdC5cblxuXG5BY2NvdW50cy5fYmNyeXB0Um91bmRzID0gKCkgPT4gQWNjb3VudHMuX29wdGlvbnMuYmNyeXB0Um91bmRzIHx8IDEwO1xuXG4vLyBHaXZlbiBhICdwYXNzd29yZCcgZnJvbSB0aGUgY2xpZW50LCBleHRyYWN0IHRoZSBzdHJpbmcgdGhhdCB3ZSBzaG91bGRcbi8vIGJjcnlwdC4gJ3Bhc3N3b3JkJyBjYW4gYmUgb25lIG9mOlxuLy8gIC0gU3RyaW5nICh0aGUgcGxhaW50ZXh0IHBhc3N3b3JkKVxuLy8gIC0gT2JqZWN0IHdpdGggJ2RpZ2VzdCcgYW5kICdhbGdvcml0aG0nIGtleXMuICdhbGdvcml0aG0nIG11c3QgYmUgXCJzaGEtMjU2XCIuXG4vL1xuY29uc3QgZ2V0UGFzc3dvcmRTdHJpbmcgPSBwYXNzd29yZCA9PiB7XG4gIGlmICh0eXBlb2YgcGFzc3dvcmQgPT09IFwic3RyaW5nXCIpIHtcbiAgICBwYXNzd29yZCA9IFNIQTI1NihwYXNzd29yZCk7XG4gIH0gZWxzZSB7IC8vICdwYXNzd29yZCcgaXMgYW4gb2JqZWN0XG4gICAgaWYgKHBhc3N3b3JkLmFsZ29yaXRobSAhPT0gXCJzaGEtMjU2XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcGFzc3dvcmQgaGFzaCBhbGdvcml0aG0uIFwiICtcbiAgICAgICAgICAgICAgICAgICAgICBcIk9ubHkgJ3NoYS0yNTYnIGlzIGFsbG93ZWQuXCIpO1xuICAgIH1cbiAgICBwYXNzd29yZCA9IHBhc3N3b3JkLmRpZ2VzdDtcbiAgfVxuICByZXR1cm4gcGFzc3dvcmQ7XG59O1xuXG4vLyBVc2UgYmNyeXB0IHRvIGhhc2ggdGhlIHBhc3N3b3JkIGZvciBzdG9yYWdlIGluIHRoZSBkYXRhYmFzZS5cbi8vIGBwYXNzd29yZGAgY2FuIGJlIGEgc3RyaW5nIChpbiB3aGljaCBjYXNlIGl0IHdpbGwgYmUgcnVuIHRocm91Z2hcbi8vIFNIQTI1NiBiZWZvcmUgYmNyeXB0KSBvciBhbiBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIGBkaWdlc3RgIGFuZFxuLy8gYGFsZ29yaXRobWAgKGluIHdoaWNoIGNhc2Ugd2UgYmNyeXB0IGBwYXNzd29yZC5kaWdlc3RgKS5cbi8vXG5jb25zdCBoYXNoUGFzc3dvcmQgPSBhc3luYyBwYXNzd29yZCA9PiB7XG4gIHBhc3N3b3JkID0gZ2V0UGFzc3dvcmRTdHJpbmcocGFzc3dvcmQpO1xuICByZXR1cm4gYXdhaXQgYmNyeXB0SGFzaChwYXNzd29yZCwgQWNjb3VudHMuX2JjcnlwdFJvdW5kcygpKTtcbn07XG5cbi8vIEV4dHJhY3QgdGhlIG51bWJlciBvZiByb3VuZHMgdXNlZCBpbiB0aGUgc3BlY2lmaWVkIGJjcnlwdCBoYXNoLlxuY29uc3QgZ2V0Um91bmRzRnJvbUJjcnlwdEhhc2ggPSBoYXNoID0+IHtcbiAgbGV0IHJvdW5kcztcbiAgaWYgKGhhc2gpIHtcbiAgICBjb25zdCBoYXNoU2VnbWVudHMgPSBoYXNoLnNwbGl0KCckJyk7XG4gICAgaWYgKGhhc2hTZWdtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICByb3VuZHMgPSBwYXJzZUludChoYXNoU2VnbWVudHNbMl0sIDEwKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJvdW5kcztcbn07XG5cbi8vIENoZWNrIHdoZXRoZXIgdGhlIHByb3ZpZGVkIHBhc3N3b3JkIG1hdGNoZXMgdGhlIGJjcnlwdCdlZCBwYXNzd29yZCBpblxuLy8gdGhlIGRhdGFiYXNlIHVzZXIgcmVjb3JkLiBgcGFzc3dvcmRgIGNhbiBiZSBhIHN0cmluZyAoaW4gd2hpY2ggY2FzZVxuLy8gaXQgd2lsbCBiZSBydW4gdGhyb3VnaCBTSEEyNTYgYmVmb3JlIGJjcnlwdCkgb3IgYW4gb2JqZWN0IHdpdGhcbi8vIHByb3BlcnRpZXMgYGRpZ2VzdGAgYW5kIGBhbGdvcml0aG1gIChpbiB3aGljaCBjYXNlIHdlIGJjcnlwdFxuLy8gYHBhc3N3b3JkLmRpZ2VzdGApLlxuLy9cbi8vIFRoZSB1c2VyIHBhcmFtZXRlciBuZWVkcyBhdCBsZWFzdCB1c2VyLl9pZCBhbmQgdXNlci5zZXJ2aWNlc1xuQWNjb3VudHMuX2NoZWNrUGFzc3dvcmRVc2VyRmllbGRzID0ge19pZDogMSwgc2VydmljZXM6IDF9O1xuLy9cbmNvbnN0IGNoZWNrUGFzc3dvcmRBc3luYyA9IGFzeW5jICh1c2VyLCBwYXNzd29yZCkgPT4ge1xuICBjb25zdCByZXN1bHQgPSB7XG4gICAgdXNlcklkOiB1c2VyLl9pZFxuICB9O1xuXG4gIGNvbnN0IGZvcm1hdHRlZFBhc3N3b3JkID0gZ2V0UGFzc3dvcmRTdHJpbmcocGFzc3dvcmQpO1xuICBjb25zdCBoYXNoID0gdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQ7XG4gIGNvbnN0IGhhc2hSb3VuZHMgPSBnZXRSb3VuZHNGcm9tQmNyeXB0SGFzaChoYXNoKTtcblxuICBpZiAoISBhd2FpdCBiY3J5cHRDb21wYXJlKGZvcm1hdHRlZFBhc3N3b3JkLCBoYXNoKSkge1xuICAgIHJlc3VsdC5lcnJvciA9IEFjY291bnRzLl9oYW5kbGVFcnJvcihcIkluY29ycmVjdCBwYXNzd29yZFwiLCBmYWxzZSk7XG4gIH0gZWxzZSBpZiAoaGFzaCAmJiBBY2NvdW50cy5fYmNyeXB0Um91bmRzKCkgIT0gaGFzaFJvdW5kcykge1xuICAgIC8vIFRoZSBwYXNzd29yZCBjaGVja3Mgb3V0LCBidXQgdGhlIHVzZXIncyBiY3J5cHQgaGFzaCBuZWVkcyB0byBiZSB1cGRhdGVkLlxuXG4gICAgTWV0ZW9yLmRlZmVyKGFzeW5jICgpID0+IHtcbiAgICAgIE1ldGVvci51c2Vycy51cGRhdGUoeyBfaWQ6IHVzZXIuX2lkIH0sIHtcbiAgICAgICAgJHNldDoge1xuICAgICAgICAgICdzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnOlxuICAgICAgICAgICAgYXdhaXQgYmNyeXB0SGFzaChmb3JtYXR0ZWRQYXNzd29yZCwgQWNjb3VudHMuX2JjcnlwdFJvdW5kcygpKVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59O1xuXG5jb25zdCBjaGVja1Bhc3N3b3JkID0gKHVzZXIsIHBhc3N3b3JkKSA9PiB7XG4gIHJldHVybiBQcm9taXNlLmF3YWl0KGNoZWNrUGFzc3dvcmRBc3luYyh1c2VyLCBwYXNzd29yZCkpO1xufTtcblxuQWNjb3VudHMuX2NoZWNrUGFzc3dvcmQgPSBjaGVja1Bhc3N3b3JkO1xuQWNjb3VudHMuX2NoZWNrUGFzc3dvcmRBc3luYyA9ICBjaGVja1Bhc3N3b3JkQXN5bmM7XG5cbi8vL1xuLy8vIExPR0lOXG4vLy9cblxuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmRzIHRoZSB1c2VyIHdpdGggdGhlIHNwZWNpZmllZCB1c2VybmFtZS5cbiAqIEZpcnN0IHRyaWVzIHRvIG1hdGNoIHVzZXJuYW1lIGNhc2Ugc2Vuc2l0aXZlbHk7IGlmIHRoYXQgZmFpbHMsIGl0XG4gKiB0cmllcyBjYXNlIGluc2Vuc2l0aXZlbHk7IGJ1dCBpZiBtb3JlIHRoYW4gb25lIHVzZXIgbWF0Y2hlcyB0aGUgY2FzZVxuICogaW5zZW5zaXRpdmUgc2VhcmNoLCBpdCByZXR1cm5zIG51bGwuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcm5hbWUgVGhlIHVzZXJuYW1lIHRvIGxvb2sgZm9yXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge01vbmdvRmllbGRTcGVjaWZpZXJ9IG9wdGlvbnMuZmllbGRzIERpY3Rpb25hcnkgb2YgZmllbGRzIHRvIHJldHVybiBvciBleGNsdWRlLlxuICogQHJldHVybnMge09iamVjdH0gQSB1c2VyIGlmIGZvdW5kLCBlbHNlIG51bGxcbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLmZpbmRVc2VyQnlVc2VybmFtZSA9XG4gICh1c2VybmFtZSwgb3B0aW9ucykgPT4gQWNjb3VudHMuX2ZpbmRVc2VyQnlRdWVyeSh7IHVzZXJuYW1lIH0sIG9wdGlvbnMpO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZpbmRzIHRoZSB1c2VyIHdpdGggdGhlIHNwZWNpZmllZCBlbWFpbC5cbiAqIEZpcnN0IHRyaWVzIHRvIG1hdGNoIGVtYWlsIGNhc2Ugc2Vuc2l0aXZlbHk7IGlmIHRoYXQgZmFpbHMsIGl0XG4gKiB0cmllcyBjYXNlIGluc2Vuc2l0aXZlbHk7IGJ1dCBpZiBtb3JlIHRoYW4gb25lIHVzZXIgbWF0Y2hlcyB0aGUgY2FzZVxuICogaW5zZW5zaXRpdmUgc2VhcmNoLCBpdCByZXR1cm5zIG51bGwuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgVGhlIGVtYWlsIGFkZHJlc3MgdG8gbG9vayBmb3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cbiAqIEBwYXJhbSB7TW9uZ29GaWVsZFNwZWNpZmllcn0gb3B0aW9ucy5maWVsZHMgRGljdGlvbmFyeSBvZiBmaWVsZHMgdG8gcmV0dXJuIG9yIGV4Y2x1ZGUuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBBIHVzZXIgaWYgZm91bmQsIGVsc2UgbnVsbFxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuZmluZFVzZXJCeUVtYWlsID1cbiAgKGVtYWlsLCBvcHRpb25zKSA9PiBBY2NvdW50cy5fZmluZFVzZXJCeVF1ZXJ5KHsgZW1haWwgfSwgb3B0aW9ucyk7XG5cbi8vIFhYWCBtYXliZSB0aGlzIGJlbG9uZ3MgaW4gdGhlIGNoZWNrIHBhY2thZ2VcbmNvbnN0IE5vbkVtcHR5U3RyaW5nID0gTWF0Y2guV2hlcmUoeCA9PiB7XG4gIGNoZWNrKHgsIFN0cmluZyk7XG4gIHJldHVybiB4Lmxlbmd0aCA+IDA7XG59KTtcblxuY29uc3QgcGFzc3dvcmRWYWxpZGF0b3IgPSBNYXRjaC5PbmVPZihcbiAgTWF0Y2guV2hlcmUoc3RyID0+IE1hdGNoLnRlc3Qoc3RyLCBTdHJpbmcpICYmIHN0ci5sZW5ndGggPD0gTWV0ZW9yLnNldHRpbmdzPy5wYWNrYWdlcz8uYWNjb3VudHM/LnBhc3N3b3JkTWF4TGVuZ3RoIHx8IDI1NiksIHtcbiAgICBkaWdlc3Q6IE1hdGNoLldoZXJlKHN0ciA9PiBNYXRjaC50ZXN0KHN0ciwgU3RyaW5nKSAmJiBzdHIubGVuZ3RoID09PSA2NCksXG4gICAgYWxnb3JpdGhtOiBNYXRjaC5PbmVPZignc2hhLTI1NicpXG4gIH1cbik7XG5cbi8vIEhhbmRsZXIgdG8gbG9naW4gd2l0aCBhIHBhc3N3b3JkLlxuLy9cbi8vIFRoZSBNZXRlb3IgY2xpZW50IHNldHMgb3B0aW9ucy5wYXNzd29yZCB0byBhbiBvYmplY3Qgd2l0aCBrZXlzXG4vLyAnZGlnZXN0JyAoc2V0IHRvIFNIQTI1NihwYXNzd29yZCkpIGFuZCAnYWxnb3JpdGhtJyAoXCJzaGEtMjU2XCIpLlxuLy9cbi8vIEZvciBvdGhlciBERFAgY2xpZW50cyB3aGljaCBkb24ndCBoYXZlIGFjY2VzcyB0byBTSEEsIHRoZSBoYW5kbGVyXG4vLyBhbHNvIGFjY2VwdHMgdGhlIHBsYWludGV4dCBwYXNzd29yZCBpbiBvcHRpb25zLnBhc3N3b3JkIGFzIGEgc3RyaW5nLlxuLy9cbi8vIChJdCBtaWdodCBiZSBuaWNlIGlmIHNlcnZlcnMgY291bGQgdHVybiB0aGUgcGxhaW50ZXh0IHBhc3N3b3JkXG4vLyBvcHRpb24gb2ZmLiBPciBtYXliZSBpdCBzaG91bGQgYmUgb3B0LWluLCBub3Qgb3B0LW91dD9cbi8vIEFjY291bnRzLmNvbmZpZyBvcHRpb24/KVxuLy9cbi8vIE5vdGUgdGhhdCBuZWl0aGVyIHBhc3N3b3JkIG9wdGlvbiBpcyBzZWN1cmUgd2l0aG91dCBTU0wuXG4vL1xuQWNjb3VudHMucmVnaXN0ZXJMb2dpbkhhbmRsZXIoXCJwYXNzd29yZFwiLCBhc3luYyBvcHRpb25zID0+IHtcbiAgaWYgKCFvcHRpb25zLnBhc3N3b3JkKVxuICAgIHJldHVybiB1bmRlZmluZWQ7IC8vIGRvbid0IGhhbmRsZVxuXG4gIGNoZWNrKG9wdGlvbnMsIHtcbiAgICB1c2VyOiBBY2NvdW50cy5fdXNlclF1ZXJ5VmFsaWRhdG9yLFxuICAgIHBhc3N3b3JkOiBwYXNzd29yZFZhbGlkYXRvcixcbiAgICBjb2RlOiBNYXRjaC5PcHRpb25hbChOb25FbXB0eVN0cmluZyksXG4gIH0pO1xuXG5cbiAgY29uc3QgdXNlciA9IEFjY291bnRzLl9maW5kVXNlckJ5UXVlcnkob3B0aW9ucy51c2VyLCB7ZmllbGRzOiB7XG4gICAgc2VydmljZXM6IDEsXG4gICAgLi4uQWNjb3VudHMuX2NoZWNrUGFzc3dvcmRVc2VyRmllbGRzLFxuICB9fSk7XG4gIGlmICghdXNlcikge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIlVzZXIgbm90IGZvdW5kXCIpO1xuICB9XG5cblxuICBpZiAoIXVzZXIuc2VydmljZXMgfHwgIXVzZXIuc2VydmljZXMucGFzc3dvcmQgfHxcbiAgICAgICF1c2VyLnNlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCkge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIlVzZXIgaGFzIG5vIHBhc3N3b3JkIHNldFwiKTtcbiAgfVxuXG4gIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNoZWNrUGFzc3dvcmRBc3luYyh1c2VyLCBvcHRpb25zLnBhc3N3b3JkKTtcbiAgLy8gVGhpcyBtZXRob2QgaXMgYWRkZWQgYnkgdGhlIHBhY2thZ2UgYWNjb3VudHMtMmZhXG4gIC8vIEZpcnN0IHRoZSBsb2dpbiBpcyB2YWxpZGF0ZWQsIHRoZW4gdGhlIGNvZGUgc2l0dWF0aW9uIGlzIGNoZWNrZWRcbiAgaWYgKFxuICAgICFyZXN1bHQuZXJyb3IgJiZcbiAgICBBY2NvdW50cy5fY2hlY2syZmFFbmFibGVkPy4odXNlcilcbiAgKSB7XG4gICAgaWYgKCFvcHRpb25zLmNvZGUpIHtcbiAgICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcignMkZBIGNvZGUgbXVzdCBiZSBpbmZvcm1lZCcsIHRydWUsICduby0yZmEtY29kZScpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhQWNjb3VudHMuX2lzVG9rZW5WYWxpZChcbiAgICAgICAgdXNlci5zZXJ2aWNlcy50d29GYWN0b3JBdXRoZW50aWNhdGlvbi5zZWNyZXQsXG4gICAgICAgIG9wdGlvbnMuY29kZVxuICAgICAgKVxuICAgICkge1xuICAgICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKCdJbnZhbGlkIDJGQSBjb2RlJywgdHJ1ZSwgJ2ludmFsaWQtMmZhLWNvZGUnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufSk7XG5cbi8vL1xuLy8vIENIQU5HSU5HXG4vLy9cblxuLyoqXG4gKiBAc3VtbWFyeSBDaGFuZ2UgYSB1c2VyJ3MgdXNlcm5hbWUuIFVzZSB0aGlzIGluc3RlYWQgb2YgdXBkYXRpbmcgdGhlXG4gKiBkYXRhYmFzZSBkaXJlY3RseS4gVGhlIG9wZXJhdGlvbiB3aWxsIGZhaWwgaWYgdGhlcmUgaXMgYW4gZXhpc3RpbmcgdXNlclxuICogd2l0aCBhIHVzZXJuYW1lIG9ubHkgZGlmZmVyaW5nIGluIGNhc2UuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmV3VXNlcm5hbWUgQSBuZXcgdXNlcm5hbWUgZm9yIHRoZSB1c2VyLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2V0VXNlcm5hbWUgPSAodXNlcklkLCBuZXdVc2VybmFtZSkgPT4ge1xuICBjaGVjayh1c2VySWQsIE5vbkVtcHR5U3RyaW5nKTtcbiAgY2hlY2sobmV3VXNlcm5hbWUsIE5vbkVtcHR5U3RyaW5nKTtcblxuICBjb25zdCB1c2VyID0gZ2V0VXNlckJ5SWQodXNlcklkLCB7ZmllbGRzOiB7XG4gICAgdXNlcm5hbWU6IDEsXG4gIH19KTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICBjb25zdCBvbGRVc2VybmFtZSA9IHVzZXIudXNlcm5hbWU7XG5cbiAgLy8gUGVyZm9ybSBhIGNhc2UgaW5zZW5zaXRpdmUgY2hlY2sgZm9yIGR1cGxpY2F0ZXMgYmVmb3JlIHVwZGF0ZVxuICBBY2NvdW50cy5fY2hlY2tGb3JDYXNlSW5zZW5zaXRpdmVEdXBsaWNhdGVzKCd1c2VybmFtZScsXG4gICAgJ1VzZXJuYW1lJywgbmV3VXNlcm5hbWUsIHVzZXIuX2lkKTtcblxuICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgeyRzZXQ6IHt1c2VybmFtZTogbmV3VXNlcm5hbWV9fSk7XG5cbiAgLy8gUGVyZm9ybSBhbm90aGVyIGNoZWNrIGFmdGVyIHVwZGF0ZSwgaW4gY2FzZSBhIG1hdGNoaW5nIHVzZXIgaGFzIGJlZW5cbiAgLy8gaW5zZXJ0ZWQgaW4gdGhlIG1lYW50aW1lXG4gIHRyeSB7XG4gICAgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygndXNlcm5hbWUnLFxuICAgICAgJ1VzZXJuYW1lJywgbmV3VXNlcm5hbWUsIHVzZXIuX2lkKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICAvLyBVbmRvIHVwZGF0ZSBpZiB0aGUgY2hlY2sgZmFpbHNcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSwgeyRzZXQ6IHt1c2VybmFtZTogb2xkVXNlcm5hbWV9fSk7XG4gICAgdGhyb3cgZXg7XG4gIH1cbn07XG5cbi8vIExldCB0aGUgdXNlciBjaGFuZ2UgdGhlaXIgb3duIHBhc3N3b3JkIGlmIHRoZXkga25vdyB0aGUgb2xkXG4vLyBwYXNzd29yZC4gYG9sZFBhc3N3b3JkYCBhbmQgYG5ld1Bhc3N3b3JkYCBzaG91bGQgYmUgb2JqZWN0cyB3aXRoIGtleXNcbi8vIGBkaWdlc3RgIGFuZCBgYWxnb3JpdGhtYCAocmVwcmVzZW50aW5nIHRoZSBTSEEyNTYgb2YgdGhlIHBhc3N3b3JkKS5cbk1ldGVvci5tZXRob2RzKHtjaGFuZ2VQYXNzd29yZDogYXN5bmMgZnVuY3Rpb24gKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICBjaGVjayhvbGRQYXNzd29yZCwgcGFzc3dvcmRWYWxpZGF0b3IpO1xuICBjaGVjayhuZXdQYXNzd29yZCwgcGFzc3dvcmRWYWxpZGF0b3IpO1xuXG4gIGlmICghdGhpcy51c2VySWQpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgXCJNdXN0IGJlIGxvZ2dlZCBpblwiKTtcbiAgfVxuXG4gIGNvbnN0IHVzZXIgPSBnZXRVc2VyQnlJZCh0aGlzLnVzZXJJZCwge2ZpZWxkczoge1xuICAgIHNlcnZpY2VzOiAxLFxuICAgIC4uLkFjY291bnRzLl9jaGVja1Bhc3N3b3JkVXNlckZpZWxkcyxcbiAgfX0pO1xuICBpZiAoIXVzZXIpIHtcbiAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIGlmICghdXNlci5zZXJ2aWNlcyB8fCAhdXNlci5zZXJ2aWNlcy5wYXNzd29yZCB8fCAhdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQpIHtcbiAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJVc2VyIGhhcyBubyBwYXNzd29yZCBzZXRcIik7XG4gIH1cblxuICBjb25zdCByZXN1bHQgPSBhd2FpdCBjaGVja1Bhc3N3b3JkQXN5bmModXNlciwgb2xkUGFzc3dvcmQpO1xuICBpZiAocmVzdWx0LmVycm9yKSB7XG4gICAgdGhyb3cgcmVzdWx0LmVycm9yO1xuICB9XG5cbiAgY29uc3QgaGFzaGVkID0gYXdhaXQgaGFzaFBhc3N3b3JkKG5ld1Bhc3N3b3JkKTtcblxuICAvLyBJdCB3b3VsZCBiZSBiZXR0ZXIgaWYgdGhpcyByZW1vdmVkIEFMTCBleGlzdGluZyB0b2tlbnMgYW5kIHJlcGxhY2VkXG4gIC8vIHRoZSB0b2tlbiBmb3IgdGhlIGN1cnJlbnQgY29ubmVjdGlvbiB3aXRoIGEgbmV3IG9uZSwgYnV0IHRoYXQgd291bGRcbiAgLy8gYmUgdHJpY2t5LCBzbyB3ZSdsbCBzZXR0bGUgZm9yIGp1c3QgcmVwbGFjaW5nIGFsbCB0b2tlbnMgb3RoZXIgdGhhblxuICAvLyB0aGUgb25lIGZvciB0aGUgY3VycmVudCBjb25uZWN0aW9uLlxuICBjb25zdCBjdXJyZW50VG9rZW4gPSBBY2NvdW50cy5fZ2V0TG9naW5Ub2tlbih0aGlzLmNvbm5lY3Rpb24uaWQpO1xuICBNZXRlb3IudXNlcnMudXBkYXRlKFxuICAgIHsgX2lkOiB0aGlzLnVzZXJJZCB9LFxuICAgIHtcbiAgICAgICRzZXQ6IHsgJ3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6IGhhc2hlZCB9LFxuICAgICAgJHB1bGw6IHtcbiAgICAgICAgJ3NlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucyc6IHsgaGFzaGVkVG9rZW46IHsgJG5lOiBjdXJyZW50VG9rZW4gfSB9XG4gICAgICB9LFxuICAgICAgJHVuc2V0OiB7ICdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldCc6IDEgfVxuICAgIH1cbiAgKTtcblxuICByZXR1cm4ge3Bhc3N3b3JkQ2hhbmdlZDogdHJ1ZX07XG59fSk7XG5cblxuLy8gRm9yY2UgY2hhbmdlIHRoZSB1c2VycyBwYXNzd29yZC5cblxuLyoqXG4gKiBAc3VtbWFyeSBGb3JjaWJseSBjaGFuZ2UgdGhlIHBhc3N3b3JkIGZvciBhIHVzZXIuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmV3UGFzc3dvcmQgQSBuZXcgcGFzc3dvcmQgZm9yIHRoZSB1c2VyLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMubG9nb3V0IExvZ291dCBhbGwgY3VycmVudCBjb25uZWN0aW9ucyB3aXRoIHRoaXMgdXNlcklkIChkZWZhdWx0OiB0cnVlKVxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2V0UGFzc3dvcmRBc3luYyA9IGFzeW5jICh1c2VySWQsIG5ld1BsYWludGV4dFBhc3N3b3JkLCBvcHRpb25zKSA9PiB7XG4gIGNoZWNrKHVzZXJJZCwgU3RyaW5nKTtcbiAgY2hlY2sobmV3UGxhaW50ZXh0UGFzc3dvcmQsIE1hdGNoLldoZXJlKHN0ciA9PiBNYXRjaC50ZXN0KHN0ciwgU3RyaW5nKSAmJiBzdHIubGVuZ3RoIDw9IE1ldGVvci5zZXR0aW5ncz8ucGFja2FnZXM/LmFjY291bnRzPy5wYXNzd29yZE1heExlbmd0aCB8fCAyNTYpKTtcbiAgY2hlY2sob3B0aW9ucywgTWF0Y2guTWF5YmUoeyBsb2dvdXQ6IEJvb2xlYW4gfSkpO1xuICBvcHRpb25zID0geyBsb2dvdXQ6IHRydWUgLCAuLi5vcHRpb25zIH07XG5cbiAgY29uc3QgdXNlciA9IGdldFVzZXJCeUlkKHVzZXJJZCwge2ZpZWxkczoge19pZDogMX19KTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG4gIH1cblxuICBjb25zdCB1cGRhdGUgPSB7XG4gICAgJHVuc2V0OiB7XG4gICAgICAnc2VydmljZXMucGFzc3dvcmQucmVzZXQnOiAxXG4gICAgfSxcbiAgICAkc2V0OiB7J3NlcnZpY2VzLnBhc3N3b3JkLmJjcnlwdCc6IGF3YWl0IGhhc2hQYXNzd29yZChuZXdQbGFpbnRleHRQYXNzd29yZCl9XG4gIH07XG5cbiAgaWYgKG9wdGlvbnMubG9nb3V0KSB7XG4gICAgdXBkYXRlLiR1bnNldFsnc2VydmljZXMucmVzdW1lLmxvZ2luVG9rZW5zJ10gPSAxO1xuICB9XG5cbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHVwZGF0ZSk7XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEZvcmNpYmx5IGNoYW5nZSB0aGUgcGFzc3dvcmQgZm9yIGEgdXNlci5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuZXdQYXNzd29yZCBBIG5ldyBwYXNzd29yZCBmb3IgdGhlIHVzZXIuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5sb2dvdXQgTG9nb3V0IGFsbCBjdXJyZW50IGNvbm5lY3Rpb25zIHdpdGggdGhpcyB1c2VySWQgKGRlZmF1bHQ6IHRydWUpXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5zZXRQYXNzd29yZCA9ICh1c2VySWQsIG5ld1BsYWludGV4dFBhc3N3b3JkLCBvcHRpb25zKSA9PiB7XG4gIHJldHVybiBQcm9taXNlLmF3YWl0KEFjY291bnRzLnNldFBhc3N3b3JkQXN5bmModXNlcklkLCBuZXdQbGFpbnRleHRQYXNzd29yZCwgb3B0aW9ucykpO1xufTtcblxuXG4vLy9cbi8vLyBSRVNFVFRJTkcgVklBIEVNQUlMXG4vLy9cblxuLy8gVXRpbGl0eSBmb3IgcGx1Y2tpbmcgYWRkcmVzc2VzIGZyb20gZW1haWxzXG5jb25zdCBwbHVja0FkZHJlc3NlcyA9IChlbWFpbHMgPSBbXSkgPT4gZW1haWxzLm1hcChlbWFpbCA9PiBlbWFpbC5hZGRyZXNzKTtcblxuLy8gTWV0aG9kIGNhbGxlZCBieSBhIHVzZXIgdG8gcmVxdWVzdCBhIHBhc3N3b3JkIHJlc2V0IGVtYWlsLiBUaGlzIGlzXG4vLyB0aGUgc3RhcnQgb2YgdGhlIHJlc2V0IHByb2Nlc3MuXG5NZXRlb3IubWV0aG9kcyh7Zm9yZ290UGFzc3dvcmQ6IG9wdGlvbnMgPT4ge1xuICBjaGVjayhvcHRpb25zLCB7ZW1haWw6IFN0cmluZ30pXG5cbiAgY29uc3QgdXNlciA9IEFjY291bnRzLmZpbmRVc2VyQnlFbWFpbChvcHRpb25zLmVtYWlsLCB7IGZpZWxkczogeyBlbWFpbHM6IDEgfSB9KTtcblxuICBpZiAoIXVzZXIpIHtcbiAgICBBY2NvdW50cy5faGFuZGxlRXJyb3IoXCJVc2VyIG5vdCBmb3VuZFwiKTtcbiAgfVxuXG4gIGNvbnN0IGVtYWlscyA9IHBsdWNrQWRkcmVzc2VzKHVzZXIuZW1haWxzKTtcbiAgY29uc3QgY2FzZVNlbnNpdGl2ZUVtYWlsID0gZW1haWxzLmZpbmQoXG4gICAgZW1haWwgPT4gZW1haWwudG9Mb3dlckNhc2UoKSA9PT0gb3B0aW9ucy5lbWFpbC50b0xvd2VyQ2FzZSgpXG4gICk7XG5cbiAgQWNjb3VudHMuc2VuZFJlc2V0UGFzc3dvcmRFbWFpbCh1c2VyLl9pZCwgY2FzZVNlbnNpdGl2ZUVtYWlsKTtcbn19KTtcblxuLyoqXG4gKiBAc3VtbWFyeSBHZW5lcmF0ZXMgYSByZXNldCB0b2tlbiBhbmQgc2F2ZXMgaXQgaW50byB0aGUgZGF0YWJhc2UuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBnZW5lcmF0ZSB0aGUgcmVzZXQgdG9rZW4gZm9yLlxuICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIgdG8gZ2VuZXJhdGUgdGhlIHJlc2V0IHRva2VuIGZvci4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBJZiBgbnVsbGAsIGRlZmF1bHRzIHRvIHRoZSBmaXJzdCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb24gYHJlc2V0UGFzc3dvcmRgIG9yIGBlbnJvbGxBY2NvdW50YC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VufSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5nZW5lcmF0ZVJlc2V0VG9rZW4gPSAodXNlcklkLCBlbWFpbCwgcmVhc29uLCBleHRyYVRva2VuRGF0YSkgPT4ge1xuICAvLyBNYWtlIHN1cmUgdGhlIHVzZXIgZXhpc3RzLCBhbmQgZW1haWwgaXMgb25lIG9mIHRoZWlyIGFkZHJlc3Nlcy5cbiAgLy8gRG9uJ3QgbGltaXQgdGhlIGZpZWxkcyBpbiB0aGUgdXNlciBvYmplY3Qgc2luY2UgdGhlIHVzZXIgaXMgcmV0dXJuZWRcbiAgLy8gYnkgdGhlIGZ1bmN0aW9uIGFuZCBzb21lIG90aGVyIGZpZWxkcyBtaWdodCBiZSB1c2VkIGVsc2V3aGVyZS5cbiAgY29uc3QgdXNlciA9IGdldFVzZXJCeUlkKHVzZXJJZCk7XG4gIGlmICghdXNlcikge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIkNhbid0IGZpbmQgdXNlclwiKTtcbiAgfVxuXG4gIC8vIHBpY2sgdGhlIGZpcnN0IGVtYWlsIGlmIHdlIHdlcmVuJ3QgcGFzc2VkIGFuIGVtYWlsLlxuICBpZiAoIWVtYWlsICYmIHVzZXIuZW1haWxzICYmIHVzZXIuZW1haWxzWzBdKSB7XG4gICAgZW1haWwgPSB1c2VyLmVtYWlsc1swXS5hZGRyZXNzO1xuICB9XG5cbiAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYSB2YWxpZCBlbWFpbFxuICBpZiAoIWVtYWlsIHx8XG4gICAgIShwbHVja0FkZHJlc3Nlcyh1c2VyLmVtYWlscykuaW5jbHVkZXMoZW1haWwpKSkge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIk5vIHN1Y2ggZW1haWwgZm9yIHVzZXIuXCIpO1xuICB9XG5cbiAgY29uc3QgdG9rZW4gPSBSYW5kb20uc2VjcmV0KCk7XG4gIGNvbnN0IHRva2VuUmVjb3JkID0ge1xuICAgIHRva2VuLFxuICAgIGVtYWlsLFxuICAgIHdoZW46IG5ldyBEYXRlKClcbiAgfTtcblxuICBpZiAocmVhc29uID09PSAncmVzZXRQYXNzd29yZCcpIHtcbiAgICB0b2tlblJlY29yZC5yZWFzb24gPSAncmVzZXQnO1xuICB9IGVsc2UgaWYgKHJlYXNvbiA9PT0gJ2Vucm9sbEFjY291bnQnKSB7XG4gICAgdG9rZW5SZWNvcmQucmVhc29uID0gJ2Vucm9sbCc7XG4gIH0gZWxzZSBpZiAocmVhc29uKSB7XG4gICAgLy8gZmFsbGJhY2sgc28gdGhhdCB0aGlzIGZ1bmN0aW9uIGNhbiBiZSB1c2VkIGZvciB1bmtub3duIHJlYXNvbnMgYXMgd2VsbFxuICAgIHRva2VuUmVjb3JkLnJlYXNvbiA9IHJlYXNvbjtcbiAgfVxuXG4gIGlmIChleHRyYVRva2VuRGF0YSkge1xuICAgIE9iamVjdC5hc3NpZ24odG9rZW5SZWNvcmQsIGV4dHJhVG9rZW5EYXRhKTtcbiAgfVxuICAvLyBpZiB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgZnJvbSB0aGUgZW5yb2xsIGFjY291bnQgd29yay1mbG93IHRoZW5cbiAgLy8gc3RvcmUgdGhlIHRva2VuIHJlY29yZCBpbiAnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsJyBkYiBmaWVsZFxuICAvLyBlbHNlIHN0b3JlIHRoZSB0b2tlbiByZWNvcmQgaW4gaW4gJ3NlcnZpY2VzLnBhc3N3b3JkLnJlc2V0JyBkYiBmaWVsZFxuICBpZihyZWFzb24gPT09ICdlbnJvbGxBY2NvdW50Jykge1xuICAgIE1ldGVvci51c2Vycy51cGRhdGUoe19pZDogdXNlci5faWR9LCB7XG4gICAgICAkc2V0IDoge1xuICAgICAgICAnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsJzogdG9rZW5SZWNvcmRcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBiZWZvcmUgcGFzc2luZyB0byB0ZW1wbGF0ZSwgdXBkYXRlIHVzZXIgb2JqZWN0IHdpdGggbmV3IHRva2VuXG4gICAgTWV0ZW9yLl9lbnN1cmUodXNlciwgJ3NlcnZpY2VzJywgJ3Bhc3N3b3JkJykuZW5yb2xsID0gdG9rZW5SZWNvcmQ7XG4gIH0gZWxzZSB7XG4gICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHtcbiAgICAgICRzZXQgOiB7XG4gICAgICAgICdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldCc6IHRva2VuUmVjb3JkXG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gYmVmb3JlIHBhc3NpbmcgdG8gdGVtcGxhdGUsIHVwZGF0ZSB1c2VyIG9iamVjdCB3aXRoIG5ldyB0b2tlblxuICAgIE1ldGVvci5fZW5zdXJlKHVzZXIsICdzZXJ2aWNlcycsICdwYXNzd29yZCcpLnJlc2V0ID0gdG9rZW5SZWNvcmQ7XG4gIH1cblxuICByZXR1cm4ge2VtYWlsLCB1c2VyLCB0b2tlbn07XG59O1xuXG4vKipcbiAqIEBzdW1tYXJ5IEdlbmVyYXRlcyBhbiBlLW1haWwgdmVyaWZpY2F0aW9uIHRva2VuIGFuZCBzYXZlcyBpdCBpbnRvIHRoZSBkYXRhYmFzZS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdlbmVyYXRlIHRoZSAgZS1tYWlsIHZlcmlmaWNhdGlvbiB0b2tlbiBmb3IuXG4gKiBAcGFyYW0ge1N0cmluZ30gZW1haWwgV2hpY2ggYWRkcmVzcyBvZiB0aGUgdXNlciB0byBnZW5lcmF0ZSB0aGUgZS1tYWlsIHZlcmlmaWNhdGlvbiB0b2tlbiBmb3IuIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gSWYgYG51bGxgLCBkZWZhdWx0cyB0byB0aGUgZmlyc3QgdW52ZXJpZmllZCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VufSB2YWx1ZXMuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5nZW5lcmF0ZVZlcmlmaWNhdGlvblRva2VuID0gKHVzZXJJZCwgZW1haWwsIGV4dHJhVG9rZW5EYXRhKSA9PiB7XG4gIC8vIE1ha2Ugc3VyZSB0aGUgdXNlciBleGlzdHMsIGFuZCBlbWFpbCBpcyBvbmUgb2YgdGhlaXIgYWRkcmVzc2VzLlxuICAvLyBEb24ndCBsaW1pdCB0aGUgZmllbGRzIGluIHRoZSB1c2VyIG9iamVjdCBzaW5jZSB0aGUgdXNlciBpcyByZXR1cm5lZFxuICAvLyBieSB0aGUgZnVuY3Rpb24gYW5kIHNvbWUgb3RoZXIgZmllbGRzIG1pZ2h0IGJlIHVzZWQgZWxzZXdoZXJlLlxuICBjb25zdCB1c2VyID0gZ2V0VXNlckJ5SWQodXNlcklkKTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiQ2FuJ3QgZmluZCB1c2VyXCIpO1xuICB9XG5cbiAgLy8gcGljayB0aGUgZmlyc3QgdW52ZXJpZmllZCBlbWFpbCBpZiB3ZSB3ZXJlbid0IHBhc3NlZCBhbiBlbWFpbC5cbiAgaWYgKCFlbWFpbCkge1xuICAgIGNvbnN0IGVtYWlsUmVjb3JkID0gKHVzZXIuZW1haWxzIHx8IFtdKS5maW5kKGUgPT4gIWUudmVyaWZpZWQpO1xuICAgIGVtYWlsID0gKGVtYWlsUmVjb3JkIHx8IHt9KS5hZGRyZXNzO1xuXG4gICAgaWYgKCFlbWFpbCkge1xuICAgICAgQWNjb3VudHMuX2hhbmRsZUVycm9yKFwiVGhhdCB1c2VyIGhhcyBubyB1bnZlcmlmaWVkIGVtYWlsIGFkZHJlc3Nlcy5cIik7XG4gICAgfVxuICB9XG5cbiAgLy8gbWFrZSBzdXJlIHdlIGhhdmUgYSB2YWxpZCBlbWFpbFxuICBpZiAoIWVtYWlsIHx8XG4gICAgIShwbHVja0FkZHJlc3Nlcyh1c2VyLmVtYWlscykuaW5jbHVkZXMoZW1haWwpKSkge1xuICAgIEFjY291bnRzLl9oYW5kbGVFcnJvcihcIk5vIHN1Y2ggZW1haWwgZm9yIHVzZXIuXCIpO1xuICB9XG5cbiAgY29uc3QgdG9rZW4gPSBSYW5kb20uc2VjcmV0KCk7XG4gIGNvbnN0IHRva2VuUmVjb3JkID0ge1xuICAgIHRva2VuLFxuICAgIC8vIFRPRE86IFRoaXMgc2hvdWxkIHByb2JhYmx5IGJlIHJlbmFtZWQgdG8gXCJlbWFpbFwiIHRvIG1hdGNoIHJlc2V0IHRva2VuIHJlY29yZC5cbiAgICBhZGRyZXNzOiBlbWFpbCxcbiAgICB3aGVuOiBuZXcgRGF0ZSgpXG4gIH07XG5cbiAgaWYgKGV4dHJhVG9rZW5EYXRhKSB7XG4gICAgT2JqZWN0LmFzc2lnbih0b2tlblJlY29yZCwgZXh0cmFUb2tlbkRhdGEpO1xuICB9XG5cbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyLl9pZH0sIHskcHVzaDoge1xuICAgICdzZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMnOiB0b2tlblJlY29yZFxuICB9fSk7XG5cbiAgLy8gYmVmb3JlIHBhc3NpbmcgdG8gdGVtcGxhdGUsIHVwZGF0ZSB1c2VyIG9iamVjdCB3aXRoIG5ldyB0b2tlblxuICBNZXRlb3IuX2Vuc3VyZSh1c2VyLCAnc2VydmljZXMnLCAnZW1haWwnKTtcbiAgaWYgKCF1c2VyLnNlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucykge1xuICAgIHVzZXIuc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zID0gW107XG4gIH1cbiAgdXNlci5zZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMucHVzaCh0b2tlblJlY29yZCk7XG5cbiAgcmV0dXJuIHtlbWFpbCwgdXNlciwgdG9rZW59O1xufTtcblxuXG4vLyBzZW5kIHRoZSB1c2VyIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoYXQgd2hlbiBvcGVuZWQgYWxsb3dzIHRoZSB1c2VyXG4vLyB0byBzZXQgYSBuZXcgcGFzc3dvcmQsIHdpdGhvdXQgdGhlIG9sZCBwYXNzd29yZC5cblxuLyoqXG4gKiBAc3VtbWFyeSBTZW5kIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoZSB1c2VyIGNhbiB1c2UgdG8gcmVzZXQgdGhlaXIgcGFzc3dvcmQuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBzZW5kIGVtYWlsIHRvLlxuICogQHBhcmFtIHtTdHJpbmd9IFtlbWFpbF0gT3B0aW9uYWwuIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIncyB0byBzZW5kIHRoZSBlbWFpbCB0by4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBEZWZhdWx0cyB0byB0aGUgZmlyc3QgZW1haWwgaW4gdGhlIGxpc3QuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhVG9rZW5EYXRhXSBPcHRpb25hbCBhZGRpdGlvbmFsIGRhdGEgdG8gYmUgYWRkZWQgaW50byB0aGUgdG9rZW4gcmVjb3JkLlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVBhcmFtc10gT3B0aW9uYWwgYWRkaXRpb25hbCBwYXJhbXMgdG8gYmUgYWRkZWQgdG8gdGhlIHJlc2V0IHVybC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc30gdmFsdWVzLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2VuZFJlc2V0UGFzc3dvcmRFbWFpbCA9ICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSwgZXh0cmFQYXJhbXMpID0+IHtcbiAgY29uc3Qge2VtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VufSA9XG4gICAgQWNjb3VudHMuZ2VuZXJhdGVSZXNldFRva2VuKHVzZXJJZCwgZW1haWwsICdyZXNldFBhc3N3b3JkJywgZXh0cmFUb2tlbkRhdGEpO1xuICBjb25zdCB1cmwgPSBBY2NvdW50cy51cmxzLnJlc2V0UGFzc3dvcmQodG9rZW4sIGV4dHJhUGFyYW1zKTtcbiAgY29uc3Qgb3B0aW9ucyA9IEFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsKHJlYWxFbWFpbCwgdXNlciwgdXJsLCAncmVzZXRQYXNzd29yZCcpO1xuICBFbWFpbC5zZW5kKG9wdGlvbnMpO1xuICBpZiAoTWV0ZW9yLmlzRGV2ZWxvcG1lbnQpIHtcbiAgICBjb25zb2xlLmxvZyhgXFxuUmVzZXQgcGFzc3dvcmQgVVJMOiAke3VybH1gKTtcbiAgfVxuICByZXR1cm4ge2VtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9O1xufTtcblxuLy8gc2VuZCB0aGUgdXNlciBhbiBlbWFpbCBpbmZvcm1pbmcgdGhlbSB0aGF0IHRoZWlyIGFjY291bnQgd2FzIGNyZWF0ZWQsIHdpdGhcbi8vIGEgbGluayB0aGF0IHdoZW4gb3BlbmVkIGJvdGggbWFya3MgdGhlaXIgZW1haWwgYXMgdmVyaWZpZWQgYW5kIGZvcmNlcyB0aGVtXG4vLyB0byBjaG9vc2UgdGhlaXIgcGFzc3dvcmQuIFRoZSBlbWFpbCBtdXN0IGJlIG9uZSBvZiB0aGUgYWRkcmVzc2VzIGluIHRoZVxuLy8gdXNlcidzIGVtYWlscyBmaWVsZCwgb3IgdW5kZWZpbmVkIHRvIHBpY2sgdGhlIGZpcnN0IGVtYWlsIGF1dG9tYXRpY2FsbHkuXG4vL1xuLy8gVGhpcyBpcyBub3QgY2FsbGVkIGF1dG9tYXRpY2FsbHkuIEl0IG11c3QgYmUgY2FsbGVkIG1hbnVhbGx5IGlmIHlvdVxuLy8gd2FudCB0byB1c2UgZW5yb2xsbWVudCBlbWFpbHMuXG5cbi8qKlxuICogQHN1bW1hcnkgU2VuZCBhbiBlbWFpbCB3aXRoIGEgbGluayB0aGUgdXNlciBjYW4gdXNlIHRvIHNldCB0aGVpciBpbml0aWFsIHBhc3N3b3JkLlxuICogQGxvY3VzIFNlcnZlclxuICogQHBhcmFtIHtTdHJpbmd9IHVzZXJJZCBUaGUgaWQgb2YgdGhlIHVzZXIgdG8gc2VuZCBlbWFpbCB0by5cbiAqIEBwYXJhbSB7U3RyaW5nfSBbZW1haWxdIE9wdGlvbmFsLiBXaGljaCBhZGRyZXNzIG9mIHRoZSB1c2VyJ3MgdG8gc2VuZCB0aGUgZW1haWwgdG8uIFRoaXMgYWRkcmVzcyBtdXN0IGJlIGluIHRoZSB1c2VyJ3MgYGVtYWlsc2AgbGlzdC4gRGVmYXVsdHMgdG8gdGhlIGZpcnN0IGVtYWlsIGluIHRoZSBsaXN0LlxuICogQHBhcmFtIHtPYmplY3R9IFtleHRyYVRva2VuRGF0YV0gT3B0aW9uYWwgYWRkaXRpb25hbCBkYXRhIHRvIGJlIGFkZGVkIGludG8gdGhlIHRva2VuIHJlY29yZC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFQYXJhbXNdIE9wdGlvbmFsIGFkZGl0aW9uYWwgcGFyYW1zIHRvIGJlIGFkZGVkIHRvIHRoZSBlbnJvbGxtZW50IHVybC5cbiAqIEByZXR1cm5zIHtPYmplY3R9IE9iamVjdCB3aXRoIHtlbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc30gdmFsdWVzLlxuICogQGltcG9ydEZyb21QYWNrYWdlIGFjY291bnRzLWJhc2VcbiAqL1xuQWNjb3VudHMuc2VuZEVucm9sbG1lbnRFbWFpbCA9ICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSwgZXh0cmFQYXJhbXMpID0+IHtcbiAgY29uc3Qge2VtYWlsOiByZWFsRW1haWwsIHVzZXIsIHRva2VufSA9XG4gICAgQWNjb3VudHMuZ2VuZXJhdGVSZXNldFRva2VuKHVzZXJJZCwgZW1haWwsICdlbnJvbGxBY2NvdW50JywgZXh0cmFUb2tlbkRhdGEpO1xuICBjb25zdCB1cmwgPSBBY2NvdW50cy51cmxzLmVucm9sbEFjY291bnQodG9rZW4sIGV4dHJhUGFyYW1zKTtcbiAgY29uc3Qgb3B0aW9ucyA9IEFjY291bnRzLmdlbmVyYXRlT3B0aW9uc0ZvckVtYWlsKHJlYWxFbWFpbCwgdXNlciwgdXJsLCAnZW5yb2xsQWNjb3VudCcpO1xuICBFbWFpbC5zZW5kKG9wdGlvbnMpO1xuICBpZiAoTWV0ZW9yLmlzRGV2ZWxvcG1lbnQpIHtcbiAgICBjb25zb2xlLmxvZyhgXFxuRW5yb2xsbWVudCBlbWFpbCBVUkw6ICR7dXJsfWApO1xuICB9XG4gIHJldHVybiB7ZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW4sIHVybCwgb3B0aW9uc307XG59O1xuXG5cbi8vIFRha2UgdG9rZW4gZnJvbSBzZW5kUmVzZXRQYXNzd29yZEVtYWlsIG9yIHNlbmRFbnJvbGxtZW50RW1haWwsIGNoYW5nZVxuLy8gdGhlIHVzZXJzIHBhc3N3b3JkLCBhbmQgbG9nIHRoZW0gaW4uXG5NZXRlb3IubWV0aG9kcyh7cmVzZXRQYXNzd29yZDogYXN5bmMgZnVuY3Rpb24gKC4uLmFyZ3MpIHtcbiAgY29uc3QgdG9rZW4gPSBhcmdzWzBdO1xuICBjb25zdCBuZXdQYXNzd29yZCA9IGFyZ3NbMV07XG4gIHJldHVybiBhd2FpdCBBY2NvdW50cy5fbG9naW5NZXRob2QoXG4gICAgdGhpcyxcbiAgICBcInJlc2V0UGFzc3dvcmRcIixcbiAgICBhcmdzLFxuICAgIFwicGFzc3dvcmRcIixcbiAgICBhc3luYyAoKSA9PiB7XG4gICAgICBjaGVjayh0b2tlbiwgU3RyaW5nKTtcbiAgICAgIGNoZWNrKG5ld1Bhc3N3b3JkLCBwYXNzd29yZFZhbGlkYXRvcik7XG5cbiAgICAgIGxldCB1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUoXG4gICAgICAgIHtcInNlcnZpY2VzLnBhc3N3b3JkLnJlc2V0LnRva2VuXCI6IHRva2VufSxcbiAgICAgICAge2ZpZWxkczoge1xuICAgICAgICAgIHNlcnZpY2VzOiAxLFxuICAgICAgICAgIGVtYWlsczogMSxcbiAgICAgICAgfX1cbiAgICAgICk7XG5cbiAgICAgIGxldCBpc0Vucm9sbCA9IGZhbHNlO1xuICAgICAgLy8gaWYgdG9rZW4gaXMgaW4gc2VydmljZXMucGFzc3dvcmQucmVzZXQgZGIgZmllbGQgaW1wbGllc1xuICAgICAgLy8gdGhpcyBtZXRob2QgaXMgd2FzIG5vdCBjYWxsZWQgZnJvbSBlbnJvbGwgYWNjb3VudCB3b3JrZmxvd1xuICAgICAgLy8gZWxzZSB0aGlzIG1ldGhvZCBpcyBjYWxsZWQgZnJvbSBlbnJvbGwgYWNjb3VudCB3b3JrZmxvd1xuICAgICAgaWYoIXVzZXIpIHtcbiAgICAgICAgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKFxuICAgICAgICAgIHtcInNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC50b2tlblwiOiB0b2tlbn0sXG4gICAgICAgICAge2ZpZWxkczoge1xuICAgICAgICAgICAgc2VydmljZXM6IDEsXG4gICAgICAgICAgICBlbWFpbHM6IDEsXG4gICAgICAgICAgfX1cbiAgICAgICAgKTtcbiAgICAgICAgaXNFbnJvbGwgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGV4cGlyZWRcIik7XG4gICAgICB9XG4gICAgICBsZXQgdG9rZW5SZWNvcmQgPSB7fTtcbiAgICAgIGlmKGlzRW5yb2xsKSB7XG4gICAgICAgIHRva2VuUmVjb3JkID0gdXNlci5zZXJ2aWNlcy5wYXNzd29yZC5lbnJvbGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b2tlblJlY29yZCA9IHVzZXIuc2VydmljZXMucGFzc3dvcmQucmVzZXQ7XG4gICAgICB9XG4gICAgICBjb25zdCB7IHdoZW4sIGVtYWlsIH0gPSB0b2tlblJlY29yZDtcbiAgICAgIGxldCB0b2tlbkxpZmV0aW1lTXMgPSBBY2NvdW50cy5fZ2V0UGFzc3dvcmRSZXNldFRva2VuTGlmZXRpbWVNcygpO1xuICAgICAgaWYgKGlzRW5yb2xsKSB7XG4gICAgICAgIHRva2VuTGlmZXRpbWVNcyA9IEFjY291bnRzLl9nZXRQYXNzd29yZEVucm9sbFRva2VuTGlmZXRpbWVNcygpO1xuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudFRpbWVNcyA9IERhdGUubm93KCk7XG4gICAgICBpZiAoKGN1cnJlbnRUaW1lTXMgLSB3aGVuKSA+IHRva2VuTGlmZXRpbWVNcylcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVG9rZW4gZXhwaXJlZFwiKTtcbiAgICAgIGlmICghKHBsdWNrQWRkcmVzc2VzKHVzZXIuZW1haWxzKS5pbmNsdWRlcyhlbWFpbCkpKVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIlRva2VuIGhhcyBpbnZhbGlkIGVtYWlsIGFkZHJlc3NcIilcbiAgICAgICAgfTtcblxuICAgICAgY29uc3QgaGFzaGVkID0gYXdhaXQgaGFzaFBhc3N3b3JkKG5ld1Bhc3N3b3JkKTtcblxuICAgICAgLy8gTk9URTogV2UncmUgYWJvdXQgdG8gaW52YWxpZGF0ZSB0b2tlbnMgb24gdGhlIHVzZXIsIHdobyB3ZSBtaWdodCBiZVxuICAgICAgLy8gbG9nZ2VkIGluIGFzLiBNYWtlIHN1cmUgdG8gYXZvaWQgbG9nZ2luZyBvdXJzZWx2ZXMgb3V0IGlmIHRoaXNcbiAgICAgIC8vIGhhcHBlbnMuIEJ1dCBhbHNvIG1ha2Ugc3VyZSBub3QgdG8gbGVhdmUgdGhlIGNvbm5lY3Rpb24gaW4gYSBzdGF0ZVxuICAgICAgLy8gb2YgaGF2aW5nIGEgYmFkIHRva2VuIHNldCBpZiB0aGluZ3MgZmFpbC5cbiAgICAgIGNvbnN0IG9sZFRva2VuID0gQWNjb3VudHMuX2dldExvZ2luVG9rZW4odGhpcy5jb25uZWN0aW9uLmlkKTtcbiAgICAgIEFjY291bnRzLl9zZXRMb2dpblRva2VuKHVzZXIuX2lkLCB0aGlzLmNvbm5lY3Rpb24sIG51bGwpO1xuICAgICAgY29uc3QgcmVzZXRUb09sZFRva2VuID0gKCkgPT5cbiAgICAgICAgQWNjb3VudHMuX3NldExvZ2luVG9rZW4odXNlci5faWQsIHRoaXMuY29ubmVjdGlvbiwgb2xkVG9rZW4pO1xuXG4gICAgICB0cnkge1xuICAgICAgICAvLyBVcGRhdGUgdGhlIHVzZXIgcmVjb3JkIGJ5OlxuICAgICAgICAvLyAtIENoYW5naW5nIHRoZSBwYXNzd29yZCB0byB0aGUgbmV3IG9uZVxuICAgICAgICAvLyAtIEZvcmdldHRpbmcgYWJvdXQgdGhlIHJlc2V0IHRva2VuIG9yIGVucm9sbCB0b2tlbiB0aGF0IHdhcyBqdXN0IHVzZWRcbiAgICAgICAgLy8gLSBWZXJpZnlpbmcgdGhlaXIgZW1haWwsIHNpbmNlIHRoZXkgZ290IHRoZSBwYXNzd29yZCByZXNldCB2aWEgZW1haWwuXG4gICAgICAgIGxldCBhZmZlY3RlZFJlY29yZHMgPSB7fTtcbiAgICAgICAgLy8gaWYgcmVhc29uIGlzIGVucm9sbCB0aGVuIGNoZWNrIHNlcnZpY2VzLnBhc3N3b3JkLmVucm9sbC50b2tlbiBmaWVsZCBmb3IgYWZmZWN0ZWQgcmVjb3Jkc1xuICAgICAgICBpZihpc0Vucm9sbCkge1xuICAgICAgICAgIGFmZmVjdGVkUmVjb3JkcyA9IE1ldGVvci51c2Vycy51cGRhdGUoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIF9pZDogdXNlci5faWQsXG4gICAgICAgICAgICAgICdlbWFpbHMuYWRkcmVzcyc6IGVtYWlsLFxuICAgICAgICAgICAgICAnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsLnRva2VuJzogdG9rZW5cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7JHNldDogeydzZXJ2aWNlcy5wYXNzd29yZC5iY3J5cHQnOiBoYXNoZWQsXG4gICAgICAgICAgICAgICAgICAgICdlbWFpbHMuJC52ZXJpZmllZCc6IHRydWV9LFxuICAgICAgICAgICAgICAkdW5zZXQ6IHsnc2VydmljZXMucGFzc3dvcmQuZW5yb2xsJzogMSB9fSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYWZmZWN0ZWRSZWNvcmRzID0gTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgICAgICAgJ2VtYWlscy5hZGRyZXNzJzogZW1haWwsXG4gICAgICAgICAgICAgICdzZXJ2aWNlcy5wYXNzd29yZC5yZXNldC50b2tlbic6IHRva2VuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgeyRzZXQ6IHsnc2VydmljZXMucGFzc3dvcmQuYmNyeXB0JzogaGFzaGVkLFxuICAgICAgICAgICAgICAgICAgICAnZW1haWxzLiQudmVyaWZpZWQnOiB0cnVlfSxcbiAgICAgICAgICAgICAgJHVuc2V0OiB7J3NlcnZpY2VzLnBhc3N3b3JkLnJlc2V0JzogMSB9fSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFmZmVjdGVkUmVjb3JkcyAhPT0gMSlcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgICAgICAgIGVycm9yOiBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJJbnZhbGlkIGVtYWlsXCIpXG4gICAgICAgICAgfTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXNldFRvT2xkVG9rZW4oKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBsYWNlIGFsbCB2YWxpZCBsb2dpbiB0b2tlbnMgd2l0aCBuZXcgb25lcyAoY2hhbmdpbmdcbiAgICAgIC8vIHBhc3N3b3JkIHNob3VsZCBpbnZhbGlkYXRlIGV4aXN0aW5nIHNlc3Npb25zKS5cbiAgICAgIEFjY291bnRzLl9jbGVhckFsbExvZ2luVG9rZW5zKHVzZXIuX2lkKTtcblxuICAgICAgaWYgKEFjY291bnRzLl9jaGVjazJmYUVuYWJsZWQ/Lih1c2VyKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IEFjY291bnRzLl9oYW5kbGVFcnJvcihcbiAgICAgICAgICAgICdDaGFuZ2VkIHBhc3N3b3JkLCBidXQgdXNlciBub3QgbG9nZ2VkIGluIGJlY2F1c2UgMkZBIGlzIGVuYWJsZWQnLFxuICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAnMmZhLWVuYWJsZWQnXG4gICAgICAgICAgKSxcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt1c2VySWQ6IHVzZXIuX2lkfTtcbiAgICB9XG4gICk7XG59fSk7XG5cbi8vL1xuLy8vIEVNQUlMIFZFUklGSUNBVElPTlxuLy8vXG5cblxuLy8gc2VuZCB0aGUgdXNlciBhbiBlbWFpbCB3aXRoIGEgbGluayB0aGF0IHdoZW4gb3BlbmVkIG1hcmtzIHRoYXRcbi8vIGFkZHJlc3MgYXMgdmVyaWZpZWRcblxuLyoqXG4gKiBAc3VtbWFyeSBTZW5kIGFuIGVtYWlsIHdpdGggYSBsaW5rIHRoZSB1c2VyIGNhbiB1c2UgdmVyaWZ5IHRoZWlyIGVtYWlsIGFkZHJlc3MuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBpZCBvZiB0aGUgdXNlciB0byBzZW5kIGVtYWlsIHRvLlxuICogQHBhcmFtIHtTdHJpbmd9IFtlbWFpbF0gT3B0aW9uYWwuIFdoaWNoIGFkZHJlc3Mgb2YgdGhlIHVzZXIncyB0byBzZW5kIHRoZSBlbWFpbCB0by4gVGhpcyBhZGRyZXNzIG11c3QgYmUgaW4gdGhlIHVzZXIncyBgZW1haWxzYCBsaXN0LiBEZWZhdWx0cyB0byB0aGUgZmlyc3QgdW52ZXJpZmllZCBlbWFpbCBpbiB0aGUgbGlzdC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbZXh0cmFUb2tlbkRhdGFdIE9wdGlvbmFsIGFkZGl0aW9uYWwgZGF0YSB0byBiZSBhZGRlZCBpbnRvIHRoZSB0b2tlbiByZWNvcmQuXG4gKiBAcGFyYW0ge09iamVjdH0gW2V4dHJhUGFyYW1zXSBPcHRpb25hbCBhZGRpdGlvbmFsIHBhcmFtcyB0byBiZSBhZGRlZCB0byB0aGUgdmVyaWZpY2F0aW9uIHVybC5cbiAqXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBPYmplY3Qgd2l0aCB7ZW1haWwsIHVzZXIsIHRva2VuLCB1cmwsIG9wdGlvbnN9IHZhbHVlcy5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKi9cbkFjY291bnRzLnNlbmRWZXJpZmljYXRpb25FbWFpbCA9ICh1c2VySWQsIGVtYWlsLCBleHRyYVRva2VuRGF0YSwgZXh0cmFQYXJhbXMpID0+IHtcbiAgLy8gWFhYIEFsc28gZ2VuZXJhdGUgYSBsaW5rIHVzaW5nIHdoaWNoIHNvbWVvbmUgY2FuIGRlbGV0ZSB0aGlzXG4gIC8vIGFjY291bnQgaWYgdGhleSBvd24gc2FpZCBhZGRyZXNzIGJ1dCB3ZXJlbid0IHRob3NlIHdobyBjcmVhdGVkXG4gIC8vIHRoaXMgYWNjb3VudC5cblxuICBjb25zdCB7ZW1haWw6IHJlYWxFbWFpbCwgdXNlciwgdG9rZW59ID1cbiAgICBBY2NvdW50cy5nZW5lcmF0ZVZlcmlmaWNhdGlvblRva2VuKHVzZXJJZCwgZW1haWwsIGV4dHJhVG9rZW5EYXRhKTtcbiAgY29uc3QgdXJsID0gQWNjb3VudHMudXJscy52ZXJpZnlFbWFpbCh0b2tlbiwgZXh0cmFQYXJhbXMpO1xuICBjb25zdCBvcHRpb25zID0gQWNjb3VudHMuZ2VuZXJhdGVPcHRpb25zRm9yRW1haWwocmVhbEVtYWlsLCB1c2VyLCB1cmwsICd2ZXJpZnlFbWFpbCcpO1xuICBFbWFpbC5zZW5kKG9wdGlvbnMpO1xuICBpZiAoTWV0ZW9yLmlzRGV2ZWxvcG1lbnQpIHtcbiAgICBjb25zb2xlLmxvZyhgXFxuVmVyaWZpY2F0aW9uIGVtYWlsIFVSTDogJHt1cmx9YCk7XG4gIH1cbiAgcmV0dXJuIHtlbWFpbDogcmVhbEVtYWlsLCB1c2VyLCB0b2tlbiwgdXJsLCBvcHRpb25zfTtcbn07XG5cbi8vIFRha2UgdG9rZW4gZnJvbSBzZW5kVmVyaWZpY2F0aW9uRW1haWwsIG1hcmsgdGhlIGVtYWlsIGFzIHZlcmlmaWVkLFxuLy8gYW5kIGxvZyB0aGVtIGluLlxuTWV0ZW9yLm1ldGhvZHMoe3ZlcmlmeUVtYWlsOiBhc3luYyBmdW5jdGlvbiAoLi4uYXJncykge1xuICBjb25zdCB0b2tlbiA9IGFyZ3NbMF07XG4gIHJldHVybiBhd2FpdCBBY2NvdW50cy5fbG9naW5NZXRob2QoXG4gICAgdGhpcyxcbiAgICBcInZlcmlmeUVtYWlsXCIsXG4gICAgYXJncyxcbiAgICBcInBhc3N3b3JkXCIsXG4gICAgKCkgPT4ge1xuICAgICAgY2hlY2sodG9rZW4sIFN0cmluZyk7XG5cbiAgICAgIGNvbnN0IHVzZXIgPSBNZXRlb3IudXNlcnMuZmluZE9uZShcbiAgICAgICAgeydzZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMudG9rZW4nOiB0b2tlbn0sXG4gICAgICAgIHtmaWVsZHM6IHtcbiAgICAgICAgICBzZXJ2aWNlczogMSxcbiAgICAgICAgICBlbWFpbHM6IDEsXG4gICAgICAgIH19XG4gICAgICApO1xuICAgICAgaWYgKCF1c2VyKVxuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJWZXJpZnkgZW1haWwgbGluayBleHBpcmVkXCIpO1xuXG4gICAgICAgIGNvbnN0IHRva2VuUmVjb3JkID0gdXNlci5zZXJ2aWNlcy5lbWFpbC52ZXJpZmljYXRpb25Ub2tlbnMuZmluZChcbiAgICAgICAgICB0ID0+IHQudG9rZW4gPT0gdG9rZW5cbiAgICAgICAgKTtcbiAgICAgIGlmICghdG9rZW5SZWNvcmQpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVmVyaWZ5IGVtYWlsIGxpbmsgZXhwaXJlZFwiKVxuICAgICAgICB9O1xuXG4gICAgICBjb25zdCBlbWFpbHNSZWNvcmQgPSB1c2VyLmVtYWlscy5maW5kKFxuICAgICAgICBlID0+IGUuYWRkcmVzcyA9PSB0b2tlblJlY29yZC5hZGRyZXNzXG4gICAgICApO1xuICAgICAgaWYgKCFlbWFpbHNSZWNvcmQpXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcklkOiB1c2VyLl9pZCxcbiAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVmVyaWZ5IGVtYWlsIGxpbmsgaXMgZm9yIHVua25vd24gYWRkcmVzc1wiKVxuICAgICAgICB9O1xuXG4gICAgICAvLyBCeSBpbmNsdWRpbmcgdGhlIGFkZHJlc3MgaW4gdGhlIHF1ZXJ5LCB3ZSBjYW4gdXNlICdlbWFpbHMuJCcgaW4gdGhlXG4gICAgICAvLyBtb2RpZmllciB0byBnZXQgYSByZWZlcmVuY2UgdG8gdGhlIHNwZWNpZmljIG9iamVjdCBpbiB0aGUgZW1haWxzXG4gICAgICAvLyBhcnJheS4gU2VlXG4gICAgICAvLyBodHRwOi8vd3d3Lm1vbmdvZGIub3JnL2Rpc3BsYXkvRE9DUy9VcGRhdGluZy8jVXBkYXRpbmctVGhlJTI0cG9zaXRpb25hbG9wZXJhdG9yKVxuICAgICAgLy8gaHR0cDovL3d3dy5tb25nb2RiLm9yZy9kaXNwbGF5L0RPQ1MvVXBkYXRpbmcjVXBkYXRpbmctJTI0cHVsbFxuICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZShcbiAgICAgICAge19pZDogdXNlci5faWQsXG4gICAgICAgICAnZW1haWxzLmFkZHJlc3MnOiB0b2tlblJlY29yZC5hZGRyZXNzfSxcbiAgICAgICAgeyRzZXQ6IHsnZW1haWxzLiQudmVyaWZpZWQnOiB0cnVlfSxcbiAgICAgICAgICRwdWxsOiB7J3NlcnZpY2VzLmVtYWlsLnZlcmlmaWNhdGlvblRva2Vucyc6IHthZGRyZXNzOiB0b2tlblJlY29yZC5hZGRyZXNzfX19KTtcblxuICAgICAgaWYgKEFjY291bnRzLl9jaGVjazJmYUVuYWJsZWQ/Lih1c2VyKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHVzZXJJZDogdXNlci5faWQsXG4gICAgICAgICAgZXJyb3I6IEFjY291bnRzLl9oYW5kbGVFcnJvcihcbiAgICAgICAgICAgICdFbWFpbCB2ZXJpZmllZCwgYnV0IHVzZXIgbm90IGxvZ2dlZCBpbiBiZWNhdXNlIDJGQSBpcyBlbmFibGVkJyxcbiAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgJzJmYS1lbmFibGVkJ1xuICAgICAgICAgICksXG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7dXNlcklkOiB1c2VyLl9pZH07XG4gICAgfVxuICApO1xufX0pO1xuXG4vKipcbiAqIEBzdW1tYXJ5IEFkZCBhbiBlbWFpbCBhZGRyZXNzIGZvciBhIHVzZXIuIFVzZSB0aGlzIGluc3RlYWQgb2YgZGlyZWN0bHlcbiAqIHVwZGF0aW5nIHRoZSBkYXRhYmFzZS4gVGhlIG9wZXJhdGlvbiB3aWxsIGZhaWwgaWYgdGhlcmUgaXMgYSBkaWZmZXJlbnQgdXNlclxuICogd2l0aCBhbiBlbWFpbCBvbmx5IGRpZmZlcmluZyBpbiBjYXNlLiBJZiB0aGUgc3BlY2lmaWVkIHVzZXIgaGFzIGFuIGV4aXN0aW5nXG4gKiBlbWFpbCBvbmx5IGRpZmZlcmluZyBpbiBjYXNlIGhvd2V2ZXIsIHdlIHJlcGxhY2UgaXQuXG4gKiBAbG9jdXMgU2VydmVyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byB1cGRhdGUuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmV3RW1haWwgQSBuZXcgZW1haWwgYWRkcmVzcyBmb3IgdGhlIHVzZXIuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFt2ZXJpZmllZF0gT3B0aW9uYWwgLSB3aGV0aGVyIHRoZSBuZXcgZW1haWwgYWRkcmVzcyBzaG91bGRcbiAqIGJlIG1hcmtlZCBhcyB2ZXJpZmllZC4gRGVmYXVsdHMgdG8gZmFsc2UuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5hZGRFbWFpbCA9ICh1c2VySWQsIG5ld0VtYWlsLCB2ZXJpZmllZCkgPT4ge1xuICBjaGVjayh1c2VySWQsIE5vbkVtcHR5U3RyaW5nKTtcbiAgY2hlY2sobmV3RW1haWwsIE5vbkVtcHR5U3RyaW5nKTtcbiAgY2hlY2sodmVyaWZpZWQsIE1hdGNoLk9wdGlvbmFsKEJvb2xlYW4pKTtcblxuICBpZiAodmVyaWZpZWQgPT09IHZvaWQgMCkge1xuICAgIHZlcmlmaWVkID0gZmFsc2U7XG4gIH1cblxuICBjb25zdCB1c2VyID0gZ2V0VXNlckJ5SWQodXNlcklkLCB7ZmllbGRzOiB7ZW1haWxzOiAxfX0pO1xuICBpZiAoIXVzZXIpXG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiVXNlciBub3QgZm91bmRcIik7XG5cbiAgLy8gQWxsb3cgdXNlcnMgdG8gY2hhbmdlIHRoZWlyIG93biBlbWFpbCB0byBhIHZlcnNpb24gd2l0aCBhIGRpZmZlcmVudCBjYXNlXG5cbiAgLy8gV2UgZG9uJ3QgaGF2ZSB0byBjYWxsIGNoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcyB0byBkbyBhIGNhc2VcbiAgLy8gaW5zZW5zaXRpdmUgY2hlY2sgYWNyb3NzIGFsbCBlbWFpbHMgaW4gdGhlIGRhdGFiYXNlIGhlcmUgYmVjYXVzZTogKDEpIGlmXG4gIC8vIHRoZXJlIGlzIG5vIGNhc2UtaW5zZW5zaXRpdmUgZHVwbGljYXRlIGJldHdlZW4gdGhpcyB1c2VyIGFuZCBvdGhlciB1c2VycyxcbiAgLy8gdGhlbiB3ZSBhcmUgT0sgYW5kICgyKSBpZiB0aGlzIHdvdWxkIGNyZWF0ZSBhIGNvbmZsaWN0IHdpdGggb3RoZXIgdXNlcnNcbiAgLy8gdGhlbiB0aGVyZSB3b3VsZCBhbHJlYWR5IGJlIGEgY2FzZS1pbnNlbnNpdGl2ZSBkdXBsaWNhdGUgYW5kIHdlIGNhbid0IGZpeFxuICAvLyB0aGF0IGluIHRoaXMgY29kZSBhbnl3YXkuXG4gIGNvbnN0IGNhc2VJbnNlbnNpdGl2ZVJlZ0V4cCA9XG4gICAgbmV3IFJlZ0V4cChgXiR7TWV0ZW9yLl9lc2NhcGVSZWdFeHAobmV3RW1haWwpfSRgLCAnaScpO1xuXG4gIGNvbnN0IGRpZFVwZGF0ZU93bkVtYWlsID0gKHVzZXIuZW1haWxzIHx8IFtdKS5yZWR1Y2UoXG4gICAgKHByZXYsIGVtYWlsKSA9PiB7XG4gICAgICBpZiAoY2FzZUluc2Vuc2l0aXZlUmVnRXhwLnRlc3QoZW1haWwuYWRkcmVzcykpIHtcbiAgICAgICAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7XG4gICAgICAgICAgX2lkOiB1c2VyLl9pZCxcbiAgICAgICAgICAnZW1haWxzLmFkZHJlc3MnOiBlbWFpbC5hZGRyZXNzXG4gICAgICAgIH0sIHskc2V0OiB7XG4gICAgICAgICAgJ2VtYWlscy4kLmFkZHJlc3MnOiBuZXdFbWFpbCxcbiAgICAgICAgICAnZW1haWxzLiQudmVyaWZpZWQnOiB2ZXJpZmllZFxuICAgICAgICB9fSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgICB9XG4gICAgfSxcbiAgICBmYWxzZVxuICApO1xuXG4gIC8vIEluIHRoZSBvdGhlciB1cGRhdGVzIGJlbG93LCB3ZSBoYXZlIHRvIGRvIGFub3RoZXIgY2FsbCB0b1xuICAvLyBjaGVja0ZvckNhc2VJbnNlbnNpdGl2ZUR1cGxpY2F0ZXMgdG8gbWFrZSBzdXJlIHRoYXQgbm8gY29uZmxpY3RpbmcgdmFsdWVzXG4gIC8vIHdlcmUgYWRkZWQgdG8gdGhlIGRhdGFiYXNlIGluIHRoZSBtZWFudGltZS4gV2UgZG9uJ3QgaGF2ZSB0byBkbyB0aGlzIGZvclxuICAvLyB0aGUgY2FzZSB3aGVyZSB0aGUgdXNlciBpcyB1cGRhdGluZyB0aGVpciBlbWFpbCBhZGRyZXNzIHRvIG9uZSB0aGF0IGlzIHRoZVxuICAvLyBzYW1lIGFzIGJlZm9yZSwgYnV0IG9ubHkgZGlmZmVyZW50IGJlY2F1c2Ugb2YgY2FwaXRhbGl6YXRpb24uIFJlYWQgdGhlXG4gIC8vIGJpZyBjb21tZW50IGFib3ZlIHRvIHVuZGVyc3RhbmQgd2h5LlxuXG4gIGlmIChkaWRVcGRhdGVPd25FbWFpbCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFBlcmZvcm0gYSBjYXNlIGluc2Vuc2l0aXZlIGNoZWNrIGZvciBkdXBsaWNhdGVzIGJlZm9yZSB1cGRhdGVcbiAgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLFxuICAgICdFbWFpbCcsIG5ld0VtYWlsLCB1c2VyLl9pZCk7XG5cbiAgTWV0ZW9yLnVzZXJzLnVwZGF0ZSh7XG4gICAgX2lkOiB1c2VyLl9pZFxuICB9LCB7XG4gICAgJGFkZFRvU2V0OiB7XG4gICAgICBlbWFpbHM6IHtcbiAgICAgICAgYWRkcmVzczogbmV3RW1haWwsXG4gICAgICAgIHZlcmlmaWVkOiB2ZXJpZmllZFxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gUGVyZm9ybSBhbm90aGVyIGNoZWNrIGFmdGVyIHVwZGF0ZSwgaW4gY2FzZSBhIG1hdGNoaW5nIHVzZXIgaGFzIGJlZW5cbiAgLy8gaW5zZXJ0ZWQgaW4gdGhlIG1lYW50aW1lXG4gIHRyeSB7XG4gICAgQWNjb3VudHMuX2NoZWNrRm9yQ2FzZUluc2Vuc2l0aXZlRHVwbGljYXRlcygnZW1haWxzLmFkZHJlc3MnLFxuICAgICAgJ0VtYWlsJywgbmV3RW1haWwsIHVzZXIuX2lkKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICAvLyBVbmRvIHVwZGF0ZSBpZiB0aGUgY2hlY2sgZmFpbHNcbiAgICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSxcbiAgICAgIHskcHVsbDoge2VtYWlsczoge2FkZHJlc3M6IG5ld0VtYWlsfX19KTtcbiAgICB0aHJvdyBleDtcbiAgfVxufVxuXG4vKipcbiAqIEBzdW1tYXJ5IFJlbW92ZSBhbiBlbWFpbCBhZGRyZXNzIGZvciBhIHVzZXIuIFVzZSB0aGlzIGluc3RlYWQgb2YgdXBkYXRpbmdcbiAqIHRoZSBkYXRhYmFzZSBkaXJlY3RseS5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbCBUaGUgZW1haWwgYWRkcmVzcyB0byByZW1vdmUuXG4gKiBAaW1wb3J0RnJvbVBhY2thZ2UgYWNjb3VudHMtYmFzZVxuICovXG5BY2NvdW50cy5yZW1vdmVFbWFpbCA9ICh1c2VySWQsIGVtYWlsKSA9PiB7XG4gIGNoZWNrKHVzZXJJZCwgTm9uRW1wdHlTdHJpbmcpO1xuICBjaGVjayhlbWFpbCwgTm9uRW1wdHlTdHJpbmcpO1xuXG4gIGNvbnN0IHVzZXIgPSBnZXRVc2VyQnlJZCh1c2VySWQsIHtmaWVsZHM6IHtfaWQ6IDF9fSk7XG4gIGlmICghdXNlcilcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJVc2VyIG5vdCBmb3VuZFwiKTtcblxuICBNZXRlb3IudXNlcnMudXBkYXRlKHtfaWQ6IHVzZXIuX2lkfSxcbiAgICB7JHB1bGw6IHtlbWFpbHM6IHthZGRyZXNzOiBlbWFpbH19fSk7XG59XG5cbi8vL1xuLy8vIENSRUFUSU5HIFVTRVJTXG4vLy9cblxuLy8gU2hhcmVkIGNyZWF0ZVVzZXIgZnVuY3Rpb24gY2FsbGVkIGZyb20gdGhlIGNyZWF0ZVVzZXIgbWV0aG9kLCBib3RoXG4vLyBpZiBvcmlnaW5hdGVzIGluIGNsaWVudCBvciBzZXJ2ZXIgY29kZS4gQ2FsbHMgdXNlciBwcm92aWRlZCBob29rcyxcbi8vIGRvZXMgdGhlIGFjdHVhbCB1c2VyIGluc2VydGlvbi5cbi8vXG4vLyByZXR1cm5zIHRoZSB1c2VyIGlkXG5jb25zdCBjcmVhdGVVc2VyID0gYXN5bmMgb3B0aW9ucyA9PiB7XG4gIC8vIFVua25vd24ga2V5cyBhbGxvd2VkLCBiZWNhdXNlIGEgb25DcmVhdGVVc2VySG9vayBjYW4gdGFrZSBhcmJpdHJhcnlcbiAgLy8gb3B0aW9ucy5cbiAgY2hlY2sob3B0aW9ucywgTWF0Y2guT2JqZWN0SW5jbHVkaW5nKHtcbiAgICB1c2VybmFtZTogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICBlbWFpbDogTWF0Y2guT3B0aW9uYWwoU3RyaW5nKSxcbiAgICBwYXNzd29yZDogTWF0Y2guT3B0aW9uYWwocGFzc3dvcmRWYWxpZGF0b3IpXG4gIH0pKTtcblxuICBjb25zdCB7IHVzZXJuYW1lLCBlbWFpbCwgcGFzc3dvcmQgfSA9IG9wdGlvbnM7XG4gIGlmICghdXNlcm5hbWUgJiYgIWVtYWlsKVxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIk5lZWQgdG8gc2V0IGEgdXNlcm5hbWUgb3IgZW1haWxcIik7XG5cbiAgY29uc3QgdXNlciA9IHtzZXJ2aWNlczoge319O1xuICBpZiAocGFzc3dvcmQpIHtcbiAgICBjb25zdCBoYXNoZWQgPSBhd2FpdCBoYXNoUGFzc3dvcmQocGFzc3dvcmQpO1xuICAgIHVzZXIuc2VydmljZXMucGFzc3dvcmQgPSB7IGJjcnlwdDogaGFzaGVkIH07XG4gIH1cblxuICByZXR1cm4gQWNjb3VudHMuX2NyZWF0ZVVzZXJDaGVja2luZ0R1cGxpY2F0ZXMoeyB1c2VyLCBlbWFpbCwgdXNlcm5hbWUsIG9wdGlvbnMgfSk7XG59O1xuXG4vLyBtZXRob2QgZm9yIGNyZWF0ZSB1c2VyLiBSZXF1ZXN0cyBjb21lIGZyb20gdGhlIGNsaWVudC5cbk1ldGVvci5tZXRob2RzKHtjcmVhdGVVc2VyOiBhc3luYyBmdW5jdGlvbiAoLi4uYXJncykge1xuICBjb25zdCBvcHRpb25zID0gYXJnc1swXTtcbiAgcmV0dXJuIGF3YWl0IEFjY291bnRzLl9sb2dpbk1ldGhvZChcbiAgICB0aGlzLFxuICAgIFwiY3JlYXRlVXNlclwiLFxuICAgIGFyZ3MsXG4gICAgXCJwYXNzd29yZFwiLFxuICAgIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIGNyZWF0ZVVzZXIoKSBhYm92ZSBkb2VzIG1vcmUgY2hlY2tpbmcuXG4gICAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgICAgaWYgKEFjY291bnRzLl9vcHRpb25zLmZvcmJpZENsaWVudEFjY291bnRDcmVhdGlvbilcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBlcnJvcjogbmV3IE1ldGVvci5FcnJvcig0MDMsIFwiU2lnbnVwcyBmb3JiaWRkZW5cIilcbiAgICAgICAgfTtcblxuICAgICAgY29uc3QgdXNlcklkID0gYXdhaXQgQWNjb3VudHMuY3JlYXRlVXNlclZlcmlmeWluZ0VtYWlsKG9wdGlvbnMpO1xuXG4gICAgICAvLyBjbGllbnQgZ2V0cyBsb2dnZWQgaW4gYXMgdGhlIG5ldyB1c2VyIGFmdGVyd2FyZHMuXG4gICAgICByZXR1cm4ge3VzZXJJZDogdXNlcklkfTtcbiAgICB9XG4gICk7XG59fSk7XG5cbi8qKlxuICogQHN1bW1hcnkgQ3JlYXRlcyBhbiB1c2VyIGFuZCBzZW5kcyBhbiBlbWFpbCBpZiBgb3B0aW9ucy5lbWFpbGAgaXMgaW5mb3JtZWQuXG4gKiBUaGVuIGlmIHRoZSBgc2VuZFZlcmlmaWNhdGlvbkVtYWlsYCBvcHRpb24gZnJvbSB0aGUgYEFjY291bnRzYCBwYWNrYWdlIGlzXG4gKiBlbmFibGVkLCB5b3UnbGwgc2VuZCBhIHZlcmlmaWNhdGlvbiBlbWFpbCBpZiBgb3B0aW9ucy5wYXNzd29yZGAgaXMgaW5mb3JtZWQsXG4gKiBvdGhlcndpc2UgeW91J2xsIHNlbmQgYW4gZW5yb2xsbWVudCBlbWFpbC5cbiAqIEBsb2N1cyBTZXJ2ZXJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIFRoZSBvcHRpb25zIG9iamVjdCB0byBiZSBwYXNzZWQgZG93biB3aGVuIGNyZWF0aW5nXG4gKiB0aGUgdXNlclxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMudXNlcm5hbWUgQSB1bmlxdWUgbmFtZSBmb3IgdGhpcyB1c2VyLlxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMuZW1haWwgVGhlIHVzZXIncyBlbWFpbCBhZGRyZXNzLlxuICogQHBhcmFtIHtTdHJpbmd9IG9wdGlvbnMucGFzc3dvcmQgVGhlIHVzZXIncyBwYXNzd29yZC4gVGhpcyBpcyBfX25vdF9fIHNlbnQgaW4gcGxhaW4gdGV4dCBvdmVyIHRoZSB3aXJlLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMucHJvZmlsZSBUaGUgdXNlcidzIHByb2ZpbGUsIHR5cGljYWxseSBpbmNsdWRpbmcgdGhlIGBuYW1lYCBmaWVsZC5cbiAqIEBpbXBvcnRGcm9tUGFja2FnZSBhY2NvdW50cy1iYXNlXG4gKiAqL1xuQWNjb3VudHMuY3JlYXRlVXNlclZlcmlmeWluZ0VtYWlsID0gYXN5bmMgKG9wdGlvbnMpID0+IHtcbiAgb3B0aW9ucyA9IHsgLi4ub3B0aW9ucyB9O1xuICAvLyBDcmVhdGUgdXNlci4gcmVzdWx0IGNvbnRhaW5zIGlkIGFuZCB0b2tlbi5cbiAgY29uc3QgdXNlcklkID0gYXdhaXQgY3JlYXRlVXNlcihvcHRpb25zKTtcbiAgLy8gc2FmZXR5IGJlbHQuIGNyZWF0ZVVzZXIgaXMgc3VwcG9zZWQgdG8gdGhyb3cgb24gZXJyb3IuIHNlbmQgNTAwIGVycm9yXG4gIC8vIGluc3RlYWQgb2Ygc2VuZGluZyBhIHZlcmlmaWNhdGlvbiBlbWFpbCB3aXRoIGVtcHR5IHVzZXJpZC5cbiAgaWYgKCEgdXNlcklkKVxuICAgIHRocm93IG5ldyBFcnJvcihcImNyZWF0ZVVzZXIgZmFpbGVkIHRvIGluc2VydCBuZXcgdXNlclwiKTtcblxuICAvLyBJZiBgQWNjb3VudHMuX29wdGlvbnMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsYCBpcyBzZXQsIHJlZ2lzdGVyXG4gIC8vIGEgdG9rZW4gdG8gdmVyaWZ5IHRoZSB1c2VyJ3MgcHJpbWFyeSBlbWFpbCwgYW5kIHNlbmQgaXQgdG9cbiAgLy8gdGhhdCBhZGRyZXNzLlxuICBpZiAob3B0aW9ucy5lbWFpbCAmJiBBY2NvdW50cy5fb3B0aW9ucy5zZW5kVmVyaWZpY2F0aW9uRW1haWwpIHtcbiAgICBpZiAob3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgQWNjb3VudHMuc2VuZFZlcmlmaWNhdGlvbkVtYWlsKHVzZXJJZCwgb3B0aW9ucy5lbWFpbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIEFjY291bnRzLnNlbmRFbnJvbGxtZW50RW1haWwodXNlcklkLCBvcHRpb25zLmVtYWlsKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdXNlcklkO1xufTtcblxuLy8gQ3JlYXRlIHVzZXIgZGlyZWN0bHkgb24gdGhlIHNlcnZlci5cbi8vXG4vLyBVbmxpa2UgdGhlIGNsaWVudCB2ZXJzaW9uLCB0aGlzIGRvZXMgbm90IGxvZyB5b3UgaW4gYXMgdGhpcyB1c2VyXG4vLyBhZnRlciBjcmVhdGlvbi5cbi8vXG4vLyByZXR1cm5zIFByb21pc2U8dXNlcklkPiBvciB0aHJvd3MgYW4gZXJyb3IgaWYgaXQgY2FuJ3QgY3JlYXRlXG4vL1xuLy8gWFhYIGFkZCBhbm90aGVyIGFyZ3VtZW50IChcInNlcnZlciBvcHRpb25zXCIpIHRoYXQgZ2V0cyBzZW50IHRvIG9uQ3JlYXRlVXNlcixcbi8vIHdoaWNoIGlzIGFsd2F5cyBlbXB0eSB3aGVuIGNhbGxlZCBmcm9tIHRoZSBjcmVhdGVVc2VyIG1ldGhvZD8gZWcsIFwiYWRtaW46XG4vLyB0cnVlXCIsIHdoaWNoIHdlIHdhbnQgdG8gcHJldmVudCB0aGUgY2xpZW50IGZyb20gc2V0dGluZywgYnV0IHdoaWNoIGEgY3VzdG9tXG4vLyBtZXRob2QgY2FsbGluZyBBY2NvdW50cy5jcmVhdGVVc2VyIGNvdWxkIHNldD9cbi8vXG5cbkFjY291bnRzLmNyZWF0ZVVzZXJBc3luYyA9IGFzeW5jIChvcHRpb25zLCBjYWxsYmFjaykgPT4ge1xuICBvcHRpb25zID0geyAuLi5vcHRpb25zIH07XG5cbiAgLy8gWFhYIGFsbG93IGFuIG9wdGlvbmFsIGNhbGxiYWNrP1xuICBpZiAoY2FsbGJhY2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBY2NvdW50cy5jcmVhdGVVc2VyIHdpdGggY2FsbGJhY2sgbm90IHN1cHBvcnRlZCBvbiB0aGUgc2VydmVyIHlldC5cIik7XG4gIH1cblxuICByZXR1cm4gY3JlYXRlVXNlcihvcHRpb25zKTtcbn07XG5cbi8vIENyZWF0ZSB1c2VyIGRpcmVjdGx5IG9uIHRoZSBzZXJ2ZXIuXG4vL1xuLy8gVW5saWtlIHRoZSBjbGllbnQgdmVyc2lvbiwgdGhpcyBkb2VzIG5vdCBsb2cgeW91IGluIGFzIHRoaXMgdXNlclxuLy8gYWZ0ZXIgY3JlYXRpb24uXG4vL1xuLy8gcmV0dXJucyB1c2VySWQgb3IgdGhyb3dzIGFuIGVycm9yIGlmIGl0IGNhbid0IGNyZWF0ZVxuLy9cbi8vIFhYWCBhZGQgYW5vdGhlciBhcmd1bWVudCAoXCJzZXJ2ZXIgb3B0aW9uc1wiKSB0aGF0IGdldHMgc2VudCB0byBvbkNyZWF0ZVVzZXIsXG4vLyB3aGljaCBpcyBhbHdheXMgZW1wdHkgd2hlbiBjYWxsZWQgZnJvbSB0aGUgY3JlYXRlVXNlciBtZXRob2Q/IGVnLCBcImFkbWluOlxuLy8gdHJ1ZVwiLCB3aGljaCB3ZSB3YW50IHRvIHByZXZlbnQgdGhlIGNsaWVudCBmcm9tIHNldHRpbmcsIGJ1dCB3aGljaCBhIGN1c3RvbVxuLy8gbWV0aG9kIGNhbGxpbmcgQWNjb3VudHMuY3JlYXRlVXNlciBjb3VsZCBzZXQ/XG4vL1xuXG5BY2NvdW50cy5jcmVhdGVVc2VyID0gKG9wdGlvbnMsIGNhbGxiYWNrKSA9PiB7XG4gIHJldHVybiBQcm9taXNlLmF3YWl0KEFjY291bnRzLmNyZWF0ZVVzZXJBc3luYyhvcHRpb25zLCBjYWxsYmFjaykpO1xufTtcblxuLy8vXG4vLy8gUEFTU1dPUkQtU1BFQ0lGSUMgSU5ERVhFUyBPTiBVU0VSU1xuLy8vXG5NZXRlb3IudXNlcnMuY3JlYXRlSW5kZXhBc3luYygnc2VydmljZXMuZW1haWwudmVyaWZpY2F0aW9uVG9rZW5zLnRva2VuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdW5pcXVlOiB0cnVlLCBzcGFyc2U6IHRydWUgfSk7XG5NZXRlb3IudXNlcnMuY3JlYXRlSW5kZXhBc3luYygnc2VydmljZXMucGFzc3dvcmQucmVzZXQudG9rZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB1bmlxdWU6IHRydWUsIHNwYXJzZTogdHJ1ZSB9KTtcbk1ldGVvci51c2Vycy5jcmVhdGVJbmRleEFzeW5jKCdzZXJ2aWNlcy5wYXNzd29yZC5lbnJvbGwudG9rZW4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB1bmlxdWU6IHRydWUsIHNwYXJzZTogdHJ1ZSB9KTtcbiJdfQ==
