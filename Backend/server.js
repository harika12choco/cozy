require("dotenv").config();

const express = require("express");
const cors = require("cors");


const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/Cartroutes");
const adminRoutes = require("./routes/adminRoutes");
const { createProductImageSignature } = require("./services/cloudinaryService");

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
const API_VERSION = "cloudinary-signature-v2";

connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cozy-sigma.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json({ limit: "25mb" }));

function sendCloudinarySignature(req, res) {
  try {
    res.json(createProductImageSignature());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

app.get("/api/cloudinary/signature", sendCloudinarySignature);
app.get("/api/products/cloudinary/signature", sendCloudinarySignature);
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: API_VERSION,
    cloudinarySignatureRoutes: [
      "/api/cloudinary/signature",
      "/api/products/cloudinary/signature"
    ]
  });
});

app.use("/api", productRoutes);
app.use("/api", adminRoutes);
app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
  res.send(`Server Running - ${API_VERSION}`);
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on port ${process.env.PORT || 5000}`);
});
