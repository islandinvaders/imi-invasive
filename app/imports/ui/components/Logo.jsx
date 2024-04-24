import React from 'react';
import { NavLink } from 'react-router-dom';
import { Navbar } from 'react-bootstrap';
import '/client/style.css';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Logo = () => (
  <Navbar.Brand as={NavLink} to="/" className="d-flex justify-content-center w-100 logo-container">
    <img
      alt="logo"
      src="/images/logo.png"
      className="d-inline-block align-top logo-image"
    />
  </Navbar.Brand>
);

export default Logo;
