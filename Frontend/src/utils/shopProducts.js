import img1 from "../assets/candles/1.png";
import img2 from "../assets/candles/2.png";
import img3 from "../assets/candles/3.png";
import img4 from "../assets/candles/4.png";
import img5 from "../assets/candles/5.png";
import img6 from "../assets/candles/6.png";
import menuData from "./menuData";

const PRODUCTION_PRODUCTS_API = "https://cozy-candles-backend.onrender.com/api/products";

function normalizeProductsApi(value) {
  const trimmed = String(value || "").trim().replace(/\/$/, "");

  if (!trimmed) {
    return "";
  }

  if (/\/api\/products$/i.test(trimmed)) {
    return trimmed;
  }

  if (/\/api$/i.test(trimmed)) {
    return `${trimmed}/products`;
  }

  return `${trimmed}/api/products`;
}

function resolveProductsApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return normalizeProductsApi(import.meta.env.VITE_API_URL);
  }

  return PRODUCTION_PRODUCTS_API;
}

const PRODUCTS_API_URL = resolveProductsApiUrl();

const imageMap = {
  "/src/assets/candles/1.png": img1,
  "/src/assets/candles/2.png": img2,
  "/src/assets/candles/3.png": img3,
  "/src/assets/candles/4.png": img4,
  "/src/assets/candles/5.png": img5,
  "/src/assets/candles/6.png": img6
};

export function isPublicStorefrontProduct(product) {
  const productName = String(product?.name ?? "").trim().toLowerCase();
  const productStatus = String(product?.status ?? "active").trim().toLowerCase();
  const productImage = String(product?.image ?? product?.img ?? "").trim().toLowerCase();

  return productStatus !== "draft" && productStatus !== "test" && productName !== "test" && !productImage.includes("test");
}

function formatShopProducts(products) {
  return products
    .filter(isPublicStorefrontProduct)
    .map((product) => ({
      id: product._id ?? product.id ?? product.name,
      productId: product._id ?? product.id ?? "",
      name: product.name,
      category: product.category ?? "",
      price: `Rs ${product.price}`,
      note: product.description,
      img: imageMap[product.image] ?? product.image ?? img1,
      stock: Number(product.stock ?? 0),
      bestSeller: Boolean(product.bestSeller ?? product.isBestSeller),
      isBestSeller: Boolean(product.isBestSeller ?? product.bestSeller)
    }));
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
    return formatShopProducts(products);
  } catch (error) {
    console.error("Unable to load products:", error);
    return [];
  }
}

export async function readBestSellerProducts() {
  try {
    const products = await fetchProducts({ bestSeller: true });
    return formatShopProducts(products);
  } catch (error) {
    console.error("Unable to load best sellers:", error);
    return [];
  }
}

export async function searchProducts(query) {
  try {
    const products = await fetchProducts({ search: query });
    return formatShopProducts(products);
  } catch (error) {
    console.error("Unable to search products:", error);
    return [];
  }
}

export async function fetchProductsByIds(ids) {
  try {
    const products = await fetchProducts({ ids });
    return formatShopProducts(products);
  } catch (error) {
    console.error("Unable to load products by ids:", error);
    return [];
  }
}
