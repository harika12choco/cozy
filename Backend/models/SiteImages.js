const mongoose = require("mongoose");

const siteImagesSchema = new mongoose.Schema(
  {
    // Festival / seasonal hero banner shown at the top of the home page.
    bannerUrl: {
      type: String,
      default: ""
    },
    // Optional portrait-friendly version used on phones. A wide desktop banner shrinks to an
    // unreadable strip on a narrow screen, so the admin can supply a taller crop instead.
    bannerMobileUrl: {
      type: String,
      default: ""
    },
    // Where tapping the banner takes the shopper (e.g. /shop?category=diwali-candle).
    bannerLink: {
      type: String,
      default: ""
    },
    // Alt text, so a banner that carries the whole message is still readable to search engines
    // and screen readers.
    bannerAlt: {
      type: String,
      default: ""
    },
    // Designed banners usually have their wording baked into the artwork, so the site's own
    // "Handcrafted Luxury Candles" heading is hidden by default while a banner is live.
    bannerHideText: {
      type: Boolean,
      default: true
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
