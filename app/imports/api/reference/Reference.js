import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

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
        allowedValues: ['Plant', 'Animal', 'Bug', 'Microbe', 'Fungus'],
      },
      description: String,
      impact: String,
      distribution: String,
      lookalike: String,
    });
    // Attach the schema to the collection, so all attempts to insert a document are checked against schema.
    this.collection.attachSchema(this.schema);
    // Define names for publications and subscriptions
    this.userPublicationName = `${this.name}.publication.user`;
    this.adminPublicationName = `${this.name}.publication.admin`;
  }
}

/**
 * The singleton instance of the ReferencesCollection.
 * @type {ReferencesCollection}
 */
export const References = new ReferencesCollection();
