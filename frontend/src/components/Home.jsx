import React from "react";
import HeroSlider from "./HeroSlider";

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Slider */}
      <HeroSlider
        slides={[
          {
            desktop: "https://res.cloudinary.com/dzd47mpdo/image/upload/v1773386363/Untitled_1920_x_600_px_heqmlh.svg",
            alt: "Orvanta Banner 1",
          },
          {
            desktop: "https://res.cloudinary.com/dzd47mpdo/image/upload/v1773386362/Untitled_1920_x_600_px_1_wbk8gh.svg",
            alt: "Orvanta Banner 2",
          },
          {
            desktop: "https://res.cloudinary.com/dzd47mpdo/image/upload/v1773472369/Untitled_1920_x_600_px_7_ud5lkc.png",
            alt: "Orvanta Banner 3",
          },
          
        ]}
        mobileSlides={[
          {
            src: "https://res.cloudinary.com/dzd47mpdo/image/upload/v1773472369/Untitled_1920_x_600_px_1080_x_1080_px_fgv6mv.png",
            alt: "Orvanta Mobile Banner 1",
          },
          {
            src: "https://res.cloudinary.com/dzd47mpdo/image/upload/v1773472369/Untitled_1080_x_1080_px_17_quhnxr.png",
            alt: "Orvanta Mobile Banner 2",
          },
          {
            src: "https://res.cloudinary.com/dzd47mpdo/image/upload/v1773472369/Untitled_1920_x_600_px_1080_x_1080_px_2_bwkxkm.png",
            alt: "Orvanta Mobile Banner 3",
          },
        ]}
      />
    </div>
  );
};

export default Home;
