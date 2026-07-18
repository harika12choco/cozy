import { useState, useEffect } from "react";
import { productService } from "../services/productService";
import { candleColorService, fragranceService } from "../services/optionService";
import { categoryGroups } from "../../utils/menuData";

/* ── Pre-built fragrance catalogue ─────────────────────────────────── */
const FRAGRANCE_CATALOGUE = [
  "Honey", "Musk Oud", "Rose", "Vanilla Bean", "Vanilla Sweet",
  "Lavender", "Sandalwood", "Jasmine", "Mogra", "Cedarwood",
  "Rose and Oud", "Lotus", "Cinnamon", "Coffee", "Chocolate",
  "Chocolate and Coffee", "Oudh", "Mint", "Cinnamon and Vanilla",
  "Aqua", "Aqua Lotus", "Citrus", "Orchid Vanilla", "Orchid",
  "Strawberry", "Orange", "Blueberry", "Lemon", "Lemongrass",
  "Mixed Fruit", "Mithai", "Watermelon", "Wine", "Wooden and Spice",
  "Green Apple", "Rain Forest", "Sandal"
];

const initialState = {
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
  giftWrapPrice: "80"
};

export default function AddProduct({ onNavigate }) {
  const [form, setForm] = useState(initialState);
  const [imageName, setImageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /* colours & fragrances loaded from backend */
  const [availableColors, setAvailableColors] = useState([]);
  const [availableFragrances, setAvailableFragrances] = useState([]);

  /* inline creation state */
  const [newColorName, setNewColorName] = useState("");
  const [newColorHex, setNewColorHex] = useState("#ffffff");
  const [colorMessage, setColorMessage] = useState("");
  const [fragranceDropdownValue, setFragranceDropdownValue] = useState("");
  const [fragranceMessage, setFragranceMessage] = useState("");

  /* ── Load existing options from backend ───────────────────────────── */
  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        const [colors, frags] = await Promise.all([
          candleColorService.list({ enabled: true }),
          fragranceService.list({ enabled: true })
        ]);
        if (active) {
          setAvailableColors(colors);
          setAvailableFragrances(frags);
        }
      } catch (err) {
        console.error("Unable to load options:", err);
      }
    }
    loadOptions();
    return () => { active = false; };
  }, []);

  /* ── Toggle a colour swatch on / off for this product ────────────── */
  function toggleColor(color) {
    setForm((current) => {
      const exists = current.candleColors.some((c) => c.optionId === color.id);
      const nextColors = exists
        ? current.candleColors.filter((c) => c.optionId !== color.id)
        : [...current.candleColors, { optionId: color.id, name: color.name, hexCode: color.hexCode, priceAdjustment: 0 }];
      return { ...current, candleColors: nextColors };
    });
  }

  /* ── Toggle a fragrance chip on / off for this product ────────────── */
  function toggleFragrance(fragrance) {
    setForm((current) => {
      const exists = current.fragrances.some((f) => f.optionId === fragrance.id);
      const nextFrags = exists
        ? current.fragrances.filter((f) => f.optionId !== fragrance.id)
        : [...current.fragrances, { optionId: fragrance.id, name: fragrance.name, priceAdjustment: 0 }];
      return { ...current, fragrances: nextFrags };
    });
  }

  function updateColorPriceAdjustment(optionId, value) {
    setForm((current) => ({
      ...current,
      candleColors: current.candleColors.map((color) =>
        color.optionId === optionId ? { ...color, priceAdjustment: Number(value || 0) } : color
      )
    }));
  }

  function updateFragrancePriceAdjustment(optionId, value) {
    setForm((current) => ({
      ...current,
      fragrances: current.fragrances.map((fragrance) =>
        fragrance.optionId === optionId ? { ...fragrance, priceAdjustment: Number(value || 0) } : fragrance
      )
    }));
  }

  /* ── Inline: add a brand-new colour to the backend & select it ───── */
  async function handleAddNewColor() {
    if (!newColorName.trim()) return;
    try {
      const created = await candleColorService.create({
        name: newColorName.trim(),
        hexCode: newColorHex.toUpperCase(),
        enabled: true
      });
      setAvailableColors((prev) => [...prev, created]);
      // auto-select the newly created colour
      setForm((current) => ({
        ...current,
        candleColors: [
          ...current.candleColors,
          { optionId: created.id, name: created.name, hexCode: created.hexCode }
        ]
      }));
      setNewColorName("");
      setNewColorHex("#ffffff");
      setColorMessage("✓ Color added!");
      setTimeout(() => setColorMessage(""), 3000);
    } catch (e) {
      console.error("Failed to add color", e);
      setColorMessage(`✗ ${e.message || "Failed to add color"}`);
      setTimeout(() => setColorMessage(""), 5000);
    }
  }

  /* ── Add fragrance chosen from the dropdown catalogue ────────────── */
  async function handleAddFragranceFromDropdown() {
    if (!fragranceDropdownValue) return;
    // Check if this fragrance already exists in the backend list
    const alreadyExists = availableFragrances.find(
      (f) => f.name.toLowerCase() === fragranceDropdownValue.toLowerCase()
    );
    if (alreadyExists) {
      // Auto-select it if not already selected
      const alreadySelected = form.fragrances.some((f) => f.optionId === alreadyExists.id);
      if (!alreadySelected) {
        toggleFragrance(alreadyExists);
        setFragranceMessage(`✓ "${alreadyExists.name}" selected!`);
      } else {
        setFragranceMessage(`Already selected: "${alreadyExists.name}"`);
      }
      setFragranceDropdownValue("");
      setTimeout(() => setFragranceMessage(""), 3000);
      return;
    }
    // Create it on the backend
    try {
      const created = await fragranceService.create({
        name: fragranceDropdownValue,
        enabled: true
      });
      setAvailableFragrances((prev) => [...prev, created]);
      // auto-select
      setForm((current) => ({
        ...current,
        fragrances: [
          ...current.fragrances,
          { optionId: created.id, name: created.name }
        ]
      }));
      setFragranceDropdownValue("");
      setFragranceMessage(`✓ "${created.name}" added & selected!`);
      setTimeout(() => setFragranceMessage(""), 3000);
    } catch (e) {
      console.error("Failed to add fragrance", e);
      setFragranceMessage(`✗ ${e.message || "Failed to add fragrance"}`);
      setTimeout(() => setFragranceMessage(""), 5000);
    }
  }

  /* ── Generic field updater ───────────────────────────────────────── */
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

  /* ── Build the list of catalogue fragrances not yet in the backend ── */
  const fragranceCatalogueOptions = FRAGRANCE_CATALOGUE.filter(
    (name) => !availableFragrances.some((f) => f.name.toLowerCase() === name.toLowerCase())
  );

  /* ════════════════════════════════════════════════════════════════════ */
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

        {/* ────────── COLORS SECTION ────────── */}
        <div className="admin-form-span admin-options-section">
          <label>Available Colors — click to select for this product</label>

          {/* Selected badge summary */}
          {form.candleColors.length > 0 && (
            <div className="admin-selected-summary">
              <strong>Selected:</strong>{" "}
              {form.candleColors.map((c) => (
                <span key={c.optionId} className="admin-selected-tag" style={{ borderLeft: `4px solid ${c.hexCode}` }}>
                  {c.name}
                  <input
                    className="admin-adjustment-input"
                    type="number"
                    value={c.priceAdjustment ?? 0}
                    onChange={(event) => updateColorPriceAdjustment(c.optionId, event.target.value)}
                    aria-label={`${c.name} price adjustment`}
                  />
                  <button type="button" className="admin-tag-remove" onClick={() => toggleColor({ id: c.optionId })}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Swatch grid */}
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
                  {isChecked && <span className="admin-swatch-check">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Inline color creation */}
          <div className="admin-options-inline">
            <input
              type="text"
              placeholder="New color name"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
            />
            <input
              type="color"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              title="Pick a color"
            />
            <button type="button" className="admin-secondary-btn" onClick={handleAddNewColor} disabled={!newColorName.trim()}>
              + Add Color
            </button>
            {colorMessage && (
              <span className={`admin-option-feedback ${colorMessage.startsWith("✓") ? "success" : "error"}`}>
                {colorMessage}
              </span>
            )}
          </div>
        </div>

        {/* ────────── FRAGRANCES SECTION ────────── */}
        <div className="admin-form-span admin-options-section">
          <label>Available Fragrances — click to select for this product</label>

          {/* Selected badge summary */}
          {form.fragrances.length > 0 && (
            <div className="admin-selected-summary">
              <strong>Selected:</strong>{" "}
              {form.fragrances.map((f) => (
                <span key={f.optionId} className="admin-selected-tag">
                  {f.name}
                  <input
                    className="admin-adjustment-input"
                    type="number"
                    value={f.priceAdjustment ?? 0}
                    onChange={(event) => updateFragrancePriceAdjustment(f.optionId, event.target.value)}
                    aria-label={`${f.name} price adjustment`}
                  />
                  <button type="button" className="admin-tag-remove" onClick={() => toggleFragrance({ id: f.optionId })}>×</button>
                </span>
              ))}
            </div>
          )}

          {/* Chip grid of already-created fragrances */}
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
                  <span className="admin-swatch-icon">{isChecked ? "✓" : "+"}</span>
                  <span className="admin-swatch-name">{frag.name}</span>
                </button>
              );
            })}
          </div>

          {/* Dropdown to pick from the pre-built catalogue */}
          <div className="admin-options-inline">
            <select
              className="admin-fragrance-dropdown"
              value={fragranceDropdownValue}
              onChange={(e) => setFragranceDropdownValue(e.target.value)}
            >
              <option value="">— Pick a fragrance from the list —</option>
              {/* Show already-existing backend entries that are NOT yet selected */}
              {availableFragrances
                .filter((f) => !form.fragrances.some((sel) => sel.optionId === f.id))
                .map((f) => (
                  <option key={f.id} value={f.name}>{f.name}</option>
                ))}
              {/* Show catalogue entries not yet created */}
              {fragranceCatalogueOptions.length > 0 && (
                <optgroup label="── Add new from catalogue ──">
                  {fragranceCatalogueOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={handleAddFragranceFromDropdown}
              disabled={!fragranceDropdownValue}
            >
              + Add Fragrance
            </button>
            {fragranceMessage && (
              <span className={`admin-option-feedback ${fragranceMessage.startsWith("✓") ? "success" : "error"}`}>
                {fragranceMessage}
              </span>
            )}
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
            {saving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </form>
    </section>
  );
}
