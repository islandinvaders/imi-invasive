import React, { useState } from 'react';
import { Col, Container, Row, Image, Button } from 'react-bootstrap';
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
    const subscription = Meteor.subscribe(Reports.adminAllPosts);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
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
      <Row className="align-middle text-center">
        <Col xs={4}>
          <Row className="d-flex justify-content-center align-items-center">
            <Image roundedCircle src="https://m.media-amazon.com/images/I/812Onuail2L._AC_UF894,1000_QL80_.jpg" />
          </Row>
          <Row className="d-flex justify-content-center align-items-center mt-4">
            <Button className="btn-posts" py={10} onClick={handleButtonClick}>{ showAllReports ? 'View Unverified Posts' : 'View All Posts' }</Button>
          </Row>
          <Row className="d-flex justify-content-center align-items-center mt-2">
            <DownloadButton />
          </Row>
        </Col>

        <Col xs={8} className="d-flex flex-column justify-content-center">
          <Row className="justify-content-center">
            <Col className="text-center">
              <h2>Posts Admin</h2>
            </Col>
          </Row>
          {reports.map((report) => (<Row className="py-4" key={report._id}><ReportAdmin report={report} collection={Reports.collection} showControls={!showAllReports} /></Row>))}
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />);
};
export default PostsAdmin;
