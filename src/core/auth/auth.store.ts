import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SessionUser } from './user';

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  isAuthenticated: boolean;

  setSession: (user: SessionUser, token: string) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setSession: (user, token) => set({ user, token, isAuthenticated: true }),
      clearSession: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'pango-auth' },
  ),
);
