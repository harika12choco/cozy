const mongoose = require("mongoose");

const selectedOptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: "",
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

const selectedVariantSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      default: "",
      trim: true
    },
    price: {
      type: Number,
      default: 0
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
      default: 0
    }
  },
  { _id: false }
);

const cartItemSchema = new mongoose.Schema({
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
  basePrice: {
    type: Number,
    default: 0
  },
  fragranceExtraCharge: {
    type: Number,
    default: 0
  },
  finalPrice: {
    type: Number,
    default: 0
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
  },
  selectedColor: {
    type: selectedOptionSchema,
    default: null
  },
  selectedFragrance: {
    type: selectedOptionSchema,
    default: null
  },
  selectedVariant: {
    type: selectedVariantSchema,
    default: null
  },
  giftWrap: {
    type: Boolean,
    default: false
  },
  giftWrapPrice: {
    type: Number,
    default: 0
  }
});

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
