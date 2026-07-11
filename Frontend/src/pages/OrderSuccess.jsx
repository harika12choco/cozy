import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Cart.css";

export default function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderId = location.state?.orderId || "";
  const paymentMethod = location.state?.paymentMethod || "";
  const paymentStatus = location.state?.paymentStatus || "";

  return (
    <main className="cart-page">
      <section className="cart-empty" role="status" aria-live="polite">
        <span className="order-success-mark">Order confirmed</span>
        <h2>Order placed successfully!</h2>
        <p>
          Thank you for your order. We&apos;ll get it to you soon.
        </p>
        {orderId ? <p className="order-success-meta">Order ID: {orderId}</p> : null}
        {paymentMethod ? (
          <p className="order-success-meta">
            Payment: {paymentMethod}{paymentStatus ? ` - ${paymentStatus}` : ""}
          </p>
        ) : null}
        <button className="btn" type="button" onClick={() => navigate("/shop")}>
          Continue Shopping
        </button>
      </section>
    </main>
  );
}
