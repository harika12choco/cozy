const mongoose = require("mongoose");

const candleColorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    hexCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^#[0-9A-F]{6}$/
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("CandleColor", candleColorSchema);
