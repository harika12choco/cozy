const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["Customer", "Client", "Admin"],
      default: "Customer"
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active"
    },
    joined: {
      type: String,
      required: true
    },
    orders: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("User", userSchema);
