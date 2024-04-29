import React from 'react';
import { Card, Col, Container, Image, Row } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useParams } from 'react-router';
import LoadingSpinner from '../components/LoadingSpinner';
import { Profiles } from '../../api/profile/Profile';

/* Renders the ViewProfile page for viewing a single profile. */
const ViewProfile = () => {
  const { _id } = useParams();
  const { thisProfile, ready } = useTracker(() => {
    const subscription = Meteor.subscribe(Profiles.userPublicationName);
    const rdy = subscription.ready();
    const profile = Profiles.collection.findOne(_id);
    return {
      thisProfile: profile,
      ready: rdy,
    };
  }, [_id]);

  return ready ? (
    <Container className="py-4">
      <Row className="justify-content-center mb-4">
        <Col>
          <Col md={12} className="text-center mb-4"><h2>View {thisProfile.firstName}&nbsp;{thisProfile.lastName}&apos;s Profile</h2></Col>
          <Row className="d-flex justify-content-center">
            <Col xs={12} md={5} className="d-flex justify-content-center">
              {thisProfile.image && (
                <Image
                  roundedCircle
                  src={thisProfile.image}
                  style={{ width: '300px', height: '300px' }}
                  alt="profile picture"
                />
              )}
            </Col>

            <Col xs={12} md={7}>
              <Card className="ml-2">
                <Card.Header>
                  <Card.Title>{thisProfile.firstName} {thisProfile.lastName}</Card.Title>
                  <Card.Subtitle>{thisProfile.email}</Card.Subtitle>
                </Card.Header>
                <Card.Body>
                  <Card.Text>
                    <span className="fw-bold">Bio:</span>{' '}{thisProfile.bio}
                  </Card.Text>
                  <Card.Text>
                    <span className="fw-bold">Interests:</span>{' '}{thisProfile.interests}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default ViewProfile;
