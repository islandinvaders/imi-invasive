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
    <Navbar expand="lg" className="custom-navbar justify-content-center">
      <Container className="justify-content-center">
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="justify-content-center">
            {currentUser && !Roles.userIsInRole(Meteor.userId(), 'admin') ? ([ // User Navbar
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/profile" key="profile">PROFILE</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/about" key="about">ABOUT US</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/posts" key="posts">POSTS</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/add" key="posts">FILE REPORT</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/resources" key="resources">INVASIVE LIST</Nav.Link>,
            ]) : ''}
            {Roles.userIsInRole(Meteor.userId(), 'admin') ? ([ // Admin Navbar
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/profile" key="profile">Profile</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/about" key="about">ABOUT US</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/postsadmin" key="posts">POSTS ADMIN</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/add" key="posts">FILE REPORT</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/resourcesadmin" key="resources">INVASIVE LIST ADMIN</Nav.Link>,
            ]) : ''}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
