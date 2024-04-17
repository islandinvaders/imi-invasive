import React from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { Reports } from '../../api/report/Report';
import LoadingSpinner from '../components/LoadingSpinner';
import Report from '../components/Report';

const reports = [
  { image: 'https://i.pinimg.com/originals/f1/4d/74/f14d74fccd5698545d2b5b02bad55790.jpg',
    pestName: 'Mongoose',
    pestDescription: 'Small, tan, furry animal with 4 legs, a long body, and a long tail',
    island: 'Oahu',
    location: 'University of Hawaii Campus Center',
    date: '2024-01-01',
    reporter: 'john@foo.com',
    verified: 'Yes',
    removed: 'No',
  },
  { image: 'https://birding.ninja/wp-content/uploads/2014/12/hawaii14.jpg',
    pestName: 'Red Whiskered Bulbul',
    pestDescription: 'Small, tan, furry animal with 4 legs, a long body, and a long tail',
    island: 'Oahu',
    location: 'Manoa Valley District Park',
    date: '2024-01-01',
    reporter: 'john@foo.com',
    verified: 'Yes',
    removed: 'No',
  },
  { image: 'https://i0.wp.com/www.oahuisc.org/wp-content/uploads/Tibher-Flower-Head-with-raindrops.jpg?fit=601%2C800&ssl=1',
    pestName: 'Cane Tibouchina',
    pestDescription: 'Tall upright weed plant with sharper leaf structure. Has small purple pedal flowers, with yellow antlers',
    island: 'Oahu',
    location: 'Along the Manoa Falls hike',
    date: '2024-01-01',
    reporter: 'john@foo.com',
    verified: 'Yes',
    removed: 'No',
  },
];

const Posts = () => {
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { ready } = useTracker(() => {
    // Note that this subscription will get cleaned up
    // when your component is unmounted or deps change.
    // Get access to Stuff documents.
    const subscription = Meteor.subscribe(Reports.userPublicationName);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the Stuff documents
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
      {reports.map((report, index) => (<Row className="py-4" key={index}><Report report={report} /></Row>))}
    </Container>
  ) : <LoadingSpinner />);
};
export default Posts;
