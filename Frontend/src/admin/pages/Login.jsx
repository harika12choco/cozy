import { useState } from "react";
import "../styles/admin.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const result = onLogin({ username, password });

    if (result?.error) {
      setError(result.error);
      return;
    }

    setError("");
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <p className="admin-sidebar-kicker">Admin Access</p>
        <h1>Manage your candle website</h1>
        <p className="admin-page-subtitle">
          Update products, monitor orders, edit banners, and control discounts
          from one place.
        </p>

        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>

        <label>
          Password
          <div className="admin-password-field">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="admin-password-toggle"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        {error ? <p className="products-feedback">{error}</p> : null}

        <button className="btn admin-login-btn" type="submit">
          Enter Dashboard
        </button>
      </form>
    </div>
  );
}
