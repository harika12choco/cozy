import "../styles/AboutUs.css";
import cozyLogo from "../assets/cozy-logo.png";

export default function AboutUs() {
  return (
    <section id="about" className="section about-us">
      <div className="about-left">
        <div className="logo-wrap">
          <div className="logo-slot">
            <img src={cozyLogo} alt="Cozy Candle logo" className="about-logo" />
          </div>
        </div>
      </div>

      <div className="about-right">
        <h2>About Us</h2>
        <p>
          Cozy Candle by Akansha creates refined, hand-poured candles using
          100% pure soy wax-crafted for a cleaner burn and a softer, lasting
          ambiance. Rooted in simplicity and attention to detail, each candle is
          designed to bring warmth, balance, and quiet luxury into everyday
          spaces. Why choose us? Pure ingredients, thoughtful craftsmanship, and
          a focus on quality over excess-so every candle feels intentional, not
          ordinary. Cozy Candle by Akansha - where comfort meets elegance.
        </p>
      </div>
    </section>
  );
}
