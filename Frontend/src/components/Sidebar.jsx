import { useEffect, useState } from "react";
import menuData, { slugifyCategory } from "../utils/menuData";
import "../styles/components/Sidebar.css";

export default function Sidebar({ isOpen, onClose, onNavigate }) {
  const [activeIndex, setActiveIndex] = useState(0);

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

  function toggle(index) {
    setActiveIndex((currentIndex) => (currentIndex === index ? null : index));
  }

  function navigateToCategory(category) {
    onNavigate?.({ type: "category", value: category, slug: slugifyCategory(category) });
    onClose();
  }

  function navigateHome() {
    onNavigate?.("home");
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

        {menuData.map((section, index) => (
          <div key={section.title} className="menu-section">
            <div className="menu-row">
              <button
                type="button"
                className="menu-title"
                onClick={() => navigateToCategory(section.title)}
              >
                <span>{section.title}</span>
              </button>
              <button
                type="button"
                className="menu-toggle"
                onClick={() => toggle(index)}
                aria-label={activeIndex === index ? `Collapse ${section.title}` : `Expand ${section.title}`}
              >
                <span className="menu-indicator">{activeIndex === index ? "-" : "+"}</span>
              </button>
            </div>

            <div className={`submenu ${activeIndex === index ? "submenu-open" : ""}`}>
              {section.items.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="submenu-link"
                  onClick={() => navigateToCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="sidebar-footer-label">Browse Categories</p>
      </aside>
    </>
  );
}
