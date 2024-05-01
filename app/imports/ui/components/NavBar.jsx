import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { NavLink } from 'react-router-dom';
import { Roles } from 'meteor/alanning:roles';
import { Container, Nav, Navbar } from 'react-bootstrap';
import '/client/style.css'; // Assuming this path is correct

const NavBar = () => {
  const { currentUser } = useTracker(() => ({
    currentUser: Meteor.user() ? Meteor.user().username : null,
  }), []);

  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {currentUser && (
              <>
                <Nav.Link as={NavLink} to="/about" key="about">ABOUT US</Nav.Link>
                {Roles.userIsInRole(Meteor.userId(), 'admin') ? (
                  <>
                    <Nav.Link as={NavLink} to="/list-profile-admin" key="profile-admin">PROFILE ADMIN</Nav.Link>
                    <Nav.Link as={NavLink} to="/postsadmin" key="posts-admin">POSTS ADMIN</Nav.Link>
                    <Nav.Link as={NavLink} to="/resourcesadmin" key="resources-admin">INVASIVE LIST ADMIN</Nav.Link>
                  </>
                ) : (
                  <>
                    <Nav.Link as={NavLink} to="/edit-profile" key="edit-profile">EDIT PROFILE</Nav.Link>
                    <Nav.Link as={NavLink} to="/posts" key="posts">POSTS</Nav.Link>
                    <Nav.Link as={NavLink} to="/add" key="file-report">FILE REPORT</Nav.Link>
                    <Nav.Link as={NavLink} to="/resources" key="resources">INVASIVE LIST</Nav.Link>
                  </>
                )}
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
