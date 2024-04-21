import React from 'react';
import { Col, Container, Row, Image, ButtonGroup, DropdownButton, Dropdown, Button } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import Report from '../components/Report';
import DownloadButton from '../components/DownloadButton';

const Posts = () => {
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { ready, reports } = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    // Get access to Stuff documents.
    const subscription = Meteor.subscribe(Reports.userVerifiedPosts);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the Report documents
    const reportItems = Reports.collection.find({}).fetch();
    return {
      reports: reportItems,
      ready: rdy,
    };
  }, []);

  return (ready ? (
    <Container className="py-3">
      <Row className="align-middle text-center">
        <Col xs={4}>
          <Row className="d-flex justify-content-center align-items-center">
            <Image roundedCircle src="https://m.media-amazon.com/images/I/812Onuail2L._AC_UF894,1000_QL80_.jpg" />
          </Row>
          <Row className="d-flex justify-content-center align-items-center">
            <ButtonGroup vertical style={{ width: '150px' }}> {/* Set a fixed width for the button group */}
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
              <DownloadButton />
            </ButtonGroup>
          </Row>
        </Col>

        <Col xs={8} className="d-flex flex-column justify-content-center">
          <Row className="justify-content-center">
            <Col className="text-center">
              <h2>Posts </h2>
            </Col>
          </Row>
          {reports.map((report) => (<Row className="py-4" key={report._id}><Report report={report} /></Row>))}
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />);
};
export default Posts;
