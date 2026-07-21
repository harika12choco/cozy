import img1 from "../assets/product categories/jar and bowl.png";
import img2 from "../assets/product categories/Floral and aesthetic.png";
import img3 from "../assets/product categories/moment and memories.png";
import img4 from "../assets/product categories/dessert.jpeg";
import img5 from "../assets/product categories/gifting collection.png";
import img6 from "../assets/product categories/festive collection.png";
import menuData from "./menuData";
import { resolveProductsApiUrl } from "./apiConfig";
import { isStaticProductId, readStaticBestSellerProducts, readStaticProducts } from "./staticProducts";
import { normalizeColorOption, normalizeFragranceOption, parseProductPrice } from "./productPricing";

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
      const basePrice = parseProductPrice(product.basePrice || product.price);
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
        category: product.category ?? "",
        collection: product.collection ?? product.collectionName ?? product.collections?.[0] ?? product.category ?? "",
        collectionName: product.collectionName ?? product.collection ?? product.collections?.[0] ?? "",
        collections: Array.isArray(product.collections) ? product.collections : [],
        tags: Array.isArray(product.tags) ? product.tags : [],
        basePrice,
        salePrice: parseProductPrice(product.salePrice),
        offerPercentage: Number(product.offerPercentage ?? 0),
        price: `Rs ${basePrice}`,
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

export function matchesCategory(product, selectedCategory) {
  if (!selectedCategory) {
    return true;
  }

  const normalizedCategory = selectedCategory.trim().toLowerCase();
  const productCategory = String(product.category ?? "").trim().toLowerCase();

  if (productCategory === normalizedCategory) {
    return true;
  }

  const section = menuData.find(
    (entry) =>
      entry.title.trim().toLowerCase() === normalizedCategory ||
      entry.items.some((item) => item.trim().toLowerCase() === normalizedCategory)
  );

  if (!section) {
    return productCategory === normalizedCategory;
  }

  if (section.title.trim().toLowerCase() === normalizedCategory) {
    const sectionCategories = [section.title, ...section.items].map((item) => item.trim().toLowerCase());
    return sectionCategories.includes(productCategory);
  }

  return productCategory === normalizedCategory;
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

async function fetchProducts(options = {}) {
  const response = await fetch(buildProductsUrl(options));

  if (!response.ok) {
    throw new Error(`Unable to load products (${response.status})`);
  }

  const products = await response.json();
  return Array.isArray(products) ? products : [];
}

export async function readShopProducts() {
  try {
    const products = await fetchProducts();
    const formatted = formatShopProducts(products);
    if (formatted.length > 0) {
      return formatted;
    }
  } catch (error) {
    console.error("Unable to load products:", error);
  }
  return [...readStaticProducts(), ...readStaticBestSellerProducts()];
}

export async function readBestSellerProducts() {
  try {
    const products = await fetchProducts({ bestSeller: true });
    const formatted = formatShopProducts(products);
    if (formatted.length > 0) {
      return formatted;
    }
  } catch (error) {
    console.error("Unable to load best sellers:", error);
  }
  return readStaticBestSellerProducts();
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
    const apiIds = idList.filter((id) => !isStaticProductId(id));
    if (apiIds.length > 0) {
      const products = await fetchProducts({ ids: apiIds });
      const formatted = formatShopProducts(products);
      if (formatted.length > 0) {
        return formatted;
      }
    }
  } catch (error) {
    console.error("Unable to load products by ids:", error);
  }
  const idList = Array.isArray(ids) ? ids.map((id) => String(id)) : [];
  return readStaticProducts({ includeHidden: true }).filter((product) => idList.includes(product.id));
}
