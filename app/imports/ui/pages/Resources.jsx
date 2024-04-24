import React, { useState } from 'react';
import { Col, Container, Row, Form } from 'react-bootstrap';
import { Search, Filter } from 'react-bootstrap-icons';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import Resource from '../components/Resource';
import { References } from '../../api/reference/Reference';

const Resources = () => {
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
    <Container id="resources" className="py-3">
      <Row className="justify-content-center">
        <Col className="text-center">
          <h2>Invasive Species List</h2>
          <p>Discover list of references documenting invasive species present in the Hawaiian Islands ecosystem</p>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form onSubmit={(e) => e.preventDefault()} className="d-flex align-items-center justify-content-end">
            <Search className="m-1" size="20" />
            <Form.Control
              id="resources-search"
              type="text"
              placeholder="Search by pest name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-sm"
              style={{ width: '200px', marginRight: '10px' }}
            />
            <Filter className="m-1" size="25" />
            <Form.Select id="resources-filter" value={selectedType} onChange={handleTypeChange} className="input-sm" style={{ width: '100px' }}>
              <option id="resources-filter-select-one" value="">Select One</option>
              <option id="resources-filter-plant" value="Plant">Plant</option>
              <option id="resources-filter-animal" value="Animal">Animal</option>
              <option id="resources-filter-bug" value="Bug">Bug</option>
              <option id="resources-filter-microbe" value="Microbe">Microbe</option>
              <option id="resources-filter-fungus" value="Fungus">Fungus</option>
            </Form.Select>
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
    </Container>
  );
};

export default Resources;
