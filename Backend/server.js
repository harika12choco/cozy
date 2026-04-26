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
const isProduction = process.env.NODE_ENV === "production";
const API_VERSION = "cloudinary-signature-v2";

function sanitizeForMongoOperators(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeForMongoOperators);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).reduce((accumulator, [key, nestedValue]) => {
      const safeKey = key.replace(/\$/g, "_").replace(/\./g, "_");
      accumulator[safeKey] = sanitizeForMongoOperators(nestedValue);
      return accumulator;
    }, {});
  }

  return value;
}

function sanitizeRequestBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeForMongoOperators(req.body);
  }

  next();
}

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
      const defaultAllowed = isProduction ? [] : ["http://localhost:5173"];
      const allowList = [...new Set([...defaultAllowed, ...allowedOrigins])];

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
app.use(sanitizeRequestBody);

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
