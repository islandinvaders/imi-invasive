import React, { useState } from 'react';
import { Col, Container, Row, Image, DropdownButton, ButtonGroup, Dropdown, Button } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import Report from '../components/Report';
import DownloadButton from '../components/DownloadButton';

const Posts = () => {
  const setShowAllReports = true;
  let showAllReports = useState(true);

  // useTracker connects Meteor data to React components.
  const { ready, reports } = useTracker(() => {
    // Get access to Report documents.
    const subscription = Meteor.subscribe(Reports.userVerifiedPosts);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the Report documents
    let reportItems = Reports.collection.find();
    if (showAllReports) {
      reportItems = Reports.userSpecificPosts;
    }
    return {
      reports: reportItems,
      ready: rdy,
    };
  }, [showAllReports]);

  const handleButtonClick = () => {
    setShowAllReports(showAllReports = !showAllReports);
  };

  return (ready ? (
    <Container className="py-3">
      <Row className="align-middle text-center">
        <Col xs={4}>
          <Row className="d-flex justify-content-center align-items-center">
            <Image roundedCircle src="https://m.media-amazon.com/images/I/812Onuail2L._AC_UF894,1000_QL80_.jpg" />
          </Row>
          <Row className="d-flex justify-content-center align-items-center">
            <ButtonGroup vertical style={{ width: '150px' }}>
              <DropdownButton
                as={ButtonGroup}
                title="My Posts"
                id="bg-vertical-dropdown-1"
              >
                <Dropdown.Item onClick={handleButtonClick()}>View All</Dropdown.Item>
                <Dropdown.Item>Delete</Dropdown.Item>
                <Dropdown.Item>Edit</Dropdown.Item>
              </DropdownButton>
              <Button>Everyone Else</Button>
            </ButtonGroup>
            <DownloadButton />
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
