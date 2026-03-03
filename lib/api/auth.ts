import client from "@/lib/api/client";
import { AUTH_ENDPOINTS } from "@/lib/constants";
import type { Admin, ApiResponse, AuthResponse, LoginCredentials, RegisterData } from "@/types/auth.types";

export const authApi = {
  async login(payload: LoginCredentials): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>(AUTH_ENDPOINTS.login, payload);
    return response.data;
  },

  async register(payload: RegisterData): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>(AUTH_ENDPOINTS.register, payload);
    return response.data;
  },

  async logout(): Promise<ApiResponse<null>> {
    const response = await client.post<ApiResponse<null>>(AUTH_ENDPOINTS.logout);
    return response.data;
  },

  async getProfile(): Promise<ApiResponse<Admin>> {
    const response = await client.get<ApiResponse<Admin>>(AUTH_ENDPOINTS.profile);
    return response.data;
  },

  async refreshToken(): Promise<ApiResponse<Admin>> {
    return this.getProfile();
  },
};