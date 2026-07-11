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

const orderLineItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: ""
    },
    productName: {
      type: String,
      default: "",
      trim: true
    },
    name: {
      type: String,
      required: true
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
    customerName: {
      type: String,
      default: "",
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
    pincode: {
      type: String,
      required: true,
      match: /^[0-9]{6}$/
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
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    paymentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    payment: {
      type: String,
      default: "Pending"
    },
    paymentMethod: {
      type: String,
      default: "Cash on Delivery (COD)",
      trim: true
    },
    paymentStatus: {
      type: String,
      default: "Pending",
      trim: true
    },
    razorpayOrderId: {
      type: String,
      default: "",
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true
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
    },
    products: {
      type: [orderLineItemSchema],
      default: []
    },
    orderDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Order", orderSchema);
