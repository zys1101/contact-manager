// src/types/user.ts

// 用户核心信息
export interface UserInfo {
  userId: string;
  username: string;
}

// 登录请求参数
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应 - 对齐后端 LoginVO
export interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

// 当前用户信息 - 对齐后端 CurrentUserVO
export interface CurrentUser {
  userId: string;
  username: string;
  createdAt: string;
  lastLoginAt: string | null;
}

// Zustand Store 状态
export interface UserState {
  user: UserInfo | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
