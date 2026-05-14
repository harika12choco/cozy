const express = require("express");
const { authenticateAdmin } = require("../middleware/adminAuth");
const { writeLimiter } = require("../middleware/rateLimiter");
const { createSiteImageSignature } = require("../services/cloudinaryService");
const { getSiteImages, updateSiteImages } = require("../controllers/siteImagesController");

const router = express.Router();

function sendCloudinarySignature(req, res) {
  try {
    res.json(createSiteImageSignature());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

router.get("/site-images", getSiteImages);
router.put("/site-images", authenticateAdmin, writeLimiter, updateSiteImages);
router.get("/site-images/cloudinary/signature", authenticateAdmin, writeLimiter, sendCloudinarySignature);

module.exports = router;
