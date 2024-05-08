import React from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { AutoForm, ErrorsField, SelectField, LongTextField, SubmitField, HiddenField, TextField } from 'uniforms-bootstrap5';
import swal from 'sweetalert';
import { Meteor } from 'meteor/meteor';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import SimpleSchema from 'simpl-schema';
import { Roles } from 'meteor/alanning:roles';
import { Reports } from '../../api/report/Report';

// Create a schema to specify the structure of the data to appear in the form.
const formSchema = new SimpleSchema({
  image: String,
  pestName: String,
  pestDescription: String,
  island: {
    type: String,
    allowedValues: ['Niihau', 'Kauai', 'Oahu', 'Molokai', 'Lanai', 'Maui', 'Kahoolawe', 'Hawaii'],
  },
  location: String,
  date: Date,
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

const bridge = new SimpleSchema2Bridge(formSchema);

/* Renders the AddReport page for adding a document. */
const AddPost = () => {

  // On submit, insert the data.
  const submit = async (data) => {
    const { image, pestName, pestDescription, island, location, verified, removed } = data;
    const reporter = Meteor.user().username;
    const date = new Date();
    Reports.collection.insert(
      { image, pestName, pestDescription, island, location, verified, removed, reporter, date },
      (error) => {
        if (error) {
          swal('Error', error.message, 'error');
        } else {
          swal('Success', 'Item added successfully', 'success');
          // Close the SweetAlert dialog after 2 seconds
          setTimeout(() => {
            swal.close(); // Close the SweetAlert dialog
          }, 2000); // Adjust the delay as needed
        }
      },
    );
  };
  const isAdmin = Meteor.userId() && Roles.userIsInRole(Meteor.userId(), 'admin');
  // Render the form. Use Uniforms: https://github.com/vazco/uniforms
  let fRef = null;
  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center"><h2>Make A Report</h2></Col>
          <AutoForm ref={ref => { fRef = ref; }} schema={bridge} onSubmit={data => submit(data, fRef)}>
            <Card>
              <Card.Body>
                <Row>
                  <TextField id="report-image" name="image" />
                </Row>
                <Row>
                  <Col>
                    <TextField id="report-pestname" name="pestName" />
                  </Col>
                  <Col>
                    <SelectField id="report-island" name="island" />
                  </Col>
                  <Col>
                    <TextField id="report-location" name="location" />
                  </Col>
                </Row>
                <Row>
                  <LongTextField id="report-description" name="pestDescription" />
                </Row>
                <Row>
                  {isAdmin && (
                    <Col><SelectField id="report-verified" name="verified" /></Col>
                  )}
                  <Col><SelectField id="report-removed" name="removed" /></Col>
                </Row>
                <SubmitField id="report-submit" value="Submit" />
                <ErrorsField />
                <HiddenField name="date" value={new Date()} />
              </Card.Body>
            </Card>
          </AutoForm>
        </Col>
      </Row>
    </Container>
  );
};

export default AddPost;
