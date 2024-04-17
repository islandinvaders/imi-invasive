import React from 'react';
import swal from 'sweetalert';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { AutoForm, ErrorsField, HiddenField, NumField, SelectField, SubmitField, TextField } from 'uniforms-bootstrap5';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';


// use profiles collection
const bridge = new SimpleSchema2Bridge(Profiles.schema);

// View your own profile
const EditProfile = () => {
  const currentUser = useTracker(() => Meteor.user());
  const { ready, thisProfile } = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    // Get access to Stuff documents.
    const subscription = Meteor.subscribe(Profiles.userPublicationName);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the Stuff documents
    const profile = Profiles.collection.findOne({ email: currentUser?.username });
    return {
      thisProfile: profile,
      ready: rdy,
    };
  }, []);

  // console.log('EditStuff', doc, ready);
  // On successful submit, insert the data.
  const submit = (data) => {
    const { firstName, lastName, email, bio, interests } = data;
    Profiles.collection.update(thisProfile, { $set: { firstName, lastName, email, bio, interests } }, (error) => (error ?
      swal('Error', error.message, 'error') :
      swal('Success', 'Item updated successfully', 'success')));
  };

  return ready ? (
    <Container className="py-3">
      <h2 className="text-center">Edit Profile</h2>
      <Row className="justify-content-center">
        <Col xs={8}>
          <Card>
            <AutoForm schema={bridge} onSubmit={data => submit(data)} model={doc}>
              <Card.Body>
                <Row>
                  <Col>
                    <TextField name="firstName" />
                  </Col>
                  <Col>
                    <TextField name="lastName" />
                  </Col>
                  <Col>
                    <TextField name="email" />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <TextField name="bio" />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <TextField name="interests" />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col className="d-flex justify-content-center">
                    <SubmitField value="Save Changes" />
                  </Col>
                </Row>
              </Card.Body>
            </AutoForm>
          </Card>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};
export default EditProfile;
