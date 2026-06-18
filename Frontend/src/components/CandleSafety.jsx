const CANDLE_SAFETY_ITEMS = [
  "Never leave a burning candle unattended.",
  "Keep away from children and pets.",
  "Trim wick before use.",
  "Burn on heat-resistant surface.",
  "Stop using when wax reaches bottom level."
];

const COMPACT_SAFETY_ITEMS = [
  "Trim wick before every burn.",
  "Do not burn for more than 3-4 hours continuously.",
  "Keep away from children and pets."
];

export default function CandleSafety({ compact = false, className = "" }) {
  const items = compact ? COMPACT_SAFETY_ITEMS : CANDLE_SAFETY_ITEMS;
  const classes = ["candle-safety", compact ? "candle-safety-compact" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={classes} aria-label="Candle safety">
      <h3>Candle Safety</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
