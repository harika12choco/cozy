import { useEffect, useMemo, useState } from "react";
import { orderService } from "../services/orderService";
import { productService } from "../services/productService";
import { userService } from "../services/userService";

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 7h2v7h-2v-7zm4 0h2v7h-2v-7zM7 10h2v7H7v-7zm1 10h8a2 2 0 0 0 2-2V8H6v10a2 2 0 0 0 2 2z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Dashboard({ onNavigate }) {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");
        const [productItems, userItems, orderItems] = await Promise.all([
          productService.list(),
          userService.list(),
          orderService.list()
        ]);

        if (!active) {
          return;
        }

        setProducts(productItems);
        setUsers(userItems);
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

  async function handleDeleteOrder(id) {
    try {
      setError("");
      await orderService.remove(id);
      setOrders((current) => current.filter((order) => order.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  const metrics = useMemo(() => {
    const revenue = orders.reduce((total, order) => total + Number(order.total || 0), 0);

    return [
      { label: "Products", value: products.length },
      { label: "Orders", value: orders.length },
      { label: "Users", value: users.length },
      { label: "Revenue", value: `Rs ${revenue}` }
    ];
  }, [orders, products.length, users.length]);

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
            <p>Jump straight into the most common website edits.</p>
          </div>
        </div>

        <div className="admin-quick-grid">
          <button type="button" onClick={() => onNavigate("add-product")}>Add a new candle</button>
          <button type="button" onClick={() => onNavigate("orders")}>Review latest orders</button>
        </div>
      </section>

      <section className="admin-two-col">
        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>Recent orders</h3>
              <p>Latest purchases that may need action.</p>
            </div>
          </div>

          <ul className="admin-list">
            {orders.slice(0, 4).map((order) => (
              <li key={order.id}>
                <div>
                  <strong>{order.customer}</strong>
                  <span>{order.id}</span>
                </div>
                <span>Rs {order.total}</span>
                <div className="admin-inline-actions">
                  <span className={`admin-badge ${order.status}`}>{order.status}</span>
                  <button
                    type="button"
                    className="admin-icon-btn danger"
                    aria-label={`Delete order ${order.id}`}
                    title="Delete"
                    onClick={() => handleDeleteOrder(order.id)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h3>Site settings snapshot</h3>
              <p>Current content controls available to the client.</p>
            </div>
          </div>

          <ul className="admin-list">
            <li><strong>Products in stock</strong><span>{products.filter((item) => item.stock > 0).length}</span></li>
            <li><strong>Registered users</strong><span>{users.length}</span></li>
          </ul>
        </article>
      </section>
    </div>
  );
}
