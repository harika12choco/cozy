const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true
    },
    productId: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: String,
      required: true
    },
    img: {
      type: String,
      default: ""
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      default: "",
      trim: true
    },
    items: {
      type: [cartItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Cart", cartSchema);
