import "../styles/HomeBanner.css";
import bannerImage from "../assets/banner.png";

export default function HomeBanner() {
  return (
    <section className="home-banner" aria-label="Cozy Candle showcase banner">
      <div className="home-banner-frame">
        <img src={bannerImage} alt="Cozy Candle product banner" />
      </div>
    </section>
  );
}
