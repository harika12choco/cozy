import { useEffect, useMemo, useState } from "react";
import ProductTable from "../components/ProductTable";
import { productService } from "../services/productService";

export default function Products({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");
        const items = await productService.list();

        if (active) {
          setProducts(items);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      active = false;
    };
  }, []);

  const activeCount = useMemo(
    () => products.filter((product) => product.status === "active").length,
    [products]
  );

  const bestSellerCount = useMemo(
    () => products.filter((product) => product.bestSeller).length,
    [products]
  );

  async function handleDelete(id) {
    try {
      setError("");
      await productService.remove(id);
      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  async function handleBestSellerToggle(id, bestSeller) {
    try {
      setError("");
      const current = products.find((product) => product.id === id);

      if (!current) {
        return;
      }

      const updated = await productService.update(id, {
        ...current,
        bestSeller
      });

      setProducts((items) => items.map((product) => (product.id === id ? updated : product)));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  return (
    <div className="admin-content-stack">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Product catalog</h3>
            <p>
              {loading ? "Loading products..." : `${activeCount} active products, ${bestSellerCount} marked as best sellers.`}
            </p>
          </div>

          <button className="btn" type="button" onClick={() => onNavigate("add-product")}>
            Add Product
          </button>
        </div>

        {error ? <p className="products-feedback">{error}</p> : null}

        <ProductTable
          products={products}
          onEdit={(id) => onNavigate("edit-product", id)}
          onDelete={handleDelete}
          onBestSellerToggle={handleBestSellerToggle}
        />
      </section>
    </div>
  );
}
