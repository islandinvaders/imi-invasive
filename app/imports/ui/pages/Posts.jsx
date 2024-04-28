import React, { useState } from 'react';
import { Col, Container, Row, Image, Button } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import Report from '../components/Report';
import DownloadButton from '../components/DownloadButton';
import { Profiles } from '../../api/profile/Profile';

const Posts = () => {
  // State to manage whether to show all reports or user-specific reports
  const [showAllReports, setShowAllReports] = useState(true);
  const currentUser = Meteor.user();
  const currentUserEmail = currentUser && currentUser.email;
  // useTracker connects Meteor data to React components.
  const { ready, reports, profile } = useTracker(() => {
    // Get access to Report documents.
    const reportsSubscription = Meteor.subscribe(Reports.userSpecificPosts);
    const profilesSubscription = Meteor.subscribe(Profiles.userPublicationName);
    // Determine if the subscription is ready
    const rdy = reportsSubscription.ready() && profilesSubscription.ready();
    console.log(rdy);
    // Get the Report documents based on the state
    const reportItems = showAllReports ? Reports.collection.find().fetch() : Reports.collection.find({ verified: 'Yes' });
    const userProfile = Profiles.collection.find({ email: currentUserEmail }).fetch();
    return {
      reports: reportItems,
      profile: userProfile,
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
            {console.log(profile)}
            {console.log(profile && profile.image)}
            {profile && profile.image ? <Image roundedCircle src={profile.image} /> : <Image roundedCircle src="https://m.media-amazon.com/images/I/812Onuail2L._AC_UF894,1000_QL80_.jpg" />}
          </Row>
          <Row className="d-flex justify-content-center align-items-center mt-4">
            <Button className="btn-posts" py={10} onClick={handleButtonClick}>{ showAllReports ? 'View All Posts' : 'View My Posts' }</Button>
          </Row>
          <Row className="d-flex justify-content-center align-items-center mt-2">
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
