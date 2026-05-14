const mongoose = require("mongoose");

const siteImagesSchema = new mongoose.Schema(
  {
    bannerUrl: {
      type: String,
      default: ""
    },
    categoryImages: {
      type: Map,
      of: String,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("SiteImages", siteImagesSchema);
