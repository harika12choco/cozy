const express = require("express");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { loginAdmin } = require("../controllers/adminAuthController");
const { loginLimiter, writeLimiter } = require("../middleware/rateLimiter");

const {
  listOrders,
  createOrder,
  updateOrder,
  deleteOrder
} = require("../controllers/orderController");
const {
  listUsers,
  updateUser,
  deleteUser
} = require("../controllers/userController");
const {
  listMessages,
  createMessage,
  updateMessage,
  deleteMessage
} = require("../controllers/messageController");

const router = express.Router();

router.post("/admin/auth/login", loginLimiter, loginAdmin);

router.get("/orders", authenticateAdmin, listOrders);
router.post("/orders", writeLimiter, createOrder);
router.put("/orders/:id", authenticateAdmin, writeLimiter, updateOrder);
router.delete("/orders/:id", authenticateAdmin, writeLimiter, deleteOrder);

router.get("/users", authenticateAdmin, listUsers);
router.put("/users/:id", authenticateAdmin, writeLimiter, updateUser);
router.delete("/users/:id", authenticateAdmin, writeLimiter, deleteUser);

router.get("/messages", authenticateAdmin, listMessages);
router.post("/messages", writeLimiter, createMessage);
router.put("/messages/:id", authenticateAdmin, writeLimiter, updateMessage);
router.delete("/messages/:id", authenticateAdmin, writeLimiter, deleteMessage);

module.exports = router;
