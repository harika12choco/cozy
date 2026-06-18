import { useMemo, useState } from "react";
import { FaEye, FaShoppingBag } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import CandleSafety from "./CandleSafety";
import {
  getCalculatedProductPrice,
  normalizeColorOption,
  normalizeFragranceOption,
  normalizeVariantOption,
  withCalculatedProductPrice
} from "../utils/productPricing";
import "../styles/ProductChoiceCard.css";

function getProductPath(product) {
  return `/product/${product.productId || product.id}`;
}

export default function ProductChoiceCard({ product, onAddToCart, variant = "shop", showSafety = true }) {
  const navigate = useNavigate();
  const colorOptions = useMemo(
    () =>
      (Array.isArray(product.candleColors) ? product.candleColors : [])
        .map((option, index) => normalizeColorOption(option, `color-${index}`))
        .filter(Boolean),
    [product.candleColors]
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
        .map((option, index) => normalizeVariantOption(option, `variant-${index}`, product.basePrice ?? product.price))
        .filter(Boolean),
    [product.variants, product.basePrice, product.price]
  );
  const [selectedColor, setSelectedColor] = useState(() => colorOptions[0] ?? null);
  const [selectedFragrance, setSelectedFragrance] = useState(() => fragranceOptions[0] ?? null);
  const [selectedVariant] = useState(() => variantOptions[0] ?? null);
  const productPath = getProductPath(product);
  const imgSrc = product.img ?? product.image;
  const isUnavailable = Number(product.stock ?? 0) <= 0;
  const cardClassName = variant === "bestseller" ? "product choice-card" : "shop-card choice-card";
  const selectedPrice = getCalculatedProductPrice(product, selectedColor, selectedFragrance, selectedVariant);

  function handleCardClick(event) {
    if (event.target.closest("a, button, input, select, textarea")) {
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

  return (
    <article className={cardClassName} onClick={handleCardClick}>
      <div className="choice-card-image">
        <Link to={productPath} aria-label={`View ${product.name}`}>
          <img src={imgSrc} alt={product.name} />
        </Link>
      </div>

      <div className="choice-card-body">
        <h3>
          <Link to={productPath}>{product.name}</Link>
        </h3>

        <div className="choice-price-row">
          <span className="choice-price">{selectedPrice}</span>
          <span className={`choice-stock ${isUnavailable ? "is-out" : ""}`}>
            {isUnavailable ? "Out of stock" : `${product.stock} items left`}
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
                  onClick={() => setSelectedColor(color)}
                />
              );
            })}
          </div>
        ) : null}

        {fragranceOptions.length > 0 ? (
          <div className="choice-fragrance-chips" aria-label="Choose fragrance">
            {fragranceOptions.map((fragrance, index) => {
              const isSelected =
                selectedFragrance?.optionId === fragrance.optionId || selectedFragrance?.name === fragrance.name;

              return (
                <button
                  className={`choice-chip ${isSelected ? "is-selected" : ""}`}
                  key={`${fragrance.optionId || fragrance.name}-${index}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedFragrance(fragrance)}
                >
                  {fragrance.name}
                </button>
              );
            })}
          </div>
        ) : null}

        <div className="choice-actions">
          <button className="choice-cart-button" type="button" onClick={handleAddToCart} disabled={isUnavailable}>
            <FaShoppingBag aria-hidden="true" />
            Add to Cart
          </button>
          <Link className="choice-view-button" to={productPath} aria-label={`View ${product.name}`}>
            <FaEye aria-hidden="true" />
          </Link>
        </div>

        {showSafety ? <CandleSafety compact className="choice-card-safety" /> : null}
      </div>
    </article>
  );
}
