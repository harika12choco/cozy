const CandleColor = require("../models/CandleColor");
const Fragrance = require("../models/Fragrance");
const { getFragranceDisplayName, getFragrancePriceAdjustment } = require("./productPricing");

const CATALOG_CACHE_TTL_MS = 60 * 1000;

const emptyCatalog = {
  candleColors: [],
  fragrances: []
};

let cachedCatalog = null;
let cachedAt = 0;

function toColorOption(option) {
  const name = String(option?.name ?? "").trim();

  if (!name) {
    return null;
  }

  const hexCode = String(option?.hexCode ?? "").trim().toUpperCase();

  return {
    optionId: String(option?.optionId ?? option?.id ?? option?._id ?? "").trim(),
    name,
    hexCode: /^#[0-9A-F]{6}$/.test(hexCode) ? hexCode : "",
    priceAdjustment: 0
  };
}

function toFragranceOption(option) {
  const name = getFragranceDisplayName(option);

  if (!name) {
    return null;
  }

  return {
    optionId: String(option?.optionId ?? option?.id ?? option?._id ?? "").trim(),
    name,
    hexCode: "",
    priceAdjustment: getFragrancePriceAdjustment(option)
  };
}

/**
 * Shared customization catalog (the colours and fragrances managed from the admin
 * "Candle Colors" / "Fragrances" pages). Cached briefly so listing products does not
 * hit the options collections on every request.
 */
async function loadCustomizationCatalog() {
  const now = Date.now();

  if (cachedCatalog && now - cachedAt < CATALOG_CACHE_TTL_MS) {
    return cachedCatalog;
  }

  try {
    const [colors, fragrances] = await Promise.all([
      CandleColor.find({ enabled: true }).sort({ name: 1 }).lean(),
      Fragrance.find({ enabled: true }).sort({ name: 1 }).lean()
    ]);

    cachedCatalog = {
      candleColors: colors.map(toColorOption).filter(Boolean),
      // Free fragrances first: the storefront pre-selects the first option, so this keeps the
      // advertised price of a product identical to what it was before the fallback existed.
      fragrances: fragrances
        .map(toFragranceOption)
        .filter(Boolean)
        .sort((first, second) =>
          first.priceAdjustment - second.priceAdjustment || first.name.localeCompare(second.name)
        )
    };
    cachedAt = now;
  } catch (error) {
    console.error("Unable to load customization catalog:", error.message);
    return cachedCatalog ?? emptyCatalog;
  }

  return cachedCatalog;
}

function invalidateCustomizationCatalog() {
  cachedCatalog = null;
  cachedAt = 0;
}

/**
 * Every candle is customizable unless a product explicitly opts out. Products that were
 * saved without their own colour/fragrance selection fall back to the shared catalog so the
 * storefront stops showing customization for only a handful of products.
 */
function resolveProductOptions(product, catalog = emptyCatalog) {
  const ownColors = (Array.isArray(product?.candleColors) && product.candleColors.length > 0
    ? product.candleColors
    : Array.isArray(product?.colors)
    ? product.colors
    : []
  )
    .map(toColorOption)
    .filter(Boolean);

  const ownFragrances = (Array.isArray(product?.fragrances) ? product.fragrances : [])
    .map(toFragranceOption)
    .filter(Boolean);

  if (product?.customizationDisabled === true) {
    return {
      candleColors: ownColors,
      fragrances: ownFragrances,
      usesCatalogColors: false,
      usesCatalogFragrances: false
    };
  }

  const usesCatalogColors = ownColors.length === 0 && catalog.candleColors.length > 0;
  const usesCatalogFragrances = ownFragrances.length === 0 && catalog.fragrances.length > 0;

  return {
    candleColors: usesCatalogColors ? catalog.candleColors : ownColors,
    fragrances: usesCatalogFragrances ? catalog.fragrances : ownFragrances,
    usesCatalogColors,
    usesCatalogFragrances
  };
}

function slugifyOptionName(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionMatchKeys(option, optionType) {
  const name = optionType === "fragrance" ? getFragranceDisplayName(option) : String(option?.name ?? "").trim();
  const optionId = String(option?.optionId ?? option?.id ?? option?._id ?? "").trim();

  return {
    ids: [optionId].filter(Boolean),
    names: [name.toLowerCase(), slugifyOptionName(name)].filter(Boolean)
  };
}

/**
 * Matches a shopper's saved selection against the options a product offers.
 *
 * Selections are stored with whatever id the storefront had at the time (a catalog id, or a
 * name-derived fallback such as "red"), so an id-only comparison silently drops valid choices
 * and the shopper is told to "select a valid candle color" for a colour they did select.
 */
function findMatchingOption(value, allowedOptions = [], optionType = "fragrance") {
  if (!value) {
    return null;
  }

  const selection = optionMatchKeys(value, optionType);

  if (selection.ids.length === 0 && selection.names.length === 0) {
    return null;
  }

  return (
    allowedOptions.find((option) => {
      const candidate = optionMatchKeys(option, optionType);

      return (
        candidate.ids.some((id) => selection.ids.includes(id)) ||
        candidate.names.some((name) => selection.names.includes(name)) ||
        // A name-derived fallback id on one side must still match the real name on the other.
        candidate.ids.some((id) => selection.names.includes(id.toLowerCase())) ||
        selection.ids.some((id) => candidate.names.includes(id.toLowerCase()))
      );
    }) ?? null
  );
}

module.exports = {
  emptyCatalog,
  findMatchingOption,
  invalidateCustomizationCatalog,
  loadCustomizationCatalog,
  resolveProductOptions
};
