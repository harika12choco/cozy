import "../styles/Navbar.css";
import { useEffect, useState } from "react";
import { getCartItems } from "../utils/cart";
import { auth, provider } from "../firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import navLogo from "../assets/navlogo.png";
import Sidebar from "./Sidebar";

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
