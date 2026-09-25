import { useEffect } from "react";
import menuData, { slugifyCategory } from "../utils/menuData";
import "../styles/components/Sidebar.css";

export default function Sidebar({ isOpen, onClose, onNavigate }) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  function navigateToCategory(category) {
    onNavigate?.({ type: "category", value: category, slug: slugifyCategory(category) });
    onClose();
  }

  function navigateHome() {
    onNavigate?.("home");
    onClose();
  }

  function navigateShop() {
    onNavigate?.("shop");
    onClose();
  }

  return (
    <>
      <button
        type="button"
        className={`sidebar-backdrop ${isOpen ? "sidebar-backdrop-visible" : ""}`}
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className={`sidebar ${isOpen ? "open" : ""}`} aria-hidden={!isOpen}>
        <div className="sidebar-header">
          <p className="sidebar-eyebrow">Main Menu</p>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close menu">
            x
          </button>
        </div>

        <button type="button" className="sidebar-home-link" onClick={navigateHome}>
          Home
        </button>

        <button type="button" className="sidebar-home-link" onClick={navigateShop}>
          Shop All
        </button>

        <p className="sidebar-footer-label">Browse Categories</p>

        {menuData.map((section) => (
          <div key={section.title} className="menu-section">
            <div className="menu-row">
              <button
                type="button"
                className="menu-title"
                onClick={() => navigateToCategory(section.title)}
              >
                <span>{section.title}</span>
              </button>
            </div>
          </div>
        ))}
      </aside>
    </>
  );
}
