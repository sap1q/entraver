import axios, { isAxiosError, type AxiosError } from "axios";
import { TokenService } from "@/src/lib/auth/tokens";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return "http://127.0.0.1:8000";
  }
})();

const CSRF_COOKIE_ENDPOINT = `${API_ORIGIN}/sanctum/csrf-cookie`;
const CSRF_REFRESH_INTERVAL = 4 * 60 * 60 * 1000;
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
let csrfLastFetched = 0;

const usesBearerToken = (url: string): boolean => {
  if (!url) return false;
  return BEARER_TOKEN_API_PATTERNS.some((pattern) => url.includes(pattern));
};

const ensureCsrfCookie = async () => {
  if (typeof window === "undefined") return;

  const now = Date.now();
  if (csrfCookiePromise && (now - csrfLastFetched) < CSRF_REFRESH_INTERVAL) {
    return csrfCookiePromise;
  }

  csrfCookiePromise = axios
    .get(CSRF_COOKIE_ENDPOINT, {
      withCredentials: true,
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    })
    .then(() => {
      csrfLastFetched = now;
    })
    .catch((error: Error) => {
      console.warn("[CSRF] Failed to fetch CSRF cookie:", error.message);
      csrfCookiePromise = null;
      throw error;
    });

  return csrfCookiePromise;
};

export const getAuthToken = (): string | null => {
  return TokenService.hasValidToken() ? TokenService.getToken() : null;
};

export const api = axios.create({
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
    "X-Requested-With": "XMLHttpRequest",
  },
});

export const persistAuthToken = (
  token: string,
  rememberMe?: boolean,
  expiresIn?: number,
  refreshToken?: string | null
) => {
  if (typeof rememberMe === "boolean" || typeof expiresIn === "number" || refreshToken !== undefined) {
    TokenService.setToken(token, rememberMe ?? false, expiresIn, refreshToken);
  }

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
  apiUpload.defaults.headers.common.Authorization = `Bearer ${token}`;
};

export const clearPersistedAuth = () => {
  TokenService.logout();
  delete api.defaults.headers.common.Authorization;
  delete apiUpload.defaults.headers.common.Authorization;
};

const attachDefaultAuthorization = () => {
  const token = getAuthToken();
  if (!token) return;

  api.defaults.headers.common.Authorization = `Bearer ${token}`;
  apiUpload.defaults.headers.common.Authorization = `Bearer ${token}`;
};

attachDefaultAuthorization();

const handleUnauthorizedResponse = async (
  error: AxiosError,
  retryRequest: (requestConfig: Record<string, unknown>) => Promise<unknown>
) => {
  const status = error.response?.status;
  const requestUrl = String(error.config?.url ?? "");
  const isAuthFlowRequest =
    requestUrl.includes("/v1/admin/login") ||
    requestUrl.includes("/v1/admin/register") ||
    requestUrl.includes("/sanctum/csrf-cookie");

  if (status === 401 && !isAuthFlowRequest && usesBearerToken(requestUrl)) {
    const originalRequest = (error.config ?? {}) as Record<string, unknown> & {
      _retry?: boolean;
      headers?: Record<string, string>;
    };

    if (!originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await TokenService.refreshToken();

      if (newToken) {
        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return retryRequest(originalRequest);
      }
    }

    clearPersistedAuth();
    if (typeof window !== "undefined") {
      const isOnLoginPage = window.location.pathname.startsWith("/auth/login");
      if (!isOnLoginPage) {
        const currentPath = window.location.pathname + window.location.search;
        const redirect = encodeURIComponent(currentPath);
        window.location.href = `/auth/login?redirect=${redirect}`;
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.debug(`[API Error] ${status ?? "NO_STATUS"} ${requestUrl}`, error.response?.data);
  }

  return Promise.reject(error);
};

api.interceptors.request.use(
  async (config) => {
    const method = String(config.method ?? "get").toLowerCase();
    const requestUrl = String(config.url ?? "");

    if (["post", "put", "patch", "delete"].includes(method) && !requestUrl.includes("/sanctum/csrf-cookie")) {
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

    if (["post", "put", "patch", "delete"].includes(method) && !requestUrl.includes("/sanctum/csrf-cookie")) {
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
  (error: AxiosError) => handleUnauthorizedResponse(error, (requestConfig) => api(requestConfig))
);

apiUpload.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => handleUnauthorizedResponse(error, (requestConfig) => apiUpload(requestConfig))
);

export default api;
export { isAxiosError };
