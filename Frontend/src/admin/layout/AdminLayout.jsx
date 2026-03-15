import "../styles/admin.css";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function AdminLayout({
  currentPage,
  onNavigate,
  onLogout,
  title,
  subtitle,
  actions,
  children
}) {
  return (
    <div className="admin-shell">
      <Sidebar currentPage={currentPage} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="admin-main">
        <Navbar title={title} subtitle={subtitle} actions={actions} />
        {children}
      </main>
    </div>
  );
}
