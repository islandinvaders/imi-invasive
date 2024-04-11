import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { Stuffs } from '../../api/stuff/Stuff';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';

//edit and view your own profile
const Profile = () => {
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
  return ready ? (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col xs={4} className="text-center">
          <h2>Profile</h2>
          <Card>
            <Card.Body>
              <Card.Text>{thisProfile.firstName}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default Profile;
