import { useEffect, useMemo, useState } from "react";
import { FaExpand, FaHeart, FaRegHeart, FaShoppingBag, FaTimes } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import CandleSafety from "./CandleSafety";
import { pickOptionList } from "../utils/shopProducts";
import { getWishlistId, isWishlisted as isProductWishlisted, subscribeWishlist, toggleWishlistItem }
  from "../utils/wishlist";
import {
  formatProductPrice,
  getCalculatedProductPrice,
  getPurchasableBasePrice,
  normalizeColorOption,
  normalizeFragranceOption,
  normalizeVariantOption,
  parseProductPrice,
  pickDefaultFragrance,
  withCalculatedProductPrice
} from "../utils/productPricing";
import "../styles/ProductChoiceCard.css";

function getProductPath(product) {
  return `/product/${product.productId || product.id}`;
}

export default function ProductChoiceCard({ product, onAddToCart, variant = "shop", showSafety = false }) {
  const navigate = useNavigate();
  const wishlistId = getWishlistId(product);
  const [isWishlisted, setIsWishlisted] = useState(() => isProductWishlisted(wishlistId));
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const colorOptions = useMemo(
    () =>
      pickOptionList(product.candleColors, product.colors)
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
        .map((option, index) => normalizeVariantOption(option, `variant-${index}`, product.price || product.basePrice))
        .filter(Boolean),
    [product.variants, product.basePrice, product.price]
  );

  const [selectedColor, setSelectedColor] = useState(() => colorOptions[0] ?? null);
  const [selectedFragrance, setSelectedFragrance] = useState(() => pickDefaultFragrance(fragranceOptions));
  // Default to no combo (single piece). Selecting a combo is what changes the price.
  const [selectedVariant, setSelectedVariant] = useState(null);
  const perPiecePrice = useMemo(() => getPurchasableBasePrice(product, null), [product]);

  const productPath = getProductPath(product);
  const imgSrc = product.img ?? product.image;
  const isUnavailable = Number(product.stock ?? 0) <= 0;
  const cardClassName = variant === "bestseller" ? "product choice-card luxury-card" : "shop-card choice-card luxury-card";

  // Anything the shopper has to choose between is picked in the quick view, which keeps the card
  // itself clean while still reaching the colour, fragrance and combo pickers in one click.
  const hasOptions = colorOptions.length > 0 || fragranceOptions.length > 0 || variantOptions.length > 0;
  const actionLabel = hasOptions ? "Select Options" : "Add to Cart";

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

  // Keeps the heart in step with the wishlist wherever it changes - another card for the same
  // product, the wishlist page, or a second browser tab.
  useEffect(() => {
    function syncWishlist() {
      setIsWishlisted(isProductWishlisted(wishlistId));
    }

    syncWishlist();
    return subscribeWishlist(syncWishlist);
  }, [wishlistId]);

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

  function handlePrimaryAction(event) {
    event.stopPropagation();

    if (hasOptions) {
      setIsQuickViewOpen(true);
      return;
    }

    handleAddToCart();
  }

  function toggleWishlist(e) {
    e.stopPropagation();
    setIsWishlisted(toggleWishlistItem(wishlistId));
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

          <div className="choice-card-tools">
            <button
              className={`choice-wishlist-btn ${isWishlisted ? "is-active" : ""}`}
              type="button"
              onClick={toggleWishlist}
              aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              {isWishlisted ? <FaHeart aria-hidden="true" /> : <FaRegHeart aria-hidden="true" />}
            </button>

            <button
              className="choice-quickview-trigger"
              type="button"
              onClick={openQuickView}
              aria-label={`Quick view ${product.name}`}
              title="Quick View"
            >
              <FaExpand aria-hidden="true" />
            </button>
          </div>

          <Link to={productPath} tabIndex={-1} aria-label={`View details for ${product.name}`}>
            <img
              src={imgSrc}
              alt={product.name}
              loading="lazy"
              className="choice-card-img"
            />
          </Link>

          <button
            className="choice-card-action-bar"
            type="button"
            onClick={handlePrimaryAction}
            disabled={isUnavailable}
          >
            <span>{isUnavailable ? "Out of Stock" : actionLabel}</span>
            <FaShoppingBag aria-hidden="true" />
          </button>
        </div>

        <div className="choice-card-body">
          <h3 className="choice-card-title">
            <Link to={productPath} title={product.name}>
              {product.name}
            </Link>
          </h3>

          <div className="choice-price-group">
            <span className="choice-selling-price">{selectedPriceStr}</span>
            {numericOriginalPrice > numericSellingPrice ? (
              <span className="choice-original-price">{formatProductPrice(numericOriginalPrice)}</span>
            ) : null}
          </div>

          <span className={`choice-stock-status ${isUnavailable ? "is-out" : ""}`}>
            {isUnavailable ? "Out of stock" : "In Stock"}
          </span>

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
                    <span className="quickview-orig-price">{formatProductPrice(numericOriginalPrice)}</span>
                  ) : null}
                  {discountPercentage > 0 ? (
                    <span className="quickview-discount">{discountPercentage}% OFF</span>
                  ) : null}
                </div>
                <p className={`quickview-stock ${isUnavailable ? "is-out" : ""}`}>
                  {isUnavailable ? "Out of stock" : "In Stock"}
                </p>
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
                          title={color.name}
                          aria-label={`Choose ${color.name}`}
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
                          {Number(fragrance.priceAdjustment ?? 0) > 0 ? (
                            <span> +{formatProductPrice(fragrance.priceAdjustment)}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                {variantOptions.length > 0 ? (
                  <div className="quickview-option-section">
                    <label>Combo Offers:</label>
                    <div className="quickview-variants">
                      <button
                        type="button"
                        className={`quickview-variant-btn ${!selectedVariant ? "is-selected" : ""}`}
                        onClick={() => setSelectedVariant(null)}
                      >
                        Single Piece ({formatProductPrice(perPiecePrice)})
                      </button>
                      {variantOptions.map((v, idx) => (
                        <button
                          key={`qv-var-${idx}`}
                          type="button"
                          className={`quickview-variant-btn ${selectedVariant?.name === v.name ? "is-selected" : ""}`}
                          onClick={() => setSelectedVariant(v)}
                        >
                          {v.name} ({formatProductPrice(v.price)})
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
