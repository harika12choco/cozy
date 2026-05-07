const Product = require("../models/productModel");
const { uploadProductImage } = require("../services/cloudinaryService");

async function prepareProductPayload(payload) {
  const imageUpload = await uploadProductImage(payload.image);

  const normalizedBestSeller =
    payload.isBestSeller !== undefined ? Boolean(payload.isBestSeller) : Boolean(payload.bestSeller);

  return {
    ...payload,
    bestSeller: normalizedBestSeller,
    isBestSeller: normalizedBestSeller,
    ...imageUpload
  };
}

function normalizeProductResponse(product) {
  if (!product) {
    return null;
  }

  const normalized = product.toObject ? product.toObject() : product;

  return {
    ...normalized,
    isBestSeller: Boolean(normalized.isBestSeller ?? normalized.bestSeller),
    bestSeller: Boolean(normalized.bestSeller ?? normalized.isBestSeller)
  };
}

function parseBoolean(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();

  if (["true", "1", "yes"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no"].includes(normalized)) {
    return false;
  }

  return null;
}

// Add product
const addProduct = async (req, res) => {
  try {
    const productPayload = await prepareProductPayload(req.body);
    const product = new Product(productPayload);
    await product.save();

    res.status(201).json({
      message: "Product added successfully",
      product: normalizeProductResponse(product)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const bestSeller = parseBoolean(req.query.bestSeller ?? req.query.isBestSeller);
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    const filter = {};

    if (bestSeller !== null) {
      filter.bestSeller = bestSeller;
    }

    if (ids.length > 0) {
      filter._id = { $in: ids };
    }

    if (bestSeller !== null) {
      res.set("Cache-Control", "no-store");
    }

    const products = await Product.find(filter);
    res.json(products.map(normalizeProductResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchProducts = async (req, res) => {
  try {
    const query = String(req.query.q ?? "").trim();

    if (!query) {
      return res.json([]);
    }

    const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    res.set("Cache-Control", "no-store");
    const products = await Product.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ]
    });

    res.json(products.map(normalizeProductResponse));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(normalizeProductResponse(product));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product
const updateProduct = async (req, res) => {
  try {
    const productPayload = await prepareProductPayload(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, productPayload, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(normalizeProductResponse(product));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  addProduct,
  getProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct
};
