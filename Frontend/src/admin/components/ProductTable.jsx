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

export default function ProductTable({ products, onEdit, onDelete, onBestSellerToggle }) {
  return (
    <div className="admin-table-shell">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Best Seller</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                <div className="admin-product-thumb">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <span>No image</span>
                  )}
                </div>
              </td>
              <td>
                <div className="admin-table-title">
                  <strong>{product.name}</strong>
                  <span>{product.description}</span>
                </div>
              </td>
              <td>{product.category}</td>
              <td>Rs {product.price}</td>
              <td>{product.stock}</td>
              <td>
                <span className={`admin-badge ${product.status}`}>{product.status}</span>
              </td>
              <td>
                <label className="admin-toggle" aria-label={`Toggle ${product.name} as best seller`}>
                  <input
                    type="checkbox"
                    checked={Boolean(product.bestSeller)}
                    onChange={(event) => onBestSellerToggle(product.id, event.target.checked)}
                  />
                  <span className="admin-toggle-track" />
                </label>
              </td>
              <td>
                <div className="admin-table-actions">
                  <button type="button" onClick={() => onEdit(product.id)}>Edit</button>
                  <button
                    type="button"
                    className="admin-icon-btn danger"
                    aria-label={`Delete ${product.name}`}
                    title="Delete"
                    onClick={() => onDelete(product.id)}
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
