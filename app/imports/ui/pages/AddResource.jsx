import React from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { AutoForm, ErrorsField, LongTextField, SelectField, SubmitField, TextField } from 'uniforms-bootstrap5';
import swal from 'sweetalert';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import SimpleSchema from 'simpl-schema';
import { References } from '../../api/reference/Reference';

// Create a schema to specify the structure of the data to appear in the form.
const formSchema = new SimpleSchema({
  image: String,
  pestName: String,
  sciName: String,
  risk: String,
  regStatus: String,
  pestType: {
    type: String,
    allowedValues:
      ['Plant', 'Animal', 'Bug', 'Microbe', 'Fungus'],
  },
  description: String,
  impact: String,
  distribution: String,
  lookalike: String,
});

const bridge = new SimpleSchema2Bridge(formSchema);

/* Renders the AddReport page for adding a document. */
const AddResource = () => {

  // On submit, insert the data.
  const submit = async (data, formRef) => {
    const { image, pestName, sciName, risk, regStatus, pestType, description, impact, distribution, lookalike } = data;
    References.collection.insert(
      { image, pestName, sciName, risk, regStatus, pestType, description, impact, distribution, lookalike },
      (error) => {
        if (error) {
          swal('Error', error.message, 'error');
        } else {
          swal('Success', 'Reference added successfully', 'success');
          formRef.reset();
        }
      },
    );
  };
  // Render the form. Use Uniforms: https://github.com/vazco/uniforms
  let fRef = null;
  return (
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center"><h2>Add a Reference</h2></Col>
          <AutoForm ref={ref => { fRef = ref; }} schema={bridge} onSubmit={data => submit(data, fRef)}>
            <Card>
              <Card.Body>
                <Row>
                  <TextField name="image" placeholder="Image URL" />
                  <TextField name="pestName" />
                  <TextField name="sciName" />
                  <TextField name="risk" />
                  <TextField name="regStatus" />
                  <SelectField name="pestType" />
                  <LongTextField name="description" />
                  <LongTextField name="impact" />
                  <TextField name="distribution" placeholder="Which Islands do they reside?" />
                  <TextField name="lookalike" />
                </Row>
                <SubmitField value="Submit" />
                <ErrorsField />
              </Card.Body>
            </Card>
          </AutoForm>
        </Col>
      </Row>
    </Container>
  );
};

export default AddResource;
