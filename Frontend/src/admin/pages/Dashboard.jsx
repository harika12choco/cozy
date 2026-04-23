import { useEffect, useMemo, useState } from "react";
import { productService } from "../services/productService";
import { orderService } from "../services/orderService";

export default function Dashboard({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const [productItems, orderItems] = await Promise.all([
          productService.list(),
          orderService.list()
        ]);

        if (!active) {
          return;
        }

        setProducts(productItems);
        setOrders(orderItems);
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

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const revenue = orders.reduce((total, order) => total + Number(order.total || 0), 0);

    return [
      { label: "Products", value: products.length },
      { label: "Orders", value: orders.length },
      { label: "Revenue", value: `Rs ${revenue}` }
    ];
  }, [orders, products.length]);

  return (
    <div className="admin-content-stack">
      {loading ? <p>Loading dashboard...</p> : null}
      <section className="admin-card-grid">
        {metrics.map((metric) => (
          <article className="admin-stat-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </article>
        ))}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Quick actions</h3>
            <p>Access your admin home or open the public storefront.</p>
          </div>
        </div>

        <div className="admin-quick-grid">
          <button type="button" onClick={() => onNavigate("dashboard")}>Refresh dashboard</button>
          <button type="button" onClick={() => window.open("/", "_blank", "noopener,noreferrer")}>Open storefront</button>
        </div>
      </section>
    </div>
  );
}
