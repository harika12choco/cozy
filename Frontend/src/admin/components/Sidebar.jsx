const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "add-product", label: "Add Product" },
  { key: "orders", label: "Orders" },
  { key: "messages", label: "Messages" }
];

export default function Sidebar({ currentPage, onNavigate, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div>
        <p className="admin-sidebar-kicker">Admin Panel</p>
        <h2>Cozy Candle</h2>
      </div>

      <nav className="admin-sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={currentPage === item.key ? "is-active" : ""}
            onClick={() => onNavigate(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <button type="button" className="admin-logout-btn" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
}
