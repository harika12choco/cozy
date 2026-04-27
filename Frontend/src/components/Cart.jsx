import { onAuthStateChanged, signInWithPopup } from "firebase/auth";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, provider } from "../firebase";
import {
  getCartItems,
  removeCartItem,
  syncCartWithServer,
  updateCartItemQuantity
} from "../utils/cart";
import { orderService } from "../admin/services/orderService";
import "../styles/Cart.css";

function parsePrice(price) {
  const numericPrice = Number(String(price).replace(/[^\d.]/g, ""));
  return Number.isNaN(numericPrice) ? 0 : numericPrice;
}

export default function Cart() {
  const [cartItems, setCartItems] = useState(() => getCartItems());
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: ""
  });
  const [validationErrors, setValidationErrors] = useState({
    phone: "",
    pincode: ""
  });

  const navigate = useNavigate();
  const [user, setUser] = useState(() => auth.currentUser);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    function syncCart() {
      setCartItems(getCartItems());
    }

    window.addEventListener("cart-updated", syncCart);
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("cart-updated", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);

      if (currentUser) {
        syncCartWithServer(currentUser)
          .then((items) => {
            setCartItems(items);
          })
          .catch((error) => {
            console.error("Unable to sync cart:", error);
          });
      } else {
        setCartItems(getCartItems());
      }
    });

    return unsubscribe;
  }, []);

  const totalPrice = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + parsePrice(item.price) * item.quantity,
        0
      ),
    [cartItems]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    const normalizedValue =
      name === "phone" || name === "pincode"
        ? value.replace(/[^0-9]/g, "").slice(0, name === "phone" ? 10 : 6)
        : value;

    setCustomer((current) => ({
      ...current,
      [name]: normalizedValue
    }));

    if (name === "phone") {
      setValidationErrors((current) => ({
        ...current,
        phone: normalizedValue.length > 0 && !/^[0-9]{10}$/.test(normalizedValue)
          ? "Please enter a valid 10-digit phone number."
          : ""
      }));
    }

    if (name === "pincode") {
      setValidationErrors((current) => ({
        ...current,
        pincode: normalizedValue.length > 0 && !/^[0-9]{6}$/.test(normalizedValue)
          ? "Please enter a valid 6-digit pincode."
          : ""
      }));
    }
  };

  function handleNumericKeyDown(event) {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End"
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      alert("Login successful!");
    } catch (error) {
      console.log(error);
    }
  };

  if (!authReady) {
    return (
      <main className="cart-page">
        <section className="cart-empty">
          <h2>Checking your login...</h2>
        </section>
      </main>
    );
  }

  const placeOrderWhatsApp = async () => {
    if (cartItems.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    if (!customer.name || !customer.phone || !customer.address || !customer.pincode) {
      alert("Please fill all delivery details.");
      return;
    }

    if (!/^[0-9]{10}$/.test(customer.phone)) {
      setValidationErrors((current) => ({
        ...current,
        phone: "Please enter a valid 10-digit phone number."
      }));
      return;
    }

    if (!/^[0-9]{6}$/.test(customer.pincode)) {
      setValidationErrors((current) => ({
        ...current,
        pincode: "Please enter a valid 6-digit pincode."
      }));
      return;
    }

    if (customer.address.length > 200) {
      alert("Address is too long. Please shorten it.");
      return;
    }

    const phone = "918688942497";
    const orderDate = new Date().toISOString().slice(0, 10);
    const email = user?.email || "";

    try {
      setPlacingOrder(true);
      setOrderError("");

      await orderService.create({
        customer: customer.name,
        email,
        phone: customer.phone,
        address: customer.address,
        pincode: customer.pincode,
        date: orderDate,
        items: cartItems.reduce((total, item) => total + item.quantity, 0),
        total: totalPrice,
        payment: "WhatsApp",
        status: "pending",
        placedByUid: user?.uid || null,
        placedByName: user?.displayName || customer.name,
        lineItems: cartItems.map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      });

      let message = `Cozy Candles Order

Name: ${customer.name}
Email: ${email || "Not shared"}
Phone: ${customer.phone}
Address: ${customer.address}
Pincode: ${customer.pincode}

Order Details
`;

      cartItems.forEach((item, index) => {
        message += `
${index + 1}. ${item.name}
Price: ${item.price}
Quantity: ${item.quantity}
`;
      });

      message += `
Total: Rs ${totalPrice}

Please confirm my order.
`;

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

      window.open(url, "_blank");
      let nextCart = getCartItems();
      cartItems.forEach((item) => {
        nextCart = removeCartItem(item.key);
      });
      setCartItems(nextCart);
      setOrderPlaced(true);
    } catch (error) {
      setOrderError(error.message || "We could not place your order right now.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (!user) {
    return (
      <main className="cart-page">
        <section className="cart-empty">
          <h2>Please login to view your cart</h2>
          <button className="btn" onClick={handleGoogleLogin}>
            Sign in with Google
          </button>
        </section>
      </main>
    );
  }

  if (orderPlaced) {
    return (
      <main className="cart-page">
        <section className="cart-empty" role="status" aria-live="polite">
          <span aria-hidden="true" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</span>
          <h2>Order placed successfully!</h2>
          <p>
            Thank you for your order. We&apos;ll get it to you soon.
          </p>
          <button className="btn" type="button" onClick={() => navigate("/shop")}>
            Continue Shopping
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-hero">
        <p className="cart-kicker">Your Cart</p>
        <h1>Cozy picks saved for checkout</h1>
      </section>

      {cartItems.length === 0 ? (
        <section className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Add a candle from the home page or shop page to see it here.</p>
          <button className="btn" type="button" onClick={() => navigate("/shop")}>
            Continue Shopping
          </button>
        </section>
      ) : (
        <section className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.key}>
                <div className="cart-item-image">
                  <img src={item.img} alt={item.name} />
                </div>

                <div className="cart-item-details">
                  <h2>{item.name}</h2>
                  <p>{item.price}</p>

                  <div className="cart-item-actions">
                    <div className="cart-quantity">
                      <button
                        type="button"
                        onClick={() =>
                          setCartItems(updateCartItemQuantity(item.key, item.quantity - 1))
                        }
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setCartItems(updateCartItemQuantity(item.key, item.quantity + 1))
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => setCartItems(removeCartItem(item.key))}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Order Summary</h2>
            <p>{cartItems.length} item(s)</p>

            <div className="customer-form">
              <h3>Delivery Details</h3>

              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={customer.name}
                onChange={handleChange}
              />

              <input
                type="tel"
                name="phone"
                placeholder="Contact Number"
                value={customer.phone}
                onChange={handleChange}
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 10);
                }}
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                minLength={10}
                onKeyDown={handleNumericKeyDown}
              />
              {validationErrors.phone ? <p className="products-feedback">{validationErrors.phone}</p> : null}

              <input
                type="text"
                name="address"
                placeholder="Address"
                value={customer.address}
                onChange={handleChange}
              />

              <input
                type="tel"
                name="pincode"
                placeholder="Pincode"
                value={customer.pincode}
                onChange={handleChange}
                onInput={(event) => {
                  event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, "").slice(0, 6);
                }}
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                minLength={6}
                onKeyDown={handleNumericKeyDown}
              />
              {validationErrors.pincode ? <p className="products-feedback">{validationErrors.pincode}</p> : null}
            </div>

            <div className="cart-total">
              <span>Total</span>
              <strong>Rs {totalPrice}</strong>
            </div>

            {orderError ? <p className="products-feedback">{orderError}</p> : null}

            <button className="btn" type="button" onClick={placeOrderWhatsApp} disabled={placingOrder}>
              {placingOrder ? "Placing Order..." : "Place Order on WhatsApp"}
            </button>
          </aside>
        </section>
      )}
    </main>
  );
}
