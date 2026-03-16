import { TOKEN_KEY, USER_KEY } from "@/lib/constants";
import type { Admin } from "@/types/auth.types";

const LEGACY_TOKEN_KEYS = ["token", "admin_token"] as const;
const canUseStorage = () => typeof window !== "undefined";

const readTokenFrom = (storage: Storage, keys: readonly string[]): string | null => {
  for (const key of keys) {
    const value = storage.getItem(key);
    if (value && value.trim().length > 0) {
      return value;
    }
  }

  return null;
};

const removeLegacyTokens = () => {
  if (!canUseStorage()) return;

  LEGACY_TOKEN_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
};

export const setToken = (token: string, remember = false) => {
  if (!canUseStorage()) return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  const other = remember ? window.sessionStorage : window.localStorage;

  storage.setItem(TOKEN_KEY, token);
  other.removeItem(TOKEN_KEY);
  removeLegacyTokens();
};

export const getToken = (): string | null => {
  if (!canUseStorage()) return null;

  const localToken = readTokenFrom(window.localStorage, [TOKEN_KEY]);
  if (localToken) {
    removeLegacyTokens();
    return localToken;
  }

  const sessionToken = readTokenFrom(window.sessionStorage, [TOKEN_KEY]);
  if (sessionToken) {
    removeLegacyTokens();
    return sessionToken;
  }

  const legacyLocalToken = readTokenFrom(window.localStorage, LEGACY_TOKEN_KEYS);
  if (legacyLocalToken) {
    setToken(legacyLocalToken, true);
    return legacyLocalToken;
  }

  const legacySessionToken = readTokenFrom(window.sessionStorage, LEGACY_TOKEN_KEYS);
  if (legacySessionToken) {
    setToken(legacySessionToken, false);
    return legacySessionToken;
  }

  return null;
};

export const removeToken = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  removeLegacyTokens();
};

export const setStoredAdmin = (admin: Admin) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(admin));
};

export const getStoredAdmin = (): Admin | null => {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(USER_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as Admin;
  } catch {
    return null;
  }
};

export const removeStoredAdmin = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(USER_KEY);
};
