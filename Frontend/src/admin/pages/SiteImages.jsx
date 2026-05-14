import { useMemo, useState } from "react";
import bannerFallback from "../../assets/banner.png";
import menuData from "../../utils/menuData";
import { loadSiteImages, saveSiteImages } from "../../utils/siteImages";

export default function SiteImages() {
  const categoryTitles = useMemo(
    () => menuData.map((section) => section.title),
    []
  );
  const [form, setForm] = useState(() => {
    const stored = loadSiteImages();
    return {
      bannerUrl: stored.bannerUrl || "",
      categoryImages: { ...stored.categoryImages }
    };
  });
  const [feedback, setFeedback] = useState("");

  function handleBannerChange(event) {
    const value = event.target.value;
    setForm((current) => ({ ...current, bannerUrl: value }));
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

  function handleSave() {
    const cleanedCategories = {};

    categoryTitles.forEach((title) => {
      const url = String(form.categoryImages[title] ?? "").trim();
      if (url) {
        cleanedCategories[title] = url;
      }
    });

    saveSiteImages({
      bannerUrl: String(form.bannerUrl ?? "").trim(),
      categoryImages: cleanedCategories
    });

    setFeedback("Site images saved.");
    window.setTimeout(() => setFeedback(""), 2000);
  }

  function handleReset() {
    setForm({ bannerUrl: "", categoryImages: {} });
    saveSiteImages({ bannerUrl: "", categoryImages: {} });
    setFeedback("Reverted to default images.");
    window.setTimeout(() => setFeedback(""), 2000);
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

      {feedback ? <p className="products-feedback">{feedback}</p> : null}

      <div className="admin-form-grid">
        <label className="admin-form-span">
          Homepage banner image URL
          <input
            type="url"
            placeholder="https://..."
            value={form.bannerUrl}
            onChange={handleBannerChange}
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
          <label className="admin-form-span" key={title}>
            {title}
            <input
              type="url"
              placeholder="https://..."
              value={form.categoryImages[title] ?? ""}
              onChange={(event) => handleCategoryChange(title, event.target.value)}
            />
          </label>
        ))}

        <div className="admin-form-actions admin-form-span">
          <button type="button" className="admin-secondary-btn" onClick={handleReset}>
            Reset to Defaults
          </button>
          <button type="button" className="btn" onClick={handleSave}>
            Save Images
          </button>
        </div>
      </div>
    </section>
  );
}
