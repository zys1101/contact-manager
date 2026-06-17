// src/store/index.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserInfo, UserState } from '../types';

interface AuthActions {
  setUser: (user: UserInfo) => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: UserInfo, token: string, refreshToken: string) => void;
  logout: () => void;
}

type AuthStore = UserState & AuthActions;

const INITIAL_STATE: UserState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      setUser: (user) => set({ user, isAuthenticated: true }),

      setToken: (token) => set({ token }),

      setRefreshToken: (refreshToken) => set({ refreshToken }),

      setLoading: (isLoading) => set({ isLoading }),

      login: (user, token, refreshToken) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

// 保持向后兼容的具名导出
export { useAuthStore as default };
