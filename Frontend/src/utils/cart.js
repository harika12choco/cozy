import { auth } from "../firebase";
import {
  formatProductPrice,
  getCartLineFinalPrice,
  getFragrancePriceAdjustment,
  getPurchasableBasePrice,
  normalizeColorOption,
  normalizeFragranceOption,
  normalizeVariantOption,
  parseProductPrice
} from "./productPricing";

const CART_STORAGE_KEY = "cozy-candles-cart";
const PRODUCTION_BACKEND_API = "https://cozy-candles-backend.onrender.com/api";
const DEVELOPMENT_BACKEND_API = "/api";

function normalizeApiRoot(value) {
  const trimmed = String(value || "").trim().replace(/\/$/, "");

  if (!trimmed) {
    return "";
  }

  if (/\/api\/products$/i.test(trimmed)) {
    return trimmed.replace(/\/products$/i, "");
  }

  if (/\/api$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

function resolveCartApiRoot() {
  const envApiRoot = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL?.replace(/\/products\/?$/, "");

  if (envApiRoot) {
    return normalizeApiRoot(envApiRoot);
  }

  return import.meta.env.DEV ? DEVELOPMENT_BACKEND_API : PRODUCTION_BACKEND_API.replace(/\/$/, "");
}

const CART_API_ROOT = resolveCartApiRoot();

function parseStoredCart(savedCart) {
  if (!savedCart) {
    return [];
  }

  try {
    const parsedCart = JSON.parse(savedCart);
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Unable to parse cart data:", error);
    return [];
  }
}

function normalizeCartItem(product) {
  const itemId = String(product.itemId ?? product._id ?? "").trim();
  const productId = String(product.productId ?? product.id ?? product._id ?? "").trim();
  const name = String(product.name ?? "").trim();
  const selectedColor = normalizeColorOption(product.selectedColor);
  const selectedFragrance = normalizeFragranceOption(product.selectedFragrance);
  const selectedVariant = normalizeVariantOption(product.selectedVariant);
  const basePrice = product.basePrice !== undefined
    ? parseProductPrice(product.basePrice)
    : getPurchasableBasePrice(product, selectedVariant);
  const fragranceExtraCharge = product.fragranceExtraCharge !== undefined
    ? parseProductPrice(product.fragranceExtraCharge)
    : getFragrancePriceAdjustment(selectedFragrance);
  const finalPrice = product.basePrice !== undefined
    ? basePrice + fragranceExtraCharge
    : getCartLineFinalPrice({
        ...product,
        selectedFragrance
      });
  const price = formatProductPrice(finalPrice);
  const colorKey = selectedColor?.optionId || selectedColor?.name || "";
  const fragranceKey = selectedFragrance?.optionId || selectedFragrance?.name || "";
  const variantKey = selectedVariant?.optionId || selectedVariant?.name || "";
  const key = String(product.key ?? [productId || name, price, variantKey, colorKey, fragranceKey].filter(Boolean).join("::")).trim();

  return {
    itemId,
    key,
    productId,
    name,
    price,
    finalPrice,
    basePrice,
    fragranceExtraCharge,
    img: product.img ?? product.image ?? "",
    quantity: Math.max(1, Number(product.quantity ?? 1)),
    selectedColor,
    selectedFragrance,
    selectedVariant
  };
}

function normalizeCartItems(cartItems) {
  return cartItems
    .map(normalizeCartItem)
    .filter((item) => item.key && item.name && item.price);
}

function readCart() {
  if (typeof window === "undefined") {
    return [];
  }

  return normalizeCartItems(parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)));
}

function writeCart(cartItems) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedItems = normalizeCartItems(cartItems);
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizedItems));
  window.dispatchEvent(new Event("cart-updated"));
}

function mergeCartItems(primaryItems, secondaryItems) {
  const merged = new Map();

  [...secondaryItems, ...primaryItems].forEach((item) => {
    const normalizedItem = normalizeCartItem(item);
    const existingItem = merged.get(normalizedItem.key);

    if (!existingItem) {
      merged.set(normalizedItem.key, normalizedItem);
      return;
    }

    merged.set(normalizedItem.key, {
      ...existingItem,
      ...normalizedItem,
      quantity: Math.max(existingItem.quantity, normalizedItem.quantity)
    });
  });

  return Array.from(merged.values());
}

function getUserHeaders(user) {
  if (!user?.uid) {
    return null;
  }

  return {
    "x-user-id": user.uid,
    "x-user-email": user.email ?? ""
  };
}

async function requestCart(user, path, options = {}) {
  const headers = getUserHeaders(user);

  if (!headers) {
    throw new Error("User authentication required");
  }

  const response = await fetch(`${CART_API_ROOT}/cart${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...headers,
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const error = await response.json();
      message = error.error ?? error.message ?? message;
    } catch {
      message = `${message} (${response.status})`;
    }

    throw new Error(message);
  }

  return response.json();
}

async function fetchUserCart(user) {
  const cart = await requestCart(user, "/");
  return normalizeCartItems(cart?.items ?? []);
}

async function replaceUserCart(user, cartItems) {
  const normalizedCartItems = normalizeCartItems(cartItems);
  const payload = {
    items: normalizedCartItems
  };

  const savedCart = await requestCart(user, "/", {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  const nextItems = normalizeCartItems(savedCart?.items ?? payload.items);
  writeCart(nextItems);
  return nextItems;
}

async function addItemToServer(user, cartItem) {
  if (!cartItem.productId) {
    return normalizeCartItems(readCart());
  }

  const savedCart = await requestCart(user, "/", {
    method: "POST",
    body: JSON.stringify({
      productId: cartItem.productId,
      name: cartItem.name,
      img: cartItem.img,
      basePrice: cartItem.basePrice,
      finalPrice: cartItem.finalPrice,
      fragranceExtraCharge: cartItem.fragranceExtraCharge,
      price: cartItem.price,
      quantity: cartItem.quantity ?? 1,
      key: cartItem.key,
      selectedColor: cartItem.selectedColor,
      selectedFragrance: cartItem.selectedFragrance,
      selectedVariant: cartItem.selectedVariant
    })
  });

  const nextItems = normalizeCartItems(savedCart?.items ?? []);
  writeCart(nextItems);
  return nextItems;
}

async function updateServerItem(user, itemId, quantity) {
  if (!itemId) {
    return normalizeCartItems(readCart());
  }

  const savedCart = await requestCart(user, `/${encodeURIComponent(itemId)}`, {
    method: "PUT",
    body: JSON.stringify({ quantity })
  });

  const nextItems = normalizeCartItems(savedCart?.items ?? []);
  writeCart(nextItems);
  return nextItems;
}

async function removeServerItem(user, itemId) {
  if (!itemId) {
    return normalizeCartItems(readCart());
  }

  const savedCart = await requestCart(user, `/${encodeURIComponent(itemId)}`, {
    method: "DELETE"
  });

  const nextItems = normalizeCartItems(savedCart?.items ?? []);
  writeCart(nextItems);
  return nextItems;
}

export function getCartItems() {
  return readCart();
}

export function addItemToCart(product) {
  const nextItem = normalizeCartItem(product);
  const cartItems = readCart();
  const existingItem = cartItems.find((item) => item.key === nextItem.key);

  const updatedCart = existingItem
    ? cartItems.map((item) =>
        item.key === nextItem.key
          ? {
              ...item,
              quantity: item.quantity + nextItem.quantity
            }
          : item
      )
    : [...cartItems, nextItem];

  writeCart(updatedCart);
  if (auth.currentUser) {
    addItemToServer(auth.currentUser, nextItem).catch(() => {});
  }

  return updatedCart;
}

export function updateCartItemQuantity(itemKey, quantity) {
  const updatedCart = readCart()
    .map((item) =>
      item.key === itemKey
        ? {
            ...item,
            quantity
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  writeCart(updatedCart);
  if (auth.currentUser) {
    const targetItem = updatedCart.find((item) => item.key === itemKey);

    if (targetItem?.itemId) {
      updateServerItem(auth.currentUser, targetItem.itemId, quantity).catch(() => {});
    } else {
      replaceUserCart(auth.currentUser, updatedCart).catch(() => {});
    }
  }

  return updatedCart;
}

export function removeCartItem(itemKey) {
  const currentItems = readCart();
  const removedItem = currentItems.find((item) => item.key === itemKey);
  const updatedCart = currentItems.filter((item) => item.key !== itemKey);
  writeCart(updatedCart);
  if (auth.currentUser) {
    if (removedItem?.itemId) {
      removeServerItem(auth.currentUser, removedItem.itemId).catch(() => {});
    } else {
      replaceUserCart(auth.currentUser, updatedCart).catch(() => {});
    }
  }
  return updatedCart;
}

export async function syncCartWithServer(user) {
  if (!user?.uid) {
    const localCart = readCart();
    writeCart(localCart);
    return localCart;
  }

  const localCart = readCart();

  let remoteItems = [];

  try {
    remoteItems = await fetchUserCart(user);
  } catch {
    return localCart;
  }

  const mergedItems = mergeCartItems(localCart, remoteItems);

  try {
    return await replaceUserCart(user, mergedItems);
  } catch {
    return mergedItems;
  }
}
