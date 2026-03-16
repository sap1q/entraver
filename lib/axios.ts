import axios, { isAxiosError } from "axios";
import { getToken, removeToken, setToken } from "@/lib/utils/storage";

const TOKEN_COOKIE_KEYS = ["entraverse_admin_token", "token", "admin_token"] as const;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
})();
const CSRF_COOKIE_ENDPOINT = `${API_ORIGIN}/sanctum/csrf-cookie`;
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);
const BEARER_TOKEN_API_PATTERNS = [
  "/v1/admin",
  "/v1/integrations/jurnal",
  "/user-addresses",
  "/user/addresses",
  "/shipping/cost",
  "/checkout/process",
  "/orders",
];

let csrfCookiePromise: Promise<void> | null = null;

const usesBearerToken = (url: string): boolean => {
  if (!url) return false;

  return BEARER_TOKEN_API_PATTERNS.some((pattern) => url.includes(pattern));
};

const ensureCsrfCookie = async () => {
  if (typeof window === "undefined") return;

  if (!csrfCookiePromise) {
    csrfCookiePromise = axios
      .get(CSRF_COOKIE_ENDPOINT, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
      })
      .then(() => undefined)
      .finally(() => {
        csrfCookiePromise = null;
      });
  }

  await csrfCookiePromise;
};

export const getAuthToken = (): string | null => {
  return getToken();
};

export const persistAuthToken = (token: string) => {
  setToken(token, true);
  api.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearPersistedAuth = () => {
  removeToken();

  if (typeof document !== "undefined") {
    TOKEN_COOKIE_KEYS.forEach((key) => {
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  }

  delete api.defaults.headers.common.Authorization;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export const apiUpload = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    Accept: "application/json",
    "Content-Type": "multipart/form-data",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use(
  async (config) => {
    const method = String(config.method ?? "get").toLowerCase();
    const requestUrl = String(config.url ?? "");
    if (MUTATING_METHODS.has(method) && !requestUrl.includes("/sanctum/csrf-cookie")) {
      await ensureCsrfCookie();
    }

    const token = getAuthToken();
    if (token && usesBearerToken(requestUrl)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
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
  async (config) => {
    const method = String(config.method ?? "get").toLowerCase();
    const requestUrl = String(config.url ?? "");
    if (MUTATING_METHODS.has(method) && !requestUrl.includes("/sanctum/csrf-cookie")) {
      await ensureCsrfCookie();
    }

    const token = getAuthToken();
    if (token && usesBearerToken(requestUrl)) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
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

    if (status === 401 && typeof window !== "undefined" && !isAuthFlowRequest && usesBearerToken(requestUrl)) {
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

    if (status === 401 && typeof window !== "undefined" && !isAuthFlowRequest && usesBearerToken(requestUrl)) {
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
