import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
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

  const handleEditRedirect = () => {
    useNavigate('/edit-profile'); // This will redirect to the ListProfile component
  };

  return ready ? (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col>
          <Col className="text-center">
            <h2>List Profiles</h2>
          </Col>
          <Row xs={2} md={3} lg={3} className="g-4" style={{ rowGap: '20px', columnGap: '20px' }}>
            {thisProfile.map((profile) => <Profile key={profile._id} listProfile={profile} />)}
          </Row>
        </Col>
        <Row>
          <Col className="d-flex justify-content-start">
            <Button className="px-4" onClick={handleEditRedirect}>Edit Profile</Button>
          </Col>
        </Row>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default ListProfile;
