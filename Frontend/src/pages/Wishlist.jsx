import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaRegHeart } from "react-icons/fa";
import ProductChoiceCard from "../components/ProductChoiceCard";
import { addItemToCart } from "../utils/cart";
import { fetchProductsByIds } from "../utils/shopProducts";
import { clearWishlist, getWishlistItems, subscribeWishlist } from "../utils/wishlist";
import "../styles/Wishlist.css";

export default function Wishlist() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");

  const loadWishlist = useCallback(async () => {
    const ids = getWishlistItems();

    if (ids.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Resolved from the API so a saved product always shows its current price and stock.
      const items = await fetchProductsByIds(ids);
      // Keep the order the shopper saved them in, newest first.
      const byId = new Map(items.map((item) => [String(item.productId || item.id), item]));
      setProducts(ids.map((id) => byId.get(id)).filter(Boolean));
    } catch (error) {
      console.error("Unable to load saved products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Saved Items | Cozy Candle";
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    loadWishlist();
    return subscribeWishlist(loadWishlist);
  }, [loadWishlist]);

  function handleAddToCart(product) {
    if (Number(product.stock ?? 0) <= 0) {
      setFeedback("Out of stock");
      window.setTimeout(() => setFeedback(""), 1800);
      return;
    }

    addItemToCart(product);
    setFeedback(`${product.name} added to cart`);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  function handleClear() {
    if (window.confirm("Remove all saved items?")) {
      clearWishlist();
    }
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <p className="wishlist-kicker">Saved Items</p>
        <h1>My Favourites</h1>
        {products.length > 0 ? (
          <p className="wishlist-intro">
            {products.length} {products.length === 1 ? "candle" : "candles"} saved for later.
          </p>
        ) : null}
      </section>

      <section className="wishlist-grid-section">
        {feedback ? <p className="wishlist-feedback">{feedback}</p> : null}

        {loading && products.length === 0 ? (
          <p className="wishlist-feedback">Loading saved items...</p>
        ) : products.length === 0 ? (
          <div className="wishlist-empty">
            <span className="wishlist-empty-icon" aria-hidden="true">
              <FaRegHeart />
            </span>
            <h2>No saved items yet</h2>
            <p>
              Tap the heart on any candle to save it here, so you can come back to it later.
            </p>
            <button className="btn" type="button" onClick={() => navigate("/shop")}>
              Browse Candles
            </button>
          </div>
        ) : (
          <>
            <div className="wishlist-actions">
              <button type="button" className="wishlist-clear-btn" onClick={handleClear}>
                Clear all
              </button>
            </div>

            <div className="wishlist-grid">
              {products.map((product) => (
                <ProductChoiceCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  showSafety={false}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
