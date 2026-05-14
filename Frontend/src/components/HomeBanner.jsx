import "../styles/HomeBanner.css";
import { useEffect, useState } from "react";
import bannerImage from "../assets/banner.png";
import { fetchSiteImages } from "../services/siteImagesService";

export default function HomeBanner() {
  const [bannerUrl, setBannerUrl] = useState("");

  useEffect(() => {
    let active = true;

    async function loadImages() {
      try {
        const data = await fetchSiteImages();
        if (active) {
          setBannerUrl(String(data?.bannerUrl || ""));
        }
      } catch {
        if (active) {
          setBannerUrl("");
        }
      }
    }

    function handleUpdate() {
      loadImages();
    }

    loadImages();
    window.addEventListener("cozy-site-images-updated", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("cozy-site-images-updated", handleUpdate);
    };
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
