import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SessionUser } from '@/core/auth/user';

interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;

  //Actions
  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user) => set({ user, isAuthenticated: true }),
      clearSession: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'pango-auth' },
  ),
);
