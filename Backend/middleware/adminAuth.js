const jwt = require("jsonwebtoken");

const ADMIN_TOKEN_TTL = process.env.ADMIN_TOKEN_TTL || "8h";

function getAdminSecret() {
  const secret = String(process.env.ADMIN_JWT_SECRET || "").trim().replace(/^["']|["']$/g, "");

  if (!secret) {
    throw new Error("Missing ADMIN_JWT_SECRET in environment");
  }

  // SEC-05 FIX: Enforce minimum 32-character length for HMAC-SHA256 secret key entropy
  if (secret.length < 32 && process.env.NODE_ENV === "production") {
    throw new Error("ADMIN_JWT_SECRET must be at least 32 characters long for production security");
  }

  return secret;
}

function issueAdminToken(payload = {}) {
  return jwt.sign(payload, getAdminSecret(), { expiresIn: ADMIN_TOKEN_TTL });
}

function authenticateAdmin(req, res, next) {
  const authHeader = String(req.headers.authorization || "");

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing admin token" });
  }

  const token = authHeader.slice(7).trim();

  try {
    req.admin = jwt.verify(token, getAdminSecret());
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}

module.exports = {
  authenticateAdmin,
  issueAdminToken,
  ADMIN_TOKEN_TTL
};
