import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import CarouselImages from '../components/Carousel';

const Landing = () => (
  <>
    <CarouselImages />
    <Container fluid id="landing-page">
      <h1 className="accent-green py-5">`Imi means “search” in ʻŌlelo Hawaiʻi</h1>
      <Row>
        <Col>
          <img
            alt="collage"
            src="/images/collage.png"
            className="img-fluid d-inline-block align-top landing-collage"
          />
        </Col>
        <Col>
          <h2 className="landing-header">
            Help us ʻimi invasive species!
          </h2>
          <p className="landing-description">Invasive species pose a significant threat to local ecosystems, causing ecological imbalances or even extinction.
            However, monitoring and tracking these invasive species across the Hawaiian islands can be a daunting and resource-expensive
            task, making research difficult to complete.
          </p>
          <p className="landing-description">‘Imi Invasive aims to address invasive species management challenges by
            establishing a citizen science initiative to bring the community together and educate people on invasive species, raising
            awareness and empowering the community and professionals to be able to better track the harmful species and care for the
            ecosystem. It should serve as an educational resource and also a centralized app for people to report and help manage invasive
            species across the Hawaiian Islands.
          </p>
        </Col>
      </Row>
    </Container>
  </>
);

export default Landing;

// Just a recap. This might help with formatting, but if it doesn't I have another idea for that too.
/**
 * <>
 *  Row
 *    Carousel
 *  /Row
 *
 * Container
 *  Row
 *    header text (not in a column)
 *    Col 1
 *      image collage
 *    /Col
 *
 *    Col 2
 *      text
 *    /Col
 * /Container
 * </>
 */