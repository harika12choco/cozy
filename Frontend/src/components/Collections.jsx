import "../styles/Collections.css";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addItemToCart } from "../utils/cart";
import { readShopProducts } from "../utils/shopProducts";

const FEATURED_PRODUCT_COUNT = 4;

export default function Collections(){
const [featuredProducts, setFeaturedProducts] = useState([]);
const [feedback, setFeedback] = useState("");

useEffect(() => {
let active = true;

async function syncFeaturedProducts() {
const products = await readShopProducts();

if (active) {
setFeaturedProducts(products.slice(0, FEATURED_PRODUCT_COUNT));
}
}

syncFeaturedProducts();
window.addEventListener("storage", syncFeaturedProducts);
window.addEventListener("cozy-admin-products-updated", syncFeaturedProducts);

return () => {
active = false;
window.removeEventListener("storage", syncFeaturedProducts);
window.removeEventListener("cozy-admin-products-updated", syncFeaturedProducts);
};
}, []);

function handleAddToCart(product) {
addItemToCart(product);
setFeedback(`${product.name} added to cart`);
window.setTimeout(() => {
setFeedback("");
}, 1800);
}

return(

<section id="collections" className="section collections-section">

<h2 className="slanted-title" aria-label="Our Products">
<span>O</span>
<span>u</span>
<span>r</span>
<span>&nbsp;</span>
<span>P</span>
<span>r</span>
<span>o</span>
<span>d</span>
<span>u</span>
<span>c</span>
<span>t</span>
<span>s</span>
</h2>

{feedback ? <p className="collections-feedback">{feedback}</p> : null}

<div className="collections">

{featuredProducts.map((product) => (
<article className="collection-card" key={product.id}>
<div className="collection-media">
<img
src={product.img}
alt={product.name}
className="collection-img"
/>
</div>
<div className="collection-card-body">
<h3>{product.name}</h3>
<div className="collection-card-footer">
<span>{product.price}</span>
<button
className="btn"
type="button"
onClick={() => handleAddToCart(product)}
>
Add to Cart
</button>
</div>
</div>
</article>
))}

</div>

<Link className="collections-shop-all" to="/shop">
Shop All <span aria-hidden="true">→</span>
</Link>

</section>

)

}
