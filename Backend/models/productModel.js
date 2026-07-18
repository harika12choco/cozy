const mongoose = require("mongoose");

const optionSnapshotSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    hexCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true
    },
    priceAdjustment: {
      type: Number,
      default: 0
    }
  },
  { _id: false }
);

const imageSnapshotSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true
    },
    publicId: {
      type: String,
      default: "",
      trim: true
    },
    alt: {
      type: String,
      default: "",
      trim: true
    },
    featured: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const variantSnapshotSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      default: "",
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    weight: {
      type: String,
      default: "",
      trim: true
    },
    sku: {
      type: String,
      default: "",
      trim: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  basePrice: {
    type: Number,
    default: 0
  },

  description: {
    type: String
  },

  shortDescription: {
    type: String,
    default: "",
    trim: true
  },

  sku: {
    type: String,
    default: "",
    trim: true
  },

  collectionName: {
    type: String,
    default: "",
    trim: true
  },

  collections: {
    type: [String],
    default: []
  },

  tags: {
    type: [String],
    default: []
  },

  image: {
    type: String
  },

  imagePublicId: {
    type: String
  },

  images: {
    type: [imageSnapshotSchema],
    default: []
  },

  galleryImages: {
    type: [imageSnapshotSchema],
    default: []
  },

  featuredImage: {
    type: String,
    default: "",
    trim: true
  },

  category: {
    type: String
  },

  status: {
    type: String,
    enum: ["active", "draft", "out-of-stock"],
    default: "active"
  },

  bestSeller: {
    type: Boolean,
    default: false
  },

  isBestSeller: {
    type: Boolean,
    default: false
  },

  stock: {
    type: Number,
    default: 0
  },

  salePrice: {
    type: Number,
    default: 0
  },

  offerPercentage: {
    type: Number,
    default: 0
  },

  lowStockAlert: {
    type: Number,
    default: 5
  },

  burnTime: {
    type: String,
    default: ""
  },

  weight: {
    type: String,
    default: ""
  },

  variants: {
    type: [variantSnapshotSchema],
    default: []
  },

  customizationOptions: {
    type: [String],
    default: []
  },

  giftWrapPrice: {
    type: Number,
    default: 80
  },

  candleColors: {
    type: [optionSnapshotSchema],
    default: []
  },

  fragrances: {
    type: [optionSnapshotSchema],
    default: []
  },

  reviews: {
    type: [
      {
        reviewer: {
          type: String,
          default: "",
          trim: true
        },
        rating: {
          type: Number,
          default: 5,
          min: 1,
          max: 5
        },
        comment: {
          type: String,
          default: "",
          trim: true
        }
      }
    ],
    default: []
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Product", productSchema);
