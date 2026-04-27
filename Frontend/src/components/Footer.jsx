import { Link } from "react-router-dom";
import { FaInstagram } from "react-icons/fa";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2>Cozy Candle</h2>
          <p>
            Handcrafted candles designed to bring warmth, peace and comfort to your
            space.
          </p>
        </div>

        <div className="footer-links">
          <h3>Quick Links</h3>

          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            <li><Link to="/#collections">Collections</Link></li>
            <li><Link to="/#about">About</Link></li>
            <li><Link to="/#contact">Contact</Link></li>
          </ul>
        </div>

        <div className="footer-social">
          <h3>Follow Us</h3>

          <div className="icons">
            <a
              href="https://www.instagram.com/cozycandle_byakanksha?igsh=MWt2dmgzamJybDFlNQ=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          <span className="footer-mark">Made with warmth</span>
          <span className="footer-separator" aria-hidden="true">•</span>
          © 2026 Cozy Candle
        </p>
      </div>
    </footer>
  );
}
