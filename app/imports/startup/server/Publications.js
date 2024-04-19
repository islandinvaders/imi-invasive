import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Reports } from '../../api/report/Report';
import { Profiles } from '../../api/profile/Profile';
import { References } from '../../api/reference/Reference';

// User-level publication.
// If logged in, then publish documents that are verified. Otherwise, publish nothing.
Meteor.publish(Reports.userPublicationName, function () {
  if (this.userId) {
    return Reports.collection.find({ verified: 'Yes' });
  }
  return this.ready();
});

// Admin-level publication.
// If logged in and with admin role, then publish all documents from all users. Otherwise, publish nothing.
Meteor.publish(Reports.adminPublicationName, function () {
  if (this.userId && Roles.userIsInRole(this.userId, 'admin')) {
    return Reports.collection.find();
  }
  return this.ready();
});

// Publish only user's reports to appear to Posts page
Meteor.publish(Reports.userPublicationName, function () {
  if (this.userId) {
    const username = Meteor.users.findOne(this.userId).username;
    return Reports.collection.find({ reporter: username });
  }
  return this.ready();
});

// Publish only unverified reports to appear to AdminPosts page for verification

Meteor.publish(Profiles.userPublicationName, function () {
  if (this.userId) {
    return Profiles.collection.find();
  }
  return this.ready();
});

// planning:roles publication
// Recommended code to publish roles for each user.
Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({ 'user._id': this.userId });
  }
  return this.ready();
});

// Published all references to appear to Resources page
Meteor.publish(References.userPublicationName, function () {
  return References.collection.find();
});

