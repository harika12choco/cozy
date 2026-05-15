const SiteImages = require("../models/SiteImages");

const MAX_URL_LENGTH = 2048;
const MAX_CATEGORY_IMAGES = 50;

function isValidUrl(value) {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed || trimmed.length > MAX_URL_LENGTH) {
    return "";
  }

  return isValidUrl(trimmed) ? trimmed : "";
}

function normalizeCategoryImages(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  const entries = Object.entries(input)
    .filter(([key]) => typeof key === "string" && key.trim())
    .slice(0, MAX_CATEGORY_IMAGES);

  return entries.reduce((accumulator, [key, value]) => {
    const url = normalizeUrl(value);

    if (url) {
      accumulator[key] = url;
    }

    return accumulator;
  }, {});
}

function normalizeSiteImages(doc) {
  if (!doc) {
    return { bannerUrl: "", categoryImages: {} };
  }

  const plain = doc.toObject ? doc.toObject() : doc;
  const categoryImages = plain.categoryImages instanceof Map
    ? Object.fromEntries(plain.categoryImages)
    : plain.categoryImages || {};

  return {
    bannerUrl: plain.bannerUrl || "",
    categoryImages
  };
}

async function getSiteImages(req, res) {
  try {
    const doc = await SiteImages.findOne();
    res.json(normalizeSiteImages(doc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateSiteImages(req, res) {
  try {
    const payload = {
      bannerUrl: normalizeUrl(req.body?.bannerUrl),
      categoryImages: normalizeCategoryImages(req.body?.categoryImages)
    };

    const doc = await SiteImages.findOneAndUpdate({}, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    res.json(normalizeSiteImages(doc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getSiteImages,
  updateSiteImages
};
