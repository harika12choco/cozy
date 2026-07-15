/**
 * Sends a JSON error response.
 * In production, 5xx messages are replaced with a generic string to
 * prevent internal details leaking to clients (OWASP A05 / A09).
 */
function sendError(res, error) {
  const status = error.status || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    status >= 500 && isProduction
      ? "Internal server error"
      : error.message || "Internal server error";

  return res.status(status).json({ error: message });
}

module.exports = { sendError };
