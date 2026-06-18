const express = require("express");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { writeLimiter } = require("../middleware/rateLimiter");
const {
  candleColorController,
  fragranceController
} = require("../controllers/optionController");

const router = express.Router();

router.get("/candle-colors", candleColorController.list);
router.post("/candle-colors", authenticateAdmin, writeLimiter, candleColorController.create);
router.put("/candle-colors/:id", authenticateAdmin, writeLimiter, candleColorController.update);
router.delete("/candle-colors/:id", authenticateAdmin, writeLimiter, candleColorController.remove);

router.get("/fragrances", fragranceController.list);
router.post("/fragrances", authenticateAdmin, writeLimiter, fragranceController.create);
router.put("/fragrances/:id", authenticateAdmin, writeLimiter, fragranceController.update);
router.delete("/fragrances/:id", authenticateAdmin, writeLimiter, fragranceController.remove);

module.exports = router;
