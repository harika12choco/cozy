const CART_STORAGE_KEY = "cozy-candles-cart";

function readCart() {
  if (typeof window === "undefined") {
    return [];
  }

  const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

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

function writeCart(cartItems) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  window.dispatchEvent(new Event("cart-updated"));
}

export function getCartItems() {
  return readCart();
}

export function addItemToCart(product) {
  const cartItems = readCart();
  const existingItem = cartItems.find((item) => item.name === product.name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cartItems.push({
      ...product,
      quantity: 1,
    });
  }

  writeCart(cartItems);
  return cartItems;
}

export function updateCartItemQuantity(productName, quantity) {
  const updatedCart = readCart()
    .map((item) =>
      item.name === productName
        ? {
            ...item,
            quantity,
          }
        : item
    )
    .filter((item) => item.quantity > 0);

  writeCart(updatedCart);
  return updatedCart;
}

export function removeCartItem(productName) {
  const updatedCart = readCart().filter((item) => item.name !== productName);
  writeCart(updatedCart);
  return updatedCart;
}
