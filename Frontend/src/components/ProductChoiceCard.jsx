import { useMemo, useState } from "react";
import { FaEye, FaHeart, FaRegHeart, FaShoppingBag, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import CandleSafety from "./CandleSafety";
import {
  getCalculatedProductPrice,
  normalizeColorOption,
  normalizeFragranceOption,
  normalizeVariantOption,
  parseProductPrice,
  withCalculatedProductPrice
} from "../utils/productPricing";
import "../styles/ProductChoiceCard.css";

function getProductPath(product) {
  return `/product/${product.productId || product.id}`;
}

export default function ProductChoiceCard({ product, onAddToCart, variant = "shop", showSafety = false }) {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const colorOptions = useMemo(
    () =>
      (Array.isArray(product.candleColors) ? product.candleColors : product.colors ?? [])
        .map((option, index) => normalizeColorOption(option, `color-${index}`))
        .filter(Boolean),
    [product.candleColors, product.colors]
  );
  const fragranceOptions = useMemo(
    () =>
      (Array.isArray(product.fragrances) ? product.fragrances : [])
        .map((option, index) => normalizeFragranceOption(option, `fragrance-${index}`))
        .filter(Boolean),
    [product.fragrances]
  );
  const variantOptions = useMemo(
    () =>
      (Array.isArray(product.variants) ? product.variants : [])
        .map((option, index) => normalizeVariantOption(option, `variant-${index}`, product.basePrice || product.price))
        .filter(Boolean),
    [product.variants, product.basePrice, product.price]
  );

  const [selectedColor, setSelectedColor] = useState(() => colorOptions[0] ?? null);
  const [selectedFragrance, setSelectedFragrance] = useState(() => fragranceOptions[0] ?? null);
  const [selectedVariant, setSelectedVariant] = useState(() => variantOptions[0] ?? null);

  const productPath = getProductPath(product);
  const imgSrc = product.img ?? product.image;
  const isUnavailable = Number(product.stock ?? 0) <= 0;
  const cardClassName = variant === "bestseller" ? "product choice-card luxury-card" : "shop-card choice-card luxury-card";

  const selectedPriceStr = getCalculatedProductPrice(product, selectedColor, selectedFragrance, selectedVariant);
  const numericSellingPrice = parseProductPrice(selectedPriceStr);

  const numericOriginalPrice = useMemo(() => {
    const orig = parseProductPrice(product.originalPrice || product.regularPrice);
    if (orig > numericSellingPrice) return orig;
    if (product.offerPercentage && product.offerPercentage > 0) {
      return Math.round(numericSellingPrice / (1 - product.offerPercentage / 100));
    }
    return 0;
  }, [product.originalPrice, product.regularPrice, product.offerPercentage, numericSellingPrice]);

  const discountPercentage = useMemo(() => {
    if (product.offerPercentage && product.offerPercentage > 0) {
      return Math.round(product.offerPercentage);
    }
    if (numericOriginalPrice > numericSellingPrice) {
      return Math.round(((numericOriginalPrice - numericSellingPrice) / numericOriginalPrice) * 100);
    }
    return 0;
  }, [product.offerPercentage, numericOriginalPrice, numericSellingPrice]);

  function handleCardClick(event) {
    if (event.target.closest("a, button, input, select, textarea, .choice-card-quickview-modal")) {
      return;
    }
    navigate(productPath);
  }

  function handleAddToCart() {
    onAddToCart(withCalculatedProductPrice({
      ...product,
      img: imgSrc
    }, selectedColor, selectedFragrance, selectedVariant));
  }

  function toggleWishlist(e) {
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
  }

  function openQuickView(e) {
    e.stopPropagation();
    setIsQuickViewOpen(true);
  }

  function closeQuickView(e) {
    e.stopPropagation();
    setIsQuickViewOpen(false);
  }

  return (
    <>
      <article className={cardClassName} onClick={handleCardClick} tabIndex={0} aria-label={product.name}>
        <div className="choice-card-image-wrap">
          {discountPercentage > 0 ? (
            <span className="choice-discount-badge">{discountPercentage}% OFF</span>
          ) : null}

          <button
            className={`choice-wishlist-btn ${isWishlisted ? "is-active" : ""}`}
            type="button"
            onClick={toggleWishlist}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
          >
            {isWishlisted ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
          </button>

          <Link to={productPath} tabIndex={-1} aria-label={`View details for ${product.name}`}>
            <img
              src={imgSrc}
              alt={product.name}
              loading="lazy"
              className="choice-card-img"
            />
          </Link>

          <button
            className="choice-quickview-trigger"
            type="button"
            onClick={openQuickView}
            aria-label={`Quick view ${product.name}`}
            title="Quick View"
          >
            <FaEye aria-hidden="true" />
            <span className="quickview-label">Quick View</span>
          </button>
        </div>

        <div className="choice-card-body">
          <div className="choice-card-meta">
            {product.category || product.collection ? (
              <span className="choice-card-category">{product.category || product.collection}</span>
            ) : null}
          </div>

          <h3 className="choice-card-title">
            <Link to={productPath} title={product.name}>
              {product.name}
            </Link>
          </h3>

          <div className="choice-price-container">
            <div className="choice-price-group">
              <span className="choice-selling-price">{selectedPriceStr}</span>
              {numericOriginalPrice > numericSellingPrice ? (
                <span className="choice-original-price">Rs {numericOriginalPrice}</span>
              ) : null}
            </div>
            <span className={`choice-stock-status ${isUnavailable ? "is-out" : ""}`}>
              {isUnavailable ? "Out of stock" : `${product.stock} left`}
            </span>
          </div>

          {colorOptions.length > 0 ? (
            <div className="choice-swatches" aria-label="Choose candle color">
              {colorOptions.map((color, index) => {
                const isSelected = selectedColor?.optionId === color.optionId || selectedColor?.name === color.name;

                return (
                  <button
                    className={`choice-swatch ${isSelected ? "is-selected" : ""}`}
                    key={`${color.optionId || color.name}-${index}`}
                    style={{ backgroundColor: color.hexCode || "#efe7dc" }}
                    title={color.name}
                    type="button"
                    aria-label={`Choose ${color.name}`}
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedColor(color);
                    }}
                  />
                );
              })}
            </div>
          ) : null}

          {fragranceOptions.length > 0 ? (
            <div className="choice-fragrance-chips" aria-label="Choose fragrance">
              {fragranceOptions.slice(0, 3).map((fragrance, index) => {
                const isSelected =
                  selectedFragrance?.optionId === fragrance.optionId || selectedFragrance?.name === fragrance.name;

                return (
                  <button
                    className={`choice-chip ${isSelected ? "is-selected" : ""}`}
                    key={`${fragrance.optionId || fragrance.name}-${index}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFragrance(fragrance);
                    }}
                  >
                    {fragrance.name}
                  </button>
                );
              })}
              {fragranceOptions.length > 3 ? (
                <span className="choice-chip-more">+{fragranceOptions.length - 3}</span>
              ) : null}
            </div>
          ) : null}

          <div className="choice-actions">
            <button
              className="choice-cart-button"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isUnavailable}
            >
              <FaShoppingBag aria-hidden="true" />
              <span>{variantOptions.length > 0 ? "Select Options" : "Add to Cart"}</span>
            </button>
          </div>

          {showSafety ? <CandleSafety compact className="choice-card-safety" /> : null}
        </div>
      </article>

      {isQuickViewOpen ? (
        <div className="choice-quickview-backdrop" onClick={closeQuickView} role="dialog" aria-modal="true" aria-label={`Quick View ${product.name}`}>
          <div className="choice-quickview-modal" onClick={(e) => e.stopPropagation()}>
            <button className="choice-quickview-close" onClick={closeQuickView} type="button" aria-label="Close modal">
              <FaTimes aria-hidden="true" />
            </button>
            <div className="quickview-grid">
              <div className="quickview-media">
                <img src={imgSrc} alt={product.name} />
              </div>
              <div className="quickview-details">
                {product.category ? <span className="quickview-cat">{product.category}</span> : null}
                <h2>{product.name}</h2>
                <div className="quickview-price-row">
                  <span className="quickview-price">{selectedPriceStr}</span>
                  {numericOriginalPrice > numericSellingPrice ? (
                    <span className="quickview-orig-price">Rs {numericOriginalPrice}</span>
                  ) : null}
                  {discountPercentage > 0 ? (
                    <span className="quickview-discount">{discountPercentage}% OFF</span>
                  ) : null}
                </div>
                <p className="quickview-desc">{product.description || product.note || product.tagline}</p>

                {colorOptions.length > 0 ? (
                  <div className="quickview-option-section">
                    <label>Color: <strong>{selectedColor?.name || "Default"}</strong></label>
                    <div className="choice-swatches">
                      {colorOptions.map((color, index) => (
                        <button
                          key={`qv-col-${index}`}
                          className={`choice-swatch ${selectedColor?.name === color.name ? "is-selected" : ""}`}
                          style={{ backgroundColor: color.hexCode || "#efe7dc" }}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                {fragranceOptions.length > 0 ? (
                  <div className="quickview-option-section">
                    <label>Fragrance: <strong>{selectedFragrance?.name || "Standard"}</strong></label>
                    <div className="choice-fragrance-chips">
                      {fragranceOptions.map((fragrance, index) => (
                        <button
                          key={`qv-frag-${index}`}
                          className={`choice-chip ${selectedFragrance?.name === fragrance.name ? "is-selected" : ""}`}
                          type="button"
                          onClick={() => setSelectedFragrance(fragrance)}
                        >
                          {fragrance.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {variantOptions.length > 0 ? (
                  <div className="quickview-option-section">
                    <label>Size / Pack:</label>
                    <div className="quickview-variants">
                      {variantOptions.map((v, idx) => (
                        <button
                          key={`qv-var-${idx}`}
                          type="button"
                          className={`quickview-variant-btn ${selectedVariant?.name === v.name ? "is-selected" : ""}`}
                          onClick={() => setSelectedVariant(v)}
                        >
                          {v.name} (Rs {v.price})
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="quickview-actions">
                  <button
                    className="choice-cart-button quickview-add-btn"
                    type="button"
                    disabled={isUnavailable}
                    onClick={() => {
                      handleAddToCart();
                      setIsQuickViewOpen(false);
                    }}
                  >
                    <FaShoppingBag aria-hidden="true" />
                    <span>Add to Cart</span>
                  </button>
                  <Link to={productPath} className="quickview-full-details-btn">
                    Full Product Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

