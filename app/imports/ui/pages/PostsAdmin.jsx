import React, { useState } from 'react';
import { Col, Container, Row, Image, Button } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import DownloadButton from '../components/DownloadButton';
import ReportAdmin from '../components/ReportAdmin';
import { Profiles } from '../../api/profile/Profile';

const PostsAdmin = () => {
  // State to manage whether to show all reports or user-specific reports
  const [showAllReports, setShowAllReports] = useState(true);
  const currentUser = Meteor.user();
  const currentUserEmail = currentUser && currentUser.email;

  // useTracker connects Meteor data to React components.
  const { ready, reports, profile } = useTracker(() => {
    // Get access to Report documents.
    const reportsSubscription = Meteor.subscribe(Reports.adminAllPosts);
    const profilesSubscription = Meteor.subscribe(Profiles.userPublicationName);
    // Determine if the subscription is ready
    const rdy = reportsSubscription.ready() && profilesSubscription.ready();
    // Get the Report documents based on the state
    const reportItems = showAllReports ? Reports.collection.find().fetch() : Reports.collection.find({ verified: 'No' });
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
        <Col xs={4} className="pt-4">
          <Row className="d-flex justify-content-center align-items-center">
            {console.log(profile)}
            {console.log(profile && profile.image)}
            {profile && profile.image ? <Image className="img-posts p-0" src={profile.image} /> : <Image className="img-posts p-0" src="https://pbs.twimg.com/profile_images/1507872748789706753/9wGjDEuR_400x400.jpg" />}
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
