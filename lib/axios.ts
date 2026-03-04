import axios, { isAxiosError } from "axios";

const TOKEN_KEYS = ["entraverse_admin_token", "token", "admin_token"] as const;

const getCookieValue = (key: string): string | null => {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${key}=`));
  return cookie ? decodeURIComponent(cookie.split("=")[1] ?? "") : null;
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const local = TOKEN_KEYS
    .map((key) => window.localStorage.getItem(key))
    .find((value) => value && value.trim().length > 0);
  if (local) return local;

  const session = TOKEN_KEYS
    .map((key) => window.sessionStorage.getItem(key))
    .find((value) => value && value.trim().length > 0);
  if (session) return session;

  const cookie = TOKEN_KEYS
    .map((key) => getCookieValue(key))
    .find((value) => value && value.trim().length > 0);
  return cookie ?? null;
};

export const persistAuthToken = (token: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("entraverse_admin_token", token);
  window.sessionStorage.setItem("entraverse_admin_token", token);
  window.localStorage.setItem("token", token);
  window.localStorage.setItem("admin_token", token);
  window.sessionStorage.setItem("token", token);
  window.sessionStorage.setItem("admin_token", token);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearPersistedAuth = () => {
  if (typeof window === "undefined") return;
  TOKEN_KEYS.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
  delete api.defaults.headers.common.Authorization;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export const apiUpload = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api",
  timeout: 60000,
  headers: {
    Accept: "application/json",
    "Content-Type": "multipart/form-data",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NODE_ENV === "development") {
      const safeData = (() => {
        if (!config.data || typeof config.data !== "object") return config.data;
        const clone = { ...(config.data as Record<string, unknown>) };
        if (typeof clone.password === "string") clone.password = "***";
        return clone;
      })();
      console.debug(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: safeData,
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiUpload.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[API Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");
    const isAuthFlowRequest =
      requestUrl.includes("/v1/admin/login") ||
      requestUrl.includes("/sanctum/csrf-cookie");

    if (status === 401 && typeof window !== "undefined" && !isAuthFlowRequest) {
      clearPersistedAuth();
      const isOnLoginPage = window.location.pathname.startsWith("/auth/login");
      if (!isOnLoginPage) {
        const currentPath = window.location.pathname + window.location.search;
        const redirect = encodeURIComponent(currentPath);
        window.location.href = `/auth/login?redirect=${redirect}`;
      }
    }
    if (process.env.NODE_ENV === "development") {
      console.debug(`[API Error] ${status ?? "NO_STATUS"} ${requestUrl}`, error.response?.data);
    }
    return Promise.reject(error);
  }
);

apiUpload.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url ?? "");
    const isAuthFlowRequest =
      requestUrl.includes("/v1/admin/login") ||
      requestUrl.includes("/sanctum/csrf-cookie");

    if (status === 401 && typeof window !== "undefined" && !isAuthFlowRequest) {
      clearPersistedAuth();
      const isOnLoginPage = window.location.pathname.startsWith("/auth/login");
      if (!isOnLoginPage) {
        const currentPath = window.location.pathname + window.location.search;
        const redirect = encodeURIComponent(currentPath);
        window.location.href = `/auth/login?redirect=${redirect}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { isAxiosError };
