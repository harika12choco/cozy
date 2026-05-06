import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { slugifyCategory } from "../utils/menuData";
import "../styles/CategoryNav.css";

const categoryLinks = [
  "Floral & Aesthetic",
  "Jar & Bowl Collection",
  "Customized",
  "Wedding & Event",
  "Moments & Memories",
  "Gifting Collection",
  "Festive Collection",
  "Dessert Candle Collection"
];

const visibleDesktopLinks = categoryLinks.slice(0, 7);
const moreDesktopLinks = categoryLinks.slice(7);

export default function CategoryNav({ onNavigate }) {
  const [moreOpen, setMoreOpen] = useState(false);

  function navigateCategory(category) {
    onNavigate?.({ type: "category", value: category, slug: slugifyCategory(category) });
    setMoreOpen(false);
  }

  return (
    <nav className="category-nav" aria-label="Product categories">
      <div className="category-nav-inner">
        <div className="category-nav-desktop-links">
          {visibleDesktopLinks.map((category) => (
            <button type="button" key={category} onClick={() => navigateCategory(category)}>
              {category}
            </button>
          ))}

          {moreDesktopLinks.length > 0 ? (
            <div className={`category-nav-more ${moreOpen ? "open" : ""}`}>
              <button
                type="button"
                className="category-nav-more-trigger"
                onClick={() => setMoreOpen((current) => !current)}
                aria-expanded={moreOpen}
              >
                More <FaChevronDown aria-hidden="true" />
              </button>
              <div className="category-nav-more-menu">
                {moreDesktopLinks.map((category) => (
                  <button type="button" key={category} onClick={() => navigateCategory(category)}>
                    {category}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="category-nav-mobile-links">
          {categoryLinks.map((category) => (
            <button type="button" key={category} onClick={() => navigateCategory(category)}>
              {category}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
