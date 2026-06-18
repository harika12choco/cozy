import "../styles/shop.css";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import ProductChoiceCard from "./ProductChoiceCard";
import { addItemToCart } from "../utils/cart";
import { matchesCategory, readShopProducts, searchProducts } from "../utils/shopProducts";
import { readStaticProducts } from "../utils/staticProducts";

export default function Shop({ selectedCategory = "" }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [shopProducts, setShopProducts] = useState(() => readStaticProducts());
  const [feedback, setFeedback] = useState("");
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [loading, setLoading] = useState(true);
  const searchQuery = searchParams.get("search")?.trim() ?? "";

  useEffect(() => {
    let active = true;

    async function syncProducts() {
      try {
        const immediateProducts = searchQuery
          ? readStaticProducts().filter((product) =>
              [product.name, product.description, product.category, product.price]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(searchQuery.toLowerCase()))
            )
          : readStaticProducts();

        setShopProducts(immediateProducts);
        setLoading(immediateProducts.length === 0);

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

  function handleSearchSubmit(event) {
    event.preventDefault();

    const normalizedSearch = searchTerm.trim();
    navigate(normalizedSearch ? `/shop?search=${encodeURIComponent(normalizedSearch)}` : "/shop");
    window.scrollTo({ top: 0, behavior: "auto" });
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
            <ProductChoiceCard key={product.id} product={product} onAddToCart={handleAddToCart} showSafety={false} />
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
