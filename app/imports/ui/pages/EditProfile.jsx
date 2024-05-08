import React from 'react';
import swal from 'sweetalert';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Card, Col, Container, Row, Button } from 'react-bootstrap';
import { AutoForm, SubmitField, TextField } from 'uniforms-bootstrap5';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';

// use profiles collection
const bridge = new SimpleSchema2Bridge(Profiles.schema);

// View your own profile
const EditProfile = () => {
  const currentUser = useTracker(() => Meteor.user());
  const navigate = useNavigate(); // Hook for redirecting
  const { ready, thisProfile } = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    // Get access to Profile documents.
    const subscription = Meteor.subscribe(Profiles.userPublicationName);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the Profile documents
    const profile = Profiles.collection.findOne({ email: currentUser?.emails[0].address });

    return {
      thisProfile: profile,
      ready: rdy,
    };
  }, []);

  // console.log('EditProfile', doc, ready);
  // On successful submit, insert the data.
  const submit = (data) => {
    const { image, firstName, lastName, email, bio, interests } = data;
    Profiles.collection.update(thisProfile._id, { $set: { image, firstName, lastName, email, bio, interests } }, (error) => {
      if (error) {
        // Show an error message if the update fails
        swal('Error', error.message, 'error');
      } else {
        // Show a success message if the update is successful
        swal('Success', 'Profile updated successfully', 'success');

        // Close the SweetAlert dialog after 2 seconds
        setTimeout(() => {
          swal.close(); // Close the SweetAlert dialog
        }, 2000); // Adjust the delay as needed
      }
    });
  };

  const handleListRedirect = () => {
    navigate('/list-profile'); // This will redirect to the ListProfile component
  };

  return ready ? (
    <Container className="py-3">
      <h2 className="text-center mb-3">Edit Profile</h2>
      <Row className="justify-content-center">
        <Col xs={8}>
          <Card>
            <AutoForm schema={bridge} onSubmit={submit} model={thisProfile}>
              <Card.Body>
                <Row><TextField id="profile-image" name="image" style={{ minHeight: '5rem' }} /></Row>
                <Row>
                  <Col>
                    <TextField id="profile-firstname" name="firstName" style={{ minHeight: '5rem' }} />
                  </Col>
                  <Col>
                    <TextField id="profile-lastname" name="lastName" style={{ minHeight: '5rem' }} />
                  </Col>
                  <Col>
                    <TextField id="prfoile-email" name="email" style={{ minHeight: '5rem' }} />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <TextField id="profile-bio" name="bio" style={{ minHeight: '5rem' }} />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col>
                    <TextField id="profile-interests" name="interests" style={{ minHeight: '5rem' }} />
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col className="d-flex justify-content-start">
                    <Button id="list-profiles-button" className="px-4 btn-primary" onClick={handleListRedirect}>List Profiles</Button>
                  </Col>
                  <Col>
                    <SubmitField id="profile-save-changes" className="d-flex justify-content-end" value="Save Changes" />
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
