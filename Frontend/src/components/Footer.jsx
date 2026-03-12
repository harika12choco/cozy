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
<li>Home</li>
<li>Shop</li>
<li>Collections</li>
<li>About</li>
<li>Contact</li>
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

<FaInstagram/>
<FaFacebook/>
<FaTwitter/>

</div>

</div>

</div>

<div className="footer-bottom">

<p>© 2026 Cozy Candle | Made with warmth</p>

</div>

</footer>

)

}