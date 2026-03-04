import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { getToken, removeStoredAdmin, removeToken } from "@/lib/utils/storage";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (process.env.NODE_ENV === "development") {
    const body = typeof config.data === "object" && config.data
      ? { ...config.data, password: config.data.password ? "***" : undefined }
      : config.data;
    console.debug(`[Client Request] ${config.method?.toUpperCase()} ${config.url}`, body);
  }

  return config;
});

client.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[Client Response] ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = String(error.config?.url ?? "");

    if (process.env.NODE_ENV === "development") {
      console.debug(`[Client Error] ${status ?? "NO_STATUS"} ${url}`, error.response?.data);
    }

    const isAuthRequest = url.includes("/v1/admin/login") || url.includes("/v1/admin/register");

    if (status === 401 && typeof window !== "undefined" && !isAuthRequest) {
      removeToken();
      removeStoredAdmin();
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/login?redirect=${next}`;
    }

    return Promise.reject(error);
  }
);

export default client;
