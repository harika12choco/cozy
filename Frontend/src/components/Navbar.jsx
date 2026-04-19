import "../styles/Navbar.css";
import { useEffect, useState } from "react";
import { getCartItems } from "../utils/cart";
import { auth, provider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import navLogo from "../assets/navlogo.png";
import Sidebar from "./Sidebar";
import menuData, { slugifyCategory } from "../utils/menuData";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <path
        d="M3 4h2l2.2 10.1a1 1 0 0 0 1 .8h8.7a1 1 0 0 0 1-.8L20 7H7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19" r="1.7" fill="currentColor" />
      <circle cx="17" cy="19" r="1.7" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon-svg">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 8a7 7 0 0 1 14 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Navbar({ activePage, onNavigate }){
  const [cartCount, setCartCount] = useState(() =>
    getCartItems().reduce((total, item) => total + item.quantity, 0)
  );
  const [user, setUser] = useState(() => auth.currentUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartItems().reduce((total, item) => total + item.quantity, 0));
    }

    window.addEventListener("cart-updated", syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener("cart-updated", syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return unsubscribe;
  }, []);

  async function handleUserAction() {
    try {
      if (user) {
        await signOut(auth);
        return;
      }

      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Unable to sign in:", error);
    }
  }

  return(
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <button
            type="button"
            className="nav-menu-toggle"
            aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setSidebarOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className="left-desktop-nav">
            <ul>
              <li>
                <button type="button" onClick={() => onNavigate("home")}>Home</button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate({ type: "category", value: "Bestsellers", slug: "bestsellers" })}>Bestsellers</button>
              </li>
              <li
                className={`desktop-dropdown ${shopDropdownOpen ? "open" : ""}`}
                onMouseEnter={() => setShopDropdownOpen(true)}
                onMouseLeave={() => setShopDropdownOpen(false)}
              >
                <button type="button" onClick={() => onNavigate("shop")}>Shop All</button>
                <div className={`desktop-dropdown-panel ${shopDropdownOpen ? "open" : ""}`}>
                  <div className="dropdown-grid">
                    <div className="dropdown-grid-section" key="shop-all-root">
                      <div className="dropdown-grid-heading">Browse Categories</div>
                      <button
                        type="button"
                        className="dropdown-grid-item"
                        onClick={() => {
                          onNavigate("shop");
                          setShopDropdownOpen(false);
                        }}
                      >
                        Shop All
                      </button>
                    </div>
                    {menuData.map((section) => (
                      <div className="dropdown-grid-section" key={section.title}>
                        <div className="dropdown-grid-heading">{section.title}</div>
                        <button
                          type="button"
                          className="dropdown-grid-item"
                          onClick={() => {
                            onNavigate({ type: "category", value: section.title, slug: slugifyCategory(section.title) });
                            setShopDropdownOpen(false);
                          }}
                        >
                          {section.title}
                        </button>
                        {section.items.map((item) => (
                          <button
                            key={item}
                            type="button"
                            className="dropdown-grid-item"
                            onClick={() => {
                              onNavigate({ type: "category", value: item, slug: slugifyCategory(item) });
                              setShopDropdownOpen(false);
                            }}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate("contact")}>Contact Us</button>
              </li>
            </ul>
          </nav>
        </div>

        <div className="navbar-center">
          <button type="button" className="logo-button" onClick={() => onNavigate("home")} aria-label="Go to home">
            <img src={navLogo} alt="Cozy Candle" className="logo-image" />
          </button>
        </div>

        <div className="navbar-right">
          <button
            type="button"
            className={`icon-btn ${activePage === "cart" ? "cart-btn-active" : ""}`}
            onClick={() => onNavigate("cart")}
            aria-label="Open cart"
            title="Cart"
          >
            <CartIcon />
            <span className="cart-count">{cartCount}</span>
          </button>

          <button
            type="button"
            className={`icon-btn user-btn ${user ? "user-btn-logged-in" : ""}`}
            onClick={handleUserAction}
            aria-label={user ? "Sign out" : "Login with Google"}
            title={user ? "Sign out" : "Login with Google"}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User profile"}
                className="user-avatar"
              />
            ) : (
              <UserIcon />
            )}
            <span className="user-btn-label">{user ? "Sign out" : "Login"}</span>
          </button>
        </div>
      </nav>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  )
}
