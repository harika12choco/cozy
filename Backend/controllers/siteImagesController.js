const SiteImages = require("../models/SiteImages");
const { sendError } = require("../utils/errorResponse");

const DEFAULT_CATEGORY_IMAGE_SOURCES = {
  "Moments & Memories": process.env.SITE_IMAGE_CATEGORY_MOMENTS_MEMORIES,
  "Gifting Collection": process.env.SITE_IMAGE_CATEGORY_GIFTING_COLLECTION,
  "Festive Collection": process.env.SITE_IMAGE_CATEGORY_FESTIVE_COLLECTION,
  "Dessert Candle Collection": process.env.SITE_IMAGE_CATEGORY_DESSERT_CANDLE_COLLECTION,
  "Floral & Aesthetic": process.env.SITE_IMAGE_CATEGORY_FLORAL_AESTHETIC,
  "Jar & Bowl Collection": process.env.SITE_IMAGE_CATEGORY_JAR_BOWL_COLLECTION,
  Customized: process.env.SITE_IMAGE_CATEGORY_CUSTOMIZED,
  "Wedding & Event": process.env.SITE_IMAGE_CATEGORY_WEDDING_EVENT
};

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

function getDefaultCategoryImages() {
  return Object.entries(DEFAULT_CATEGORY_IMAGE_SOURCES).reduce((accumulator, [key, value]) => {
    const url = normalizeUrl(value);

    if (url) {
      accumulator[key] = url;
    }

    return accumulator;
  }, {});
}

function normalizeSiteImages(doc) {
  if (!doc) {
    return { bannerUrl: "", categoryImages: getDefaultCategoryImages() };
  }

  const plain = doc.toObject ? doc.toObject() : doc;
  const storedCategoryImages = plain.categoryImages instanceof Map
    ? Object.fromEntries(plain.categoryImages)
    : plain.categoryImages || {};
  const defaultCategoryImages = getDefaultCategoryImages();
  const categoryImages = {
    ...defaultCategoryImages,
    ...storedCategoryImages
  };

  return {
    bannerUrl: plain.bannerUrl || "",
    categoryImages
  };
}

async function getSiteImages(req, res) {
  try {
    const doc = await SiteImages.findOne();
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.json(normalizeSiteImages(doc));
  } catch (error) {
    sendError(res, error);
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
    sendError(res, error);
  }
}

module.exports = {
  getSiteImages,
  updateSiteImages
};
