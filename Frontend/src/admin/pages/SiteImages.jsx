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
    bannerMobileUrl: "",
    bannerLink: "",
    bannerAlt: "",
    bannerHideText: true,
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
          bannerMobileUrl: data.bannerMobileUrl || "",
          bannerLink: data.bannerLink || "",
          bannerAlt: data.bannerAlt || "",
          bannerHideText: data.bannerHideText !== false,
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

  function buildPayload(nextForm) {
    const cleanedCategories = {};

    categoryTitles.forEach((title) => {
      const url = String(nextForm.categoryImages[title] ?? "").trim();
      if (url) {
        cleanedCategories[title] = url;
      }
    });

    return {
      bannerUrl: String(nextForm.bannerUrl ?? "").trim(),
      bannerMobileUrl: String(nextForm.bannerMobileUrl ?? "").trim(),
      bannerLink: String(nextForm.bannerLink ?? "").trim(),
      bannerAlt: String(nextForm.bannerAlt ?? "").trim(),
      bannerHideText: nextForm.bannerHideText !== false,
      categoryImages: cleanedCategories
    };
  }

  async function persistForm(nextForm, message = "Site images saved.") {
    try {
      setSaving(true);
      setError("");
      const savedImages = await siteImagesService.update(buildPayload(nextForm));
      setForm({
        bannerUrl: savedImages?.bannerUrl || "",
        bannerMobileUrl: savedImages?.bannerMobileUrl || "",
        bannerLink: savedImages?.bannerLink || "",
        bannerAlt: savedImages?.bannerAlt || "",
        bannerHideText: savedImages?.bannerHideText !== false,
        categoryImages: { ...(savedImages?.categoryImages || {}) }
      });
      window.dispatchEvent(new Event("cozy-site-images-updated"));
      setFeedback(message);
      window.setTimeout(() => setFeedback(""), 2000);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleBannerFileChange(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    try {
      setUploadingKey("banner");
      const uploadedUrl = await siteImagesService.uploadImage(file);
      const nextForm = { ...form, bannerUrl: uploadedUrl };
      setForm(nextForm);
      await persistForm(nextForm, "Banner updated.");
    } catch {
      setError("Unable to upload banner image.");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleMobileBannerFileChange(event) {
    const [file] = event.target.files ?? [];

    if (!file) {
      return;
    }

    try {
      setUploadingKey("banner-mobile");
      const uploadedUrl = await siteImagesService.uploadImage(file);
      const nextForm = { ...form, bannerMobileUrl: uploadedUrl };
      setForm(nextForm);
      await persistForm(nextForm, "Mobile banner updated.");
    } catch {
      setError("Unable to upload mobile banner image.");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleRemoveBanner() {
    if (!window.confirm("Remove the homepage banner and go back to the default hero?")) {
      return;
    }

    const nextForm = { ...form, bannerUrl: "", bannerMobileUrl: "" };
    setForm(nextForm);
    await persistForm(nextForm, "Banner removed.");
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
      const nextForm = {
        ...form,
        categoryImages: {
          ...form.categoryImages,
          [title]: uploadedUrl
        }
      };
      setForm(nextForm);
      await persistForm(nextForm, `${title} updated.`);
    } catch {
      setError("Unable to upload category image.");
    } finally {
      setUploadingKey("");
    }
  }

  async function handleSave() {
    await persistForm(form);
  }

  async function handleReset() {
    try {
      setSaving(true);
      setError("");
      const savedImages = await siteImagesService.update({
        bannerUrl: "", bannerMobileUrl: "", bannerLink: "", bannerAlt: "",
        bannerHideText: true, categoryImages: {}
      });
      setForm({
        bannerUrl: savedImages?.bannerUrl || "",
        bannerMobileUrl: savedImages?.bannerMobileUrl || "",
        bannerLink: savedImages?.bannerLink || "",
        bannerAlt: savedImages?.bannerAlt || "",
        bannerHideText: savedImages?.bannerHideText !== false,
        categoryImages: { ...(savedImages?.categoryImages || {}) }
      });
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
        <div className="admin-form-span">
          <h4>Homepage Banner</h4>
          <p className="admin-combo-hint">
            Upload a festival or seasonal banner to replace the homepage hero — Diwali, Christmas,
            Valentine&apos;s and so on. Leave it empty to use the default &quot;Handcrafted Luxury
            Candles&quot; hero. A wide banner around 1600&times;560 works well.
          </p>
        </div>

        <label className="admin-form-span">
          Upload banner image
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerFileChange}
            disabled={loading || uploadingKey === "banner"}
          />
        </label>

        <label className="admin-form-span">
          ...or paste a banner image URL
          <input
            type="url"
            placeholder="https://..."
            value={form.bannerUrl}
            onChange={handleBannerChange}
            disabled={loading}
          />
        </label>

        <label className="admin-form-span">
          Upload a mobile banner (optional)
          <input
            type="file"
            accept="image/*"
            onChange={handleMobileBannerFileChange}
            disabled={loading || uploadingKey === "banner-mobile"}
          />
        </label>

        <label className="admin-form-span">
          Banner links to
          <input
            type="text"
            placeholder="/shop?category=diwali-candle"
            value={form.bannerLink}
            onChange={(event) => setForm((current) => ({ ...current, bannerLink: event.target.value }))}
            disabled={loading}
          />
        </label>

        <label className="admin-form-span">
          Banner description (for accessibility and search engines)
          <input
            type="text"
            placeholder="Cozy Candle Diwali collection"
            value={form.bannerAlt}
            onChange={(event) => setForm((current) => ({ ...current, bannerAlt: event.target.value }))}
            disabled={loading}
          />
        </label>

        <label className="admin-form-span admin-checkbox-label">
          <input
            type="checkbox"
            checked={form.bannerHideText !== false}
            onChange={(event) => setForm((current) => ({ ...current, bannerHideText: event.target.checked }))}
            disabled={loading}
          />
          <span>
            This banner already has its own wording — hide the site&apos;s &quot;Handcrafted Luxury
            Candles&quot; heading. Untick to keep the heading and use the image only as a background.
          </span>
        </label>

        <div className="admin-form-span">
          <p>Banner preview{form.bannerUrl ? "" : " (default hero image)"}</p>
          <img
            src={bannerPreview}
            alt="Homepage banner preview"
            style={{ width: "100%", objectFit: "contain", borderRadius: "18px", background: "#f8eee5" }}
          />
          {form.bannerMobileUrl ? (
            <>
              <p style={{ marginTop: "12px" }}>Mobile banner preview</p>
              <img
                src={form.bannerMobileUrl}
                alt="Mobile banner preview"
                style={{ width: "260px", maxWidth: "100%", objectFit: "contain", borderRadius: "14px", background: "#f8eee5" }}
              />
            </>
          ) : null}
          {form.bannerUrl ? (
            <div className="admin-options-inline" style={{ marginTop: "12px" }}>
              <button type="button" className="admin-secondary-btn" onClick={handleRemoveBanner} disabled={saving}>
                Remove banner
              </button>
            </div>
          ) : null}
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
