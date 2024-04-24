import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { NavLink } from 'react-router-dom';
import { Roles } from 'meteor/alanning:roles';
import { Container, Nav, Navbar } from 'react-bootstrap';
import '/client/style.css';

const NavBar = () => {
  const { currentUser } = useTracker(() => ({
    currentUser: Meteor.user() ? Meteor.user().username : '',
  }), []);

  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
            {currentUser ? ([
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/profile">PROFILE</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/about">ABOUT US</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/posts">POSTS</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/add">FILE REPORT</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/resources">INVASIVE LIST</Nav.Link>,
            ]) : ''}
            {Roles.userIsInRole(Meteor.userId(), 'admin') ? (
              <Nav.Item key="admin">
                <Nav.Link id="list-stuff-admin-nav" as={NavLink} to="/admin">Admin</Nav.Link>
              </Nav.Item>
            ) : ''}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
