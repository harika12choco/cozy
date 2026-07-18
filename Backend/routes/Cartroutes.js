const express = require("express");
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/productModel");
const { authenticateUser } = require("../middleware/userAuth");
const { getStaticProductById, isStaticProductId } = require("../utils/staticProducts");
const {
  calculateFinalPrice: calculateProductFinalPrice,
  getFragranceDisplayName,
  getFragrancePriceAdjustment,
  parseProductPrice
} = require("../utils/productPricing");

const router = express.Router();
const variantPricePattern = /(?:rs\.?|inr|₹)\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[-–]\s*([0-9]+(?:\.[0-9]+)?))?/i;

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

  if (isStaticProductId(productId)) {
    return getStaticProductById(productId);
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return null;
  }

  return Product.findById(productId);
}

function normalizeSelectedOption(value = {}, allowedOptions = [], optionType = "fragrance") {
  const optionId = String(value?.optionId ?? value?.id ?? value?._id ?? "").trim();
  const name = optionType === "fragrance"
    ? getFragranceDisplayName(value)
    : String(value?.name ?? "").trim();

  if (!optionId && !name) {
    return null;
  }

  const match = allowedOptions.find((option) => (
    (optionId && String(option.optionId) === optionId) ||
    (name && String(optionType === "fragrance" ? getFragranceDisplayName(option) : option.name ?? "").toLowerCase() === name.toLowerCase())
  ));

  if (!match) {
    return null;
  }

  return {
    optionId: String(match.optionId ?? ""),
    name: optionType === "fragrance" ? getFragranceDisplayName(match) : match.name,
    hexCode: match.hexCode ?? "",
    priceAdjustment: optionType === "fragrance" ? getFragrancePriceAdjustment(match) : 0
  };
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseVariantLabel(value) {
  const label = String(value ?? "").trim();
  const match = label.match(variantPricePattern);

  if (!match) {
    return {
      name: label,
      price: 0
    };
  }

  return {
    name: label.slice(0, match.index).trim() || label,
    price: parseProductPrice(match[1])
  };
}

function normalizeProductVariant(option, index = 0, fallbackPrice = 0) {
  if (!option) {
    return null;
  }

  if (typeof option === "string") {
    const parsed = parseVariantLabel(option);

    if (!parsed.name) {
      return null;
    }

    return {
      optionId: `variant-${index}-${slugify(parsed.name)}`,
      name: parsed.name,
      price: parsed.price || parseProductPrice(fallbackPrice),
      weight: "",
      sku: "",
      stock: 0
    };
  }

  if (option.enabled === false) {
    return null;
  }

  const name = String(option.name ?? option.label ?? "").trim();

  if (!name) {
    return null;
  }

  return {
    optionId: String(option.optionId ?? option.id ?? option._id ?? `variant-${index}-${slugify(name)}`),
    name,
    price: parseProductPrice(option.price ?? fallbackPrice),
    weight: String(option.weight ?? "").trim(),
    sku: String(option.sku ?? "").trim(),
    stock: Math.max(0, Number(option.stock ?? 0))
  };
}

function normalizeSelectedVariant(value = {}, variants = [], fallbackPrice = 0) {
  const normalizedVariants = variants
    .map((variant, index) => normalizeProductVariant(variant, index, fallbackPrice))
    .filter(Boolean);

  if (normalizedVariants.length === 0) {
    return null;
  }

  const optionId = String(value?.optionId ?? value?.id ?? value?._id ?? "").trim();
  const name = String(value?.name ?? "").trim();
  const match = normalizedVariants.find((variant) => (
    (optionId && String(variant.optionId) === optionId) ||
    (name && variant.name.toLowerCase() === name.toLowerCase())
  ));

  return match ?? normalizedVariants[0];
}

function getPurchasableBasePrice(product, selectedVariant) {
  if (selectedVariant?.price > 0) {
    return selectedVariant.price;
  }

  if (parseProductPrice(product.salePrice) > 0) {
    return parseProductPrice(product.salePrice);
  }

  return parseProductPrice(product.basePrice || product.price);
}

function calculateCartFinalPrice(product, selectedFragrance, selectedVariant = null) {
  return calculateProductFinalPrice(getPurchasableBasePrice(product, selectedVariant), selectedFragrance);
}

function getResolvedProductId(product, fallbackProductId = "") {
  return String(product?._id ?? product?.id ?? product?.productId ?? fallbackProductId ?? "").trim();
}

function formatPrice(value) {
  return `Rs ${parseProductPrice(value)}`;
}

function buildCartKey(product, selectedColor, selectedFragrance, selectedVariant = null, giftWrap = false) {
  return [
    getResolvedProductId(product),
    String(calculateCartFinalPrice(product, selectedFragrance, selectedVariant)),
    selectedVariant?.optionId || selectedVariant?.name || "",
    selectedColor?.optionId || selectedColor?.name || "",
    selectedFragrance?.optionId || selectedFragrance?.name || "",
    giftWrap ? "giftwrap" : "no-giftwrap"
  ].join("::");
}

function getAvailableStock(product, selectedVariant) {
  if (selectedVariant?.stock > 0) {
    return selectedVariant.stock;
  }

  return Math.max(0, Number(product.stock ?? 0));
}

function buildCartItemSnapshot(product, item) {
  const selectedColor = normalizeSelectedOption(item.selectedColor, product.candleColors ?? [], "color");
  const selectedFragrance = normalizeSelectedOption(item.selectedFragrance, product.fragrances ?? [], "fragrance");
  const selectedVariant = normalizeSelectedVariant(
    item.selectedVariant,
    product.variants ?? [],
    product.salePrice || product.basePrice || product.price
  );
  const productId = getResolvedProductId(product, item.productId);
  const basePrice = getPurchasableBasePrice(product, selectedVariant);
  const fragranceExtraCharge = getFragrancePriceAdjustment(selectedFragrance);

  const giftWrap = Boolean(item.giftWrap);
  const configuredGiftWrapPrice = Number(product.giftWrapPrice ?? 80);
  const giftWrapPrice = giftWrap ? configuredGiftWrapPrice : 0;
  const finalPrice = basePrice + fragranceExtraCharge + giftWrapPrice;

  const image = product.image || item.img || "";
  const availableStock = getAvailableStock(product, selectedVariant);

  return {
    key: String(item.key ?? buildCartKey(product, selectedColor, selectedFragrance, selectedVariant, giftWrap)),
    productId,
    name: product.name,
    basePrice,
    fragranceExtraCharge,
    finalPrice,
    price: formatPrice(finalPrice),
    img: image,
    quantity: Math.min(normalizeQuantity(item.quantity ?? 1), availableStock),
    selectedColor,
    selectedFragrance,
    selectedVariant,
    giftWrap,
    giftWrapPrice: configuredGiftWrapPrice
  };
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

    const selectedColor = normalizeSelectedOption(req.body?.selectedColor, product.candleColors ?? [], "color");
    const selectedFragrance = normalizeSelectedOption(req.body?.selectedFragrance, product.fragrances ?? [], "fragrance");
    const selectedVariant = normalizeSelectedVariant(
      req.body?.selectedVariant,
      product.variants ?? [],
      product.salePrice || product.basePrice || product.price
    );
    const availableStock = getAvailableStock(product, selectedVariant);

    if ((product.candleColors ?? []).length > 0 && !selectedColor) {
      return res.status(400).json({ error: "Please select a candle color." });
    }

    if ((product.fragrances ?? []).length > 0 && !selectedFragrance) {
      return res.status(400).json({ error: "Please select a fragrance." });
    }

    const cart = await ensureCart(req.user.id, req.user.email);
    const itemKey = String(req.body?.key ?? buildCartKey(product, selectedColor, selectedFragrance, selectedVariant, req.body?.giftWrap));
    const existingItem = cart.items.find((item) => String(item.key) === itemKey);
    const nextQuantity = Math.min((existingItem?.quantity ?? 0) + quantity, availableStock);
    const nextSnapshot = buildCartItemSnapshot(product, {
      ...req.body,
      key: itemKey,
      productId,
      quantity: nextQuantity,
      selectedColor,
      selectedFragrance,
      selectedVariant,
      giftWrap: req.body?.giftWrap
    });

    if (existingItem) {
      existingItem.set(nextSnapshot);
    } else {
      cart.items.push(nextSnapshot);
    }

    await cart.save();
    res.status(201).json(buildCartResponse(cart, req.user.id, req.user.email));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:itemId", async (req, res) => {
  try {
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

    const quantity = req.body?.quantity !== undefined
      ? normalizeQuantity(req.body.quantity)
      : item.quantity;

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      const giftWrap = req.body?.giftWrap !== undefined
        ? Boolean(req.body.giftWrap)
        : item.giftWrap;

      const nextSnapshot = buildCartItemSnapshot(product, {
        ...item.toObject(),
        quantity,
        giftWrap,
        img: item.img
      });

      // Avoid duplicates with the same key
      const duplicateItem = cart.items.find(
        (x) => String(x.key) === String(nextSnapshot.key) && String(x._id) !== String(item._id)
      );

      if (duplicateItem) {
        duplicateItem.quantity = Math.min(
          duplicateItem.quantity + nextSnapshot.quantity,
          getAvailableStock(product, duplicateItem.selectedVariant)
        );
        item.deleteOne();
      } else {
        item.set(nextSnapshot);
      }
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

    item.deleteOne();
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
        ...buildCartItemSnapshot(product, {
          ...item,
          productId,
          quantity,
          img: item.img
        }),
        key: String(item.key ?? buildCartKey(
          product,
          normalizeSelectedOption(item.selectedColor, product.candleColors ?? [], "color"),
          normalizeSelectedOption(item.selectedFragrance, product.fragrances ?? [], "fragrance"),
          normalizeSelectedVariant(item.selectedVariant, product.variants ?? [], product.salePrice || product.basePrice || product.price)
        ))
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
