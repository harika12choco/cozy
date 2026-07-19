import { resolveApiRoot } from "../../utils/apiConfig";

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
  const { headers, ...restOptions } = options;
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeader(),
        ...(headers ?? {})
      },
      ...restOptions
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
