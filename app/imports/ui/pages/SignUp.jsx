import React, { useState } from 'react';
import swal from 'sweetalert';
import PropTypes from 'prop-types';
import { Link, Navigate } from 'react-router-dom';
import { Accounts } from 'meteor/accounts-base';
import { Alert, Card, Col, Container, Row } from 'react-bootstrap';
import SimpleSchema from 'simpl-schema';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import { AutoForm, ErrorsField, LongTextField, SubmitField, TextField } from 'uniforms-bootstrap5';
import { Profiles } from '../../api/profile/Profile';

/**
 * SignUp component is similar to signin component, but we create a new user instead.
 */
const SignUp = ({ location }) => {
  const [error, setError] = useState('');
  const [redirectToReferer, setRedirectToRef] = useState(false);

  const schema = new SimpleSchema({
    email: String,
    password: String,
    firstName: String,
    lastName: String,
    bio: {
      type: String,
      optional: true,
    },
    interests: {
      type: String,
      optional: true,
    },
  });
  const bridge = new SimpleSchema2Bridge(schema);

  /* Handle SignUp submission. Create user account and a profile entry, then redirect to the home page. */
  const submit = (doc) => {
    const { email, password, firstName, lastName, bio, interests } = doc;
    Accounts.createUser({ email, username: email, password }, (err) => {
      if (err) {
        setError(err.reason);
      } else {
        setError('');
        setRedirectToRef(true);
      }
    });
    Profiles.collection.insert({ firstName, lastName, bio, interests, email }, (err) => {
      if (err) {
        // Show an error message if the insert fails
        swal('Error', err.message, 'error');
      }
    });
  };

  /* Display the signup form. Redirect to add page after successful registration and login. */
  const { from } = location?.state || { from: { pathname: '/' } };
  // if correct authentication, redirect to from: page instead of signup screen
  if (redirectToReferer) {
    return <Navigate to={from} />;
  }
  return (
    <Container id="signup-page" className="py-3">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center">
            <h2>Register your account</h2>
          </Col>
          <AutoForm schema={bridge} onSubmit={data => submit(data)}>
            <Card>
              <Card.Body>
                <TextField id="signup-form-email" name="email" placeholder="E-mail address" />
                <TextField id="signup-form-password" name="password" placeholder="Password" type="password" />
                <TextField id="signup-form-firstname" name="firstName" placeholder="First Name" />
                <TextField id="signup-form-lastname" name="lastName" placeholder="Last Name" />
                <LongTextField name="bio" placeholder="Bio" />
                <TextField name="interests" placeholder="Interests" />
                <ErrorsField />
                <SubmitField id="signup-form-submit" />
              </Card.Body>
            </Card>
          </AutoForm>
          <Alert variant="light">
            Already have an account? Login
            {' '}
            <Link to="/signin">here</Link>
          </Alert>
          {error === '' ? (
            ''
          ) : (
            <Alert variant="danger">
              <Alert.Heading>Registration was not successful</Alert.Heading>
              {error}
            </Alert>
          )}
        </Col>
      </Row>
      <Row className="justify-content-center"> {/* Add a new row for the image */}
        <Col xs={5} className="text-center"> {/* Center the column for the image */}
          <img
            alt="Join our 'Imi Invasive 'Ohana!"
            src="/images/join.png"
            className="img-fluid align-top signup-image"
          />
        </Col>
      </Row>
    </Container>
  );
};

/* Ensure that the React Router location object is available in case we need to redirect. */
SignUp.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.string,
  }),
};

SignUp.defaultProps = {
  location: { state: '' },
};

export default SignUp;
