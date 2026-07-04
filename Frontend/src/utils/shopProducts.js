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

const hiddenStorefrontProductNames = new Set([
  "champagne glow candle",
  "lotus aura candle",
  "velvet petals",
  "mini floral satche",
  "mini floral sachet",
  "lotus boat candle",
  "sweet love candle box",
  "peony"
]);

const hiddenStorefrontProductNameParts = [
  "mini floral satche",
  "mini floral sachet",
  "lotus boat candle",
  "sweet love candle box"
];

function normalizeProductName(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function isPublicStorefrontProduct(product) {
  const productName = normalizeProductName(product?.name);
  const productStatus = String(product?.status ?? "active").trim().toLowerCase();
  const productImage = String(product?.image ?? product?.img ?? "").trim().toLowerCase();
  const isHiddenProduct =
    hiddenStorefrontProductNames.has(productName) ||
    hiddenStorefrontProductNameParts.some((namePart) => productName.includes(namePart));

  return (
    productStatus !== "draft" &&
    productStatus !== "test" &&
    productName !== "test" &&
    !isHiddenProduct &&
    !productImage.includes("test")
  );
}

function formatShopProducts(products) {
  return products
    .filter(isPublicStorefrontProduct)
    .map((product) => {
      const basePrice = parseProductPrice(product.basePrice ?? product.price);
      const image = resolveProductImage(product.featuredImage ?? product.image) ?? img1;
      const images = collectProductImages(product, image);
      const candleColors = (Array.isArray(product.candleColors) ? product.candleColors : product.colors ?? [])
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
        stock: Number(product.stock ?? 0),
        bestSeller: Boolean(product.bestSeller ?? product.isBestSeller),
        isBestSeller: Boolean(product.isBestSeller ?? product.bestSeller),
        burnTime: product.burnTime ?? "",
        weight: product.weight ?? "",
        variants: Array.isArray(product.variants) ? product.variants : [],
        customizationOptions: Array.isArray(product.customizationOptions) ? product.customizationOptions : [],
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
  const staticProducts = [...readStaticProducts(), ...readStaticBestSellerProducts()];

  try {
    const products = await fetchProducts();
    return [...staticProducts, ...formatShopProducts(products)];
  } catch (error) {
    console.error("Unable to load products:", error);
    return staticProducts;
  }
}

export async function readBestSellerProducts() {
  const staticProducts = readStaticBestSellerProducts();

  try {
    const products = await fetchProducts({ bestSeller: true });
    return [...staticProducts, ...formatShopProducts(products)];
  } catch (error) {
    console.error("Unable to load best sellers:", error);
    return staticProducts;
  }
}

export async function searchProducts(query) {
  const normalizedQuery = String(query ?? "").trim().toLowerCase();
  const staticMatches = [...readStaticProducts(), ...readStaticBestSellerProducts()].filter((product) =>
    [product.name, product.description, product.category, product.price]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery))
  );

  try {
    const products = await fetchProducts({ search: query });
    return [...staticMatches, ...formatShopProducts(products)];
  } catch (error) {
    console.error("Unable to search products:", error);
    return staticMatches;
  }
}

export async function fetchProductsByIds(ids) {
  try {
    const idList = Array.isArray(ids) ? ids.map((id) => String(id)) : [];
    const staticProducts = readStaticProducts({ includeHidden: true }).filter((product) => idList.includes(product.id));
    const apiIds = idList.filter((id) => !isStaticProductId(id));
    const products = apiIds.length > 0 ? await fetchProducts({ ids: apiIds }) : [];
    return [...staticProducts, ...formatShopProducts(products)];
  } catch (error) {
    console.error("Unable to load products by ids:", error);
    return readStaticProducts({ includeHidden: true }).filter((product) => ids.includes(product.id));
  }
}
