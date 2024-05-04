import React from 'react';
import { Col, Container } from 'react-bootstrap';

/** The Footer appears at the bottom of every page. Rendered by the App Layout component. */
const Footer = () => (
  <footer className="mt-auto py-3 footer-color">
    <Container>
      <Col className="text-center">
        Island Invaders
        {' '}
        <br />
        Department of Information and Computer Sciences
        {' '}
        <br />
        University of Hawaii
        <br />
        Honolulu, HI 96822
        {' '}
        <br />
        <a href="https://islandinvaders.github.io/">
          <strong> &apos;Imi Invasive Home
            Page
          </strong>
        </a>
      </Col>
    </Container>
  </footer>
);

export default Footer;
