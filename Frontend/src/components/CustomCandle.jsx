import "../styles/CustomCandle.css";

const atelierItems = [
  { label: "Fragrance", detail: "Vanilla, rose, coffee, or your own blend" },
  { label: "Colors", detail: "Ivory, blush pink, burgundy, or custom tones" },
  { label: "Message", detail: "Add a name, date, promise, or tiny note" },
  { label: "Packaging", detail: "Ribbon, gift box, dried flowers, and tags" },
  { label: "Events", detail: "Wedding favors, hampers, corporate gifting" }
];

const journeySteps = [
  ["Choose Your Vessel", "Bowl • Jar • Champagne Glass"],
  ["Pick Your Fragrance", "Vanilla • Rose • Coffee • Custom"],
  ["Select Colors", "Ivory • Blush Pink • Burgundy • Custom"],
  ["Add Personal Touch", "Name • Message • Date"],
  ["Gift Packaging", "Ribbon • Gift Box • Dried Flowers"]
];

export default function CustomCandle() {
  return (
    <section className="custom-candle" aria-labelledby="custom-candle-title">
      <div className="custom-candle-inner">
        <div className="custom-candle-heading">
          <h2 id="custom-candle-title">customize your own candle</h2>
        </div>

        <div className="custom-candle-layout">
          <div className="atelier-desk" aria-label="Customization options">
            {atelierItems.map((item, index) => (
              <article
                className={`atelier-note atelier-note-${index + 1}`}
                key={item.label}
              >
                <span>{item.label}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>

          <div className="custom-journey">
            {journeySteps.map(([title, detail], index) => (
              <div className="journey-step" key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </div>
              </div>
            ))}
            <a className="custom-order-btn" href="#contact">
              Start Custom Order
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
