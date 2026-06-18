const Order = require("../models/Order");
const Product = require("../models/productModel");
const mongoose = require("mongoose");
const { getStaticProductById, isStaticProductId } = require("../utils/staticProducts");
const { getFragranceDisplayName, getFragrancePriceAdjustment, parseProductPrice } = require("../utils/productPricing");
const variantPricePattern = /(?:rs\.?|inr|₹)\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[-–]\s*([0-9]+(?:\.[0-9]+)?))?/i;

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
    .map((item) => {
      const productId = String(item.productId ?? item.id ?? "").trim();
      const staticProduct = getStaticProductById(productId);
      const selectedColor = normalizeSelectedOption(item.selectedColor, "color");
      const selectedFragrance = normalizeSelectedOption(item.selectedFragrance, "fragrance");
      const selectedVariant = normalizeSelectedVariant(item.selectedVariant);
      const productName = String(staticProduct?.name ?? item.productName ?? item.name ?? "").trim();
      const basePrice = parseProductPrice(selectedVariant?.price || item.basePrice || staticProduct?.basePrice);
      const fragranceExtraCharge = item.fragranceExtraCharge !== undefined
        ? parseProductPrice(item.fragranceExtraCharge)
        : getFragrancePriceAdjustment(selectedFragrance);
      const fallbackFinalPrice = parseProductPrice(item.finalPrice ?? item.price);
      const finalPrice = basePrice > 0 ? basePrice + fragranceExtraCharge : fallbackFinalPrice;

      return {
        productId,
        productName,
        name: productName,
        basePrice,
        fragranceExtraCharge,
        finalPrice,
        price: `Rs ${finalPrice}`,
        quantity: Number(item.quantity ?? 0),
        selectedColor,
        selectedFragrance,
        selectedVariant
      };
    })
    .filter((item) => item.name && item.price && item.quantity > 0);
}

function normalizeSelectedOption(value, optionType = "fragrance") {
  if (!value || typeof value !== "object") {
    return null;
  }

  const name = optionType === "fragrance"
    ? getFragranceDisplayName(value)
    : String(value.name ?? "").trim();

  if (!name) {
    return null;
  }

  return {
    optionId: String(value.optionId ?? value.id ?? value._id ?? "").trim(),
    name,
    hexCode: String(value.hexCode ?? "").trim().toUpperCase(),
    priceAdjustment: optionType === "fragrance" ? getFragrancePriceAdjustment(value) : 0
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

function normalizeSelectedVariant(value) {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    const match = value.match(variantPricePattern);
    const name = match ? value.slice(0, match.index).trim() : value.trim();

    if (!name) {
      return null;
    }

    return {
      optionId: slugify(name),
      name,
      price: match ? parseProductPrice(match[1]) : 0,
      weight: "",
      sku: "",
      stock: 0
    };
  }

  const name = String(value.name ?? "").trim();

  if (!name) {
    return null;
  }

  return {
    optionId: String(value.optionId ?? value.id ?? value._id ?? slugify(name)).trim(),
    name,
    price: parseProductPrice(value.price),
    weight: String(value.weight ?? "").trim(),
    sku: String(value.sku ?? "").trim(),
    stock: Math.max(0, Number(value.stock ?? 0))
  };
}

async function resolveProductId(item) {
  if (item.productId) {
    if (isStaticProductId(item.productId)) {
      return item.productId;
    }

    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      return "";
    }

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
        if (isStaticProductId(item.productId)) {
          continue;
        }

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
      if (isStaticProductId(item.productId)) {
        continue;
      }

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
      .filter((item) => item.productId && !isStaticProductId(item.productId) && mongoose.Types.ObjectId.isValid(item.productId))
      .map((item) =>
        Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } })
      )
  );
}

const listOrders = async (req, res) => {
  try {
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
    payload.items = lineItems.reduce((total, item) => total + item.quantity, 0);
    payload.total = lineItems.reduce((total, item) => total + item.finalPrice * item.quantity, 0);
    payload.paymentAmount = payload.total;

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
