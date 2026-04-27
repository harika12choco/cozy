const statuses = ["pending", "processing", "delivered"];

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

export default function OrderTable({ orders, onStatusChange, onDelete }) {
  return (
    <div className="admin-table-shell">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Email</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>
                <div className="admin-table-title">
                  <strong>{order.customer}</strong>
                  <span>{order.phone || "No phone"}</span>
                  <span>{order.address || "No address"}</span>
                </div>
              </td>
              <td>{order.email || "No email"}</td>
              <td>{order.date}</td>
              <td>
                <div style={{ maxHeight: "100px", overflowY: "auto", fontSize: "0.85em" }}>
                  {order.lineItems && order.lineItems.length > 0 ? (
                    <ul style={{ paddingLeft: "15px", margin: 0 }}>
                      {order.lineItems.map((item, idx) => (
                        <li key={idx}>
                          {item.name} x{item.quantity} ({item.price})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>{order.items} items</span>
                  )}
                </div>
              </td>
              <td>Rs {order.total}</td>
              <td>{order.payment}</td>
              <td>
                <select
                  className="admin-select"
                  value={order.status}
                  onChange={(event) => onStatusChange(order.id, event.target.value)}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </td>
              <td>
                <button
                  type="button"
                  className="admin-icon-btn danger"
                  aria-label={`Delete order ${order.id}`}
                  title="Delete"
                  onClick={() => onDelete(order.id)}
                >
                  <DeleteIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
