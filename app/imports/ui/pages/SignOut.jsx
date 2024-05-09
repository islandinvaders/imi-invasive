import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Image } from 'react-bootstrap';

/* After the user clicks the "SignOut" link in the NavBar, log them out and display this page. */
const SignOut = () => {
  Meteor.logout();
  return (
    <div id="signout-page" style={{ width: '100%', height: '60vh', position: 'relative', overflow: 'hidden' }}>
      <Image fluid src="https://us.images.westend61.de/0000981911pw/green-forest-maui-hawaii-ISF09799.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div className="position-absolute top-50 start-50 translate-middle text-center" style={{ zIndex: 1 }}>
        <h2 style={{ color: 'white', fontWeight: 'bold' }}>You are signed out.</h2>
      </div>
    </div>
  );
};

export default SignOut;
