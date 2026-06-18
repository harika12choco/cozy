import "../styles/Collections.css";
import { Link } from "react-router-dom";

export default function Collections(){
return(

<section id="collections" className="section collections-section">

<Link className="collections-shop-all" to="/shop">
Shop All <span aria-hidden="true">→</span>
</Link>

</section>

)

}
