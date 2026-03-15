import { useEffect, useState } from "react";
import OrderTable from "../components/OrderTable";
import { orderService } from "../services/orderService";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError("");
        const items = await orderService.list();

        if (active) {
          setOrders(items);
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

    loadOrders();

    return () => {
      active = false;
    };
  }, []);

  async function handleStatusChange(id, status) {
    try {
      setError("");
      const updated = await orderService.updateStatus(id, status);
      setOrders((current) => current.map((order) => (order.id === id ? updated : order)));
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");
      await orderService.remove(id);
      setOrders((current) => current.filter((order) => order.id !== id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>Orders</h3>
          <p>Track customer purchases and update fulfillment status.</p>
        </div>
      </div>

      {loading ? <p>Loading orders...</p> : null}
      <OrderTable
        orders={orders}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </section>
  );
}
