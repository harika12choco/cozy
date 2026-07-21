const { getFirebaseAdmin } = require("../config/firebaseAdmin");

/**
 * CRIT-2 FIX: Verifies the Firebase ID token from the Authorization header.
 * The token is issued by Firebase Auth and cryptographically verified
 * via the Firebase Admin SDK — no client can forge it.
 */
async function authenticateUser(req, res, next) {
  const authHeader = String(req.headers.authorization || "");

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "User authentication required" });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ error: "User authentication required" });
  }

  const firebaseAdmin = getFirebaseAdmin();

  if (!firebaseAdmin) {
    return res.status(503).json({ error: "Authentication service unavailable. Contact support." });
  }

  try {
    // SEC-02 FIX: Pass true to verifyIdToken to check if token has been revoked or user disabled
    const decoded = await firebaseAdmin.auth().verifyIdToken(token, true);
    req.user = {
      id: decoded.uid,
      email: decoded.email || ""
    };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired user token" });
  }
}

module.exports = { authenticateUser };
