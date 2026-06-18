import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import footerLogo from "../assets/navlogo.png";
import "../styles/Footer.css";

export default function Footer() {
  const storeLinks = [
    { label: "Home", to: "/" },
    { label: "About", to: "/#about" },
    { label: "Shop", to: "/shop" },
    { label: "Contact", to: "/#contact" }
  ];

  const helpLinks = [
    { label: "Login & Account", to: "/profile" },
    { label: "Privacy Policy", to: "/privacy-policy" },
    { label: "Refund & Return Policy", to: "/refund-return-policy" },
    { label: "Terms & Conditions", to: "/terms-conditions" },
    { label: "Shipping & Delivery Policy", to: "/shipping-delivery-policy" },
    { label: "Contact Us", to: "/#contact" }
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-column footer-brand">
          <Link to="/" className="footer-logo-link" aria-label="Cozy Candle home">
            <img src={footerLogo} alt="Cozy Candle" className="footer-logo" />
          </Link>
          <p>
            Handcrafted candles designed to bring warmth, peace and comfort to your
            space.
          </p>
          <div className="footer-social" aria-label="Social links">
            <a
              href="https://www.instagram.com/cozycandle_byakanksha?igsh=MWt2dmgzamJybDFlNQ=="
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>
            <a
              href="https://www.facebook.com/cozycandlebyakanksha?rdid=2aQkxkqfs5MZBxtC&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GkJCU8nFm%2F#"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebook />
            </a>
          </div>
        </div>

        <nav className="footer-column footer-links" aria-label="Store">
          <h3>Store</h3>
          <ul>
            {storeLinks.map((link) => (
              <li key={link.label}><Link to={link.to}>{link.label}</Link></li>
            ))}
          </ul>
        </nav>

        <nav className="footer-column footer-links footer-help" aria-label="Help">
          <h3>Help</h3>
          <ul>
            {helpLinks.map((link) => (
              <li key={link.label}><Link to={link.to}>{link.label}</Link></li>
            ))}
          </ul>
        </nav>
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
