import { useCallback, useEffect, useMemo, useState } from "react";

const blankForm = {
  name: "",
  hexCode: "#F2D6C2",
  enabled: true
};

export default function OptionManagement({
  title,
  description,
  service,
  hasColorPicker = false,
  searchable = false
}) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => item.name.toLowerCase().includes(query));
  }, [items, search]);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const nextItems = await service.list(searchable && search ? { q: search } : {});
      setItems(nextItems);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [search, searchable, service]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!searchable) {
      return undefined;
    }

    const timeout = window.setTimeout(loadItems, 250);
    return () => window.clearTimeout(timeout);
  }, [loadItems, searchable]);

  function resetForm() {
    setForm(blankForm);
    setEditingId("");
  }

  function editItem(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      hexCode: item.hexCode || "#F2D6C2",
      enabled: item.enabled !== false
    });
  }

  async function submitForm(event) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      const payload = hasColorPicker
        ? form
        : { name: form.name, enabled: form.enabled };

      if (editingId) {
        const updated = await service.update(editingId, payload);
        setItems((current) => current.map((item) => (item.id === editingId ? updated : item)));
      } else {
        const created = await service.create(payload);
        setItems((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      }

      resetForm();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleItem(item) {
    try {
      setError("");
      const updated = await service.update(item.id, { enabled: item.enabled === false });
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (toggleError) {
      setError(toggleError.message);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm(`Delete ${item.name}?`)) {
      return;
    }

    try {
      setError("");
      await service.remove(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      {error ? <p className="products-feedback">{error}</p> : null}

      <form className="admin-form-grid admin-option-form" onSubmit={submitForm}>
        <label>
          Name
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </label>

        {hasColorPicker ? (
          <label>
            HEX code
            <div className="admin-color-input-row">
              <input
                type="color"
                value={form.hexCode}
                onChange={(event) => setForm((current) => ({ ...current, hexCode: event.target.value.toUpperCase() }))}
              />
              <input
                value={form.hexCode}
                pattern="^#[0-9A-Fa-f]{6}$"
                onChange={(event) => setForm((current) => ({ ...current, hexCode: event.target.value.toUpperCase() }))}
                required
              />
            </div>
          </label>
        ) : null}

        <label className="admin-checkbox-label">
          Enabled
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
          />
        </label>

        <div className="admin-form-actions">
          {editingId ? (
            <button type="button" className="admin-secondary-btn" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
        </div>
      </form>

      {searchable ? (
        <label className="admin-option-search">
          Search fragrances
          <input value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
      ) : null}

      {loading ? <p>Loading...</p> : null}

      <div className="admin-table-shell">
        <table className="admin-table">
          <thead>
            <tr>
              {hasColorPicker ? <th>Preview</th> : null}
              <th>Name</th>
              {hasColorPicker ? <th>HEX</th> : null}
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                {hasColorPicker ? (
                  <td>
                    <span
                      className="admin-color-preview"
                      style={{ backgroundColor: item.hexCode }}
                      title={item.hexCode}
                    />
                  </td>
                ) : null}
                <td>{item.name}</td>
                {hasColorPicker ? <td>{item.hexCode}</td> : null}
                <td>
                  <span className={`admin-badge ${item.enabled === false ? "inactive" : "active"}`}>
                    {item.enabled === false ? "disabled" : "enabled"}
                  </span>
                </td>
                <td>
                  <div className="admin-table-actions">
                    <button type="button" onClick={() => editItem(item)}>Edit</button>
                    <button type="button" onClick={() => toggleItem(item)}>
                      {item.enabled === false ? "Enable" : "Disable"}
                    </button>
                    <button type="button" className="danger" onClick={() => deleteItem(item)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
