const StaticProductOverride = require("../models/StaticProductOverride");
const { getStaticProductById, staticProducts } = require("./staticProducts");

/**
 * Admin overrides for the hardcoded catalogue, cached in memory.
 *
 * The whole point of keeping those products hardcoded is that serving them costs nothing, so the
 * overrides are read at most once per TTL and reused for every request in between. The cache is
 * dropped immediately whenever an admin saves, so an edit is visible right away.
 */
const OVERRIDE_CACHE_TTL_MS = 60 * 1000;

let cachedOverrides = null;
let cachedAt = 0;

async function loadStaticOverrides() {
  const now = Date.now();

  if (cachedOverrides && now - cachedAt < OVERRIDE_CACHE_TTL_MS) {
    return cachedOverrides;
  }

  try {
    const rows = await StaticProductOverride.find().lean();
    cachedOverrides = new Map(rows.map((row) => [row.staticId, row]));
    cachedAt = now;
  } catch (error) {
    console.error("Unable to load static product overrides:", error.message);
    return cachedOverrides ?? new Map();
  }

  return cachedOverrides;
}

function invalidateStaticOverrides() {
  cachedOverrides = null;
  cachedAt = 0;
}

function isSet(value) {
  return value !== undefined && value !== null;
}

/**
 * Merges an admin override onto a hardcoded product. Fields the admin has not touched keep the
 * value from the bundled definition.
 */
function applyOverride(product, override = null) {
  if (!product) {
    return null;
  }

  // Runs even when there is no override, so an un-edited product still reports every field the
  // admin form needs. Returning the bare definition left giftWrapPrice undefined, which rendered
  // an empty required input and silently blocked the form from saving.
  const price = isSet(override?.price) ? Number(override.price) : Number(product.price);
  const bestSeller = isSet(override?.bestSeller) ? Boolean(override.bestSeller) : Boolean(product.bestSeller);

  return {
    ...product,
    price,
    basePrice: price,
    stock: isSet(override?.stock) ? Number(override.stock) : Number(product.stock),
    status: isSet(override?.status) ? override.status : product.status,
    giftWrapPrice: isSet(override?.giftWrapPrice) ? Number(override.giftWrapPrice) : Number(product.giftWrapPrice ?? 80),
    bestSeller,
    isBestSeller: bestSeller,
    hidden: Boolean(override?.hidden)
  };
}

/** A single hardcoded product with its admin override applied, or null when it is not one. */
async function resolveStaticProduct(id) {
  const product = getStaticProductById(id);

  if (!product) {
    return null;
  }

  const overrides = await loadStaticOverrides();
  return applyOverride(product, overrides.get(String(id).trim()));
}

/** Every hardcoded product with overrides applied, excluding any the admin has hidden. */
async function listStaticProducts({ includeHidden = false } = {}) {
  const overrides = await loadStaticOverrides();

  return staticProducts
    .map((product) => applyOverride(product, overrides.get(product.id)))
    .filter((product) => includeHidden || !product.hidden);
}

module.exports = {
  applyOverride,
  invalidateStaticOverrides,
  listStaticProducts,
  loadStaticOverrides,
  resolveStaticProduct
};
