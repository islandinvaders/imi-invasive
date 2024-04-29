var require = meteorInstall({"imports":{"api":{"profile":{"Profile.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// imports/api/profile/Profile.js                                                                            //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.export({
  Profiles: () => Profiles
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 0);
let SimpleSchema;
module.link("simpl-schema", {
  default(v) {
    SimpleSchema = v;
  }
}, 1);
/**
 * The ProfilesCollection. It encapsulates state and variable values for Profile.
 */
class ProfilesCollection {
  constructor() {
    // The name of this collection.
    this.name = 'ProfilesCollection';
    // Define the Mongo collection.
    this.collection = new Mongo.Collection(this.name);
    // Define the structure of each document in the collection.
    this.schema = new SimpleSchema({
      image: {
        type: String,
        optional: true
      },
      firstName: String,
      lastName: String,
      email: String,
      bio: {
        type: String,
        optional: true
      },
      interests: {
        type: String,
        optional: true
      },
      type: {
        type: String,
        optional: true
      }
    });
    // Attach the schema to the collection, so all attempts to insert a document are checked against schema.
    this.collection.attachSchema(this.schema);
    // Define names for publications and subscriptions
    this.userPublicationName = "".concat(this.name, ".publication.user");
    this.adminPublicationName = "".concat(this.name, ".publication.admin");
  }
}

/**
 * The singleton instance of the ProfilesCollection.
 * @type {ProfilesCollection}
 */
const Profiles = new ProfilesCollection();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"reference":{"Reference.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// imports/api/reference/Reference.js                                                                        //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.export({
  References: () => References
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 0);
let SimpleSchema;
module.link("simpl-schema", {
  default(v) {
    SimpleSchema = v;
  }
}, 1);
/**
 * The ReferencesCollection. It encapsulates state and variable values for a reference guide entry.
 */
class ReferencesCollection {
  constructor() {
    // The name of this collection.
    this.name = 'ReferencesCollection';
    // Define the Mongo collection.
    this.collection = new Mongo.Collection(this.name);
    // Define the structure of each document in the collection.
    this.schema = new SimpleSchema({
      image: String,
      pestName: String,
      sciName: String,
      risk: String,
      regStatus: String,
      pestType: {
        type: String,
        allowedValues: ['Plant', 'Animal', 'Bug', 'Microbe', 'Fungus']
      },
      description: String,
      impact: String,
      distribution: String,
      lookalike: String
    });
    // Attach the schema to the collection, so all attempts to insert a document are checked against schema.
    this.collection.attachSchema(this.schema);
    // Define names for publications and subscriptions
    this.userPublicationName = "".concat(this.name, ".publication.user");
    this.adminPublicationName = "".concat(this.name, ".publication.admin");
  }
}

/**
 * The singleton instance of the ReferencesCollection.
 * @type {ReferencesCollection}
 */
const References = new ReferencesCollection();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"report":{"Report.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// imports/api/report/Report.js                                                                              //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.export({
  Reports: () => Reports
});
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }
}, 0);
let SimpleSchema;
module.link("simpl-schema", {
  default(v) {
    SimpleSchema = v;
  }
}, 1);
/**
 * The ReportsCollection. It encapsulates state and variable values for a report.
 */
class ReportsCollection {
  constructor() {
    // The name of this collection.
    this.name = 'ReportsCollection';
    // Define the Mongo collection.
    this.collection = new Mongo.Collection(this.name);
    // Define the structure of each document in the collection.
    this.schema = new SimpleSchema({
      image: String,
      pestName: String,
      pestDescription: String,
      island: {
        type: String,
        allowedValues: ['Niihau', 'Kauai', 'Oahu', 'Molokai', 'Lanai', 'Maui', 'Kahoolawe', 'Hawaii']
      },
      location: String,
      date: Date,
      reporter: String,
      verified: {
        type: String,
        allowedValues: ['No', 'Yes'],
        defaultValue: 'No'
      },
      removed: {
        type: String,
        allowedValues: ['No', 'Yes'],
        defaultValue: 'No'
      }
    });
    // Attach the schema to the collection, so all attempts to insert a document are checked against schema.
    this.collection.attachSchema(this.schema);
    // Define names for publications and subscriptions
    this.userVerifiedPosts = "".concat(this.name, ".publication.user");
    this.adminAllPosts = "".concat(this.name, ".publication.admin");
    this.userSpecificPosts = "".concat(this.name, ".publication.userSpecific");
    this.adminUnverifiedPosts = "".concat(this.name, ".publication.adminUnverified");
  }
}

/**
 * The singleton instance of the ReportsCollection.
 * @type {ReportsCollection}
 */
const Reports = new ReportsCollection();
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"startup":{"server":{"Accounts.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// imports/startup/server/Accounts.js                                                                        //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Accounts;
module.link("meteor/accounts-base", {
  Accounts(v) {
    Accounts = v;
  }
}, 1);
let Roles;
module.link("meteor/alanning:roles", {
  Roles(v) {
    Roles = v;
  }
}, 2);
/* eslint-disable no-console */

// Creates user
const createUser = (email, password, role) => {
  console.log("  Creating user ".concat(email, "."));
  const userID = Accounts.createUser({
    username: email,
    email: email,
    password: password
  });
  if (role === 'admin') {
    Roles.createRole(role, {
      unlessExists: true
    });
    Roles.addUsersToRoles(userID, 'admin');
  }
};

// When running app for first time, pass a settings file to set up a default user account.
if (Meteor.users.find().count() === 0) {
  if (Meteor.settings.defaultAccounts) {
    console.log('Creating the default user(s)');
    Meteor.settings.defaultAccounts.forEach(_ref => {
      let {
        email,
        password,
        role
      } = _ref;
      createUser(email, password, role);
    });
  } else {
    console.log('Cannot initialize the database!  Please invoke meteor with a settings file.');
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Mongo.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// imports/startup/server/Mongo.js                                                                           //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Reports;
module.link("../../api/report/Report.js", {
  Reports(v) {
    Reports = v;
  }
}, 1);
let References;
module.link("../../api/reference/Reference.js", {
  References(v) {
    References = v;
  }
}, 2);
let Profiles;
module.link("../../api/profile/Profile", {
  Profiles(v) {
    Profiles = v;
  }
}, 3);
/* eslint-disable no-console */

// Initialize ReferencesCollection default data
const addReference = data => {
  console.log("  Adding: ".concat(data.pestName, " "));
  References.collection.insert(data);
};
if (References.collection.find().count() === 0) {
  if (Meteor.settings.referenceData) {
    console.log('Creating default reference data.');
    Meteor.settings.referenceData.forEach(data => addReference(data));
  }
}

// Initialize ReportsCollection default data
const addReport = data => {
  console.log("  Adding: ".concat(data.pestName, " (").concat(data.reporter, ", ").concat(data.date, ") "));
  Reports.collection.insert(data);
};
if (Reports.collection.find().count() === 0) {
  if (Meteor.settings.reportData) {
    console.log('Creating default report data.');
    Meteor.settings.reportData.forEach(data => addReport(data));
  }
}
const addProfile = data => {
  console.log("  Adding: ".concat(data.lastName, ", ").concat(data.email, " "));
  Profiles.collection.insert(data);
};
if (Profiles.collection.find().count() === 0) {
  if (Meteor.settings.profileData) {
    console.log('Creating default profile data.');
    Meteor.settings.profileData.forEach(data => addProfile(data));
  }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"Publications.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// imports/startup/server/Publications.js                                                                    //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
let Meteor;
module.link("meteor/meteor", {
  Meteor(v) {
    Meteor = v;
  }
}, 0);
let Roles;
module.link("meteor/alanning:roles", {
  Roles(v) {
    Roles = v;
  }
}, 1);
let Reports;
module.link("../../api/report/Report", {
  Reports(v) {
    Reports = v;
  }
}, 2);
let Profiles;
module.link("../../api/profile/Profile", {
  Profiles(v) {
    Profiles = v;
  }
}, 3);
let References;
module.link("../../api/reference/Reference", {
  References(v) {
    References = v;
  }
}, 4);
// User-level publication.
// If logged in, then publish documents that are verified. Otherwise, publish nothing.
Meteor.publish(Reports.userVerifiedPosts, function () {
  if (this.userId) {
    return Reports.collection.find({
      verified: 'Yes'
    });
  }
  return this.ready();
});

// when PostsButton is clicked
// If logged in will only display reports made by the user
Meteor.publish(Reports.userSpecificPosts, function () {
  if (this.userId) {
    const username = Meteor.users.findOne(this.userId).username;
    return Reports.collection.find({
      reporter: username
    });
  }
  return this.ready();
});

// Admin-level publication.
// If logged in and with admin role, then publish all documents from all users. Otherwise, publish nothing.
Meteor.publish(Reports.adminAllPosts, function () {
  if (this.userId && Roles.userIsInRole(this.userId, 'admin')) {
    return Reports.collection.find();
  }
  return this.ready();
});

// when AdminButton is clicked
// if logged in and with admin role, then displays only unverified posts
Meteor.publish(Reports.adminUnverifiedPosts, function () {
  if (this.userId && Roles.userIsInRole(this.userId, 'admin')) {
    return Reports.collection.find({
      verified: 'No'
    });
  }
  return this.ready();
});
Meteor.publish(Profiles.userPublicationName, function () {
  return Profiles.collection.find({});
});
Meteor.publish(Profiles.adminPublicationName, function () {
  if (this.userId && Roles.userIsInRole(this.userId, 'admin')) {
    return Profiles.collection.find();
  }
  return this.ready();
});

// alanning:roles publication
// Recommended code to publish roles for each user.
Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({
      'user._id': this.userId
    });
  }
  return this.ready();
});

// Published all references to appear to Resources page
Meteor.publish(References.userPublicationName, function () {
  return References.collection.find();
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}},"server":{"main.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                           //
// server/main.js                                                                                            //
//                                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                             //
module.link("/imports/startup/server/Accounts");
module.link("/imports/startup/server/Publications");
module.link("/imports/startup/server/Mongo");
///////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},{
  "extensions": [
    ".js",
    ".json",
    ".mjs",
    ".jsx"
  ]
});

require("/server/main.js");
//# sourceURL=meteor://💻app/app/app.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvaW1wb3J0cy9hcGkvcHJvZmlsZS9Qcm9maWxlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9yZWZlcmVuY2UvUmVmZXJlbmNlLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL2FwaS9yZXBvcnQvUmVwb3J0LmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL0FjY291bnRzLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL01vbmdvLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL1B1YmxpY2F0aW9ucy5qcyIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21haW4uanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0IiwiUHJvZmlsZXMiLCJNb25nbyIsImxpbmsiLCJ2IiwiU2ltcGxlU2NoZW1hIiwiZGVmYXVsdCIsIlByb2ZpbGVzQ29sbGVjdGlvbiIsImNvbnN0cnVjdG9yIiwibmFtZSIsImNvbGxlY3Rpb24iLCJDb2xsZWN0aW9uIiwic2NoZW1hIiwiaW1hZ2UiLCJ0eXBlIiwiU3RyaW5nIiwib3B0aW9uYWwiLCJmaXJzdE5hbWUiLCJsYXN0TmFtZSIsImVtYWlsIiwiYmlvIiwiaW50ZXJlc3RzIiwiYXR0YWNoU2NoZW1hIiwidXNlclB1YmxpY2F0aW9uTmFtZSIsImNvbmNhdCIsImFkbWluUHVibGljYXRpb25OYW1lIiwiUmVmZXJlbmNlcyIsIlJlZmVyZW5jZXNDb2xsZWN0aW9uIiwicGVzdE5hbWUiLCJzY2lOYW1lIiwicmlzayIsInJlZ1N0YXR1cyIsInBlc3RUeXBlIiwiYWxsb3dlZFZhbHVlcyIsImRlc2NyaXB0aW9uIiwiaW1wYWN0IiwiZGlzdHJpYnV0aW9uIiwibG9va2FsaWtlIiwiUmVwb3J0cyIsIlJlcG9ydHNDb2xsZWN0aW9uIiwicGVzdERlc2NyaXB0aW9uIiwiaXNsYW5kIiwibG9jYXRpb24iLCJkYXRlIiwiRGF0ZSIsInJlcG9ydGVyIiwidmVyaWZpZWQiLCJkZWZhdWx0VmFsdWUiLCJyZW1vdmVkIiwidXNlclZlcmlmaWVkUG9zdHMiLCJhZG1pbkFsbFBvc3RzIiwidXNlclNwZWNpZmljUG9zdHMiLCJhZG1pblVudmVyaWZpZWRQb3N0cyIsIk1ldGVvciIsIkFjY291bnRzIiwiUm9sZXMiLCJjcmVhdGVVc2VyIiwicGFzc3dvcmQiLCJyb2xlIiwiY29uc29sZSIsImxvZyIsInVzZXJJRCIsInVzZXJuYW1lIiwiY3JlYXRlUm9sZSIsInVubGVzc0V4aXN0cyIsImFkZFVzZXJzVG9Sb2xlcyIsInVzZXJzIiwiZmluZCIsImNvdW50Iiwic2V0dGluZ3MiLCJkZWZhdWx0QWNjb3VudHMiLCJmb3JFYWNoIiwiX3JlZiIsImFkZFJlZmVyZW5jZSIsImRhdGEiLCJpbnNlcnQiLCJyZWZlcmVuY2VEYXRhIiwiYWRkUmVwb3J0IiwicmVwb3J0RGF0YSIsImFkZFByb2ZpbGUiLCJwcm9maWxlRGF0YSIsInB1Ymxpc2giLCJ1c2VySWQiLCJyZWFkeSIsImZpbmRPbmUiLCJ1c2VySXNJblJvbGUiLCJyb2xlQXNzaWdubWVudCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQUEsTUFBTSxDQUFDQyxNQUFNLENBQUM7RUFBQ0MsUUFBUSxFQUFDQSxDQUFBLEtBQUlBO0FBQVEsQ0FBQyxDQUFDO0FBQUMsSUFBSUMsS0FBSztBQUFDSCxNQUFNLENBQUNJLElBQUksQ0FBQyxjQUFjLEVBQUM7RUFBQ0QsS0FBS0EsQ0FBQ0UsQ0FBQyxFQUFDO0lBQUNGLEtBQUssR0FBQ0UsQ0FBQztFQUFBO0FBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQztBQUFDLElBQUlDLFlBQVk7QUFBQ04sTUFBTSxDQUFDSSxJQUFJLENBQUMsY0FBYyxFQUFDO0VBQUNHLE9BQU9BLENBQUNGLENBQUMsRUFBQztJQUFDQyxZQUFZLEdBQUNELENBQUM7RUFBQTtBQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7QUFHOUs7QUFDQTtBQUNBO0FB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Q0FBQztFQUNuQztFQUNBLE9BQU8sSUFBSSxDQUFDZ0IsS0FBSyxDQUFDLENBQUM7QUFDckIsQ0FBQyxDQUFDOztBQUVGO0FBQ0E7QUFDQTlCLE1BQU0sQ0FBQzRCLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWTtFQUMvQixJQUFJLElBQUksQ0FBQ0MsTUFBTSxFQUFFO0lBQ2YsT0FBTzdCLE1BQU0sQ0FBQ2lDLGNBQWMsQ0FBQ25CLElBQUksQ0FBQztNQUFFLFVBQVUsRUFBRSxJQUFJLENBQUNlO0lBQU8sQ0FBQyxDQUFDO0VBQ2hFO0VBQ0EsT0FBTyxJQUFJLENBQUNDLEtBQUssQ0FBQyxDQUFDO0FBQ3JCLENBQUMsQ0FBQzs7QUFFRjtBQUNBOUIsTUFBTSxDQUFDNEIsT0FBTyxDQUFDdkQsVUFBVSxDQUFDSCxtQkFBbUIsRUFBRSxZQUFZO0VBQ3pELE9BQU9HLFVBQVUsQ0FBQ2hCLFVBQVUsQ0FBQ3lELElBQUksQ0FBQyxDQUFDO0FBQ3JDLENBQUMsQ0FBQyxDOzs7Ozs7Ozs7OztBQ2xFRnBFLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLGtDQUFrQyxDQUFDO0FBQUNKLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLHNDQUFzQyxDQUFDO0FBQUNKLE1BQU0sQ0FBQ0ksSUFBSSxDQUFDLCtCQUErQixDQUFDLEMiLCJmaWxlIjoiL2FwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJztcbmltcG9ydCBTaW1wbGVTY2hlbWEgZnJvbSAnc2ltcGwtc2NoZW1hJztcblxuLyoqXG4gKiBUaGUgUHJvZmlsZXNDb2xsZWN0aW9uLiBJdCBlbmNhcHN1bGF0ZXMgc3RhdGUgYW5kIHZhcmlhYmxlIHZhbHVlcyBmb3IgUHJvZmlsZS5cbiAqL1xuY2xhc3MgUHJvZmlsZXNDb2xsZWN0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gVGhlIG5hbWUgb2YgdGhpcyBjb2xsZWN0aW9uLlxuICAgIHRoaXMubmFtZSA9ICdQcm9maWxlc0NvbGxlY3Rpb24nO1xuICAgIC8vIERlZmluZSB0aGUgTW9uZ28gY29sbGVjdGlvbi5cbiAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIC8vIERlZmluZSB0aGUgc3RydWN0dXJlIG9mIGVhY2ggZG9jdW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgdGhpcy5zY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgICAgIGltYWdlOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgb3B0aW9uYWw6IHRydWUsXG4gICAgICB9LFxuICAgICAgZmlyc3ROYW1lOiBTdHJpbmcsXG4gICAgICBsYXN0TmFtZTogU3RyaW5nLFxuICAgICAgZW1haWw6IFN0cmluZyxcbiAgICAgIGJpbzoge1xuICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGludGVyZXN0czoge1xuICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgIG9wdGlvbmFsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHR5cGU6IHtcbiAgICAgICAgdHlwZTogU3RyaW5nLFxuICAgICAgICBvcHRpb25hbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgLy8gQXR0YWNoIHRoZSBzY2hlbWEgdG8gdGhlIGNvbGxlY3Rpb24sIHNvIGFsbCBhdHRlbXB0cyB0byBpbnNlcnQgYSBkb2N1bWVudCBhcmUgY2hlY2tlZCBhZ2FpbnN0IHNjaGVtYS5cbiAgICB0aGlzLmNvbGxlY3Rpb24uYXR0YWNoU2NoZW1hKHRoaXMuc2NoZW1hKTtcbiAgICAvLyBEZWZpbmUgbmFtZXMgZm9yIHB1YmxpY2F0aW9ucyBhbmQgc3Vic2NyaXB0aW9uc1xuICAgIHRoaXMudXNlclB1YmxpY2F0aW9uTmFtZSA9IGAke3RoaXMubmFtZX0ucHVibGljYXRpb24udXNlcmA7XG4gICAgdGhpcy5hZG1pblB1YmxpY2F0aW9uTmFtZSA9IGAke3RoaXMubmFtZX0ucHVibGljYXRpb24uYWRtaW5gO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgUHJvZmlsZXNDb2xsZWN0aW9uLlxuICogQHR5cGUge1Byb2ZpbGVzQ29sbGVjdGlvbn1cbiAqL1xuZXhwb3J0IGNvbnN0IFByb2ZpbGVzID0gbmV3IFByb2ZpbGVzQ29sbGVjdGlvbigpO1xuIiwiaW1wb3J0IHsgTW9uZ28gfSBmcm9tICdtZXRlb3IvbW9uZ28nO1xuaW1wb3J0IFNpbXBsZVNjaGVtYSBmcm9tICdzaW1wbC1zY2hlbWEnO1xuXG4vKipcbiAqIFRoZSBSZWZlcmVuY2VzQ29sbGVjdGlvbi4gSXQgZW5jYXBzdWxhdGVzIHN0YXRlIGFuZCB2YXJpYWJsZSB2YWx1ZXMgZm9yIGEgcmVmZXJlbmNlIGd1aWRlIGVudHJ5LlxuICovXG5jbGFzcyBSZWZlcmVuY2VzQ29sbGVjdGlvbiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFRoZSBuYW1lIG9mIHRoaXMgY29sbGVjdGlvbi5cbiAgICB0aGlzLm5hbWUgPSAnUmVmZXJlbmNlc0NvbGxlY3Rpb24nO1xuICAgIC8vIERlZmluZSB0aGUgTW9uZ28gY29sbGVjdGlvbi5cbiAgICB0aGlzLmNvbGxlY3Rpb24gPSBuZXcgTW9uZ28uQ29sbGVjdGlvbih0aGlzLm5hbWUpO1xuICAgIC8vIERlZmluZSB0aGUgc3RydWN0dXJlIG9mIGVhY2ggZG9jdW1lbnQgaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgdGhpcy5zY2hlbWEgPSBuZXcgU2ltcGxlU2NoZW1hKHtcbiAgICAgIGltYWdlOiBTdHJpbmcsXG4gICAgICBwZXN0TmFtZTogU3RyaW5nLFxuICAgICAgc2NpTmFtZTogU3RyaW5nLFxuICAgICAgcmlzazogU3RyaW5nLFxuICAgICAgcmVnU3RhdHVzOiBTdHJpbmcsXG4gICAgICBwZXN0VHlwZToge1xuICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgIGFsbG93ZWRWYWx1ZXM6IFsnUGxhbnQnLCAnQW5pbWFsJywgJ0J1ZycsICdNaWNyb2JlJywgJ0Z1bmd1cyddLFxuICAgICAgfSxcbiAgICAgIGRlc2NyaXB0aW9uOiBTdHJpbmcsXG4gICAgICBpbXBhY3Q6IFN0cmluZyxcbiAgICAgIGRpc3RyaWJ1dGlvbjogU3RyaW5nLFxuICAgICAgbG9va2FsaWtlOiBTdHJpbmcsXG4gICAgfSk7XG4gICAgLy8gQXR0YWNoIHRoZSBzY2hlbWEgdG8gdGhlIGNvbGxlY3Rpb24sIHNvIGFsbCBhdHRlbXB0cyB0byBpbnNlcnQgYSBkb2N1bWVudCBhcmUgY2hlY2tlZCBhZ2FpbnN0IHNjaGVtYS5cbiAgICB0aGlzLmNvbGxlY3Rpb24uYXR0YWNoU2NoZW1hKHRoaXMuc2NoZW1hKTtcbiAgICAvLyBEZWZpbmUgbmFtZXMgZm9yIHB1YmxpY2F0aW9ucyBhbmQgc3Vic2NyaXB0aW9uc1xuICAgIHRoaXMudXNlclB1YmxpY2F0aW9uTmFtZSA9IGAke3RoaXMubmFtZX0ucHVibGljYXRpb24udXNlcmA7XG4gICAgdGhpcy5hZG1pblB1YmxpY2F0aW9uTmFtZSA9IGAke3RoaXMubmFtZX0ucHVibGljYXRpb24uYWRtaW5gO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgUmVmZXJlbmNlc0NvbGxlY3Rpb24uXG4gKiBAdHlwZSB7UmVmZXJlbmNlc0NvbGxlY3Rpb259XG4gKi9cbmV4cG9ydCBjb25zdCBSZWZlcmVuY2VzID0gbmV3IFJlZmVyZW5jZXNDb2xsZWN0aW9uKCk7XG4iLCJpbXBvcnQgeyBNb25nbyB9IGZyb20gJ21ldGVvci9tb25nbyc7XG5pbXBvcnQgU2ltcGxlU2NoZW1hIGZyb20gJ3NpbXBsLXNjaGVtYSc7XG5cbi8qKlxuICogVGhlIFJlcG9ydHNDb2xsZWN0aW9uLiBJdCBlbmNhcHN1bGF0ZXMgc3RhdGUgYW5kIHZhcmlhYmxlIHZhbHVlcyBmb3IgYSByZXBvcnQuXG4gKi9cbmNsYXNzIFJlcG9ydHNDb2xsZWN0aW9uIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gVGhlIG5hbWUgb2YgdGhpcyBjb2xsZWN0aW9uLlxuICAgIHRoaXMubmFtZSA9ICdSZXBvcnRzQ29sbGVjdGlvbic7XG4gICAgLy8gRGVmaW5lIHRoZSBNb25nbyBjb2xsZWN0aW9uLlxuICAgIHRoaXMuY29sbGVjdGlvbiA9IG5ldyBNb25nby5Db2xsZWN0aW9uKHRoaXMubmFtZSk7XG4gICAgLy8gRGVmaW5lIHRoZSBzdHJ1Y3R1cmUgb2YgZWFjaCBkb2N1bWVudCBpbiB0aGUgY29sbGVjdGlvbi5cbiAgICB0aGlzLnNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWEoe1xuICAgICAgaW1hZ2U6IFN0cmluZyxcbiAgICAgIHBlc3ROYW1lOiBTdHJpbmcsXG4gICAgICBwZXN0RGVzY3JpcHRpb246IFN0cmluZyxcbiAgICAgIGlzbGFuZDoge1xuICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgIGFsbG93ZWRWYWx1ZXM6IFsnTmlpaGF1JywgJ0thdWFpJywgJ09haHUnLCAnTW9sb2thaScsICdMYW5haScsICdNYXVpJywgJ0thaG9vbGF3ZScsICdIYXdhaWknXSxcbiAgICAgIH0sXG4gICAgICBsb2NhdGlvbjogU3RyaW5nLFxuICAgICAgZGF0ZTogRGF0ZSxcbiAgICAgIHJlcG9ydGVyOiBTdHJpbmcsXG4gICAgICB2ZXJpZmllZDoge1xuICAgICAgICB0eXBlOiBTdHJpbmcsXG4gICAgICAgIGFsbG93ZWRWYWx1ZXM6IFsnTm8nLCAnWWVzJ10sXG4gICAgICAgIGRlZmF1bHRWYWx1ZTogJ05vJyxcbiAgICAgIH0sXG4gICAgICByZW1vdmVkOiB7XG4gICAgICAgIHR5cGU6IFN0cmluZyxcbiAgICAgICAgYWxsb3dlZFZhbHVlczogWydObycsICdZZXMnXSxcbiAgICAgICAgZGVmYXVsdFZhbHVlOiAnTm8nLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICAvLyBBdHRhY2ggdGhlIHNjaGVtYSB0byB0aGUgY29sbGVjdGlvbiwgc28gYWxsIGF0dGVtcHRzIHRvIGluc2VydCBhIGRvY3VtZW50IGFyZSBjaGVja2VkIGFnYWluc3Qgc2NoZW1hLlxuICAgIHRoaXMuY29sbGVjdGlvbi5hdHRhY2hTY2hlbWEodGhpcy5zY2hlbWEpO1xuICAgIC8vIERlZmluZSBuYW1lcyBmb3IgcHVibGljYXRpb25zIGFuZCBzdWJzY3JpcHRpb25zXG4gICAgdGhpcy51c2VyVmVyaWZpZWRQb3N0cyA9IGAke3RoaXMubmFtZX0ucHVibGljYXRpb24udXNlcmA7XG4gICAgdGhpcy5hZG1pbkFsbFBvc3RzID0gYCR7dGhpcy5uYW1lfS5wdWJsaWNhdGlvbi5hZG1pbmA7XG4gICAgdGhpcy51c2VyU3BlY2lmaWNQb3N0cyA9IGAke3RoaXMubmFtZX0ucHVibGljYXRpb24udXNlclNwZWNpZmljYDtcbiAgICB0aGlzLmFkbWluVW52ZXJpZmllZFBvc3RzID0gYCR7dGhpcy5uYW1lfS5wdWJsaWNhdGlvbi5hZG1pblVudmVyaWZpZWRgO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiB0aGUgUmVwb3J0c0NvbGxlY3Rpb24uXG4gKiBAdHlwZSB7UmVwb3J0c0NvbGxlY3Rpb259XG4gKi9cbmV4cG9ydCBjb25zdCBSZXBvcnRzID0gbmV3IFJlcG9ydHNDb2xsZWN0aW9uKCk7XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IEFjY291bnRzIH0gZnJvbSAnbWV0ZW9yL2FjY291bnRzLWJhc2UnO1xuaW1wb3J0IHsgUm9sZXMgfSBmcm9tICdtZXRlb3IvYWxhbm5pbmc6cm9sZXMnO1xuXG4vKiBlc2xpbnQtZGlzYWJsZSBuby1jb25zb2xlICovXG5cbi8vIENyZWF0ZXMgdXNlclxuY29uc3QgY3JlYXRlVXNlciA9IChlbWFpbCwgcGFzc3dvcmQsIHJvbGUpID0+IHtcbiAgY29uc29sZS5sb2coYCAgQ3JlYXRpbmcgdXNlciAke2VtYWlsfS5gKTtcbiAgY29uc3QgdXNlcklEID0gQWNjb3VudHMuY3JlYXRlVXNlcih7XG4gICAgdXNlcm5hbWU6IGVtYWlsLFxuICAgIGVtYWlsOiBlbWFpbCxcbiAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gIH0pO1xuICBpZiAocm9sZSA9PT0gJ2FkbWluJykge1xuICAgIFJvbGVzLmNyZWF0ZVJvbGUocm9sZSwgeyB1bmxlc3NFeGlzdHM6IHRydWUgfSk7XG4gICAgUm9sZXMuYWRkVXNlcnNUb1JvbGVzKHVzZXJJRCwgJ2FkbWluJyk7XG4gIH1cbn07XG5cbi8vIFdoZW4gcnVubmluZyBhcHAgZm9yIGZpcnN0IHRpbWUsIHBhc3MgYSBzZXR0aW5ncyBmaWxlIHRvIHNldCB1cCBhIGRlZmF1bHQgdXNlciBhY2NvdW50LlxuaWYgKE1ldGVvci51c2Vycy5maW5kKCkuY291bnQoKSA9PT0gMCkge1xuICBpZiAoTWV0ZW9yLnNldHRpbmdzLmRlZmF1bHRBY2NvdW50cykge1xuICAgIGNvbnNvbGUubG9nKCdDcmVhdGluZyB0aGUgZGVmYXVsdCB1c2VyKHMpJyk7XG4gICAgTWV0ZW9yLnNldHRpbmdzLmRlZmF1bHRBY2NvdW50cy5mb3JFYWNoKCh7IGVtYWlsLCBwYXNzd29yZCwgcm9sZSB9KSA9PiB7XG4gICAgICBjcmVhdGVVc2VyKGVtYWlsLCBwYXNzd29yZCwgcm9sZSk7XG4gICAgfSk7XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5sb2coJ0Nhbm5vdCBpbml0aWFsaXplIHRoZSBkYXRhYmFzZSEgIFBsZWFzZSBpbnZva2UgbWV0ZW9yIHdpdGggYSBzZXR0aW5ncyBmaWxlLicpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBNZXRlb3IgfSBmcm9tICdtZXRlb3IvbWV0ZW9yJztcbmltcG9ydCB7IFJlcG9ydHMgfSBmcm9tICcuLi8uLi9hcGkvcmVwb3J0L1JlcG9ydC5qcyc7XG5pbXBvcnQgeyBSZWZlcmVuY2VzIH0gZnJvbSAnLi4vLi4vYXBpL3JlZmVyZW5jZS9SZWZlcmVuY2UuanMnO1xuaW1wb3J0IHsgUHJvZmlsZXMgfSBmcm9tICcuLi8uLi9hcGkvcHJvZmlsZS9Qcm9maWxlJztcbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cblxuLy8gSW5pdGlhbGl6ZSBSZWZlcmVuY2VzQ29sbGVjdGlvbiBkZWZhdWx0IGRhdGFcbmNvbnN0IGFkZFJlZmVyZW5jZSA9IChkYXRhKSA9PiB7XG4gIGNvbnNvbGUubG9nKGAgIEFkZGluZzogJHtkYXRhLnBlc3ROYW1lfSBgKTtcbiAgUmVmZXJlbmNlcy5jb2xsZWN0aW9uLmluc2VydChkYXRhKTtcbn07XG5cbmlmIChSZWZlcmVuY2VzLmNvbGxlY3Rpb24uZmluZCgpLmNvdW50KCkgPT09IDApIHtcbiAgaWYgKE1ldGVvci5zZXR0aW5ncy5yZWZlcmVuY2VEYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIGRlZmF1bHQgcmVmZXJlbmNlIGRhdGEuJyk7XG4gICAgTWV0ZW9yLnNldHRpbmdzLnJlZmVyZW5jZURhdGEuZm9yRWFjaChkYXRhID0+IGFkZFJlZmVyZW5jZShkYXRhKSk7XG4gIH1cbn1cblxuLy8gSW5pdGlhbGl6ZSBSZXBvcnRzQ29sbGVjdGlvbiBkZWZhdWx0IGRhdGFcbmNvbnN0IGFkZFJlcG9ydCA9IChkYXRhKSA9PiB7XG4gIGNvbnNvbGUubG9nKGAgIEFkZGluZzogJHtkYXRhLnBlc3ROYW1lfSAoJHtkYXRhLnJlcG9ydGVyfSwgJHtkYXRhLmRhdGV9KSBgKTtcbiAgUmVwb3J0cy5jb2xsZWN0aW9uLmluc2VydChkYXRhKTtcbn07XG5cbmlmIChSZXBvcnRzLmNvbGxlY3Rpb24uZmluZCgpLmNvdW50KCkgPT09IDApIHtcbiAgaWYgKE1ldGVvci5zZXR0aW5ncy5yZXBvcnREYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIGRlZmF1bHQgcmVwb3J0IGRhdGEuJyk7XG4gICAgTWV0ZW9yLnNldHRpbmdzLnJlcG9ydERhdGEuZm9yRWFjaChkYXRhID0+IGFkZFJlcG9ydChkYXRhKSk7XG4gIH1cbn1cblxuY29uc3QgYWRkUHJvZmlsZSA9IChkYXRhKSA9PiB7XG4gIGNvbnNvbGUubG9nKGAgIEFkZGluZzogJHtkYXRhLmxhc3ROYW1lfSwgJHtkYXRhLmVtYWlsfSBgKTtcbiAgUHJvZmlsZXMuY29sbGVjdGlvbi5pbnNlcnQoZGF0YSk7XG59O1xuXG5pZiAoUHJvZmlsZXMuY29sbGVjdGlvbi5maW5kKCkuY291bnQoKSA9PT0gMCkge1xuICBpZiAoTWV0ZW9yLnNldHRpbmdzLnByb2ZpbGVEYXRhKSB7XG4gICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIGRlZmF1bHQgcHJvZmlsZSBkYXRhLicpO1xuICAgIE1ldGVvci5zZXR0aW5ncy5wcm9maWxlRGF0YS5mb3JFYWNoKGRhdGEgPT4gYWRkUHJvZmlsZShkYXRhKSk7XG4gIH1cbn1cbiIsImltcG9ydCB7IE1ldGVvciB9IGZyb20gJ21ldGVvci9tZXRlb3InO1xuaW1wb3J0IHsgUm9sZXMgfSBmcm9tICdtZXRlb3IvYWxhbm5pbmc6cm9sZXMnO1xuaW1wb3J0IHsgUmVwb3J0cyB9IGZyb20gJy4uLy4uL2FwaS9yZXBvcnQvUmVwb3J0JztcbmltcG9ydCB7IFByb2ZpbGVzIH0gZnJvbSAnLi4vLi4vYXBpL3Byb2ZpbGUvUHJvZmlsZSc7XG5pbXBvcnQgeyBSZWZlcmVuY2VzIH0gZnJvbSAnLi4vLi4vYXBpL3JlZmVyZW5jZS9SZWZlcmVuY2UnO1xuXG4vLyBVc2VyLWxldmVsIHB1YmxpY2F0aW9uLlxuLy8gSWYgbG9nZ2VkIGluLCB0aGVuIHB1Ymxpc2ggZG9jdW1lbnRzIHRoYXQgYXJlIHZlcmlmaWVkLiBPdGhlcndpc2UsIHB1Ymxpc2ggbm90aGluZy5cbk1ldGVvci5wdWJsaXNoKFJlcG9ydHMudXNlclZlcmlmaWVkUG9zdHMsIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMudXNlcklkKSB7XG4gICAgcmV0dXJuIFJlcG9ydHMuY29sbGVjdGlvbi5maW5kKHsgdmVyaWZpZWQ6ICdZZXMnIH0pO1xuICB9XG4gIHJldHVybiB0aGlzLnJlYWR5KCk7XG59KTtcblxuLy8gd2hlbiBQb3N0c0J1dHRvbiBpcyBjbGlja2VkXG4vLyBJZiBsb2dnZWQgaW4gd2lsbCBvbmx5IGRpc3BsYXkgcmVwb3J0cyBtYWRlIGJ5IHRoZSB1c2VyXG5NZXRlb3IucHVibGlzaChSZXBvcnRzLnVzZXJTcGVjaWZpY1Bvc3RzLCBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLnVzZXJJZCkge1xuICAgIGNvbnN0IHVzZXJuYW1lID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmUodGhpcy51c2VySWQpLnVzZXJuYW1lO1xuICAgIHJldHVybiBSZXBvcnRzLmNvbGxlY3Rpb24uZmluZCh7IHJlcG9ydGVyOiB1c2VybmFtZSB9KTtcbiAgfVxuICByZXR1cm4gdGhpcy5yZWFkeSgpO1xufSk7XG5cbi8vIEFkbWluLWxldmVsIHB1YmxpY2F0aW9uLlxuLy8gSWYgbG9nZ2VkIGluIGFuZCB3aXRoIGFkbWluIHJvbGUsIHRoZW4gcHVibGlzaCBhbGwgZG9jdW1lbnRzIGZyb20gYWxsIHVzZXJzLiBPdGhlcndpc2UsIHB1Ymxpc2ggbm90aGluZy5cbk1ldGVvci5wdWJsaXNoKFJlcG9ydHMuYWRtaW5BbGxQb3N0cywgZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy51c2VySWQgJiYgUm9sZXMudXNlcklzSW5Sb2xlKHRoaXMudXNlcklkLCAnYWRtaW4nKSkge1xuICAgIHJldHVybiBSZXBvcnRzLmNvbGxlY3Rpb24uZmluZCgpO1xuICB9XG4gIHJldHVybiB0aGlzLnJlYWR5KCk7XG59KTtcblxuLy8gd2hlbiBBZG1pbkJ1dHRvbiBpcyBjbGlja2VkXG4vLyBpZiBsb2dnZWQgaW4gYW5kIHdpdGggYWRtaW4gcm9sZSwgdGhlbiBkaXNwbGF5cyBvbmx5IHVudmVyaWZpZWQgcG9zdHNcbk1ldGVvci5wdWJsaXNoKFJlcG9ydHMuYWRtaW5VbnZlcmlmaWVkUG9zdHMsIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMudXNlcklkICYmIFJvbGVzLnVzZXJJc0luUm9sZSh0aGlzLnVzZXJJZCwgJ2FkbWluJykpIHtcbiAgICByZXR1cm4gUmVwb3J0cy5jb2xsZWN0aW9uLmZpbmQoeyB2ZXJpZmllZDogJ05vJyB9KTtcbiAgfVxuICByZXR1cm4gdGhpcy5yZWFkeSgpO1xufSk7XG5cbk1ldGVvci5wdWJsaXNoKFByb2ZpbGVzLnVzZXJQdWJsaWNhdGlvbk5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIFByb2ZpbGVzLmNvbGxlY3Rpb24uZmluZCh7fSk7XG59KTtcblxuTWV0ZW9yLnB1Ymxpc2goUHJvZmlsZXMuYWRtaW5QdWJsaWNhdGlvbk5hbWUsIGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMudXNlcklkICYmIFJvbGVzLnVzZXJJc0luUm9sZSh0aGlzLnVzZXJJZCwgJ2FkbWluJykpIHtcbiAgICByZXR1cm4gUHJvZmlsZXMuY29sbGVjdGlvbi5maW5kKCk7XG4gIH1cbiAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbn0pO1xuXG4vLyBhbGFubmluZzpyb2xlcyBwdWJsaWNhdGlvblxuLy8gUmVjb21tZW5kZWQgY29kZSB0byBwdWJsaXNoIHJvbGVzIGZvciBlYWNoIHVzZXIuXG5NZXRlb3IucHVibGlzaChudWxsLCBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLnVzZXJJZCkge1xuICAgIHJldHVybiBNZXRlb3Iucm9sZUFzc2lnbm1lbnQuZmluZCh7ICd1c2VyLl9pZCc6IHRoaXMudXNlcklkIH0pO1xuICB9XG4gIHJldHVybiB0aGlzLnJlYWR5KCk7XG59KTtcblxuLy8gUHVibGlzaGVkIGFsbCByZWZlcmVuY2VzIHRvIGFwcGVhciB0byBSZXNvdXJjZXMgcGFnZVxuTWV0ZW9yLnB1Ymxpc2goUmVmZXJlbmNlcy51c2VyUHVibGljYXRpb25OYW1lLCBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiBSZWZlcmVuY2VzLmNvbGxlY3Rpb24uZmluZCgpO1xufSk7XG4iLCJpbXBvcnQgJy9pbXBvcnRzL3N0YXJ0dXAvc2VydmVyL0FjY291bnRzJztcbmltcG9ydCAnL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvUHVibGljYXRpb25zJztcbmltcG9ydCAnL2ltcG9ydHMvc3RhcnR1cC9zZXJ2ZXIvTW9uZ28nO1xuIl19
