import React from 'react';
import { Col, Container, Image, Row, Button, ButtonGroup, DropdownButton, Dropdown, Card, ListGroup } from 'react-bootstrap';

/* A simple static component to render some text for the landing page. */
const Posts = () => (
  <Container fluid className="py-3">
    <Row className="align-middle text-center">
      <Col xs={4}>
        <Row className="d-flex justify-content-center align-items-center">
          <Image roundedCircle src="https://m.media-amazon.com/images/I/812Onuail2L._AC_UF894,1000_QL80_.jpg" id="profile-pic" />
        </Row>
        <Row className="d-flex justify-content-center align-items-center">
          <ButtonGroup vertical style={{ width: '150px' }}>
            <DropdownButton
              as={ButtonGroup}
              title="My Posts"
              id="bg-vertical-dropdown-1"
            >
              <Dropdown.Item eventKey="1">View All</Dropdown.Item>
              <Dropdown.Item eventKey="2">Delete</Dropdown.Item>
              <Dropdown.Item eventKey="3">Edit</Dropdown.Item>
            </DropdownButton>
            <Button>Everyone Else</Button>
          </ButtonGroup>
        </Row>
      </Col>

      <Col xs={8} className="d-flex flex-column justify-content-center">
        <h1>POSTS</h1>
        <Col className="d-flex justify-content-center align-items-center">
          <Card style={{ width: '50rem' }}>
            <Card.Img variant="top" src="https://allthatsinteresting.com/wordpress/wp-content/uploads/2022/06/angry-mongoose.jpg" />
            <Card.Body>
              <Card.Title>Pest Name: Name of pest user reports</Card.Title>
              <Card.Text>
                Pest Description: Short description of what the poster saw/experienced
              </Card.Text>
            </Card.Body>
            <ListGroup className="list-group-flush">
              <ListGroup.Item>Island: what island pest was found on</ListGroup.Item>
              <ListGroup.Item>Location: where found</ListGroup.Item>
              <ListGroup.Item>Date: when found</ListGroup.Item>
              <ListGroup.Item>Reporter: username of who reported</ListGroup.Item>
              <ListGroup.Item>Verified: verification of the post</ListGroup.Item>
              <ListGroup.Item>Removed: if anyone has removed it from the area</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
      </Col>

    </Row>
  </Container>
);

export default Posts;
