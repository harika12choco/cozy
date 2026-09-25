/**
 * Saved (favourite) products.
 *
 * Only product ids are stored. The wishlist page resolves them through fetchProductsByIds(), so a
 * saved product always shows its current price, stock and image rather than a snapshot taken when
 * it was favourited. Kept in localStorage - like the cart does for signed-out shoppers - so the
 * feature costs no database reads on the free-tier backend and works without signing in.
 */
const WISHLIST_STORAGE_KEY = "cozy-candles-wishlist";
const WISHLIST_EVENT = "wishlist-updated";
const MAX_WISHLIST_ITEMS = 100;

function parseStored(raw) {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to parse wishlist data:", error);
    return [];
  }
}

function normalizeIds(ids) {
  const seen = new Set();

  return ids
    .map((id) => String(id ?? "").trim())
    .filter((id) => {
      if (!id || seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    })
    .slice(0, MAX_WISHLIST_ITEMS);
}

function readWishlist() {
  if (typeof window === "undefined") {
    return [];
  }

  return normalizeIds(parseStored(window.localStorage.getItem(WISHLIST_STORAGE_KEY)));
}

function writeWishlist(ids) {
  if (typeof window === "undefined") {
    return [];
  }

  const normalized = normalizeIds(ids);

  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    // A full or unavailable localStorage must never break browsing.
    console.error("Unable to save wishlist:", error);
    return readWishlist();
  }

  window.dispatchEvent(new Event(WISHLIST_EVENT));
  return normalized;
}

/** The id a product is saved under - the same one its product page is routed by. */
export function getWishlistId(product) {
  return String(product?.productId || product?.id || "").trim();
}

export function getWishlistItems() {
  return readWishlist();
}

export function getWishlistCount() {
  return readWishlist().length;
}

export function isWishlisted(productOrId) {
  const id = typeof productOrId === "string" ? productOrId.trim() : getWishlistId(productOrId);

  if (!id) {
    return false;
  }

  return readWishlist().includes(id);
}

export function addWishlistItem(productOrId) {
  const id = typeof productOrId === "string" ? productOrId.trim() : getWishlistId(productOrId);

  if (!id) {
    return readWishlist();
  }

  const current = readWishlist();

  if (current.includes(id)) {
    return current;
  }

  // Newest first, so the most recently saved product leads the wishlist page.
  return writeWishlist([id, ...current]);
}

export function removeWishlistItem(productOrId) {
  const id = typeof productOrId === "string" ? productOrId.trim() : getWishlistId(productOrId);

  if (!id) {
    return readWishlist();
  }

  return writeWishlist(readWishlist().filter((item) => item !== id));
}

/** Returns true when the product ended up saved, false when it was removed. */
export function toggleWishlistItem(productOrId) {
  const id = typeof productOrId === "string" ? productOrId.trim() : getWishlistId(productOrId);

  if (!id) {
    return false;
  }

  if (readWishlist().includes(id)) {
    removeWishlistItem(id);
    return false;
  }

  addWishlistItem(id);
  return true;
}

export function clearWishlist() {
  return writeWishlist([]);
}

/**
 * Calls back whenever the wishlist changes, including from another browser tab.
 * Returns an unsubscribe function.
 */
export function subscribeWishlist(callback) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(WISHLIST_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(WISHLIST_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
