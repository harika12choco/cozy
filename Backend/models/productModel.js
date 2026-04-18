const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  description: {
    type: String
  },

  image: {
    type: String
  },

  imagePublicId: {
    type: String
  },

  category: {
    type: String
  },

  status: {
    type: String,
    enum: ["active", "draft"],
    default: "active"
  },

  bestSeller: {
    type: Boolean,
    default: false
  },

  stock: {
    type: Number,
    default: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);
