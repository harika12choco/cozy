const STORAGE_KEY = "cozy-candle-admin-db";

const defaultData = {
  products: [
    {
      id: "prd_1",
      name: "Vanilla Dream",
      price: 499,
      category: "Warm & Cozy",
      stock: 18,
      status: "active",
      image: "/src/assets/candles/1.png",
      description: "A creamy vanilla candle with a soft amber finish."
    },
    {
      id: "prd_2",
      name: "Rose Bliss",
      price: 599,
      category: "Floral",
      stock: 12,
      status: "active",
      image: "/src/assets/candles/2.png",
      description: "Velvety rose petals layered with a sweet evening bloom."
    },
    {
      id: "prd_3",
      name: "Lavender Calm",
      price: 549,
      category: "Aromatherapy",
      stock: 21,
      status: "active",
      image: "/src/assets/candles/3.png",
      description: "A relaxing lavender candle for quiet nights and slow mornings."
    }
  ],
  orders: [
    { id: "ord_1001", customer: "Anika Sharma", total: 1098, status: "processing", date: "2026-03-10", items: 2, payment: "Paid" },
    { id: "ord_1002", customer: "Riya Kapoor", total: 599, status: "delivered", date: "2026-03-09", items: 1, payment: "Paid" },
    { id: "ord_1003", customer: "Maya Singh", total: 1647, status: "pending", date: "2026-03-11", items: 3, payment: "Pending" }
  ],
  users: [
    { id: "usr_1", name: "Aarav Mehta", email: "aarav@example.com", role: "Customer", status: "active", joined: "2026-02-18", orders: 4 },
    { id: "usr_2", name: "Sara Khan", email: "sara@example.com", role: "Client", status: "active", joined: "2026-01-30", orders: 7 },
    { id: "usr_3", name: "Neil Roy", email: "neil@example.com", role: "Customer", status: "blocked", joined: "2026-02-05", orders: 1 }
  ],
  banners: [
    {
      id: "ban_1",
      title: "Handcrafted Luxury Candles",
      subtitle: "Bring warmth and calm into your home with our premium handmade candles.",
      ctaLabel: "Shop Collection",
      active: true
    }
  ],
  discounts: [
    { id: "disc_1", code: "WELCOME10", type: "percentage", value: 10, minSpend: 999, status: "active", expiresAt: "2026-04-30" }
  ]
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function ensureDb() {
  if (typeof window === "undefined") {
    return clone(defaultData);
  }

  const existing = safeParse(window.localStorage.getItem(STORAGE_KEY));

  if (!existing) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return clone(defaultData);
  }

  const merged = { ...defaultData, ...existing };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

function saveDb(data) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("cozy-admin-products-updated"));
  }
}

function generateId(prefix) {
  return `${prefix}_${Date.now()}`;
}

export const adminApi = {
  readCollection(collectionName) {
    const db = ensureDb();
    return db[collectionName] ?? [];
  },

  writeCollection(collectionName, items) {
    const db = ensureDb();
    const nextDb = { ...db, [collectionName]: items };
    saveDb(nextDb);
    return nextDb[collectionName];
  },

  insertItem(collectionName, item, prefix = "itm") {
    const items = this.readCollection(collectionName);
    const nextItem = { id: item.id ?? generateId(prefix), ...item };
    this.writeCollection(collectionName, [nextItem, ...items]);
    return nextItem;
  },

  updateItem(collectionName, id, changes) {
    const items = this.readCollection(collectionName);
    const updated = items.map((item) => (item.id === id ? { ...item, ...changes } : item));
    this.writeCollection(collectionName, updated);
    return updated.find((item) => item.id === id) ?? null;
  },

  removeItem(collectionName, id) {
    const items = this.readCollection(collectionName);
    const filtered = items.filter((item) => item.id !== id);
    this.writeCollection(collectionName, filtered);
    return filtered;
  },

  reset() {
    saveDb(defaultData);
    return clone(defaultData);
  }
};
