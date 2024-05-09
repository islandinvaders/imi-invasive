import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { NavLink } from 'react-router-dom';
import { Nav, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, PersonFill } from 'react-bootstrap-icons';
import '/client/style.css';
import { Roles } from 'meteor/alanning:roles';

const Login = () => {
  const { currentUser, isAdmin } = useTracker(() => ({
    currentUser: Meteor.user() ? Meteor.user().username : '',
    isAdmin: Meteor.userId() && Roles.userIsInRole(Meteor.userId(), 'admin'),
  }), []);

  return (
    <Nav className="custom-login-dropdown">
      {currentUser === '' ? (
        <NavDropdown id="login-dropdown" className="custom-login-dropdown" title="Login">
          <NavDropdown.Item id="login-dropdown-sign-in" as={NavLink} to="/signin">
            <PersonFill />
            Sign in
          </NavDropdown.Item>
          <NavDropdown.Item id="login-dropdown-sign-up" as={NavLink} to="/signup">
            <PersonFill />
            Sign up
          </NavDropdown.Item>
        </NavDropdown>
      ) : null}

      {currentUser !== '' && isAdmin && (
        <NavDropdown className="custom-login-dropdown" id="login-current-user" title={currentUser}>
          <NavDropdown.Item id="login-edit-profile" as={NavLink} to="/edit-profile-admin">
            Edit Profile
          </NavDropdown.Item>
          <NavDropdown.Item id="login-list-profiles" as={NavLink} to="/list-profile-admin">
            View All Profiles
          </NavDropdown.Item>
          <NavDropdown.Item id="login-sign-out" as={NavLink} to="/signout">
            <BoxArrowRight />
            Sign out
          </NavDropdown.Item>
        </NavDropdown>
      )}

      {currentUser !== '' && !isAdmin && (
        <NavDropdown className="custom-login-dropdown" id="login-current-user" title={currentUser}>
          <NavDropdown.Item id="login-edit-profile" as={NavLink} to="/edit-profile">
            Edit Profile
          </NavDropdown.Item>
          <NavDropdown.Item id="login-list-profiles" as={NavLink} to="/list-profile">
            View All Profiles
          </NavDropdown.Item>
          <NavDropdown.Item id="login-sign-out" as={NavLink} to="/signout">
            <BoxArrowRight />
            Sign out
          </NavDropdown.Item>
        </NavDropdown>
      )}
    </Nav>
  );
};

export default Login;
