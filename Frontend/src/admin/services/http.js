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

  // An expired/invalid admin token (8h TTL, or a backend secret rotation) rejects every write
  // with 401. Without this, the admin just sees a dead-end error and thinks "it's broken".
  // Clear the stale token and send them back to sign in. The login call itself is exempt so a
  // wrong-password 401 still shows its own message.
  if (response.status === 401 && !path.includes("/admin/auth/login")) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
      if (!window.location.pathname.endsWith("/admin/login")) {
        window.location.assign("/admin/login");
      }
    }
    throw new Error("Your admin session has expired. Please sign in again.");
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
