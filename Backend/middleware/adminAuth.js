const jwt = require("jsonwebtoken");

const ADMIN_TOKEN_TTL = process.env.ADMIN_TOKEN_TTL || "8h";

function getAdminSecret() {
  const secret = process.env.ADMIN_JWT_SECRET;

  if (!secret) {
    throw new Error("Missing ADMIN_JWT_SECRET in environment");
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
