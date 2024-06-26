import React, { useState } from 'react';
import { Col, Container, Row, Button } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import DownloadButton from '../components/DownloadButton';
import ReportAdmin from '../components/ReportAdmin';

const PostsAdmin = () => {
  // State to manage whether to show all reports or user-specific reports
  const [showAllReports, setShowAllReports] = useState(true);

  // useTracker connects Meteor data to React components.
  const { ready, reports } = useTracker(() => {
    // Get access to Report documents.
    const reportsSubscription = Meteor.subscribe(Reports.adminAllPosts);
    // Determine if the subscription is ready
    const rdy = reportsSubscription.ready();
    // Get the Report documents based on the state
    const reportItems = showAllReports ? Reports.collection.find().fetch() : Reports.collection.find({ verified: 'No' });
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
      <Row className="text-center pb-4">
        <h2>Posts Admin</h2>
      </Row>
      <Row className="pb-2">
        <Col className="d-flex justify-content-center">
          <Button id="posts-admin-verified-button" className="btn-posts mx-2" py={10} onClick={handleButtonClick}>{ showAllReports ? 'View Unverified Posts' : 'View All Posts' }</Button>
          <DownloadButton />
        </Col>
      </Row>
      <Row>
        {reports.map((report, index) => (
          <Col key={index} xs={6} className="py-4">
            <ReportAdmin report={report} collection={Reports.collection} showControls={!showAllReports} />
          </Col>
        ))}
      </Row>
    </Container>
  ) : <LoadingSpinner />);
};

export default PostsAdmin;
