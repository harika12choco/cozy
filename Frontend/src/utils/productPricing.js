export function parseProductPrice(value) {
  const numericPrice = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(numericPrice) ? numericPrice : 0;
}

export function formatProductPrice(value) {
  return `Rs ${parseProductPrice(value)}`;
}

export const PREMIUM_FRAGRANCE_EXTRA_CHARGE = 80;

const baseFragrances = new Set(["vanilla", "vanila", "jasmine", "lavender", "unscented", "unscented option available"]);
const priceSuffixPattern = /\s*\+\s*(?:rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)\s*$/i;
const variantPricePattern = /(?:rs\.?|inr|₹)\s*([0-9]+(?:\.[0-9]+)?)(?:\s*[-–]\s*([0-9]+(?:\.[0-9]+)?))?/i;

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

export function getFragranceDisplayName(option) {
  return splitPriceSuffix(optionName(option)).name;
}

function normalizeOptionName(option) {
  return getFragranceDisplayName(option).toLowerCase();
}

export function isBaseFragrance(option) {
  const fragranceName = normalizeOptionName(option);
  return fragranceName ? baseFragrances.has(fragranceName) : true;
}

export function getFragrancePriceAdjustment(option) {
  const fragranceName = normalizeOptionName(option);
  if (!fragranceName || baseFragrances.has(fragranceName)) {
    return 0;
  }

  const suffixAdjustment = splitPriceSuffix(optionName(option)).priceAdjustment;
  if (suffixAdjustment !== null && suffixAdjustment > 0) {
    return suffixAdjustment;
  }

  const explicitAdjustment = explicitPriceAdjustment(option);
  if (explicitAdjustment !== null && explicitAdjustment > 0) {
    return explicitAdjustment;
  }

  return PREMIUM_FRAGRANCE_EXTRA_CHARGE;
}

export function getColorPriceAdjustment() {
  return 0;
}

export function getOptionPriceAdjustment(option, optionType = "fragrance") {
  return optionType === "fragrance" ? getFragrancePriceAdjustment(option) : getColorPriceAdjustment(option);
}

function optionName(option) {
  return typeof option === "string" ? option : option?.name || "";
}

function optionId(option, fallback) {
  return typeof option === "string" ? fallback : option?.optionId || option?.id || option?._id || fallback;
}

function optionHex(option) {
  return typeof option === "string" ? "" : option?.hexCode || "";
}

function slugifyOption(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseVariantLabel(value) {
  const label = String(value ?? "").trim();
  const match = label.match(variantPricePattern);

  if (!match) {
    return {
      name: label,
      price: 0
    };
  }

  const name = label.slice(0, match.index).trim() || label;

  return {
    name,
    price: parseProductPrice(match[1])
  };
}

export function normalizeColorOption(option, fallback = "") {
  const name = optionName(option).trim();

  if (!name) {
    return null;
  }

  return {
    optionId: String(optionId(option, fallback || name.toLowerCase().replace(/\s+/g, "-"))),
    name,
    hexCode: optionHex(option),
    priceAdjustment: 0
  };
}

export function normalizeFragranceOption(option, fallback = "") {
  const name = getFragranceDisplayName(option);

  if (!name) {
    return null;
  }

  const normalized = {
    optionId: String(optionId(option, fallback || name.toLowerCase().replace(/\s+/g, "-"))),
    name,
    hexCode: "",
    priceAdjustment: getFragrancePriceAdjustment(option)
  };

  return normalized;
}

export function normalizeVariantOption(option, fallback = "", fallbackPrice = 0) {
  if (!option) {
    return null;
  }

  if (typeof option === "string") {
    const parsed = parseVariantLabel(option);

    if (!parsed.name) {
      return null;
    }

    return {
      optionId: fallback || slugifyOption(parsed.name),
      name: parsed.name,
      price: parsed.price || parseProductPrice(fallbackPrice),
      weight: "",
      sku: "",
      stock: 0
    };
  }

  if (option.enabled === false) {
    return null;
  }

  const name = String(option.name ?? option.label ?? "").trim();

  if (!name) {
    return null;
  }

  return {
    optionId: String((option.optionId ?? option.id ?? option._id ?? fallback) || slugifyOption(name)),
    name,
    price: parseProductPrice(option.price ?? option.salePrice ?? fallbackPrice),
    weight: String(option.weight ?? "").trim(),
    sku: String(option.sku ?? "").trim(),
    stock: Math.max(0, Number(option.stock ?? 0))
  };
}

export function getPurchasableBasePrice(product, selectedVariant = null) {
  const normalizedVariant = normalizeVariantOption(selectedVariant);

  if (normalizedVariant?.price > 0) {
    return normalizedVariant.price;
  }

  const salePrice = parseProductPrice(product?.salePrice);

  if (salePrice > 0) {
    return salePrice;
  }

  return parseProductPrice(product?.basePrice ?? product?.price);
}

export function calculateProductPrice(product, selectedColor = null, selectedFragrance = null, selectedVariant = null) {
  const basePrice = getPurchasableBasePrice(product, selectedVariant);
  return basePrice + getFragrancePriceAdjustment(selectedFragrance);
}

export function getCalculatedProductPrice(product, selectedColor = null, selectedFragrance = null, selectedVariant = null) {
  return formatProductPrice(calculateProductPrice(product, selectedColor, selectedFragrance, selectedVariant));
}

export function withCalculatedProductPrice(
  product,
  selectedColor = null,
  selectedFragrance = null,
  selectedVariant = null,
  quantity = 1
) {
  const normalizedColor = normalizeColorOption(selectedColor);
  const normalizedFragrance = normalizeFragranceOption(selectedFragrance);
  const normalizedVariant = normalizeVariantOption(selectedVariant);
  const basePrice = getPurchasableBasePrice(product, normalizedVariant);
  const fragranceExtraCharge = getFragrancePriceAdjustment(normalizedFragrance);
  const finalPrice = basePrice + fragranceExtraCharge;

  return {
    ...product,
    basePrice,
    finalPrice,
    fragranceExtraCharge,
    price: formatProductPrice(finalPrice),
    quantity: Math.max(1, Number(quantity ?? product?.quantity ?? 1)),
    selectedColor: normalizedColor,
    selectedFragrance: normalizedFragrance,
    selectedVariant: normalizedVariant
  };
}

export function getCartLineFinalPrice(item) {
  if (item?.basePrice !== undefined) {
    return parseProductPrice(item.basePrice) + getFragrancePriceAdjustment(item.selectedFragrance);
  }

  if (item?.finalPrice !== undefined) {
    return parseProductPrice(item.finalPrice);
  }

  return parseProductPrice(item?.price);
}

export function getCartLineTotal(item) {
  return getCartLineFinalPrice(item) * Math.max(1, Number(item?.quantity ?? 1));
}
