const { issueAdminToken, ADMIN_TOKEN_TTL } = require("../middleware/adminAuth");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

function safeEqual(a, b) {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));

  if (first.length !== second.length) {
    return false;
  }

  return crypto.timingSafeEqual(first, second);
}

/**
 * MED-4 FIX: Password is now compared against a bcrypt hash stored in
 * ADMIN_PASSWORD_HASH env var. Falls back to plain-text ADMIN_PASSWORD
 * with a deprecation warning to allow a zero-downtime migration.
 */
async function loginAdmin(req, res) {
  const configuredUsername = String(process.env.ADMIN_USERNAME || "").trim();
  const configuredPasswordHash = String(process.env.ADMIN_PASSWORD_HASH || "");
  const configuredPasswordPlain = String(process.env.ADMIN_PASSWORD || "");

  if (!configuredUsername || (!configuredPasswordHash && !configuredPasswordPlain)) {
    return res.status(500).json({ error: "Admin credentials are not configured" });
  }

  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  if (username.length > 64 || password.length > 128) {
    return res.status(400).json({ error: "Invalid username or password" });
  }

  if (!safeEqual(username, configuredUsername)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  let passwordValid = false;

  if (configuredPasswordHash) {
    // Secure path: compare against bcrypt hash
    passwordValid = await bcrypt.compare(password, configuredPasswordHash);
  } else {
    // Legacy plain-text fallback — warn and continue during migration window
    console.warn(
      "SECURITY WARNING: ADMIN_PASSWORD is plain text. " +
      "Generate a bcrypt hash and set ADMIN_PASSWORD_HASH instead."
    );
    passwordValid = safeEqual(password, configuredPasswordPlain);
  }

  if (!passwordValid) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = issueAdminToken({ username, role: "admin" });

  return res.json({
    token,
    tokenType: "Bearer",
    expiresIn: ADMIN_TOKEN_TTL
  });
}

function verifyAdminToken(req, res) {
  return res.json({ valid: true, admin: req.admin ?? null });
}

module.exports = {
  loginAdmin,
  verifyAdminToken
};
