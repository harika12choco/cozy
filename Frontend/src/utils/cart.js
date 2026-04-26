import { auth } from "../firebase";

const CART_STORAGE_KEY = "cozy-candles-cart";
const PRODUCTION_BACKEND_API = "https://cozy-candles-backend.onrender.com/api";

function resolveCartApiRoot() {
  const envApiRoot = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL?.replace(/\/products\/?$/, "");

  if (envApiRoot) {
    return envApiRoot.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return (isLocalHost ? "http://localhost:5000/api" : PRODUCTION_BACKEND_API).replace(/\/$/, "");
  }

  return "http://localhost:5000/api";
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
  const productId = String(product.productId ?? product.id ?? product._id ?? "").trim();
  const price = String(product.price ?? "").trim();
  const name = String(product.name ?? "").trim();
  const key = String(product.key ?? [productId || name, price].filter(Boolean).join("::")).trim();

  return {
    key,
    productId,
    name,
    price,
    img: product.img ?? product.image ?? "",
    quantity: Math.max(1, Number(product.quantity ?? 1))
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

async function requestCart(path, options = {}) {
  const response = await fetch(`${CART_API_ROOT}/cart${path}`, {
    headers: {
      "Content-Type": "application/json",
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

async function persistUserCart(user, cartItems) {
  if (!user?.uid) {
    return normalizeCartItems(cartItems);
  }

  const payload = {
    email: user.email ?? "",
    items: normalizeCartItems(cartItems)
  };

  const savedCart = await requestCart(`/${encodeURIComponent(user.uid)}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  const nextItems = normalizeCartItems(savedCart?.items ?? payload.items);
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
              quantity: item.quantity + 1
            }
          : item
      )
    : [...cartItems, nextItem];

  writeCart(updatedCart);
  persistUserCart(auth.currentUser, updatedCart).catch((error) => {
    console.error("Unable to sync cart:", error);
  });

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
  persistUserCart(auth.currentUser, updatedCart).catch((error) => {
    console.error("Unable to sync cart:", error);
  });

  return updatedCart;
}

export function removeCartItem(itemKey) {
  const updatedCart = readCart().filter((item) => item.key !== itemKey);
  writeCart(updatedCart);
  persistUserCart(auth.currentUser, updatedCart).catch((error) => {
    console.error("Unable to sync cart:", error);
  });
  return updatedCart;
}

export async function syncCartWithServer(user) {
  if (!user?.uid) {
    const localCart = readCart();
    writeCart(localCart);
    return localCart;
  }

  const localCart = readCart();
  const remoteCart = await requestCart(`/${encodeURIComponent(user.uid)}?email=${encodeURIComponent(user.email ?? "")}`);
  const mergedItems = mergeCartItems(localCart, normalizeCartItems(remoteCart?.items ?? []));

  return persistUserCart(user, mergedItems);
}
