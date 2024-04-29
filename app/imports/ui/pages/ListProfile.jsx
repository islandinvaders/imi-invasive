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
            <h2>List Profiles</h2>
          </Col>
          <Row xs={1} sm={2} lg={3} className="g-4">
            {thisProfile.map((profile) => <Col><div><Profile key={profile._id} listProfile={profile} /></div></Col>)}
          </Row>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default ListProfile;
