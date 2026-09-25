import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Categories.css";
import menuData, { slugifyCategory } from "../utils/menuData";
import { fetchSiteImages } from "../services/siteImagesService";
import { readShopProducts } from "../utils/shopProducts";
import { normalizeCategory } from "../utils/menuData";

const displayCategories = menuData;

export default function Categories() {
  const navigate = useNavigate();
  const categoryTrackRef = useRef(null);
  const firstCloneRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isPausedRef = useRef(false);
  const isWindowScrollingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const scrollPauseTimeoutRef = useRef(null);
  const [arrowState, setArrowState] = useState({
    canScrollLeft: false,
    canScrollRight: true
  });
  const [imageOverrides, setImageOverrides] = useState({});
  const [productImages, setProductImages] = useState({});

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

  // Until an admin uploads artwork for a category, borrow the first product photo from it, so a
  // card shows something real instead of an empty tile. An uploaded image always wins.
  useEffect(() => {
    let active = true;

    async function loadProductImages() {
      try {
        const products = await readShopProducts();
        if (!active) return;

        const byCategory = {};
        for (const product of products) {
          const category = normalizeCategory(product.category);
          const image = product.img || product.image;
          if (category && image && !byCategory[category]) {
            byCategory[category] = image;
          }
        }
        setProductImages(byCategory);
      } catch {
        if (active) setProductImages({});
      }
    }

    loadProductImages();
    window.addEventListener("cozy-admin-products-updated", loadProductImages);

    return () => {
      active = false;
      window.removeEventListener("cozy-admin-products-updated", loadProductImages);
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

      if (!isPausedRef.current && !isWindowScrollingRef.current && metrics) {
        track.scrollLeft += scrollSpeed;

        if (track.scrollLeft >= metrics.loopWidth) {
          track.scrollLeft -= metrics.loopWidth;
        }

        updateArrowState();
      }

      animationFrameRef.current = window.requestAnimationFrame(animateCategories);
    }

    function handleWindowScroll() {
      isWindowScrollingRef.current = true;
      window.clearTimeout(scrollPauseTimeoutRef.current);
      scrollPauseTimeoutRef.current = window.setTimeout(() => {
        isWindowScrollingRef.current = false;
      }, 260);
    }

    updateArrowState();
    track.addEventListener("scroll", updateArrowState, { passive: true });
    window.addEventListener("resize", updateArrowState);
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    animationFrameRef.current = window.requestAnimationFrame(animateCategories);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      window.clearTimeout(resumeTimeoutRef.current);
      window.clearTimeout(scrollPauseTimeoutRef.current);
      track.removeEventListener("scroll", updateArrowState);
      window.removeEventListener("resize", updateArrowState);
      window.removeEventListener("scroll", handleWindowScroll);
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
              aria-label={`Shop ${category.title}`}
            >
              {/* A category with no image uploaded yet shows the card's own warm background
                  rather than a broken empty <img>. */}
              {imageOverrides[category.title] || productImages[category.title] ? (
                <img src={imageOverrides[category.title] || productImages[category.title]} alt="" />
              ) : (
                <span className="category-card-placeholder" aria-hidden="true" />
              )}
              <span>{category.title}</span>
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
