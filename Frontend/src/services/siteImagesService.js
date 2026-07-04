import { resolveApiRoot } from "../utils/apiConfig";

const API_ROOT = resolveApiRoot();

async function requestJson(path) {
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, { cache: "no-store" });
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
