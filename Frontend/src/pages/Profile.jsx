import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });

    return unsubscribe;
  }, []);

  async function handleLogin() {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Unable to sign in:", error);
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Unable to sign out:", error);
    }
  }

  if (!authReady) {
    return (
      <main className="cart-page">
        <section className="cart-empty">
          <h2>Loading profile...</h2>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="cart-page">
        <section className="cart-empty">
          <h2>Please login to view your profile</h2>
          <button className="btn" type="button" onClick={handleLogin}>
            Sign in with Google
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-empty" role="status" aria-live="polite">
        <h2>My Profile</h2>
        <p>{user.displayName || "Customer"}</p>
        <p>{user.email || "No email available"}</p>
        <button className="btn" type="button" onClick={handleLogout}>
          Logout
        </button>
      </section>
    </main>
  );
}
