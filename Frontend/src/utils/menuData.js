const menuData = [
  {
    title: "Moments & Memories",
    items: [
      "Birthday Moments",
      "Anniversary Love",
      "Proposal / Surprise Setup",
      "Memory Keepsake Candles",
    ],
  },
  {
    title: "Gifting Collection",
    items: [
      "Mini Gift Sets",
      "Hamper Candles",
      "Return Favors",
      "Corporate Gifting",
    ],
  },
  {
    title: "Festive Collection",
    items: [
      "Diwali Specials",
      "Christmas Collection",
      "Eid / Festive Hampers",
      "Seasonal Specials",
    ],
  },
  {
    title: "Dessert Candle Collection",
    items: [
      "Cake Candles",
      "Cupcake Candles",
      "Chocolate Candles",
      "Sweet Jar Candles",
    ],
  },
  {
    title: "Floral & Aesthetic",
    items: [
      "Rose Candles",
      "Peony / Daisy Candles",
      "Minimal Aesthetic Pieces",
      "Decor Candles",
      "Bouquet Candle",
    ],
  },
  {
    title: "Jar & Bowl Collection",
    items: [
      "Single Wick Jars",
      "Multi Wick Bowls",
      "Premium Glass Candles",
      "Home Decor Range",
    ],
  },
  {
    title: "Customized",
    items: [
      "Name Candles",
      "Photo Candles",
      "Message Candles",
      "Custom Hampers",
    ],
  },
  {
    title: "Wedding & Event",
    items: [
      "Wedding Favours",
      "Bridal Hampers",
      "Engagement Candles",
      "Event Decor Candles",
    ],
  },
];

export function slugifyCategory(category) {
  return String(category ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const categoryGroups = menuData.map((section) => ({
  label: section.title,
  options: [section.title, ...section.items],
}));

export function findCategoryBySlug(slug) {
  const normalizedSlug = String(slug ?? "").trim();

  if (!normalizedSlug) {
    return null;
  }

  for (const section of menuData) {
    const categories = [section.title, ...section.items];
    const match = categories.find((category) => slugifyCategory(category) === normalizedSlug);

    if (match) {
      return {
        label: match,
        value: match,
        slug: normalizedSlug,
      };
    }
  }

  return null;
}

export default menuData;
