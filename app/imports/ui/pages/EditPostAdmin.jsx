import React from 'react';
import swal from 'sweetalert';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { AutoForm, ErrorsField, HiddenField, LongTextField, SelectField, SubmitField, TextField } from 'uniforms-bootstrap5';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import { useParams } from 'react-router';
import LoadingSpinner from '../components/LoadingSpinner';
import { Reports } from '../../api/report/Report';

const bridge = new SimpleSchema2Bridge(Reports.schema);
const EditPostAdmin = () => {
  // Get the documentID from the URL field. See imports/ui/layouts/App.jsx for the route containing :_id.
  const { _id } = useParams();
  // console.log('EditReport', _id);
  // useTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
  const { doc, ready } = useTracker(() => {
    const subscription = Meteor.subscribe(Reports.adminUnverifiedPosts);
    // Determine if the subscription is ready
    const rdy = subscription.ready();
    // Get the document
    const document = Reports.collection.findOne(_id);
    return {
      doc: document,
      ready: rdy,
    };
  }, [_id]);
  // console.log('EditReport', doc, ready);
  // On successful submit, insert the data.
  const submit = (data) => {
    const { image, pestName, pestDescription, island, location, verified, removed } = data;
    Reports.collection.update(_id, { $set: { image, pestName, pestDescription, island, location, verified, removed } }, (error) => {
      if (error) {
        swal('Error', error.message, 'error');
      } else {
        swal('Success', 'Item added successfully', 'success');
        // Close the SweetAlert dialog after 2 seconds
        setTimeout(() => {
          swal.close(); // Close the SweetAlert dialog
        }, 2000); // Adjust the delay as needed
      }
    });
  };

  return ready ? (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center"><h2>Edit Reports Admin</h2></Col>
          <AutoForm schema={bridge} onSubmit={data => submit(data)} model={doc}>
            <Card>
              <Card.Body>
                <Row>
                  <TextField id="edit-report-image" name="image" />
                </Row>
                <Row>
                  <Col>
                    <TextField id="edit-report-pestname" name="pestName" />
                  </Col>
                  <Col>
                    <SelectField id="edit-report-island" name="island" />
                  </Col>
                  <Col>
                    <TextField id="edit-report-location" name="location" />
                  </Col>
                </Row>
                <Row>
                  <LongTextField id="edit-report-description" name="pestDescription" />
                </Row>
                <Row>
                  <Col><SelectField id="edit-report-verified" name="verified" /></Col>
                  <Col><SelectField id="edit-report-removed" name="removed" /></Col>
                </Row>
                <SubmitField id="edit-report-submit" value="Submit" />
                <ErrorsField />
                <HiddenField name="date" value={new Date()} />
              </Card.Body>
            </Card>
          </AutoForm>
        </Col>
      </Row>
    </Container>
  ) : <LoadingSpinner />;
};

export default EditPostAdmin;
