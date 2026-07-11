const express = require("express");
const { writeLimiter } = require("../middleware/rateLimiter");
const {
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", writeLimiter, createRazorpayOrder);
router.post("/verify", writeLimiter, verifyRazorpayPayment);

module.exports = router;
