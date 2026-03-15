const collections = [
  {
    title: "Floral Candles",
    note: "Soft botanical fragrances for fresh, romantic spaces."
  },
  {
    title: "Luxury Candles",
    note: "Rich statement scents with a premium, elegant feel."
  },
  {
    title: "Aromatherapy",
    note: "Calming blends designed for rest, focus, and slow evenings."
  }
];

export default function OurCollections() {
  return (
    <section className="admin-panel">
      <div className="admin-panel-head">
        <div>
          <h3>Our Collections</h3>
          <p>Overview of the featured candle collections shown on the home page.</p>
        </div>
      </div>

      <div className="admin-messages-grid">
        {collections.map((collection) => (
          <article key={collection.title} className="admin-message-card">
            <div className="admin-table-title">
              <strong>{collection.title}</strong>
              <span>Homepage collection</span>
            </div>
            <p className="admin-message-body">{collection.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
