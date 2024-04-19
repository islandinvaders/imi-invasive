import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Col, Container, Row } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';

// View your own profile
const ListProfile = () => {
  const currentUser = useTracker(() => Meteor.user());
  const { ready, thisProfile } = useTracker(() => {
    const subscription = Meteor.subscribe(Profiles.userPublicationName);
    // eslint-disable-next-line no-shadow
    const ready = subscription.ready();
    const profile = Profiles.collection.findOne({ email: currentUser?.username });
    return {
      thisProfile: profile,
      ready,
    };
  }, []);

  return ready ? (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col>
          <Col className="text-center">
            <h2>List Contacts</h2>
          </Col>3
          <Row xs={1} md={2} lg={3} className="g-4">
            {profile.map((profile) => (<Col key={profile._id}><Profile contact={profile} /></Col>))}
          </Row>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};


export default ListProfile;
