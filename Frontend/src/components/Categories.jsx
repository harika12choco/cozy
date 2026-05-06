import { useRef } from "react";
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

const categoryImages = {
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

  function handleNavigate(category) {
    navigate(`/shop?category=${slugifyCategory(category)}`);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function scrollCategories(direction) {
    const track = categoryTrackRef.current;

    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction * Math.round(track.clientWidth * 0.82),
      behavior: "smooth"
    });
  }

  return (
    <section className="categories" aria-labelledby="product-categories-title">
      <h2 id="product-categories-title">Product Categories</h2>

      <div className="category-carousel">
        <button
          className="category-arrow category-arrow-left"
          type="button"
          onClick={() => scrollCategories(-1)}
          aria-label="Previous product categories"
        >
          {"<"}
        </button>

        <div className="category-grid" ref={categoryTrackRef}>
          {displayCategories.map((category) => (
            <button
              className="category-card"
              key={category.title}
              type="button"
              onClick={() => handleNavigate(category.title)}
              aria-label={`Shop ${category.title}`}
            >
              <img src={categoryImages[category.title]} alt="" />
              <span>{category.title}</span>
            </button>
          ))}
        </div>

        <button
          className="category-arrow category-arrow-right"
          type="button"
          onClick={() => scrollCategories(1)}
          aria-label="Next product categories"
        >
          {">"}
        </button>
      </div>
    </section>
  );
}
