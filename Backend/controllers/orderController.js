const Order = require("../models/Order");
const Product = require("../models/productModel");
const mongoose = require("mongoose");
const { getStaticProductById, isStaticProductId } = require("../utils/staticProducts");
const { getFragranceDisplayName, getFragrancePriceAdjustment, parseProductPrice } = require("../utils/productPricing");
const { loadCustomizationCatalog, resolveProductOptions } = require("../utils/productOptions");
const { sendError } = require("../utils/errorResponse");
const variantPricePattern = /(?:rs\.?|inr|₹)\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[-–]\s*([0-9]+(?:\.[0-9]+)?))?/i;

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function toNonNegativeNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : 0;
}

function getOrderDate(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getOrderDateString(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return getOrderDate(value).toISOString().slice(0, 10);
}

function isValidPincode(value) {
  return /^[0-9]{6}$/.test(String(value || "").trim());
}

function normalizeOrderPayload(payload = {}, partial = false) {
  const normalized = {
    ...payload
  };

  if (!partial || payload.customer !== undefined || payload.customerName !== undefined) {
    const customerName = String(payload.customerName ?? payload.customer ?? "").trim();
    normalized.customer = customerName;
    normalized.customerName = customerName;
  }

  if (!partial || payload.email !== undefined) {
    normalized.email = String(payload.email || "").trim();
  }

  if (!partial || payload.pincode !== undefined) {
    normalized.pincode = String(payload.pincode || "").trim();
  }

  if (!partial || payload.phone !== undefined) {
    normalized.phone = String(payload.phone || "").trim();
  }

  if (!partial || payload.address !== undefined) {
    normalized.address = String(payload.address || "").trim();
  }

  if (!partial || payload.date !== undefined || payload.orderDate !== undefined) {
    const dateValue = payload.orderDate ?? payload.date;
    normalized.date = getOrderDateString(dateValue);
    normalized.orderDate = getOrderDate(dateValue);
  }

  if (!partial || payload.deliveryCharge !== undefined) {
    normalized.deliveryCharge = toNonNegativeNumber(payload.deliveryCharge);
  }

  if (!partial || payload.paymentMethod !== undefined) {
    normalized.paymentMethod = String(payload.paymentMethod || "").trim();
  }

  if (!partial || payload.paymentStatus !== undefined) {
    normalized.paymentStatus = String(payload.paymentStatus || "").trim();
  }

  if (!partial || payload.payment !== undefined || payload.paymentStatus !== undefined) {
    normalized.payment = String(payload.payment ?? payload.paymentStatus ?? "Pending").trim();
  }

  if (!partial || payload.razorpayOrderId !== undefined) {
    normalized.razorpayOrderId = String(payload.razorpayOrderId || "").trim();
  }

  if (!partial || payload.razorpayPaymentId !== undefined) {
    normalized.razorpayPaymentId = String(payload.razorpayPaymentId || "").trim();
  }

  if (!partial || payload.recipientName !== undefined) {
    normalized.recipientName = String(payload.recipientName || "").trim();
  }

  if (!partial || payload.giftMessage !== undefined) {
    normalized.giftMessage = String(payload.giftMessage || "").trim();
  }

  if (!partial || payload.giftWrap !== undefined) {
    normalized.giftWrap = Boolean(payload.giftWrap);
  }

  if (!partial || payload.giftWrapPrice !== undefined) {
    normalized.giftWrapPrice = Number(payload.giftWrapPrice || 0);
  }

  return normalized;
}

function normalizeSelectedOption(value, allowedOptions = [], optionType = "fragrance") {
  if (!value) return null;
  const optionId = String(value.optionId ?? value.id ?? value._id ?? "").trim();
  const name = optionType === "fragrance"
    ? getFragranceDisplayName(value)
    : String(value.name ?? "").trim();

  if (!optionId && !name) {
    return null;
  }

  const match = allowedOptions.find((option) => (
    (optionId && String(option.optionId ?? option._id ?? option.id ?? "") === optionId) ||
    (name && String(optionType === "fragrance" ? getFragranceDisplayName(option) : option.name ?? "").toLowerCase() === name.toLowerCase())
  ));

  if (!match) {
    return null;
  }

  return {
    optionId: String(match.optionId ?? match._id ?? match.id ?? ""),
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

function normalizeSelectedVariant(value, allowedVariants = [], fallbackPrice = 0) {
  if (!value) return null;
  const optionId = String(value.optionId ?? value.id ?? value._id ?? "").trim();
  const name = String(value.name ?? "").trim();

  const match = allowedVariants.find((variant) => (
    (optionId && String(variant.optionId ?? variant._id ?? variant.id ?? "") === optionId) ||
    (name && variant.name.toLowerCase() === name.toLowerCase())
  ));

  if (!match && allowedVariants.length > 0) {
    return {
      optionId: String(allowedVariants[0].optionId ?? allowedVariants[0]._id ?? allowedVariants[0].id ?? ""),
      name: allowedVariants[0].name,
      price: parseProductPrice(allowedVariants[0].price ?? fallbackPrice),
      weight: String(allowedVariants[0].weight ?? "").trim(),
      sku: String(allowedVariants[0].sku ?? "").trim(),
      stock: Math.max(0, Number(allowedVariants[0].stock ?? 0))
    };
  }

  if (!match) return null;

  return {
    optionId: String(match.optionId ?? match._id ?? match.id ?? ""),
    name: match.name,
    price: parseProductPrice(match.price ?? fallbackPrice),
    weight: String(match.weight ?? "").trim(),
    sku: String(match.sku ?? "").trim(),
    stock: Math.max(0, Number(match.stock ?? 0))
  };
}

async function normalizeLineItemsAsync(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  const catalog = await loadCustomizationCatalog();
  const result = [];
  for (const item of items) {
    const productId = String(item.productId ?? item.id ?? "").trim();
    if (!productId) {
      continue;
    }

    let product = null;
    const staticProduct = getStaticProductById(productId);

    if (staticProduct) {
      product = staticProduct;
    } else if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId).lean();
    }

    if (!product) {
      throw createHttpError(400, `Product not found: ${productId}`);
    }

    // Resolve the same options the storefront showed (product options, or the shared
    // customization catalog when the product has none) so the customer's choice is
    // validated, priced, and recorded instead of silently dropped.
    const { candleColors, fragrances } = resolveProductOptions(product, catalog);
    const variants = product.variants ?? [];
    const fallbackPrice = product.salePrice || product.basePrice || product.price;

    const selectedColor = normalizeSelectedOption(item.selectedColor, candleColors, "color");
    const selectedFragrance = normalizeSelectedOption(item.selectedFragrance, fragrances, "fragrance");
    const selectedVariant = normalizeSelectedVariant(item.selectedVariant, variants, fallbackPrice);
    const productName = String(product.name || "").trim();

    if (candleColors.length > 0 && !selectedColor) {
      throw createHttpError(400, `Please select a valid candle color for ${productName}.`);
    }

    if (fragrances.length > 0 && !selectedFragrance) {
      throw createHttpError(400, `Please select a valid fragrance for ${productName}.`);
    }

    let basePrice = 0;
    if (selectedVariant) {
      basePrice = selectedVariant.price;
    } else {
      basePrice = parseProductPrice(fallbackPrice);
    }

    const fragranceExtraCharge = selectedFragrance ? selectedFragrance.priceAdjustment : 0;
    const giftWrap = Boolean(item.giftWrap);
    const configuredGiftWrapPrice = Number(product.giftWrapPrice ?? 80);
    const giftWrapPrice = giftWrap ? configuredGiftWrapPrice : 0;
    const finalPrice = basePrice + fragranceExtraCharge + giftWrapPrice;

    result.push({
      productId,
      productName,
      name: productName,
      basePrice,
      fragranceExtraCharge,
      giftWrap,
      giftWrapPrice: configuredGiftWrapPrice,
      finalPrice,
      price: `Rs ${finalPrice}`,
      quantity: Math.min(Math.max(1, Math.floor(Number(item.quantity ?? 1))), 99),
      selectedColor,
      selectedFragrance,
      selectedVariant
    });
  }

  return result.filter((item) => item.name && item.quantity > 0);
}

async function prepareOrderPayload(payload = {}) {
  const normalized = normalizeOrderPayload(payload, false);
  const lineItems = await normalizeLineItemsAsync(normalized.lineItems ?? normalized.products ?? []);

  if (!normalized.customer) {
    throw createHttpError(400, "Customer name is required.");
  }

  if (!isValidPincode(normalized.pincode)) {
    throw createHttpError(400, "Pincode must be exactly 6 digits.");
  }

  if (lineItems.length === 0) {
    throw createHttpError(400, "Order items are required.");
  }

  const quantity = lineItems.reduce((total, item) => total + item.quantity, 0);
  const subtotal = lineItems.reduce((total, item) => total + item.finalPrice * item.quantity, 0);

  // Secure Shipping Calculation (Part 6)
  const deliveryCharge = subtotal < 1500 ? 190 : 390;
  const total = subtotal + deliveryCharge;
  const paymentMethod = normalized.paymentMethod || normalized.payment || "Cash on Delivery (COD)";
  const paymentStatus = normalized.paymentStatus || normalized.payment || "Pending";

  return {
    ...normalized,
    customerName: normalized.customerName || normalized.customer,
    lineItems,
    products: lineItems,
    items: quantity,
    quantity,
    subtotal,
    deliveryCharge,
    total,
    paymentAmount: total,
    paymentMethod,
    paymentStatus,
    payment: normalized.payment || paymentStatus,
    date: normalized.date || getOrderDateString(normalized.orderDate),
    orderDate: normalized.orderDate || getOrderDate(normalized.date)
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

async function saveOrderFromPayload(payload = {}) {
  const orderPayload = await prepareOrderPayload(payload);

  try {
    await reserveStock(orderPayload.lineItems);
  } catch (stockError) {
    throw createHttpError(409, stockError.message || "Out of stock");
  }

  const order = new Order(orderPayload);

  try {
    await order.save();
  } catch (saveError) {
    await releaseStock(orderPayload.lineItems);
    throw saveError;
  }

  return order;
}

const listOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    sendError(res, error);
  }
};

const createOrder = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      placedByUid: req.user.id,
      email: req.user.email || req.body.email
    };
    const order = await saveOrderFromPayload(payload);
    res.status(201).json(order);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
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
    sendError(res, error);
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
    sendError(res, error);
  }
};

module.exports = {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  prepareOrderPayload,
  saveOrderFromPayload
};
