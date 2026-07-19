const express = require("express");
const { writeLimiter } = require("../middleware/rateLimiter");
const { authenticateUser } = require("../middleware/userAuth");
const {
  createRazorpayOrder,
  verifyRazorpayPayment
} = require("../controllers/paymentController");

const router = express.Router();

router.post("/create-order", authenticateUser, writeLimiter, createRazorpayOrder);
router.post("/verify", authenticateUser, writeLimiter, verifyRazorpayPayment);

module.exports = router;
