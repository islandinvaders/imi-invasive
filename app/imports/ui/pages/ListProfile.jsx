import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Col, Container, Row } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';
import Profile from '../components/Profile';

// View your own profile
const ListProfile = () => {
  const { ready, thisProfile } = useTracker(() => {
    const subscription = Meteor.subscribe(Profiles.userPublicationName);
    // eslint-disable-next-line no-shadow
    const ready = subscription.ready();
    const profile = Profiles.collection.find({}).fetch();
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
            <h2>Profiles</h2>
          </Col>
          {thisProfile ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              <Col key={thisProfile._id}>
                <Profile listProfile={thisProfile} />
              </Col>
            </Row>
          ) : (
            <p>No profile found.</p>
          )}
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default ListProfile;
