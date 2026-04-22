require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");


const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/Cartroutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const API_VERSION = "cloudinary-signature-v2";

connectDB();

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      const defaultAllowed = ["http://localhost:5173", "https://cozy-sigma.vercel.app"];
      const allowList = allowedOrigins.length ? [...defaultAllowed, ...allowedOrigins] : defaultAllowed;

      if (!origin || allowList.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  })
);
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    version: API_VERSION,
    cloudinarySignatureRoutes: ["/api/cloudinary/signature", "/api/products/cloudinary/signature"]
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
