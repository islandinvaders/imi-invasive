import React from 'react';
import { Col, Container, Row, Form } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import LoadingSpinner from '../components/LoadingSpinner';
import Resource from '../components/Resource';
import { References } from '../../api/reference/Reference';

const Resources = () => {
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { ready, references } = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    // Get access to Stuff documents.
    const subscription = Meteor.subscribe(References.userPublicationName);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the References documents
    const referenceItems = References.collection.find({}).fetch();
    return {
      references: referenceItems,
      ready: rdy,
    };
  }, []);
  return (ready ? (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col>
          <Col>
            <h2 className="text-center">Resources</h2>
          </Col>
          <Col>
            <Form className="d-flex justfity-content-end m-1">
              <Search size={20} className="mt-2 mr-2 m-1" />
              <Form.Control
                type="text"
                placeholder="Search by name"
                className="input-sm justfity-content-end"
                style={{ width: '150px' }} // Adjust the width here
              />
            </Form>
          </Col>
          <Row xl={1} classname="g-4">
            {references.map((reference) => (<Col className="m-3" key={reference._id}><Resource resource={reference} /></Col>))}
          </Row>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />);
};

export default Resources;
