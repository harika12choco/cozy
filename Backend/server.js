require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

if (!process.env.WHATSAPP_NUMBER) {
  console.warn("WARNING: WHATSAPP_NUMBER is not set in environment variables. WhatsApp orders will not work.");
}


const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/Cartroutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
app.disable("x-powered-by");
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const API_VERSION = "cloudinary-signature-v2";

function isLocalDevelopmentOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

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

app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      const defaultAllowed = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "https://cozycandle.in",
        "https://www.cozycandle.in",
      ];
      const allowList = [...new Set([...defaultAllowed, ...allowedOrigins])];

      if (!origin || allowList.includes(origin) || isLocalDevelopmentOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-email"],
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

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const message = status === 500 && process.env.NODE_ENV === "production"
    ? "Internal server error"
    : err.message || "Internal server error";

  res.status(status).json({ error: message });
});

const port = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });
});
