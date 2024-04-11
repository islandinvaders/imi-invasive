import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';
import { Profiles } from '../../api/profile/Profile.js';

/* eslint-disable no-console */

const createUser = (email, password, role) => {
  console.log(`  Creating user ${email}.`);
  const userID = Accounts.createUser({
    username: email,
    email: email,
    password: password,
  });
  if (role === 'admin') {
    Roles.createRole(role, { unlessExists: true });
    Roles.addUsersToRoles(userID, 'admin');
  }
};
// Initialize ProfilesCollection default data
const createProfile = (firstName, lastName, email, bio, interests) => {
  console.log(`  Creating profile for ${email}.`);
  Profiles.collection.insert({ firstName, lastName, email, bio, interests });
};

// When running app for first time, pass a settings file to set up a default user account.
if (Meteor.users.find().count() === 0) {
  if (Meteor.settings.defaultAccounts) {
    console.log('Creating the default user(s)');
    Meteor.settings.defaultAccounts.forEach(({ email, password, role, firstName, lastName, bio, interests }) => {
      createUser(email, password, role);
      createProfile(firstName, lastName, email, bio, interests);
    });
  } else {
    console.log('Cannot initialize the database!  Please invoke meteor with a settings file.');
  }
}
