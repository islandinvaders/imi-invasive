import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';

/* A simple static component to render some text for the landing page. */
const Landing = () => (
  <Container id="landing-page" fluid className="d-flex justify-content-start">
    <Row className="align-middle text-center">
      <Col className="d-flex flex-column justify-content-center">
        <div className="image-overlay d-flex justify-content-start">
          <h1>ALOHA MAI KĀKOU!</h1>
        </div>
        <p />
        <h2>`Imi means “search” in ʻŌlelo Hawaiʻi</h2>
        <p> </p>
        <p className="px-5">Invasive species pose a significant threat to local ecosystems, causing ecological imbalances or even extinction.
          However, monitoring and tracking these invasive species across the Hawaiian islands can be a daunting and resource-expensive
          task, making research difficult to complete.
        </p>
        <p className="px-5">‘Imi Invasive aims to address invasive species management challenges by
          establishing a citizen science initiative to bring the community together and educate people on invasive species, raising
          awareness and empowering the community and professionals to be able to better track the harmful species and care for the
          ecosystem. It should serve as an educational resource and also a centralized app for people to report and help manage invasive
          species across the Hawaiian Islands.
        </p>
      </Col>
    </Row>
  </Container>
);

export default Landing;
