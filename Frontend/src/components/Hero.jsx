import "../styles/Hero.css"
import { useNavigate } from "react-router-dom";
import hero from "../assets/candles/hero.png";
export default function Hero(){
const navigate = useNavigate();

return(

<section className="hero">

<div className="hero-content">

<h1>Handcrafted Luxury Candles</h1>

<p>
Bring warmth and calm into your home
with our premium handmade candles.
</p>

<div className="hero-image hero-image-mobile">
<img src={hero} alt="candle" />
</div>

<button className="hero-btn" onClick={() => navigate("/shop")}>Shop Collection</button>

</div>

<div className="hero-image">
<img src={hero} alt="candle" />

</div>

</section>

)

}
