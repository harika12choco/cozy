const PRODUCTION_PRODUCTS_API = "https://cozy-candles-backend.onrender.com/api/products";

function resolveProductsApiBase() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return isLocalHost ? "http://localhost:5000/api/products" : PRODUCTION_PRODUCTS_API;
  }

  return "http://localhost:5000/api/products";
}

const API_BASE = resolveProductsApiBase();
const API_ROOT = API_BASE.replace(/\/products\/?$/, "");
const ADMIN_TOKEN_STORAGE_KEY = "cozy-admin-token";

function getAdminAuthHeader() {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

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

async function uploadImageToCloudinary(file) {
  const signatureUrls = [
    `${API_ROOT}/cloudinary/signature`,
    `${API_BASE}/cloudinary/signature`
  ];
  let signatureResponse = null;
  let lastSignatureUrl = signatureUrls[signatureUrls.length - 1];

  for (const signatureUrl of signatureUrls) {
    lastSignatureUrl = signatureUrl;
    signatureResponse = await fetch(signatureUrl, {
      headers: getAdminAuthHeader()
    });

    if (signatureResponse.ok) {
      break;
    }
  }

  if (!signatureResponse?.ok) {
    throw new Error(
      `Cloudinary signature failed (${signatureResponse?.status ?? "unknown"}) at ${lastSignatureUrl}`
    );
  }

  const signature = await signatureResponse.json();
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("folder", signature.folder);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );
  const uploadResult = await uploadResponse.json();

  if (!uploadResponse.ok) {
    throw new Error(uploadResult.error?.message ?? "Cloudinary upload failed");
  }

  return {
    image: uploadResult.secure_url,
    imagePublicId: uploadResult.public_id
  };
}

async function prepareProductPayload(product) {
  const { imageFile, ...payload } = product;

  if (!imageFile) {
    return payload;
  }

  const imageUpload = await uploadImageToCloudinary(imageFile);

  return {
    ...payload,
    ...imageUpload
  };
}

async function request(path = "", options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAdminAuthHeader(),
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
    const payload = await prepareProductPayload(product);
    const created = await request("", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    notifyProductChange();
    return normalizeProduct(created.product ?? created);
  },

  async update(id, product) {
    const payload = await prepareProductPayload(product);
    const updated = await request(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload)
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
