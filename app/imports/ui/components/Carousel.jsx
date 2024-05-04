import React from 'react';
import Carousel from 'react-bootstrap/Carousel';
import { CarouselCaption } from 'react-bootstrap';

const CarouselImages = () => (
  <Carousel>
    <Carousel.Item className="image-overlay">
      <img
        alt="Hawaii3"
        src="/images/hawaii3.png"
        className="d-block w-100"
      />
      <CarouselCaption className="image-overlay d-flex justify-content-start"><h1>ALOHA MAI KĀKOU!</h1></CarouselCaption>
    </Carousel.Item>
    <Carousel.Item className="image-overlay">
      <img
        alt="Hawaii2"
        src="/images/hawaii2.png"
        className="d-block w-100"
      />
      <CarouselCaption className="image-overlay d-flex justify-content-start"><h1>ALOHA MAI KĀKOU!</h1></CarouselCaption>
    </Carousel.Item>
    <Carousel.Item className="image-overlay">
      <img
        alt="Flower"
        src="/images/flower2.png"
        className="d-block w-100"
      />
      <CarouselCaption className="image-overlay d-flex justify-content-start"><h1>ALOHA MAI KĀKOU!</h1></CarouselCaption>
    </Carousel.Item>
    <Carousel.Item className="image-overlay">
      <img
        alt="logo"
        src="/images/mongoose.png"
        className="d-block w-100"
      />
      <CarouselCaption className="image-overlay d-flex justify-content-start"><h1>ALOHA MAI KĀKOU!</h1></CarouselCaption>
    </Carousel.Item>
  </Carousel>
);
export default CarouselImages;
