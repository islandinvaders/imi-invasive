import React, { useState } from 'react';
import { Card, Col, Container, Row } from 'react-bootstrap';
import { AutoForm, ErrorsField, SelectField, LongTextField, SubmitField, HiddenField, TextField } from 'uniforms-bootstrap5';
import swal from 'sweetalert';
import { Meteor } from 'meteor/meteor';
import SimpleSchema2Bridge from 'uniforms-bridge-simple-schema-2';
import SimpleSchema from 'simpl-schema';
import { Roles } from 'meteor/alanning:roles';
import crypto from 'crypto';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';
import { Reports } from '../../api/report/Report';

// Allows access to environmental variables
dotenv.config();

// HANDLE IMAGE UPLOAD

// Generate random bit string
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');

// Save environmental variables
const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

// Make new s3 client
const s3 = new S3Client({
  region: bucketRegion,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
});

// Create a schema to specify the structure of the data to appear in the form.
const formSchema = new SimpleSchema({
  image: String,
  pestName: String,
  pestDescription: String,
  island: {
    type: String,
    allowedValues: ['Niihau', 'Kauai', 'Oahu', 'Molokai', 'Lanai', 'Maui', 'Kahoolawe', 'Hawaii'],
  },
  location: String,
  date: Date,
  verified: {
    type: String,
    allowedValues: ['No', 'Yes'],
    defaultValue: 'No',
  },
  removed: {
    type: String,
    allowedValues: ['No', 'Yes'],
    defaultValue: 'No',
  },
});

const bridge = new SimpleSchema2Bridge(formSchema);

/* Renders the AddReport page for adding a document. */
const AddPost = () => {
  // Save state variable to ''
  const [imageUrl, setImageUrl] = useState('');

  // HANDLES PHOTO UPLOAD
  const handleFileLoad = async (event) => {
    // Check if there's a file
    const file = event.target.files[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    // Prepare file name for file to be uploaded to s3 using random bit string and file name to reduce likelihood of file override
    const newFileName = `${randomImageName()}${file.name}`;

    // Not sure what these are, but they're required to put the object in the bucket
    const uploadParams = {
      Bucket: bucketName,
      Key: newFileName,
      Body: file,
      ACL: 'public-read',
    };

    try {
      // Try to send image to s3 bucket
      const data = await s3.send(new PutObjectCommand(uploadParams));
      console.log('Success', data);

      // Get URL of image back
      const urlParams = { Bucket: bucketName, Key: newFileName };
      const url = await getSignedUrl(s3, new GetObjectCommand(urlParams));

      // Update local state variable with image URL
      setImageUrl(url);
      console.log('image', url);
    } catch (err) {
      console.log('Error', err);
    }
  };

  //  ON SUBMIT, SEND FORM DATA TO BE A NEW DOCUMENT IN THE MONGODB REPORTS COLLECTION
  const submit = async (data, formRef) => {
    const { pestName, pestDescription, island, location, verified, removed } = data;
    const reporter = Meteor.user().username;
    const date = new Date();
    Reports.collection.insert(
      { image: imageUrl, pestName, pestDescription, island, location, verified, removed, reporter, date },
      (error) => {
        if (error) {
          swal('Error', error.message, 'error');
        } else {
          swal('Success', 'Item added successfully', 'success');
          formRef.reset();
        }
      },
    );
  };

  // Boolean used to check if user is logged in and that their role is an admin
  const isAdmin = Meteor.userId() && Roles.userIsInRole(Meteor.userId(), 'admin');

  let fRef = null;
  return (
    // FORM
    <Container className="py-3">
      <Row className="justify-content-center">
        <Col xs={5}>
          <Col className="text-center"><h2>Make A Report</h2></Col>
          <AutoForm ref={ref => { fRef = ref; }} schema={bridge} onSubmit={data => submit(data, fRef)}>
            <Card>
              <Card.Body>
                <Row>
                  IMAGE PLACEHOLDER
                  <input type="file" name="image" accept="image/*" onChange={handleFileLoad} />
                </Row>
                <Row>
                  <Col>
                    <TextField name="pestName" />
                  </Col>
                  <Col>
                    <SelectField name="island" />
                  </Col>
                  <Col>
                    <TextField name="location" />
                  </Col>
                </Row>
                <Row>
                  <LongTextField name="pestDescription" />
                </Row>
                <Row>
                  {isAdmin && (
                    <Col><SelectField name="verified" /></Col>
                  )}
                  <Col><SelectField name="removed" /></Col>
                </Row>
                <SubmitField value="Submit" />
                <ErrorsField />
                <HiddenField name="date" value={new Date()} />
              </Card.Body>
            </Card>
          </AutoForm>
        </Col>
      </Row>
    </Container>
  );
};

export default AddPost;
