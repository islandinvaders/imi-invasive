import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import Report from '../components/Report';

const Posts = () => {
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { ready, reports } = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    // Get access to Stuff documents.
    const subscription = Meteor.subscribe(Reports.userPublicationName);
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
      <Row className="justify-content-center">
        <Col className="text-center">
          <h2>Posts </h2>
        </Col>
      </Row>
      {reports.map((report) => (<Row className="py-4" key={report._id}><Report report={report} /></Row>))}
    </Container>
  ) : <LoadingSpinner />);
};
export default Posts;
