import React, { useState } from 'react';
import { Col, Container, Row, Form, Button } from 'react-bootstrap';
import { Search, Filter } from 'react-bootstrap-icons';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import ResourceAdmin from '../components/ResourceAdmin';
import { References } from '../../api/reference/Reference';

const ResourcesAdmin = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');

  const references = useTracker(() => {
    const subscription = Meteor.subscribe(References.userPublicationName);

    if (!subscription.ready()) {
      return [];
    }

    let query = {};
    if (searchQuery.trim() !== '') {
      query = {
        ...query,
        pestName: { $regex: searchQuery.trim(), $options: 'i' },
      };
    }
    if (selectedType !== '') {
      query = {
        ...query,
        pestType: selectedType,
      };
    }

    const referenceItems = References.collection.find(query).fetch();
    return referenceItems;
  }, [searchQuery, selectedType]);

  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col className="text-center">
          <h2>Invasive Species List Admin</h2>
          <p>Discover list of references documenting invasive species present in the Hawaiian Islands ecosystem</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Button style={{ marginLeft: '15px' }}>Add Reference</Button>
        </Col>
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
            <Filter className="m-1" size="25" />
            <Form.Select value={selectedType} onChange={handleTypeChange} className="input-sm" style={{ width: '100px' }}>
              <option value="">Select One</option>
              <option value="Plant">Plant</option>
              <option value="Animal">Animal</option>
              <option value="Bug">Bug</option>
              <option value="Microbe">Microbe</option>
              <option value="Fungus">Fungus</option>
            </Form.Select>
          </Form>
        </Col>
      </Row>
      <Row xl={1} className="g-2">
        {references.map((reference) => (
          <Col className="m-3" key={reference._id}>
            <ResourceAdmin resource={reference} collection={References.collection} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ResourcesAdmin;
