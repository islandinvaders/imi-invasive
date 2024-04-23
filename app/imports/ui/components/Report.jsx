import React from 'react';
import PropTypes from 'prop-types';
import { Card, ListGroup } from 'react-bootstrap';

const Report = ({ report }) => (
  <Card>
    <Card.Header>
      <Card.Img variant="top" src={report.image} />
      <Card.Title>{report.pestName}</Card.Title>
    </Card.Header>
    <Card.Body>
      <Card.Text>Description: {report.pestDescription}</Card.Text>
    </Card.Body>
    <ListGroup className="list-group-flush">
      <ListGroup.Item>Island: {report.island} </ListGroup.Item>
      <ListGroup.Item>Location: {report.location}</ListGroup.Item>
      <ListGroup.Item>Date Found: {report.date.toLocaleDateString()}</ListGroup.Item>
      <ListGroup.Item>Reporter: {report.reporter}</ListGroup.Item>
      <ListGroup.Item>Verification Status: {report.verified}</ListGroup.Item>
      <ListGroup.Item>Removed from Area: {report.removed}</ListGroup.Item>
    </ListGroup>
  </Card>
);

// Require a document to be passed to this component.
Report.propTypes = {
  report: PropTypes.shape({
    image: PropTypes.string,
    pestName: PropTypes.string,
    pestDescription: PropTypes.string,
    island: PropTypes.string,
    location: PropTypes.string,
    date: PropTypes.instanceOf(Date),
    reporter: PropTypes.string,
    verified: PropTypes.string,
    removed: PropTypes.string,
    // _id: PropTypes.string,
  }).isRequired,
};

export default Report;
