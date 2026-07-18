const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const Product = require("../models/productModel");
const { getStaticProductById, isStaticProductId } = require("../utils/staticProducts");
const { getFragrancePriceAdjustment, parseProductPrice } = require("../utils/productPricing");
const {
  prepareOrderPayload,
  saveOrderFromPayload
} = require("./orderController");

const RAZORPAY_CURRENCY = "INR";

let razorpayInstance = null;

function createPaymentError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getRazorpayInstance() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim().replace(/^["']|["']$/g, "");
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim().replace(/^["']|["']$/g, "");

  if (!keyId || !keySecret) {
    throw createPaymentError(500, "Razorpay credentials are not configured.");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }

  return razorpayInstance;
}

function toRazorpayAmount(amount) {
  return Math.round(Number(amount || 0) * 100);
}

function buildReceiptId() {
  return `cc_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`.slice(0, 40);
}

function buildOrderNotes(orderPayload) {
  return {
    customerName: String(orderPayload.customerName || orderPayload.customer || "").slice(0, 256),
    phone: String(orderPayload.phone || "").slice(0, 256),
    pincode: String(orderPayload.pincode || "").slice(0, 256)
  };
}

function isValidSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim().replace(/^["']|["']$/g, "");

  if (!keySecret || !/^[a-f0-9]{64}$/i.test(String(razorpaySignature || ""))) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const generatedBuffer = Buffer.from(generatedSignature, "hex");
  const receivedBuffer = Buffer.from(razorpaySignature, "hex");

  return generatedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(generatedBuffer, receivedBuffer);
}

function getOrderPayloadFromRequest(body = {}) {
  return body.order || body.orderData || body;
}

function getPaymentErrorMessage(error) {
  return error?.error?.description
    || error?.error?.reason
    || error?.message
    || "Payment request failed.";
}

/**
 * HIGH-3 FIX: Compute the authoritative order total from server-side prices.
 * Re-fetches prices from static product list or MongoDB — never trusts
 * client-supplied basePrice / finalPrice values.
 *
 * Returns the server-computed total in rupees.
 */
async function computeServerSideTotal(lineItems, deliveryCharge = 0) {
  let subtotal = 0;

  for (const item of lineItems) {
    const productId = String(item.productId || "").trim();
    let basePrice = 0;

    const staticProduct = getStaticProductById(productId);

    if (staticProduct) {
      // Static product — resolve variant price
      if (item.selectedVariant?.name) {
        const variant = (staticProduct.variants || []).find(
          (v) => v.name === item.selectedVariant.name
        );
        basePrice = parseProductPrice(
          variant?.price || staticProduct.salePrice || staticProduct.basePrice || staticProduct.price
        );
      } else {
        basePrice = parseProductPrice(
          staticProduct.salePrice || staticProduct.basePrice || staticProduct.price
        );
      }
    } else if (productId && mongoose.Types.ObjectId.isValid(productId)) {
      // DB product — fetch authoritative price
      const product = await Product.findById(productId).lean();

      if (!product) {
        throw createPaymentError(400, `Product not found: ${productId}`);
      }

      if (item.selectedVariant?.name) {
        const variant = (product.variants || []).find(
          (v) => v.name === item.selectedVariant.name && v.enabled !== false
        );
        basePrice = parseProductPrice(
          variant?.price || product.salePrice || product.basePrice || product.price
        );
      } else {
        basePrice = parseProductPrice(
          product.salePrice || product.basePrice || product.price
        );
      }
    } else {
      // Cannot verify price — reject the request
      throw createPaymentError(400, `Cannot verify price for item: ${item.name || productId}`);
    }

    // Fragrance adjustment — cap at 0 minimum, trust server-stored value via priceAdjustment
    const fragranceCharge = Math.max(
      0,
      getFragrancePriceAdjustment(item.selectedFragrance)
    );

    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    subtotal += (basePrice + fragranceCharge) * quantity;
  }

  return subtotal + Math.max(0, Number(deliveryCharge) || 0);
}

const createRazorpayOrder = async (req, res) => {
  try {
    const orderPayload = prepareOrderPayload(getOrderPayloadFromRequest(req.body));

    // HIGH-3 FIX: Use server-side computed total, not client-supplied total
    const serverTotal = await computeServerSideTotal(
      orderPayload.lineItems,
      orderPayload.deliveryCharge
    );
    const amount = toRazorpayAmount(serverTotal);

    if (amount <= 0) {
      throw createPaymentError(400, "Order total must be greater than zero.");
    }

    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: RAZORPAY_CURRENCY,
      receipt: buildReceiptId(),
      notes: buildOrderNotes(orderPayload)
    });

    res.status(201).json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: getPaymentErrorMessage(error) });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw createPaymentError(400, "Missing Razorpay payment verification fields.");
    }

    if (!isValidSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
      throw createPaymentError(400, "Invalid Razorpay payment signature.");
    }

    const orderPayload = prepareOrderPayload(getOrderPayloadFromRequest(req.body));

    // HIGH-3 FIX: Re-compute expected amount server-side before confirming with Razorpay
    const serverTotal = await computeServerSideTotal(
      orderPayload.lineItems,
      orderPayload.deliveryCharge
    );
    const expectedAmount = toRazorpayAmount(serverTotal);

    const razorpay = getRazorpayInstance();
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (payment.order_id !== razorpayOrderId) {
      throw createPaymentError(400, "Razorpay payment does not match this order.");
    }

    if (Number(payment.amount) !== expectedAmount) {
      throw createPaymentError(400, "Razorpay payment amount does not match the order total.");
    }

    if (String(payment.currency || "").toUpperCase() !== RAZORPAY_CURRENCY) {
      throw createPaymentError(400, "Unsupported Razorpay payment currency.");
    }

    if (payment.status !== "captured" && payment.captured !== true) {
      throw createPaymentError(400, "Razorpay payment is not captured yet.");
    }

    const savedOrder = await saveOrderFromPayload({
      ...orderPayload,
      paymentMethod: "Razorpay",
      paymentStatus: "Paid",
      payment: "Paid",
      razorpayOrderId,
      razorpayPaymentId
    });

    res.status(201).json({
      verified: true,
      order: savedOrder
    });
  } catch (error) {
    res.status(error.status || 500).json({ error: getPaymentErrorMessage(error) });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment
};
