import "../styles/shop.css";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { addItemToCart } from "../utils/cart";
import { matchesCategory, readShopProducts } from "../utils/shopProducts";

export default function Shop({ selectedCategory = "" }) {
  const [searchParams] = useSearchParams();
  const [shopProducts, setShopProducts] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");

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

  useEffect(() => {
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);

  function handleAddToCart(product) {
    addItemToCart(product);
    setFeedback(`${product.name} added to cart`);
    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleProducts = shopProducts.filter((product) => {
    if (!matchesCategory(product, selectedCategory)) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      product.name,
      product.category,
      product.price,
      product.note
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch));
  });

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

        <label className="shop-search" aria-label="Search candles">
          <FaSearch aria-hidden="true" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search candles"
          />
        </label>

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
        {visibleProducts.length === 0 ? (
          <p className="shop-empty">No candles found for your search.</p>
        ) : null}
      </section>
    </main>
  );
}
