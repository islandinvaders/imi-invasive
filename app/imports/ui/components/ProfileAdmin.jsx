import React from 'react';
import PropTypes from 'prop-types';
import { Card, Image, Button } from 'react-bootstrap';

const ProfileAdmin = ({ listProfile, collection }) => {
  const removeItem = (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      collection.remove(profileId, (error) => {
        if (error) {
          alert(`Error removing profile: ${error.message}`);
        } else {
          // Notify the user of successful removal
          alert('Profile removed successfully!');
        }
      });
    }
  };

  return (
    <Card style={{ marginBottom: '20px', minHeight: '20rem', maxHeight: '20rem' }}>
      <Card.Header>
        {listProfile.image && (
          <Image
            roundedCircle
            src={listProfile.image}
            style={{ width: '80px', height: '80px' }}
            alt="profile picture"
          />
        )}
        <Card.Title>{listProfile.firstName} {listProfile.lastName}</Card.Title>
        <Card.Subtitle>{listProfile.email}</Card.Subtitle>
      </Card.Header>
      <Card.Body style={{ maxHeight: '15rem', overflow: 'hidden' }}>
        <span
          className="overflow-y-hidden"
          style={{
            display: '-webkit-box',
            maxHeight: '15rem',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 3, // Limits to 3 lines of text
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <span className="fw-bold">Bio:</span>{' '}{listProfile.bio}
        </span>
        <Card.Text>
          <span className="fw-bold">Interests:</span><span>{' '}{listProfile.interests}</span>
        </Card.Text>
      </Card.Body>
      <Card.Footer>
        <div className="d-flex justify-content-center">
          <Button variant="danger" onClick={() => removeItem(listProfile._id)}>Delete</Button>
        </div>
      </Card.Footer>
    </Card>
  );
};

ProfileAdmin.propTypes = {
  listProfile: PropTypes.shape({
    image: PropTypes.string,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    bio: PropTypes.string,
    interests: PropTypes.string,
    _id: PropTypes.string.isRequired,
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  collection: PropTypes.object.isRequired,
};

export default ProfileAdmin;
