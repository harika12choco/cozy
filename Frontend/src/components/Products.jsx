import "../styles/Products.css";
import img1 from "../assets/candles/1.png";
import img2 from "../assets/candles/2.png";
import img3 from "../assets/candles/3.png";
import { useEffect, useState } from "react";
import { addItemToCart } from "../utils/cart";
import { productService } from "../admin/services/productService";

const fallbackProducts = [
  {
    name: "Vanilla Dream",
    price: 499,
    image: img1,
    bestSeller: true,
    status: "active"
  },
  {
    name: "Rose Bliss",
    price: 599,
    image: img2,
    bestSeller: true,
    status: "active"
  },
  {
    name: "Lavender Calm",
    price: 549,
    image: img3,
    bestSeller: true,
    status: "active"
  }
];

const fallbackImageMap = {
  "Vanilla Dream": img1,
  "Rose Bliss": img2,
  "Lavender Calm": img3
};

export default function Products() {
  const [feedback, setFeedback] = useState("");
  const [products, setProducts] = useState(fallbackProducts);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        const items = await productService.list();

        if (!active) {
          return;
        }

        const activeProducts = items.filter((product) => product.status === "active");
        const selectedBestSellers = activeProducts.filter((product) => product.bestSeller);
        const fallbackProductsFromActive = activeProducts.filter(
          (product) => !selectedBestSellers.some((selected) => selected.id === product.id)
        );
        const displayProducts = [
          ...selectedBestSellers,
          ...fallbackProductsFromActive
        ]
          .slice(0, 3)
          .map((product) => ({
            ...product,
            image: product.image || fallbackImageMap[product.name] || ""
          }));

        if (displayProducts.length > 0) {
          setProducts(displayProducts);
        }
      } catch {
        if (active) {
          setProducts(fallbackProducts);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const addToCart = (product) => {
    addItemToCart({
      ...product,
      img: product.image
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
        {products.map((p, i) => (
          <article className="product" key={i}>
            <div className="product-image-wrap">
              <img src={p.image} alt={p.name} />
            </div>

            <h3>{p.name}</h3>
            <p>Rs {p.price}</p>

            <button
              className="btn"
              onClick={() => addToCart(p)}
            >
              Add to Cart
            </button>

          </article>
        ))}
      </div>
    </section>
  );
}
