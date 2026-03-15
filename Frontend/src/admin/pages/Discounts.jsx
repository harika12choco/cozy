import { useState } from "react";
import { adminApi } from "../services/api";

const initialForm = {
  code: "",
  type: "percentage",
  value: "",
  minSpend: "",
  status: "active",
  expiresAt: ""
};

export default function Discounts() {
  const [discounts, setDiscounts] = useState(() => adminApi.readCollection("discounts"));
  const [form, setForm] = useState(initialForm);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    adminApi.insertItem(
      "discounts",
      { ...form, value: Number(form.value), minSpend: Number(form.minSpend) },
      "disc"
    );
    setDiscounts(adminApi.readCollection("discounts"));
    setForm(initialForm);
  }

  function toggleStatus(id, status) {
    adminApi.updateItem("discounts", id, { status });
    setDiscounts(adminApi.readCollection("discounts"));
  }

  return (
    <div className="admin-content-stack">
      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Create discount</h3>
            <p>Launch promo codes for campaigns, first orders, or festive sales.</p>
          </div>
        </div>

        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <label>
            Code
            <input name="code" value={form.code} onChange={updateField} required />
          </label>

          <label>
            Type
            <select name="type" value={form.type} onChange={updateField}>
              <option value="percentage">percentage</option>
              <option value="flat">flat</option>
            </select>
          </label>

          <label>
            Value
            <input name="value" type="number" value={form.value} onChange={updateField} required />
          </label>

          <label>
            Minimum spend
            <input name="minSpend" type="number" value={form.minSpend} onChange={updateField} required />
          </label>

          <label>
            Expiry date
            <input name="expiresAt" type="date" value={form.expiresAt} onChange={updateField} required />
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={updateField}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>

          <div className="admin-form-actions admin-form-span">
            <button type="submit" className="btn">Save Discount</button>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h3>Saved discounts</h3>
            <p>Pause or reactivate your website coupon codes.</p>
          </div>
        </div>

        <ul className="admin-list">
          {discounts.map((discount) => (
            <li key={discount.id}>
              <div>
                <strong>{discount.code}</strong>
                <span>
                  {discount.type === "percentage" ? `${discount.value}% off` : `Rs ${discount.value} off`}
                  {" · "}Min spend Rs {discount.minSpend}
                </span>
              </div>
              <div className="admin-inline-actions">
                <span className={`admin-badge ${discount.status}`}>{discount.status}</span>
                <button
                  type="button"
                  onClick={() =>
                    toggleStatus(discount.id, discount.status === "active" ? "inactive" : "active")
                  }
                >
                  Toggle
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
