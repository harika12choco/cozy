const STORAGE_KEY = "cozy-site-images";

function normalizeSiteImages(value) {
  if (!value || typeof value !== "object") {
    return { bannerUrl: "", categoryImages: {} };
  }

  const bannerUrl = typeof value.bannerUrl === "string" ? value.bannerUrl : "";
  const categoryImages = typeof value.categoryImages === "object" && value.categoryImages
    ? value.categoryImages
    : {};

  return {
    bannerUrl,
    categoryImages
  };
}

export function loadSiteImages() {
  if (typeof window === "undefined") {
    return { bannerUrl: "", categoryImages: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { bannerUrl: "", categoryImages: {} };
    }

    return normalizeSiteImages(JSON.parse(raw));
  } catch {
    return { bannerUrl: "", categoryImages: {} };
  }
}

export function saveSiteImages(data) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeSiteImages(data);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("cozy-site-images-updated"));
}
