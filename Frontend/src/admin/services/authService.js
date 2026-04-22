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

export const adminAuthService = {
  tokenKey: ADMIN_TOKEN_STORAGE_KEY,

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
    return response;
  },

  logout() {
    clearToken();
  }
};
