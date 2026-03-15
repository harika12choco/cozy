import "../styles/shop.css";
import { useEffect, useState } from "react";
import img1 from "../assets/candles/1.png";
import img2 from "../assets/candles/2.png";
import img3 from "../assets/candles/3.png";
import img4 from "../assets/candles/4.png";
import img5 from "../assets/candles/5.png";
import img6 from "../assets/candles/6.png";
import { addItemToCart } from "../utils/cart";

const PRODUCTS_API_URL = import.meta.env.VITE_API_URL ?? "https://cozy-candles-backend.onrender.com/api/products";
const ADMIN_STORAGE_KEY = "cozy-candle-admin-db";

const defaultShopProducts = [
  { id: "shop_1", name: "Vanilla Dream", price: 499, description: "Soft vanilla and warm amber", image: img1, status: "active" },
  { id: "shop_2", name: "Rose Bliss", price: 599, description: "Romantic floral evening glow", image: img2, status: "active" },
  { id: "shop_3", name: "Lavender Calm", price: 549, description: "Relaxing spa-style scent", image: img3, status: "active" },
  { id: "shop_4", name: "Bloom Candle", price: 649, description: "Creamy petals and fresh air", image: img4, status: "active" },
  { id: "shop_5", name: "Golden Luxe", price: 699, description: "Rich vanilla musk finish", image: img5, status: "active" },
  { id: "shop_6", name: "Aroma Haven", price: 579, description: "Herbal calm for cozy nights", image: img6, status: "active" }
];

const imageMap = {
  "/src/assets/candles/1.png": img1,
  "/src/assets/candles/2.png": img2,
  "/src/assets/candles/3.png": img3,
  "/src/assets/candles/4.png": img4,
  "/src/assets/candles/5.png": img5,
  "/src/assets/candles/6.png": img6
};

function formatShopProducts(products) {
  return products
    .filter((product) => product.status !== "draft")
    .map((product) => ({
      id: product.id ?? product.name,
      name: product.name,
      price: `Rs ${product.price}`,
      note: product.description,
      img: imageMap[product.image] ?? product.image ?? img1
    }));
}

function readLegacyProducts() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const savedDb = JSON.parse(window.localStorage.getItem(ADMIN_STORAGE_KEY));
    return Array.isArray(savedDb?.products) ? savedDb.products : [];
  } catch (error) {
    console.error("Unable to read admin product cache:", error);
    return [];
  }
}

function mergeProducts(primaryProducts, secondaryProducts) {
  const productMap = new Map();

  [...secondaryProducts, ...primaryProducts].forEach((product) => {
    const key = product._id ?? product.id ?? product.name;
    productMap.set(key, product);
  });

  return Array.from(productMap.values());
}

async function readShopProducts() {
  const legacyProducts = readLegacyProducts();

  try {
    const response = await fetch(PRODUCTS_API_URL);

    if (!response.ok) {
      throw new Error(`Unable to load products (${response.status})`);
    }

    const products = await response.json();
    const normalizedProducts = Array.isArray(products) ? products : [];
    const sourceProducts = mergeProducts(normalizedProducts, legacyProducts);

    return formatShopProducts(sourceProducts.length > 0 ? sourceProducts : defaultShopProducts);
  } catch (error) {
    console.error("Unable to load storefront products:", error);
    const fallbackProducts = legacyProducts.length > 0 ? legacyProducts : defaultShopProducts;
    return formatShopProducts(fallbackProducts);
  }
}

export default function Shop() {
  const [shopProducts, setShopProducts] = useState(() => formatShopProducts(defaultShopProducts));
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

  return (
    <main className="shop-page">
      <section className="shop-hero">
        <p className="shop-kicker">The Candle Shop</p>
        <h1>Find your next cozy ritual</h1>
        <p className="shop-intro">
          Browse handcrafted candles made to bring warmth, calm, and a soft luxury
          feel into your everyday spaces.
        </p>
      </section>

      <section className="shop-grid-section">
        {feedback ? <p className="shop-feedback">{feedback}</p> : null}
        <div className="shop-grid">
          {shopProducts.map((product) => (
            <article className="shop-card" key={product.id}>
              <div className="shop-card-image">
                <img src={product.img} alt={product.name} />
              </div>

              <div className="shop-card-body">
                <h3>{product.name}</h3>
                <p className="shop-note">{product.note}</p>
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
