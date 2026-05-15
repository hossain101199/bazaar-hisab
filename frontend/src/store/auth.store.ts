import type { User } from "@/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
    }),
    {
      name: "bazaar-hisab-auth",
      // Only persist user profile — access token lives in memory only.
      // Session is restored on mount via the httpOnly refresh token cookie.
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export const selectIsAuthenticated = (s: AuthState) => s.token !== null;
export const selectIsAdmin = (s: AuthState) => s.user?.role === "ADMIN";
