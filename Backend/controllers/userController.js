const User = require("../models/User");
const mongoose = require("mongoose");
const { sendError } = require("../utils/errorResponse");

const ALLOWED_ROLES = ["Customer", "Client"]; // Admin role cannot be set via API
const ALLOWED_STATUSES = ["active", "blocked"];

const listUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * HIGH-1 FIX: Only whitelisted fields are accepted.
 * Previously the entire req.body was passed to findByIdAndUpdate,
 * allowing privilege escalation (e.g. role: "Admin").
 */
const updateUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const payload = {};

    if (req.body?.name !== undefined)
      payload.name = String(req.body.name).trim();

    if (req.body?.email !== undefined)
      payload.email = String(req.body.email).trim();

    if (req.body?.status !== undefined && ALLOWED_STATUSES.includes(req.body.status))
      payload.status = req.body.status;

    if (req.body?.role !== undefined && ALLOWED_ROLES.includes(req.body.role))
      payload.role = req.body.role;

    if (req.body?.orders !== undefined)
      payload.orders = Math.max(0, Number(req.body.orders) || 0);

    const user = await User.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    sendError(res, error);
  }
};

const deleteUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  listUsers,
  updateUser,
  deleteUser
};
