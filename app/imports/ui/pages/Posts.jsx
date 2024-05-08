import React, { useState } from 'react';
import { Col, Container, Row, Button } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import Report from '../components/Report';
import DownloadButton from '../components/DownloadButton';

const Posts = () => {
  // State to manage whether to show all reports or user-specific reports
  const [showAllReports, setShowAllReports] = useState(true);

  // useTracker connects Meteor data to React components.
  const { ready, reports } = useTracker(() => {
    // Get access to Report documents.
    const reportsSubscription = Meteor.subscribe(Reports.userSpecificPosts);
    // Determine if the subscription is ready
    const rdy = reportsSubscription.ready();
    // Get the Report documents based on the state
    const reportItems = showAllReports ? Reports.collection.find().fetch() : Reports.collection.find({ reporter: Meteor.user()?.username }).fetch();
    return {
      reports: reportItems,
      ready: rdy,
    };
  }, [showAllReports]);

  // Function to handle button click to toggle between showing all reports and user-specific reports
  const handleButtonClick = () => {
    setShowAllReports(prevState => !prevState);
  };

  return (ready ? (
    <Container className="py-3">
      <Row className="align-middle text-center">
        <Col xs={4} className="pt-4">
          <Row className="d-flex justify-content-center align-items-center mt-4">
            <Button id="view-my-posts" className="btn-posts" py={10} onClick={handleButtonClick}>{ showAllReports ? 'View My Posts' : 'View All Posts' }</Button>
          </Row>
          <Row className="d-flex justify-content-center align-items-center mt-2">
            <DownloadButton id="download-csv" />
          </Row>
        </Col>

        <Col xs={8} className="d-flex flex-column justify-content-center">
          <Row className="justify-content-center">
            <Col className="text-center">
              <h2>Posts </h2>
            </Col>
          </Row>
          {reports.map((report) => (<Row className="py-4" key={report._id}><Report report={report} collection={Reports.collection} showControls={!showAllReports} /></Row>))}
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />);
};
export default Posts;
