import "../styles/OurProducts.css";
import { useCallback, useEffect, useState } from "react";
import ProductChoiceCard from "./ProductChoiceCard";
import { addItemToCart } from "../utils/cart";
import { readStaticProducts } from "../utils/staticProducts";

export default function OurProducts() {
  const [feedback, setFeedback] = useState("");
  const [products, setProducts] = useState(() => readStaticProducts());

  const refreshProducts = useCallback(() => {
    setProducts(readStaticProducts());
  }, []);

  useEffect(() => {
    window.addEventListener("cozy-admin-products-updated", refreshProducts);
    window.addEventListener("storage", refreshProducts);
    return () => {
      window.removeEventListener("cozy-admin-products-updated", refreshProducts);
      window.removeEventListener("storage", refreshProducts);
    };
  }, [refreshProducts]);

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
    <section id="our-products" className="section our-products-section">
      <h2 className="our-products-title">Our Products</h2>
      {feedback ? <p className="products-feedback">{feedback}</p> : null}

      <div className="products">
        {products.length === 0 ? (
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
