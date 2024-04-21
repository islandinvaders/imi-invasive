import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

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
        allowedValues: ['Niihau', 'Kauai', 'Oahu', 'Molokai', 'Lanai', 'Maui', 'Kahoolawe', 'Hawaii'],
      },
      location: String,
      date: Date,
      reporter: String,
      verified: {
        type: String,
        allowedValues: ['No', 'Yes'],
        defaultValue: 'No',
      },
      removed: {
        type: String,
        allowedValues: ['No', 'Yes'],
        defaultValue: 'No',
      },
    });
    // Attach the schema to the collection, so all attempts to insert a document are checked against schema.
    this.collection.attachSchema(this.schema);
    // Define names for publications and subscriptions
    this.userPublicationName = `${this.name}.publication.user`;
    this.adminPublicationName = `${this.name}.publication.admin`;
  }
}

/**
 * The singleton instance of the ReportsCollection.
 * @type {ReportsCollection}
 */
export const Reports = new ReportsCollection();
