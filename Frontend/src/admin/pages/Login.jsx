import { useEffect, useRef, useState } from "react";
import "../styles/admin.css";

// A free-tier backend that has gone to sleep takes a while to answer the first request, and the
// password check itself is deliberately slow. Past this point say so, rather than leaving the
// admin looking at a button that appears to have done nothing.
const SLOW_SIGN_IN_NOTICE_MS = 4000;

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slow, setSlow] = useState(false);
  const slowTimer = useRef(null);

  useEffect(() => () => window.clearTimeout(slowTimer.current), []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setSubmitting(true);
    setSlow(false);
    slowTimer.current = window.setTimeout(() => setSlow(true), SLOW_SIGN_IN_NOTICE_MS);

    try {
      const result = await onLogin({ username, password });

      if (result?.error) {
        setError(result.error);
      }
    } finally {
      window.clearTimeout(slowTimer.current);
      setSubmitting(false);
      setSlow(false);
    }
  }

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <p className="admin-sidebar-kicker">Admin Access</p>
        <h1>Admin Sign in</h1>
        <p className="admin-page-subtitle">
          Single-admin access only. Use your admin credentials to manage the store.
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

        {slow ? (
          <p className="admin-login-hint" role="status">
            Still working - the server may be waking up. This can take up to a minute on the
            first sign-in of the day.
          </p>
        ) : null}

        <button className="btn admin-login-btn" type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
