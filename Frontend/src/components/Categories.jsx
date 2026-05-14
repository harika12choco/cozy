import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Categories.css";
import fallbackDessert from "../assets/candles/4.png";
import fallbackCustomized from "../assets/homepage1.png";
import fallbackWedding from "../assets/home image.png";
import festiveImage from "../assets/product categories/festive collection.png";
import floralImage from "../assets/product categories/Floral and aesthetic.png";
import giftingImage from "../assets/product categories/gifting collection.png";
import jarBowlImage from "../assets/product categories/jar and bowl.png";
import momentsImage from "../assets/product categories/moments and memories.png";
import menuData, { slugifyCategory } from "../utils/menuData";
import { fetchSiteImages } from "../services/siteImagesService";

const defaultCategoryImages = {
  "Moments & Memories": momentsImage,
  "Gifting Collection": giftingImage,
  "Festive Collection": festiveImage,
  "Dessert Candle Collection": fallbackDessert,
  "Floral & Aesthetic": floralImage,
  "Jar & Bowl Collection": jarBowlImage,
  Customized: fallbackCustomized,
  "Wedding & Event": fallbackWedding
};

const floralStartIndex = menuData.findIndex((category) => category.title === "Floral & Aesthetic");
const displayCategories = floralStartIndex > -1
  ? [...menuData.slice(floralStartIndex), ...menuData.slice(0, floralStartIndex)]
  : menuData;

export default function Categories() {
  const navigate = useNavigate();
  const categoryTrackRef = useRef(null);
  const firstCloneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isPausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const [arrowState, setArrowState] = useState({
    canScrollLeft: false,
    canScrollRight: true
  });
  const [imageOverrides, setImageOverrides] = useState({});

  const animatedCategories = useMemo(
    () => [
      ...displayCategories.map((category) => ({ ...category, carouselKey: `main-${category.title}` })),
      ...displayCategories.map((category, index) => ({
        ...category,
        carouselKey: `clone-${category.title}`,
        isFirstClone: index === 0
      }))
    ],
    []
  );

  useEffect(() => {
    let active = true;

    async function loadImages() {
      try {
        const data = await fetchSiteImages();
        if (active) {
          setImageOverrides(data?.categoryImages || {});
        }
      } catch {
        if (active) {
          setImageOverrides({});
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

  const getLoopMetrics = useCallback(() => {
    const track = categoryTrackRef.current;
    const firstClone = firstCloneRef.current;

    if (!track || !firstClone) {
      return null;
    }

    const loopWidth = firstClone.offsetLeft - track.offsetLeft;

    if (loopWidth <= 0) {
      return null;
    }

    return {
      loopWidth,
      maxLogicalScrollLeft: Math.max(loopWidth - track.clientWidth, 0)
    };
  }, []);

  const updateArrowState = useCallback(() => {
    const track = categoryTrackRef.current;
    const metrics = getLoopMetrics();

    if (!track || !metrics) {
      return;
    }

    const scrollBuffer = 2;
    const logicalScrollLeft = track.scrollLeft % metrics.loopWidth;

    setArrowState({
      canScrollLeft: logicalScrollLeft > scrollBuffer,
      canScrollRight: logicalScrollLeft < metrics.maxLogicalScrollLeft - scrollBuffer
    });
  }, [getLoopMetrics]);

  useEffect(() => {
    const track = categoryTrackRef.current;

    if (!track) {
      return undefined;
    }

    const originalScrollSnapType = track.style.scrollSnapType;
    const scrollSpeed = 0.9;

    track.style.scrollSnapType = "none";

    function animateCategories() {
      const metrics = getLoopMetrics();

      if (!isPausedRef.current && metrics) {
        track.scrollLeft += scrollSpeed;

        if (track.scrollLeft >= metrics.loopWidth) {
          track.scrollLeft -= metrics.loopWidth;
        }

        updateArrowState();
      }

      animationFrameRef.current = window.requestAnimationFrame(animateCategories);
    }

    updateArrowState();
    track.addEventListener("scroll", updateArrowState, { passive: true });
    window.addEventListener("resize", updateArrowState);
    animationFrameRef.current = window.requestAnimationFrame(animateCategories);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.clearTimeout(resumeTimeoutRef.current);
      track.removeEventListener("scroll", updateArrowState);
      window.removeEventListener("resize", updateArrowState);
      track.style.scrollSnapType = originalScrollSnapType;
    };
  }, [getLoopMetrics, updateArrowState]);

  function setCarouselPaused(isPaused) {
    const track = categoryTrackRef.current;

    isPausedRef.current = isPaused;

    if (track) {
      track.style.scrollSnapType = isPaused ? "" : "none";
    }
  }

  function handleNavigate(category) {
    navigate(`/shop?category=${slugifyCategory(category)}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function scrollCategories(direction) {
    const track = categoryTrackRef.current;
    const metrics = getLoopMetrics();

    if (!track || !metrics) {
      return;
    }

    setCarouselPaused(true);

    const logicalScrollLeft = track.scrollLeft % metrics.loopWidth;
    const targetScrollLeft = Math.min(
      Math.max(logicalScrollLeft + direction * Math.round(track.clientWidth * 0.82), 0),
      metrics.maxLogicalScrollLeft
    );

    track.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth"
    });

    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      setCarouselPaused(false);
    }, 900);
  }

  return (
    <section className="categories" aria-labelledby="product-categories-title">
      <h2 id="product-categories-title">Product Categories</h2>

      <div
        className="category-carousel"
        onMouseEnter={() => {
          setCarouselPaused(true);
        }}
        onMouseLeave={() => {
          setCarouselPaused(false);
        }}
        onPointerDown={() => {
          setCarouselPaused(true);
        }}
        onPointerUp={() => {
          setCarouselPaused(false);
        }}
        onFocus={() => {
          setCarouselPaused(true);
        }}
        onBlur={() => {
          setCarouselPaused(false);
        }}
      >
        <button
          className="category-arrow category-arrow-left"
          type="button"
          disabled={!arrowState.canScrollLeft}
          onClick={() => scrollCategories(-1)}
          aria-label="Previous product categories"
        >
          {"<"}
        </button>

        <div className="category-grid" ref={categoryTrackRef}>
          {animatedCategories.map((category) => (
            <button
              className="category-card"
              key={category.carouselKey}
              ref={category.isFirstClone ? firstCloneRef : null}
              type="button"
              onClick={() => handleNavigate(category.title)}
              aria-label={`Shop ${category.title === "Floral & Aesthetic" ? "Floral Aesthetic" : category.title}`}
            >
              <img
                src={imageOverrides[category.title] || defaultCategoryImages[category.title]}
                alt=""
              />
              <span>{category.title === "Floral & Aesthetic" ? "Floral Aesthetic" : category.title}</span>
            </button>
          ))}
        </div>

        <button
          className="category-arrow category-arrow-right"
          type="button"
          disabled={!arrowState.canScrollRight}
          onClick={() => scrollCategories(1)}
          aria-label="Next product categories"
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
