require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/Cartroutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

connectDB();

app.use(cors({
  origin: allowedOrigin,
  credentials: true
}));
app.use(express.json());

app.use("/api", productRoutes);
app.use("/api", adminRoutes);
app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server started on port ${process.env.PORT || 5000}`);
});
