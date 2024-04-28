import React from 'react';
import Carousel from 'react-bootstrap/Carousel';

const CarouselImages = () => (
  <Carousel>
    <Carousel.Item>
      <img
        alt="Hawaii3"
        src="/images/hawaii3.png"
        className="d-block w-100"
      />
    </Carousel.Item>
    <Carousel.Item>
      <img
        alt="Hawaii2"
        src="/images/hawaii2.png"
        className="d-block w-100"
      />
    </Carousel.Item>
    <Carousel.Item>
      <img
        alt="Flower"
        src="/images/flower2.png"
        className="d-block w-100"
      />
    </Carousel.Item>
    <Carousel.Item>
      <img
        alt="logo"
        src="/images/mongoose.png"
        className="d-block w-100"
      />
    </Carousel.Item>
  </Carousel>
);
export default CarouselImages;
