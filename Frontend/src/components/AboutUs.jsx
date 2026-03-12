import "../styles/AboutUs.css";
import cozyLogo from "../assets/cozy-logo.svg";

export default function AboutUs() {
  return (
    <section className="section about-us">
      <div className="about-left">
        <div className="flower-wrap">
          <span className="petal petal-top" />
          <span className="petal petal-right" />
          <span className="petal petal-bottom" />
          <span className="petal petal-left" />

          <div className="logo-slot">
            <img src={cozyLogo} alt="Cozy Candle logo" className="about-logo" />
          </div>
        </div>
      </div>

      <div className="about-right">
        <h2>About Us</h2>
        <p>
          At Cozy Candle, we craft each candle with care to bring calm, warmth,
          and elegance into your everyday space.
        </p>
        <p>
          Replace the left placeholder with your brand logo or image and keep
          this section as your intro story for customers.
        </p>
      </div>
    </section>
  );
}
