const mongoose = require("mongoose");

const orderLineItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    },
    address: {
      type: String,
      default: ""
    },
    date: {
      type: String,
      required: true
    },
    items: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    payment: {
      type: String,
      default: "Pending"
    },
    status: {
      type: String,
      enum: ["pending", "processing", "delivered"],
      default: "pending"
    },
    placedByUid: {
      type: String,
      default: null
    },
    placedByName: {
      type: String,
      default: ""
    },
    lineItems: {
      type: [orderLineItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
