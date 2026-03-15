import "../styles/Collections.css";
import collection1 from "../assets/candles/4.png";
import collection2 from "../assets/candles/5.png";
import collection3 from "../assets/candles/6.png";

export default function Collections(){

return(

<section id="collections" className="section collections-section">

<h2 className="slanted-title" aria-label="Our Collections">
<span>O</span>
<span>u</span>
<span>r</span>
<span>&nbsp;</span>
<span>C</span>
<span>o</span>
<span>l</span>
<span>l</span>
<span>e</span>
<span>c</span>
<span>t</span>
<span>i</span>
<span>o</span>
<span>n</span>
<span>s</span>
</h2>

<div className="collections">

<div className="card featured-card">
<img src={collection1} alt="Floral Candles" className="collection-img"/>
<h3>Floral Candles</h3>
</div>

<div className="card">
<img src={collection2} alt="Luxury Candles" className="collection-img"/>
<h3>Luxury Candles</h3>
</div>

<div className="card">
<img src={collection3} alt="Aromatherapy" className="collection-img"/>
<h3>Aromatherapy</h3>
</div>

</div>

</section>

)

}
