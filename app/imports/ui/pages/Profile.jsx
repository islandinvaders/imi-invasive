import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Card, Col, Container, Row, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';

// View your own profile
const Profile = () => {
  const currentUser = useTracker(() => Meteor.user());
  const navigate = useNavigate(); // Hook for redirecting
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

  const handleEditRedirect = () => {
    navigate('/edit-profile'); // This will redirect to the EditProfile component
  };

  return ready ? (
    <Container className="py-3">
      <h2 className="text-center">Profile</h2>
      <Row className="justify-content-center">
        <Col xs={8}>
          <Card>
            <Card.Body>
              <Row>
                <Col>
                  First name
                  <Card><Card.Body className="py-1">{thisProfile.firstName}</Card.Body></Card>
                </Col>
                <Col>
                  Last name
                  <Card><Card.Body className="py-1">{thisProfile.lastName}</Card.Body></Card>
                </Col>
                <Col>
                  Email
                  <Card><Card.Body className="py-1">{thisProfile.email}</Card.Body></Card>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  Bio
                  <Card><Card.Body className="py-1" style={{ minHeight: '5rem' }}>{thisProfile.bio}</Card.Body></Card>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  Interests
                  <Card><Card.Body className="py-1">{thisProfile.interests}</Card.Body></Card>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col className="d-flex justify-content-center">
                  <Button className="px-4" onClick={handleEditRedirect}>Edit Profile</Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default Profile;
