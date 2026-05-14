import "../styles/ProductDetail.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addItemToCart } from "../utils/cart";
import { fetchProductsByIds, matchesCategory, readShopProducts } from "../utils/shopProducts";

const RECOMMENDATION_COUNT = 4;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = String(id ?? "").trim();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const products = await fetchProductsByIds([productId]);
        const selected = products[0] ?? null;

        if (!active) {
          return;
        }

        if (!selected) {
          setProduct(null);
          setRecommendations([]);
          setError("Product not found.");
          return;
        }

        setProduct(selected);

        const allProducts = await readShopProducts();
        if (!active) {
          return;
        }

        const related = allProducts.filter((item) => {
          if (item.id === selected.id) {
            return false;
          }

          return matchesCategory(item, selected.category);
        });

        setRecommendations(related.slice(0, RECOMMENDATION_COUNT));
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load product.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (!productId) {
      setLoading(false);
      setError("Product not found.");
      setProduct(null);
      setRecommendations([]);
      return undefined;
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId]);

  function handleAddToCart() {
    if (!product) {
      return;
    }

    if (product.stock <= 0) {
      setFeedback("Out of stock");
      return;
    }

    addItemToCart({
      ...product,
      img: product.img ?? product.image
    });

    setFeedback(`${product.name} added to cart`);
    window.setTimeout(() => setFeedback(""), 1800);
  }

  if (loading) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-card">
          <p className="product-detail-feedback">Loading product...</p>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-card">
          <p className="product-detail-feedback">{error || "Product not found."}</p>
          <button type="button" className="btn" onClick={() => navigate("/shop")}>
            Back to Shop
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="product-detail-page">
      <div className="product-detail-actions">
        <button type="button" className="product-detail-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <Link className="product-detail-shop" to="/shop">
          Shop All
        </Link>
      </div>

      {feedback ? <p className="product-detail-feedback">{feedback}</p> : null}

      <section className="product-detail-card">
        <div className="product-detail-media">
          <img src={product.img ?? product.image} alt={product.name} />
        </div>

        <div className="product-detail-info">
          <p className="product-detail-category">{product.category || "Signature Candle"}</p>
          <h1>{product.name}</h1>
          <p className="product-detail-price">{product.price}</p>
          <p className="product-detail-stock">
            {product.stock > 0 ? `${product.stock} items left` : "Out of stock"}
          </p>
          <p className="product-detail-description">
            {product.note || "A cozy candle crafted for slow evenings and warm spaces."}
          </p>

          <div className="product-detail-cta">
            <button
              type="button"
              className="btn"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </section>

      <section className="product-detail-section">
        <h2>Recommended in {product.category || "this collection"}</h2>
        {recommendations.length === 0 ? (
          <p className="product-detail-feedback">No recommendations available.</p>
        ) : (
          <div className="product-detail-grid">
            {recommendations.map((item) => (
              <article className="product-detail-rec-card" key={item.id}>
                <Link to={`/product/${item.productId || item.id}`}>
                  <img src={item.img ?? item.image} alt={item.name} />
                </Link>
                <div>
                  <h3>
                    <Link to={`/product/${item.productId || item.id}`}>{item.name}</Link>
                  </h3>
                  <p>{item.price}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
