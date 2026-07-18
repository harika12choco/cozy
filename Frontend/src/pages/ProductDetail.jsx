import "../styles/ProductDetail.css";
import { createElement, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheck,
  FaExpand,
  FaGift,
  FaHeart,
  FaLeaf,
  FaMinus,
  FaPalette,
  FaPenFancy,
  FaPlus,
  FaQuestionCircle,
  FaRegEnvelope,
  FaSeedling,
  FaShoppingBag,
  FaSpa,
  FaTimes,
  FaTruck
} from "react-icons/fa";
import { addItemToCart } from "../utils/cart";
import { fetchProductsByIds, matchesCategory, readShopProducts } from "../utils/shopProducts";
import {
  calculateProductPrice,
  formatProductPrice,
  getFragrancePriceAdjustment,
  getPurchasableBasePrice,
  normalizeColorOption,
  normalizeFragranceOption,
  normalizeVariantOption,
  parseProductPrice,
  withCalculatedProductPrice
} from "../utils/productPricing";

const RECOMMENDATION_COUNT = 4;

const featureItems = [
  { label: "Handmade", Icon: FaHeart },
  { label: "Premium Wax", Icon: FaLeaf },
  { label: "Long Lasting", Icon: FaSeedling },
  { label: "Perfect for Gifting", Icon: FaGift },
  { label: "Made with Love", Icon: FaCheck }
];

const tabLabels = [
  "Description",
  "Care Instructions",
  "Shipping Information",
  "Customization Details",
  "FAQs"
];

function pickRandomItems(items, count) {
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, count);
}

function resolveImageSource(image) {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  return image.url ?? image.secureUrl ?? image.secure_url ?? image.image ?? "";
}

function getProductImages(product) {
  if (!product) {
    return [];
  }

  const candidates = [
    product.featuredImage,
    product.img,
    product.image,
    ...(Array.isArray(product.images) ? product.images : []),
    ...(Array.isArray(product.galleryImages) ? product.galleryImages : [])
  ];
  const seen = new Set();

  return candidates
    .map(resolveImageSource)
    .filter(Boolean)
    .filter((image) => {
      if (seen.has(image)) {
        return false;
      }

      seen.add(image);
      return true;
    });
}

function getCollectionLabel(product) {
  return (
    product?.collectionName ||
    product?.collection ||
    (Array.isArray(product?.collections) ? product.collections[0] : "") ||
    product?.category ||
    "Signature Candle"
  );
}

function optionKey(option, fallback) {
  return String(option?.optionId || option?.id || option?._id || option?.name || fallback);
}

function getVariantOptions(product) {
  const basePrice = getPurchasableBasePrice(product);

  return (Array.isArray(product?.variants) ? product.variants : [])
    .map((variant, index) => normalizeVariantOption(variant, `variant-${index}`, basePrice))
    .filter(Boolean);
}

function getCustomizationItems(product, colors, fragrances) {
  const configured = Array.isArray(product?.customizationOptions) ? product.customizationOptions : [];
  const inferred = [
    colors.length > 0 ? "Color" : "",
    fragrances.length > 0 ? "Fragrance" : ""
  ].filter(Boolean);
  const seen = new Set();

  return [...configured, ...inferred]
    .map((item) => String(item).trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function getCustomizationIcon(label) {
  const value = label.toLowerCase();

  if (value.includes("color")) {
    return FaPalette;
  }

  if (value.includes("fragrance") || value.includes("scent")) {
    return FaSpa;
  }

  if (value.includes("gift") || value.includes("pack")) {
    return FaGift;
  }

  if (value.includes("message") || value.includes("tag")) {
    return FaRegEnvelope;
  }

  if (value.includes("name") || value.includes("personal")) {
    return FaPenFancy;
  }

  return FaSeedling;
}

function getDescriptionParagraphs(product) {
  return [
    product?.shortDescription,
    product?.description || product?.note,
    product?.tagline
  ]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

function getDiscountPercent(product, originalPrice, currentPrice) {
  const configuredDiscount = Number(product?.offerPercentage ?? product?.discountPercentage ?? 0);

  if (configuredDiscount > 0) {
    return Math.round(configuredDiscount);
  }

  if (originalPrice > currentPrice) {
    return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
  }

  return 0;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = String(id ?? "").trim();
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedFragrance, setSelectedFragrance] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState(tabLabels[0]);
  const [giftWrap, setGiftWrap] = useState(false);

  const productImages = useMemo(() => getProductImages(product), [product]);
  const variantOptions = useMemo(() => getVariantOptions(product), [product]);
  const colorOptions = useMemo(
    () =>
      (Array.isArray(product?.candleColors) ? product.candleColors : product?.colors ?? [])
        .map((option, index) => normalizeColorOption(option, `color-${index}`))
        .filter(Boolean),
    [product]
  );
  const fragranceOptions = useMemo(
    () =>
      (Array.isArray(product?.fragrances) ? product.fragrances : [])
        .map((option, index) => normalizeFragranceOption(option, `fragrance-${index}`))
        .filter(Boolean),
    [product]
  );
  const customizationItems = useMemo(
    () => getCustomizationItems(product, colorOptions, fragranceOptions),
    [product, colorOptions, fragranceOptions]
  );
  const descriptionParagraphs = useMemo(() => getDescriptionParagraphs(product), [product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setSelectedVariant(variantOptions[0] ?? null);
    setSelectedColor(colorOptions[0] ?? null);
    setSelectedFragrance(fragranceOptions[0] ?? null);
    setQuantity(1);
    setSelectedImageIndex(0);
    setActiveTab(tabLabels[0]);
    setGiftWrap(false);
  }, [product, variantOptions, colorOptions, fragranceOptions]);

  useEffect(() => {
    if (selectedImageIndex >= productImages.length) {
      setSelectedImageIndex(0);
    }
  }, [productImages.length, selectedImageIndex]);

  useEffect(() => {
    if (!lightboxOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [lightboxOpen]);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");

        const products = await fetchProductsByIds([productId]);
        const selected = products[0] ?? null;

        if (!active) {
          return;
        }

        if (!selected) {
          setProduct(null);
          setRecommendations([]);
          setError("Product not found.");
          return;
        }

        setProduct(selected);

        const allProducts = await readShopProducts();
        if (!active) {
          return;
        }

        const related = allProducts.filter((item) => {
          if (item.id === selected.id) {
            return false;
          }

          return matchesCategory(item, selected.category);
        });

        if (related.length >= RECOMMENDATION_COUNT) {
          setRecommendations(related.slice(0, RECOMMENDATION_COUNT));
          return;
        }

        const remaining = allProducts.filter((item) => {
          if (item.id === selected.id) {
            return false;
          }

          return !related.some((relatedItem) => relatedItem.id === item.id);
        });

        const fillCount = RECOMMENDATION_COUNT - related.length;
        const filler = pickRandomItems(remaining, fillCount);
        setRecommendations([...related, ...filler]);
      } catch (loadError) {
        if (active) {
          setError(loadError.message || "Unable to load product.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (!productId) {
      setLoading(false);
      setError("Product not found.");
      setProduct(null);
      setRecommendations([]);
      return undefined;
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [productId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [productId]);

  function handleQuantityChange(nextQuantity) {
    const stockLimit = getAvailableStock();
    const cappedQuantity = Math.max(1, Math.min(nextQuantity, stockLimit || 1));
    setQuantity(cappedQuantity);
  }

  function getAvailableStock() {
    const variantStock = Number(selectedVariant?.stock ?? 0);

    if (variantStock > 0) {
      return variantStock;
    }

    return Math.max(0, Number(product?.stock ?? 0));
  }

  function handleAddToCart({ checkout = false } = {}) {
    if (!product) {
      return false;
    }

    const availableStock = getAvailableStock();

    if (availableStock <= 0) {
      setFeedback("Out of stock");
      return false;
    }

    if (quantity > availableStock) {
      setFeedback(`Only ${availableStock} items left.`);
      return false;
    }

    if (colorOptions.length > 0 && !selectedColor) {
      setFeedback("Please select a candle color.");
      return false;
    }

    if (fragranceOptions.length > 0 && !selectedFragrance) {
      setFeedback("Please select a fragrance.");
      return false;
    }

    if (variantOptions.length > 0 && !selectedVariant) {
      setFeedback("Please select a variant.");
      return false;
    }

    addItemToCart(withCalculatedProductPrice({
      ...product,
      img: mainImage,
      image: mainImage
    }, selectedColor, selectedFragrance, selectedVariant, quantity, giftWrap));

    setFeedback(`${product.name} added to cart`);
    window.setTimeout(() => setFeedback(""), 1800);

    if (checkout) {
      navigate("/cart");
    }

    return true;
  }

  function renderTabContent() {
    if (!product) {
      return null;
    }

    if (activeTab === "Care Instructions") {
      return (
        <ul>
          <li>Trim the wick before each burn.</li>
          <li>Keep the candle on a heat-safe surface.</li>
          <li>Do not leave a lit candle unattended.</li>
        </ul>
      );
    }

    if (activeTab === "Shipping Information") {
      return (
        <ul>
          <li>Packed securely for handcrafted candle delivery.</li>
          <li>Delivery timelines are confirmed after order placement.</li>
          <li>Bulk and customized orders may need extra preparation time.</li>
        </ul>
      );
    }

    if (activeTab === "Customization Details") {
      return (
        <div className="product-detail-tab-options">
          {selectedVariant ? <span>Variant: {selectedVariant.name}</span> : null}
          {selectedColor ? <span>Color: {selectedColor.name}</span> : null}
          {selectedFragrance ? <span>Fragrance: {selectedFragrance.name}</span> : null}
          {customizationItems.length > 0 ? (
            <span>Available: {customizationItems.join(", ")}</span>
          ) : null}
        </div>
      );
    }

    if (activeTab === "FAQs") {
      return (
        <div className="product-detail-faq-list">
          <p><strong>Can this be customized?</strong> Yes, available product options can be selected before adding to cart.</p>
          <p><strong>Can I gift pack this?</strong> Gift packaging appears when enabled for this product.</p>
        </div>
      );
    }

    return (
      <>
        {descriptionParagraphs.length > 0 ? (
          descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
        ) : (
          <p>A handcrafted candle made for beautiful gifting moments.</p>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-empty-state">
          <p className="product-detail-feedback">Loading product...</p>
        </section>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="product-detail-page">
        <section className="product-detail-empty-state">
          <p className="product-detail-feedback">{error || "Product not found."}</p>
          <button type="button" className="btn" onClick={() => navigate("/shop")}>
            Back to Shop
          </button>
        </section>
      </main>
    );
  }

  const mainImage = productImages[selectedImageIndex] ?? product.img ?? product.image;
  const availableStock = getAvailableStock();
  const isUnavailable = availableStock <= 0;
  const collectionLabel = getCollectionLabel(product);
  const originalBasePrice = selectedVariant?.price || parseProductPrice(product.basePrice || product.price);
  const currentBasePrice = getPurchasableBasePrice(product, selectedVariant);
  const unitPrice = calculateProductPrice(product, selectedColor, selectedFragrance, selectedVariant);
  const fragranceAdjustment = getFragrancePriceAdjustment(selectedFragrance);
  const originalUnitPrice = originalBasePrice + fragranceAdjustment;
  const hasSalePrice = currentBasePrice > 0 && originalBasePrice > currentBasePrice;
  const discountPercent = getDiscountPercent(product, originalUnitPrice, unitPrice);

  return (
    <main className="product-detail-page">
      <div className="product-detail-actions">
        <button type="button" className="product-detail-back" onClick={() => navigate(-1)}>
          &lt; Back
        </button>
        <Link className="product-detail-shop" to="/shop">
          Shop All
        </Link>
      </div>

      {feedback ? <p className="product-detail-feedback" role="status">{feedback}</p> : null}

      <section className="product-detail-card">
        <div className="product-detail-gallery" aria-label={`${product.name} images`}>
          <div className="product-detail-thumbnail-rail">
            {productImages.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                className={`product-detail-thumbnail ${index === selectedImageIndex ? "is-selected" : ""}`}
                onClick={() => setSelectedImageIndex(index)}
                aria-label={`View image ${index + 1}`}
                aria-pressed={index === selectedImageIndex}
              >
                <img src={image} alt={`${product.name} thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>

          <div className="product-detail-main-image">
            <div className="product-detail-badges">
              {product.bestSeller || product.isBestSeller ? <span>Best Seller</span> : null}
              {collectionLabel ? <span>{collectionLabel}</span> : null}
            </div>
            <button
              type="button"
              className="product-detail-image-button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Open ${product.name} image preview`}
            >
              <img src={mainImage} alt={product.name} />
            </button>
            <button
              type="button"
              className="product-detail-lightbox-trigger"
              onClick={() => setLightboxOpen(true)}
              aria-label="Preview image"
            >
              <FaExpand aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>

          <div className="product-detail-price-block">
            <div className="product-detail-price-row">
              <span className="product-detail-current-price">
                {formatProductPrice(giftWrap ? unitPrice + (product.giftWrapPrice ?? 80) : unitPrice)}
              </span>
              {hasSalePrice ? (
                <span className="product-detail-original-price">
                  {formatProductPrice(giftWrap ? originalUnitPrice + (product.giftWrapPrice ?? 80) : originalUnitPrice)}
                </span>
              ) : null}
              {discountPercent > 0 ? (
                <span className="product-detail-discount">{discountPercent}% off</span>
              ) : null}
            </div>
            <p className={`product-detail-stock ${isUnavailable ? "is-out" : ""}`}>
              <FaBoxOpen aria-hidden="true" />
              {isUnavailable ? "Out of stock" : `${availableStock} items left`}
            </p>
          </div>

          <div className="product-detail-description">
            {descriptionParagraphs.length > 0 ? (
              descriptionParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
            ) : (
              <p>A handcrafted candle made for beautiful gifting moments.</p>
            )}
          </div>

          {variantOptions.length > 0 ? (
            <section className="product-detail-control-section">
              <h2>Variants</h2>
              <div className="product-detail-variant-grid">
                {variantOptions.map((variant, index) => {
                  const isSelected = optionKey(selectedVariant, "") === optionKey(variant, index);

                  return (
                    <button
                      key={optionKey(variant, index)}
                      type="button"
                      className={`product-detail-variant-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedVariant(variant);
                        setQuantity(1);
                      }}
                      aria-pressed={isSelected}
                    >
                      <span className="product-detail-option-check">{isSelected ? <FaCheck aria-hidden="true" /> : null}</span>
                      <span>{variant.name}</span>
                      <strong>{formatProductPrice(variant.price || currentBasePrice)}</strong>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {customizationItems.length > 0 ? (
            <section className="product-detail-control-section">
              <h2>Customization</h2>
              <div className="product-detail-customization-row">
                {customizationItems.map((item) => {
                  const Icon = getCustomizationIcon(item);

                  return (
                    <div className="product-detail-custom-card" key={item}>
                      <Icon aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {colorOptions.length > 0 ? (
            <section className="product-detail-control-section">
              <h2>Available Colors</h2>
              <div className="product-detail-colors-list">
                {colorOptions.map((color, index) => {
                  const isSelected = optionKey(selectedColor, "") === optionKey(color, index);

                  return (
                    <button
                      key={optionKey(color, index)}
                      type="button"
                      className={`product-detail-color-btn ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedColor(color)}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="product-detail-color-swatch"
                        style={{ backgroundColor: color.hexCode || "#efe7dc" }}
                      >
                        {isSelected ? <FaCheck aria-hidden="true" /> : null}
                      </span>
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          {fragranceOptions.length > 0 ? (
            <section className="product-detail-control-section">
              <h2>Available Fragrances</h2>
              <div className="product-detail-fragrances-list">
                {fragranceOptions.map((fragrance, index) => {
                  const isSelected = optionKey(selectedFragrance, "") === optionKey(fragrance, index);

                  return (
                    <button
                      key={optionKey(fragrance, index)}
                      type="button"
                      className={`product-detail-frag-btn ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedFragrance(fragrance)}
                      aria-pressed={isSelected}
                    >
                      {fragrance.name}
                      {Number(fragrance.priceAdjustment ?? 0) > 0 ? (
                        <span>+{formatProductPrice(fragrance.priceAdjustment)}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="product-detail-control-section" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "15px", marginTop: "15px" }}>
            <h2>Gift Wrapping</h2>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "15px", margin: "10px 0" }}>
              <input
                type="checkbox"
                checked={giftWrap}
                onChange={(event) => setGiftWrap(event.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--primary)" }}
              />
              <span>Add Premium Gift Wrapping (+ Rs {product.giftWrapPrice ?? 80})</span>
            </label>
            {giftWrap ? (
              <div style={{ fontSize: "14px", color: "var(--text-muted)", background: "rgba(0,0,0,0.03)", padding: "10px", borderRadius: "6px", marginTop: "5px" }}>
                <div>Actual Price: Rs {unitPrice}</div>
                <div>Gift Wrap: Rs {product.giftWrapPrice ?? 80}</div>
                <div style={{ fontWeight: "bold", borderTop: "1px solid rgba(0,0,0,0.1)", marginTop: "5px", paddingTop: "5px" }}>
                  Total: Rs {unitPrice + (product.giftWrapPrice ?? 80)}
                </div>
              </div>
            ) : null}
          </section>

          <div className="product-detail-purchase-row">
            <div className="product-detail-quantity" aria-label="Quantity selector">
              <button type="button" onClick={() => handleQuantityChange(quantity - 1)} disabled={quantity <= 1}>
                <FaMinus aria-hidden="true" />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={isUnavailable || quantity >= availableStock}
              >
                <FaPlus aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="product-detail-cta">
            <button
              type="button"
              className="product-detail-primary-btn"
              onClick={() => handleAddToCart()}
              disabled={isUnavailable}
            >
              <FaShoppingBag aria-hidden="true" />
              Add To Cart
            </button>
            <button
              type="button"
              className="product-detail-secondary-btn"
              onClick={() => handleAddToCart({ checkout: true })}
              disabled={isUnavailable}
            >
              Buy Now
            </button>
          </div>
        </div>
      </section>

      <section className="product-detail-section product-detail-features" aria-label="Product features">
        {featureItems.map(({ label, Icon }) => (
          <div className="product-detail-feature" key={label}>
            {createElement(Icon, { "aria-hidden": true })}
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="product-detail-section product-detail-tabs">
        <div className="product-detail-tab-list" role="tablist" aria-label="Product information">
          {tabLabels.map((label) => (
            <button
              key={label}
              type="button"
              className={activeTab === label ? "is-active" : ""}
              onClick={() => setActiveTab(label)}
              role="tab"
              aria-selected={activeTab === label}
            >
              {label === "Shipping Information" ? <FaTruck aria-hidden="true" /> : null}
              {label === "FAQs" ? <FaQuestionCircle aria-hidden="true" /> : null}
              {label}
            </button>
          ))}
        </div>
        <div className="product-detail-tab-panel" role="tabpanel">
          {renderTabContent()}
        </div>
      </section>

      <section className="product-detail-section">
        <div className="product-detail-section-head">
          <div>
            <p>Related Products</p>
            <h2>More from {collectionLabel}</h2>
          </div>
        </div>
        {recommendations.length === 0 ? (
          <p className="product-detail-feedback">No recommendations available.</p>
        ) : (
          <div className="product-detail-grid">
            {recommendations.map((item) => (
              <article className="product-detail-rec-card" key={item.id}>
                <Link to={`/product/${item.productId || item.id}`}>
                  <img src={item.img ?? item.image} alt={item.name} />
                </Link>
                <div>
                  <h3>
                    <Link to={`/product/${item.productId || item.id}`}>{item.name}</Link>
                  </h3>
                  <p>{item.price}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {lightboxOpen ? (
        <div className="product-detail-lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxOpen(false)}>
          <button type="button" aria-label="Close preview" onClick={() => setLightboxOpen(false)}>
            <FaTimes aria-hidden="true" />
          </button>
          <img src={mainImage} alt={product.name} onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}
    </main>
  );
}
