export default function Navbar({ title, subtitle, actions }) {
  return (
    <header className="admin-topbar">
      <div>
        <p className="admin-page-kicker">Website Management</p>
        <h1>{title}</h1>
        {subtitle ? <p className="admin-page-subtitle">{subtitle}</p> : null}
      </div>

      {actions ? <div className="admin-topbar-actions">{actions}</div> : null}
    </header>
  );
}
