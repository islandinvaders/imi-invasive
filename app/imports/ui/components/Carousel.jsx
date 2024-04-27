import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const images = [
  '/images/hawaii1.png',
  '/images/hawaii2.png',
  '/images/hawaii3.png',
  '/images/flower1.png',
  '/images/flower2.png',
  '/images/mongoose.png',
];
const PauseOnHover = (children, func) => {
  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    pauseOnHover: true,
  };
  return (
    <Slider
      dots={settings.dots}
      infinite={settings.infinite}
      speed={settings.speed}
      slidesToShow={settings.slidesToShow}
      slidesToScroll={settings.slidesToScroll}
      autoplay={settings.autoplay}
      autoplaySpeed={settings.autoplaySpeed}
    >
      {images.map((image, index) => (
        <div key={index}>
          <img src={image} alt={`Slide ${index}`} />
        </div>
      ), func)}
    </Slider>
  );
};

export default PauseOnHover;
