// Suggested default for the admin form only. Nothing is charged unless an admin enters a value.
const PREMIUM_FRAGRANCE_EXTRA_CHARGE = 80;
const priceSuffixPattern = /\s*\+\s*(?:rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*$/i;

function parseProductPrice(value) {
  const numericPrice = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function splitPriceSuffix(value) {
  const rawName = String(value ?? "").trim();
  const match = rawName.match(priceSuffixPattern);

  if (!match) {
    return {
      name: rawName,
      priceAdjustment: null
    };
  }

  return {
    name: rawName.slice(0, match.index).trim() || rawName,
    priceAdjustment: parseProductPrice(match[1])
  };
}

function explicitPriceAdjustment(option) {
  if (!option || typeof option === "string") {
    return null;
  }

  if (option.priceAdjustment === undefined || option.priceAdjustment === null || option.priceAdjustment === "") {
    return null;
  }

  return Math.max(0, parseProductPrice(option.priceAdjustment));
}

function getFragranceDisplayName(option) {
  const name = typeof option === "string" ? option : option?.name ?? "";
  return splitPriceSuffix(name).name;
}

/**
 * A fragrance costs extra only when an admin says so. Mirrors
 * Frontend/src/utils/productPricing.js - see the note there. The admin's value wins, including 0.
 */
function getFragrancePriceAdjustment(option) {
  const explicitAdjustment = explicitPriceAdjustment(option);
  if (explicitAdjustment !== null) {
    return explicitAdjustment;
  }

  const name = typeof option === "string" ? option : option?.name ?? "";
  const suffixAdjustment = splitPriceSuffix(name).priceAdjustment;
  if (suffixAdjustment !== null && suffixAdjustment > 0) {
    return suffixAdjustment;
  }

  return 0;
}

function calculateFinalPrice(basePrice, selectedFragrance) {
  return parseProductPrice(basePrice) + getFragrancePriceAdjustment(selectedFragrance);
}

module.exports = {
  PREMIUM_FRAGRANCE_EXTRA_CHARGE,
  calculateFinalPrice,
  getFragranceDisplayName,
  getFragrancePriceAdjustment,
  parseProductPrice
};
