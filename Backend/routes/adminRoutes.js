const express = require("express");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { authenticateUser } = require("../middleware/userAuth");
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
// CRIT-3 FIX: POST /orders now requires a verified Firebase user token
router.post("/orders", authenticateUser, writeLimiter, createOrder);
router.put("/orders/:id", authenticateAdmin, writeLimiter, updateOrder);
router.delete("/orders/:id", authenticateAdmin, writeLimiter, deleteOrder);

router.get("/messages", authenticateAdmin, listMessages);
// HIGH-4 FIX: strict messageLimiter (5/10 min) instead of writeLimiter (120/min)
router.post("/messages", messageLimiter, createMessage);
router.put("/messages/:id", authenticateAdmin, writeLimiter, updateMessage);
router.delete("/messages/:id", authenticateAdmin, writeLimiter, deleteMessage);

module.exports = router;
