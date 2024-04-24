import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { NavLink } from 'react-router-dom';
import { Roles } from 'meteor/alanning:roles';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, PersonFill, PersonPlusFill } from 'react-bootstrap-icons';

const NavBar = () => {
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { currentUser } = useTracker(() => ({
    currentUser: Meteor.user() ? Meteor.user().username : '',
  }), []);

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand id="landing-page" as={NavLink} to="/">
          <h2>&apos;Imi Invasive</h2>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto justify-content-start">
            {currentUser && !Roles.userIsInRole(Meteor.userId(), 'admin') ? ([ // User Navbar
              <Nav.Link id="profile-nav" as={NavLink} to="/profile" key="profile">Profile</Nav.Link>,
              <Nav.Link id="about-us-nav" as={NavLink} to="/about" key="about">About Us</Nav.Link>,
              <Nav.Link id="posts-nav" as={NavLink} to="/posts" key="posts">Posts</Nav.Link>,
              <Nav.Link id="reports-nav" as={NavLink} to="/add" key="posts">File Report</Nav.Link>,
              <Nav.Link id="resources-nav" as={NavLink} to="/resources" key="resources">Invasive List</Nav.Link>,
            ]) : ''}
            {Roles.userIsInRole(Meteor.userId(), 'admin') ? ([ // Admin Navbar
              <Nav.Link id="profile-nav" as={NavLink} to="/profile" key="profile">Profile</Nav.Link>,
              <Nav.Link id="about-us-nav" as={NavLink} to="/about" key="about">About Us</Nav.Link>,
              <Nav.Link id="posts-admin-nav" as={NavLink} to="/postsadmin" key="posts">Posts Admin</Nav.Link>,
              <Nav.Link id="posts-nav" as={NavLink} to="/add" key="posts">File Report</Nav.Link>,
              <Nav.Link id="resources-admin-nav" as={NavLink} to="/resourcesadmin" key="resources">Invasive List Admin</Nav.Link>,
            ]) : ''}
          </Nav>
          <Nav className="justify-content-end">
            {currentUser === '' ? (
              <NavDropdown id="login-dropdown" title="Login">
                <NavDropdown.Item id="login-dropdown-sign-in" as={NavLink} to="/signin">
                  <PersonFill />
                  Sign
                  in
                </NavDropdown.Item>
                <NavDropdown.Item id="login-dropdown-sign-up" as={NavLink} to="/signup">
                  <PersonPlusFill />
                  Sign
                  up
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="navbar-current-user" title={currentUser}>
                <NavDropdown.Item id="navbar-sign-out" as={NavLink} to="/signout">
                  <BoxArrowRight />
                  {' '}
                  Sign
                  out
                </NavDropdown.Item>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
