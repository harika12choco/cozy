import "../styles/HomeBanner.css";
import { useEffect, useState } from "react";
import bannerImage from "../assets/banner.png";
import { loadSiteImages } from "../utils/siteImages";

export default function HomeBanner() {
  const [bannerUrl, setBannerUrl] = useState(() => loadSiteImages().bannerUrl || "");

  useEffect(() => {
    function handleUpdate() {
      setBannerUrl(loadSiteImages().bannerUrl || "");
    }

    window.addEventListener("cozy-site-images-updated", handleUpdate);
    return () => window.removeEventListener("cozy-site-images-updated", handleUpdate);
  }, []);

  const resolvedBanner = bannerUrl.trim() || bannerImage;

  return (
    <section className="home-banner" aria-label="Cozy Candle showcase banner">
      <div className="home-banner-frame">
        <img src={resolvedBanner} alt="Cozy Candle product banner" />
      </div>
    </section>
  );
}
