const PRODUCTION_BACKEND_API = "https://cozy-candles-backend.onrender.com/api";

function normalizeApiRoot(value) {
  const trimmed = String(value || "").trim().replace(/\/$/, "");

  if (!trimmed) {
    return "";
  }

  if (/\/api\/products$/i.test(trimmed)) {
    return trimmed.replace(/\/products$/i, "");
  }

  if (/\/api$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

function resolveApiRoot() {
  const envApiRoot = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL?.replace(/\/products\/?$/, "");

  if (envApiRoot) {
    return normalizeApiRoot(envApiRoot);
  }

  if (typeof window !== "undefined") {
    const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    return (isLocalHost ? "http://localhost:5000/api" : PRODUCTION_BACKEND_API).replace(/\/$/, "");
  }

  return "http://localhost:5000/api";
}

const API_ROOT = resolveApiRoot();
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

export function normalizeEntity(entity) {
  if (!entity) {
    return null;
  }

  return {
    ...entity,
    id: entity.id ?? entity._id
  };
}

export async function requestJson(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeader(),
        ...(options.headers ?? {})
      },
      ...options
    });
  } catch {
    throw new Error(
      `Unable to reach backend at ${API_ROOT}. Check Vercel env VITE_API_BASE_URL and Render CORS FRONTEND_URLS.`
    );
  }

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
