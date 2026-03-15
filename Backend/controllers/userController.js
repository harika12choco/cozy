const User = require("../models/User");

const defaultUsers = [
  { name: "Aarav Mehta", email: "aarav@example.com", role: "Customer", status: "active", joined: "2026-02-18", orders: 4 },
  { name: "Sara Khan", email: "sara@example.com", role: "Client", status: "active", joined: "2026-01-30", orders: 7 },
  { name: "Neil Roy", email: "neil@example.com", role: "Customer", status: "blocked", joined: "2026-02-05", orders: 1 }
];

async function ensureDefaults() {
  const total = await User.countDocuments();
  if (total === 0) {
    await User.insertMany(defaultUsers);
  }
}

const listUsers = async (req, res) => {
  try {
    await ensureDefaults();
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listUsers,
  updateUser,
  deleteUser
};
