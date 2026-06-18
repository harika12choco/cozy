import { useEffect, useState } from "react";
import {
  FaExternalLinkAlt,
  FaGoogle,
  FaStar
} from "react-icons/fa";
import "../styles/Reviews.css";

const googleReviews = [
  {
    title: "Beautiful fragrance",
    text: "The candle was packed so neatly and smelled lovely even before lighting it. It made the whole room feel warm and calm.",
    link: "https://share.google/5V1ZHJ8vCfNfSpaGI"
  },
  {
    title: "Perfect gift",
    text: "Such a thoughtful handmade feel. The finish, scent, and presentation were exactly what I wanted for a cozy celebration.",
    link: "https://share.google/WwWXju5WtPuBrv5Aq"
  },
  {
    title: "Loved the details",
    text: "Every little detail felt personal, from the colors to the gentle scent. I would happily order again.",
    link: "https://share.google/USc2FadAWJV2iOE2A"
  },
  {
    title: "So elegant",
    text: "The candles looked premium and burned beautifully. They added such a peaceful glow to my space.",
    link: "https://share.google/GcvztCA9u9DARQQ5R"
  },
  {
    title: "Highly recommended",
    text: "A sweet experience from ordering to delivery. Cozy Candles made the gift feel special and memorable.",
    link: "https://share.google/G2g2nnVTrVDNXHJJb"
  }
];

export default function Reviews() {
  const [activeReview, setActiveReview] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveReview((current) => (current + 1) % googleReviews.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="section reviews-section" aria-labelledby="reviews-title">
      <div className="reviews-shell">
        <div className="reviews-board">
          <h2 id="reviews-title" className="reviews-heading">Google Reviews</h2>
          <span className="reviews-search" aria-hidden="true">
            <FaGoogle />
          </span>
          <div className="reviews-script" aria-hidden="true">Review</div>
          <p className="reviews-kicker">Customer notes</p>
          <div className="reviews-carousel" aria-live="polite">
            <div
              className="reviews-track"
              style={{ transform: `translateX(-${activeReview * 100}%)` }}
            >
              {googleReviews.map((review, index) => (
                <article
                  className="review-card"
                  key={review.link}
                  aria-hidden={activeReview !== index}
                >
                  <div className="review-card-top">
                    <span className="review-google">
                      <FaGoogle aria-hidden="true" />
                    </span>
                    <span className="review-stars" aria-label="Five star Google review">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <FaStar key={starIndex} aria-hidden="true" />
                      ))}
                    </span>
                  </div>

                  <div className="review-copy">
                    <h2>Google Reviews</h2>
                    <h3>{review.title}</h3>
                    <p>{review.text}</p>

                    <a
                      className="review-link"
                      href={review.link}
                      target="_blank"
                      rel="noreferrer"
                      tabIndex={activeReview === index ? 0 : -1}
                    >
                      Read on Google
                      <FaExternalLinkAlt aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="reviews-dots" aria-label="Choose review">
            {googleReviews.map((review, index) => (
              <button
                className={index === activeReview ? "reviews-dot active" : "reviews-dot"}
                type="button"
                key={review.link}
                aria-label={`Show review ${index + 1}`}
                aria-current={index === activeReview ? "true" : undefined}
                onClick={() => setActiveReview(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
