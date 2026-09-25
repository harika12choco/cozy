const Product = require("../models/productModel");
const { uploadProductImage } = require("../services/cloudinaryService");
const mongoose = require("mongoose");
const { isStaticProductId } = require("../utils/staticProducts");
const {
  invalidateStaticOverrides,
  listStaticProducts,
  resolveStaticProduct
} = require("../utils/staticOverrides");
const StaticProductOverride = require("../models/StaticProductOverride");
const { getFragranceDisplayName, getFragrancePriceAdjustment } = require("../utils/productPricing");
const { emptyCatalog, loadCustomizationCatalog, resolveProductOptions } = require("../utils/productOptions");
const { sendError } = require("../utils/errorResponse");

async function prepareProductPayload(payload) {
  const imageUpload = await uploadProductImage(payload.image);

  const normalizedBestSeller =
    payload.isBestSeller !== undefined ? Boolean(payload.isBestSeller) : Boolean(payload.bestSeller);

  // The admin "Price" field is the single source of truth; `basePrice` is only a mirror of it.
  // Reading `basePrice` first meant an edit form that echoed back the old `basePrice` silently
  // overrode the new price, and the storefront (which prices from `basePrice`) kept showing the
  // old amount while the admin table showed the new one.
  // A payload that carries no usable price leaves both fields untouched, so a partial update can
  // never wipe an existing price to 0.
  const priceCandidate = [payload.price, payload.basePrice].find(
    (value) => value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value))
  );
  const pricing = priceCandidate === undefined
    ? {}
    : { price: Number(priceCandidate), basePrice: Number(priceCandidate) };

  return {
    ...payload,
    ...pricing,
    bestSeller: normalizedBestSeller,
    isBestSeller: normalizedBestSeller,
    candleColors: normalizeProductOptions(payload.candleColors, true),
    fragrances: normalizeProductOptions(payload.fragrances, false),
    variants: normalizeProductVariants(payload.variants),
    ...imageUpload
  };
}

function slugifyOption(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Combo offers ride on the existing variant engine (a selected variant's price becomes the
 * cart base price). Rows without a name or a positive price are dropped so a half-filled
 * admin row never reaches the storefront or fails schema validation.
 */
function normalizeProductVariants(variants) {
  if (!Array.isArray(variants)) {
    return [];
  }

  const seen = new Set();

  return variants
    .map((variant) => {
      if (!variant || typeof variant !== "object") {
        return null;
      }

      const name = String(variant.name ?? variant.label ?? "").trim();
      const price = Math.max(0, Number(variant.price ?? 0));

      if (!name || price <= 0) {
        return null;
      }

      const optionId = String(variant.optionId ?? variant.id ?? variant._id ?? "").trim() || slugifyOption(name);
      const key = optionId.toLowerCase();

      if (seen.has(key)) {
        return null;
      }

      seen.add(key);

      return {
        optionId,
        name,
        price,
        weight: String(variant.weight ?? "").trim(),
        sku: String(variant.sku ?? "").trim(),
        stock: Math.max(0, Math.floor(Number(variant.stock ?? 0) || 0)),
        enabled: variant.enabled !== false
      };
    })
    .filter(Boolean);
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
    // `price` first so products already saved with a stale `basePrice` (see prepareProductPayload)
    // report the correct amount immediately, without needing a database migration or a re-save.
    basePrice: Number(normalized.price || normalized.basePrice || 0),
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
    // The hardcoded catalogue is part of the shop, so it is listed alongside database products
    // with any admin overrides already applied. Reading it costs no query thanks to the cache.
    const staticSource = await listStaticProducts();
    const staticMatches = (ids.length > 0
      ? staticSource.filter((product) => ids.includes(product.id))
      : staticSource
    )
      .filter((product) => (bestSeller === null ? true : Boolean(product.bestSeller) === bestSeller))
      .map((product) => normalizeProductResponse(product, catalog));
    const dbIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const filter = {};

    if (bestSeller !== null) {
      filter.bestSeller = bestSeller;
    }

    if (ids.length > 0) {
      filter._id = { $in: dbIds };
    }

    // Price and stock edits must be visible on the next storefront load, so no intermediate
    // cache may hold on to a previous copy of the catalog.
    res.set("Cache-Control", "no-store");

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
    const staticProduct = await resolveStaticProduct(req.params.id);

    res.set("Cache-Control", "no-store");

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
function readOverrideNumber(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : undefined;
}

/**
 * Editing a hardcoded product cannot write to the products collection - there is no document for
 * it. The admin's changes are stored as a small override keyed by the static id instead, and
 * merged back in on every read.
 */
async function updateStaticProduct(req, res) {
  const staticId = String(req.params.id).trim();
  const payload = { staticId };

  const price = readOverrideNumber(req.body?.price ?? req.body?.basePrice);
  if (price !== undefined) payload.price = price;

  const stock = readOverrideNumber(req.body?.stock);
  if (stock !== undefined) payload.stock = stock;

  const giftWrapPrice = readOverrideNumber(req.body?.giftWrapPrice);
  if (giftWrapPrice !== undefined) payload.giftWrapPrice = giftWrapPrice;

  if (["active", "draft", "out-of-stock"].includes(req.body?.status)) {
    payload.status = req.body.status;
  }

  if (req.body?.bestSeller !== undefined || req.body?.isBestSeller !== undefined) {
    payload.bestSeller = Boolean(req.body.isBestSeller ?? req.body.bestSeller);
  }

  // Saving a hidden product from the admin form brings it back.
  payload.hidden = false;

  await StaticProductOverride.findOneAndUpdate({ staticId }, payload, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true
  });

  invalidateStaticOverrides();

  const catalog = await loadCustomizationCatalog();
  return res.json(normalizeProductResponse(await resolveStaticProduct(staticId), catalog));
}

const updateProduct = async (req, res) => {
  try {
    if (isStaticProductId(req.params.id)) {
      return await updateStaticProduct(req, res);
    }

    const productPayload = await prepareProductPayload(req.body);
    const product = await Product.findByIdAndUpdate(req.params.id, productPayload, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Pass the catalog so the saved product comes back with the same colour/fragrance options
    // the storefront resolves, instead of an empty list.
    res.json(normalizeProductResponse(product, await loadCustomizationCatalog()));
  } catch (error) {
    sendError(res, error);
  }
};

// Delete product
const deleteProduct = async (req, res) => {
  try {
    // A hardcoded product cannot be removed from the bundle, so it is hidden from the storefront
    // and the admin list instead. Saving it again from the edit form restores it.
    if (isStaticProductId(req.params.id)) {
      const staticId = String(req.params.id).trim();
      await StaticProductOverride.findOneAndUpdate(
        { staticId },
        { staticId, hidden: true },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      invalidateStaticOverrides();
      return res.json({ message: "Product hidden" });
    }

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
