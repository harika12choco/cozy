import { useEffect, useState } from "react";
import { productService } from "../services/productService";
import { candleColorService, fragranceService } from "../services/optionService";
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
    description: "",
    candleColors: [],
    fragrances: [],
    variants: [],
    giftWrapPrice: ""
  });
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [availableColors, setAvailableColors] = useState([]);
  const [availableFragrances, setAvailableFragrances] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [item, colors, frags] = await Promise.all([
          productService.getById(productId),
          candleColorService.list({ enabled: true }),
          fragranceService.list({ enabled: true })
        ]);

        if (!active) {
          return;
        }

        setAvailableColors(colors);
        setAvailableFragrances(frags);
        setProduct(item);
        if (item) {
          setForm({
            ...item,
            imageFile: null,
            candleColors: item.selectedCandleColors ?? item.candleColors ?? [],
            fragrances: item.selectedFragrances ?? item.fragrances ?? [],
            variants: Array.isArray(item.variants) ? item.variants : []
          });
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

    loadData();

    return () => {
      active = false;
    };
  }, [productId]);

  function toggleColor(color) {
    setForm((current) => {
      const exists = current.candleColors.some((c) => c.optionId === color.id);
      const nextColors = exists
        ? current.candleColors.filter((c) => c.optionId !== color.id)
        : [...current.candleColors, { optionId: color.id, name: color.name, hexCode: color.hexCode }];
      return { ...current, candleColors: nextColors };
    });
  }

  function toggleFragrance(fragrance) {
    setForm((current) => {
      const exists = current.fragrances.some((f) => f.optionId === fragrance.id);
      const nextFrags = exists
        ? current.fragrances.filter((f) => f.optionId !== fragrance.id)
        : [...current.fragrances, { optionId: fragrance.id, name: fragrance.name }];
      return { ...current, fragrances: nextFrags };
    });
  }

  function addCombo() {
    setForm((current) => ({
      ...current,
      variants: [...(current.variants ?? []), { name: "", price: "", stock: "" }]
    }));
  }

  function updateCombo(index, field, value) {
    setForm((current) => {
      const nextVariants = [...(current.variants ?? [])];
      nextVariants[index] = { ...nextVariants[index], [field]: value };
      return { ...current, variants: nextVariants };
    });
  }

  function removeCombo(index) {
    setForm((current) => ({
      ...current,
      variants: (current.variants ?? []).filter((_, itemIndex) => itemIndex !== index)
    }));
  }

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
        stock: Number(form.stock),
        giftWrapPrice: Number(form.giftWrapPrice || 80)
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
          Gift Wrap Price
          <input name="giftWrapPrice" type="number" value={form.giftWrapPrice} onChange={updateField} required />
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
          Mark as Best Seller
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

        <div className="admin-form-span admin-options-section">
          <label>Available Colors</label>
          <div className="admin-swatch-list">
            {availableColors.map((color) => {
              const isChecked = form.candleColors.some((c) => c.optionId === color.id);
              return (
                <button
                  key={color.id}
                  type="button"
                  className={`admin-swatch-item ${isChecked ? "is-checked" : ""}`}
                  onClick={() => toggleColor(color)}
                >
                  <span className="admin-swatch-color" style={{ backgroundColor: color.hexCode }} />
                  <span className="admin-swatch-name">{color.name}</span>
                </button>
              );
            })}
            {availableColors.length === 0 && (
              <p className="admin-options-empty">No active colors. Go to "Candle Colors" page to add some.</p>
            )}
          </div>
        </div>

        <div className="admin-form-span admin-options-section">
          <label>Available Fragrances</label>
          <div className="admin-swatch-list">
            {availableFragrances.map((frag) => {
              const isChecked = form.fragrances.some((f) => f.optionId === frag.id);
              return (
                <button
                  key={frag.id}
                  type="button"
                  className={`admin-swatch-item ${isChecked ? "is-checked" : ""}`}
                  onClick={() => toggleFragrance(frag)}
                >
                  <span className="admin-swatch-icon">{isChecked ? "☑" : "☐"}</span>
                  <span className="admin-swatch-name">{frag.name}</span>
                </button>
              );
            })}
            {availableFragrances.length === 0 && (
              <p className="admin-options-empty">No active fragrances. Go to "Fragrances" page to add some.</p>
            )}
          </div>
        </div>

        {/* ────────── COMBO OFFERS SECTION ────────── */}
        <div className="admin-form-span admin-options-section">
          <label>Combo Offers — bundle pricing (e.g. "2 Pieces" for a special price)</label>
          <p className="admin-combo-hint">
            Add combos customers can pick before checkout. The combo price replaces the base price for that order.
            Leave empty if this product has no combos.
          </p>

          {(form.variants ?? []).length > 0 && (
            <div className="admin-combo-list">
              <div className="admin-combo-row admin-combo-row-head">
                <span>Combo name</span>
                <span>Price (Rs)</span>
                <span>Stock (optional)</span>
                <span aria-hidden="true" />
              </div>
              {form.variants.map((combo, index) => (
                <div className="admin-combo-row" key={combo.optionId || index}>
                  <input
                    type="text"
                    placeholder="e.g. 2 Pieces"
                    value={combo.name ?? ""}
                    onChange={(event) => updateCombo(index, "name", event.target.value)}
                    aria-label={`Combo ${index + 1} name`}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price"
                    value={combo.price ?? ""}
                    onChange={(event) => updateCombo(index, "price", event.target.value)}
                    aria-label={`Combo ${index + 1} price`}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Uses product stock"
                    value={combo.stock ?? ""}
                    onChange={(event) => updateCombo(index, "stock", event.target.value)}
                    aria-label={`Combo ${index + 1} stock`}
                  />
                  <button type="button" className="admin-tag-remove" onClick={() => removeCombo(index)} aria-label={`Remove combo ${index + 1}`}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="admin-options-inline">
            <button type="button" className="admin-secondary-btn" onClick={addCombo}>
              + Add Combo
            </button>
          </div>
        </div>

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
