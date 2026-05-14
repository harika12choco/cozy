const PRODUCTION_BACKEND_API = "https://cozy-candles-backend.onrender.com/api";
const DEVELOPMENT_BACKEND_API = "/api";

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

  return import.meta.env.DEV ? DEVELOPMENT_BACKEND_API : PRODUCTION_BACKEND_API.replace(/\/$/, "");
}

const API_ROOT = resolveApiRoot();

async function requestJson(path) {
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`);
  } catch {
    throw new Error("Unable to reach backend.");
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

  return response.json();
}

export async function fetchSiteImages() {
  return requestJson("/site-images");
}
