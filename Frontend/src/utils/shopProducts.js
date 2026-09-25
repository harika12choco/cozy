import img1 from "../assets/product categories/jar and bowl.png";
import img2 from "../assets/product categories/Floral and aesthetic.png";
import img3 from "../assets/product categories/moment and memories.png";
import img4 from "../assets/product categories/dessert.jpeg";
import img5 from "../assets/product categories/gifting collection.png";
import img6 from "../assets/product categories/festive collection.png";
import { isKnownCategory, normalizeCategory } from "./menuData";
import { resolveProductsApiUrl } from "./apiConfig";
import { readStaticBestSellerProducts, readStaticProducts } from "./staticProducts";
import { formatProductPrice, normalizeColorOption, normalizeFragranceOption, parseProductPrice } from "./productPricing";

const PRODUCTS_API_URL = resolveProductsApiUrl();

const imageMap = {
  "/src/assets/candles/1.png": img1,
  "/src/assets/candles/2.png": img2,
  "/src/assets/candles/3.png": img3,
  "/src/assets/candles/4.png": img4,
  "/src/assets/candles/5.png": img5,
  "/src/assets/candles/6.png": img6
};
function normalizeProductName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isPublicStorefrontProduct(product) {
  const productName = normalizeProductName(product?.name);
  const productStatus = String(product?.status ?? "active").trim().toLowerCase();
  const productImage = String(product?.image ?? product?.img ?? "").trim().toLowerCase();

  return (
    productStatus !== "draft" &&
    productStatus !== "test" &&
    productName !== "test" &&
    !productImage.includes("test")
  );
}

/**
 * An empty `candleColors` array must not hide options that are only present on `colors`,
 * otherwise products keep their customization hidden on the storefront.
 */
export function pickOptionList(primary, fallback) {
  if (Array.isArray(primary) && primary.length > 0) {
    return primary;
  }

  return Array.isArray(fallback) ? fallback : [];
}

function formatShopProducts(products) {
  return products
    .filter(isPublicStorefrontProduct)
    .map((product) => {
      const basePrice = parseProductPrice(product.price || product.basePrice);
      const image = resolveProductImage(product.featuredImage || product.image) || img1;
      const images = collectProductImages(product, image);
      const candleColors = pickOptionList(product.candleColors, product.colors)
        .map((option, index) => normalizeColorOption(option, `color-${index}`))
        .filter(Boolean);
      const fragrances = (Array.isArray(product.fragrances) ? product.fragrances : [])
        .map((option, index) => normalizeFragranceOption(option, `fragrance-${index}`))
        .filter(Boolean);

      return {
        id: product._id ?? product.id ?? product.name,
        productId: product._id ?? product.id ?? "",
        name: product.name,
        // Products saved under a retired category resolve to the default one instead of
        // dropping out of every filter.
        category: normalizeCategory(product.category),
        collection: product.collection ?? product.collectionName ?? product.collections?.[0] ?? product.category ?? "",
        collectionName: product.collectionName ?? product.collection ?? product.collections?.[0] ?? "",
        collections: Array.isArray(product.collections) ? product.collections : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        basePrice,
        salePrice: parseProductPrice(product.salePrice),
        offerPercentage: Number(product.offerPercentage ?? 0),
        price: formatProductPrice(basePrice),
        note: product.shortDescription || product.description,
        shortDescription: product.shortDescription ?? "",
        description: product.description,
        img: image,
        image,
        images,
        galleryImages: images,
        colors: candleColors,
        candleColors,
        fragrances,
        customizable: Boolean(product.customizable ?? (candleColors.length > 0 || fragrances.length > 0)),
        staticProduct: Boolean(product.staticProduct),
        giftWrapPrice: Number(product.giftWrapPrice ?? 80),
        stock: Number(product.stock ?? 0),
        bestSeller: Boolean(product.bestSeller ?? product.isBestSeller),
        isBestSeller: Boolean(product.isBestSeller ?? product.bestSeller),
        burnTime: product.burnTime ?? "",
        weight: product.weight ?? "",
        variants: Array.isArray(product.variants) ? product.variants : [],
        reviews: Array.isArray(product.reviews) ? product.reviews : []
      };
    });
}

function resolveProductImage(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return imageMap[value] ?? value;
  }

  return imageMap[value.url] ?? value.url ?? value.secureUrl ?? value.secure_url ?? value.image ?? "";
}

function collectProductImages(product, fallbackImage) {
  const imageCandidates = [
    product.featuredImage,
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : [])
  ];
  const seen = new Set();

  return imageCandidates
    .map(resolveProductImage)
    .filter(Boolean)
    .concat(fallbackImage ? [fallbackImage] : [])
    .filter((image) => {
      const key = String(image);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

/**
 * Categories are a flat list, so a product matches when its own category resolves to the selected
 * one. Resolving through normalizeCategory means a product still carrying a retired category name
 * is found under the default category instead of vanishing from every filter.
 */
export function matchesCategory(product, selectedCategory) {
  if (!selectedCategory) {
    return true;
  }

  if (!isKnownCategory(selectedCategory)) {
    return String(product.category ?? "").trim().toLowerCase() === selectedCategory.trim().toLowerCase();
  }

  return normalizeCategory(product.category) === normalizeCategory(selectedCategory);
}

function buildProductsUrl({ search, bestSeller, ids } = {}) {
  if (search) {
    return `${PRODUCTS_API_URL}/search?q=${encodeURIComponent(search)}`;
  }

  const params = new URLSearchParams();

  if (bestSeller !== undefined && bestSeller !== null) {
    params.set("bestSeller", String(bestSeller));
  }

  if (Array.isArray(ids) && ids.length > 0) {
    params.set("ids", ids.join(","));
  }

  const query = params.toString();
  return query ? `${PRODUCTS_API_URL}?${query}` : PRODUCTS_API_URL;
}

// A sleeping free-tier backend takes a while to answer its first request. Without a retry the
// very first fetch fails, every caller below falls back to the offline catalog, and the shopper
// silently sees the hardcoded prices instead of the live ones the admin just edited.
const FETCH_RETRY_DELAYS_MS = [1500, 4000];

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function fetchProducts(options = {}) {
  const url = buildProductsUrl(options);
  let lastError = null;

  for (let attempt = 0; attempt <= FETCH_RETRY_DELAYS_MS.length; attempt += 1) {
    if (attempt > 0) {
      await delay(FETCH_RETRY_DELAYS_MS[attempt - 1]);
    }

    try {
      // cache: "no-store" keeps an edited price from being served out of the browser cache.
      const response = await fetch(url, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Unable to load products (${response.status})`);
      }

      const products = await response.json();
      return Array.isArray(products) ? products : [];
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Unable to load products");
}

/**
 * Last-known-good copy of the live catalogue.
 *
 * The offline catalogue in staticProducts.js carries prices that were hardcoded at build time, so
 * using it as the only fallback meant a shopper could be shown a price the admin had since
 * changed. Caching the real response and preferring it keeps the fallback fast AND correctly
 * priced; the hardcoded catalogue stays as the last resort for a browser that has never once
 * reached the API.
 */
const CATALOG_CACHE_KEY = "cozy-catalog-cache";
const CATALOG_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function writeCatalogCache(bucket, products) {
  if (typeof window === "undefined" || !Array.isArray(products) || products.length === 0) {
    return;
  }

  try {
    const store = readCatalogStore();
    store[bucket] = { savedAt: Date.now(), products };
    window.localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(store));
  } catch {
    // A full or unavailable localStorage must never break product loading.
  }
}

function readCatalogStore() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(CATALOG_CACHE_KEY));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readCatalogCache(bucket) {
  const entry = readCatalogStore()[bucket];

  if (!entry || !Array.isArray(entry.products) || entry.products.length === 0) {
    return null;
  }

  if (Date.now() - Number(entry.savedAt || 0) > CATALOG_CACHE_TTL_MS) {
    return null;
  }

  return entry.products;
}

export async function readShopProducts() {
  try {
    const products = await fetchProducts();
    const formatted = formatShopProducts(products);
    if (formatted.length > 0) {
      writeCatalogCache("all", formatted);
      return formatted;
    }
  } catch (error) {
    console.error("Unable to load products:", error);
  }

  return readCatalogCache("all") ?? [...readStaticProducts(), ...readStaticBestSellerProducts()];
}

export async function readBestSellerProducts() {
  try {
    const products = await fetchProducts({ bestSeller: true });
    const formatted = formatShopProducts(products);
    if (formatted.length > 0) {
      writeCatalogCache("bestSellers", formatted);
      return formatted;
    }
  } catch (error) {
    console.error("Unable to load best sellers:", error);
  }

  return readCatalogCache("bestSellers") ?? readStaticBestSellerProducts();
}

export async function searchProducts(query) {
  try {
    const products = await fetchProducts({ search: query });
    const formatted = formatShopProducts(products);
    if (formatted.length > 0) {
      return formatted;
    }
  } catch (error) {
    console.error("Unable to search products:", error);
  }
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  return [...readStaticProducts(), ...readStaticBestSellerProducts()].filter((product) =>
    [product.name, product.description, product.category, product.price]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );
}

export async function fetchProductsByIds(ids) {
  try {
    const idList = Array.isArray(ids) ? ids.map((id) => String(id)) : [];
    // Hardcoded ids are requested from the API as well: the backend merges the admin's overrides
    // into them, so a price edited in the admin panel shows on the product page. The offline
    // catalogue below still answers when the API cannot be reached.
    if (idList.length > 0) {
      const products = await fetchProducts({ ids: idList });
      const formatted = formatShopProducts(products);
      if (formatted.length > 0) {
        return formatted;
      }
    }
  } catch (error) {
    console.error("Unable to load products by ids:", error);
  }
  const idList = Array.isArray(ids) ? ids.map((id) => String(id)) : [];
  const cached = (readCatalogCache("all") ?? []).filter(
    (product) => idList.includes(String(product.id)) || idList.includes(String(product.productId))
  );

  if (cached.length > 0) {
    return cached;
  }

  return readStaticProducts({ includeHidden: true }).filter((product) => idList.includes(product.id));
}
