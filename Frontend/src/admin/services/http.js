const API_ROOT = (
  import.meta.env.VITE_API_BASE_URL ??
  import.meta.env.VITE_API_URL?.replace(/\/products\/?$/, "") ??
  "http://localhost:5000/api"
).replace(/\/$/, "");
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
  const response = await fetch(`${API_ROOT}${path}`, {
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
