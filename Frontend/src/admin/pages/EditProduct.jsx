import { useEffect, useState } from "react";
import { productService } from "../services/productService";
import { categoryGroups } from "../../utils/menuData";

export default function EditProduct({ productId, onNavigate }) {
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    stock: "",
    status: "active",
    bestSeller: false,
    image: "",
    imageFile: null,
    description: ""
  });
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        const item = await productService.getById(productId);

        if (!active) {
          return;
        }

        setProduct(item);
        if (item) {
          setForm({ ...item, imageFile: null });
        }
      } catch (loadError) {
        if (active) {
          setError(loadError.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  if (loading) {
    return (
      <section className="admin-panel">
        <h3>Loading product</h3>
        <p>Please wait while we fetch the latest details.</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="admin-panel">
        <h3>Product not found</h3>
        <p>{error || "The selected product could not be loaded."}</p>
        <button type="button" className="btn" onClick={() => onNavigate("products")}>
          Back to Products
        </button>
      </section>
    );
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateImage(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      setImageName("");
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
      await productService.update(productId, {
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
          <h3>Edit product</h3>
          <p>Update the selected candle information and website listing details.</p>
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
            checked={Boolean(form.bestSeller)}
            onChange={updateField}
          />
        </label>

        <label>
          Upload image
          <input type="file" accept="image/*" onChange={updateImage} />
        </label>

        <label>
          Selected image
          <input value={imageName || (form.image ? "Current image in use" : "No image selected")} readOnly />
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
            {saving ? "Saving..." : "Update Product"}
          </button>
        </div>
      </form>
    </section>
  );
}
