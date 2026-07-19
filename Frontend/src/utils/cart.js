import { auth } from "../firebase";
import { resolveApiRoot } from "./apiConfig";
import {
  formatProductPrice,
  getFragrancePriceAdjustment,
  getPurchasableBasePrice,
  normalizeColorOption,
  normalizeFragranceOption,
  normalizeVariantOption,
  parseProductPrice
} from "./productPricing";

const CART_STORAGE_KEY = "cozy-candles-cart";
const CART_API_ROOT = resolveApiRoot();

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

  const giftWrap = Boolean(product.giftWrap);
  const giftWrapPrice = parseProductPrice(product.giftWrapPrice || 80);

  const finalPrice = basePrice + fragranceExtraCharge + (giftWrap ? giftWrapPrice : 0);
  const price = formatProductPrice(finalPrice);
  const colorKey = selectedColor?.optionId || selectedColor?.name || "";
  const fragranceKey = selectedFragrance?.optionId || selectedFragrance?.name || "";
  const variantKey = selectedVariant?.optionId || selectedVariant?.name || "";
  const key = String(product.key ?? [productId || name, price, variantKey, colorKey, fragranceKey, giftWrap ? "giftwrap" : "no-giftwrap"].filter(Boolean).join("::")).trim();

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
    selectedVariant,
    giftWrap,
    giftWrapPrice
  };
}

function normalizeCartItems(cartItems) {
  return cartItems
    .map(normalizeCartItem)
    .filter((item) => item.key && item.name && item.price);
}

const CART_TOTALS_KEY = "cozy-candles-cart-totals";

export function writeCartTotals(subtotal, shipping, grandTotal) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(CART_TOTALS_KEY, JSON.stringify({ subtotal, shipping, grandTotal }));
}

export function readCartTotals() {
  if (typeof window === "undefined") {
    return { subtotal: 0, shipping: 0, grandTotal: 0 };
  }
  try {
    const data = JSON.parse(window.localStorage.getItem(CART_TOTALS_KEY));
    if (data) return data;
  } catch {}

  // Fallback local calculation
  const items = readCart();
  const subtotal = items.reduce((total, item) => total + (item.finalPrice || 0) * (item.quantity || 0), 0);
  const shipping = subtotal === 0 ? 0 : (subtotal < 1500 ? 190 : 390);
  const grandTotal = subtotal + shipping;

  return { subtotal, shipping, grandTotal };
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
  
  // Calculate local fallback totals immediately on write
  const subtotal = normalizedItems.reduce((total, item) => total + (item.finalPrice || 0) * (item.quantity || 0), 0);
  const shipping = subtotal === 0 ? 0 : (subtotal < 1500 ? 190 : 390);
  writeCartTotals(subtotal, shipping, subtotal + shipping);

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

/**
 * CRIT-2 FIX (frontend): Gets a fresh Firebase ID token and returns it
 * as an Authorization header. The backend verifies the token
 * cryptographically — no header can be forged by a third party.
 */
export async function getUserHeaders(user) {
  if (!user?.uid) {
    return null;
  }
  try {
    const token = await user.getIdToken();
    return {
      "Authorization": `Bearer ${token}`
    };
  } catch {
    return null;
  }
}

async function requestCart(user, path, options = {}) {
  const userHeaders = await getUserHeaders(user);

  if (!userHeaders) {
    throw new Error("User authentication required");
  }

  const { headers, ...restOptions } = options;
  const response = await fetch(`${CART_API_ROOT}/cart${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...userHeaders,
      ...(headers ?? {})
    },
    ...restOptions
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
  writeCartTotals(cart?.subtotal || 0, cart?.shipping || 0, cart?.grandTotal || 0);
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

  writeCartTotals(savedCart?.subtotal || 0, savedCart?.shipping || 0, savedCart?.grandTotal || 0);
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
      quantity: cartItem.quantity ?? 1,
      key: cartItem.key,
      selectedColor: cartItem.selectedColor,
      selectedFragrance: cartItem.selectedFragrance,
      selectedVariant: cartItem.selectedVariant,
      giftWrap: cartItem.giftWrap
    })
  });

  writeCartTotals(savedCart?.subtotal || 0, savedCart?.shipping || 0, savedCart?.grandTotal || 0);
  const nextItems = normalizeCartItems(savedCart?.items ?? []);
  writeCart(nextItems);
  return nextItems;
}

async function updateServerItem(user, itemId, updates) {
  if (!itemId) {
    return normalizeCartItems(readCart());
  }

  const savedCart = await requestCart(user, `/${encodeURIComponent(itemId)}`, {
    method: "PUT",
    body: JSON.stringify({
      quantity: updates.quantity,
      giftWrap: updates.giftWrap
    })
  });

  writeCartTotals(savedCart?.subtotal || 0, savedCart?.shipping || 0, savedCart?.grandTotal || 0);
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

  writeCartTotals(savedCart?.subtotal || 0, savedCart?.shipping || 0, savedCart?.grandTotal || 0);
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
      updateServerItem(auth.currentUser, targetItem.itemId, { quantity }).catch(() => {});
    } else {
      replaceUserCart(auth.currentUser, updatedCart).catch(() => {});
    }
  }

  return updatedCart;
}

export function toggleCartItemGiftWrap(itemKey, giftWrap) {
  const cartItems = readCart();
  const targetItem = cartItems.find((item) => item.key === itemKey);
  if (!targetItem) {
    return cartItems;
  }

  const updatedItem = normalizeCartItem({
    ...targetItem,
    giftWrap,
    key: undefined
  });

  const updatedCart = [];
  for (const item of cartItems) {
    if (item.key === itemKey) {
      const existingIndex = updatedCart.findIndex((x) => x.key === updatedItem.key);
      if (existingIndex !== -1) {
        updatedCart[existingIndex].quantity += targetItem.quantity;
      } else {
        updatedCart.push(updatedItem);
      }
    } else {
      const existingIndex = updatedCart.findIndex((x) => x.key === item.key);
      if (existingIndex !== -1) {
        updatedCart[existingIndex].quantity += item.quantity;
      } else {
        updatedCart.push(item);
      }
    }
  }

  writeCart(updatedCart);

  if (auth.currentUser) {
    if (targetItem.itemId) {
      updateServerItem(auth.currentUser, targetItem.itemId, { giftWrap }).catch(() => {});
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
