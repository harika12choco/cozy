import "../styles/DiscountShowcase.css";
import discountOne from "../assets/dis1.png";
import discountTwo from "../assets/dis2.png";

const discountImages = [
  {
    src: discountOne,
    alt: "Decorative candle collection with Pour, Indulge, and Sparkle labels"
  },
  {
    src: discountTwo,
    alt: "Elegant Luxe Timeless floral candle collection"
  }
];

export default function DiscountShowcase() {
  return (
    <section className="discount-showcase" aria-label="Featured candle collections">
      <div className="discount-banner">
        {discountImages.map((image) => (
          <figure className="discount-banner-panel" key={image.src}>
            <img src={image.src} alt={image.alt} />
          </figure>
        ))}
      </div>
    </section>
  );
}
