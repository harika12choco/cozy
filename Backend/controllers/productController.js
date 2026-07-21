const Product = require("../models/productModel");
const { uploadProductImage } = require("../services/cloudinaryService");
const mongoose = require("mongoose");
const { getStaticProductById } = require("../utils/staticProducts");
const { getFragranceDisplayName, getFragrancePriceAdjustment } = require("../utils/productPricing");
const { emptyCatalog, loadCustomizationCatalog, resolveProductOptions } = require("../utils/productOptions");
const { sendError } = require("../utils/errorResponse");

async function prepareProductPayload(payload) {
  const imageUpload = await uploadProductImage(payload.image);

  const normalizedBestSeller =
    payload.isBestSeller !== undefined ? Boolean(payload.isBestSeller) : Boolean(payload.bestSeller);

  return {
    ...payload,
    basePrice: Number(payload.basePrice || payload.price || 0),
    bestSeller: normalizedBestSeller,
    isBestSeller: normalizedBestSeller,
    candleColors: normalizeProductOptions(payload.candleColors, true),
    fragrances: normalizeProductOptions(payload.fragrances, false),
    ...imageUpload
  };
}

function normalizeProductOptions(options, includeHex) {
  if (!Array.isArray(options)) {
    return [];
  }

  const seen = new Set();

  return options
    .map((option) => {
      const rawName = String(option?.name ?? "").trim();
      const name = includeHex ? rawName : getFragranceDisplayName(option);
      const optionId = String(option?.optionId ?? option?.id ?? option?._id ?? "").trim();
      const hexCode = includeHex ? String(option?.hexCode ?? "").trim().toUpperCase() : "";
      const key = optionId || name.toLowerCase();

      if (!name || seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        optionId,
        name,
        hexCode: includeHex && /^#[0-9A-F]{6}$/.test(hexCode) ? hexCode : "",
        priceAdjustment: includeHex ? 0 : getFragrancePriceAdjustment(option)
      };
    })
    .filter(Boolean);
}

function normalizeProductResponse(product, catalog = emptyCatalog) {
  if (!product) {
    return null;
  }

  const normalized = product.toObject ? product.toObject() : product;
  const { candleColors, fragrances, usesCatalogColors, usesCatalogFragrances } = resolveProductOptions(
    normalized,
    catalog
  );

  return {
    ...normalized,
    basePrice: Number(normalized.basePrice || normalized.price || 0),
    isBestSeller: Boolean(normalized.isBestSeller ?? normalized.bestSeller),
    bestSeller: Boolean(normalized.bestSeller ?? normalized.isBestSeller),
    candleColors,
    colors: candleColors,
    fragrances,
    // Raw admin selection, kept separate so the admin edit form never shows the shared
    // catalog fallback as if it had been saved on the product.
    selectedCandleColors: Array.isArray(normalized.candleColors) ? normalized.candleColors : [],
    selectedFragrances: Array.isArray(normalized.fragrances) ? normalized.fragrances : [],
    customizable: candleColors.length > 0 || fragrances.length > 0,
    usesCatalogColors,
    usesCatalogFragrances,
    burnTime: normalized.burnTime ?? "",
    weight: normalized.weight ?? "",
    variants: Array.isArray(normalized.variants) ? normalized.variants : []
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
    sendError(res, error);
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const catalog = await loadCustomizationCatalog();
    const bestSeller = parseBoolean(req.query.bestSeller ?? req.query.isBestSeller);
    const ids = String(req.query.ids ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const staticMatches = ids.length > 0
      ? ids.map(getStaticProductById).filter(Boolean).map((product) => normalizeProductResponse(product, catalog))
      : [];
    const dbIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const filter = {};

    if (bestSeller !== null) {
      filter.bestSeller = bestSeller;
    }

    if (ids.length > 0) {
      filter._id = { $in: dbIds };
    }

    if (bestSeller !== null) {
      res.set("Cache-Control", "no-store");
    }

    const products = ids.length > 0 && dbIds.length === 0 ? [] : await Product.find(filter);
    res.json([...staticMatches, ...products.map((product) => normalizeProductResponse(product, catalog))]);
  } catch (error) {
    sendError(res, error);
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
    const [catalog, products] = await Promise.all([
      loadCustomizationCatalog(),
      Product.find({
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ]
      })
    ]);

    res.json(products.map((product) => normalizeProductResponse(product, catalog)));
  } catch (error) {
    sendError(res, error);
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const catalog = await loadCustomizationCatalog();
    const staticProduct = getStaticProductById(req.params.id);

    if (staticProduct) {
      return res.json(normalizeProductResponse(staticProduct, catalog));
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json(null);
    }

    const product = await Product.findById(req.params.id);
    res.json(normalizeProductResponse(product, catalog));
  } catch (error) {
    sendError(res, error);
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
    sendError(res, error);
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted" });
  } catch (error) {
    sendError(res, error);
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
