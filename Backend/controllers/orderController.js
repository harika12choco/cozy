const Order = require("../models/Order");
const Product = require("../models/productModel");
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

function normalizeLineItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      productId: String(item.productId ?? item.id ?? "").trim(),
      name: String(item.name ?? "").trim(),
      price: String(item.price ?? "").trim(),
      quantity: Number(item.quantity ?? 0)
    }))
    .filter((item) => item.name && item.price && item.quantity > 0);
}

async function resolveProductId(item) {
  if (item.productId) {
    return item.productId;
  }

  if (!item.name) {
    return "";
  }

  const product = await Product.findOne({ name: item.name });
  return product?._id ? String(product._id) : "";
}

async function reserveStock(lineItems) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      for (const item of lineItems) {
        const productId = await resolveProductId(item);

        if (!productId) {
          throw new Error(`Missing product id for ${item.name || "item"}`);
        }

        item.productId = productId;

        const updated = await Product.findOneAndUpdate(
          { _id: productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );

        if (!updated) {
          throw new Error(`Out of stock: ${item.name || item.productId}`);
        }
      }
    });

    return;
  } catch (error) {
    if (!/Transaction numbers are only allowed/.test(error.message)) {
      throw error;
    }
  } finally {
    session.endSession();
  }

  const reserved = [];

  try {
    for (const item of lineItems) {
      const productId = await resolveProductId(item);

      if (!productId) {
        throw new Error(`Missing product id for ${item.name || "item"}`);
      }

      item.productId = productId;

      const updated = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!updated) {
        throw new Error(`Out of stock: ${item.name || item.productId}`);
      }

      reserved.push({ productId, quantity: item.quantity });
    }
  } catch (error) {
    await Promise.all(
      reserved.map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      )
    );
    throw error;
  }
}

async function releaseStock(lineItems) {
  await Promise.all(
    lineItems
      .filter((item) => item.productId)
      .map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      )
  );
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
    const lineItems = normalizeLineItems(payload.lineItems ?? []);

    if (!isValidPincode(payload.pincode)) {
      return res.status(400).json({ error: "Pincode must be exactly 6 digits." });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: "Order items are required." });
    }

    payload.lineItems = lineItems;

    try {
      await reserveStock(lineItems);
    } catch (stockError) {
      return res.status(409).json({ error: stockError.message || "Out of stock" });
    }

    const order = new Order(payload);

    try {
      await order.save();
    } catch (saveError) {
      await releaseStock(lineItems);
      throw saveError;
    }

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
