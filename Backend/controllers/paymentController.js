const crypto = require("crypto");
const Razorpay = require("razorpay");
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
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

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
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

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

const createRazorpayOrder = async (req, res) => {
  try {
    const orderPayload = prepareOrderPayload(getOrderPayloadFromRequest(req.body));
    const amount = toRazorpayAmount(orderPayload.total);

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
    const expectedAmount = toRazorpayAmount(orderPayload.total);
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
