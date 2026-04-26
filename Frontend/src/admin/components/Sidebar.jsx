const navItems = [
  { key: "dashboard", label: "Dashboard" },
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "users", label: "Users" },
  { key: "messages", label: "Messages" },
  { key: "discounts", label: "Discounts" },
  { key: "collections", label: "Collections" }
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
