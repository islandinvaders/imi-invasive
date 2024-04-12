import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardFooter, Col, Image, Row } from 'react-bootstrap';

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const Resource = ({ resource }) => (
  <Card className="h-100">
    <Card.Header>
      <Col>
        <Card.Title>{resource.pestName}</Card.Title>
        <Card.Subtitle>
          {resource.sciName}
        </Card.Subtitle>
      </Col>
    </Card.Header>
    <CardBody>
      <Row>
        <Col>
          <Card.Text><strong>Risk:</strong> {resource.risk}</Card.Text>
          <Card.Text><strong>Reg Status:</strong> {resource.regStatus}</Card.Text>
          <Card.Text><strong>Pest Type:</strong> {resource.pestType}</Card.Text>
          <Card.Text><strong>Description:</strong> {resource.description}</Card.Text>
          <Card.Text><strong>Impact:</strong> {resource.impact}</Card.Text>
          <Card.Text><strong>Distribution:</strong> {resource.distribution}</Card.Text>
        </Col>
        <Col className="text-end"><Image src={resource.image} width={300} /></Col>
      </Row>
    </CardBody>
    <CardFooter>
      <Card.Text><strong>Lookalike:</strong> {resource.lookalike}</Card.Text>
    </CardFooter>
  </Card>
);

// Require a document to be passed to this component.
Resource.propTypes = {
  resource: PropTypes.shape({
    image: PropTypes.string,
    pestName: PropTypes.string,
    sciName: PropTypes.string,
    risk: PropTypes.string,
    regStatus: PropTypes.string,
    pestType: {
      type: PropTypes.string,
      allowedValues: ['Plant', 'Animal', 'Bug', 'Microbe', 'Fungus'],
    },
    description: PropTypes.string,
    impact: PropTypes.string,
    distribution: PropTypes.string,
    lookalike: PropTypes.string,
    _id: PropTypes.string,
  }).isRequired,
};
export default Resource;
