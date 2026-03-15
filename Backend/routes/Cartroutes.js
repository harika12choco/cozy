const express = require("express");
const Cart = require("../models/Cart");

const router = express.Router();

router.post("/add", async (req, res) => {
  try {
    const { name, price, image, quantity } = req.body;

    const cartItem = new Cart({
      name,
      price,
      image,
      quantity
    });

    await cartItem.save();

    res.json({
      message: "Product added to cart",
      cartItem
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const cart = await Cart.find();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;