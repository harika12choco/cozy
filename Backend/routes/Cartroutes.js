const express = require("express");
const Cart = require("../models/Cart");
const Product = require("../models/productModel");
const { authenticateUser } = require("../middleware/userAuth");

const router = express.Router();

function normalizeQuantity(value) {
  const quantity = Number(value ?? 0);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
}

function buildCartResponse(cart, userId, email = "") {
  if (!cart) {
    return { userId, email, items: [] };
  }

  return {
    userId: cart.userId,
    email: cart.email,
    items: cart.items
  };
}

async function ensureCart(userId, email = "") {
  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({ userId, email, items: [] });
  }

  if (email && cart.email !== email) {
    cart.email = email;
    await cart.save();
  }

  return cart;
}

async function resolveProduct(productId) {
  if (!productId) {
    return null;
  }

  return Product.findById(productId);
}

router.use(authenticateUser);

router.get("/", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    res.json(buildCartResponse(cart, req.user.id, req.user.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const productId = String(req.body?.productId ?? "").trim();
    const quantity = normalizeQuantity(req.body?.quantity ?? 1);

    if (!productId || quantity <= 0) {
      return res.status(400).json({ error: "Product and quantity are required." });
    }

    const product = await resolveProduct(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: "Out of stock" });
    }

    const cart = await ensureCart(req.user.id, req.user.email);
    const existingItem = cart.items.find((item) => String(item.productId) === productId);
    const nextQuantity = Math.min((existingItem?.quantity ?? 0) + quantity, product.stock);

    if (existingItem) {
      existingItem.quantity = nextQuantity;
    } else {
      cart.items.push({
        key: String(req.body?.key ?? `${productId}::${product.price}`),
        productId,
        name: product.name,
        price: String(product.price),
        img: product.image ?? "",
        quantity: nextQuantity
      });
    }

    await cart.save();
    res.status(201).json(buildCartResponse(cart, req.user.id, req.user.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:itemId", async (req, res) => {
  try {
    const quantity = normalizeQuantity(req.body?.quantity);
    const cart = await ensureCart(req.user.id, req.user.email);
    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    const product = await resolveProduct(item.productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ error: "Out of stock" });
    }

    if (quantity <= 0) {
      item.remove();
    } else {
      item.quantity = Math.min(quantity, product.stock);
      item.price = String(product.price);
      item.name = product.name;
      item.img = product.image ?? "";
    }

    await cart.save();
    res.json(buildCartResponse(cart, req.user.id, req.user.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:itemId", async (req, res) => {
  try {
    const cart = await ensureCart(req.user.id, req.user.email);
    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    item.remove();
    await cart.save();
    res.json(buildCartResponse(cart, req.user.id, req.user.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/", async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const cart = await ensureCart(req.user.id, req.user.email);
    const nextItems = [];

    for (const item of items) {
      const productId = String(item.productId ?? item.id ?? "").trim();
      const quantity = normalizeQuantity(item.quantity ?? 1);

      if (!productId || quantity <= 0) {
        continue;
      }

      const product = await resolveProduct(productId);

      if (!product || product.stock <= 0) {
        continue;
      }

      nextItems.push({
        key: String(item.key ?? `${productId}::${product.price}`),
        productId,
        name: product.name,
        price: String(product.price),
        img: product.image ?? "",
        quantity: Math.min(quantity, product.stock)
      });
    }

    cart.items = nextItems;
    await cart.save();
    res.json(buildCartResponse(cart, req.user.id, req.user.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
