import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const Profile = ({ profile }) => (
  <Card className="h-100">
    <Card.Header>
      <Card.Title>{profile.firstName} {profile.lastName}</Card.Title>
      <Card.Subtitle>{profile.email}</Card.Subtitle>
    </Card.Header>
    <Card.Body>
      <Card.Text>{profile.bio}</Card.Text>
      <Card.Text>{profile.type}</Card.Text>
      <Card.Text>{profile.interests}</Card.Text>
      <Link to={`/edit/${profile._id}`}>Edit</Link>
    </Card.Body>
  </Card>
);

// Require a document to be passed to this component.
Profile.propTypes = {
  profile: PropTypes.shape({
    firstName: PropTypes.string,
    lastName: PropTypes.string,
    email: PropTypes.string,
    bio: PropTypes.string,
    type: PropTypes.string,
    optional: true,
  }),
  interests: PropTypes.string,
  optional: true,
  _id: PropTypes.string,
};


export default Profile;
