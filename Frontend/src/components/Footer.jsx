import "../styles/Footer.css"
import { FaInstagram, FaFacebook, FaTwitter } from "react-icons/fa"

export default function Footer(){

return(

<footer className="footer">

<div className="footer-container">

<div className="footer-brand">
<h2>Cozy Candle</h2>
<p>
Handcrafted candles designed to bring warmth,
peace and comfort to your space.
</p>
</div>

<div className="footer-links">

<h3>Quick Links</h3>

<ul>
<li><a href="/">Home</a></li>
<li><a href="/shop">Shop</a></li>
<li><a href="/#collections">Collections</a></li>
<li><a href="/#about">About</a></li>
<li><a href="/#contact">Contact</a></li>
</ul>

</div>

<div className="footer-links">

<h3>Customer</h3>

<ul>
<li>Shipping</li>
<li>Returns</li>
<li>FAQ</li>
<li>Privacy Policy</li>
</ul>

</div>

<div className="footer-social">

<h3>Follow Us</h3>

<div className="icons">

<a href="https://www.instagram.com/cozycandle_byakanksha?igsh=MWt2dmgzamJybDFlNQ==" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
  <FaInstagram />
</a>
<a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
  <FaFacebook />
</a>
<a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
  <FaTwitter />
</a>

</div>

</div>

</div>

<div className="footer-bottom">

<p>© 2026 Cozy Candle | Made with warmth</p>

</div>

</footer>

)

}