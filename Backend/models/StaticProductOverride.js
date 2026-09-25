const mongoose = require("mongoose");

/**
 * Admin edits for the hardcoded catalogue in utils/staticProducts.js.
 *
 * Those products stay compiled into the bundle so they render instantly and cost no database
 * reads, but the admin still has to be able to change a price. Only the fields an admin can edit
 * are stored here — the name, description, images, colours, fragrances and combos keep coming
 * from the hardcoded definition — so each document is tiny and only exists once something is
 * actually edited.
 */
const staticProductOverrideSchema = new mongoose.Schema(
  {
    staticId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      min: 0,
      default: null
    },
    stock: {
      type: Number,
      min: 0,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "draft", "out-of-stock"],
      default: null
    },
    bestSeller: {
      type: Boolean,
      default: null
    },
    giftWrapPrice: {
      type: Number,
      min: 0,
      default: null
    },
    // Set when the admin "deletes" a hardcoded product: it cannot be removed from the bundle, so
    // it is hidden from the storefront and the admin list instead.
    hidden: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("StaticProductOverride", staticProductOverrideSchema);
