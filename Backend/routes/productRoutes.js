const express = require("express");
const router = express.Router();
const { createProductImageSignature } = require("../services/cloudinaryService");

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

router.get("/cloudinary/signature", sendCloudinarySignature);
router.get("/products/cloudinary/signature", sendCloudinarySignature);

router.post("/products", addProduct);
router.get("/products", getProducts);
router.get("/products/:id", getProductById);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

module.exports = router;
