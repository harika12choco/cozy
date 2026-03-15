const express = require("express");

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

router.get("/orders", listOrders);
router.post("/orders", createOrder);
router.put("/orders/:id", updateOrder);
router.delete("/orders/:id", deleteOrder);

router.get("/users", listUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

router.get("/messages", listMessages);
router.post("/messages", createMessage);
router.put("/messages/:id", updateMessage);
router.delete("/messages/:id", deleteMessage);

module.exports = router;
