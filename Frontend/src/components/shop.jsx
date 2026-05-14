import "../styles/shop.css";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { addItemToCart } from "../utils/cart";
import { matchesCategory, readShopProducts, searchProducts } from "../utils/shopProducts";

export default function Shop({ selectedCategory = "" }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [shopProducts, setShopProducts] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [loading, setLoading] = useState(true);
  const searchQuery = searchParams.get("search")?.trim() ?? "";

  useEffect(() => {
    let active = true;

    async function syncProducts() {
      try {
        setLoading(true);
        const products = searchQuery
          ? await searchProducts(searchQuery)
          : await readShopProducts();

        if (active) {
          setShopProducts(products);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
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
  }, [searchQuery]);

  useEffect(() => {
    setSearchTerm(searchParams.get("search") ?? "");
  }, [searchParams]);

  function handleSearchSubmit(event) {
    event.preventDefault();

    const normalizedSearch = searchTerm.trim();
    const params = new URLSearchParams(searchParams);

    if (normalizedSearch) {
      params.set("search", normalizedSearch);
    } else {
      params.delete("search");
    }

    const query = params.toString();
    navigate(query ? `/shop?${query}` : "/shop");
  }

  function handleAddToCart(product) {
    if (product.stock <= 0) {
      setFeedback("Out of stock");
      window.setTimeout(() => {
        setFeedback("");
      }, 1800);
      return;
    }

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

        <form className="shop-search" role="search" onSubmit={handleSearchSubmit} aria-label="Search candles">
          <button type="submit" aria-label="Search candles">
            <FaSearch aria-hidden="true" />
          </button>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search candles"
          />
        </form>

        <div className="shop-grid">
          {loading ? (
            <p className="shop-feedback">Loading products...</p>
          ) : visibleProducts.length === 0 ? null : visibleProducts.map((product) => (
            <article className="shop-card" key={product.id}>
              <div className="shop-card-image">
                <Link to={`/product/${product.productId || product.id}`} aria-label={`View ${product.name}`}>
                  <img src={product.img} alt={product.name} />
                </Link>
              </div>

              <div className="shop-card-body">
                <h3>
                  <Link to={`/product/${product.productId || product.id}`}>{product.name}</Link>
                </h3>
                <div className="shop-card-footer">
                  <span className="shop-price">{product.price}</span>
                  <span className="shop-stock">
                    {product.stock > 0 ? `${product.stock} items left` : "Out of Stock"}
                  </span>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!loading && visibleProducts.length === 0 ? (
          <p className="shop-empty">
            {shopProducts.length === 0
              ? "No products available."
              : "No candles found for your search."}
          </p>
        ) : null}
      </section>
    </main>
  );
}
