import "../styles/shop.css";
import { useEffect, useState } from "react";
import { addItemToCart } from "../utils/cart";
import { matchesCategory, readShopProducts } from "../utils/shopProducts";

export default function Shop({ selectedCategory = "" }) {
  const [shopProducts, setShopProducts] = useState([]);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;

    async function syncProducts() {
      const products = await readShopProducts();

      if (active) {
        setShopProducts(products);
      }
    }

    syncProducts();
    window.addEventListener("storage", syncProducts);
    window.addEventListener("cozy-admin-products-updated", syncProducts);

    return () => {
      active = false;
      window.removeEventListener("storage", syncProducts);
      window.removeEventListener("cozy-admin-products-updated", syncProducts);
    };
  }, []);

  function handleAddToCart(product) {
    addItemToCart(product);
    setFeedback(`${product.name} added to cart`);
    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  }

  const visibleProducts = shopProducts.filter((product) => matchesCategory(product, selectedCategory));

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="shop-kicker">The Candle Shop</p>
        <h1>{selectedCategory || "Find your next cozy ritual"}</h1>
        {!selectedCategory ? (
          <p className="shop-intro">
            Browse handcrafted candles made to bring warmth, calm, and a soft luxury feel into your everyday spaces.
          </p>
        ) : null}
      </section>

      <section className="shop-grid-section">
        {feedback ? <p className="shop-feedback">{feedback}</p> : null}
        <div className="shop-grid">
          {visibleProducts.map((product) => (
            <article className="shop-card" key={product.id}>
              <div className="shop-card-image">
                <img src={product.img} alt={product.name} />
              </div>

              <div className="shop-card-body">
                <h3>{product.name}</h3>
                <div className="shop-card-footer">
                  <span className="shop-price">{product.price}</span>
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
      </section>
    </main>
  );
}
