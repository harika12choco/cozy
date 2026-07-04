const PRODUCTION_API_ROOT = "https://cozy-candles-backend.onrender.com/api";
const DEVELOPMENT_API_ROOT = "/api";

function stripTrailingSlash(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function isLocalhostApi(value) {
  try {
    const { hostname } = new URL(value);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function shouldUseConfiguredApi(value) {
  const trimmed = stripTrailingSlash(value);

  if (!trimmed) {
    return false;
  }

  return !(import.meta.env.PROD && isLocalhostApi(trimmed));
}

export function normalizeApiRoot(value) {
  const trimmed = stripTrailingSlash(value);

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

export function normalizeProductsApi(value) {
  const apiRoot = normalizeApiRoot(value);

  if (!apiRoot) {
    return "";
  }

  return `${apiRoot}/products`;
}

export function resolveApiRoot() {
  const envApiRoot = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL;

  if (shouldUseConfiguredApi(envApiRoot)) {
    return normalizeApiRoot(envApiRoot);
  }

  return import.meta.env.DEV ? DEVELOPMENT_API_ROOT : PRODUCTION_API_ROOT;
}

export function resolveProductsApiUrl() {
  const envProductsApi = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL;

  if (shouldUseConfiguredApi(envProductsApi)) {
    return normalizeProductsApi(envProductsApi);
  }

  return `${resolveApiRoot()}/products`;
}
