import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const AutoScrollCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 2000,
    autoplay: true,
    autoplaySpeed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <CustomPrevArrow />,
    nextArrow: <CustomNextArrow />,
    centerMode: true,
    centerPadding: '0px' // Remove padding at the sides
  };

  const CustomPrevArrow = (props) => {
    const { onClick } = props;
    return (
      <div className="custom-arrow custom-prev" onClick={onClick}>
        Previous
      </div>
    );
  };

  const CustomNextArrow = (props) => {
    const { onClick } = props;
    return (
      <div className="custom-arrow custom-next" onClick={onClick}>
        Next
      </div>
    );
  };

  return (
    <Slider {...settings}>
      <div className="carousel-slide">
        <img src="image1.jpg" alt="Image 1" />
        <div className="carousel-text">
          <h2>Image 1</h2>
          <p>Description of Image 1</p>
        </div>
      </div>
      <div className="carousel-slide">
        <img src="image2.jpg" alt="Image 2" />
        <div className="carousel-text">
          <h2>Image 2</h2>
          <p>Description of Image 2</p>
        </div>
      </div>
      <div className="carousel-slide">
        <img src="image3.jpg" alt="Image 3" />
        <div className="carousel-text">
          <h2>Image 3</h2>
          <p>Description of Image 3</p>
        </div>
      </div>
    </Slider>
  );
};

export default AutoScrollCarousel;
