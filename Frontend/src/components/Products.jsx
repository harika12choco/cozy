import "../styles/Products.css";
import img1 from "../assets/candles/1.png";
import img2 from "../assets/candles/2.png";
import img3 from "../assets/candles/3.png";

const products = [
  {
    name: "Vanilla Dream",
    price: "Rs 499",
    img: img1
  },
  {
    name: "Rose Bliss",
    price: "Rs 599",
    img: img2
  },
  {
    name: "Lavender Calm",
    price: "Rs 549",
    img: img3
  }
];

export default function Products() {
  return (
    <section className="section best-sellers-section">
      <h2 className="best-title">Best Sellers</h2>

      <div className="products">
        {products.map((p, i) => (
          <article className="product" key={i}>
            <div className="product-image-wrap">
              <img src={p.img} alt={p.name} />
            </div>

            <h3>{p.name}</h3>
            <p>{p.price}</p>
            <button className="btn">Add to Cart</button>
          </article>
        ))}
      </div>
    </section>
  );
}
