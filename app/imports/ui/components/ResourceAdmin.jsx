import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardFooter, Col, Image, Row, Button } from 'react-bootstrap';

/** Renders resources */
const Resource = ({ resource, collection }) => {
  const removeItem = (docID) => {
    collection.remove(docID);
  };
  return (
    <Card className="h-100">
      <Card.Header>
        <Row>
          <Col>
            <Card.Title>{resource.pestName}</Card.Title>
            <Card.Subtitle>
              {resource.sciName}
            </Card.Subtitle>
          </Col>
          <Col className="text-end m-2">
            <Button id="resource-admin-delete" variant="danger" onClick={() => removeItem(resource._id)}>Delete</Button>
          </Col>
        </Row>
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
};

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
  // eslint-disable-next-line react/forbid-prop-types
  collection: PropTypes.object.isRequired,
};
export default Resource;
