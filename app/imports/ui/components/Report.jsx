import React from 'react';
import PropTypes from 'prop-types';
import { Card, Image, ListGroup } from 'react-bootstrap';

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const Report = ({ report }) => (
  <Card>
    <Card.Header>
      <Card.Img variant="top" src={report.image} />
      <Card.Title>{report.pestName}</Card.Title>
    </Card.Header>
    <Card.Body>
      <Card.Text>{report.pestDescription}</Card.Text>
    </Card.Body>
    <ListGroup className="list-group-flush">
      <ListGroup.Item>{report.island} </ListGroup.Item>
      <ListGroup.Item>{report.location}</ListGroup.Item>
      <ListGroup.Item>{report.date.toLocaleDateString()}</ListGroup.Item>
      <ListGroup.Item>{report.reporter}</ListGroup.Item>
      <ListGroup.Item>{report.verified}</ListGroup.Item>
      <ListGroup.Item>{report.removed}</ListGroup.Item>
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
