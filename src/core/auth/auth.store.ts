import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from './permissions';

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
