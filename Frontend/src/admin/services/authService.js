import { requestJson } from "./http";

const ADMIN_TOKEN_STORAGE_KEY = "cozy-admin-token";

function saveToken(token) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

function readToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || "";
}

function clearToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

// When the token was last issued in this tab. Verifying a token the server handed over a moment
// ago is a wasted round trip, and on a cold backend that round trip is what the admin experiences
// as "signing in is slow".
let issuedAt = 0;

export const adminAuthService = {
  tokenKey: ADMIN_TOKEN_STORAGE_KEY,

  wasJustIssued(withinMs = 15000) {
    return issuedAt > 0 && Date.now() - issuedAt < withinMs;
  },

  getToken() {
    return readToken();
  },

  isAuthenticated() {
    return Boolean(readToken());
  },

  async login(credentials) {
    const response = await requestJson("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        username: String(credentials?.username || "").trim(),
        password: String(credentials?.password || "")
      })
    });

    const token = String(response?.token || "").trim();

    if (!token) {
      throw new Error("Login failed. No token was returned.");
    }

    saveToken(token);
    issuedAt = Date.now();
    return response;
  },

  async verify() {
    const response = await requestJson("/admin/verify-token");
    return response?.valid === true;
  },

  logout() {
    issuedAt = 0;
    clearToken();
  }
};
