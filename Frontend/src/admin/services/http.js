const API_ROOT = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api").replace(/\/$/, "");

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
