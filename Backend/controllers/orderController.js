const Order = require("../models/Order");
const mongoose = require("mongoose");

function isValidPincode(value) {
  return /^[0-9]{6}$/.test(String(value || "").trim());
}

function normalizeOrderPayload(payload = {}, partial = false) {
  const normalized = {
    ...payload
  };

  if (!partial || payload.pincode !== undefined) {
    normalized.pincode = String(payload.pincode || "").trim();
  }

  if (!partial || payload.phone !== undefined) {
    normalized.phone = String(payload.phone || "").trim();
  }

  return normalized;
}

const defaultOrders = [
  { customer: "Anika Sharma", total: 1098, status: "processing", date: "2026-03-10", items: 2, payment: "Paid", email: "", phone: "9876543210", pincode: "560001", address: "MG Road" },
  { customer: "Riya Kapoor", total: 599, status: "delivered", date: "2026-03-09", items: 1, payment: "Paid", email: "", phone: "9123456789", pincode: "560034", address: "Koramangala" },
  { customer: "Maya Singh", total: 1647, status: "pending", date: "2026-03-11", items: 3, payment: "Pending", email: "", phone: "9988776655", pincode: "560078", address: "JP Nagar" }
];

async function ensureDefaults() {
  const total = await Order.countDocuments();
  if (total === 0) {
    await Order.insertMany(defaultOrders);
  }
}

const listOrders = async (req, res) => {
  try {
    await ensureDefaults();
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const payload = normalizeOrderPayload(req.body, false);

    if (!isValidPincode(payload.pincode)) {
      return res.status(400).json({ error: "Pincode must be exactly 6 digits." });
    }

    const order = new Order(payload);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const payload = normalizeOrderPayload(req.body, true);

    if (payload.pincode && !isValidPincode(payload.pincode)) {
      return res.status(400).json({ error: "Pincode must be exactly 6 digits." });
    }

    const order = await Order.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder
};
