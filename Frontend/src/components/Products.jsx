import "../styles/Products.css";
import { useEffect, useState } from "react";
import ProductChoiceCard from "./ProductChoiceCard";
import { addItemToCart } from "../utils/cart";
import { readBestSellerProducts } from "../utils/shopProducts";

export default function Products() {
  const [feedback, setFeedback] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        const items = await readBestSellerProducts();

        if (active) {
          setProducts(items);
        }
      } catch {
        if (active) {
          setProducts([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    window.addEventListener("cozy-admin-products-updated", loadProducts);
    window.addEventListener("storage", loadProducts);
    return () => {
      active = false;
      window.removeEventListener("cozy-admin-products-updated", loadProducts);
      window.removeEventListener("storage", loadProducts);
    };
  }, []);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      setFeedback("Out of stock");
      return;
    }

    addItemToCart({
      ...product,
      img: product.img ?? product.image
    });
    setFeedback(`${product.name} added to cart`);
    window.setTimeout(() => {
      setFeedback("");
    }, 1800);
  };

  return (
    <section id="bestsellers" className="section best-sellers-section">
      <h2 className="best-title">Best Sellers</h2>
      {feedback ? <p className="products-feedback">{feedback}</p> : null}

      <div className="products">
        {loading ? (
          <p className="products-feedback">Loading best sellers...</p>
        ) : products.length === 0 ? (
          <p className="products-feedback">No products available.</p>
        ) : products.map((p) => (
          <ProductChoiceCard
            key={p.id}
            product={p}
            onAddToCart={addToCart}
            variant="bestseller"
            showSafety={false}
          />
        ))}
      </div>
    </section>
  );
}
