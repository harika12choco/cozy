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
      <table className="admin-table admin-orders-table">
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
              <td className="admin-order-id">{order.id}</td>
              <td>
                <div className="admin-table-title">
                  <strong>{order.customer}</strong>
                  <span className="admin-order-meta">Phone: {order.phone || "No phone"}</span>
                  <span className="admin-order-meta">Address: {order.address || "No address"}</span>
                </div>
              </td>
              <td className="admin-order-email">{order.email || "No email"}</td>
              <td className="admin-order-date">{order.date}</td>
              <td>
                <div className="admin-order-items">
                  {order.lineItems && order.lineItems.length > 0 ? (
                    <ul className="admin-order-items-list">
                      {order.lineItems.map((item, idx) => (
                        <li key={idx}>
                          <span>{item.productName || item.name}</span>
                          <span className="admin-order-items-qty">x{item.quantity}</span>
                          <span className="admin-order-items-price">{item.price || `Rs ${item.finalPrice || 0}`}</span>
                          {item.selectedColor?.name ? (
                            <span className="admin-order-items-option">Color: {item.selectedColor.name}</span>
                          ) : null}
                          {item.selectedVariant?.name ? (
                            <span className="admin-order-items-option">Variant: {item.selectedVariant.name}</span>
                          ) : null}
                          {item.selectedFragrance?.name ? (
                            <span className="admin-order-items-option">
                              Fragrance: {item.selectedFragrance.name}
                              {Number(item.fragranceExtraCharge ?? item.selectedFragrance.priceAdjustment ?? 0) > 0
                                ? ` (+Rs ${item.fragranceExtraCharge ?? item.selectedFragrance.priceAdjustment})`
                                : ""}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="admin-order-items-empty">{order.items} items</span>
                  )}
                </div>
              </td>
              <td className="admin-order-total">Rs {order.total}</td>
              <td className="admin-order-payment">{order.payment}</td>
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
