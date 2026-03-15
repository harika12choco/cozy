const API_BASE =
  import.meta.env.VITE_API_URL ?? "https://cozy-candles-backend.onrender.com/api/products";
function notifyProductChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cozy-admin-products-updated"));
  }
}

function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  return {
    ...product,
    id: product.id ?? product._id,
    status: product.status ?? "active",
    bestSeller: Boolean(product.bestSeller)
  };
}

async function request(path = "", options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    let message = "Request failed";

    try {
      const error = await response.json();
      message = error.error ?? error.message ?? message;
    } catch {
      message = `${message} (${response.status})`;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const productService = {
  async list() {
    const products = await request();
    return Array.isArray(products) ? products.map(normalizeProduct) : [];
  },

  async getById(id) {
    const product = await request(`/${id}`);
    return normalizeProduct(product);
  },

  async create(product) {
    const created = await request("", {
      method: "POST",
      body: JSON.stringify(product)
    });
    notifyProductChange();
    return normalizeProduct(created.product ?? created);
  },

  async update(id, product) {
    const updated = await request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(product)
    });
    notifyProductChange();
    return normalizeProduct(updated);
  },

  async remove(id) {
    await request(`/${id}`, {
      method: "DELETE"
    });
    notifyProductChange();
    return true;
  }
};
