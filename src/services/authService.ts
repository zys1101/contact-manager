// src/services/authService.ts
import apiService from './api';
import { LoginRequest, LoginResponse, CurrentUser } from '../types';

export const AUTH_PATHS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  CURRENT: '/auth/current',
} as const;

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(AUTH_PATHS.LOGIN, data);
  }

  async logout(): Promise<void> {
    return apiService.post<void>(AUTH_PATHS.LOGOUT);
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(AUTH_PATHS.REFRESH, { refreshToken });
  }

  async getCurrentUser(): Promise<CurrentUser> {
    return apiService.get<CurrentUser>(AUTH_PATHS.CURRENT);
  }
}

export const authService = new AuthService();
