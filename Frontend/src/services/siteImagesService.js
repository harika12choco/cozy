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

// Both the hero banner and the category carousel need this on the home page. Sharing one
// in-flight request keeps it to a single round trip per page load.
let inflight = null;

export async function fetchSiteImages() {
  if (inflight) {
    return inflight;
  }

  inflight = requestJson("/site-images");

  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
