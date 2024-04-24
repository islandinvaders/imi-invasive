import { Meteor } from 'meteor/meteor';
import { Reports } from '../../api/report/Report.js';
import { References } from '../../api/reference/Reference.js';
import { Profiles } from '../../api/profile/Profile';
/* eslint-disable no-console */

// Initialize ReferencesCollection default data
const addReference = (data) => {
  console.log(`  Adding: ${data.pestName} `);
  References.collection.insert(data);
};

if (References.collection.find().count() === 0) {
  if (Meteor.settings.referenceData) {
    console.log('Creating default reference data.');
    Meteor.settings.referenceData.forEach(data => addReference(data));
  }
}

// Initialize ReportsCollection default data
const addReport = (data) => {
  console.log(`  Adding: ${data.pestName} (${data.reporter}, ${data.date}) `);
  Reports.collection.insert(data);
};

if (Reports.collection.find().count() === 0) {
  if (Meteor.settings.reportData) {
    console.log('Creating default report data.');
    Meteor.settings.reportData.forEach(data => addReport(data));
  }
}

const addProfile = (data) => {
  console.log(`  Adding: ${data.LastName}, ${data.email} `);
  Profiles.collection.insert(data);
};

if (Profiles.collection.find().count() === 0) {
  if (Meteor.settings.profileData) {
    console.log('Creating default profile data.');
    Meteor.settings.profileData.forEach(data => addProfile(data));
  }
}
