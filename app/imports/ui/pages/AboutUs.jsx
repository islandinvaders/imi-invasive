import React from 'react';
import { Col, Container, Row, Nav } from 'react-bootstrap';
import { Linkedin } from 'react-bootstrap-icons';

/* A simple static component to render some text for the landing page. */
const AboutUs = () => (
  <Container id="about-us-page" className="py-3 justify-content-center">
    <Row className="align-items-center text-center">
      <Col xs={12} className="text-center">
        <h1 className="custom-header">ABOUT US</h1>
        <p>
          &apos;Imi Invasive aims to address invasive species management challenges by establishing a citizen science initiative to bring the community together
          and educate people on invasive species, raising awareness and empowering the community and professionals to better track harmful species and care
          for the ecosystem. It serves as an educational resource and a centralized app for reporting and managing invasive species across the Hawaiian Islands.
        </p>
        <img
          alt="Get to know us!"
          src="/images/about.png"
          className="img-fluid d-inline-block align-top about-us-img"
        />
        <h1>Meet The Team</h1>
        <p>The team of creators is made up of five undergraduate students studying computer science at the University of Hawai&apos;i at Mānoa. </p>
        <div>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Natalie Ching</h5>
              <small className="text-muted">2nd Year - BS in CS (Data Science)</small>
              <Nav.Link href="https://www.linkedin.com/in/natalie-ching-96749a253/"><Linkedin/></Nav.Link>
              <p className="card-text">
                Natalie grew up in Hawai&apos;i and is very interested in native wildlife. She participates in invasive seaweed clean-ups in Oahu and replanting projects. Natalie aspires to work in data science for a government agency.
                <br/>
                <br/>
                Fun Fact: Natalie is 5th generation in Hawai&apos;i, and she can touch her elbows behind her head.
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Allison Ebsen</h5>
              <small className="text-muted">2nd Year - BS in CS (General)</small>
              <Nav.Link href="https://www.linkedin.com/in/allison-ebsen/"><Linkedin/></Nav.Link>
              <p className="card-text">
                Allison works in Agrosecurity and Agricultural Engineering, and she values the interconnectedness between the environment and our health. She’s currently exploring careers in computational biology.
                <br/>
                <br/>
                Fun Fact: A childhood game that Allison loves is Pokemon Mystery Dungeon: Explorers of Sky.
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Lily Enanoria</h5>
              <small className="text-muted">2nd Year - BS in CS (Cyber Security)</small>
              <Nav.Link href="https://www.linkedin.com/in/lily-enanoria-0944aa2aa/ "><Linkedin/></Nav.Link>
              <p className="card-text">
                Lily grew up going to the beach with her &apos;ohana, and she loves interacting with nature. She loves opportunities to restore the &apos;āina. Lily aspires to work in cyber security for the government.
                <br/>
                <br/>
                Fun Fact: Lily’s goal is to live in Japan one day.
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Myra Ortigosa</h5>
              <small className="text-muted">2nd Year - BS in CS (Data Science)</small>
              <Nav.Link href="https://www.linkedin.com/in/myra-angelica-ortigosa-5661a4275/ "><Linkedin/></Nav.Link>
              <p className="card-text">
                Myra cares about the environment and engages in community beach clean-ups, and she aspires to become a data scientist or data analyst.
                <br/>
                <br/>
                Fun Fact: Myra recently got a takoyaki machine and wants to use it one day when she’s not busy.
              </p>
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Gian Panoy</h5>
              <small className="text-muted">2nd Year - BS in CS (General)</small>
              <Nav.Link href="https://www.linkedin.com/in/gianpanoy/"><Linkedin/></Nav.Link>
              <p className="card-text">
                Gian is pursuing a career in software engineering. He is of Native Hawaiian descent and cares about the community and life here.
                <br/>
                <br/>
                Fun Fact: Gian (aka Mr. Worldwide) has visited Canada, South Korea, and the Philippines.
              </p>
            </div>
          </div>
        </div>

      </Col>
    </Row>
  </Container>
);

export default AboutUs;
