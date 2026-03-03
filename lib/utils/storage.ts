import { TOKEN_KEY, USER_KEY } from "@/lib/constants";
import type { Admin } from "@/types/auth.types";

const canUseStorage = () => typeof window !== "undefined";

export const setToken = (token: string, remember = false) => {
  if (!canUseStorage()) return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  const other = remember ? window.sessionStorage : window.localStorage;
  other.removeItem(TOKEN_KEY);
};

export const getToken = (): string | null => {
  if (!canUseStorage()) return null;
  return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
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