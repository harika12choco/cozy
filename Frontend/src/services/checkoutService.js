import { resolveApiRoot } from "../utils/apiConfig";

const API_ROOT = resolveApiRoot();

async function requestJson(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_ROOT}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {})
      },
      ...options
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

export async function createCodOrder(order) {
  return requestJson("/orders", {
    method: "POST",
    body: JSON.stringify(order)
  });
}

export async function createRazorpayOrder(order) {
  return requestJson("/payment/create-order", {
    method: "POST",
    body: JSON.stringify({ order })
  });
}

export async function verifyRazorpayPayment(paymentResponse, order) {
  return requestJson("/payment/verify", {
    method: "POST",
    body: JSON.stringify({
      ...paymentResponse,
      order
    })
  });
}
