import { resolveApiRoot } from "../utils/apiConfig";
import { auth } from "../firebase";

const API_ROOT = resolveApiRoot();

async function requestJson(path, options = {}) {
  const { headers, ...restOptions } = options;
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(headers ?? {})
      },
      ...restOptions
    });
  } catch {
    throw new Error(
      `Unable to reach backend at ${API_ROOT}. Please check the API configuration.`
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

/**
 * CRIT-3 FIX (frontend): Gets a fresh Firebase ID token to authenticate
 * the order request. POST /api/orders now requires a valid user token.
 */
async function getAuthHeader() {
  const user = auth.currentUser;
  if (!user) return {};
  try {
    const token = await user.getIdToken();
    return { "Authorization": `Bearer ${token}` };
  } catch {
    return {};
  }
}

export async function createRazorpayOrder(order) {
  const authHeader = await getAuthHeader();
  return requestJson("/payment/create-order", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({ order })
  });
}

export async function verifyRazorpayPayment(paymentResponse, order) {
  const authHeader = await getAuthHeader();
  return requestJson("/payment/verify", {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      ...paymentResponse,
      order
    })
  });
}
