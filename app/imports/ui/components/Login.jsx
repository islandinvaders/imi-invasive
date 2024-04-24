import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { NavLink } from 'react-router-dom';
import { Nav, NavDropdown } from 'react-bootstrap';
import { BoxArrowRight, PersonFill, PersonPlusFill } from 'react-bootstrap-icons';
import '/client/style.css';

const Login = () => {
  const { currentUser } = useTracker(() => ({
    currentUser: Meteor.user() ? Meteor.user().username : '',
  }), []);

  return (
    <Nav className="custom-login-dropdown">
      {currentUser === '' ? (
        <NavDropdown className="custom-login-dropdown" title="Login">
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
        <NavDropdown className="custom-login-dropdown" id="navbar-current-user" title={currentUser}>
          <NavDropdown.Item as={NavLink} to="/signout">
            <BoxArrowRight />
            Sign out
          </NavDropdown.Item>
        </NavDropdown>
      )}
    </Nav>
  );
};

export default Login;
