import React from 'react';
import swal from 'sweetalert';
import { Card, Col, Container, Image, Row } from 'react-bootstrap';
import { AutoForm, ErrorsField, HiddenField, NumField, SelectField, SubmitField, TextField } from 'uniforms-bootstrap5';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import { useParams } from 'react-router';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';

/* Renders the EditStuff page for editing a single document. */
const ViewProfile = () => {
  // Get the documentID from the URL field. See imports/ui/layouts/App.jsx for the route containing :_id.
  const { _id } = useParams();
  // console.log('EditStuff', _id);
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { thisProfile, ready } = useTracker(() => {
    // Get access to Stuff documents.
    const subscription = Meteor.subscribe(Profiles.userPublicationName);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the document
    const profile = Profiles.collection.findOne(_id);
    return {
      thisProfile: profile,
      ready: rdy,
    };
  }, [_id]);
  // console.log('EditStuff', doc, ready);
  // On successful submit, insert the data.

  return ready ? (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col>
          <Col className="text-center"><h2>View Profile</h2></Col>
          <Row className="d-flex justify-content-left">
            <Col>
              {thisProfile.image && (
                <Image
                  roundedCircle
                  src={thisProfile.image}
                  style={{ width: '300px', height: '300px' }}
                  alt="profile picture"
                />
              )}
            </Col>
            <Col className="d-flex justify-content-center">
              {thisProfile.firstName}
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default ViewProfile;
