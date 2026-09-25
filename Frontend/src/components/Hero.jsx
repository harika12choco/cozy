import "../styles/Hero.css";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchSiteImages } from "../services/siteImagesService";

const DEFAULT_BANNER_LINK = "/shop";

function isExternalLink(link) {
  return /^https?:\/\//i.test(link);
}

/**
 * The backend already rejects anything that is not an internal path or an http(s) URL, but the
 * banner link is re-checked here so a value that predates that validation can never render as a
 * javascript: or protocol-relative href.
 */
function safeBannerLink(link) {
  const trimmed = String(link || "").trim();

  if (isExternalLink(trimmed)) {
    return trimmed;
  }

  return /^\/[^/\\]/.test(trimmed) ? trimmed : DEFAULT_BANNER_LINK;
}

export default function Hero() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState(null);

  // Festival / seasonal banner set from Admin -> Site Images. Until one is uploaded this stays
  // null and the hero renders exactly as it always has.
  useEffect(() => {
    let active = true;

    async function loadBanner() {
      try {
        const data = await fetchSiteImages();
        if (!active) return;

        const url = String(data?.bannerUrl ?? "").trim();
        setBanner(
          url
            ? {
                url,
                mobileUrl: String(data?.bannerMobileUrl ?? "").trim(),
                link: safeBannerLink(data?.bannerLink),
                alt: String(data?.bannerAlt ?? "").trim() || "Cozy Candle collection",
                hideText: data?.bannerHideText !== false
              }
            : null
        );
      } catch {
        // The storefront must never depend on the banner loading.
        if (active) setBanner(null);
      }
    }

    loadBanner();
    window.addEventListener("cozy-site-images-updated", loadBanner);

    return () => {
      active = false;
      window.removeEventListener("cozy-site-images-updated", loadBanner);
    };
  }, []);

  // A designed banner carries its own wording, so it is shown whole - never cropped - and the
  // site's own heading steps aside.
  if (banner && banner.hideText) {
    const image = (
      <picture>
        {banner.mobileUrl ? <source media="(max-width: 640px)" srcSet={banner.mobileUrl} /> : null}
        <img src={banner.url} alt={banner.alt} className="hero-banner-img" />
      </picture>
    );

    return (
      <section className="hero-banner" aria-label="Featured collection">
        {isExternalLink(banner.link) ? (
          <a href={banner.link} target="_blank" rel="noopener noreferrer" className="hero-banner-link">
            {image}
          </a>
        ) : (
          <Link to={banner.link} className="hero-banner-link">
            {image}
          </Link>
        )}
      </section>
    );
  }

  // No banner, or the admin chose to keep the site's own wording over a custom background.
  return (
    <section className="hero">
      <div className="hero-slider" aria-hidden="true">
        {banner ? (
          <div
            className="hero-slide hero-slide-custom"
            style={{ backgroundImage: `url("${banner.url}")` }}
          />
        ) : (
          <>
            <div className="hero-slide hero-slide-primary" />
            <div className="hero-slide hero-slide-secondary" />
          </>
        )}
      </div>

      <div className="hero-overlay" aria-hidden="true" />

      <div className="hero-content">
        <h1 className="hero-title">
          Handcrafted Luxury
          <span>Candles</span>
        </h1>

        <p>
          Bring warmth and calm into your home
          with our premium handmade candles.
        </p>

        <button className="hero-btn" onClick={() => navigate(banner?.link || "/shop")}>
          Shop Collection
        </button>
      </div>
    </section>
  );
}
