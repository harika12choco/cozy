const express = require("express");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { loginAdmin, verifyAdminToken } = require("../controllers/adminAuthController");
const { loginLimiter, writeLimiter, messageLimiter } = require("../middleware/rateLimiter");

const {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder
} = require("../controllers/orderController");

const {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage
} = require("../controllers/messageController");

const router = express.Router();

router.post("/admin/auth/login", loginLimiter, loginAdmin);
router.get("/admin/verify-token", authenticateAdmin, verifyAdminToken);

router.get("/orders", authenticateAdmin, listOrders);
// Admin-only: this route reserves stock without taking payment, so it must never be reachable by
// a shopper - a signed-in account could otherwise drain inventory by posting unpaid orders. Real
// customer orders are created by the Razorpay verification flow, after a captured payment.
router.post("/orders", authenticateAdmin, writeLimiter, createOrder);
router.put("/orders/:id", authenticateAdmin, writeLimiter, updateOrder);
router.delete("/orders/:id", authenticateAdmin, writeLimiter, deleteOrder);

router.get("/messages", authenticateAdmin, listMessages);
// HIGH-4 FIX: strict messageLimiter (5/10 min) instead of writeLimiter (120/min)
router.post("/messages", messageLimiter, createMessage);
router.put("/messages/:id", authenticateAdmin, writeLimiter, updateMessage);
router.delete("/messages/:id", authenticateAdmin, writeLimiter, deleteMessage);

module.exports = router;
