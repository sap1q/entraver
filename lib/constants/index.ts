export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export const AUTH_ENDPOINTS = {
  login: "/v1/admin/login",
  register: "/v1/admin/register",
  logout: "/v1/admin/logout",
  profile: "/v1/admin/profile",
} as const;

export const TOKEN_KEY = "entraverse_admin_token";
export const USER_KEY = "entraverse_admin_user";