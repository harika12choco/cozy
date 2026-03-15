const Order = require("../models/Order");

const defaultOrders = [
  { customer: "Anika Sharma", total: 1098, status: "processing", date: "2026-03-10", items: 2, payment: "Paid", email: "", phone: "", address: "" },
  { customer: "Riya Kapoor", total: 599, status: "delivered", date: "2026-03-09", items: 1, payment: "Paid", email: "", phone: "", address: "" },
  { customer: "Maya Singh", total: 1647, status: "pending", date: "2026-03-11", items: 3, payment: "Pending", email: "", phone: "", address: "" }
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
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
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
