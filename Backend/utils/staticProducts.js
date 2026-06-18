function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const colorHexByName = {
  "Amber Gold": "#C8862E",
  Beige: "#D8C4AA",
  "Baby Blue": "#A7D8F0",
  "Baby Pink": "#F5B6C8",
  "Berry Latte Red": "#B8454B",
  "Blue Lotus": "#6EA7D8",
  "Blush Pink": "#E9A7B4",
  "Caramel Latte Brown": "#B87945",
  "Champagne Beige": "#D8C2A4",
  "Champagne Gold": "#D6A84B",
  "Chocolate Brown": "#6F3F2E",
  "Chocolate Latte Brown": "#81513A",
  "Classic Ivory": "#F6EBDD",
  "Coffee Brown & Beige": "#9B7653",
  "Coral Pink": "#F27C73",
  "Custom Color Available": "#EFE7DC",
  "Crimson Red": "#9B1C24",
  "Dark Chocolate & Ivory": "#4F2F25",
  "Dusty Rose": "#C7858A",
  Gold: "#C9A24A",
  Green: "#87A96B",
  "Iced Matcha Green": "#A9B878",
  "Ivory White": "#F8EFE3",
  Lavender: "#B99BD7",
  "Lavender Lilac": "#B99BD7",
  "Lavender Lotus": "#B7A0D9",
  "Lavender Purple": "#A987D9",
  Lilac: "#C8A2C8",
  "Mango Latte Yellow": "#F4C45F",
  "Mint Green": "#A8DCC4",
  "Mocha Brown & Cream": "#8A5C42",
  Peach: "#F3B98F",
  "Peach Blossom": "#F1B58F",
  "Pearl White": "#F5F1E7",
  Pink: "#E99AAE",
  "Pink & Chocolate": "#C98293",
  "Pink Lotus": "#E879A6",
  Red: "#B8202D",
  "Red Lotus": "#B8212D",
  "Rose Latte Pink": "#DDA1A7",
  "Rose Pink": "#E49BAE",
  "Royal Purple": "#6B3FA0",
  "Sage Green": "#9BAE8C",
  Silver: "#C8C8C8",
  "Sky Blue": "#83C7E8",
  "Strawberry Latte Pink": "#F0A6B8",
  "Sunflower Yellow": "#F4BD28",
  "Sunshine Yellow": "#F5C94A",
  "Sunset Orange": "#E87835",
  "Vanilla Latte Cream": "#F1DEC2",
  White: "#FFFFFF",
  "White & Gold": "#F7F0E5",
  "White Lotus": "#F7F0E5",
  Yellow: "#F4C74A"
};

function buildColor(name) {
  return {
    optionId: slugify(name),
    name,
    hexCode: colorHexByName[name] || "#EFE7DC",
    priceAdjustment: 0
  };
}

function buildFragrance(name) {
  return {
    optionId: slugify(name),
    name,
    priceAdjustment: 0
  };
}

const catalogProductDefinitions = [
  {
    id: "lotus-pond-luxury-tray-candle",
    name: "Lotus Pond Luxury Wooden Tray Candle",
    basePrice: 1069,
    description:
      "A handcrafted statement candle inspired by the serenity of a lotus pond. Featuring blooming lotus flowers, lily pads, miniature boats, and elegant pearl accents.",
    fragrances: [
      "Lotus",
      "Cherry Blossom",
      "Rose Garden",
      "Jasmine Bloom",
      "Lavender Serenity",
      "Vanilla Musk",
      "White Tea & Lily",
      "Oud Musk"
    ],
    colors: [
      "Pink Lotus",
      "White Lotus",
      "Red Lotus",
      "Lavender Lotus",
      "Peach Blossom",
      "Blue Lotus"
    ],
    weight: "500-800g",
    burnTime: "50-70 Hours",
    variants: [],
    customizationOptions: ["Color", "Fragrance", "Decoration", "Gift Packaging", "Message Card"],
    tagline:
      "A miniature lotus garden handcrafted in wax, designed to bring beauty, tranquility, and fragrance into your home."
  },
  {
    id: "golden-toast-champagne-candle",
    name: "Golden Toast Champagne Candle",
    basePrice: 869,
    description:
      "Inspired by sparkling champagne, handcrafted candle in an elegant flute glass with realistic bubble detailing.",
    fragrances: ["Vanilla Musk", "White Jasmine", "Lavender Bliss", "Oud Musk", "Wood Musk", "Rose Petals"],
    colors: ["Champagne Gold", "Rose Pink", "Pearl White", "Amber Gold", "Silver", "Yellow"],
    weight: "180-220g",
    burnTime: "",
    variants: ["Single Piece", "Set of 2", "Gift Box Set of 2"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "Raise a toast to every special moment with the warm glow of our Champagne Candle."
  },
  {
    id: "blush-bloom-botanical-candle",
    name: "Blush Bloom Botanical Candle",
    basePrice: 929,
    description: "Luxury handcrafted candle adorned with dried flowers, rose petals, and gold accents.",
    fragrances: [
      "Rose Bouquet",
      "Peony Blossom",
      "Jasmine Garden",
      "Lavender Fields",
      "Vanilla Musk",
      "White Tea & Lily",
      "Oud Musk"
    ],
    colors: [
      "Classic Ivory",
      "Blush Pink",
      "Lavender Lilac",
      "Sage Green",
      "Champagne Beige",
      "Dusty Rose"
    ],
    weight: "180-250g",
    burnTime: "30-40 Hours",
    variants: [],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "Where delicate blooms meet soothing fragrance-crafted to make every moment feel special."
  },
  {
    id: "crimson-lotus-bowl-candle",
    name: "Crimson Lotus Bowl Candle",
    basePrice: 969,
    description: "Handcrafted candle featuring a blooming lotus flower inside a clear glass bowl.",
    fragrances: [
      "Red Rose",
      "Rose & Vanilla",
      "Jasmine Bloom",
      "Lotus Blossom",
      "Sandalwood",
      "Oud Musk",
      "Lavender"
    ],
    colors: [
      "Crimson Red",
      "Blush Pink",
      "Ivory White",
      "Royal Purple",
      "Sunset Orange",
      "Lavender Lilac"
    ],
    weight: "250-350g",
    burnTime: "35-50 Hours",
    variants: ["Single Wick", "Double Wick", "Gift Box Edition"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "A bold lotus in full bloom-crafted to bring beauty, warmth, and fragrance to every corner of your home."
  },
  {
    id: "daisy-glow-jar-candle",
    name: "Daisy Glow Jar Candle",
    bestSeller: false,
    basePrice: 369,
    description:
      "Brighten your space with our handcrafted Daisy Glow Jar Candle. Featuring a daisy flower topper and vibrant colored wax, this elegant candle combines floral charm with soothing fragrances.",
    fragrances: [
      "Vanilla",
      "Strawberry",
      "Lavender",
      "Rose",
      "Jasmine",
      "Ocean Breeze",
      "Lemongrass",
      "Cotton Candy",
      "Baby Powder",
      "Sandalwood",
      "Mogra",
      "Unscented Option Available"
    ],
    colors: [
      "Sunshine Yellow",
      "Coral Pink",
      "Sky Blue",
      "Mint Green",
      "Lavender Purple",
      "Peach",
      "Ivory White",
      "Custom Color Available"
    ],
    weight: "",
    burnTime: "",
    variants: [
      "Single Candle Rs 369-419",
      "Set of 2 Rs 619-719",
      "Set of 3 Rs 869-1019",
      "Set of 6 Rs 1569-1869",
      "Custom Gift Box Set Available"
    ],
    customizationOptions: ["Color", "Fragrance", "Gift Box Set", "Custom Orders"],
    tagline:
      "Handmade and hand-poured in a premium glass jar with a beautiful daisy flower topper, perfect for gifting and home decor."
  },
  {
    id: "blush-bloom-wax-sachet",
    name: "Blush Bloom Wax Sachet",
    bestSeller: false,
    basePrice: 219,
    description:
      "Handcrafted floral wax sachet designed to add a soft fragrance and elegant touch to wardrobes, drawers, cupboards, and gifting hampers.",
    fragrances: [
      "Vanilla",
      "Lavender",
      "Jasmine",
      "Rose",
      "Oud Musk",
      "Wood Musk",
      "Sandalwood",
      "Strawberry",
      "Fresh Lime/lemon"
    ],
    colors: ["Blush Pink", "Lavender", "Ivory White", "Sage Green", "Baby Blue", "Peach"],
    weight: "35-45g",
    burnTime: "Decorative non-burning product",
    variants: ["Single Sachet Rs 219-269", "Bulk & Return Gift Orders"],
    customizationOptions: [
      "Color Customization",
      "Fragrance Customization",
      "Gift Tag Personalisation",
      "Bulk Orders"
    ],
    tagline:
      "Transform everyday spaces with a touch of fragrance and floral elegance for wardrobes, drawers, closets, gift boxes, and small spaces."
  }
];

const bestSellerProductDefinitions = [
  {
    id: "shagun-candle-collection",
    sku: "CC-SHAGUN-01",
    name: "Shagun Candle Collection",
    collection: "Festive Collection",
    basePrice: 329,
    description:
      "Hand-poured decorative candles inspired by traditional festive sweets and floral motifs. Crafted from premium wax and finished with delicate gold and silver leaf accents.",
    fragrances: [
      "Vanilla",
      "Jasmine",
      "Lavender",
      "Rose",
      "Sandalwood",
      "Oud Musk",
      "Wood Musk",
      "Mogra",
      "Lemongrass",
      "Custom Fragrance"
    ],
    colors: ["Peach", "Ivory White", "Yellow", "Pink", "Red", "Gold"],
    weight: "",
    burnTime: "",
    variants: ["Single Sculpted Candle Rs 329", "Set of 3 Rs 569-869", "Festive Gift Set Rs 969-1169"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "A festive, gift-ready candle collection poured for celebrations and warm rituals."
  },
  {
    id: "rose-teddy-bear-candle",
    sku: "CC-TEDDY-01",
    name: "Rose Teddy Bear Candle",
    collection: "Teddy Bear Collection",
    basePrice: 219,
    description: "Handcrafted teddy bear candle with beautiful rose texture detailing.",
    fragrances: [
      "Rose",
      "Strawberry",
      "Vanilla",
      "Lavender",
      "Jasmine",
      "Chocolate",
      "Sandalwood",
      "Ocean Breeze"
    ],
    colors: [
      "Baby Pink",
      "Red",
      "Ivory White",
      "Chocolate Brown",
      "Lavender",
      "Baby Blue",
      "Peach",
      "White"
    ],
    weight: "",
    burnTime: "",
    variants: ["Single Teddy Rs 219", "Set of 2 Rs 320", "Set of 3 Rs 669", "Set of 6 Rs 1769"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "A soft, rose-textured teddy candle made for sweet gifting moments."
  },
  {
    id: "sunflower-bloom-candle",
    sku: "CC-SUNFLOWER-01",
    name: "Sunflower Bloom Candle",
    collection: "Floral Candle Collection",
    basePrice: 319,
    description: "Beautiful sunflower-inspired decorative candle with detailed petals and textured center.",
    fragrances: [
      "Vanilla",
      "Strawberry",
      "Lavender",
      "Rose",
      "Jasmine",
      "Sandalwood",
      "Coffee",
      "Chocolate",
      "Lemongrass",
      "Mogra"
    ],
    colors: [
      "Sunflower Yellow",
      "Ivory White",
      "Blush Pink",
      "Lavender Purple",
      "Baby Blue",
      "Red",
      "Chocolate Brown"
    ],
    weight: "",
    burnTime: "",
    variants: ["Single Rs 319-369", "Set of 2 Rs 519-719", "Set of 3 Rs 819-919", "Set of 6 Rs 1369-1569"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "A cheerful floral candle with sculpted petals and a sunny handcrafted finish."
  },
  {
    id: "iced-latte-collection-candle",
    sku: "CC-ICEDLATTE-01",
    name: "Iced Latte Collection Candle",
    collection: "Cafe Collection",
    basePrice: 469,
    description: "Handcrafted cafe-inspired candles designed to look like realistic iced beverages.",
    fragrances: [
      "Strawberry",
      "Rose",
      "Vanilla",
      "Chocolate",
      "Coffee",
      "Cappuccino",
      "Mocha Latte",
      "Caramel Latte",
      "Matcha",
      "Mango",
      "Berry",
      "Hazelnut Coffee",
      "Vanilla Coffee"
    ],
    colors: [
      "Strawberry Latte Pink",
      "Rose Latte Pink",
      "Vanilla Latte Cream",
      "Chocolate Latte Brown",
      "Iced Matcha Green",
      "Mango Latte Yellow",
      "Berry Latte Red",
      "Caramel Latte Brown"
    ],
    weight: "",
    burnTime: "",
    variants: ["Single Rs 469-569", "Set of 2 Rs 819-969", "Set of 3 Rs 1369", "Set of 6 Rs 2169-2569"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "Cafe-inspired candle art with creamy colors and dessert-shop fragrance options."
  },
  {
    id: "mocha-delight-dessert-candle",
    sku: "CC-MOCHA-01",
    name: "Mocha Delight Dessert Candle",
    collection: "Dessert Candle Collection",
    basePrice: 520,
    description:
      "Luxury dessert-inspired candle featuring whipped wax topping, coffee beans, and chocolate details.",
    fragrances: ["Coffee", "Mocha Latte", "Chocolate", "Cappuccino", "Vanilla Coffee", "Hazelnut Coffee", "Vanilla"],
    colors: [
      "Mocha Brown & Cream",
      "Dark Chocolate & Ivory",
      "Coffee Brown & Beige",
      "Pink & Chocolate",
      "White & Gold"
    ],
    weight: "",
    burnTime: "",
    variants: ["Set of 2 Rs 520", "Set of 4 Rs 870", "Set of 6 Rs 1270"],
    customizationOptions: ["Color", "Fragrance", "Gift Packaging", "Message Card"],
    tagline: "A dessert-style candle with rich mocha tones and a decadent handcrafted finish."
  },
  {
    id: "personalized-floral-name-candle",
    sku: "CC-NAME-01",
    name: "Personalized Floral Name Candle",
    collection: "Personalized Candles Collection",
    basePrice: 569,
    description:
      "Customized floral name candle with personalized lettering and handcrafted decorative flowers.",
    fragrances: ["Vanilla", "Strawberry", "Rose", "Lavender", "Jasmine", "Sandalwood", "Ocean Breeze"],
    colors: ["Baby Pink", "Ivory White", "Lavender", "Peach", "Baby Blue", "Green", "Lilac", "Beige"],
    weight: "",
    burnTime: "",
    variants: ["3-5 Letters Rs 569-769", "6-8 Letters Rs 869-1169", "9-12 Letters Rs 1269-1769"],
    customizationOptions: ["Color", "Fragrance", "Name Personalization", "Gift Packaging", "Message Card"],
    tagline: "A personalized floral keepsake candle shaped around a custom name."
  }
];

function normalizeProduct(product) {
  const colors = product.colors.map(buildColor);
  const category = product.category || product.collection || "Our Products";

  return {
    ...product,
    productId: product.id,
    staticProduct: true,
    sku: product.sku || "",
    price: product.basePrice,
    image: "",
    images: [],
    collection: product.collection || category,
    category,
    colors,
    candleColors: colors,
    fragrances: product.fragrances.map(buildFragrance),
    status: "active",
    visible: product.visible ?? true,
    stock: 99,
    bestSeller: Boolean(product.bestSeller ?? true),
    isBestSeller: Boolean(product.bestSeller ?? true)
  };
}

const catalogProducts = catalogProductDefinitions.map(normalizeProduct);
const bestSellerProducts = bestSellerProductDefinitions.map(normalizeProduct);
const staticProducts = [...catalogProducts, ...bestSellerProducts];
const staticProductMap = new Map(staticProducts.map((product) => [product.id, product]));

function getStaticProductById(id) {
  return staticProductMap.get(String(id || "").trim()) || null;
}

function isStaticProductId(id) {
  return staticProductMap.has(String(id || "").trim());
}

module.exports = {
  getStaticProductById,
  isStaticProductId,
  staticProducts
};
