import "../styles/Hero.css"
import hero from "../assets/candles/hero.png";
export default function Hero(){

return(

<section className="hero">

<div className="hero-content">

<h1>Handcrafted Luxury Candles</h1>

<p>
Bring warmth and calm into your home
with our premium handmade candles.
</p>

<button className="hero-btn">Shop Collection</button>

</div>

<div className="hero-image">
<img src={hero} alt="candle" />

</div>

</section>

)

}