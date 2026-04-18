import { useState } from "react";
import { productService } from "../services/productService";
import { categoryGroups } from "../../utils/menuData";

const initialState = {
  name: "",
  price: "",
  category: "",
  stock: "",
  status: "active",
  bestSeller: false,
  image: "",
  imageFile: null,
  description: ""
};

export default function AddProduct({ onNavigate }) {
  const [form, setForm] = useState(initialState);
  const [imageName, setImageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateImage(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      setImageName("");
      setForm((current) => ({ ...current, image: "", imageFile: null }));
      return;
    }

    setError("");
    setImageName(file.name);
    setForm((current) => ({
      ...current,
      image: URL.createObjectURL(file),
      imageFile: file
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await productService.create({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock)
      });
      onNavigate("products");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>Add a product</h3>
          <p>Create a new candle listing that can appear on the storefront.</p>
        </div>
      </div>

      {error ? <p className="products-feedback">{error}</p> : null}

      <form className="admin-form-grid" onSubmit={handleSubmit}>
        <label>
          Product name
          <input name="name" value={form.name} onChange={updateField} required />
        </label>

        <label>
          Price
          <input name="price" type="number" value={form.price} onChange={updateField} required />
        </label>

        <label>
          Category
          <select name="category" value={form.category} onChange={updateField} required>
            <option value="">Select a category</option>
            {categoryGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label>
          Stock
          <input name="stock" type="number" value={form.stock} onChange={updateField} required />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={updateField}>
            <option value="active">active</option>
            <option value="draft">draft</option>
          </select>
        </label>

        <label>
          Best seller
          <input
            name="bestSeller"
            type="checkbox"
            checked={form.bestSeller}
            onChange={updateField}
          />
        </label>

        <label>
          Upload image
          <input type="file" accept="image/*" onChange={updateImage} />
        </label>

        <label>
          Selected image
          <input value={imageName || "No image selected"} readOnly />
        </label>

        <label className="admin-form-span">
          Description
          <textarea name="description" rows="5" value={form.description} onChange={updateField} required />
        </label>

        {form.image ? (
          <div className="admin-form-span">
            <p>Image preview</p>
            <img
              src={form.image}
              alt={form.name || "Selected product"}
              style={{ width: "140px", height: "140px", objectFit: "cover", borderRadius: "16px" }}
            />
          </div>
        ) : null}

        <div className="admin-form-actions admin-form-span">
          <button type="button" className="admin-secondary-btn" onClick={() => onNavigate("products")}>
            Cancel
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </section>
  );
}
