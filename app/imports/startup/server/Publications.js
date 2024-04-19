import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/alanning:roles';
import { Reports } from '../../api/report/Report';
import { Profiles } from '../../api/profile/Profile';
import { References } from '../../api/reference/Reference';

// User-level publication.
// If logged in, then publish documents that are verified. Otherwise, publish nothing.
Meteor.publish(Reports.userVerifiedPosts, function () {
  if (this.userId) {
    return Reports.collection.find({ verified: 'Yes' });
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

Meteor.publish(Profiles.userPublicationName, function () {
  if (this.userId) {
    return Profiles.collection.find();
  }
  return this.ready();
});

// alanning:roles publication
// Recommended code to publish roles for each user.
Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({ 'user._id': this.userId });
  }
  return this.ready();
});

// Pubished all references to appear to Resources page
Meteor.publish(References.userPublicationName, function () {
  return References.collection.find();
});
