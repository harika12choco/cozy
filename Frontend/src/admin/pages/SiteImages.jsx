import { useEffect, useMemo, useState } from "react";
import bannerFallback from "../../assets/banner.png";
import menuData from "../../utils/menuData";
import { siteImagesService } from "../services/siteImagesService";

export default function SiteImages() {
  const categoryTitles = useMemo(
    () => menuData.map((section) => section.title),
    []
  );
  const [form, setForm] = useState({
    bannerUrl: "",
    categoryImages: {}
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    let active = true;

    async function loadImages() {
      try {
        setLoading(true);
        setError("");
        const data = await siteImagesService.get();

        if (!active) {
          return;
        }

        setForm({
          bannerUrl: data.bannerUrl || "",
          categoryImages: { ...(data.categoryImages || {}) }
        });
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

    loadImages();

    return () => {
      active = false;
    };
  }, []);

  function handleBannerChange(event) {
    const value = event.target.value;
    setForm((current) => ({ ...current, bannerUrl: value }));
  }

  async function handleBannerFileChange(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    try {
      setUploadingKey("banner");
      const uploadedUrl = await siteImagesService.uploadImage(file);
      setForm((current) => ({ ...current, bannerUrl: uploadedUrl }));
    } catch {
      setError("Unable to upload banner image.");
    } finally {
      setUploadingKey("");
    }
  }

  function handleCategoryChange(title, value) {
    setForm((current) => ({
      ...current,
      categoryImages: {
        ...current.categoryImages,
        [title]: value
      }
    }));
  }

  async function handleCategoryFileChange(title, event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    try {
      setUploadingKey(title);
      const uploadedUrl = await siteImagesService.uploadImage(file);
      handleCategoryChange(title, uploadedUrl);
    } catch {
      setError("Unable to upload category image.");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleSave() {
    const cleanedCategories = {};

    categoryTitles.forEach((title) => {
      const url = String(form.categoryImages[title] ?? "").trim();
      if (url) {
        cleanedCategories[title] = url;
      }
    });

    try {
      setSaving(true);
      setError("");
      await siteImagesService.update({
        bannerUrl: String(form.bannerUrl ?? "").trim(),
        categoryImages: cleanedCategories
      });
      window.dispatchEvent(new Event("cozy-site-images-updated"));
      setFeedback("Site images saved.");
      window.setTimeout(() => setFeedback(""), 2000);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    try {
      setSaving(true);
      setError("");
      await siteImagesService.update({ bannerUrl: "", categoryImages: {} });
      setForm({ bannerUrl: "", categoryImages: {} });
      window.dispatchEvent(new Event("cozy-site-images-updated"));
      setFeedback("Reverted to default images.");
      window.setTimeout(() => setFeedback(""), 2000);
    } catch (resetError) {
      setError(resetError.message);
    } finally {
      setSaving(false);
    }
  }

  const bannerPreview = form.bannerUrl.trim() || bannerFallback;

  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>Site Images</h3>
          <p>Update homepage banners and category carousel images (non-product assets).</p>
        </div>
      </div>

      {error ? <p className="products-feedback">{error}</p> : null}
      {feedback ? <p className="products-feedback">{feedback}</p> : null}

      <div className="admin-form-grid">
        <label className="admin-form-span">
          Homepage banner image URL
          <input
            type="url"
            placeholder="https://..."
            value={form.bannerUrl}
            onChange={handleBannerChange}
            disabled={loading}
          />
        </label>

        <label className="admin-form-span">
          Upload banner image
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerFileChange}
            disabled={loading || uploadingKey === "banner"}
          />
        </label>

        <div className="admin-form-span">
          <p>Banner preview</p>
          <img
            src={bannerPreview}
            alt="Homepage banner preview"
            style={{ width: "100%", maxHeight: "220px", objectFit: "cover", borderRadius: "18px" }}
          />
        </div>

        <div className="admin-form-span">
          <h4>Auto-scroll category images</h4>
          <p>Paste image URLs for category cards. Leave blank to use defaults.</p>
        </div>

        {categoryTitles.map((title) => (
          <div className="admin-form-span" key={title}>
            <label>
              {title} image URL
              <input
                type="url"
                placeholder="https://..."
                value={form.categoryImages[title] ?? ""}
                onChange={(event) => handleCategoryChange(title, event.target.value)}
                disabled={loading}
              />
            </label>
            <label>
              Upload {title} image
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleCategoryFileChange(title, event)}
                disabled={loading || uploadingKey === title}
              />
            </label>
            {form.categoryImages[title] ? (
              <img
                src={form.categoryImages[title]}
                alt={`${title} preview`}
                style={{ width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "16px" }}
              />
            ) : null}
          </div>
        ))}

        <div className="admin-form-actions admin-form-span">
          <button type="button" className="admin-secondary-btn" onClick={handleReset} disabled={saving || loading}>
            Reset to Defaults
          </button>
          <button type="button" className="btn" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save Images"}
          </button>
        </div>
      </div>
    </section>
  );
}
