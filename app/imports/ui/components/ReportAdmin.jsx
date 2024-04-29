import React from 'react';
import PropTypes from 'prop-types';
import { Card, ListGroup, Row, Col, Button, Form } from 'react-bootstrap';
import { Roles } from 'meteor/alanning:roles';
import swal from 'sweetalert';

const ReportAdmin = ({ report, collection, showControls }) => {

  const isAdmin = Roles.userIsInRole(Meteor.userId(), 'admin');
  const removeItem = (docID) => {
    collection.remove(docID);
  };

  const verifyReport = (newStatus) => {
    if (isAdmin) {
      collection.update(report._id, { $set: { verified: newStatus } }, (error) => {
        if (error) {
          swal('Error', error.message, 'error');
        } else {
          swal('Success', 'Verification status updated successfully', 'success');
        }
      });
    } else {
      swal('Error', 'Unauthorized access', 'error');
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Img variant="top" src={report.image} style={{ width: '60%' }} />
        <Card.Title>{report.pestName}</Card.Title>
      </Card.Header>
      <Row>
        <Col>
          <ListGroup className="list-group-flush">
            <ListGroup.Item><strong>Island:</strong> {report.island} </ListGroup.Item>
            <ListGroup.Item><strong>Location:</strong> {report.location}</ListGroup.Item>
            <ListGroup.Item><strong>Date Found:</strong> {report.date.toLocaleDateString()}</ListGroup.Item>
            <ListGroup.Item><strong>Reporter:</strong> {report.reporter}</ListGroup.Item>
            <ListGroup.Item>
              <strong>Verification Status:</strong> {report.verified}
            </ListGroup.Item>
            <ListGroup.Item><strong>Removed from Area:</strong> {report.removed}</ListGroup.Item>
          </ListGroup>
        </Col>
        <Col>
          <Row>
            <Card.Body>
              <Card.Text><strong>Description:</strong> {report.pestDescription}</Card.Text>
            </Card.Body>
          </Row>
          {showControls && (
            <Row className="mt-2">
              <Button variant="danger" onClick={() => removeItem(report._id)}>Delete</Button>
            </Row>
          )}
          {showControls && isAdmin && (
            <>
              <Card.Text><strong>Change Verification Status</strong></Card.Text>
              <Form.Select
                aria-label="Change Verification Status"
                onChange={(e) => verifyReport(e.target.value)}
                defaultValue={report.verified}
                className="mt-2"
              >
                <option value="Yes">Verified</option>
                <option value="No">Unverified</option>
              </Form.Select>
            </>
          )}
        </Col>
      </Row>
    </Card>
  );
};

// Require a document to be passed to this component.
ReportAdmin.propTypes = {
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
    _id: PropTypes.string,
  }).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  collection: PropTypes.object.isRequired,
  // eslint-disable-next-line react/require-default-props
  showControls: PropTypes.bool,
};

export default ReportAdmin;
