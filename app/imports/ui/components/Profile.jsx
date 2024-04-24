import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'react-bootstrap';

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const Profile = ({ listProfile }) => (
  <Card className="h-100" style={{ marginBottom: '20px' }}>
    <Card.Header>
      <Card.Title>{listProfile.firstName} {listProfile.lastName}</Card.Title>
      <Card.Subtitle>{listProfile.email}</Card.Subtitle>
    </Card.Header>
    <Card.Body style={{ padding: '20px' }}>
      <Card.Text>{listProfile.bio}</Card.Text>
      <Card.Text>{listProfile.type}</Card.Text>
      <Card.Text>{listProfile.interests}</Card.Text>
    </Card.Body>
  </Card>
);

// Require a document to be passed to this component.
Profile.propTypes = {
  listProfile: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    bio: PropTypes.string,
    type: PropTypes.string,
    interests: PropTypes.string,
    _id: PropTypes.string.isRequired,
  }).isRequired,
};

export default Profile;
