import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { ButtonGroup, DropdownButton, Dropdown, Button } from 'react-bootstrap';
import { Reports } from '../../api/report/Report';

// Posts Button
const PostsButton = () => {
  const [posts, setPosts] = useState(null);

  useTracker(() => {
    const subscription = Meteor.subscribe(Reports.userSpecificPosts);

    if (subscription.ready()) {
      const userPosts = Reports.collection.find().fetch();
      if (userPosts && userPosts.length > 0) {
        setPosts(userPosts);
      } else {
        setPosts(null);
      }
    }
  }, []);

  return (
    <ButtonGroup vertical style={{ width: '150px' }}>
      <DropdownButton
        as={ButtonGroup}
        title="My Posts"
        id="bg-vertical-dropdown-1"
      >
        <Dropdown.Item eventKey="1">View All</Dropdown.Item>
        <Dropdown.Item eventKey="2">Delete</Dropdown.Item>
        <Dropdown.Item eventKey="3">Edit</Dropdown.Item>
      </DropdownButton>
      <Button>Everyone Else</Button>
    </ButtonGroup>
  );
};

export default PostsButton;
