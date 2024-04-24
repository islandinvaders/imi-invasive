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
          <Nav className="me-auto justify-content-start">
            {currentUser && !Roles.userIsInRole(Meteor.userId(), 'admin') ? ([ // User Navbar
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/profile" key="profile">Profile</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/about" key="about">About Us</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/posts" key="posts">Posts</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/add" key="posts">File Report</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/resources" key="resources">Invasive List</Nav.Link>,
            ]) : ''}
            {Roles.userIsInRole(Meteor.userId(), 'admin') ? ([ // Admin Navbar
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/profile" key="profile">Profile</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/about" key="about">About Us</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/postsadmin" key="posts">Posts Admin</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/add" key="posts">File Report</Nav.Link>,
              <Nav.Link id="list-stuff-nav" as={NavLink} to="/resourcesadmin" key="resources">Invasive List Admin</Nav.Link>,
            ]) : ''}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
