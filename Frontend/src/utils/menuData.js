/**
 * The storefront category list. This is the single source of truth: the navbar dropdown, the
 * category strip, the mobile sidebar, the shop filters, the admin category picker and the admin
 * "Site Images" uploader all read from here, so a category only has to be changed in this file.
 */
export const CATEGORIES = [
  "Festive Candle",
  "Jar Candle",
  "Urli Candles",
  "Concrete Candle",
  "Gifting Candle",
  "Wooden Base Candle",
  "Tealight Candle",
  "Wax Melts",
  "Wax Sachets",
  "Coconut Shell Candle",
  "Diwali Candle",
  "Christmas Candle",
  "Valentine Candle",
  "Statement Candle",
  "Tin Jar Candle",
];

/**
 * Products saved under a category that no longer exists still have to appear somewhere, so they
 * fall back to this one until the admin re-assigns them from the product form.
 */
export const DEFAULT_CATEGORY = "Festive Candle";

/**
 * Kept as `{ title, items }` because the navigation components render sections. Categories are a
 * flat list now, so every section is a leaf with no children.
 */
const menuData = CATEGORIES.map((title) => ({ title, items: [] }));

export function slugifyCategory(category) {
  return String(category ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Resolves any stored category value to one of the categories above, matching case-insensitively
 * and by slug so older spellings ("gifting collection") still land on their category.
 * Anything unrecognised becomes the default category instead of disappearing from the shop.
 */
export function normalizeCategory(value) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return DEFAULT_CATEGORY;
  }

  const slug = slugifyCategory(raw);
  const match = CATEGORIES.find(
    (category) => category.toLowerCase() === raw.toLowerCase() || slugifyCategory(category) === slug
  );

  return match ?? DEFAULT_CATEGORY;
}

export function isKnownCategory(value) {
  const slug = slugifyCategory(value);
  return CATEGORIES.some((category) => slugifyCategory(category) === slug);
}

/** Options for the admin product form's category picker. */
export const categoryOptions = [...CATEGORIES];

export function findCategoryBySlug(slug) {
  const normalizedSlug = String(slug ?? "").trim();

  if (!normalizedSlug) {
    return null;
  }

  const match = CATEGORIES.find((category) => slugifyCategory(category) === normalizedSlug);

  if (!match) {
    return null;
  }

  return {
    label: match,
    value: match,
    slug: normalizedSlug,
  };
}

export default menuData;
