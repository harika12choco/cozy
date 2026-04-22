const express = require("express");
const router = express.Router();
const { createProductImageSignature } = require("../services/cloudinaryService");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { writeLimiter } = require("../middleware/rateLimiter");

const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controllers/productController");

function sendCloudinarySignature(req, res) {
  try {
    res.json(createProductImageSignature());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.get("/cloudinary/signature", authenticateAdmin, writeLimiter, sendCloudinarySignature);
router.get("/products/cloudinary/signature", authenticateAdmin, writeLimiter, sendCloudinarySignature);

router.post("/products", authenticateAdmin, writeLimiter, addProduct);
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.put("/products/:id", authenticateAdmin, writeLimiter, updateProduct);
router.delete("/products/:id", authenticateAdmin, writeLimiter, deleteProduct);

module.exports = router;
