import "../styles/Hero.css"
import { useNavigate } from "react-router-dom";

export default function Hero(){
const navigate = useNavigate();

return(

<section className="hero">

<div className="hero-slider" aria-hidden="true">
<div className="hero-slide hero-slide-primary"></div>
<div className="hero-slide hero-slide-secondary"></div>
</div>

<div className="hero-overlay" aria-hidden="true"></div>

<div className="hero-content">

<h1 className="hero-title">
Handcrafted Luxury
<span>Candles</span>
</h1>

<p>
Bring warmth and calm into your home
with our premium handmade candles.
</p>

<button className="hero-btn" onClick={() => navigate("/shop")}>Shop Collection</button>

</div>

</section>

)

}
