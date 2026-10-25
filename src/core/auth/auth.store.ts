import { create } from 'zustand';
import type { User as SessionUser } from './user';

/**
 * - `unknown`: app just loaded, the session cookie has not been checked yet (`GET /auth/me`).
 * - `authenticated` / `anonymous`: result of that check, of a login or of a logout.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';

interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;

  setSession: (user: SessionUser) => void;
  clearSession: () => void;
}

/**
 * Not persisted on purpose: the session lives in an httpOnly cookie that JS cannot read,
 * so the backend (`GET /auth/me`) is the only source of truth after a reload.
 */
export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: 'unknown',
  isAuthenticated: false,
  setSession: (user) => set({ user, status: 'authenticated', isAuthenticated: true }),
  clearSession: () => set({ user: null, status: 'anonymous', isAuthenticated: false }),
}));
