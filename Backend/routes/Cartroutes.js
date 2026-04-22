const express = require("express");
const Cart = require("../models/Cart");

const router = express.Router();

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => ({
      key: String(item.key ?? "").trim(),
      productId: String(item.productId ?? item.id ?? "").trim(),
      name: String(item.name ?? "").trim(),
      price: String(item.price ?? "").trim(),
      img: String(item.img ?? item.image ?? "").trim(),
      quantity: Number(item.quantity ?? 0)
    }))
    .filter((item) => item.key && item.name && item.price && item.quantity > 0);
}

router.get("/:userId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    res.json(cart ?? { userId: req.params.userId, email: req.query.email ?? "", items: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:userId", async (req, res) => {
  try {
    const items = normalizeItems(req.body?.items);

    const cart = await Cart.findOneAndUpdate(
      { userId: req.params.userId },
      {
        userId: req.params.userId,
        email: String(req.body?.email ?? "").trim(),
        items
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true
      }
    );

    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
