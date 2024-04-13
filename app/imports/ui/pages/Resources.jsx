import React, { useState } from 'react';
import { Col, Container, Row, Form } from 'react-bootstrap';
import { Search } from 'react-bootstrap-icons';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Resource from '../components/Resource';
import { References } from '../../api/reference/Reference';

const Resources = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const references = useTracker(() => {
    const subscription = Meteor.subscribe(References.userPublicationName);

    if (!subscription.ready()) {
      return [];
    }

    let referenceItems = [];
    if (searchQuery.trim() === '') {
      referenceItems = References.collection.find({}).fetch();
    } else {
      referenceItems = References.collection.find({
        pestName: { $regex: searchQuery.trim(), $options: 'i' },
      }).fetch();
    }

    return referenceItems;
  }, [searchQuery]);

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col className="text-center">
          <h2>Resources</h2>
        </Col>
        <Row>
          <Col>
            <Form onSubmit={(e) => e.preventDefault()} className="d-flex align-items-center justify-content-end">
              <Search className="m-1" size="20" />
              <Form.Control
                type="text"
                placeholder="Search by pest name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-sm"
                style={{ width: '200px', marginRight: '10px' }}
              />
            </Form>
          </Col>
        </Row>
        <Row xl={1} className="g-2">
          {references.map((reference) => (
            <Col className="m-3" key={reference._id}>
              <Resource resource={reference} />
            </Col>
          ))}
        </Row>
      </Row>
    </Container>
  );
};

export default Resources;
