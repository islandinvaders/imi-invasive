import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { NavLink } from 'react-router-dom';
import { Roles } from 'meteor/alanning:roles';
import { Container, Nav, Navbar, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, PersonFill, PersonPlusFill } from 'react-bootstrap-icons';
import '/client/style.css';

const NavBar = () => {
  const { currentUser } = useTracker(() => ({
    currentUser: Meteor.user() ? Meteor.user().username : '',
  }), []);

  return (
    <Navbar expand="lg" className="custom-navbar justify-content-center">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {currentUser ? ([
              <Nav.Item key="profile" className="border-1 border-top border-dark">
                <Nav.Link id="list-stuff-nav" as={NavLink} to="/profile">Profile</Nav.Link>
              </Nav.Item>,
              <Nav.Item key="about" className="border-1 border-top border-dark">
                <Nav.Link id="list-stuff-nav" as={NavLink} to="/about">About Us</Nav.Link>
              </Nav.Item>,
              <Nav.Item key="posts" className="border-1 border-top border-dark">
                <Nav.Link id="list-stuff-nav" as={NavLink} to="/posts">Posts</Nav.Link>
              </Nav.Item>,
              <Nav.Item key="file-report" className="border-1 border-top border-dark">
                <Nav.Link id="list-stuff-nav" as={NavLink} to="/add">File Report</Nav.Link>
              </Nav.Item>,
              <Nav.Item key="invasive-list" className="border-1 border-top border-dark">
                <Nav.Link id="list-stuff-nav" as={NavLink} to="/resources">Invasive List</Nav.Link>
              </Nav.Item>,
            ]) : ''}
            {Roles.userIsInRole(Meteor.userId(), 'admin') ? (
              <Nav.Item key="admin">
                <Nav.Link id="list-stuff-admin-nav" as={NavLink} to="/admin">Admin</Nav.Link>
              </Nav.Item>
            ) : ''}
          </Nav>
          <Nav>
            {currentUser === '' ? (
              <NavDropdown id="login-dropdown" title="Login">
                <NavDropdown.Item as={NavLink} to="/signin">
                  <PersonFill />
                  Sign in
                </NavDropdown.Item>
                <NavDropdown.Item as={NavLink} to="/signup">
                  <PersonPlusFill />
                  Sign up
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <NavDropdown id="navbar-current-user" title={currentUser}>
                <NavDropdown.Item as={NavLink} to="/signout">
                  <BoxArrowRight />
                  Sign out
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
