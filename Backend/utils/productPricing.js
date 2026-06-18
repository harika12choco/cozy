const PREMIUM_FRAGRANCE_EXTRA_CHARGE = 80;
const baseFragrances = new Set(["vanilla", "vanila", "jasmine", "lavender", "unscented", "unscented option available"]);
const priceSuffixPattern = /\s*\+\s*(?:rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*$/i;

function parseProductPrice(value) {
  const numericPrice = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

function normalizeFragranceName(option) {
  return getFragranceDisplayName(option).toLowerCase();
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

function getFragrancePriceAdjustment(option) {
  const name = typeof option === "string" ? option : option?.name ?? "";
  const fragranceName = normalizeFragranceName(option);
  if (!fragranceName || baseFragrances.has(fragranceName)) {
    return 0;
  }

  const suffixAdjustment = splitPriceSuffix(name).priceAdjustment;
  if (suffixAdjustment !== null && suffixAdjustment > 0) {
    return suffixAdjustment;
  }

  const explicitAdjustment = explicitPriceAdjustment(option);
  if (explicitAdjustment !== null && explicitAdjustment > 0) {
    return explicitAdjustment;
  }

  return PREMIUM_FRAGRANCE_EXTRA_CHARGE;
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
