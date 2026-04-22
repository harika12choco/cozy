const { issueAdminToken, ADMIN_TOKEN_TTL } = require("../middleware/adminAuth");
const crypto = require("crypto");

function safeEqual(a, b) {
  const first = Buffer.from(String(a));
  const second = Buffer.from(String(b));

  if (first.length !== second.length) {
    return false;
  }

  return crypto.timingSafeEqual(first, second);
}

function loginAdmin(req, res) {
  const configuredUsername = String(process.env.ADMIN_USERNAME || "").trim();
  const configuredPassword = String(process.env.ADMIN_PASSWORD || "");

  if (!configuredUsername || !configuredPassword) {
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

  if (!safeEqual(username, configuredUsername) || !safeEqual(password, configuredPassword)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = issueAdminToken({ username, role: "admin" });

  return res.json({
    token,
    tokenType: "Bearer",
    expiresIn: ADMIN_TOKEN_TTL
  });
}

module.exports = {
  loginAdmin
};
