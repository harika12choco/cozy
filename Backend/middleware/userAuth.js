function authenticateUser(req, res, next) {
  const userId = String(req.headers["x-user-id"] || "").trim();
  const email = String(req.headers["x-user-email"] || "").trim();

  if (!userId) {
    return res.status(401).json({ error: "User authentication required" });
  }

  req.user = {
    id: userId,
    email
  };

  return next();
}

module.exports = {
  authenticateUser
};
