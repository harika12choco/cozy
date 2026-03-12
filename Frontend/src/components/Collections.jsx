import "../styles/Collections.css";
import collection1 from "../assets/candles/4.png";
import collection2 from "../assets/candles/5.png";
import collection3 from "../assets/candles/6.png";
export default function Collections(){

return(

<section className="section collections-section">

<div className="collections">

<div className="card featured-card">
<h2 className="slanted-title">Our Collections</h2>
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
